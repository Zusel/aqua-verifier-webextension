chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log({msg})
  if (msg.pageTitle) {
    console.log("Verify " + msg.pageTitle);
  } else {
    console.log("Page title not set");
    sendResponse("No page to verify");
  }
});
