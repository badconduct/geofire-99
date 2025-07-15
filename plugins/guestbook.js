const fs = require('fs');
const path = require('path');
const storage = require('../lib/storage.js');
const escapeHtml = require('./plugin_utils.js');

const guestbook = {};

/**
 * A comprehensive function to get all styling elements from the user's index.html.
 * @param {string} username The user's site name.
 * @param {string} neighborhoodCode The user's neighborhood.
 * @returns {{headTags: string, bodyTag: string}} An object containing styling tags for the head and the complete body tag.
 */
function _getUserPageStyling(username, neighborhoodCode) {
  const indexPathResult = storage.getSecureFilePath(username, neighborhoodCode, 'index.html');
  const defaultStyling = {
    headTags: '<link rel="stylesheet" type="text/css" href="style.css">',
    bodyTag: '<body>'
  };

  if (!indexPathResult.success || !fs.existsSync(indexPathResult.fullPath)) {
    return defaultStyling;
  }

  try {
    const indexContent = fs.readFileSync(indexPathResult.fullPath, 'utf-8');
    let headTags = '';

    // Match all <link rel="stylesheet" ...> tags
    const linkMatches = indexContent.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi);
    if (linkMatches) {
      headTags += linkMatches.join('\n');
    }
    // Match all <style>...</style> blocks
    const styleMatches = indexContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
    if (styleMatches) {
      headTags += '\n' + styleMatches.join('\n');
    }

    // Match the body tag
    let bodyTag = '<body>';
    const bodyMatch = indexContent.match(/<body[^>]*>/i);
    if (bodyMatch) {
      // Strip JS event handlers (e.g., onload) for security.
      bodyTag = bodyMatch[0].replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+)/gi, '');
    }

    // If no link/style tags were found in head, fall back to default style.css link
    if (headTags.trim() === '') {
      headTags = '<link rel="stylesheet" type="text/css" href="style.css">';
    }

    return { headTags: headTags, bodyTag: bodyTag };
  } catch (e) {
    console.error(`Guestbook plugin: Could not read index.html for styling for ${username}`, e);
    return defaultStyling;
  }
}

