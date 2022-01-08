// https://stackoverflow.com/a/50537862
function replaceInText(
  element: HTMLElement,
  pattern: RegExp,
  replacement: string
) {
  for (let node of element.childNodes) {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        if ((node as HTMLElement).tagName === "TEXTAREA") {
          // We do not replace inside the edit field of MediaWiki as this would
          // break pages and make it impossible to add account addresses.
          break;
        }
        replaceInText(node as HTMLElement, pattern, replacement);
        break;
      case Node.TEXT_NODE:
        if (node && node.textContent) {
          node.textContent = node.textContent.replace(pattern, replacement);
        }
        break;
      case Node.DOCUMENT_NODE:
        replaceInText(node as HTMLElement, pattern, replacement);
    }
  }
}

function replaceAllAddresses(addressesHashMap: any) {
  for (const [walletAddress, e] of Object.entries(addressesHashMap)) {
    // `e` is untyped.
    // @ts-ignore
    if (!("nickName" in e)) {
      continue;
    }
    // @ts-ignore
    replaceInText(html, new RegExp(walletAddress, "g"), e.nickName);
  }
}

async function getEnabledState() {
  const dEnabled = await chrome.storage.sync.get(nameResolutionEnabledKey);
  let enabled = false;
  if (dEnabled[nameResolutionEnabledKey]) {
    enabled = JSON.parse(dEnabled[nameResolutionEnabledKey]);
  }
  return enabled;
}

const html = document.querySelector("html");
const storageKey = "data_accounting_name_resolution";
const nameResolutionEnabledKey = "data_accounting_name_resolution_enabled_state";

if (html) {
  (async () => {
    const nameResolutionIsEnabled = await getEnabledState();
    if (!nameResolutionIsEnabled) {
      // Just do nothing if name resolution is disabled
      return;
    }

    const d = await chrome.storage.sync.get(storageKey);
    if (!d[storageKey]) {
      return;
    }
    const parsed = JSON.parse(d[storageKey]);
    replaceAllAddresses(parsed);
  })();
}
