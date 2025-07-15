window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

// Augment the builder object, creating it if it doesn't exist.
(function (B) {
  var G = window.GeoFire;
  var renderDraggable = G.components.renderDraggableWindow;

  var windowEl = null;
  var windowId = 'plugin-manager-window';
  var selectedPluginId = null;
  var pluginChangeset = []; // This will be our temporary state to track all changes

  function hasUnsavedChanges() {
    // Deep comparison is tricky in IE6-safe JS. Stringify is the easiest way.
    var originalPlugins = G.state.siteData.plugins || [];

    // Sort both arrays by ID to ensure order doesn't affect the comparison.
    var sortById = function (a, b) {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    };

    // Create sorted copies for comparison
    var sortedOriginal = JSON.parse(JSON.stringify(originalPlugins)).sort(sortById);
    var sortedChanges = JSON.parse(JSON.stringify(pluginChangeset)).sort(sortById);

    // Now stringify and compare
    return JSON.stringify(sortedOriginal) !== JSON.stringify(sortedChanges);
  }

  function updateSaveButtonState() {
    if (!windowEl) return;
    var saveButton = document.getElementById('plugins-save-button');
    if (!saveButton) return;
    saveButton.disabled = !hasUnsavedChanges();
  }

  function handleResetCounter() {
    if (
      !confirm(
        'Are you sure you want to reset all hit counters for your site? This action cannot be undone.'
      )
    ) {
      return;
    }

    var button = document.getElementById('hitcounter-reset-button');
    if (button) {
      button.disabled = true;
      button.innerHTML = 'Resetting...';
    }

    G.utils.ajax(
      {
        method: 'POST',
        url: G.API_URL + '/plugins/hitcounter/reset',
        data: {
          username: G.state.siteData.username,
          passwordHash: G.state.siteData.passwordHash,
          neighborhoodCode: G.state.siteData.neighborhoodCode
        },
        contentType: 'application/json'
      },
      function (err, data) {
        if (button) {
          button.disabled = false;
          button.innerHTML = 'Reset All Counters';
        }
        if (err) {
          G.utils.showNotification('Error resetting counters: ' + err);
        } else {
          G.utils.showNotification('All hit counters for your site have been reset.');
          B.refreshPreview();
        }
      }
    );
  }

  function renderContent() {
    // A two-column table layout for IE6 compatibility and a more robust UI.
    return (
      '<table width="100%" height="100%" cellpadding="0" cellspacing="5" border="0">' +
      '<tr>' +
      // Left Pane: Plugin List
      '<td width="150" valign="top" style="height:100%;">' +
      '<div class="inset-box" style="width:100%; height:100%; box-sizing:border-box;">' +
      '<div id="plugins-list-pane" style="padding:2px;">' +
      '<p style="padding:5px; font-style:italic;">Loading...</p>' +
      '</div>' +
      '</div>' +
      '</td>' +
      // Right Pane: Plugin Details
      '<td valign="top" style="height:100%;">' +
      '<div id="plugins-detail-pane" style="height:100%;">' +
      // Details for the selected plugin will be rendered here.
      '</div>' +
      '</td>' +
      '</tr>' +
      // Bottom Row: Buttons
      '<tr>' +
      '<td colspan="2" align="right" valign="bottom" style="padding-top:5px; height:1px;">' +
      '<button id="plugins-save-button" class="retro-button">Save</button>' +
      '<button id="plugins-close-button" class="retro-button" style="margin-left:5px;">Close</button>' +
      '</td>' +
      '</tr>' +
      '</table>'
    );
  }

  function updateChangesetFromUI(pluginId) {
    if (!pluginId) return;
    var checkbox = document.getElementById('enable-plugin-' + pluginId);
    if (!checkbox) return;

    var pluginIndex = -1;
    for (var i = 0; i < pluginChangeset.length; i++) {
      if (pluginChangeset[i].id === pluginId) {
        pluginIndex = i;
        break;
      }
    }

    if (checkbox.checked) {
      // Plugin is enabled, ensure it's in the changeset
      var pluginData = { id: pluginId, options: {} };

      // Find the plugin definition to get its options
      var pluginDef = null;
      for (var j = 0; j < G.state.availablePlugins.length; j++) {
        if (G.state.availablePlugins[j].id === pluginId) {
          pluginDef = G.state.availablePlugins[j];
          break;
        }
      }

      if (pluginDef && pluginDef.options) {
        for (var optionKey in pluginDef.options) {
          if (!Object.prototype.hasOwnProperty.call(pluginDef.options, optionKey)) continue;
          var select = document.getElementById('plugin-option-' + pluginId + '-' + optionKey);
          if (select) {
            pluginData.options[optionKey] = select.value;
          }
        }
      }

      if (pluginIndex > -1) {
        // It's already there, just update it
        pluginChangeset[pluginIndex] = pluginData;
      } else {
        // It's newly enabled, add it
        pluginChangeset.push(pluginData);
      }
    } else {
      // Plugin is disabled, ensure it's removed from the changeset
      if (pluginIndex > -1) {
        pluginChangeset.splice(pluginIndex, 1);
      }
    }
  }

  function renderPluginDetails() {
    if (!windowEl || !selectedPluginId) return;
    var detailPane = document.getElementById('plugins-detail-pane');
    if (!detailPane) return;

    var pluginDef = null;
    for (var i = 0; i < G.state.availablePlugins.length; i++) {
      if (G.state.availablePlugins[i].id === selectedPluginId) {
        pluginDef = G.state.availablePlugins[i];
        break;
      }
    }
    if (!pluginDef) {
      detailPane.innerHTML = '<p>Select a plugin from the list.</p>';
      return;
    }

    // Read from the temporary changeset to determine the UI state
    var savedPlugin = null;
    for (var j = 0; j < pluginChangeset.length; j++) {
      if (pluginChangeset[j].id === pluginDef.id) {
        savedPlugin = pluginChangeset[j];
        break;
      }
    }

    var isChecked = !!savedPlugin;

    var html =
      '<b>' +
      pluginDef.name +
      '</b>' +
      '<p style="margin:5px 0; font-size:7pt; color:#333;">' +
      pluginDef.description +
      '</p>' +
      '<hr color="#808080" size="1">' +
      '<div style="padding: 5px 0;">' +
      '<input type="checkbox" id="enable-plugin-' +
      pluginDef.id +
      '" data-plugin-id="' +
      pluginDef.id +
      '"' +
      (isChecked ? ' checked' : '') +
      '>' +
      '<label for="enable-plugin-' +
      pluginDef.id +
      '">Enable this plugin</label>' +
      '</div>';

    var optionsAndActionsHtml = '';

    // Render Options
    if (pluginDef.options) {
      for (var optionKey in pluginDef.options) {
        if (!Object.prototype.hasOwnProperty.call(pluginDef.options, optionKey)) continue;

        var optDef = pluginDef.options[optionKey];
        var savedValue = savedPlugin && savedPlugin.options ? savedPlugin.options[optionKey] : null;

        optionsAndActionsHtml +=
          '<label for="plugin-option-' +
          pluginDef.id +
          '-' +
          optionKey +
          '">' +
          optDef.label +
          '</label><br>';
        optionsAndActionsHtml +=
          '<select class="retro-select" id="plugin-option-' +
          pluginDef.id +
          '-' +
          optionKey +
          '" data-plugin-id="' +
          pluginDef.id +
          '" style="margin-top:2px; width: 100%;">';

        for (var k = 0; k < optDef.choices.length; k++) {
          var choice = optDef.choices[k];
          var isSelected = (savedValue && savedValue === choice.value) || (!savedValue && k === 0);
          optionsAndActionsHtml +=
            '<option value="' +
            G.utils.escapeHtml(choice.value) +
            '"' +
            (isSelected ? ' selected' : '') +
            '>' +
            G.utils.escapeHtml(choice.text) +
            '</option>';
        }

        optionsAndActionsHtml += '</select><br><br>';
      }
    }

    // Render specific plugin actions
    if (pluginDef.id === 'hitcounter' && isChecked) {
      optionsAndActionsHtml +=
        '<button id="hitcounter-reset-button" class="retro-button">Reset All Counters</button>';
    }

    // Add the container for options and actions if there is content for it
    if (optionsAndActionsHtml) {
      var containerStyle =
        'margin-top:10px; padding-top:5px; border-top:1px dotted #808080;' +
        (isChecked ? '' : 'display:none;');
      html +=
        '<div id="plugin-options-container-' +
        pluginDef.id +
        '" style="' +
        containerStyle +
        '">' +
        optionsAndActionsHtml +
        '</div>';
    }

    detailPane.innerHTML = html;

    // Attach event to checkbox to show/hide the options container
    var checkbox = document.getElementById('enable-plugin-' + pluginDef.id);
    if (checkbox) {
      checkbox.onclick = function () {
        var pluginId = this.getAttribute('data-plugin-id');
        var optionsContainer = document.getElementById('plugin-options-container-' + pluginId);
        if (optionsContainer) {
          optionsContainer.style.display = this.checked ? 'block' : 'none';
        }
        updateChangesetFromUI(pluginId);
        // Re-render details to show/hide the reset button correctly
        renderPluginDetails();
        updateSaveButtonState();
      };
    }

    // Attach events to option select elements
    if (pluginDef.options) {
      for (var optionKeyInLoop in pluginDef.options) {
        if (!Object.prototype.hasOwnProperty.call(pluginDef.options, optionKeyInLoop)) continue;
        var selectEl = document.getElementById(
          'plugin-option-' + pluginDef.id + '-' + optionKeyInLoop
        );
        if (selectEl) {
          selectEl.onchange = function () {
            var pId = this.getAttribute('data-plugin-id');
            updateChangesetFromUI(pId);
            updateSaveButtonState();
          };
        }
      }
    }

    // Attach event for reset button if it exists
    var resetButton = document.getElementById('hitcounter-reset-button');
    if (resetButton) {
      resetButton.onclick = handleResetCounter;
    }
  }

  function selectPlugin(pluginId) {
    selectedPluginId = pluginId;
    renderPluginList(); // Redraw list to show selection
    renderPluginDetails();
  }

  function handlePluginClick(e) {
    var evt = e || window.event;
    var target = evt.target || evt.srcElement;
    var anchor = target;
    while (anchor && (anchor.tagName !== 'A' || !anchor.getAttribute('data-plugin-id'))) {
      anchor = anchor.parentNode;
    }
    if (!anchor) return;

    if (evt.preventDefault) evt.preventDefault();
    else evt.returnValue = false;

    var pluginId = anchor.getAttribute('data-plugin-id');
    selectPlugin(pluginId);
    return false;
  }

  function renderPluginList() {
    if (!windowEl) return;
    var container = document.getElementById('plugins-list-pane');
    if (!container) return;

    var availablePlugins = G.state.availablePlugins || [];

    if (availablePlugins.length === 0) {
      container.innerHTML = '<p style="padding:5px; font-style:italic;">No plugins available.</p>';
      return;
    }

    // Select first plugin if none is selected
    if (!selectedPluginId && availablePlugins.length > 0) {
      selectedPluginId = availablePlugins[0].id;
    }

    var html = '<ul style="margin:0; padding:0; list-style-type:none;">';
    for (var j = 0; j < availablePlugins.length; j++) {
      var plugin = availablePlugins[j];
      var isSelected = plugin.id === selectedPluginId;
      var style =
        'display:block; padding: 5px; text-decoration:none; border-bottom:1px solid #c0c0c0; color:#000;';
      if (isSelected) {
        style += 'background:#000080; color:#fff;';
      }
      html +=
        '<li><a href="#" style="' +
        style +
        '" data-plugin-id="' +
        plugin.id +
        '">' +
        plugin.name +
        '</a></li>';
    }
    html += '</ul>';
    container.innerHTML = html;

    // After rendering the list, render the details for the selected one
    renderPluginDetails();
  }

  function closeWindow() {
    if (windowEl && windowEl.parentNode) {
      windowEl.parentNode.removeChild(windowEl);
    }
    // Reset state on close
    windowEl = null;
    selectedPluginId = null;
    pluginChangeset = [];
  }

  function handleClose() {
    if (hasUnsavedChanges()) {
      if (confirm('You have unsaved changes that will be lost. Are you sure you want to close?')) {
        closeWindow();
      }
    } else {
      closeWindow();
    }
  }

  function handleSave() {
    if (!windowEl) return;

    var activePlugins = pluginChangeset;

    var button = document.getElementById('plugins-save-button');
    button.disabled = true;
    button.innerHTML = 'Saving...';

    G.utils.ajax(
      {
        method: 'POST',
        url: G.API_URL + '/plugins/update',
        data: {
          username: G.state.siteData.username,
          passwordHash: G.state.siteData.passwordHash,
          neighborhoodCode: G.state.siteData.neighborhoodCode,
          activePlugins: activePlugins
        },
        contentType: 'application/json'
      },
      function (err, data) {
        button.innerHTML = 'Save';
        // Do not re-enable immediately, wait for state update.

        if (err) {
          button.disabled = false; // Re-enable on error
          G.utils.showNotification('Error saving plugins: ' + err);
        } else {
          // Update the "original" state to reflect the save
          G.state.siteData.plugins = JSON.parse(JSON.stringify(pluginChangeset));
          // REMOVED: G.utils.showNotification("Plugin settings saved successfully.");
          B.refreshAll();
          updateSaveButtonState(); // This should now disable the button
        }
      }
    );
  }

  function attachEvents() {
    if (!windowEl) return;
    document.getElementById('plugins-save-button').onclick = handleSave;
    document.getElementById('plugins-close-button').onclick = handleClose;

    var listPane = document.getElementById('plugins-list-pane');
    if (listPane) {
      listPane.onclick = handlePluginClick;
    }
  }

  function fetchAndRenderPlugins() {
    G.utils.ajax(
      {
        method: 'POST',
        url: G.API_URL + '/plugins',
        data: {
          username: G.state.siteData.username,
          passwordHash: G.state.siteData.passwordHash,
          neighborhoodCode: G.state.siteData.neighborhoodCode
        },
        contentType: 'application/json'
      },
      function (err, data) {
        if (!err && data) {
          G.state.availablePlugins = data;
        } else {
          G.state.availablePlugins = [];
          if (G.state.siteData) {
            G.state.siteData.plugins = [];
          }
          G.utils.showNotification('Could not load plugins. Please try again. ' + (err || ''));
        }
        renderPluginList();
        updateSaveButtonState(); // Set initial button state
      }
    );
  }

  B.pluginManager = {
    launch: function () {
      if (document.getElementById(windowId)) {
        B.bringToFront(windowId);
        return;
      }

      // Initialize the changeset by deep copying the current plugin state
      pluginChangeset = JSON.parse(JSON.stringify(G.state.siteData.plugins || []));

      var defaultState = {
        width: '450px',
        height: '300px',
        top: '90px',
        left: '600px',
        icon: '/assets/images/plugin_icon.gif'
      };
      var savedState = B.getWindowState(windowId);
      var options = G.utils.mergeOptions(defaultState, savedState);
      options.onStateChange = B.updateWindowState;

      windowEl = renderDraggable(
        windowId,
        'Plugin Manager',
        renderContent(),
        options,
        handleClose // Use the new close handler for the 'x' button
      );

      var builderContent;
      var tds = document.getElementsByTagName('td');
      for (var i = 0; i < tds.length; i++) {
        if (tds[i].className === 'builder-content') {
          builderContent = tds[i];
          break;
        }
      }
      if (!builderContent) builderContent = document.body;
      builderContent.appendChild(windowEl);

      B.bringToFront(windowId);
      attachEvents();
      fetchAndRenderPlugins();
    }
  };
})((window.GeoFire.components.builder = window.GeoFire.components.builder || {}));
