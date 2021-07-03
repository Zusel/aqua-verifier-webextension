#!/usr/bin/env node

const http = require( 'http' )
const sha3 = require('js-sha3')

// utilities for verifying signatures
const ethers = require('ethers')

const DEBUG = false

function formatMwTimestamp(ts: string) {
  // Format timestamp into the timestamp format found in Mediawiki outputs
  return ts.replace(/-/g, '').replace(/:/g, '').replace('T', '').replace('Z', '')
}

function getHashSum(content: any) {
  return sha3.sha3_512(content)
}

function calculateVerificationHash(contentHash: string, metadataHash: string) {
  return getHashSum(contentHash + metadataHash)
}

function calculateMetadataHash(timestamp: string, previousVerificationHash = "", signature = "", publicKey = "") {
	return getHashSum(timestamp + previousVerificationHash + signature + publicKey)
}

async function getBackendVerificationHash(revid: string) {
  http.get(`http://localhost:9352/rest.php/data_accounting/v1/request_hash?var1=${revid}`, (resp: any) => {
    resp.on('data', (data: any) => {
      const obj = JSON.parse(data.toString()).value
    })
  })
}

async function verifyRevision(revid: string, prevRevId: string, previousVerificationHash: string, contentHash: string) {
  const data = await synchronousGet(`http://localhost:9352/rest.php/data_accounting/v1/standard/verify_page?var1=${revid}`) as string
  if (data === '[]') {
    console.log('  no verification hash')
    return [null, false]
  }
  let obj = JSON.parse(data)

  if (obj.signature === '') {
    console.log('  no signature')
  }

  let metadataHash = null
  if (prevRevId === '') {
    metadataHash = calculateMetadataHash(obj.time_stamp, previousVerificationHash, '', '')
  } else {
    const dataPrevious = await synchronousGet(`http://localhost:9352/rest.php/data_accounting/v1/standard/verify_page?var1=${prevRevId}`) as string
    const objPrevious = JSON.parse(dataPrevious)
    // TODO just use signature and public key from previous element in the loop inside verifyPage
    // We have to do these ternary operations because sometimes the signature
    // and public key are nulls, not empty strings.
    const signature = !!objPrevious.signature ? objPrevious.signature: ''
    const publicKey = !!objPrevious.public_key ? objPrevious.public_key: ''
    metadataHash = calculateMetadataHash(obj.time_stamp, previousVerificationHash, signature, publicKey)
  }

  const calculatedVerificationHash = calculateVerificationHash(contentHash, metadataHash)

  if (calculatedVerificationHash !== obj.verification_hash) {
    console.log("  verification hash doesn't match")
    return [null, false]
  } else {
    console.log('  Verification hash matches')
  }

  if (obj.signature === '' || obj.signature === null) {
    return [obj.verification_hash, true]
  }

  if (DEBUG) {
    console.log('DEBUG backend', revid, obj)
  }
  // The padded message is required
  const paddedMessage = 'I sign the following page verification_hash: [0x' + obj.verification_hash + ']'
  const recoveredAddress = ethers.utils.recoverAddress(ethers.utils.hashMessage(paddedMessage), obj.signature)
  if (recoveredAddress.toLowerCase() === obj.wallet_address.toLowerCase()) {
    console.log('  signature is valid')
  }
  return [obj.verification_hash, true]
}

async function synchronousGet(url: string) {
  try {
    const http_promise = new Promise((resolve, reject) => {
      http.get(url, (response: any) => {
        let chunks_of_data: any[] = [];

        response.on('data', (fragments: any) => {
          chunks_of_data.push(fragments);
        });

        response.on('end', () => {
          let response_body = Buffer.concat(chunks_of_data);

          // promise resolved on success
          resolve(response_body.toString())
        });

        response.on('error', (error: any) => {
          // promise rejected on error
          reject(error)
        });
      });
    });
    return await http_promise;
  }
	catch(e) {
		// if the Promise is rejected
		console.error(e)
	}
}

function verifyPage(title: string) {
  http.get(`http://localhost:9352/rest.php/data_accounting/v1/standard/page_all_rev?var1=${title}`, (resp: any) => {
    let body = ""
    resp.on('data', (chunk: any) => {
      body += chunk
    })
    resp.on('end', async () => {
      const allRevInfo = JSON.parse(body)
      const verifiedRevIds = allRevInfo.map((x: any) => x.rev_id)
      console.log('verified ids', verifiedRevIds)

      let previousVerificationHash = ''
      let previousRevId = ''
      let count = 0
      for (const idx in verifiedRevIds) {
        const revid = verifiedRevIds[idx]
        console.log(revid)
        const bodyRevid = await synchronousGet(`http://localhost:9352/api.php?action=parse&oldid=${revid}&prop=wikitext&formatversion=2&format=json`) as string
        const content = JSON.parse(bodyRevid).parse.wikitext
        const contentHash = getHashSum(content)
        const [verificationHash, isCorrect] = await verifyRevision(revid, previousRevId, previousVerificationHash, contentHash)
        if (isCorrect) {
          count += 1
        }
        console.log(`  ${(100 * count / verifiedRevIds.length).toFixed(1)}% page validation`)
        previousVerificationHash = verificationHash
        previousRevId = revid
      }
    })
  }).on("error", (err: any) => {
    console.log("Error: " + err.message);
  })
}

export function verifier(title: string) {
  return verifyPage(title)
}