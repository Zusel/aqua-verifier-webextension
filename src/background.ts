import { setInitialBadge } from "./verifier";

// https://stackoverflow.com/questions/60545285/how-to-use-onupdated-and-onactivated-simultanously

function setInitialBadgeWrapper(tab: any) {
    const urlObj = new URL(tab.url || '');
    setInitialBadge(urlObj);
}

chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, function(tab) {
    setInitialBadgeWrapper(tab);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  setInitialBadgeWrapper(tab);
});

chrome.tabs.onCreated.addListener((tab) => {
  setInitialBadgeWrapper(tab);
});
