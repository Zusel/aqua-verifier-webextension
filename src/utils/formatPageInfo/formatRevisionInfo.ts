import {
  formatDBTimestamp,
  clipboardifyHash,
  htmlRedify,
  htmlDimify,
} from "data-accounting-external-verifier";

// const Reset = "\x1b[0m";
// const Dim = "\x1b[2m";
// const FgRed = "\x1b[31m";
// const FgYellow = "\x1b[33m";
// const FgWhite = "\x1b[37m";
// const BgGreen = "\x1b[42m";
const WARN = "⚠️";
const CROSSMARK = "❌";
const CHECKMARK = "✅";
const LOCKED_WITH_PEN = "🔏";
const WATCH = "⌚";
// const BRANCH = "🌿";
const FILE_GLYPH = "📄";

// Verification status
const INVALID_VERIFICATION_STATUS = "INVALID";
// const VERIFIED_VERIFICATION_STATUS = "VERIFIED";

function formatRevisionInfo(
  server: string,
  //@ts-ignore
  detail: any,
  verbose = false
) {
  // Format the info into HTML nicely. Used in VerifyPage Chrome extension, but
  // could be used elsewhere too.
  const _space = "&nbsp";
  const _space2 = _space + _space;
  const _space4 = _space2 + _space2;
  if ("error_message" in detail) {
    return _space2 + detail.error_message;
  }
  if (!("verification_hash" in detail)) {
    return `${_space2}no verification hash`;
  }

  let summary = "";
  function makeDetail(detail: any) {
    return `<details>${detail}</details>`;
  }

  let out = `${_space2}Elapsed: ${detail.elapsed} s<br>`;
  out += `${_space2}${formatDBTimestamp(detail.data.metadata.time_stamp)}<br>`;
  out += `${_space2}Domain ID: ${detail.data.metadata.domain_id}<br>`;
  if (detail.status.verification === INVALID_VERIFICATION_STATUS) {
    out += htmlRedify(
      `${_space2}${CROSSMARK}` + " verification hash doesn't match"
    );
    return [CROSSMARK, makeDetail(out)];
  }
  out += `${_space2}${CHECKMARK} Verification hash matches<br>`;
  summary += CHECKMARK;

  if (detail.status.file === "VERIFIED") {
    // The alternative value of detail.status.file is "MISSING", where we don't
    // log anything extra in that situation.
    out += `${_space4}${CHECKMARK}${FILE_GLYPH} File content hash matches (${clipboardifyHash(
      detail.file_hash
    )})<br>`;
    summary += FILE_GLYPH;
  } else if (detail.status.file === "INVALID") {
    out += `${_space4}${CROSSMARK}${FILE_GLYPH} Invalid file content hash<br>`;
    summary += FILE_GLYPH;
  }

  if (detail.status.witness !== "MISSING") {
    out += detail.witness_detail + "<br>";
    summary += WATCH;
  } else {
    out += htmlDimify(`${_space4}${WARN} Not witnessed<br>`);
  }
  if (verbose) {
    delete detail.witness_detail;
    out += `${_space2}VERBOSE backend ` + JSON.stringify(detail) + "<br>";
  }
  if (detail.status.signature === "MISSING") {
    out += htmlDimify(`${_space4}${WARN} Not signed<br>`);
    return [summary, makeDetail(out)];
  }
  summary += LOCKED_WITH_PEN;
  if (detail.status.signature === "VALID") {
    const walletURL = `${server}/index.php/User:${detail.data.signature.wallet_address}`;
    const walletA = `<a href="${walletURL}" target="_blank">${detail.data.signature.wallet_address}</a>`;
    out += `${_space4}${CHECKMARK}${LOCKED_WITH_PEN} Valid signature from wallet: ${walletA}<br>`;
  } else {
    out += htmlRedify(
      `${_space4}${CROSSMARK}${LOCKED_WITH_PEN} Invalid signature`
    );
  }
  return [summary, makeDetail(out)];
}

export default formatRevisionInfo;
