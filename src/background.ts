import { setBadge } from "./set_badge";

// https://stackoverflow.com/questions/60545285/how-to-use-onupdated-and-onactivated-simultanously

function setBadgeWrapper(tabId: number) {
  chrome.tabs.get(tabId, function(tab) {
    const urlObj = new URL(tab.url || '');
    setBadge(urlObj);
  });
}

chrome.tabs.onActivated.addListener((info) => {
  setBadgeWrapper(info.tabId);
});

chrome.tabs.onUpdated.addListener((info) => {
  setBadgeWrapper(info.tabId);
});

chrome.tabs.onCreated.addListener((info) => {
  setBadgeWrapper(info.tabId);
});
