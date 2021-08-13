import { extractPageTitle, setInitialBadge, verifyPage, BadgeTextNA } from "./verifier";

// https://stackoverflow.com/questions/60545285/how-to-use-onupdated-and-onactivated-simultanously

function getUrlObj(tab: any) {
  return new URL(tab.url || '');
}

function setInitialBadgeWrapper(tab: any) {
  const urlObj = getUrlObj(tab);
  return setInitialBadge(urlObj);
}

function doInitialVerification(tab: any) {
  chrome.browserAction.getBadgeText({}, (badgeText) => {
    if (badgeText === BadgeTextNA) {
      return
    }
    const urlObj = getUrlObj(tab);
    const pageTitle = extractPageTitle(urlObj);
    chrome.cookies.get({url: tab.url, name: "is_da_verified"}, (cookie) => {
      if (cookie === null) {
        verifyPage(pageTitle);
      }
    })
  });
}

chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, function(tab) {
    setInitialBadgeWrapper(tab);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  setInitialBadgeWrapper(tab)
  .then(() => doInitialVerification(tab));
});

chrome.tabs.onCreated.addListener((tab) => {
  setInitialBadgeWrapper(tab)
  .then(() => doInitialVerification(tab));
});
