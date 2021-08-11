import { setBadge } from "./set_badge";

// https://stackoverflow.com/questions/60545285/how-to-use-onupdated-and-onactivated-simultanously

function setBadgeWrapper(tab: any) {
    const urlObj = new URL(tab.url || '');
    setBadge(urlObj);
}

chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, function(tab) {
    setBadgeWrapper(tab);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  setBadgeWrapper(tab);
});

chrome.tabs.onCreated.addListener((tab) => {
  setBadgeWrapper(tab);
});
