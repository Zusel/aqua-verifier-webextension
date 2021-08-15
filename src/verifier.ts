import * as http from "http";
// Not yet typed
// @ts-ignore
import { verifyPage as externalVerifierVerifyPage, formatRevisionInfo2HTML } from "data-accounting-external-verifier";

export const BadgeTextNA = 'N/A';
// Dark gray custom picked
const BadgeColorNA = '#ABABAD';
// Color taken from https://www.schemecolor.com/easy-to-use-colors.php
// Blueberry
const BadgeColorBlue = '#427FED';

const apiURL = 'http://localhost:9352/rest.php/data_accounting/v1/standard';

export function extractPageTitle(urlObj: URL | null) {
  if (!urlObj) {
    return '';
  }
  const title = urlObj.pathname.split('/').pop();
  // Convert from Mediawiki url title to page title.
  // See https://www.mediawiki.org/wiki/Manual:PAGENAMEE_encoding
  // TODO completely implement this. There are other characters that are
  // converted, not just undescore.
  return title ? title.replace(/_/g, ' ') : '';
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

function setBadgeNA() {
  chrome.browserAction.setBadgeBackgroundColor({color: BadgeColorNA});
  chrome.browserAction.setBadgeText({ text: BadgeTextNA });
}

export function setInitialBadge(urlObj: URL | null) {
  if (!urlObj) {
    setBadgeNA();
    return Promise.resolve(false);
  }
  const extractedPageTitle = extractPageTitle(urlObj);
  if (urlObj.hostname != "localhost") {
    setBadgeNA();
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

function logPageInfo(status: string, details: {verified_ids: string[], revision_details: object[]} | null, callback: Function) {
  if (status === 'N/A' || !details) {
    callback('');
    return;
  }
  const verbose = false;
  const _space2 = '&nbsp&nbsp';
  let out = "";
  out += 'Verified IDs:' + details.verified_ids.toString() + '<br>';
  for (let i = 0; i < details.revision_details.length; i++) {
    out += `${i + 1}. Verification of Revision ${details.verified_ids[i]}.<br>`;
    out += formatRevisionInfo2HTML(details.revision_details[i], verbose) + "<br>";
    const count = i + 1;
    out += `${_space2}Validated revisions: ${count} / ${details.verified_ids.length} (${(100 * count / details.verified_ids.length).toFixed(1)}%)<br>`;
    callback(out);
  };
}

export function verifyPage (title: string, callback: Function | null = null) {
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    const tab = tabs[0];
    let verificationStatus = "N/A";
    let details = null;
    if (tab.id) {
      chrome.browserAction.setBadgeText({ text: '⏳' });
      const verbose = false;
      [verificationStatus, details] = await externalVerifierVerifyPage(title, verbose, false);
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
    }
    if (callback) {
      logPageInfo(verificationStatus, details, callback);
    }
    return;
  });
}
