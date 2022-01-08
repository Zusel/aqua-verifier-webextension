import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Box, ChakraProvider, Flex, Stack, IconButton } from "@chakra-ui/react";
import { WarningTwoIcon, LockIcon, CalendarIcon } from "@chakra-ui/icons";
import NavBar from "./components/NavBar";
import VerificationSummary from "./components/VerificationSummary";
import Clipboard from "clipboard";
import "./assets/scss/styles.scss";

import {
  verifyPage,
  extractPageTitle,
  BadgeColorNA,
  BadgeColorBlue,
  getUrlObj,
  sanitizeWikiUrl,
  verificationStatusMap,
} from "./verifier";
import { formatPageInfo2HTML } from "data-accounting-external-verifier";

const clipboard = new Clipboard(".clipboard-button");

const Popup = () => {
  const [pageTitle, setPageTitle] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [currentURL, setCurrentURL] = useState<string>();
  const [verificationLog, setVerificationLog] = useState("");

  function prepareAndSetVerificationStatus(
    sanitizedUrl: string,
    extractedPageTitle: string
  ) {
    chrome.cookies
      .get({ url: sanitizedUrl, name: extractedPageTitle })
      .then((cookie: any) => {
        const badgeStatus = (!!cookie && cookie.value.toString()) || "N/A";
        const somethingBadHappened =
          '<div style="color: Black; font-size: larger;">Unknown error</div> Unexpected badge status: ' +
          badgeStatus;
        const verificationStatusMessage =
          verificationStatusMap[badgeStatus] || somethingBadHappened;
        setVerificationStatus(verificationStatusMessage);
      });
  }

  useEffect(() => {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        const tab = tabs[0];
        setCurrentURL(tab.url);
        if (!tab.url) {
          return;
        }

        const urlObj = getUrlObj(tab);
        const extractedPageTitle = extractPageTitle(urlObj);
        if (!extractedPageTitle) {
          return;
        }
        const sanitizedUrl = sanitizeWikiUrl(tab.url);

        // TODO The following steps are almost identical to setPopupInfo.
        // Refactor.
        setPageTitle(extractedPageTitle);
        prepareAndSetVerificationStatus(sanitizedUrl, extractedPageTitle);
        const jsonData = await chrome.storage.local.get(sanitizedUrl);
        if (!jsonData[sanitizedUrl]) {
          return;
        }
        formatDetailsAndSetVerificationLog(JSON.parse(jsonData[sanitizedUrl]));
      }
    );
  }, []);

  function formatDetailsAndSetVerificationLog(data: { [key: string]: any }) {
    const verbose = false;
    const out = formatPageInfo2HTML(
      data.serverUrl,
      data.title,
      data.status,
      data.details,
      verbose
    );
    setVerificationLog(out);
  }

  function setPopupInfo(data: { [key: string]: any }) {
    setPageTitle(data.title);
    prepareAndSetVerificationStatus(data.sanitizedUrl, data.title);
    formatDetailsAndSetVerificationLog(data);
  }

  const handleVerifyPageClick = () => {
    verifyPage(pageTitle, setPopupInfo);
  };

  return (
    <ChakraProvider>
      <Stack direction="column" minW="700px">
        <NavBar onVerifyClick={handleVerifyPageClick} />
        <Flex direction="row" paddingY={4} paddingRight={5}>
          <Stack direction="column" w="80px" paddingX={4}>
            <CalendarIcon m={3} />
            <IconButton
              isDisabled={true}
              variant="outline"
              aria-label="History"
              icon={<LockIcon />}
            />
            <IconButton
              isDisabled={true}
              variant="outline"
              aria-label="History"
              icon={<WarningTwoIcon />}
            />
          </Stack>
          <Box width="100%">
            <VerificationSummary
              pageTitle={pageTitle}
              verificationStatus={verificationStatus}
            />
            <div dangerouslySetInnerHTML={{ __html: verificationLog }}></div>
          </Box>
        </Flex>
      </Stack>
    </ChakraProvider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
