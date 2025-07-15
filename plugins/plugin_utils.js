// Shared utility functions for GeoFire '99 plugins

/**
 * Escapes special HTML characters in a string to prevent XSS attacks.
 * @param {string} unsafe The string to escape.
 * @returns {string} The escaped, HTML-safe string.
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export the function directly for more robust 'require' behavior.
module.exports = escapeHtml;
