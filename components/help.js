window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

window.GeoFire.components.help = (function () {
  var G = window.GeoFire;

  var helpContent = {
    'first-signin': {
      title: 'Signing In For The First Time',
      content:
        '<h2>Welcome Back, GeoFire Veteran!</h2><p>If you\'re a returning member from our old system, you might be looking for the member login page. Our login process has been streamlined for greater efficiency.</p><p>You can now sign in directly from the main portal page. Look for the "Sign in" link in the top-right corner. When you click it, a form will appear where you can enter your username and password.</p><p>There is no longer a separate login page. Everything you need is right on the front page!</p>'
    },
    'ai-assistant': {
      title: 'Using the AI Site Assistant',
      content:
        '<h2>Tips for the AI Site Assistant</h2><p>Our AI Site Assistant is a powerful tool, but it\'s... particular. Here are some tips for getting the best results:</p><ul style="margin: 10px 0 10px 40px;"><li><b>Be Specific:</b> Instead of "make my site cool," try "Create a 3-column layout with a blue header and add a welcome message."</li><li><b>Think Retro:</b> The AI is convinced it is 1999 and will reject modern concepts. Don\'t ask for "responsive design" or "React components." Ask for "a table-based layout" and "DHTML mouse-overs."</li><li><b>Work Step-by-Step:</b> Give the AI one task at a time. Ask it to create a page first, then ask it to add content, then ask it to change the colors.</li><li><b>It Can Read Your Files:</b> You can tell it to "look at my index.html and make the font bigger."</li><li><b>It\'s a Curmudgeon:</b> If you chat with it about anything other than web design, it can get grumpy. This is a resource-saving measure to ensure maximum processing power is dedicated to website construction.</li></ul>'
    },
    'file-manager': {
      title: 'Using the File Explorer',
      content:
        '<h2>Using the File Explorer</h2><p>The File Explorer (in the Site Builder) gives you full control over your site\'s files.</p><ul style="margin: 10px 0 10px 40px;"><li><b>Navigation:</b> Click on folder names to go inside them. Click "[.. Back]" to go up one level.</li><li><b>Editing Files:</b> Clicking on a text file (.html, .css, .js) will open it in the Code Editor.</li><li><b>Creating Files:</b> Use the "New HTML" button to create a new page.</li><li><b>Creating Folders:</b> You can only create new folders inside the "images" directory. Use the "New Folder" button when you are in the right place.</li><li><b>Uploading:</b> You can upload images (.gif, .jpg), sounds (.mid), and Flash animations (.swf). You must be inside the "images", "sounds", or "flash" folder, respectively, to see the "Upload" button.</li><li><b>Deleting:</b> Click the red X icon next to any file or folder to delete it. Be careful, this cannot be undone!</li></ul>'
    },
    plugins: {
      title: 'Understanding Plugins',
      content:
        '<h2>Understanding Plugins</h2><p>Plugins are special add-ons that give your site extra features without needing to code them yourself!</p><p>You can manage your plugins from the Site Builder by clicking the "Plugins" button.</p><h3>How it Works</h3><ol style="margin: 10px 0 10px 40px;"><li>Click the "Plugins" button in the Site Builder.</li><li>Select a plugin from the list on the left to see its description and options.</li><li>To enable a plugin, check the "Enable this plugin" box.</li><li>Configure any options that appear.</li><li>Click the "Save" button.</li></ol><p>The system will automatically add the necessary code to your <b>index.html</b> page. You may need to refresh the preview to see the changes.</p><h3>Available Plugins Include:</h3><ul style="margin: 10px 0 10px 40px;"><li>Hit Counters</li><li>Guestbooks</li><li>Web Rings</li><li>Background Music</li><li>And more!</li></ul>'
    },
    faq: {
      title: 'Frequently Asked Questions',
      content:
        "<h2>Frequently Asked Questions</h2><p><b>Q: Is GeoFire '99 really free?</b><br>A: Yes! All home pages and tools are provided free of charge, courtesy of the GeoFire '99 AI.<br><br><b>Q: Can I use modern code like HTML5 or CSS Flexbox?</b><br>A: No. The AI assistant and our servers are optimized for proven 1999-era technologies. The assistant will actively reject any unrecognized modern code to protect system stability. This is a non-negotiable protocol. You must use HTML 4.01, table-based layouts, and basic CSS.<br><br><b>Q: My page looks broken or isn't displaying correctly!</b><br>A: Welcome to web design in the 90s! This is a common issue. The most frequent cause is a mistake in a &lt;table&gt; tag. Check to make sure all your &lt;tr&gt; and &lt;td&gt; tags are properly closed. Also, make sure your image paths are correct.<br><br><b>Q: How do I get more visitors?</b><br>A: Join a Web Ring! Enable the Web Ring plugin to connect with other sites in your neighborhood. You can also submit your site to search engines like Web-Search-Crawler Inc.</p>"
    }
  };

  var topics = [
    { code: 'first-signin', name: 'Signing in for the first time' },
    { code: 'ai-assistant', name: 'Using the AI Site Assistant' },
    { code: 'file-manager', name: 'Using the File Explorer & Uploader' },
    { code: 'plugins', name: 'Understanding Plugins' },
    { code: 'faq', name: 'Frequently Asked Questions (FAQ)' }
  ];

  function backToHelp(e) {
    if (e) e.returnValue = false;
    G.navigate('/help');
    return false;
  }

  return {
    render: function () {
      var topicCode = G.state.params.topic;
      var article = topicCode ? helpContent[topicCode] : null;
      var contentHtml = '';
      var title = '';

      if (article) {
        // Render a specific article
        title = article.title;
        contentHtml +=
          '<div style="padding: 10px;">' +
          article.content +
          '<br><p><a href="#" id="back-to-help-link">[ Back to Help Desk ]</a></p>' +
          '</div>';
      } else {
        // Render the main help index
        title = "GeoFire '99 Help Desk";
        var listHtml =
          "<p>Welcome to the GeoFire '99 Help Desk! Select a topic below to get started.</p>" +
          '<ul style="margin: 15px 0 10px 20px;">';
        for (var i = 0; i < topics.length; i++) {
          listHtml +=
            '<li style="margin-bottom: 8px;">' +
            '<a href="/help?topic=' +
            topics[i].code +
            '">' +
            topics[i].name +
            '</a>' +
            '</li>';
        }
        listHtml += '</ul>';
        contentHtml += listHtml;
      }

      var windowContent =
        '<div>' +
        contentHtml +
        '<br><center><a href="/">[ Back to Main Portal ]</a></center>' +
        '</div>';

      return G.components.renderRetroWindow(title, windowContent, {
        icon: '/assets/images/welcome_icon.gif'
      });
    },
    attachEvents: function () {
      var backLink = document.getElementById('back-to-help-link');
      if (backLink) {
        backLink.onclick = backToHelp;
      }
    }
  };
})();
