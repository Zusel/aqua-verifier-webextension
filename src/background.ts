import { extractPageTitle, setInitialBadge, verifyPage, BadgeTextNA, BadgeTextNORECORD, setBadgeStatus, getUrlObj, setBadgeNA, setBadgeNORECORD, checkIfCacheIsUpToDate, getServerInfo, sanitizeWikiUrl } from "./verifier";

// https://stackoverflow.com/questions/60545285/how-to-use-onupdated-and-onactivated-simultanously
const processingTabId: { [key: number]: boolean } = {};

async function doInitialVerification(tab: any, doCheckCache: boolean = true) {
  // processintTabId is necessary to prevent duplicate invocation of
  // doInitialVerification by the chrome listeners.
  if (processingTabId[tab.id]) return;
  processingTabId[tab.id] = true;

  if (!tab.url) {
    setBadgeNA(tab.id);
    delete processingTabId[tab.id];
    return;
  }
  const urlObj = getUrlObj(tab);
  if (!urlObj) {
    setBadgeNA(tab.id);
    delete processingTabId[tab.id];
    return;
  }

  const [maybeServerUrl, _] = await getServerInfo(tab.id);
  const serverUrl = maybeServerUrl || '';
  if (!serverUrl) {
    setBadgeNA(tab.id);
    delete processingTabId[tab.id];
    return;
  }

  const pageTitle = extractPageTitle(urlObj);
  if (!pageTitle) {
    setBadgeNORECORD(tab.id);
    delete processingTabId[tab.id];
    return;
  }

  const sanitizedUrl = sanitizeWikiUrl(tab.url);

  chrome.cookies.get({url: sanitizedUrl, name: pageTitle}).then((cookie) => {
    console.log("doInitialVerification, cookie", cookie ? cookie.value : cookie, pageTitle);
    async function doVerifyFromScratch() {
      await setInitialBadge(tab.id, serverUrl, pageTitle)
      .then((badgeText) => {
        if (badgeText === BadgeTextNA) {
          delete processingTabId[tab.id];
          return;
        }

        if (badgeText === BadgeTextNORECORD) {
          chrome.cookies.set({url: sanitizedUrl, name: pageTitle, value: 'NORECORD'});
          // Delete sync storage if previous data exist
          chrome.storage.local.remove(sanitizedUrl);
          chrome.storage.local.remove("verification_hash_" + sanitizedUrl);
          delete processingTabId[tab.id];
          return;
        }

        verifyPage(pageTitle);
        delete processingTabId[tab.id];
      });
    }

    if (cookie === null) {
      doVerifyFromScratch()
    } else {
      if (!doCheckCache) {
        setBadgeStatus(tab.id, cookie.value.toString());
        delete processingTabId[tab.id];
        return
      }
      // Check if our stored verification info is outdated
      checkIfCacheIsUpToDate(tab.id, pageTitle, sanitizedUrl, (isUpToDate: boolean) => {
        if (isUpToDate) {
          setBadgeStatus(tab.id, cookie.value.toString());
          delete processingTabId[tab.id];
        } else {
          // TODO checkIfCacheIsUpToDate already makes an API call
          // get_page_last_rev. We can reuse this output for setInitialBadge.
          // No need to delete processingTabId because it will be done in
          // doVerifyFromScratch()
          doVerifyFromScratch()
        }
      })
    }
  });
}

function runIfTabIsActive(tab: any, callback: Function) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    if (tab.id === activeTab.id) {
      callback();
    }
  });
}

chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, function(tab) {
    doInitialVerification(tab, false);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") {
    return;
  }
  runIfTabIsActive(tab, () => {
    doInitialVerification(tab);
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  runIfTabIsActive(tab, () => {
    doInitialVerification(tab);
  });
});
