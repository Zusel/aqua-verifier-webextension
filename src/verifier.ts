import * as http from "http";
import * as https from "https";
// Not yet typed
// @ts-ignore
import { verifyPage as externalVerifierVerifyPage, formatRevisionInfo2HTML } from "data-accounting-external-verifier";

export const BadgeTextNA = 'N/A';
// Dark gray custom picked
export const BadgeColorNA = '#ABABAD';
export const BadgeTextNORECORD = 'NR';
// Color taken from https://www.schemecolor.com/easy-to-use-colors.php
// Blueberry
export const BadgeColorBlue = '#427FED';

function isEmpty(obj: any) {
  return Object.keys(obj).length === 0;
}

function adaptiveGet(url: string) {
  return url.startsWith('https://') ? https.get : http.get
}

export function getUrlObj(tab: any) {
  return tab.url ? new URL(tab.url): null;
}

export function extractPageTitle(urlObj: URL | null) {
  // If you update this function, make sure to sync with the same function in
  // the DataAccounting repo, in
  // modules/ext.DataAccounting.signMessage/index.js.
  if (!urlObj) {
    return '';
  }
  if (!urlObj.pathname.startsWith('/index.php/')) {
    return '';
  }
  // The first 11 chars are '/index.php/', which we skip.
  const titleUrlform = urlObj.pathname.slice(11);
  if (!titleUrlform) {
    return '';
  }
  // Convert from Mediawiki url title to page title.
  // See https://www.mediawiki.org/wiki/Manual:PAGENAMEE_encoding
  // If you look at the source code of MediaWiki, in the file Title.php, in the method `makeTitle`, you will notice that there are multiple representations of a page title:
  // - mTextform: text form with spaces
  // - mDbkeyform: text form with underscores
  // - mUrlform: url encoded text form with underscores
  // We weant to return the mTextform.
  const titleDbkeyform = decodeURIComponent(titleUrlform);
  return titleDbkeyform.replace(/_/g, ' ');
}

export function setBadgeStatus(tabId: number, status: string) {
  let badgeColor, badgeText;
  if (status === 'VERIFIED') {
    // From https://www.schemecolor.com/easy-to-use-colors.php
    // Apple
    // (actually it is greenish in color, not red)
    badgeColor = '#65B045';
    badgeText = 'DA';
  } else if (status === 'INVALID') {
    // From https://www.schemecolor.com/no-news-is-good.php
    // Fire Engine Red
    badgeColor = '#FF0018';
    badgeText = 'DA';
  } else if (status === 'NORECORD') {
    badgeColor = BadgeColorBlue;
    badgeText = 'NR';
  } else {
    console.log(`UGH!!! ${status}`)
    // Something wrong is happening
    badgeColor = 'black';
    badgeText = '??';
  }
  chrome.action.setBadgeBackgroundColor({tabId: tabId, color: badgeColor});
  chrome.action.setBadgeText({tabId: tabId, text: badgeText });
}

export function setBadgeNA(tabId: number) {
  chrome.action.setBadgeBackgroundColor({tabId: tabId, color: BadgeColorNA});
  chrome.action.setBadgeText({ tabId: tabId, text: BadgeTextNA });
}

export function setBadgeNORECORD(tabId: number) {
  chrome.action.setBadgeBackgroundColor({tabId: tabId, color: BadgeColorBlue});
  chrome.action.setBadgeText({ tabId: tabId, text: BadgeTextNORECORD });
}


export function getDAMeta(tabId: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: {tabId: tabId},
        func: () => {
          const DAMeta = document.querySelector('meta[name="data-accounting-mediawiki"]');
          if (DAMeta && DAMeta instanceof HTMLMetaElement) {
            return DAMeta.content;
          } else {
            return null;
          }
        },
      },
      (injectionResults) => {
        const result = injectionResults[0].result;
        resolve(result === 'null' ? null : result);
      }
    );
  });
}

export async function setInitialBadge(tabId: number, serverUrl: string, pageTitle: string) {
  const urlForChecking = `${serverUrl}/rest.php/data_accounting/v1/standard/get_page_last_rev?var1=${pageTitle}`;
  const promise = new Promise((resolve, reject) => {
    adaptiveGet(urlForChecking)(urlForChecking, (response) => {
      response.on('data', (data) => {
        const respText = data.toString();
        let badgeText, badgeColor;
        if (respText != "{}") {
          badgeText = "DA";
        } else {
          badgeText = BadgeTextNORECORD;
        }
        badgeColor = BadgeColorBlue;
        chrome.action.setBadgeBackgroundColor({tabId: tabId, color: badgeColor});
        chrome.action.setBadgeText({tabId: tabId, text: badgeText });
        console.log("setInitialBadge", badgeText);
        resolve(badgeText);
      });
      response.on('error', (e) => reject('ERROR'));
    });
  });
  return promise;
}

