import * as http from "http";
// Not yet typed
// @ts-ignore
import { verifyPage as externalVerifierVerifyPage } from "data-accounting-external-verifier";

export const BadgeTextNA = 'N/A';
// Dark gray custom picked
const BadgeColorNA = '#ABABAD';
// Color taken from https://www.schemecolor.com/easy-to-use-colors.php
// Blueberry
const BadgeColorBlue = '#427FED';

const apiURL = 'http://localhost:9352/rest.php/data_accounting/v1/standard';

export function extractPageTitle(urlObj: URL) {
  return urlObj.pathname.split('/').pop() || '';
}

export function setBadgeStatus(status: string) {
  let badgeColor;
  if (status === 'VERIFIED') {
    // From https://www.schemecolor.com/easy-to-use-colors.php
    // Apple
    // (actually it is greenish in color, not red)
    badgeColor = '#65B045';
  } else if (status === 'INVALID') {
    // From https://www.schemecolor.com/no-news-is-good.php
    // Fire Engine Red
    badgeColor = '#FF0018';
  } else if (status === 'N/A') {
    badgeColor = BadgeColorBlue;
  } else {
    // Something wrong is happening
    badgeColor = 'black';
  }
  chrome.browserAction.setBadgeBackgroundColor({color: badgeColor});
}

export function setInitialBadge(urlObj: URL) {
  const extractedPageTitle = extractPageTitle(urlObj);
  if (urlObj.hostname != "localhost") {
    chrome.browserAction.setBadgeBackgroundColor({color: BadgeColorNA});
    chrome.browserAction.setBadgeText({ text: BadgeTextNA });
    return Promise.resolve(false);
  }
  const urlForChecking = `${apiURL}/get_page_last_rev?var1=${extractedPageTitle}`;
  const promise = new Promise((resolve, reject) => {
    http.get(urlForChecking, (response) => {
      response.on('data', (data) => {
        const respText = data.toString();
        let badgeText, badgeColor;
        if (respText != "[]") {
          badgeText = "DA";
          badgeColor = BadgeColorBlue;
        } else {
          badgeText = BadgeTextNA;
          badgeColor = BadgeColorNA;
        }
        chrome.browserAction.setBadgeBackgroundColor({color: badgeColor});
        chrome.browserAction.setBadgeText({ text: badgeText });
        console.log("setInitialBadge", badgeText);
        resolve(badgeText != BadgeTextNA);
      });
      response.on('error', (e) => reject(false));
    });
  });
  return promise;
}

export function verifyPage (title: string) {
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    const tab = tabs[0];
    if (tab.id) {
      chrome.browserAction.setBadgeText({ text: '⏳' });
      const verificationStatus = await externalVerifierVerifyPage(title);
      chrome.browserAction.setBadgeText({ text: 'DA' });
      setBadgeStatus(verificationStatus)
      chrome.tabs.sendMessage(
        tab.id as number,
        {
          pageTitle: verificationStatus,
        },
        (msg: string) => {
          console.log("result message:", msg);
        }
      );
      // Update cookie
      if (tab.url) {
        chrome.cookies.set({url: tab.url, name: title, value: verificationStatus});
      }
      return verificationStatus;
    }
    return "N/A";
  });
}