function _getGuestbookHTML(siteUsername, entries, pageStyling) {
  let entriesHtml = '<p style="font-style:italic;">Be the first to sign!</p>';
  if (entries && entries.length > 0) {
    entriesHtml = entries
      .map(entry => {
        return `<table width="80%" cellpadding="5" style="border-bottom: 1px dotted #000000; margin-bottom: 10px;">
                <tr>
                    <td>
                        <p><b>From:</b> ${escapeHtml(entry.name)}</p>
                        <p><small><b>Date:</b> ${escapeHtml(entry.date)}</small></p>
                        <br>
                        <p>${escapeHtml(entry.message).replace(/\n/g, '<br>')}</p>
                    </td>
                </tr>
            </table>`;
      })
      .join('\n');
  }

  const headTags =
    pageStyling && pageStyling.headTags
      ? pageStyling.headTags
      : '<link rel="stylesheet" type="text/css" href="style.css">';
  const bodyTag = pageStyling && pageStyling.bodyTag ? pageStyling.bodyTag : '<body>';

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
    <title>${escapeHtml(siteUsername)}'s Guestbook</title>
    ${headTags}
</head>
${bodyTag}
    <center>
        <h1>Sign My Guestbook!</h1>
        <form action="/api/plugins/guestbook/add" method="POST">
            <input type="hidden" name="site" value="${escapeHtml(siteUsername)}">
            <table cellpadding="5">
                <tr>
                    <td align="right"><b>Name:</b></td>
                    <td><input type="text" name="name" size="30"></td>
                </tr>
                <tr>
                    <td align="right" valign="top"><b>Message:</b></td>
                    <td><textarea name="message" rows="4" cols="40"></textarea></td>
                </tr>
                <tr>
                    <td></td>
                    <td><input type="submit" value="Sign Guestbook"></td>
                </tr>
            </table>
        </form>
        <hr width="80%">
        <h2>Entries</h2>
        ${entriesHtml}
        <br>
        <p><a href="index.html">Back to Home Page</a></p>
    </center>
</body>
</html>`;
}

function _getGuestbookPath(siteUsername, file = 'guestbook.json') {
  const userLocation = storage.findUser(siteUsername);
  if (!userLocation) return null;
  const securePath = storage.getSecureFilePath(siteUsername, userLocation.neighborhoodCode, file);
  return securePath.success ? securePath.fullPath : null;
}

guestbook.getSnippet = function (username, neighborhoodCode, options) {
  const displayMode = options && options.displayMode ? options.displayMode : 'link';
  if (displayMode === 'embed') {
    return `<!-- Guestbook Plugin -->
<br><center>
<table width="90%" border="2" cellpadding="5" cellspacing="0" style="border-style:outset; background-color:#c0c0c0;">
<tr><td align="center">
  <b>Sign My Guestbook!</b>
  <form action="/api/plugins/guestbook/add" method="POST" style="margin-top:5px;">
    <input type="hidden" name="site" value="${escapeHtml(username)}">
    <b>Name:</b> <input type="text" name="name" size="20"><br>
    <textarea name="message" rows="2" cols="25" style="margin:4px 0;"></textarea><br>
    <input type="submit" value="Sign" style="font-size:7pt; padding:2px 8px;"/>
    <a href="guestbook.html" style="font-size:7pt; margin-left:10px;">View All Entries</a>
  </form>
</td></tr>
</table>
</center>
<!-- /Guestbook Plugin -->`;
  }
  // Default to link
  return `<!-- Guestbook Plugin --><br><center><p><a href="guestbook.html">Sign my Guestbook!</a></p></center><!-- /Guestbook Plugin -->`;
};

guestbook.onInstall = function (username, neighborhoodCode) {
  const guestbookHtmlPath = _getGuestbookPath(username, 'guestbook.html');
  const guestbookJsonPath = _getGuestbookPath(username, 'guestbook.json');

  if (guestbookHtmlPath && !fs.existsSync(guestbookHtmlPath)) {
    const pageStyling = _getUserPageStyling(username, neighborhoodCode);
    const guestbookContent = _getGuestbookHTML(username, [], pageStyling);
    storage.updateFile(username, neighborhoodCode, 'guestbook.html', guestbookContent);
  }
  if (guestbookJsonPath && !fs.existsSync(guestbookJsonPath)) {
    storage.updateFile(username, neighborhoodCode, 'guestbook.json', '[]');
  }
};

guestbook.onUninstall = function (username, neighborhoodCode) {
  storage.deletePath(username, neighborhoodCode, 'guestbook.html');
  storage.deletePath(username, neighborhoodCode, 'guestbook.json');
};

guestbook.addEntry = function (siteUsername, entry) {
  const userLocation = storage.findUser(siteUsername);
  if (!userLocation) return { success: false, message: 'User not found.' };

  const guestbookJsonPath = _getGuestbookPath(siteUsername);
  let entries = [];
  if (guestbookJsonPath && fs.existsSync(guestbookJsonPath)) {
    try {
      entries = JSON.parse(fs.readFileSync(guestbookJsonPath, 'utf-8'));
    } catch (e) {
      /* ignore parse error, will overwrite */
    }
  }

  entries.unshift({ name: entry.name, message: entry.message, date: new Date().toUTCString() });

  storage.updateFile(
    siteUsername,
    userLocation.neighborhoodCode,
    'guestbook.json',
    JSON.stringify(entries, null, 2)
  );

  const pageStyling = _getUserPageStyling(siteUsername, userLocation.neighborhoodCode);
  const htmlContent = _getGuestbookHTML(siteUsername, entries, pageStyling);
  storage.updateFile(siteUsername, userLocation.neighborhoodCode, 'guestbook.html', htmlContent);

  return {
    success: true,
    redirectUrl: `/${userLocation.neighborhoodCode}/${siteUsername}/guestbook.html`
  };
};

module.exports = guestbook;