function logPageInfo(serverUrl: string, title:string, status: string, details: {verified_ids: string[], revision_details: object[]} | null, callback: Function) {
  if (status === 'NORECORD') {
    callback('No revision record');
    return;
  }
  if (status === 'N/A' || !details) {
    callback('');
    return;
  }
  const verbose = false;
  const _space2 = '&nbsp&nbsp';
  let out = "";
  out += `Number of Verified Page Revisions: ${details.verified_ids.length}<br>`;
  for (let i = 0; i < details.revision_details.length; i++) {
    if (i % 2 == 0) {
      out += '<div style="background: LightCyan;">'
    } else {
      out += '<div>'
    }
    const revid = details.verified_ids[i]
    const revidURL = `${serverUrl}/index.php?title=${title}&oldid=${revid}`
    out += `${i + 1}. Verification of <a href='${revidURL}' target="_blank">Revision ID ${revid}<a>.<br>`;
    out += formatRevisionInfo2HTML(serverUrl, details.revision_details[i], verbose);
    const count = i + 1;
    out += `${_space2}Progress: ${count} / ${details.verified_ids.length} (${(100 * count / details.verified_ids.length).toFixed(1)}%)<br>`;
    out += '</div>'
  };
  callback(out);
}

export function verifyPage(title: string, callback: Function | null = null) {
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    const tab = tabs[0];
    let verificationStatus = "N/A";
    let details: { verified_ids: string[]; revision_details: any[]; } | null = null;
    let serverUrl: string | null = "N/A";
    if (tab.id) {
      chrome.action.setBadgeText({tabId: tab.id, text: '⏳' });
      const verbose = false;
      serverUrl = await getDAMeta(tab.id);
      if (!serverUrl) {
        chrome.action.setBadgeText({tabId: tab.id, text: 'NR' });
        return;
      }
      [verificationStatus, details] = await externalVerifierVerifyPage(title, serverUrl, verbose, false);
      setBadgeStatus(tab.id, verificationStatus)
      if (tab.url) {
        const sanitizedUrl = tab.url.split('?')[0];
        // Update cookie
        chrome.cookies.set({url: sanitizedUrl, name: title, value: verificationStatus});
        // Cache verification detail in local storage
        logPageInfo(serverUrl, title, verificationStatus, details, (info: string) => {
          chrome.storage.local.set(
            {[sanitizedUrl]: info}
          );
          // Also store the last verification hash and rev id
          // We use this info to check if the page has been updated since we
          // last verify it. If so, we rerun the verification process
          // automatically.
          if (!details || !details.revision_details || details.revision_details.length === 0) {
            return;
          }
          const lastDetail = details.revision_details[details.revision_details.length - 1];
          const HashId = {
            rev_id: lastDetail.rev_id,
            verification_hash: lastDetail.verification_hash,
          };
          chrome.storage.local.set(
            {["verification_hash_id_" + sanitizedUrl]: JSON.stringify(HashId)}
          );
        })
      }
    }
    if (callback) {
      logPageInfo(serverUrl, title, verificationStatus, details, callback);
    }
    return;
  });
}

export async function checkIfCacheIsUpToDate(tabId: number, pageTitle: string, sanitizedUrl: string, callback: Function) {
  // Check if our stored verification info is outdated
  const serverUrl = await getDAMeta(tabId);
  if (!serverUrl) {
    // This execution branch shouldn't happen. If it happens, then don't update
    // cache since the page is not a data accounting page anyway.
    callback(true);
  }
  const urlForChecking = `${serverUrl}/rest.php/data_accounting/v1/standard/get_page_last_rev?var1=${pageTitle}`;
  adaptiveGet(urlForChecking)(urlForChecking, (response) => {
      response.on('data', (data) => {
        const actual = JSON.parse(data);
        const key = "verification_hash_id_" + sanitizedUrl
        chrome.storage.local.get(key, (d) => {
          let isUpToDate = false;
          if (d[key]) {
            const expected = JSON.parse(d[key]);
            isUpToDate = (expected.rev_id === actual.rev_id) && (expected.verification_hash === actual.verification_hash);
            if (isEmpty(actual)) {
              // This is a corner case.
              // If the actual page has the verification info removed, but the
              // local storage has the old version with non empty verification
              // remove, we then remove it from local storage.
              chrome.storage.local.remove(sanitizedUrl, () => {
                chrome.storage.local.remove(key, () => {
                  callback(isUpToDate)
                })
              })
            } else {
              callback(isUpToDate)
            }
          } else {
            callback(isUpToDate)
          }
        });
      });
      response.on('error', (e) => {throw e});
  });
}
