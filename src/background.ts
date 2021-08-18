import { extractPageTitle, setInitialBadge, verifyPage, BadgeTextNA, setBadgeStatus, getUrlObj } from "./verifier";

// https://stackoverflow.com/questions/60545285/how-to-use-onupdated-and-onactivated-simultanously
const processingTabId: { [key: number]: boolean } = {};

function doInitialVerification(tab: any, doVerify: boolean = false) {
  // processintTabId is necessary to prevent duplicate invocation of
  // doInitialVerification by the chrome listeners.
  if (processingTabId[tab.id]) return;
  processingTabId[tab.id] = true;
  const urlObj = getUrlObj(tab);
  setInitialBadge(urlObj)
  .then(() => {
    chrome.browserAction.getBadgeText({}, (badgeText) => {
      if (badgeText === BadgeTextNA) {
        delete processingTabId[tab.id];
        return;
      }
      const pageTitle = extractPageTitle(urlObj);
      if (!pageTitle) {
        delete processingTabId[tab.id];
        return;
      }
      chrome.cookies.get({url: tab.url, name: pageTitle}, (cookie) => {
        console.log("doInitialVerification, cookie", cookie ? cookie.value : cookie, pageTitle);
        if (cookie === null) {
          if (doVerify) {
            verifyPage(pageTitle);
          }
        } else {
          setBadgeStatus(cookie.value.toString());
        }
        delete processingTabId[tab.id];
      })
    });
  });
}

chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, function(tab) {
    doInitialVerification(tab);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") {
    return;
  }
  doInitialVerification(tab, true);
});

chrome.tabs.onCreated.addListener((tab) => {
  doInitialVerification(tab, true);
});
