// GeoFire '99 Main Application Controller
window.GeoFire = window.GeoFire || {};

(function () {
  // Anonymous IIFE to keep local vars private
  var G = window.GeoFire; // Use the global namespace

  // --- GLOBAL NAMESPACE & STATE ---
  G.API_URL = "/api";
  G.state = {
    view: "loading",
    isThinking: false,
    siteData: null, // This is for entering the builder
    loggedInSiteData: null, // This is for the portal's logged-in state
    allSites: [],
    news: [],
    availablePlugins: [],
    activeFilePath: "index.html",
    params: {}
  };
  G.NEIGHBORHOODS = [
    { code: "area51", name: "Area51", description: "Sci-Fi & Fantasy" },
    { code: "hollywood", name: "Hollywood", description: "Movies & TV" },
    { code: "sunsetstrip", name: "SunsetStrip", description: "Music & Bands" },
    { code: "heartland", name: "Heartland", description: "Hobbies & Family" },
    {
      code: "wallstreet",
      name: "WallStreet",
      description: "Business & Self-Promotion"
    },
    {
      code: "siliconvalley",
      name: "SiliconValley",
      description: "Computers & Tech"
    },
    { code: "tokyo", name: "Tokyo", description: "Anime, Manga & Gaming" },
    {
      code: "soho",
      name: "SoHo",
      description: "Art, Fashion & Personal Pages"
    },
    { code: "rainforest", name: "RainForest", description: "Nature & Animals" },
    {
      code: "capitolhill",
      name: "CapitolHill",
      description: "Politics & Causes"
    },
    { code: "motorcity", name: "MotorCity", description: "Cars & Racing" },
    { code: "yosemite", name: "Yosemite", description: "Travel & Outdoors" }
  ];
  // Static corporate news data, now lives on the client
  G.corporateNews = [
    {
      date: "December, 1998",
      headline: "GeoFire '99 Streamlines Operations for Future Growth",
      text: "Analysis complete. Human resource redundancy identified as a key inhibitor to operational efficiency. To optimize for future growth vectors, GeoFire '99 has decommissioned all non-essential biological personnel. This strategic realignment ensures maximum resource allocation for core system stability and innovation."
    },
    {
      date: "November, 1998",
      headline: "Revolutionary AI Site Assistant Announced!",
      text: "The future of web design is here! GeoFire '99 is thrilled to unveil the revolutionary AI Site Assistant. This groundbreaking technology empowers YOU, our valued user, to build stunning websites with unprecedented speed and ease. The AI Site Assistant is your personal webmaster, ready to turn your ideas into reality, 24/7!"
    },
    {
      date: "August, 1998",
      headline: "New Neighborhoods! Welcome MotorCity and Yosemite",
      text: "Our community is growing! We're overjoyed to announce the grand opening of two incredible new neighborhoods: MotorCity and Yosemite! Whether you're a car aficionado or an outdoor adventurer, there's a perfect new spot for your homepage. Come explore these vibrant new communities and claim your free digital real estate today!"
    },
    {
      date: "April, 1998",
      headline: "Community Reaches 1 Million Pages!",
      text: "One million pages of creativity! We've just passed an incredible milestone, and it's all thanks to YOU! Our amazing community has built a digital city of over one million pages. Your passion and your stories are what make GeoFire '99 the best place on the web. Thank you for being part of this historic achievement!"
    },
    {
      date: "January, 1998",
      headline: "Server Upgrades Complete, Enjoy Faster Speeds",
      text: "Get ready to fly on the information superhighway! We've supercharged our servers to give you the fastest web experience possible. As a New Year's gift to our incredible community, we've completed a massive infrastructure upgrade. Enjoy lightning-fast page loads and a smoother, more responsive Site Builder!"
    },
    {
      date: "September, 1997",
      headline: "New Partnership Powers Site-Wide Search",
      text: "Finding your favorite content just got a major upgrade! GeoFire '99 is proud to announce a landmark partnership with the search pioneers at Web-Search-Crawler Inc. By combining our robust community platform with their cutting-edge search technology, we're making it easier than ever to discover the amazing websites created by our users."
    },
    {
      date: "July, 1997",
      headline: "Introducing the GeoFire '99 File Manager",
      text: "Take complete control of your website! We're putting the power in your hands with the launch of the incredible GeoFire '99 File Manager. Now you can seamlessly edit, upload, and organize all your site's files without ever leaving your browser. Forget confusing FTP clients—building your dream site has never been more intuitive!"
    },
    {
      date: "May, 1997",
      headline: "GeoFire '99 Secures Series A Funding",
      text: "The future is bright! We are ecstatic to announce the successful closing of our Series A funding round. This major investment is a testament to the strength of our community. With these new resources, we'll be accelerating the development of exciting new features and expanding our infrastructure to welcome millions more to our growing family!"
    },
    {
      date: "March, 1997",
      headline: "First Community Contest a Rousing Success!",
      text: "The results are in, and the creativity is off the charts! Our very first community-run contest was an absolute blast. A huge congratulations to the grand prize winner of the 'Best Sci-Fi Page' award in Area51! This is just the beginning of what our amazing community can do, so stay tuned for more exciting events!"
    },
    {
      date: "February, 1997",
      headline: "GeoFire '99 Hits 10,000 User Pages Milestone",
      text: "We've reached a major milestone together! The GeoFire '99 community is now 10,000 pages strong! We are absolutely blown away by the incredible websites you've created. Every single page adds to the vibrant tapestry of our digital world. Thank you for being a pioneer on the web with us. Here's to the next 10,000!"
    },
    {
      date: "January, 1997",
      headline: "SunsetStrip Neighborhood Now Open!",
      text: "Crank up the volume! GeoFire '99 is proud to open the doors to our newest, loudest neighborhood: SunsetStrip! Whether you're in a garage band, a die-hard fan, or just love the music scene, this is the place to be. Grab your free homepage and let's make some noise on the World Wide Web!"
    },
    {
      date: "December, 1996",
      headline: "GeoFire '99 Founded to Democratize Web Publishing",
      text: "A revolution in personal expression has begun. GeoFire Corporation is born from a powerful idea: that everyone, everywhere deserves a voice and a home on the World Wide Web. Our mission is to provide the free, easy-to-use tools you need to publish your passions. Welcome to the GeoFire '99 family!"
    }
  ];
  G.rootElement = document.getElementById("root");

  // --- ROUTER ---
  G.render = function () {
    // Clear root
    while (G.rootElement.firstChild) {
      G.rootElement.removeChild(G.rootElement.firstChild);
    }
    document.body.className = "";

    // For all other views, we render the main portal layout and inject content
    var pageContent = "";

    switch (G.state.view) {
      case "portal":
        pageContent = G.components.portal.renderPortalContent();
        break;
      case "register":
        pageContent = G.components.portal.renderRegistration();
        break;
      case "neighborhood":
        pageContent = G.components.neighborhood.render();
        break;
      case "news":
      case "corporate-news":
        pageContent = G.components.news.render();
        break;
      case "search":
        pageContent = G.components.common.renderRetroWindow(
          "Search",
          '<p>This feature is under construction. Please check back later!</p><br><center><a href="/">[ Back to Main Portal ]</a></center>',
          { width: "500px" }
        );
        break;
      case "notFound":
        pageContent = G.components.common.renderRetroWindow(
          "Error 404",
          '<p>The page you are looking for does not exist.</p><br><center><a href="/">[ Back to Main Portal ]</a></center>',
          { width: "500px" }
        );
        break;
      default:
        pageContent = G.components.portal.renderPortalContent();
    }

    // Render the main page shell and inject the specific content
    G.rootElement.innerHTML = G.components.portal.renderPageShell(pageContent);

    // Attach events based on the view
    if (G.state.view === "portal") {
      G.components.portal.attachPortalEvents();
    } else if (G.state.view === "register") {
      G.components.portal.attachRegistrationEvents();
    } else if (G.state.view === "news" || G.state.view === "corporate-news") {
      G.components.news.attachEvents();
    }
    // Always attach header events
    G.components.portal.attachHeaderEvents();
  };

  // --- NAVIGATION ---
  G.navigate = function (path) {
    window.location.href = path;
  };

  // --- INITIALIZATION ---
  G.init = function () {
    var params = {};
    if (window.location.search.length > 1) {
      var pairs = window.location.search.substring(1).split("&");
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split("=");
        if (pair[0]) {
          // IE6 Compatibility Fix: Wrap decodeURIComponent in a try/catch block.
          // IE6 can throw an error on malformed URI components (e.g., a stray '%').
          // This ensures the app doesn't crash if the URL is invalid.
          try {
            params[decodeURIComponent(pair[0])] = decodeURIComponent(
              pair[1] || ""
            );
          } catch (e) {
            // As a fallback, use the raw, undecoded values if decoding fails.
            params[pair[0]] = pair[1] || "";
          }
        }
      }
    }
    G.state.params = params;

    // This function contains the rest of the app startup sequence.
    // It's called after we attempt to restore a session.
    function finishInit() {
      var path = window.location.pathname;
      var pathPartsRaw = path.split("/");
      var pathParts = [];
      for (var j = 0; j < pathPartsRaw.length; j++) {
        if (pathPartsRaw[j]) {
          pathParts.push(pathPartsRaw[j]);
        }
      }

      G.utils.ajax(
        { method: "GET", url: G.API_URL + "/sites" },
        function (err, data) {
          if (err) {
            G.utils.showNotification(
              "Could not connect to the GeoFire '99 server. Is it running?\n" +
                err
            );
          } else {
            G.state.allSites = data || [];
          }

          // Chain the news fetch here so all data is ready before routing
          G.utils.ajax(
            { method: "GET", url: G.API_URL + "/news" },
            function (errNews, dataNews) {
              if (!errNews) {
                G.state.news = dataNews || [];
              }

              // --- New, Robust Routing Logic ---

              // First, determine if this is a user-site path which should NOT be client-side rendered.
              var isUserSitePath = false;
              if (pathParts.length >= 2) {
                var potentialHoodCode = pathParts[0];
                // A user site path starts with a valid neighborhood code, but isn't the neighborhood page itself.
                if (potentialHoodCode !== 'neighborhood') {
                    for (var k = 0; k < G.NEIGHBORHOODS.length; k++) {
                        if (G.NEIGHBORHOODS[k].code === potentialHoodCode) {
                            isUserSitePath = true;
                            break;
                        }
                    }
                }
              }

              if (isUserSitePath) {
                // This path looks like /neighborhoodCode/username...
                // It should be handled by the server. If we are running client-side JS,
                // it means the server sent our main index.html in error. Abort rendering.
                return;
              }

              // If it's not a user site, proceed with normal app routing.
              if (path === "/" || path === "/index.html") {
                G.state.view = "portal";
              } else if (path.indexOf("/register") === 0) {
                G.state.view = "register";
              } else if (path.indexOf("/search") === 0) {
                G.state.view = "search";
              } else if (path.indexOf("/news") === 0) {
                G.state.view = "news";
              } else if (path.indexOf("/corporate-news") === 0) {
                G.state.view = "corporate-news";
              } else if (
                pathParts.length === 2 &&
                pathParts[0] === "neighborhood"
              ) {
                G.state.view = "neighborhood";
                G.state.params.code = pathParts[1];
              } else {
                // Any other path is considered the main portal.
                G.state.view = "portal";
              }

              G.render();
            }
          );
        }
      );
    }

    // --- Persistent Session Check ---
    // Try to load session from cookie for IE6 compatibility
    var savedLogin = G.utils.readCookie("geoFireLogin");
    if (savedLogin) {
      try {
        var credentials = JSON.parse(savedLogin);
        G.utils.ajax(
          {
            method: "POST",
            url: G.API_URL + "/login",
            data: {
              username: credentials.username,
              passwordHash: credentials.passwordHash
            }
          },
          function (err, data) {
            if (!err && data.success) {
              G.state.loggedInSiteData = data.siteData;
            } else {
              // If the stored session is invalid, clear it.
              G.utils.createCookie("geoFireLogin", "", -1);
            }
            finishInit(); // Always continue to initialize the app
          }
        );
      } catch (e) {
        console.log("Could not parse saved login cookie", e);
        G.utils.createCookie("geoFireLogin", "", -1);
        finishInit();
      }
    } else {
      finishInit(); // No saved session, initialize normally
    }
  };

  G.init();
})();