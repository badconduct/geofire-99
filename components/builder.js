window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

// Augment the builder object, creating it if it doesn't exist.
// This is a robust pattern that is not dependent on script load order.
(function (B) {
  var G = window.GeoFire;

  // IE6-safe Fallback: Ensure the global object G exists, and that API_URL is defined.
  // This prevents crashes from script load order issues where this script might run
  // before the main object is initialized.
  if (!G) {
    G = window.GeoFire = {};
  }
  if (typeof G.API_URL !== 'string') {
    G.API_URL = '/api';
  }

  // The self-reliant polyfills have been removed. This script now depends on
  // the robust, IE6-compatible functions in /lib/utils.js.

  // --- Window State Management ---
  var windowStates = {}; // { id: { top, left, width, height, zIndex } }

  function saveWindowStates() {
    // Use cookies for IE6 compatibility
    G.utils.createCookie('geoFireWindowStates', JSON.stringify(windowStates), 7);
  }

  function loadWindowStates() {
    // Use cookies for IE6 compatibility
    var saved = G.utils.readCookie('geoFireWindowStates');
    if (saved) {
      try {
        windowStates = JSON.parse(saved);
        // Recalculate highest z-index from loaded states
        var maxZ = 10;
        for (var id in windowStates) {
          if (windowStates[id] && windowStates[id].zIndex > maxZ) {
            maxZ = windowStates[id].zIndex;
          }
        }
        windowStates.highestZ = maxZ;
      } catch (e) {
        console.log('Could not load window states from cookie', e);
        windowStates = {};
      }
    }
    if (!windowStates.highestZ) {
      windowStates.highestZ = 10;
    }
  }

  // --- Shared State & Helpers (IE6-safe Rewrites) ---
  function getFileFromPath(path) {
    if (typeof path !== 'string') return null;

    var parts = path.split('/');
    var fileName = parts.length ? parts.pop() : null;
    var dir = getDirectoryFromPath(parts.join('/'));

    if (dir && typeof dir === 'object' && dir.children && typeof dir.children === 'object') {
      for (var i = 0; i < dir.children.length; i++) {
        var child = dir.children[i];
        if (child && child.name === fileName && child.type === 'file') {
          return child;
        }
      }
    }

    return null;
  }

  function getDirectoryFromPath(path) {
    if (
      !G ||
      !G.state ||
      !G.state.siteData ||
      !G.state.siteData.files ||
      typeof G.state.siteData.files !== 'object'
    ) {
      return null;
    }

    if (!path || path === 'root') return G.state.siteData.files;

    var parts = path.split('/');
    var currentLevel = G.state.siteData.files;

    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      if (!currentLevel.children || typeof currentLevel.children !== 'object') return null;

      var found = false;
      for (var j = 0; j < currentLevel.children.length; j++) {
        var child = currentLevel.children[j];
        if (child && child.name === parts[i]) {
          currentLevel = child;
          found = true;
          break;
        }
      }

      if (!found) return null;
    }

    return currentLevel;
  }

  function updateLocalFile(path, content) {
    if (typeof path !== 'string') return;

    var file = getFileFromPath(path);
    if (file && typeof file === 'object') {
      file.content = content;
      return;
    }

    var parts = path.split('/');
    var fileName = parts.length ? parts[parts.length - 1] : null;
    if (!fileName) return;

    parts.length = parts.length - 1; // remove fileName
    var parentPath = parts.join('/');
    var parentDir = getDirectoryFromPath(parentPath);

    if (parentDir && typeof parentDir === 'object' && parentDir.type === 'directory') {
      if (!parentDir.children || typeof parentDir.children.push !== 'function') {
        parentDir.children = [];
      }

      parentDir.children.push({
        name: fileName,
        type: 'file',
        content: content
      });
    }
  }

  // Shared helper for session errors to avoid code duplication
  function _handleSessionError(message) {
    var defaultMessage = 'Your session has expired or is invalid. Please sign in again.';
    if (G && G.utils && typeof G.utils.showNotification === 'function') {
      G.utils.showNotification(message || defaultMessage);
    } else {
      alert(message || defaultMessage);
    }
    window.location.href = '/';
  }

  function refreshFullFileTree(callback) {
    // IE6-safe Defensive Check: Using sequential 'if' statements to prevent
    // crashes from chained property access on null/undefined objects.
    if (!G || !G.state) {
      _handleSessionError('A critical error occurred: GeoFire core is not initialized.');
      return;
    }
    if (!G.utils || typeof G.utils.ajax !== 'function') {
      _handleSessionError('A critical error occurred: GeoFire AJAX utility is missing.');
      return;
    }
    if (!G.state.siteData || !G.state.siteData.username || !G.state.siteData.passwordHash) {
      _handleSessionError('Your session data is missing or incomplete. Please sign in again.');
      return;
    }
    if (typeof G.API_URL !== 'string') {
      _handleSessionError('A critical error occurred: API configuration is missing.');
      return;
    }

    G.utils.ajax(
      {
        method: 'POST',
        url: G.API_URL + '/login',
        data: {
          username: G.state.siteData.username,
          passwordHash: G.state.siteData.passwordHash
        }
      },
      function (err, data) {
        if (err) {
          G.utils.showNotification('Session expired. Please log in again.');
          window.location.href = '/';
        } else {
          G.state.siteData = data.siteData;
          if (callback) callback();
        }
      }
    );
  }

  function saveAllFiles(fileChanges, callback) {
    // IE6-safe Defensive Check, mirroring the one in refreshFullFileTree.
    if (!G || !G.state) {
      _handleSessionError('A critical error occurred: GeoFire core is not initialized.');
      return;
    }
    if (!G.utils || typeof G.utils.ajax !== 'function') {
      _handleSessionError('A critical error occurred: GeoFire AJAX utility is missing.');
      return;
    }
    if (!G.state.siteData || !G.state.siteData.username || !G.state.siteData.passwordHash) {
      _handleSessionError('Your session data is missing or incomplete. Please sign in again.');
      return;
    }
    if (typeof G.API_URL !== 'string') {
      _handleSessionError('A critical error occurred: API configuration is missing.');
      return;
    }

    var index = 0;
    function saveNext() {
      if (index >= fileChanges.length) {
        if (callback) callback();
        return;
      }
      var file = fileChanges[index];
      index++;

      G.utils.ajax(
        {
          method: 'POST',
          url: G.API_URL + '/file',
          data: {
            username: G.state.siteData.username,
            passwordHash: G.state.siteData.passwordHash,
            neighborhoodCode: G.state.siteData.neighborhoodCode,
            filePath: file.filePath,
            content: file.content
          }
        },
        function (err, data) {
          if (err) {
            G.utils.showNotification('Error saving file ' + file.filePath + ': ' + err);
          } else {
            updateLocalFile(file.filePath, file.content);
            saveNext();
          }
        }
      );
    }
    saveNext();
  }

  // --- Attach public coordinator functions to B ---
  B.getWindowState = function (id) {
    return windowStates[id] || {};
  };
  B.updateWindowState = function (id, state) {
    windowStates[id] = state;
    saveWindowStates();
  };
  B.bringToFront = function (id) {
    var win = document.getElementById(id);
    if (!win) return;
    windowStates.highestZ++;
    win.style.zIndex = windowStates.highestZ;
    // Update state and save
    if (windowStates[id]) {
      windowStates[id].zIndex = windowStates.highestZ;
      saveWindowStates();
    }
  };
  B.refreshPreview = function () {
    var previewFrame = document.getElementById('main-preview-frame');
    if (!previewFrame) return;

    var siteUrl =
      '/' +
      G.state.siteData.neighborhoodCode +
      '/' +
      G.state.siteData.username +
      '/?t=' +
      new Date().getTime();
    previewFrame.src = siteUrl;
  };
  B.openFileInEditor = function (filePath) {
    G.state.activeFilePath = filePath;
    B.codeEditor.launch();
  };
  B.refreshFileManager = function () {
    if (B.fileManager.isOpen()) {
      B.fileManager.refresh();
    }
  };
  B.refreshAll = function () {
    refreshFullFileTree(function () {
      B.refreshFileManager();
      if (B.codeEditor.isOpen()) {
        B.codeEditor.refresh();
      }
      B.refreshPreview();
    });
  };
  B.getFileFromPath = getFileFromPath;
  B.getDirectoryFromPath = getDirectoryFromPath;
  B.updateLocalFile = updateLocalFile;
  B.saveAllFiles = saveAllFiles;
  B.refreshFullFileTree = refreshFullFileTree;

  B.render = function () {
    document.body.className = 'builder-body';
    loadWindowStates(); // Load saved layouts on render

    var siteUrl = '/' + G.state.siteData.neighborhoodCode + '/' + G.state.siteData.username;
    var previewUrl = siteUrl + '/?t=' + new Date().getTime(); // Add cache-busting timestamp

    var headerHtml =
      '<table width="100%"><tr>' +
      '<td><img src="/assets/images/welcome_icon.gif" align="absmiddle" style="margin-right:10px;"/><b style="font-size:14pt">GeoFire \'99 Site Builder</b></td>' +
      '<td align="right"><b>Site:</b> <a href="' +
      siteUrl +
      '" target="_blank">' +
      G.state.siteData.username +
      '</a>' +
      ' | <button id="builder-refresh-button" class="retro-button">Refresh Preview</button>' +
      ' | <button id="builder-ai-button" class="retro-button">AI Assistant</button>' +
      ' <button id="builder-editor-button" class="retro-button">Code Editor</button>' +
      ' <button id="builder-files-button" class="retro-button">File Explorer</button>' +
      ' | <button id="builder-plugins-button" class="retro-button">Plugins</button>' +
      ' | <button id="builder-home-button" class="retro-button">Home</button>' +
      ' <button id="builder-logout-button" class="retro-button">Sign Out</button>' +
      '</td></tr></table>';

    // Use a table-based layout for IE6 compatibility
    return (
      '<table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0">' +
      // Header Row
      '<tr><td height="1" class="builder-header">' +
      headerHtml +
      '</td></tr>' +
      // Content Row
      '<tr><td class="builder-content">' +
      '<iframe id="main-preview-frame" src="' +
      previewUrl +
      '"></iframe>' +
      '</td></tr>' +
      '</table>'
    );
  };

  B.attachEvents = function () {
    document.getElementById('builder-logout-button').onclick = function () {
      // Clear all session cookies
      G.utils.createCookie('geoFireLogin', '', -1);
      G.utils.createCookie('geoFireBuilderData', '', -1);
      window.location.href = '/';
    };

    document.getElementById('builder-home-button').onclick = function () {
      window.location.href = '/';
    };
    document.getElementById('builder-refresh-button').onclick = function () {
      B.refreshPreview();
    };

    // Launch module windows with a defensive check to prevent crashes
    // if a module's script fails to load.
    function launchModule(moduleName, moduleObject) {
      if (moduleObject && typeof moduleObject.launch === 'function') {
        moduleObject.launch();
      } else {
        G.utils.showNotification(
          'Error: The ' + moduleName + ' component failed to load. Please try refreshing the page.'
        );
      }
    }

    document.getElementById('builder-ai-button').onclick = function () {
      launchModule('AI Assistant', B.aiAssistant);
    };
    document.getElementById('builder-editor-button').onclick = function () {
      launchModule('Code Editor', B.codeEditor);
    };
    document.getElementById('builder-files-button').onclick = function () {
      launchModule('File Explorer', B.fileManager);
    };
    document.getElementById('builder-plugins-button').onclick = function () {
      launchModule('Plugin Manager', B.pluginManager);
    };
  };
})((window.GeoFire.components.builder = window.GeoFire.components.builder || {}));
