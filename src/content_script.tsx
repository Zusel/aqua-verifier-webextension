import * as nameResolver from "./name_resolver"

const html = document.querySelector("html");

if (html) {
  (async () => {
    const daMeta = document.querySelector(`meta[name="data-accounting-mediawiki"]`);
    if (!daMeta) {
      // Do nothing if the page is not a data accounting page!
      return;
    }

    const parsedTable = await nameResolver.getNameResolutionTable();
    if (!parsedTable) {
      return;
    }

    nameResolver.replaceAllAddresses(html, parsedTable);
  })();
}
