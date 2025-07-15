const fs = require('fs');
const path = require('path');
const escapeHtml = require('./plugin_utils.js');

const SITES_DIR = path.join(__dirname, '..', 'user_sites');

const webring = {};

function _getWebRingNeighbors(username, neighborhoodCode) {
  const hoodDir = path.join(SITES_DIR, neighborhoodCode);
  if (!fs.existsSync(hoodDir)) return { prev: null, next: null };

  const users = fs
    .readdirSync(hoodDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  if (users.length < 2) return { prev: null, next: null };

  const currentIndex = users.findIndex(u => u.toLowerCase() === username.toLowerCase());
  if (currentIndex === -1) return { prev: null, next: null };

  const prevIndex = (currentIndex - 1 + users.length) % users.length;
  const nextIndex = (currentIndex + 1) % users.length;
  return { prev: users[prevIndex], next: users[nextIndex] };
}

webring.getSnippet = function (username, neighborhoodCode) {
  const neighbors = _getWebRingNeighbors(username, neighborhoodCode);
  if (!neighbors.prev || !neighbors.next || neighbors.prev === username) {
    return '<!-- Web Ring Plugin: Not enough members in this neighborhood yet. -->';
  }
  const prevUrl = `/${neighborhoodCode}/${neighbors.prev}/`;
  const nextUrl = `/${neighborhoodCode}/${neighbors.next}/`;
  const randomUrl = `/api/plugins/webring/random?currentUser=${username}&neighborhoodCode=${neighborhoodCode}`;
  return `<!-- Web Ring Plugin -->
<br><center>
<table width="90%" border="2" cellpadding="3" cellspacing="0" style="border-style:outset; background-color:#c0c0c0;"><tr><td align="center" style="font-size:7pt; font-family:arial,sans-serif;">This page is a proud member of the <b>${escapeHtml(
    neighborhoodCode
  )} Web Ring</b>.<br>[ <a href="${prevUrl}">Previous</a> | <a href="${randomUrl}">Random</a> | <a href="${nextUrl}">Next</a> ]</td></tr></table>
</center>
<!-- /Web Ring Plugin -->`;
};

webring.getRandomNeighbor = function (currentUser, neighborhoodCode) {
  const hoodDir = path.join(SITES_DIR, neighborhoodCode);
  if (!fs.existsSync(hoodDir)) return null;

  const users = fs
    .readdirSync(hoodDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(u => u.toLowerCase() !== currentUser.toLowerCase());

  if (users.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * users.length);
  return users[randomIndex];
};

module.exports = webring;
