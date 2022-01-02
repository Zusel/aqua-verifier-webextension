import * as http from "http";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Clipboard from "clipboard";

import {
  verifyPage,
  extractPageTitle,
  BadgeColorNA,
  BadgeColorBlue,
  getUrlObj,
  sanitizeWikiUrl,
  verificationStatusMap,
} from "./verifier";
// Not yet typed
// @ts-ignore
import { verifyPage as externalVerifierVerifyPage, formatPageInfo2HTML } from "data-accounting-external-verifier";

const clipboard = new Clipboard(".clipboard-button");

const OfflineVerification = () => {
  const [pageTitle, setPageTitle] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [currentURL, setCurrentURL] = useState<string>();
  const [verificationLog, setVerificationLog] = useState("");

  function prepareAndSetVerificationStatus(
    status: string
  ) {
    const somethingBadHappened =
      '<div style="color: Black; font-size: larger;">Unknown error</div> Unexpected badge status: ' +
      status;
    const verificationStatusMessage =
      verificationStatusMap[status] || somethingBadHappened;
    setVerificationStatus(verificationStatusMessage);
  }

  function formatDetailsAndSetVerificationLog(data: { [key: string]: any }) {
    const verbose = false;
    const out = formatPageInfo2HTML(
      data.serverUrl,
      data.title,
      data.status,
      data.details,
      verbose
    );
    setVerificationLog(out);
  }

  function setPopupInfo(status: string, data: { [key: string]: any }) {
    setPageTitle(data.title);
    prepareAndSetVerificationStatus(status);
    formatDetailsAndSetVerificationLog(data);
  }

  function offlineVerifyPage() {
    const filesElements = document.getElementById("file") as HTMLInputElement;
    if (!(filesElements && filesElements.files && filesElements.files[0])) {
    }
    const file = filesElements.files![0];
    const reader = new FileReader();
    reader.onload = async function(e) {
      if (!(e && e.target && e.target.result)) {
        return;
      }
      const verbose = false;
      const doVerifyMerkleProof = true;
      const offline_data = JSON.parse(e.target.result as string);
      const [verificationStatus, details] = await externalVerifierVerifyPage(
        {offline_data},
        verbose,
        doVerifyMerkleProof,
        null
      );
      const title = offline_data.title;
      const serverUrl = "http://offline_verify_page"
      const verificationData = {
        serverUrl,
        title,
        status: verificationStatus,
        details: details,
      };
      setPopupInfo(verificationStatus, verificationData);
    }
    reader.readAsText(file);
  }

  return (
    <>
      <div style={{ fontSize: "larger" }}>
        <button
          onClick={offlineVerifyPage}
          style={{ float: "right" }}
        >
          Verify File
        </button>
        <input
          type="file"
          id="file"
          style={{ float: "right" }}
        />
        <div dangerouslySetInnerHTML={{ __html: verificationStatus }}></div>
        <ul style={{ minWidth: "700px" }}>
          <li>
            {pageTitle ? "Current Page Title: " + pageTitle : "Select a PKC export JSON file"}
          </li>
        </ul>
        <div dangerouslySetInnerHTML={{ __html: verificationLog }}></div>
      </div>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <OfflineVerification />
  </React.StrictMode>,
  document.getElementById("root")
);
