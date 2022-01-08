import * as http from "http";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Clipboard from "clipboard";
import wtf from "wtf_wikipedia";
import "./assets/scss/styles.scss";

import wtfPluginHtml from "wtf-plugin-html";
// This is taking 154 KiB space of the vendor.js bundle.
// This is because, the database of mime types (mime-db) is big.
import Mime from "mime-types";

import {
  verifyPage,
  extractPageTitle,
  BadgeColorNA,
  BadgeColorBlue,
  getUrlObj,
  sanitizeWikiUrl,
  verificationStatusMap,
} from "./verifier";
import {
  verifyPage as externalVerifierVerifyPage,
  formatPageInfo2HTML,
} from "data-accounting-external-verifier";

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

const OfflineVerification = () => {
  const [pageTitle, setPageTitle] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [currentURL, setCurrentURL] = useState<string>();
  const [verificationLog, setVerificationLog] = useState("");
  const [wikiPage, setWikiPage] = useState("");

  function prepareAndSetVerificationStatus(status: string) {
    const somethingBadHappened =
      '<div style="color: Black; font-size: larger;">Unknown error</div> Unexpected badge status: ' +
      status;
    const verificationStatusMessage =
      verificationStatusMap[status] || somethingBadHappened;
    setVerificationStatus(verificationStatusMessage);
  }

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

  function setPopupInfo(status: string, data: { [key: string]: any }) {
    setPageTitle(data.title);
    prepareAndSetVerificationStatus(status);
    formatDetailsAndSetVerificationLog(data);
  }

  function getLastRevisionHtml(revisions: { [key: string]: any }) {
    const vhs = Object.keys(revisions);
    const lastVH = vhs[vhs.length - 1];
    const lastRevision = revisions[lastVH];
    const wikitext = lastRevision.content.content["main"];
    // @ts-ignore
    const wikiHtml = wtf(wikitext).html();
    let fileContent = "";
    if ("file" in lastRevision.content) {
      // If there is a file, create a download link.
      const mimeType =
        Mime.lookup(lastRevision.content.file.filename) ||
        "application/octet-stream";
      const fileExtension = Mime.extension(mimeType) || "unknown";
      const blob = b64toBlob(lastRevision.content.file.data, mimeType);
      // The in-RAM file will be garbage-collected once the tab is closed.
      const blobUrl = URL.createObjectURL(blob);
      fileContent = `<a href='${blobUrl}' target='_blank' download='${lastRevision.content.file.filename}'>Access file</a>`;
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

  function offlineVerifyPage() {
    const filesElements = document.getElementById("file") as HTMLInputElement;
    if (!(filesElements && filesElements.files && filesElements.files[0])) {
    }
    const file = filesElements.files![0];
    const reader = new FileReader();
    reader.onload = async function (e) {
      if (!(e && e.target && e.target.result)) {
        return;
      }
      const verbose = false;
      const doVerifyMerkleProof = true;
      const parsedExport = JSON.parse(e.target.result as string);
      if (!("pages" in parsedExport)) {
        return;
      }
      // TODO we currently only verifies 1 page from the json data.
      // Generalize this
      const firstPage = parsedExport.pages[0];
      // This is for displaying the content.
      // TODO move this to be later once the deletion of revision content from
      // details has been removed.
      const lastRevisionHtml = getLastRevisionHtml(firstPage.revisions);

      const [verificationStatus, details] = await externalVerifierVerifyPage(
        { offline_data: firstPage },
        verbose,
        doVerifyMerkleProof,
        null
      );
      const title = firstPage.title;
      const serverUrl = "http://offline_verify_page";
      const verificationData = {
        serverUrl,
        title,
        status: verificationStatus,
        details: details,
      };
      setPopupInfo(verificationStatus, verificationData);
      setWikiPage(lastRevisionHtml);
    };
    reader.readAsText(file);
  }

  return (
    <>
      <div style={{ fontSize: "larger" }}>
        <nav
          className="navbar navbar-light bg-light"
          style={{ minWidth: "700px" }}
        >
          <span className="navbar-brand">
            <img
              className="bg-white rounded p-1 mr-2"
              src="data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8' standalone='no'%3F%3E%3Csvg xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:cc='http://creativecommons.org/ns%23' xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns%23' xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' xmlns:sodipodi='http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd' xmlns:inkscape='http://www.inkscape.org/namespaces/inkscape' sodipodi:docname='logo.svg' inkscape:version='1.0 (4035a4f, 2020-05-01)' id='svg8' version='1.1' viewBox='0 0 26.458333 26.458334' height='100' width='100'%3E%3Cdefs id='defs2' /%3E%3Csodipodi:namedview inkscape:window-maximized='1' inkscape:window-y='0' inkscape:window-x='0' inkscape:window-height='719' inkscape:window-width='958' units='px' showgrid='false' inkscape:document-rotation='0' inkscape:current-layer='g231' inkscape:document-units='mm' inkscape:cy='71.295251' inkscape:cx='75.133929' inkscape:zoom='2.8' inkscape:pageshadow='2' inkscape:pageopacity='0.0' borderopacity='1.0' bordercolor='%23666666' pagecolor='%23ffffff' id='base' /%3E%3Cmetadata id='metadata5'%3E%3Crdf:RDF%3E%3Ccc:Work rdf:about=''%3E%3Cdc:format%3Eimage/svg+xml%3C/dc:format%3E%3Cdc:type rdf:resource='http://purl.org/dc/dcmitype/StillImage' /%3E%3Cdc:title%3E%3C/dc:title%3E%3C/cc:Work%3E%3C/rdf:RDF%3E%3C/metadata%3E%3Cg id='layer1' inkscape:groupmode='layer' inkscape:label='Layer 1'%3E%3Cg transform='matrix(0.26458333,0,0,0.26458333,86.390232,38.671175)' id='g231'%3E%3Cg transform='matrix(2.3721349,0,0,2.3721349,-361.99251,-167.85063)' id='g2829'%3E%3Cpath transform='matrix(-1.025864,0,0,1.025864,-23.441185,92.895439)' sodipodi:nodetypes='ccccccccccc' id='path6155' d='m -48.187946,-58.015119 -0.767899,3.27573 -3.387262,1.240668 -0.78385,5.362531 -4.140695,0.788582 -4.818282,-0.303375 -0.294856,-2.523341 -1.073975,-2.145379 -4.811793,-1.626239 -0.170478,-4.326045 z' style='fill:%23000000;fill-opacity:1;stroke:none;stroke-width:0.361669px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' /%3E%3Crect transform='matrix(-1.025864,0,0,1.025864,-23.441185,92.895439)' style='fill:%23ffffff;stroke-width:0.337249' x='-58.449673' y='-56.909454' width='4.4206591' height='0.8431223' id='rect4777' /%3E%3Crect style='stroke-width:0.337246' x='-89.718582' y='-8.350338' transform='matrix(-0.72539539,0.72539539,0.72539539,0.72539539,-23.441185,92.895439)' width='0.84311426' height='4.4840188' id='rect4785' /%3E%3Crect style='stroke-width:0.337246' x='2.6638947' y='-88.386444' transform='matrix(-0.72539539,-0.72539539,-0.72539539,0.72539539,-23.441185,92.895439)' width='4.4840188' height='0.84311426' id='rect4787' /%3E%3Crect style='stroke-width:0.337246' x='-84.489433' y='-7.2866488' transform='matrix(-0.72539539,0.72539539,0.72539539,0.72539539,-23.441185,92.895439)' width='0.84311426' height='4.4840188' id='rect4789' /%3E%3Crect style='stroke-width:0.337246' x='82.31385' y='1.6000824' transform='matrix(0.72539539,-0.72539539,-0.72539539,-0.72539539,-23.441185,92.895439)' width='0.84311426' height='4.4840188' id='rect4791' /%3E%3Cpath transform='matrix(-1.025864,0,0,1.025864,-23.441185,92.895439)' style='stroke-width:0.337249' sodipodi:nodetypes='ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' d='m -48.7063,-62.015927 -2.51143,-1.1082 -0.862346,-4.834126 -5.369065,-5.975439 -6.439493,4.161039 0.724073,3.088526 -1.287953,2.245741 -4.322795,1.689617 v 4.22438 l -3.247684,-0.05143 0.3459,0.894553 h 2.901784 v 2.135797 h -2.49108 l 0.611071,0.843122 h 1.880009 v 1.076836 l 5.068177,1.68928 0.788825,1.375976 h -4.491668 l 0.723337,0.843122 h 4.028921 l -0.101584,2.433756 5.260425,0.480692 4.673418,-1.043402 0.610083,-3.989644 h 4.706316 l 0.723337,-0.843123 h -5.27924 l 0.101849,-0.571299 3.256813,-1.1082 0.190883,-0.624923 h 2.659669 l 0.723337,-0.843122 h -3.12501 l 0.56759,-1.854869 h 3.382184 l 0.519432,-0.843122 h -3.850017 z m -0.432353,6.189529 h -1.62183 v 0.843122 h 1.272778 l -3.21803,1.095385 -0.215839,1.209037 h -1.964138 v 0.843123 h 1.813725 l -0.498615,3.296335 -4.098307,0.735927 -4.132897,-0.28386 0.254416,-1.629804 h 1.483035 v -0.843122 h -1.882 l -1.189477,-2.074082 -4.796354,-1.598897 v -0.469113 h 4.805797 v -0.843122 h -4.805797 v -2.135798 h 19.360449 z m -18.793533,-2.697991 v -3.616658 l 4.050971,-1.598897 1.613399,-2.812993 -0.659659,-2.812993 5.311059,-3.484181 4.747852,5.273286 0.908212,5.09111 2.574159,1.129447 0.866055,2.832216 h -19.412048 z' id='path4811' /%3E%3Crect transform='matrix(-1.025864,0,0,1.025864,-23.441185,92.895439)' style='fill:%23ffffff;stroke-width:0.337248' id='rect4777-3' height='0.8431223' width='4.4206591' y='-53.763481' x='-61.803165' /%3E%3Crect transform='matrix(-1.025864,0,0,1.025864,-23.441185,92.895439)' style='fill:%23ffffff;stroke-width:0.337249' x='-68.775307' y='-55.545467' width='4.4206591' height='0.8431223' id='rect4777-36' /%3E%3Cpath transform='matrix(-1.025864,0,0,1.025864,-23.441185,92.895439)' id='rect4777-7' style='fill:%23ffffff;stroke-width:0.337249' d='m -50.986502,-55.826398 h 2.729081 l -0.257998,0.843122 h -2.471083 z' sodipodi:nodetypes='ccccc' /%3E%3Cpath transform='matrix(-1.025864,0,0,1.025864,-23.441185,92.895439)' id='rect4777-5' style='fill:%23ffffff;stroke-width:0.337249' d='m -54.536048,-52.678853 h 2.471083 l -0.15041,0.843122 h -2.320673 z' sodipodi:nodetypes='ccccc' /%3E%3Cpath transform='matrix(-1.025864,0,0,1.025864,-23.441185,92.895439)' id='rect4777-7-3' style='fill:%23ffffff;stroke-width:0.337249' d='m -60.186634,-50.560255 h -2.729081 l 0.257998,0.843122 h 2.471083 z' sodipodi:nodetypes='ccccc' /%3E%3Cpath transform='matrix(-1.025864,0,0,1.025864,-23.441185,92.895439)' id='rect4777-3-5' style='fill:%23ffffff;stroke-width:0.337248' d='m -57.870222,-50.458785 h 3.156832 v 0.843123 h -3.156832 z' sodipodi:nodetypes='ccccc' /%3E%3Cpath d='m 36.119782,51.390396 c -11.641087,0 -21.078061,-9.43698 -21.078061,-21.078064 0,-11.641084 9.436974,-21.0780588 21.078061,-21.0780588 11.641084,0 21.078058,9.4369748 21.078058,21.0780588 -0.01275,11.636054 -9.442009,21.065894 -21.078058,21.078064 z m 0,-41.235679 c -11.132745,0 -20.157617,9.024869 -20.157617,20.157615 0,11.132744 9.024872,20.157624 20.157617,20.157624 11.132746,0 20.157615,-9.02488 20.157615,-20.157624 C 56.264647,19.184635 47.247479,10.166888 36.119782,10.154717 Z' id='path1156-3-1' style='fill:%23000000;fill-rule:nonzero;stroke:none;stroke-width:0.184088' /%3E%3Cpath d='m 36.118865,48.941146 c -1.089132,-3.4e-4 -2.176197,-0.0946 -3.249151,-0.28164 l 0.158257,-0.90573 c 2.050733,0.35623 4.147517,0.35623 6.198237,0 l 0.158325,0.90756 c -1.078462,0.18736 -2.171111,0.28098 -3.265723,0.27981 z m -9.373753,-2.50548 c -1.892499,-1.0956 -3.579475,-2.51284 -4.985099,-4.18799 l 0.704997,-0.59282 c 1.336042,1.5938 2.940241,2.94195 4.740263,3.98367 z m 18.300169,-0.79889 c 1.802265,-1.04154 3.408403,-2.39038 4.745783,-3.98551 l 0.705059,0.59092 c -1.407016,1.67421 -3.095226,3.09019 -4.988781,4.18432 z m -26.558356,-9.01847 c -0.749947,-2.055744 -1.133143,-4.227199 -1.132138,-6.415465 h 0.918599 c -6.75e-4,2.080917 0.363692,4.145811 1.076916,6.100675 z m 34.40602,-0.32959 c 0.712347,-1.959402 1.074981,-4.028694 1.071386,-6.113564 v -0.04053 h 0.920447 v 0.04053 c 0.0027,2.189133 -0.378596,4.361775 -1.126621,6.419144 z M 18.474101,23.774428 c 0.746746,-2.057108 1.848306,-3.967387 3.254681,-5.644125 l 0.706908,0.590908 c -1.338615,1.594115 -2.386677,3.411081 -3.09636,5.367998 z m 34.405954,0.261455 c -0.715429,-1.953453 -1.768462,-3.766045 -3.11108,-5.355128 l 0.708728,-0.594594 c 1.411653,1.671807 2.518858,3.578431 3.27124,5.633086 z M 26.713819,13.93497 c 1.891568,-1.101505 3.963241,-1.859381 6.119081,-2.2385 l 0.160123,0.907547 c -2.049242,0.36025 -4.018627,1.080081 -5.817172,2.126217 z m 18.302003,0.76763 c -1.803145,-1.039968 -3.775411,-1.754099 -5.826373,-2.109647 l 0.158311,-0.905709 c 2.156336,0.369722 4.23037,1.117568 6.126451,2.209044 z' id='path1158-8-6' style='fill:%23000000;fill-rule:nonzero;stroke:none;stroke-width:0.184088' sodipodi:nodetypes='ccccccccccccccccccccccccccccccccccccccccccccccccc' /%3E%3Cpath d='m 36.119782,46.631726 c -9.012953,0 -16.319391,-7.30644 -16.319391,-16.319394 0,-9.012951 7.306438,-16.319389 16.319391,-16.319389 9.012951,0 16.319388,7.306438 16.319388,16.319389 -0.01018,9.008744 -7.310643,16.309244 -16.319388,16.319394 z m 0,-31.718339 c -8.504601,0 -15.398944,6.894347 -15.398944,15.398945 0,8.504604 6.894343,15.398954 15.398944,15.398954 8.504598,0 15.398945,-6.89435 15.398945,-15.398954 -0.0089,-8.500815 -6.89813,-15.389819 -15.398945,-15.398945 z' id='path1160-5-5' style='fill:%23000000;fill-rule:nonzero;stroke:none;stroke-width:0.184088' /%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A"
              height="40"
              width="40"
              alt=""
            />
            Offline Verify
          </span>
          <div className="form-inline navbar-nav">
            <div className="btn-toolbar">
              <button
                className="btn btn-secondary mr-2"
                onClick={offlineVerifyPage}
              >
                Verify File
              </button>
              <input type="file" id="file" />
            </div>
          </div>
        </nav>
        <div dangerouslySetInnerHTML={{ __html: verificationStatus }}></div>
        <ul style={{ minWidth: "700px" }}>
          <li>
            {pageTitle
              ? "Current Page Title: " + pageTitle
              : "Select a PKC export JSON file"}
          </li>
        </ul>
        <div dangerouslySetInnerHTML={{ __html: verificationLog }}></div>
        <hr />
        <div dangerouslySetInnerHTML={{ __html: wikiPage }}></div>
      </div>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <OfflineVerification />
  </React.StrictMode>,
  document.getElementById("root")
);
