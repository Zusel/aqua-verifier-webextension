import * as http from "http";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Clipboard from "clipboard";
import wtf from "wtf_wikipedia";
import VerificationLog from "../../VerificationLog";
import VerificationSummary from "../../VerificationSummary";
import * as nameResolver from "../../../name_resolver";
import b64toBlob from "./utils/b64toBlob";
import { isEmpty } from "ramda";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import type { Witness } from "../../../types";

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

export type PageResult = {
  genesis_hash: string;
  domain_id: string;
  latest_verification_hash: string;
  title: string;
  namespace: number;
  chain_height: number;
  revisions: object;
};

const parseWitness = async (witnessData: Witness) => {
  const {
    smart_contract_address,
    witness_event_transaction_hash,
    sender_account_address,
  } = witnessData;
  console.log("parseWitness", { witnessData });

  const parsedWitness = {
    ...witnessData,
    smart_contract_address: await nameResolver.resolveNamesRawText(
      smart_contract_address
    ),
    witness_event_transaction_hash: await nameResolver.resolveNamesRawText(
      witness_event_transaction_hash
    ),
    sender_account_address: await nameResolver.resolveNamesRawText(
      sender_account_address
    ),
  };

  console.log({ parsedWitness });

  return parsedWitness;
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
    console.log("preformatted data", { data });
    let out = await formatPageInfo(
      data.serverUrl,
      data.title,
      data.status,
      data.details
    );

    console.log("FORMATTED out", { out });

    // Resolve the names
    // TODO: which fields need name to be resolved? only apply to those fields
    //@ts-ignore
    // out = await nameResolver.resolveNamesRawText(out);
    // console.log(out.revisions);

    // let updatedRevisions;
    // if (out["revisions"].length) {
    //   const revisionsToNameResolve = out.revisions;
    //   console.log("lets resolve these!", { revisionsToNameResolve });
    //   updatedRevisions = await Promise.all(
    //     revisionsToNameResolve.map(async (revision: any) => {
    //       const { unNameResolvedWitness } = revision;
    //       const nameResolved =
    //         unNameResolvedWitness &&
    //         (await parseWitness(unNameResolvedWitness));
    //       console.log({ nameResolved });

    //       return {
    //         ...revision,
    //         nameResolvedWitness: nameResolved,
    //       };
    //     })
    //   );

    //   //replace revisions in output with updated revisions

    //   console.log({ updatedRevisions });
    // }

    // handle async stuff here??
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
          {!isEmpty(verificationLog) && (
            <VerificationLog verificationLog={verificationLog} />
          )}
          <div dangerouslySetInnerHTML={{ __html: wikiPage }}></div>
        </VStack>
      )}
    </Box>
  );
};

export default PageVerificationInfo;
