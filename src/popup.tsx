import * as http from "http"; 
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { verifier } from "./verifier";

const Popup = () => {
  const [count, setCount] = useState(0);
  const [pageTitle, setPageTitle] = useState('');
  const [currentURL, setCurrentURL] = useState<string>();

  useEffect(() => {
    chrome.browserAction.setBadgeText({ text: count.toString() });
  }, [count]);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      setCurrentURL(tabs[0].url);
    });
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const urlObj = new URL(tabs[0].url || '');
      const extractedPageTitle = urlObj.pathname.split('/').pop() || '';
      setPageTitle(extractedPageTitle);
    });
  }, []);

  const changeBackground = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            color: "#555555",
          },
          (msg) => {
            console.log("result message:", msg);
          }
        );
      }
    });
  };

  const verifyPage = (title: string) => {
    // todo call verifier here then send result to tab for rendering
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (tab.id) {
        const url = `http://localhost:9352/rest.php/data_accounting/v1/standard/page_last_rev?var1=${pageTitle}`;
        http.get(url, (response) => {
          response.on('data', (data) => {
            chrome.tabs.sendMessage(
              tab.id as number,
              {
                pageTitle: data.toString(),
              },
              (msg: string) => {
                console.log("result message:", msg);
              }
            );
          });
        })
      }
    });
  };
  
  return (
    <>
      <ul style={{ minWidth: "700px" }}>
        <li>Current Page Title: {pageTitle}</li>
        <li>Current Time: {new Date().toLocaleTimeString()}</li>
      </ul>
      <button
        onClick={() => setCount(count + 1)}
        style={{ marginRight: "5px" }}
      >
        count up
      </button>
      <button
        onClick={() => verifyPage(pageTitle)}
        style={{ marginRight: "5px" }}
      >
        Verify Page
      </button>
      <button onClick={changeBackground}>change background</button>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
