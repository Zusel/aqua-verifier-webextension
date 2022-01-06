// https://stackoverflow.com/a/50537862
function replaceInText(element: HTMLElement, pattern: RegExp, replacement: string) {
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
const html = document.querySelector('html')
const walletAddress = "WALLET_ADDRESS";
if (html) {
  replaceInText(html, new RegExp(walletAddress, "g"), 'NAME');
}
