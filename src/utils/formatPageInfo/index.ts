import formatRevisionInfo from "./formatRevisionInfo";
import { pathOr } from "ramda";
const ERROR_VERIFICATION_STATUS = "ERROR";
const INVALID_VERIFICATION_STATUS = "INVALID";
import { formatDBTimestamp } from "./helpers";

export type RevisionProps = {
  id: number;
  url: string;
  time: string;
  domainId: number; // date
  isVerified: boolean;
};

type RevisionsData = {
  count: number;
  revisions: RevisionProps[];
};

const formatPageInfo = (
  serverUrl: string,
  title: string,
  status: string,
  //@ts-ignore
  details: any,
  verbose: boolean
): RevisionsData | string => {
  if (status === "NORECORD") {
    return "No revision record";
  } else if (status === "N/A" || !details) {
    return "";
  } else if (status === ERROR_VERIFICATION_STATUS) {
    if (details && "error" in details) {
      return "ERROR: " + details.error;
    }
    return "ERROR: Unknown cause";
  }

  const numRevisions = details.verification_hashes.length;

  let revisions = details.revision_details.map((revisionDetail: any) => {
    const { data, status } = revisionDetail;
    const { rev_id } = data.content;

    const timestamp = pathOr(null, ["metadata", "time_stamp"], data);
    const domainId = pathOr(null, ["metadata", "domain_id"], data);
    const verification = pathOr(null, ["verification"], status);
    return {
      id: rev_id,
      url: `${serverUrl}/index.php?title=${title}&oldid=${rev_id}`,
      time: formatDBTimestamp(timestamp),
      domainId: parseInt(domainId!),
      isVerified: verification === "VERIFIED" ? true : false,
    };
  });

  let data;
  data = {
    count: numRevisions,
    revisions,
  };

  console.log("format data", { data });
  return data;

  // for (let i = 0; i < details.revision_details.length; i++) {
  //   let revisionOut = "";
  //   if (i % 2 == 0) {
  //     revisionOut += '<div style="background: LightCyan;">';
  //   } else {
  //     revisionOut += "<div>";
  //   }
  //   console.log({ revisionOut });
  //   const revid = details.revision_details[i].data.content.rev_id;
  //   const revidURL = `${serverUrl}/index.php?title=${title}&oldid=${revid}`;
  //   const [summary, formattedRevInfo] = formatRevisionInfo(
  //     serverUrl,
  //     details.revision_details[i],
  //     verbose
  //   );
  //   revisionOut += `${
  //     i + 1
  //   }. Verification of <a href='${revidURL}' target="_blank">Revision ID ${revid}<a>.${summary}<br>`;
  //   revisionOut += formattedRevInfo;
  //   const count = i + 1;
  //   revisionOut += `${_space2}Progress: ${count} / ${numRevisions} (${(
  //     (100 * count) /
  //     numRevisions
  //   ).toFixed(1)}%)<br>`;
  //   revisionOut += "</div>";
  //   // We order the output by the most recent revision shown first.
  //   out = revisionOut + out;
  //   console.log({ out });
  // }
  // finalOutput += out;

  // console.log("finalOutput", finalOutput);
  // return {
  //   numRevisions,
  // };
};

export default formatPageInfo;
