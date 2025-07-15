const escapeHtml = require('./plugin_utils.js');

const mousetrails = {};

mousetrails.getSnippet = function (username, neighborhoodCode, options) {
  if (!options || !options.effect) {
    return '<!-- Animated Mouse Trails Plugin Error: No effect selected. -->';
  }
  return `<!-- Animated Mouse Trails Plugin -->\n<script type="text/javascript" src="/assets/js/${escapeHtml(
    options.effect
  )}"></script>\n<!-- /Animated Mouse Trails Plugin -->`;
};

module.exports = mousetrails;
