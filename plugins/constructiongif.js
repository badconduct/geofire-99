const escapeHtml = require('./plugin_utils.js');

const constructiongif = {};

constructiongif.getSnippet = function (username, neighborhoodCode, options) {
  if (!options || !options.gif) {
    return '<!-- Under Construction GIF Plugin Error: No GIF selected. -->';
  }
  return `<!-- Under Construction GIF Plugin -->\n<br><center><img src="/assets/images/construction/${escapeHtml(
    options.gif
  )}" alt="Under Construction"></center>\n<!-- /Under Construction GIF Plugin -->`;
};

module.exports = constructiongif;
