// https://stackoverflow.com/a/50537862
function replaceInText(element: HTMLElement, pattern: RegExp, replacement: string) {
  for (let node of element.childNodes) {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
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
const walletAddress = "sjdfakjfaljfkafd";
if (html) {
  replaceInText(html, new RegExp(walletAddress, "g"), 'Nick Szabo');
}
