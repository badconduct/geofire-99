window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

// Augment the builder object, creating it if it doesn't exist.
(function (B) {
  var G = window.GeoFire;
  var renderDraggable = G.components.renderDraggableWindow;

  var windowIdPrefix = 'image-preview-window-';

  function renderContent(filePath, imageUrl) {
    // By explicitly setting overflow-y and hiding overflow-x, we prevent the
    // appearance of a horizontal scrollbar when the vertical one is present.
    var content =
      '<div style="width:100%; height:100%; overflow-y:auto; overflow-x:hidden;">' +
      // IE6 Compatibility: Use width="100%" attribute for best scaling. Height will adjust automatically.
      '<img src="' +
      imageUrl +
      '" alt="' +
      G.utils.escapeHtml(filePath) +
      '" border="0" width="100%"/>' +
      '</div>';
    return content;
  }

  B.imagePreviewer = {
    launch: function (filePath) {
      // Create a unique ID for each window to allow multiple previews
      var windowId = windowIdPrefix + filePath.replace(/[^a-zA-Z0-9]/g, '_');

      if (document.getElementById(windowId)) {
        B.bringToFront(windowId);
        return;
      }

      var imageUrl =
        '/' +
        G.state.siteData.neighborhoodCode +
        '/' +
        G.state.siteData.username +
        '/' +
        filePath +
        '?t=' +
        new Date().getTime();

      var defaultState = {
        width: '320px',
        height: '240px',
        top: '100px',
        left: '100px',
        icon: '/assets/images/image_icon.gif'
      };

      var savedState = B.getWindowState(windowId);
      var options = G.utils.mergeOptions(defaultState, savedState);
      options.onStateChange = function (id, state) {
        B.updateWindowState(id, state);
      };

      var windowEl = renderDraggable(
        windowId,
        'Image Preview - ' + filePath,
        renderContent(filePath, imageUrl),
        options,
        function () {
          // On close, remove the specific window state.
          B.updateWindowState(windowId, null);
        }
      );

      var builderContent = document.getElementsByTagName('body')[0]; // Fallback
      var builderContentAreas = document.getElementsByTagName('td');
      for (var i = 0; i < builderContentAreas.length; i++) {
        if (builderContentAreas[i].className === 'builder-content') {
          builderContent = builderContentAreas[i];
          break;
        }
      }
      builderContent.appendChild(windowEl);

      B.bringToFront(windowId);
    }
  };
})((window.GeoFire.components.builder = window.GeoFire.components.builder || {}));
