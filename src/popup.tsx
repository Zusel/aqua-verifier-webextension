import React, { ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  Box,
  ChakraProvider,
  Flex,
  Stack,
  IconButton,
  ButtonGroup,
  Button,
} from "@chakra-ui/react";
import { WarningTwoIcon, LockIcon, CalendarIcon } from "@chakra-ui/icons";
import NavBar from "./components/NavBar";
import VerificationSummary from "./components/VerificationSummary";
import "./assets/scss/styles.scss";

import {
  verifyPage,
  extractPageTitle,
  getUrlObj,
  sanitizeWikiUrl,
  verificationStatusMap,
} from "./verifier";
import { formatPageInfo2HTML } from "data-accounting-external-verifier";
import Layout from "./components/Layout";

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

  const handleOfflineVerifyClick = () => {
    return chrome.tabs.create({
      url: chrome.runtime.getURL("offline_verification.html"),
    });
  };

  const handleResolveNamesClick = () => {
    return chrome.tabs.create({
      url: chrome.runtime.getURL("name_resolution.html"),
    });
  };

  const popupToolbar: ReactNode = (
    <ButtonGroup>
      <Button onClick={handleResolveNamesClick}>Resolve Names</Button>
      <Button onClick={handleOfflineVerifyClick}>Offline Verify</Button>
      <Button onClick={handleVerifyPageClick}>Verify Page</Button>
    </ButtonGroup>
  );

  return (
    <Layout toolbar={popupToolbar}>
      <Stack direction="column" minW="700px">
        <Flex paddingY={4} paddingRight={5}>
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
    </Layout>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
