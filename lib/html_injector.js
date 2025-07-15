// lib/html_injector.js

/**
 * Injects a snippet of HTML into a full HTML document string.
 * It intelligently places scripts and bgsound in the head, and other content in the body.
 *
 * @param {string} htmlContent The full HTML document.
 * @param {string} snippet The HTML snippet to inject.
 * @returns {string} The modified HTML document.
 */
function inject(htmlContent, snippet) {
  if (!htmlContent || !snippet) {
    return htmlContent || '';
  }

  // Determine if the snippet is a "head" element (like a script or bgsound)
  const isHeadSnippet = snippet.indexOf('<script') !== -1 || snippet.indexOf('<bgsound') !== -1;

  if (isHeadSnippet) {
    // For scripts or bgsound, try to inject into <head> first
    if (/<\/head>/i.test(htmlContent)) {
      return htmlContent.replace(/<\/head>/i, `\n${snippet}\n</head>`);
    }
    // Fallback to <body> for scripts if <head> is missing
    if (/<\/body>/i.test(htmlContent)) {
      return htmlContent.replace(/<\/body>/i, `\n${snippet}\n</body>`);
    }
    // Last resort append for malformed HTML
    return htmlContent + `\n${snippet}`;
  } else {
    // For body content (img, table, etc.), inject before </body>
    if (/<\/body>/i.test(htmlContent)) {
      return htmlContent.replace(/<\/body>/i, `\n${snippet}\n</body>`);
    }
    // Fallback for body content is just appending.
    return htmlContent + `\n${snippet}`;
  }
}

// Export the function directly for more robust require() behavior.
module.exports = inject;
