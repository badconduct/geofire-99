window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

window.GeoFire.components.portal = (function () {
  var G = window.GeoFire;

  function handleLogin(e) {
    if (e) e.returnValue = false;
    var usernameEl = document.getElementById('header-login-username');
    var passwordEl = document.getElementById('header-login-password');
    if (!usernameEl || !passwordEl) return false;

    var username = usernameEl.value;
    var password = passwordEl.value;

    if (!username || !password) {
      G.utils.showNotification('Please enter username and password.');
      return false;
    }
    G.utils.ajax(
      {
        method: 'POST',
        url: G.API_URL + '/login',
        data: { username: username, password: password }
      },
      function (err, data) {
        if (err) {
          G.utils.showNotification('Login failed: ' + err);
        } else {
          G.state.loggedInSiteData = data.siteData;
          // --- Persist session to cookie for IE6 compatibility ---
          var credentials = {
            username: data.siteData.username,
            passwordHash: data.siteData.passwordHash
          };
          G.utils.createCookie('geoFireLogin', JSON.stringify(credentials), 7);
          G.render();
        }
      }
    );
    return false;
  }

  function handleLogout() {
    G.state.loggedInSiteData = null;
    G.state.siteData = null;
    // --- Clear session from cookie ---
    G.utils.createCookie('geoFireLogin', '', -1);
    G.render();
  }

  function handleEnterBuilder() {
    if (G.state.loggedInSiteData) {
      // --- IE6 Compatibility Fix ---
      // The full siteData object, which includes the entire file tree, can easily
      // exceed the 4KB cookie size limit in older browsers like IE6. This causes the
      // cookie to be truncated, resulting in a JSON parse error on the builder page.
      // To fix this, we store only the essential authentication data in the cookie.
      // The builder page will then use this data to fetch a fresh copy of the
      // full site information from the server.
      var builderAuthData = {
        username: G.state.loggedInSiteData.username,
        passwordHash: G.state.loggedInSiteData.passwordHash,
        neighborhoodCode: G.state.loggedInSiteData.neighborhoodCode
      };
      G.utils.createCookie('geoFireBuilderData', JSON.stringify(builderAuthData));
      // Navigate to the new, separate builder page
      window.location.href = '/builder.html';
    } else {
      G.utils.showNotification('Please sign in to edit your page.');
    }
  }

  function handleRegister(e) {
    if (e) e.returnValue = false;
    var username = document.getElementById('reg-username').value;
    var password = document.getElementById('reg-password').value;
    var confirm = document.getElementById('reg-confirm').value;
    var neighborhood = document.getElementById('reg-neighborhood').value;

    if (!username) {
      G.utils.showNotification('Username is required.');
      return false;
    }
    if (password.length < 4) {
      G.utils.showNotification('Password must be at least 4 characters.');
      return false;
    }
    if (password !== confirm) {
      G.utils.showNotification('Passwords do not match.');
      return false;
    }

    G.utils.ajax(
      {
        method: 'POST',
        url: G.API_URL + '/register',
        data: { username: username, neighborhoodCode: neighborhood, password: password }
      },
      function (err, data) {
        if (err) {
          G.utils.showNotification('Registration failed: ' + err);
        } else {
          G.utils.showNotification('Registration successful! You are now logged in.');
          G.state.loggedInSiteData = data.siteData;
          // --- Persist session to cookie on registration ---
          var credentials = {
            username: data.siteData.username,
            passwordHash: data.siteData.passwordHash
          };
          G.utils.createCookie('geoFireLogin', JSON.stringify(credentials), 7);
          G.navigate('/'); // Go back to portal page, now logged in.
        }
      }
    );
    return false;
  }

  function handleSearch(e) {
    if (e) e.returnValue = false;
    var query = document.getElementById('search-query').value;
    if (query) {
      G.navigate('/search?q=' + encodeURIComponent(query));
    }
    return false;
  }

  function showLogin(e) {
    if (e) e.returnValue = false;
    document.getElementById('login-form-container').style.display = 'block';
    document.getElementById('welcome-guest-container').style.display = 'none';
    return false;
  }

  function navToRegister() {
    G.navigate('/register');
  }

  function ctaBuild() {
    if (G.state.loggedInSiteData) {
      handleEnterBuilder();
    } else {
      G.utils.showNotification(
        'Welcome! To build a page, first get a free home page by clicking the link on the right.'
      );
      navToRegister();
    }
  }

  function ctaEdit() {
    if (G.state.loggedInSiteData) {
      handleEnterBuilder();
    } else {
      G.utils.showNotification('Please sign in to edit your pages.');
    }
  }

  function ctaUpload() {
    ctaEdit();
  }

  // --- Reusable Box Renderer ---
  function renderContentBox(title, content, style) {
    var headerClass = style === 'green' ? 'content-box-header-green' : 'content-box-header-blue';
    return (
      '<table class="content-box" cellpadding="0" cellspacing="0"><tr>' +
      '<td class="' +
      headerClass +
      '">' +
      title +
      '</td>' +
      '</tr><tr>' +
      '<td class="content-box-body">' +
      content +
      '</td>' +
      '</tr></table>'
    );
  }

  // --- Box Renderers ---
  function renderSearchBox() {
    var content =
      '<form id="search-form" style="text-align:center;">' +
      '<input type="text" id="search-query" class="retro-input" size="30" /> ' +
      '<button type="submit" class="retro-button">Search</button>' +
      '</form>';
    return renderContentBox('Search Home Pages', content, 'blue');
  }

  function renderNeighborhoodsBox() {
    var content = '';
    for (var i = 0; i < G.NEIGHBORHOODS.length; i++) {
      var hood = G.NEIGHBORHOODS[i];

      var sitesInHood = [];
      for (var j = 0; j < G.state.allSites.length; j++) {
        if (G.state.allSites[j].neighborhoodCode === hood.code) {
          sitesInHood.push(G.state.allSites[j]);
        }
      }

      sitesInHood.sort(function (a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      content += '<div class="neighborhoods-list-item">';
      content +=
        '<b><a href="/neighborhood/' +
        hood.code +
        '">' +
        hood.name +
        '</a></b> - <span>' +
        hood.description +
        '</span>';

      if (sitesInHood.length > 0) {
        content += '<ul>';
        var limit = sitesInHood.length < 3 ? sitesInHood.length : 3;
        for (var k = 0; k < limit; k++) {
          var site = sitesInHood[k];
          var siteUrl = '/' + site.neighborhoodCode + '/' + site.username;
          content += '<li><a href="' + siteUrl + '" target="_blank">' + site.username + '</a></li>';
        }
        content += '</ul>';
      } else {
        content += '<p>Under Construction</p>';
      }
      content += '</div>';
    }
    return renderContentBox('Explore Neighborhoods', content, 'blue');
  }

  function renderWorldNewsBox() {
    var newsItems = G.state.news || [];
    var content = '';

    if (newsItems.length > 0) {
      var limit = newsItems.length < 3 ? newsItems.length : 3;
      for (var i = 0; i < limit; i++) {
        var story = newsItems[i];
        var storyUrl = '/news?story=' + i;
        content +=
          '<b><a href="' +
          storyUrl +
          '">' +
          story.headline +
          '</a></b><br>' +
          story.summary +
          '<br/><br/>';
      }
      if (content.length > 0) {
        content = content.substring(0, content.length - 12); // Trim trailing breaks
      }
    } else {
      content = 'Fetching the latest news from 1999... Please wait.';
    }

    var title = '<a href="/news" style="color:white; text-decoration:none;">World News</a>';
    return renderContentBox(title, content, 'blue');
  }

  function renderWeatherBox() {
    var content =
      '<table cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td valign="middle"><img src="/assets/images/weather_sun.gif" alt="sun icon" style="margin-right:10px;"></td>' +
      '<td valign="middle" style="font-size:10pt;"><b>Mountain View, CA</b><br>Sunny, 23&deg;C</td>' +
      '</tr></table>';
    return renderContentBox('Datacenter Weather', content, 'blue');
  }

  function renderGeoFireNewsBox() {
    var newsItems = G.corporateNews || [];
    var content = '';

    if (newsItems.length > 0) {
      var limit = newsItems.length < 2 ? newsItems.length : 2;
      for (var i = 0; i < limit; i++) {
        var story = newsItems[i];
        var storyUrl = '/corporate-news?story=' + i;
        content +=
          '<b><a href="' +
          storyUrl +
          '">' +
          story.headline +
          '</a></b><br/>' +
          '<span style="font-size:7pt">' +
          story.date +
          '</span><br/><br/>';
      }
      if (content.length > 0) {
        content = content.substring(0, content.length - 12); // Trim trailing breaks
      }
    } else {
      content = 'Loading corporate updates...';
    }
    var title =
      '<a href="/corporate-news" style="color:white; text-decoration:none;">GeoFire \'99 News!</a>';
    return renderContentBox(title, content, 'green');
  }

  function renderHelpBox() {
    var content =
      'If you need help getting started or have other questions, visit our <a href="#">Help</a> section for frequently asked questions and tutorials.';
    return renderContentBox('Getting Help', content, 'green');
  }

  function renderPageHeader() {
    var isLoggedIn = !!G.state.loggedInSiteData;
    var headerLoginHtml = '';
    if (isLoggedIn) {
      headerLoginHtml =
        'Welcome, <b>' +
        G.state.loggedInSiteData.username +
        '</b> - [<a id="logout-button" href="#">Logout</a>]';
    } else {
      headerLoginHtml =
        '<span id="welcome-guest-container">Welcome, Guest - [<a id="signin-link" href="#">Sign in</a>]</span>' +
        '<span id="login-form-container" style="display:none;">' +
        '<form id="header-login-form">' +
        '<b>Username:</b> <input type="text" id="header-login-username" class="retro-input" size="10"/> ' +
        '<b>Password:</b> <input type="password" id="header-login-password" class="retro-input" size="10"/> ' +
        '<button type="submit" class="retro-button">Sign In</button>' +
        '</form>' +
        '</span>';
    }

    // New layout: Login info on top, banner centered below it.
    // This replaces the old 3-column header with a cleaner, more robust 2-row layout.
    return (
      '<table width="100%" cellpadding="2" cellspacing="0">' +
      '<tr><td align="right" valign="top" style="padding-bottom: 5px;">' +
      headerLoginHtml +
      '</td></tr>' +
      '<tr><td align="center" valign="middle">' +
      '<a href="/"><img src="/assets/images/geofire_logo.gif" width="600" height="100" border="0" alt="GeoFire \'99"/></a>' +
      '<img src="/assets/images/modern.gif" border="0" alt="Modern!" style="margin-left: 15px;" />' +
      '</td></tr>' +
      '</table>'
    );
  }

  function renderNavButtons() {
    return (
      '<table class="portal-main-nav" width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td class="portal-main-nav-item" id="cta-build"><h3>BUILD A PAGE</h3>Create a new webpage.</td>' +
      '<td class="portal-main-nav-item" id="cta-edit"><h3>EDIT PAGES</h3>Use File Manager to work on your site.</td>' +
      '<td class="portal-main-nav-item" id="cta-upload" style="border-right:none;"><h3>UPLOAD FILES</h3>Import or FTP sounds, pictures or HTML files.</td>' +
      '</tr></table>'
    );
  }

  function renderInfoBar() {
    return (
      '<div style="float:right; margin:5px 0;">' +
      '<a id="register-link" href="#"><b>Get a free home page &gt;</b></a>' +
      '</div><div style="clear:both;"></div>' +
      '<div class="info-bar">' +
      'Returning GeoFire members, learn how to <b>sign in for the first time.</b>' +
      '</div>'
    );
  }

  return {
    renderPageShell: function (contentHtml) {
      document.body.className = 'portal-body';

      return (
        '<div class="portal-page-container">' +
        renderPageHeader() +
        renderNavButtons() +
        contentHtml +
        '<div class="portal-footer">Copyright &copy; 1999 GeoFire Corporation. All rights reserved.</div>' +
        '</div>'
      );
    },

    renderPortalContent: function () {
      // New layout with a 2x2 grid in the middle
      var mainContentGrid =
        '<table width="100%" cellpadding="0" cellspacing="0" border="0">' +
        '<tr>' +
        '<td width="50%" valign="top" style="padding-right: 10px;">' +
        renderWorldNewsBox() +
        renderWeatherBox() +
        '</td>' +
        '<td width="50%" valign="top">' +
        renderGeoFireNewsBox() +
        renderHelpBox() +
        '</td>' +
        '</tr>' +
        '</table>';

      // New order: Info Bar, Search, Grid, then Neighborhoods
      return (
        renderInfoBar() +
        '<br/>' +
        renderSearchBox() +
        '<br/>' +
        mainContentGrid +
        '<br/>' +
        renderNeighborhoodsBox()
      );
    },

    renderRegistration: function () {
      var neighborhoodOptions = '';
      for (var i = 0; i < G.NEIGHBORHOODS.length; i++) {
        var n = G.NEIGHBORHOODS[i];
        neighborhoodOptions +=
          '<option value="' + n.code + '">' + n.name + ' (' + n.description + ')</option>';
      }
      var formHtml =
        '<form id="register-form">' +
        "<h2>Get Your Free GeoFire '99 Home Page!</h2>" +
        "<p>It's FREE and easy! Just fill out the form below.</p><br/>" +
        '<table cellpadding="4"><tr>' +
        '<td align="right"><b>Choose a Username:</b></td>' +
        '<td><input type="text" id="reg-username" class="retro-input" style="width:200px"/></td>' +
        '</tr><tr>' +
        '<td align="right"><b>Password (min 4 chars):</b></td>' +
        '<td><input type="password" id="reg-password" class="retro-input" style="width:200px"/></td>' +
        '</tr><tr>' +
        '<td align="right"><b>Confirm Password:</b></td>' +
        '<td><input type="password" id="reg-confirm" class="retro-input" style="width:200px"/></td>' +
        '</tr><tr>' +
        '<td align="right"><b>Pick a Neighborhood:</b></td>' +
        '<td><select id="reg-neighborhood" class="retro-select" style="width:208px">' +
        neighborhoodOptions +
        '</select></td>' +
        '</tr><tr>' +
        '<td></td><td><br/><button type="submit" class="retro-button" style="padding: 5px 15px;">Get my FREE page!</button></td>' +
        '</tr></table>' +
        '</form><br/><br/><center><a href="/">[ Back to Main Portal ]</a></center>';

      return (
        '<div style="padding-top:20px;">' +
        renderContentBox("Register for GeoFire '99", formHtml, 'blue') +
        '</div>'
      );
    },

    attachHeaderEvents: function () {
      var isLoggedIn = !!G.state.loggedInSiteData;
      if (isLoggedIn) {
        var logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) logoutBtn.onclick = handleLogout;
      } else {
        var signinLink = document.getElementById('signin-link');
        var loginForm = document.getElementById('header-login-form');
        if (signinLink) signinLink.onclick = showLogin;
        if (loginForm) loginForm.onsubmit = handleLogin;
      }
    },

    attachPortalEvents: function () {
      document.getElementById('cta-build').onclick = ctaBuild;
      document.getElementById('cta-edit').onclick = ctaEdit;
      document.getElementById('cta-upload').onclick = ctaUpload;

      document.getElementById('register-link').onclick = navToRegister;
      var searchForm = document.getElementById('search-form');
      if (searchForm) searchForm.onsubmit = handleSearch;
    },

    attachRegistrationEvents: function () {
      document.getElementById('register-form').onsubmit = handleRegister;
    }
  };
})();
