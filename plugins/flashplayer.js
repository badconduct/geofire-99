const fs = require('fs');
const path = require('path');
const storage = require('../lib/storage.js');

const LOG_PREFIX = '[FlashPlayer Plugin]';
const flashplayer = {};

// This plugin doesn't inject a visible snippet itself.
// The AI uses its "enabled" status to decide how to act.
// A comment is returned for clarity in the user's HTML source.
flashplayer.getSnippet = function () {
  return '<!-- Flash Player Plugin Enabled -->';
};

// When the plugin is installed, ensure the /flash directory exists.
flashplayer.onInstall = function (username, neighborhoodCode) {
  console.log(`${LOG_PREFIX} onInstall hook for ${username}. Ensuring /flash directory exists.`);
  const userDirResult = storage.getSecureFilePath(username, neighborhoodCode, '');
  if (userDirResult.success) {
    const flashDirPath = path.join(userDirResult.fullPath, 'flash');
    if (!fs.existsSync(flashDirPath)) {
      try {
        fs.mkdirSync(flashDirPath);
        console.log(`${LOG_PREFIX} Created /flash directory for ${username}.`);
      } catch (e) {
        console.error(`${LOG_PREFIX} Failed to create /flash directory for ${username}:`, e);
      }
    }
  }
};

// Uninstalling does not remove the /flash directory to prevent data loss.
flashplayer.onUninstall = function (username, neighborhoodCode) {
  console.log(
    `${LOG_PREFIX} onUninstall hook for ${username}. No action taken to preserve user files.`
  );
};

module.exports = flashplayer;
