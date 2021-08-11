import * as http from "http";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
// Not yet typed
// @ts-ignore
import { verifyPage as externalVerifierVerifyPage } from "data-accounting-external-verifier";

const apiURL = 'http://localhost:9352/rest.php/data_accounting/v1/standard';

const Popup = () => {
  const [pageTitle, setPageTitle] = useState('');
  const [currentURL, setCurrentURL] = useState<string>();

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      setCurrentURL(tabs[0].url);
      const urlObj = new URL(tabs[0].url || '');
      const extractedPageTitle = urlObj.pathname.split('/').pop() || '';
      setPageTitle(extractedPageTitle);
      //setBadge(urlObj);
    });
  }, []);

  const verifyPage = (title: string) => {
    // todo call verifier here then send result to tab for rendering
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const tab = tabs[0];
      if (tab.id) {
        const verificationStatus = await externalVerifierVerifyPage(title);
        chrome.tabs.sendMessage(
          tab.id as number,
          {
            pageTitle: verificationStatus,
          },
          (msg: string) => {
            console.log("result message:", msg);
          }
        );
      }
    });
  };
  
  return (
    <>
      <ul style={{ minWidth: "700px" }}>
        <li>Current Page Title: {pageTitle}</li>
      </ul>
      </button>
      <button
        onClick={() => verifyPage(pageTitle)}
        style={{ marginRight: "5px" }}
      >
        Verify Page
      </button>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
