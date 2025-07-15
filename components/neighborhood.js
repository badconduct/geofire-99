window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

window.GeoFire.components.neighborhood = (function () {
  var G = window.GeoFire;

  return {
    render: function () {
      var hoodCode = G.state.params.code;
      var hood = null;
      for (var i = 0; i < G.NEIGHBORHOODS.length; i++) {
        if (G.NEIGHBORHOODS[i].code === hoodCode) {
          hood = G.NEIGHBORHOODS[i];
          break;
        }
      }

      if (!hood) {
        G.state.view = 'notFound';
        G.render();
        return '<div></div>'; // Return empty while redirecting
      }

      var sitesInHood = [];
      for (var k = 0; k < G.state.allSites.length; k++) {
        if (G.state.allSites[k].neighborhoodCode === hood.code) {
          sitesInHood.push(G.state.allSites[k]);
        }
      }

      // Alphabetical sort for the main list
      sitesInHood.sort(function (a, b) {
        if (a.username.toLowerCase() < b.username.toLowerCase()) return -1;
        if (a.username.toLowerCase() > b.username.toLowerCase()) return 1;
        return 0;
      });

      var sitesHtml =
        '<p style="text-align:center; font-style:italic; padding: 20px;">This neighborhood is waiting for its first resident! Why not be the first?</p>';
      if (sitesInHood.length > 0) {
        sitesHtml = '<ul style="list-style-type: none; margin: 0; padding: 10px;">';
        for (var l = 0; l < sitesInHood.length; l++) {
          var site = sitesInHood[l];
          var siteUrl = '/' + site.neighborhoodCode + '/' + site.username;
          var rowStyle = 'padding: 8px; border-bottom: 1px dotted #ccc;';
          if (l % 2 === 1) {
            rowStyle += ' background:#f4f4f4;';
          }
          sitesHtml +=
            '<li style="' +
            rowStyle +
            '">' +
            '<img src="/assets/images/text_icon.gif" align="absmiddle" style="margin-right: 8px;">' +
            '<a href="' +
            siteUrl +
            '" target="_blank" style="font-size:10pt;"><b>' +
            site.username +
            '</b></a>' +
            '</li>';
        }
        sitesHtml += '</ul>';
      }

      var titleContent = '<b>' + hood.name + '</b> - ' + hood.description;

      var content = G.components.renderRetroWindow(titleContent, sitesHtml, {
        icon: '/assets/images/folder_icon.gif'
      });

      return (
        '<div style="padding: 10px 0;">' +
        content +
        // IE6 Fix: Use <br> instead of <br/>
        '<br><center><a href="/">[ Back to Main Portal ]</a></center>' +
        '</div>'
      );
    }
  };
})();
