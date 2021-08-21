import * as http from "http";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import { verifyPage, extractPageTitle, BadgeColorNA, BadgeColorBlue, getUrlObj } from "./verifier";

const apiURL = 'http://localhost:9352/rest.php/data_accounting/v1/standard';

// TODO this is totally not idiomatic.
const verificationStatusMap: { [key: string]: string } = {
  // See the color in verifier.ts
  // Apple
  'VERIFIED': '<div style="color: #65B045; font-size: larger;">Page integrity validated</div> Information on this page has not been tampered with.',
  // Fire Engine Red
  'INVALID': '<div style="color: #FF0018; font-size: larger;">Page integrity verification failed</div> Information on this page can\'t be trusted.',
  'NORECORD': '<div style="color: ' + BadgeColorBlue + '; font-size: larger;">Data accounting supported but no record available</div> Information on this page might have been tampered.',
  'N/A': '<div style="color: ' + BadgeColorNA + '; font-size: larger;">No record available</div> Information on this page might have been tampered.',
}

const Popup = () => {
  const [pageTitle, setPageTitle] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [currentURL, setCurrentURL] = useState<string>();
  const [verificationLog, setVerificationLog] = useState('');

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      setCurrentURL(tab.url);
      if (!tab.url) {
        return;
      }

      const urlObj = getUrlObj(tab);
      const extractedPageTitle = extractPageTitle(urlObj);
      if (!extractedPageTitle) {
        return;
      }
      setPageTitle(extractedPageTitle);
      chrome.cookies.get({url: tab.url, name: extractedPageTitle}, (cookie: any) => {
        const badgeStatus = cookie.value.toString() || '';
        const somethingBadHappened = '<div style="color: Black; font-size: larger;">Unknown error</div> Unexpected badge status: ' + badgeStatus;
        const verificationStatusMessage = verificationStatusMap[badgeStatus] || somethingBadHappened;
        setVerificationStatus(verificationStatusMessage);
      });
    });
  }, []);

  return (
    <>
      <div style={{ fontSize: "larger" }}>
        <div dangerouslySetInnerHTML={{ __html: verificationStatus}}>
        </div>
        <ul style={{ minWidth: "700px" }}>
          <li>Current Page Title: {pageTitle}</li>
        </ul>
        <button
          onClick={() => verifyPage(pageTitle, setVerificationLog)}
          style={{ marginRight: "5px" }}
        >
          Verify Page
        </button>
        <br/>
        <div dangerouslySetInnerHTML={{ __html: verificationLog}}>
        </div>
      </div>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
