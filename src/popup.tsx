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
        chrome.tabs.sendMessage(
          tab.id,
          {
            pageTitle: title,
          },
          (msg) => {
            console.log("result message:", msg);
          }
        );
      }
    });
  };
  
  const handleInputChange = (e: any) => {
    setPageTitle(e.target.value)
    console.log(pageTitle)
  }

  return (
    <>
      <ul style={{ minWidth: "700px" }}>
        <li>Current URL: {currentURL}</li>
        <li>Current Time: {new Date().toLocaleTimeString()}</li>
      </ul>
      <button
        onClick={() => setCount(count + 1)}
        style={{ marginRight: "5px" }}
      >
        count up
      </button>
      <input value={pageTitle} onChange={handleInputChange}></input>
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
