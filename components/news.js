

window.GeoFire = window.GeoFire || {};
window.GeoFire.components = window.GeoFire.components || {};

window.GeoFire.components.news = (function() {
    var G = window.GeoFire;

    // A single handler can work for both types of news
    function handleHeadlineClick(e) {
        if (e) e.returnValue = false;
        // IE6 Fix: Use 'rel' attribute instead of 'data-index' which is not supported.
        var index = this.getAttribute('rel');
        var view = G.state.view; // 'news' or 'corporate-news'
        G.state.params.story = index;
        // IE6 Fix: Add a cache-busting timestamp to prevent aggressive caching issues.
        G.navigate('/' + view + '?story=' + index + '&t=' + new Date().getTime());
        return false;
    }
    
    function backToAll(e) {
        if(e) e.returnValue = false;
        var view = G.state.view; // 'news' or 'corporate-news'
        delete G.state.params.story;
        G.navigate('/' + view);
        return false;
    }

    return {
        render: function() {
            var isCorporate = G.state.view === 'corporate-news';
            var newsItems = isCorporate ? G.corporateNews : G.state.news;
            newsItems = newsItems || [];

            var activeStoryIndex = G.state.params.story;
            var activeStory = (activeStoryIndex !== undefined && newsItems[activeStoryIndex]) ? newsItems[activeStoryIndex] : null;
            var contentHtml = '';

            var pageTitle, icon;

            if (activeStory) {
                // RENDER A SINGLE STORY
                pageTitle = isCorporate ? "Corporate Update" : "Story Details";
                icon = '/assets/images/text_icon.gif';
                
                contentHtml += '<h3>' + (activeStory.headline || '') + '</h3>';
                if (isCorporate) {
                    // IE6 Fix: Use <br> instead of <br/>
                    contentHtml += '<p><i>' + activeStory.date + '</i></p><br>';
                }
                
                var storyText = isCorporate ? activeStory.text : activeStory.fullStory;
                // IE6 Fix: Use <br> instead of <br/>
                var formattedStory = (storyText || '').replace(/\n/g, '<br><br>');
                var boxHeight = isCorporate ? '250px' : '300px';
                
                // IE6 Fix: Use a fixed line-height value instead of a decimal.
                contentHtml += '<div class="inset-box" style="padding: 10px; height: ' + boxHeight + '; line-height: 12pt;">' + formattedStory + '</div>';
                
                var backText = isCorporate ? '[ Back to All Updates ]' : '[ Back to All Headlines ]';
                // IE6 Fix: Use <br> instead of <br/>
                contentHtml += '<br><p><a href="#" id="back-to-all-link">' + backText + '</a></p>';

            } else {
                // RENDER HEADLINE LIST
                pageTitle = isCorporate ? "GeoFire '99 Corporate News Archive" : "World News - 1999";
                icon = isCorporate ? '/assets/images/welcome_icon.gif' : '/assets/images/text_icon.gif';
                
                if (newsItems.length > 0) {
                    var listStyle = isCorporate ? 'list-style-type: none; margin: 0; padding: 0;' : '';
                    contentHtml += '<ul style="' + listStyle + '">';
                    for (var i = 0; i < newsItems.length; i++) {
                        var item = newsItems[i];
                        if (isCorporate) {
                             var rowStyle = 'padding: 8px; border-bottom: 1px dotted #ccc;';
                             if (i % 2 === 1) {
                                 rowStyle += ' background:#f4f4f4;';
                             }
                             contentHtml += '<li style="' + rowStyle + '">' +
                                           // IE6 Fix: Use 'rel' instead of 'data-index'
                                           '<a href="#" class="headline-link" rel="' + i + '">' + item.headline + '</a>' +
                                           // IE6 Fix: Use <br> instead of <br/>
                                           '<br><span style="font-size:7pt; color:#555;">' + item.date + '</span>' +
                                           '</li>';
                        } else {
                             contentHtml += '<li style="margin: 8px 0;">' +
                                       // IE6 Fix: Use 'rel' instead of 'data-index'
                                       '<a href="#" class="headline-link" rel="' + i + '">' + item.headline + '</a>' +
                                       '</li>';
                        }
                    }
                    contentHtml += '</ul>';
                } else {
                    contentHtml += '<p>Loading news... Please check back in a moment.</p>';
                }
            }
            
            var windowContent = '<div style="padding: ' + (isCorporate ? '5px' : '10px') + ';">' +
                                  contentHtml +
                                  // IE6 Fix: Use <br> instead of <br/>
                                  '<br><center><a href="/">[ Back to Main Portal ]</a></center>' +
                               '</div>';

            return G.components.renderRetroWindow(pageTitle, windowContent, { icon: icon });
        },

        attachEvents: function() {
            var backLink = document.getElementById('back-to-all-link');
            if (backLink) {
                backLink.onclick = backToAll;
            }

            var headlineLinks = document.getElementsByTagName('a');
            for (var i = 0; i < headlineLinks.length; i++) {
                if (headlineLinks[i].className === 'headline-link') {
                    headlineLinks[i].onclick = handleHeadlineClick;
                }
            }
        }
    };
})();