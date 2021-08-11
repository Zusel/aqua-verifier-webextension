import * as http from "http";

const BadgeTextNA = 'N/A';
// Dark gray custom picked
const BadgeColorNA = '#ABABAD';

const apiURL = 'http://localhost:9352/rest.php/data_accounting/v1/standard';

export function setBadge(urlObj: URL) {
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
