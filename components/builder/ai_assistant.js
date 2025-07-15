window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

// Augment the builder object, creating it if it doesn't exist.
(function (B) {
  var G = window.GeoFire;
  var renderDraggable = G.components.renderDraggableWindow;

  var chatHistory = [];
  var isThinking = false;
  var windowEl = null;
  var windowId = 'ai-assistant-window';

  function initializeChat() {
    if (chatHistory.length === 0) {
      chatHistory = [
        {
          from: 'ai',
          message: 'I am the AI Site Assistant. State your request for your website.',
          files: [],
          images: []
        }
      ];
    }
  }

  function renderContent() {
    // Use a table-based layout for IE6 compatibility
    return (
      '<table width="100%" height="100%" cellpadding="0" cellspacing="0">' +
      // History Row
      '<tr>' +
      '<td style="height:100%;">' +
      '<div class="inset-box" style="width:100%; height:290px; padding:0; overflow:hidden;">' +
      '<div id="gemini-history-window" style="width:100%; height:100%; overflow-y:auto; overflow-x:hidden; padding:4px;">' +
      '</div>' +
      '</div>' +
      '</td>' +
      '</tr>' +
      // Form Row
      '<tr>' +
      '<td height="1" style="padding-top: 4px;">' +
      '<form id="gemini-form-window">' +
      // Use a nested table for the inline form layout
      '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      // Textarea takes up remaining space
      '<td width="100%" style="padding-right: 4px;">' +
      '<textarea id="gemini-prompt-window" class="retro-textarea" style="height: 50px; width: 100%; box-sizing: border-box;"></textarea>' +
      '</td>' +
      // Button has a fixed width
      '<td valign="top">' +
      '<button id="gemini-submit-window" type="submit" class="retro-button" style="height: 50px; width: 90px; box-sizing: border-box;">✨ Ask<br>Assistant ✨</button>' +
      '</td>' +
      '</tr></table>' +
      '</form>' +
      '</td>' +
      '</tr>' +
      '</table>'
    );
  }

  function updateChatLog() {
    if (!windowEl) return;
    var historyBox = document.getElementById('gemini-history-window');
    if (!historyBox) return;

    var historyHtml = '';
    for (var i = 0; i < chatHistory.length; i++) {
      var entry = chatHistory[i];
      if (entry.from === 'user') {
        historyHtml +=
          '<p style="margin: 5px 0;"><b>You:</b> ' + entry.message.replace(/</g, '&lt;') + '</p>';
      } else {
        var aiMessage =
          '<p style="margin: 5px 0;"><b>AI:</b> ' + entry.message.replace(/</g, '&lt;') + '</p>';
        if (entry.files && entry.files.length > 0) {
          aiMessage +=
            '<p style="margin: 2px 0 2px 10px;"><i>Modified Files:</i></p><ul style="margin:0 0 5px 30px; padding:0; list-style-type:square;">';
          for (var j = 0; j < entry.files.length; j++) {
            aiMessage += '<li>' + entry.files[j] + '</li>';
          }
          aiMessage += '</ul>';
        }
        if (entry.images && entry.images.length > 0) {
          aiMessage +=
            '<p style="margin: 2px 0 2px 10px;"><i>Required Images:</i></p><ul style="margin:0 0 5px 30px; padding:0; list-style-type:square;">';
          for (var k = 0; k < entry.images.length; k++) {
            aiMessage +=
              '<li><b>' +
              entry.images[k].fileName +
              '</b> - ' +
              entry.images[k].description +
              '</li>';
          }
          aiMessage += '</ul>';
        }
        historyHtml +=
          '<div style="border-top: 1px dotted #808080; padding: 5px 0;">' + aiMessage + '</div>';
      }
    }
    historyBox.innerHTML = historyHtml;
    historyBox.scrollTop = historyBox.scrollHeight;
  }

  function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    else if (e) e.returnValue = false;
    if (!windowEl) return false;

    var promptInput = document.getElementById('gemini-prompt-window');
    var submitButton = document.getElementById('gemini-submit-window');
    var prompt = promptInput.value;
    if (!prompt.replace(/^\s+|\s+$/g, '') || isThinking) return false;

    isThinking = true;
    submitButton.disabled = true;
    submitButton.innerHTML = 'Thinking...';

    chatHistory.push({ from: 'user', message: prompt });
    chatHistory.push({ from: 'ai', message: 'Working...' });
    updateChatLog();
    promptInput.value = '';

    G.utils.ajax(
      {
        method: 'POST',
        url: G.API_URL + '/gemini',
        data: {
          userPrompt: prompt,
          chatHistory: chatHistory.slice(0, -2),
          fileTree: G.state.siteData.files,
          username: G.state.siteData.username,
          passwordHash: G.state.siteData.passwordHash,
          neighborhoodCode: G.state.siteData.neighborhoodCode
        },
        contentType: 'application/json'
      },
      function (err, data) {
        chatHistory.pop(); // Remove "Working..."
        if (err) {
          chatHistory.push({ from: 'ai', message: 'Error: ' + err, files: [], images: [] });
        } else if (data && data.success) {
          var aiResponse = data.content;
          var aiChatEntry = {
            from: 'ai',
            message: aiResponse.responseMessage,
            files: [],
            images: aiResponse.requiredImages || []
          };
          var fileChanges = aiResponse.fileChanges || [];
          for (var i = 0; i < fileChanges.length; i++) {
            aiChatEntry.files.push(fileChanges[i].filePath);
          }
          chatHistory.push(aiChatEntry);

          if (fileChanges.length > 0) {
            B.saveAllFiles(fileChanges, B.refreshAll);
          }
        } else {
          chatHistory.push({
            from: 'ai',
            message: 'Error: ' + (data ? data.message : 'An unknown error occurred.'),
            files: [],
            images: []
          });
        }

        isThinking = false;
        submitButton.disabled = false;
        submitButton.innerHTML = '✨ Ask<br>Assistant ✨';
        updateChatLog();
      }
    );
    return false;
  }

  function attachEvents() {
    if (!windowEl) return;
    var form = document.getElementById('gemini-form-window');
    form.onsubmit = handleSubmit;
    var submitButton = document.getElementById('gemini-submit-window');
    if (isThinking) {
      submitButton.disabled = true;
      submitButton.innerHTML = 'Thinking...';
    } else {
      submitButton.disabled = false;
      submitButton.innerHTML = '✨ Ask<br>Assistant ✨';
    }
  }

  B.aiAssistant = {
    launch: function () {
      if (document.getElementById(windowId)) {
        B.bringToFront(windowId);
        return;
      }

      initializeChat();

      // Slightly wider for better form layout
      var defaultState = {
        width: '480px',
        height: '400px',
        top: '60px',
        left: '20px',
        icon: '/assets/images/gemini_icon.gif'
      };
      var savedState = B.getWindowState(windowId);
      var options = G.utils.mergeOptions(defaultState, savedState);
      options.onStateChange = B.updateWindowState;

      windowEl = renderDraggable(
        windowId,
        'Gemini Assistant',
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
      updateChatLog();
      attachEvents();
    }
  };
})((window.GeoFire.components.builder = window.GeoFire.components.builder || {}));
