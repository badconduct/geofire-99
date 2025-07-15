window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

window.GeoFire.components.renderRetroWindow = function (title, content, options) {
  options = options || {};
  var iconHtml = options.icon
    ? '<img src="' + options.icon + '" class="retro-window-title-bar-icon" alt="icon"/>'
    : '';
  var windowClass = options.className || '';
  var windowStyle =
    (options.width ? 'width:' + options.width + ';' : '') +
    (options.height ? 'height:' + options.height + ';' : '');
  var bodyClass = options.bodyClass || 'retro-window-body';
  var bodyStyle = options.bodyStyle || '';

  var popoutHtml = '';
  if (options.popout) {
    popoutHtml =
      '<td align="right" valign="middle" style="padding-right: 3px;"><a href="#" id="' +
      options.popout.id +
      '" style="color:white;text-decoration:none;font-weight:normal;">' +
      options.popout.text +
      '</a></td>';
  }

  var titleBarContent =
    '<td class="retro-window-title-bar">' +
    '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td valign="middle">' +
    iconHtml +
    title +
    '</td>' +
    popoutHtml +
    '</tr></table>' +
    '</td>';

  return (
    '<table class="retro-window ' +
    windowClass +
    '" cellspacing="0" cellpadding="0" style="' +
    windowStyle +
    '">' +
    '<tr>' +
    titleBarContent +
    '</tr>' +
    '<tr><td class="' +
    bodyClass +
    '" style="height:100%; ' +
    bodyStyle +
    '">' +
    content +
    '</td></tr>' +
    '</table>'
  );
};

// --- New Draggable Window Component (Win98 Style) ---
window.GeoFire.components.renderDraggableWindow = function (
  id,
  title,
  content,
  options,
  closeCallback
) {
  options = options || {};
  var G = window.GeoFire;

  // Create window element
  var win = document.createElement('div');
  win.id = id;
  win.className = 'popup-window';
  win.style.width = options.width || '450px';
  win.style.height = options.height || '350px';
  win.style.top = options.top || '50px';
  win.style.left = options.left || '50px';
  win.style.zIndex = options.zIndex || 10;

  var iconHtml = options.icon ? '<img src="' + options.icon + '" alt="icon"/>' : '';

  // Use a table-based layout for IE6 compatibility
  win.innerHTML =
    '<table width="100%" height="100%" cellpadding="0" cellspacing="0">' +
    // Header Row
    '<tr>' +
    '<td class="popup-header" height="1">' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td><div class="popup-title">' +
    iconHtml +
    '<span>' +
    title +
    '</span></div></td>' +
    '<td align="right"><button class="popup-close-button">x</button></td>' +
    '</tr></table>' +
    '</td>' +
    '</tr>' +
    // Content Row
    '<tr>' +
    '<td class="popup-content" style="height:100%;">' +
    content +
    '</td>' +
    '</tr>' +
    '</table>';

  // --- Dragging Logic ---
  var header;
  var tds = win.getElementsByTagName('td');
  for (var i = 0; i < tds.length; i++) {
    if (tds[i].className === 'popup-header') {
      header = tds[i];
      break;
    }
  }

  var isDragging = false;
  var offsetX, offsetY;

  function onMouseDown(e) {
    e = e || window.event;
    // Don't drag if the close button was clicked
    var target = e.target || e.srcElement;
    if (target.className === 'popup-close-button') return;

    if (e.preventDefault) e.preventDefault();
    else e.returnValue = false;

    isDragging = true;

    if (G.components.builder && typeof G.components.builder.bringToFront === 'function') {
      G.components.builder.bringToFront(win.id);
    }

    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;

    if (document.addEventListener) {
      document.addEventListener('mousemove', onMouseMove, false);
      document.addEventListener('mouseup', onMouseUp, false);
    } else if (document.attachEvent) {
      document.attachEvent('onmousemove', onMouseMove);
      document.attachEvent('onmouseup', onMouseUp);
    }
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    e = e || window.event;

    var x = e.clientX - offsetX;
    var y = e.clientY - offsetY;

    win.style.left = x + 'px';
    win.style.top = y + 'px';
  }

  function onMouseUp() {
    isDragging = false;
    if (document.removeEventListener) {
      document.removeEventListener('mousemove', onMouseMove, false);
      document.removeEventListener('mouseup', onMouseUp, false);
    } else if (document.detachEvent) {
      document.detachEvent('onmousemove', onMouseMove);
      document.detachEvent('onmouseup', onMouseUp);
    }

    if (options.onStateChange) {
      options.onStateChange(win.id, {
        top: win.style.top,
        left: win.style.left,
        width: win.offsetWidth + 'px',
        height: win.offsetHeight + 'px',
        zIndex: win.style.zIndex
      });
    }
  }

  if (header) {
    header.onmousedown = onMouseDown;
  }

  // --- Close button logic ---
  var closeButton;
  var buttons = win.getElementsByTagName('button');
  for (var j = 0; j < buttons.length; j++) {
    if (buttons[j].className === 'popup-close-button') {
      closeButton = buttons[j];
      break;
    }
  }

  if (closeButton) {
    closeButton.onclick = function () {
      if (closeCallback) {
        closeCallback();
      }
      if (win.parentNode) {
        win.parentNode.removeChild(win);
      }
    };
  }

  return win;
};
