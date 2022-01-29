import formatRevisionInfo from "./formatRevisionInfo";
import { pathOr } from "ramda";
const ERROR_VERIFICATION_STATUS = "ERROR";
const INVALID_VERIFICATION_STATUS = "INVALID";
import { formatDBTimestamp } from "./helpers";
import type { Signature, Witness } from "../../types";
import { resolveNameByAddress } from "../../name_resolver";

export type RevisionProps = {
  id: number;
  url: string;
  time: string;
  domainId: number; // date
  isVerified: boolean;
  witnessDetail: string;
  witness: Witness;
  signature: Signature;
};

type RevisionsData = {
  formatStatus?: string;
  count: number;
  revisions: RevisionProps[];
};

const parseWitness = async (witnessData: Witness) => {
  const {
    smart_contract_address,
    witness_event_transaction_hash,
    sender_account_address,
  } = witnessData;

  const parsed = {
    ...witnessData,
    smart_contract_address: await resolveNameByAddress(smart_contract_address),
    witness_event_transaction_hash: await resolveNameByAddress(
      witness_event_transaction_hash
    ),
    sender_account_address: await resolveNameByAddress(sender_account_address),
  };

  return parsed;
};
const parseSignature = async (signatureData: Signature) => {
  const parsed = {
    signature: await resolveNameByAddress(signatureData.signature),
    public_key: await resolveNameByAddress(signatureData.public_key),
    wallet_address: await resolveNameByAddress(signatureData.wallet_address),
    signature_hash: await resolveNameByAddress(signatureData.signature_hash),
  };

  return parsed;
};

const formatPageInfo = async (
  serverUrl: string,
  title: string,
  status: string,
  details: any
): Promise<RevisionsData> => {
  let formatStatus;
  if (status === "NORECORD") {
    formatStatus = "No revision record";
  } else if (status === "N/A" || !details) {
    formatStatus = "";
  } else if (status === ERROR_VERIFICATION_STATUS) {
    if (details && "error" in details) {
      formatStatus = `ERROR: ${details.error}`;
    }
    formatStatus = "ERROR: Unknown cause";
  }

  const numRevisions = details.verification_hashes.length;

  let revisions = await Promise.all(
    details.revision_details.map(async (revisionDetail: any): Promise<any> => {
      formatStatus = "Success";
      const { data, status, witness_detail } = await revisionDetail;
      const { rev_id } = data.content;

      const timestamp = pathOr(null, ["metadata", "time_stamp"], data);
      const domainId = pathOr(null, ["metadata", "domain_id"], data);
      const verification = pathOr(null, ["verification"], status);
      const witness = pathOr(null, ["witness"], data);
      const signature = pathOr(null, ["signature"], data);
      const witnessDetail = witness_detail;

      return {
        id: rev_id,
        url: `${serverUrl}/index.php?title=${title}&oldid=${rev_id}`,
        time: formatDBTimestamp(timestamp),
        domainId: parseInt(domainId!),
        isVerified: verification === "VERIFIED" ? true : false,
        witnessDetail,
        witness: witness && (await parseWitness(witness)),
        signature: signature && (await parseSignature(signature)),
      };
    })
  );
  console.log({ revisions });

  let data;
  data = {
    formatStatus,
    count: numRevisions,
    revisions: revisions,
  };

  return data;
};

export default formatPageInfo;
