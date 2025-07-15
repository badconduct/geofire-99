window.GeoFire = window.GeoFire || {};

// --- JSON Polyfills for IE6/7 ---
if (typeof JSON !== 'object') {
  JSON = {};
}

// Barebones IE6-safe JSON.stringify for diagnostics.
// This version is heavily simplified to avoid structures that crash old parsers.
if (typeof JSON.stringify !== 'function') {
  JSON.stringify = function (obj) {
    var t = typeof obj;
    if (t !== 'object' || obj === null) {
      if (t === 'string') {
        // VERY basic escaping for quotes and backslashes.
        obj = obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return '"' + obj + '"';
      }
      return String(obj);
    } else {
      var n,
        v,
        json = [],
        arr = obj.constructor === Array;
      for (n in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, n)) {
          v = obj[n];
          t = typeof v;
          if (v === undefined || t === 'function') {
            continue; // Skip functions and undefined
          }
          if (t === 'string') {
            v = v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            v = '"' + v + '"';
          } else if (t === 'object' && v !== null) {
            v = JSON.stringify(v);
          } else {
            v = String(v);
          }
          json.push((arr ? '' : '"' + n + '":') + v);
        }
      }
      return (arr ? '[' : '{') + String(json) + (arr ? ']' : '}');
    }
  };
}

// IE6-compatible JSON.parse polyfill.
// Other scripts in the application require `JSON.parse` to exist.
// This version uses `eval`, which is consistent with the existing `ajax`
// function and avoids introducing new regexes that might also crash IE6.
if (typeof JSON.parse !== 'function') {
  JSON.parse = function (text) {
    return eval('(' + text + ')');
  };
}

window.GeoFire.utils = {
  ajax: function (options, callback) {
    var xhr = null;

    // Try modern XMLHttpRequest first
    if (window.XMLHttpRequest) {
      try {
        xhr = new XMLHttpRequest();
      } catch (e) {
        xhr = null;
      }
    }

    // Fallback to ActiveXObject for IE6/IE5
    if (!xhr && window.ActiveXObject) {
      var activexNames = ['Msxml2.XMLHTTP.6.0', 'Msxml2.XMLHTTP.3.0', 'Microsoft.XMLHTTP'];
      for (var i = 0; i < activexNames.length; i++) {
        try {
          xhr = new ActiveXObject(activexNames[i]);
          break;
        } catch (e) {
          // Try next
        }
      }
    }

    if (!xhr) {
      setTimeout(function () {
        callback('AJAX is not supported by your browser.', null);
      }, 0);
      return;
    }

    try {
      xhr.open(options.method || 'GET', options.url, true);
    } catch (e) {
      setTimeout(function () {
        callback('AJAX open() failed: ' + e.message, null);
      }, 0);
      return;
    }

    // Set headers for POST requests
    if (options.method && options.method.toUpperCase() === 'POST') {
      try {
        if (options.contentType) {
          xhr.setRequestHeader('Content-Type', options.contentType);
        } else {
          xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
      } catch (e) {
        // IE6 can throw if setting headers improperly
      }
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;

      // Defensive try-catch to avoid IE6 crashes on responseText access
      try {
        var status = xhr.status;
        var responseText = xhr.responseText;
      } catch (e) {
        callback('AJAX read error: ' + e.message, null);
        return;
      }

      if (status >= 200 && status < 400) {
        var data = responseText;
        // Try parse JSON, fallback to raw response
        try {
          data = eval('(' + responseText + ')');
        } catch (e) {
          // Return raw text if JSON parse fails
        }
        callback(null, data);
      } else {
        // Attempt to parse error message from response
        var errorMsg = 'Server returned status ' + status;
        try {
          var errObj = eval('(' + responseText + ')');
          if (errObj && errObj.message) errorMsg = errObj.message;
        } catch (e) {}
        callback(errorMsg, null);
      }
    };

    try {
      if (options.method && options.method.toUpperCase() === 'POST' && options.data) {
        var postData = '';

        if (options.contentType === 'application/json') {
          postData = JSON.stringify(options.data);
        } else {
          var params = [];
          for (var key in options.data) {
            if (options.data.hasOwnProperty(key)) {
              params.push(encodeURIComponent(key) + '=' + encodeURIComponent(options.data[key]));
            }
          }
          postData = params.join('&');
        }
        xhr.send(postData);
      } else {
        xhr.send();
      }
    } catch (e) {
      setTimeout(function () {
        callback('AJAX send() failed: ' + e.message, null);
      }, 0);
    }
  },

  createCookie: function (name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toGMTString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
  },

  readCookie: function (name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  debounce: function (func, wait) {
    var timeout;
    return function () {
      var context = this;
      var args = arguments;
      var later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  mergeOptions: function (target, source) {
    target = target || {};
    source = source || {};
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
    return target;
  },

  showNotification: function (message, title) {
    // IE6 FIX: Replace || with a more stable if check.
    if (!title) {
      title = "GeoFire '99";
    }
    var overlay = document.createElement('div');
    // IE6 FIX: Apply styles individually to avoid cssText parsing errors from file corruption.
    overlay.style.position = 'absolute';
    overlay.style.top = '0px';
    overlay.style.left = '0px';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = '#000';
    overlay.style.filter = 'alpha(opacity=10)'; // Proprietary IE alpha filter
    overlay.style.zIndex = '999';

    var msgbox = document.createElement('div');
    // IE6 FIX: Apply styles individually.
    msgbox.style.background = '#c0c0c0';
    msgbox.style.borderTop = '2px solid #ffffff';
    msgbox.style.borderLeft = '2px solid #ffffff';
    msgbox.style.borderRight = '2px solid #000000';
    msgbox.style.borderBottom = '2px solid #000000';
    msgbox.style.minWidth = '300px';
    msgbox.style.maxWidth = '500px';
    msgbox.style.position = 'absolute';

    var header = document.createElement('div');
    // IE6 FIX: Apply styles individually.
    header.style.background = '#000080';
    header.style.color = '#ffffff';
    header.style.fontWeight = 'bold';
    header.style.padding = '3px 5px';
    header.innerHTML = title;

    var body = document.createElement('div');
    // IE6 FIX: Apply styles individually.
    body.style.padding = '20px';
    body.style.lineHeight = '1.4';
    body.innerHTML = message.replace(/\n/g, '<br>');

    var footer = document.createElement('div');
    // IE6 FIX: Apply styles individually.
    footer.style.padding = '10px';
    footer.style.textAlign = 'center';

    // IE6 FIX: Use <input type="button"> which is more stable than <button>.
    var okButton = document.createElement('input');
    okButton.type = 'button';
    okButton.value = 'OK';
    okButton.className = 'retro-button';

    footer.appendChild(okButton);
    msgbox.appendChild(header);
    msgbox.appendChild(body);
    msgbox.appendChild(footer);
    overlay.appendChild(msgbox);
    document.body.appendChild(overlay);

    var viewportWidth = document.documentElement.clientWidth || document.body.clientWidth;
    var viewportHeight = document.documentElement.clientHeight || document.body.clientHeight;

    // IE6 FIX: Defer centering logic with setTimeout to allow the browser to render and calculate dimensions.
    setTimeout(function () {
      msgbox.style.left = (viewportWidth - msgbox.offsetWidth) / 2 + 'px';
      msgbox.style.top = (viewportHeight - msgbox.offsetHeight) / 2 + 'px';
    }, 0);

    okButton.focus();
    okButton.onclick = function () {
      document.body.removeChild(overlay);
    };
  },

  escapeHtml: function (text) {
    if (typeof text !== 'string') return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
