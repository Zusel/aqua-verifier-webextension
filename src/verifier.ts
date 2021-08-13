import * as http from "http";
// Not yet typed
// @ts-ignore
import { verifyPage as externalVerifierVerifyPage } from "data-accounting-external-verifier";

const BadgeTextNA = 'N/A';
// Dark gray custom picked
const BadgeColorNA = '#ABABAD';

const apiURL = 'http://localhost:9352/rest.php/data_accounting/v1/standard';

export function setInitialBadge(urlObj: URL) {
  const extractedPageTitle = urlObj.pathname.split('/').pop() || '';
  if (urlObj.hostname != "localhost") {
    chrome.browserAction.setBadgeBackgroundColor({color: BadgeColorNA});
    chrome.browserAction.setBadgeText({ text: BadgeTextNA });
    return
  }
  const urlForChecking = `${apiURL}/page_last_rev?var1=${extractedPageTitle}`;
  http.get(urlForChecking, (response) => {
    response.on('data', (data) => {
      const respText = data.toString();
      let badgeText, badgeColor;
      if (respText != "[]") {
        badgeText = "DA";
        // Color taken from https://www.schemecolor.com/easy-to-use-colors.php
        // Blueberry
        badgeColor = '#427FED';
      } else {
        badgeText = BadgeTextNA;
        badgeColor = BadgeColorNA;
      }
      chrome.browserAction.setBadgeBackgroundColor({color: badgeColor});
      chrome.browserAction.setBadgeText({ text: badgeText });
    });
  })
}

export function verifyPage (title: string) {
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    const tab = tabs[0];
    if (tab.id) {
      chrome.browserAction.setBadgeText({ text: '⏳' });
      const verificationStatus = await externalVerifierVerifyPage(title);
      chrome.browserAction.setBadgeText({ text: 'DA' });
      let badgeColor;
      if (verificationStatus) {
        // From https://www.schemecolor.com/easy-to-use-colors.php
        // Apple
        // (actually it is greenish in color, not red)
        badgeColor = '#65B045';
      } else {
        // From https://www.schemecolor.com/no-news-is-good.php
        // Fire Engine Red
        badgeColor = '#FF0018';
      }
      chrome.browserAction.setBadgeBackgroundColor({color: badgeColor});
      chrome.tabs.sendMessage(
        tab.id as number,
        {
          pageTitle: verificationStatus,
        },
        (msg: string) => {
          console.log("result message:", msg);
        }
      );
    }
  });
}
