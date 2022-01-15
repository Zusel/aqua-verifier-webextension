import formatRevisionInfo from "./formatRevisionInfo";

const ERROR_VERIFICATION_STATUS = "ERROR";

function formatPageInfo(
  serverUrl: string,
  title: string,
  status: string,
  //@ts-ignore
  details: any,
  verbose: boolean
) {
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
  const _space2 = "&nbsp&nbsp";
  const numRevisions = details.verification_hashes.length;
  let finalOutput = `Number of Verified Page Revisions: ${numRevisions}<br>`;
  let out = "";
  for (let i = 0; i < details.revision_details.length; i++) {
    let revisionOut = "";
    if (i % 2 == 0) {
      revisionOut += '<div style="background: LightCyan;">';
    } else {
      revisionOut += "<div>";
    }
    const revid = details.revision_details[i].data.content.rev_id;
    const revidURL = `${serverUrl}/index.php?title=${title}&oldid=${revid}`;
    const [summary, formattedRevInfo] = formatRevisionInfo(
      serverUrl,
      details.revision_details[i],
      verbose
    );
    revisionOut += `${
      i + 1
    }. Verification of <a href='${revidURL}' target="_blank">Revision ID ${revid}<a>.${summary}<br>`;
    revisionOut += formattedRevInfo;
    const count = i + 1;
    revisionOut += `${_space2}Progress: ${count} / ${numRevisions} (${(
      (100 * count) /
      numRevisions
    ).toFixed(1)}%)<br>`;
    revisionOut += "</div>";
    // We order the output by the most recent revision shown first.
    out = revisionOut + out;
  }
  finalOutput += out;
  return finalOutput;
}

export default formatPageInfo;
