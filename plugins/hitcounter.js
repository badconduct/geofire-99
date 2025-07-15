const fs = require('fs');
const path = require('path');
const storage = require('../lib/storage.js');
const escapeHtml = require('./plugin_utils.js');

const LOG_PREFIX = '[HitCounter Plugin]';
const HIT_COUNTS_FILE = path.join(__dirname, '..', 'hit_counts.json');

const hitCounter = {};

function _getHitCounts() {
  if (!fs.existsSync(HIT_COUNTS_FILE)) return {};
  try {
    const data = fs.readFileSync(HIT_COUNTS_FILE, 'utf-8');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error(`${LOG_PREFIX} Error reading hit counts file:`, e);
    return {};
  }
}

function _saveHitCounts(counts) {
  try {
    fs.writeFileSync(HIT_COUNTS_FILE, JSON.stringify(counts, null, 2));
  } catch (e) {
    console.error(`${LOG_PREFIX} Error saving hit counts file:`, e);
  }
}

/**
 * Generates the HTML snippet for the hit counter.
 * @param {string} username The user's site name.
 * @returns {string} The HTML snippet.
 */
hitCounter.getSnippet = function (username) {
  // Security Hardening: Escape username to prevent XSS.
  return `<!-- Hit Counter Plugin --><br><center><img src="/api/plugins/hitcounter?site=${escapeHtml(
    username
  )}" alt="Hit Counter"></center><!-- /Hit Counter Plugin -->`;
};

/**
 * Handles the request to generate and serve the hit counter SVG image.
 * @param {string} siteUsername The user's site name.
 * @param {string} referer The referring URL, used to make the counter page-specific.
 * @param {object} res The Express response object.
 */
hitCounter.getImage = function (siteUsername, referer, res) {
  const userLocation = storage.findUser(siteUsername);
  if (!userLocation) {
    const svg = `<svg width="88" height="18" xmlns="http://www.w3.org/2000/svg" />`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(svg);
    return;
  }

  const counts = _getHitCounts();
  const userSitePrefix = `/${userLocation.neighborhoodCode}/${siteUsername}`;
  const indexPageKey = userSitePrefix + '/index.html';

  let shouldIncrement = false;

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      // Ensure the referer is from this specific user's site
      if (refererUrl.pathname && refererUrl.pathname.startsWith(userSitePrefix)) {
        const relativePath = refererUrl.pathname.substring(userSitePrefix.length);
        // Only increment if the path is the root directory or the index.html page itself.
        if (relativePath === '' || relativePath === '/' || relativePath === 'index.html') {
          shouldIncrement = true;
        }
      }
    } catch (e) {
      console.warn(
        `${LOG_PREFIX} Could not parse referer URL: '${referer}'. Not incrementing count for ${siteUsername}.`
      );
    }
  }

  if (shouldIncrement) {
    counts[indexPageKey] = (counts[indexPageKey] || 0) + 1;
    _saveHitCounts(counts);
  }

  const countString = (counts[indexPageKey] || 0).toString().padStart(6, '0');
  const svg = `<svg width="88" height="18" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000" /><text x="4" y="14" font-family="Monospace, Courier New" font-size="16" fill="#00FF00">${countString}</text></svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(svg);
};

/**
 * Resets all hit counts for a specific user's site.
 * @param {string} username The user's site name.
 * @param {string} neighborhoodCode The user's neighborhood.
 * @returns {object} A result object with success status.
 */
hitCounter.resetCounter = function (username, neighborhoodCode) {
  console.log(`${LOG_PREFIX} Resetting counters for ${username} in ${neighborhoodCode}`);
  const counts = _getHitCounts();
  const sitePrefix = `/${neighborhoodCode}/${username}/`;

  let deletedCount = 0;
  const keysToDelete = [];
  for (const key in counts) {
    if (Object.prototype.hasOwnProperty.call(counts, key) && key.startsWith(sitePrefix)) {
      keysToDelete.push(key);
    }
  }

  for (var i = 0; i < keysToDelete.length; i++) {
    delete counts[keysToDelete[i]];
    deletedCount++;
  }

  if (deletedCount > 0) {
    _saveHitCounts(counts);
    console.log(`${LOG_PREFIX} Deleted ${deletedCount} counter entries for ${username}.`);
  } else {
    console.log(`${LOG_PREFIX} No counter entries found for ${username} to reset.`);
  }

  return { success: true, message: 'Hit counters reset successfully.' };
};

module.exports = hitCounter;
