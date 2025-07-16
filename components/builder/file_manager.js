window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

// Augment the builder object, creating it if it doesn't exist.
(function (B) {
  var G = window.GeoFire;
  var renderDraggable = G.components.renderDraggableWindow;

  var windowEl = null;
  var windowId = 'file-manager-window';
  var currentPath = ''; // Module-specific path state

  function renderContent() {
    var dir = B.getDirectoryFromPath(currentPath);
    var items = dir ? dir.children || [] : [];
    var html = '<ul style="padding-left:15px; margin:0; list-style-type:none;">';

    if (currentPath !== '') {
      html +=
        '<li><img src="/assets/images/folder_up_icon.gif" align="absmiddle"/> <a href="#" class="file-explorer-link" data-path="..">[.. Back]</a></li>';
    }

    items.sort(function (a, b) {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      // Hide the guestbook's internal data file from the user
      if (item.name === 'guestbook.json') continue;

      var itemFullPath = currentPath ? currentPath + '/' + item.name : item.name;

      var lowerCaseName = item.name.toLowerCase();
      var isSwfFile = lowerCaseName.endsWith('.swf');
      var imageExtensions = ['.gif', '.jpg', '.jpeg', '.png'];
      var isImageFile = false;
      for (var j = 0; j < imageExtensions.length; j++) {
        if (
          lowerCaseName.indexOf(
            imageExtensions[j],
            lowerCaseName.length - imageExtensions[j].length
          ) !== -1
        ) {
          isImageFile = true;
          break;
        }
      }

      var icon =
        item.type === 'directory'
          ? '/assets/images/folder_icon.gif'
          : isSwfFile
          ? '/assets/images/plugin_icon.gif'
          : isImageFile
          ? '/assets/images/image_icon.gif'
          : '/assets/images/text_icon.gif';

      var linkClass =
        itemFullPath === G.state.activeFilePath &&
        item.type === 'file' &&
        !isImageFile &&
        !isSwfFile
          ? 'style="background:#000080; color:#fff; text-decoration: none;"'
          : 'class="file-explorer-link"';
      var dataAction = item.type === 'file' ? 'data-action="edit"' : 'data-action="nav"';

      html +=
        '<li><img src="' +
        icon +
        '" align="absmiddle"/> <a href="#" data-path="' +
        itemFullPath +
        '" ' +
        dataAction +
        ' ' +
        linkClass +
        '>' +
        item.name +
        '</a>';
      html += '<span class="file-explorer-actions">';
      if (item.type === 'file') {
        var downloadUrl =
          G.API_URL +
          '/file/download?username=' +
          encodeURIComponent(G.state.siteData.username) +
          '&neighborhoodCode=' +
          encodeURIComponent(G.state.siteData.neighborhoodCode) +
          '&filePath=' +
          encodeURIComponent(itemFullPath);
        html +=
          '<a href="' +
          downloadUrl +
          '" data-action="download" title="Download File"><img src="/assets/images/download_icon.gif" align="absmiddle" border="0"/></a> ';
      }
      html +=
        '<a href="#" data-action="delete" data-path="' +
        itemFullPath +
        '" title="Delete"><img src="/assets/images/delete_icon.gif" align="absmiddle" border="0"/></a>';
      html += '</span></li>';
    }
    html += '</ul>';

    var buttons =
      '<div style="border-top: 1px solid #808080; padding: 4px; margin-top: 4px;">' +
      '<button id="fm-new-file-button" class="retro-button">New HTML</button> ';

    if (currentPath.indexOf('images') === 0 || currentPath === '') {
      buttons += '<button id="fm-new-folder-button" class="retro-button">New Folder</button> ';
    }

    if (currentPath === 'images' || currentPath === 'sounds' || currentPath === 'flash') {
      buttons += '<button id="fm-upload-button" class="retro-button">Upload File</button>';
      // The form and input will be part of the layout now for the iframe target technique
    }
    buttons += '</div>';

    // Use a table-based layout for IE6 compatibility
    var layout =
      '<table width="100%" height="100%" cellpadding="0" cellspacing="0">' +
      // File list row
      '<tr><td style="height:100%">' +
      '<div class="inset-box" style="width:100%; height:100%; box-sizing:border-box;">' +
      html +
      '</div>' +
      '</td></tr>' +
      // Button row
      '<tr><td height="1">' +
      buttons +
      '</td></tr>' +
      '</table>';

    // Add hidden form for uploads for IE6 compatibility
    var uploadForm =
      '<form id="fm-upload-form" target="" method="POST" enctype="multipart/form-data" action="' +
      G.API_URL +
      '/file/upload" style="display:none;width:0;height:0;">' +
      '<input type="file" name="file" id="fm-upload-input"/>' +
      '<input type="hidden" name="username" value=""/>' +
      '<input type="hidden" name="passwordHash" value=""/>' +
      '<input type="hidden" name="neighborhoodCode" value=""/>' +
      '</form>';

    return layout + uploadForm;
  }

  function refresh() {
    if (!windowEl) return;
    var tds = windowEl.getElementsByTagName('td');
    var contentArea = null;
    for (var i = 0; i < tds.length; i++) {
      if (tds[i].className === 'popup-content') {
        contentArea = tds[i];
        break;
      }
    }
    if (contentArea) {
      contentArea.innerHTML = renderContent();
    }
    attachEvents();
  }

  function handleFileClick(e) {
    var evt = e || window.event;
    var target = evt.target || evt.srcElement;
    var anchor = target;
    while (anchor && anchor.tagName !== 'A') {
      anchor = anchor.parentNode;
    }
    if (!anchor) return;

    var path = anchor.getAttribute('data-path');
    var action = anchor.getAttribute('data-action');

    if (action === 'download') return;

    if (evt.preventDefault) evt.preventDefault();
    else evt.returnValue = false;
    if (!path) return false;

    if (path === '..') {
      var parts = currentPath.split('/');
      parts.pop();
      currentPath = parts.join('/');
      refresh();
    } else if (action === 'edit') {
      var lowerCasePath = path.toLowerCase();

      if (lowerCasePath.endsWith('.swf')) {
        G.utils.showNotification(
          'Flash files (.swf) cannot be previewed directly.\n\nPlease ask the AI Assistant to embed the file onto an HTML page, then use the "Refresh Preview" button to see it in action.'
        );
        return false;
      }

      var imageExtensions = ['.gif', '.jpg', '.jpeg', '.png'];
      var isImage = false;
      for (var i = 0; i < imageExtensions.length; i++) {
        if (
          lowerCasePath.indexOf(
            imageExtensions[i],
            lowerCasePath.length - imageExtensions[i].length
          ) !== -1
        ) {
          isImage = true;
          break;
        }
      }

      if (isImage) {
        if (B.imagePreviewer && typeof B.imagePreviewer.launch === 'function') {
          B.imagePreviewer.launch(path);
        } else {
          G.utils.showNotification('Image Previewer component failed to load.');
        }
      } else {
        if (path === 'guestbook.html') {
          alert('The guestbook.html file is managed by a plugin and cannot be edited directly.');
          return false;
        }
        B.openFileInEditor(path);
      }
      refresh();
    } else if (action === 'nav') {
      currentPath = path;
      refresh();
    } else if (action === 'delete') {
      if (path === 'guestbook.html' || path === 'guestbook.json') {
        alert(
          'To remove the guestbook, please disable the Guestbook plugin in the Plugin Manager.'
        );
        return false;
      }
      handleDelete(path);
    }
    return false;
  }

  function handleDelete(path) {
    if (!confirm('Are you sure you want to delete "' + path + '"? This cannot be undone.')) return;
    G.utils.ajax(
      {
        method: 'POST',
        url: G.API_URL + '/file/delete',
        data: {
          username: G.state.siteData.username,
          passwordHash: G.state.siteData.passwordHash,
          neighborhoodCode: G.state.siteData.neighborhoodCode,
          targetPath: path
        }
      },
      function (err, data) {
        if (err) {
          G.utils.showNotification('Error: ' + err);
        } else {
          B.refreshFullFileTree(refresh);
        }
      }
    );
  }

  function handleNewFile() {
    var fileName = prompt('Enter a name for the new HTML file (e.g., about.html):', '');
    if (!fileName) return;

    G.utils.ajax(
      {
        method: 'POST',
        url: G.API_URL + '/file/create',
        data: {
          username: G.state.siteData.username,
          passwordHash: G.state.siteData.passwordHash,
          neighborhoodCode: G.state.siteData.neighborhoodCode,
          currentPath: currentPath,
          fileName: fileName
        }
      },
      function (err, data) {
        if (err) {
          G.utils.showNotification('Error: ' + err);
        } else {
          B.refreshFullFileTree(function () {
            refresh();
            var newFilePath = currentPath ? currentPath + '/' + fileName : fileName;
            B.openFileInEditor(newFilePath);
          });
        }
      }
    );
  }

  function handleNewFolder() {
    var folderName = prompt('Enter a name for the new folder:', '');
    if (!folderName) return;

    var newPath = currentPath ? currentPath + '/' + folderName : folderName;

    G.utils.ajax(
      {
        method: 'POST',
        url: G.API_URL + '/directory/create',
        data: {
          username: G.state.siteData.username,
          passwordHash: G.state.siteData.passwordHash,
          neighborhoodCode: G.state.siteData.neighborhoodCode,
          newDirectoryPath: newPath
        }
      },
      function (err, data) {
        if (err) {
          G.utils.showNotification('Error: ' + err);
        } else {
          B.refreshFullFileTree(refresh);
        }
      }
    );
  }

  // Retro-compatible file upload using hidden iframe
  function handleUpload() {
    if (!windowEl) return;
    var uploadBtn = document.getElementById('fm-upload-button');
    var form = document.getElementById('fm-upload-form');
    var fileInput = document.getElementById('fm-upload-input');

    if (!fileInput.value) {
      alert('Please select a file to upload.');
      return;
    }

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = 'Uploading...';

    // Set form values
    form.username.value = G.state.siteData.username;
    form.passwordHash.value = G.state.siteData.passwordHash;
    form.neighborhoodCode.value = G.state.siteData.neighborhoodCode;

    // Create iframe target
    var iframeName = 'upload_iframe_' + new Date().getTime();
    var iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    form.target = iframeName;

    iframe.onload = function () {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = 'Upload File';

      var responseJsonString;
      try {
        // IE6 Compatibility Fix: Server wraps response in a <textarea>.
        // This is a robust way to get the raw text content from the iframe.
        var iFrameDoc = iframe.contentWindow || iframe.contentDocument;
        if (iFrameDoc.document) iFrameDoc = iFrameDoc.document;

        var textarea = iFrameDoc.getElementsByTagName('textarea')[0];
        if (textarea) {
          responseJsonString = textarea.value;
        } else {
          // Fallback just in case, though it shouldn't be needed.
          responseJsonString = iFrameDoc.body.innerText || iFrameDoc.body.textContent;
        }
      } catch (e) {
        responseJsonString =
          '{"success": false, "message": "Upload failed due to a cross-domain security error."}';
      }

      var responseData = null;
      try {
        if (responseJsonString && responseJsonString.replace(/^\s+|\s+$/g, '').length > 0) {
          responseData = eval('(' + responseJsonString + ')');
        } else {
          throw new Error('Server sent an empty response.');
        }
      } catch (e) {
        G.utils.showNotification('Upload failed: Could not parse server response.');
        responseData = null;
      }

      if (responseData) {
        if (responseData.success) {
          B.refreshFullFileTree(refresh);
        } else {
          G.utils.showNotification('Upload failed: ' + (responseData.message || 'Unknown error'));
        }
      }

      // Cleanup
      setTimeout(function () {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 100);
      form.reset();
    };

    form.submit();
  }

  function attachEvents() {
    if (!windowEl) return;
    var contentEl;
    var tds = windowEl.getElementsByTagName('td');
    for (var i = 0; i < tds.length; i++) {
      if (tds[i].className === 'popup-content') {
        contentEl = tds[i];
        break;
      }
    }
    if (!contentEl) return;

    contentEl.onclick = handleFileClick; // Event delegation

    var newFileBtn = document.getElementById('fm-new-file-button');
    if (newFileBtn) newFileBtn.onclick = handleNewFile;

    var newFolderBtn = document.getElementById('fm-new-folder-button');
    if (newFolderBtn) newFolderBtn.onclick = handleNewFolder;

    var uploadBtn = document.getElementById('fm-upload-button');
    if (uploadBtn)
      uploadBtn.onclick = function () {
        document.getElementById('fm-upload-input').click();
      };

    var uploadInput = document.getElementById('fm-upload-input');
    if (uploadInput) uploadInput.onchange = handleUpload;
  }

  B.fileManager = {
    isOpen: function () {
      return !!windowEl;
    },
    refresh: refresh,
    launch: function () {
      if (document.getElementById(windowId)) {
        B.bringToFront(windowId);
        return;
      }

      currentPath = ''; // Reset path when opening
      var defaultState = {
        width: '350px',
        height: '450px',
        top: '70px',
        left: '480px',
        icon: '/assets/images/folder_icon.gif'
      };
      var savedState = B.getWindowState(windowId);
      var options = G.utils.mergeOptions(defaultState, savedState);
      options.onStateChange = B.updateWindowState;

      windowEl = renderDraggable(
        windowId,
        'File Explorer',
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
      attachEvents();
    }
  };
})((window.GeoFire.components.builder = window.GeoFire.components.builder || {}));
