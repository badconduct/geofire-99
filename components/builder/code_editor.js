window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

// Augment the builder object, creating it if it doesn't exist.
(function (B) {
  var G = window.GeoFire;
  var renderDraggable = G.components.renderDraggableWindow;

  var windowEl = null;
  var windowId = 'code-editor-window';

  var debouncedPreview = G.utils.debounce(function () {
    if (!windowEl) return;
    var content = document.getElementById('editor-textarea-window').value;
    B.updateLocalFile(G.state.activeFilePath, content);
    B.refreshPreview();
  }, 750);

  function renderContent() {
    // Use a table-based layout for IE6 compatibility
    return (
      '<table width="100%" height="100%" cellpadding="0" cellspacing="0">' +
      // Textarea row
      '<tr>' +
      '<td style="height:100%;">' +
      '<textarea id="editor-textarea-window" class="builder-editor retro-textarea" style="width:100%; height:100%; box-sizing:border-box;"></textarea>' +
      '</td>' +
      '</tr>' +
      // Button row
      '<tr>' +
      '<td height="1" align="right" style="padding-top:4px;">' +
      '<button id="editor-save-button" class="retro-button">Save Changes</button>' +
      '</td>' +
      '</tr>' +
      '</table>'
    );
  }

  function handleSave() {
    if (!windowEl) return;
    var content = document.getElementById('editor-textarea-window').value;
    var saveButton = document.getElementById('editor-save-button');

    saveButton.disabled = true;
    saveButton.innerHTML = 'Saving...';

    B.saveAllFiles([{ filePath: G.state.activeFilePath, content: content }], function () {
      saveButton.disabled = false;
      saveButton.innerHTML = 'Save Changes';
      // G.utils.showNotification('File "' + G.state.activeFilePath + '" saved.'); // Removed per user request
      B.refreshPreview();
    });
  }

  function loadActiveFile() {
    if (!windowEl) return;
    var fileToEdit = B.getFileFromPath(G.state.activeFilePath);
    var content = fileToEdit ? fileToEdit.content : '';
    document.getElementById('editor-textarea-window').value = content;

    var divs = windowEl.getElementsByTagName('div');
    var titleSpan = null;
    for (var i = 0; i < divs.length; i++) {
      if (divs[i].className === 'popup-title') {
        var spans = divs[i].getElementsByTagName('span');
        if (spans.length > 0) {
          titleSpan = spans[0];
          break;
        }
      }
    }
    if (titleSpan) {
      titleSpan.innerHTML = 'Code Editor - ' + G.state.activeFilePath;
    }
  }

  function attachEvents() {
    if (!windowEl) return;
    document.getElementById('editor-save-button').onclick = handleSave;
    var textarea = document.getElementById('editor-textarea-window');
    textarea.onkeyup = function () {
      // A direct preview is too slow, so we'll only update the main preview on save
      // to keep the 90s feel. An instant preview feels too modern.
    };
  }

  B.codeEditor = {
    isOpen: function () {
      return !!windowEl;
    },
    refresh: function () {
      if (this.isOpen()) {
        loadActiveFile();
      }
    },
    launch: function () {
      if (document.getElementById(windowId)) {
        B.bringToFront(windowId);
        loadActiveFile();
        return;
      }

      var defaultState = {
        width: '600px',
        height: '500px',
        top: '80px',
        left: '250px',
        icon: '/assets/images/text_icon.gif'
      };
      var savedState = B.getWindowState(windowId);
      var options = G.utils.mergeOptions(defaultState, savedState);
      options.onStateChange = B.updateWindowState;

      windowEl = renderDraggable(
        windowId,
        'Code Editor',
        renderContent(),
        options,
        function () {
          windowEl = null;
        } // On close
      );

      var builderContent = document.getElementsByTagName('body')[0]; // Fallback for builder content area
      var builderContentAreas = document.getElementsByTagName('td');
      for (var i = 0; i < builderContentAreas.length; i++) {
        if (builderContentAreas[i].className === 'builder-content') {
          builderContent = builderContentAreas[i];
          break;
        }
      }
      builderContent.appendChild(windowEl);

      B.bringToFront(windowId);
      loadActiveFile();
      attachEvents();
    }
  };
})((window.GeoFire.components.builder = window.GeoFire.components.builder || {}));
