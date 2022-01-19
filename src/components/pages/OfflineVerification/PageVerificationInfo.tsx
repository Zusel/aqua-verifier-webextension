import * as http from "http";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Clipboard from "clipboard";
import wtf from "wtf_wikipedia";
import VerificationLog from "../../VerificationLog";
import VerificationSummary from "../../VerificationSummary";
import * as nameResolver from "../../../name_resolver";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

import wtfPluginHtml from "wtf-plugin-html";
// This is taking 154 KiB space of the vendor.js bundle.
// This is because, the database of mime types (mime-db) is big.
import Mime from "mime-types";

import { verifyPage, verificationStatusMap } from "../../../verifier";

import {
  verifyPage as externalVerifierVerifyPage,
  formatPageInfo2HTML,
} from "data-accounting-external-verifier";
import {
  Center,
  VStack,
  StackDivider,
  Box,
  CircularProgress,
} from "@chakra-ui/react";
import formatPageInfo from "../../../utils/formatPageInfo";

const clipboard = new Clipboard(".clipboard-button");
wtf.extend(wtfPluginHtml);

// We list the image extensions supported in
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#supported_image_formats
// The file extensions are extracted from
// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
const supportedImageExtensions = [
  "apng",
  "avif",
  "gif",
  "jpg",
  "jpeg",
  "jfif",
  "pjpeg",
  "pjp",
  "png",
  "svg",
  "webp",
];
// See https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript.
// TODO Maybe it'd be much simpler using fetch(); see the other answers in the URL above.
const b64toBlob = (b64Data: string, contentType = "", sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export type PageResult = {
  genesis_hash: string;
  domain_id: string;
  latest_verification_hash: string;
  title: string;
  namespace: number;
  chain_height: number;
  revisions: object;
};

const PageVerificationInfo = ({ pageResult }: { pageResult: PageResult }) => {
  const [pageTitle, setPageTitle] = useState("");
  const [verificationStatus, setVerificationStatus] = useState({
    title: "",
    subtitle: "",
    keyColor: "",
  });
  const [verificationLog, setVerificationLog] = useState({});
  const [wikiPage, setWikiPage] = useState("");

  function prepareAndSetVerificationStatus(status: string) {
    const somethingBadHappened = {
      title: "Unknown error",
      subtitle: `Unexpected badge status: ${status}`,
      keyColor: "black",
    };
    const verificationStatusMessage =
      verificationStatusMap[status] || somethingBadHappened;
    setVerificationStatus(verificationStatusMessage);
  }

  async function formatDetailsAndSetVerificationLog(data: {
    [key: string]: any;
  }) {
    const verbose = false;
    console.log({ data });
    const out = formatPageInfo(
      data.serverUrl,
      data.title,
      data.status,
      data.details,
      verbose
    );
    // Resolve the names
    // TODO: which fields need name to be resolved? only apply to those fields
    //@ts-ignore
    // out = await nameResolver.resolveNamesRawText(out);
    console.log(out);
    setVerificationLog(out);
  }

  function setResultInfo(status: string, data: { [key: string]: any }) {
    setPageTitle(data.title);
    prepareAndSetVerificationStatus(status);
    formatDetailsAndSetVerificationLog(data);
  }

  function getLastRevisionHtml(revisions: { [key: string]: any }) {
    const vhs = Object.keys(revisions);
    const lastVH = vhs[vhs.length - 1];
    const lastRevision = revisions[lastVH];
    const wikitext = lastRevision.content.content.main;
    // @ts-ignore
    const wikiHtml = wtf(wikitext).html();
    let fileContent = "";
    if ("file" in lastRevision.content) {
      // If there is a file, create a download link.
      const mimeType =
        Mime.lookup(lastRevision.content.file.filename) ||
        "application/octet-stream";
      const fileExtension = Mime.extension(mimeType) || "unknown";
      let blob;
      try {
        blob = b64toBlob(lastRevision.content.file.data, mimeType);
        // The in-RAM file will be garbage-collected once the tab is closed.
        const blobUrl = URL.createObjectURL(blob);
        fileContent = `<a href='${blobUrl}' target='_blank' download='${lastRevision.content.file.filename}'>Access file</a>`;
      } catch (e) {
        alert("The base64-encoded file content is corrupted.");
      }

      if (supportedImageExtensions.includes(fileExtension)) {
        // If the file is an image supported in HTML, display it.
        fileContent +=
          `<div><img src='data:${mimeType};base64,` +
          lastRevision.content.file.data +
          "'></div>";
      }
    }
    return wikiHtml + fileContent;
  }

  React.useEffect(() => {
    let ignore = false;
    const fn = async () => {
      if (!(pageResult && pageResult.revisions)) {
        return;
      }
      // This is for displaying the content.
      // TODO move this to be later once the deletion of revision content from
      // details has been removed.
      const lastRevisionHtml = getLastRevisionHtml(pageResult.revisions);

      const verbose = false;
      const doVerifyMerkleProof = true;

      const [verificationStatus, details] = await externalVerifierVerifyPage(
        { offline_data: pageResult },
        verbose,
        doVerifyMerkleProof,
        null
      );
      const title = pageResult.title;
      const serverUrl = "http://offline_verify_page";
      const verificationData = {
        serverUrl,
        title,
        status: verificationStatus,
        details,
      };

      if (!ignore) {
        setResultInfo(verificationStatus, verificationData);
        setWikiPage(lastRevisionHtml);
      }
    };
    fn();

    // cleanup @link https://reactjs.org/docs/hooks-faq.html#is-it-safe-to-omit-functions-from-the-list-of-dependencies
    return () => {
      ignore = true;
    };
  }, [pageResult]);

  return (
    <Box w="90%" p={16} m="0 auto" maxW="1200px">
      {!pageTitle ? (
        <Center h="100%">
          <CircularProgress
            isIndeterminate
            color="green.300"
            thickness="12px"
          />
        </Center>
      ) : (
        <VStack
          divider={<StackDivider borderColor="black" />}
          spacing={4}
          align="stretch"
        >
          <VerificationSummary
            pageTitle={pageTitle}
            verificationStatus={verificationStatus}
          />
          <VerificationLog verificationLog={verificationLog} />
          <div dangerouslySetInnerHTML={{ __html: wikiPage }}></div>
        </VStack>
      )}
    </Box>
  );
};

export default PageVerificationInfo;
