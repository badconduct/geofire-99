const fs = require('fs');
const path = require('path');
const storage = require('../lib/storage.js');
const escapeHtml = require('./plugin_utils.js');

const LOG_PREFIX = '[BGMusic Plugin]';
const bgmusic = {};

bgmusic.getSnippet = function (username, neighborhoodCode, options) {
  if (!options || !options.file) {
    return '<!-- Background Music (MIDI) Plugin Error: No file selected. -->';
  }
  return `<!-- Background Music (MIDI) Plugin -->\n<bgsound src="sounds/${escapeHtml(
    options.file
  )}" loop="infinite">\n<!-- /Background Music (MIDI) Plugin -->`;
};

bgmusic.getDynamicOptions = function (username, neighborhoodCode) {
  const userDirResult = storage.getSecureFilePath(username, neighborhoodCode, '');
  let choices = [];

  if (!userDirResult || typeof userDirResult.fullPath !== 'string') {
    console.error(
      `${LOG_PREFIX} Invalid userDirResult for ${username}. Cannot get dynamic options. Result:`,
      userDirResult
    );
  } else {
    try {
      const soundsDir = path.join(userDirResult.fullPath, 'sounds');
      if (fs.existsSync(soundsDir) && fs.statSync(soundsDir).isDirectory()) {
        choices = fs
          .readdirSync(soundsDir)
          .filter(f => f.toLowerCase().endsWith('.mid') || f.toLowerCase().endsWith('.midi'))
          .map(f => ({ value: f, text: f }));
      }
    } catch (e) {
      console.error(`${LOG_PREFIX} Error reading sounds folder for ${username}:`, e);
    }
  }

  return {
    file: {
      label: 'MIDI File:',
      choices: choices
    }
  };
};

module.exports = bgmusic;
