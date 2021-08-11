import { setBadge } from "./set_badge";

function setBadgeWrapper(tabId: number) {
  chrome.tabs.get(tabId, function(tab) {
    const urlObj = new URL(tab.url || '');
    setBadge(urlObj);
  });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  setBadgeWrapper(activeInfo.tabId);
});
