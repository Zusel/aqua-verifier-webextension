import { extractPageTitle, setInitialBadge, verifyPage, BadgeTextNA, setBadgeStatus } from "./verifier";

// https://stackoverflow.com/questions/60545285/how-to-use-onupdated-and-onactivated-simultanously

function getUrlObj(tab: any) {
  return new URL(tab.url || '');
}

function doInitialVerification(tab: any, doVerify: boolean = false) {
  const urlObj = getUrlObj(tab);
  setInitialBadge(urlObj)
  .then(() => {
    chrome.browserAction.getBadgeText({}, (badgeText) => {
      if (badgeText === BadgeTextNA) {
        return
      }
      const urlObj = getUrlObj(tab);
      const pageTitle = extractPageTitle(urlObj);
      chrome.cookies.get({url: tab.url, name: "is_da_verified"}, (cookie) => {
        if (cookie === null) {
          if (doVerify) {
            verifyPage(pageTitle);
          }
        } else {
          setBadgeStatus(cookie.value === 'true');
        }
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
  doInitialVerification(tab, true);
});

chrome.tabs.onCreated.addListener((tab) => {
  doInitialVerification(tab, true);
});
