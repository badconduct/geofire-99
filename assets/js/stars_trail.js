// Retro Star Trail Effect for GeoFire '99
// Compatible with Internet Explorer 6+ and other old browsers.
(function () {
  // This object will be globally accessible for setTimeout calls.
  window.GeoFire_StarUtils = {
    init: function () {
      if (document.body) {
        this.createStars();
        // --- IE6 Compatibility Fix ---
        // Replaced .bind(this) with a manual closure and attachEvent for IE.
        var self = this;
        if (document.addEventListener) {
          document.addEventListener(
            'mousemove',
            function (e) {
              self.onMouseMove(e);
            },
            false
          );
        } else if (document.attachEvent) {
          document.attachEvent('onmousemove', function () {
            self.onMouseMove(window.event);
          });
        }
      } else {
        // If body isn't ready, try again.
        setTimeout('window.GeoFire_StarUtils.init()', 200);
      }
    },
    createStars: function () {
      for (var i = 0; i < this.numStars; i++) {
        var s = document.createElement('div');
        s.style.position = 'absolute';
        s.style.top = '0px';
        s.style.left = '0px';
        s.style.visibility = 'hidden';
        s.style.zIndex = '1001';
        s.style.fontFamily = 'serif';
        s.style.fontSize = '16pt';
        s.style.fontWeight = 'bold';
        s.style.color = this.starColor;
        s.innerHTML = this.starChar;
        // --- IE6 Compatibility Fix ---
        // Add explicit dimensions to prevent element collapse.
        s.style.width = '1em';
        s.style.height = '1em';
        s.style.lineHeight = '1em';
        s.style.pointerEvents = 'none';
        s.style.cursor = 'none';
        document.body.appendChild(s);
        this.stars[i] = s;
      }
    },
    onMouseMove: function (e) {
      if (!e) e = window.event; // IE compatibility

      if (e.pageX) {
        this.mouseX = e.pageX;
        this.mouseY = e.pageY;
      } else {
        // IE compatibility
        var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
        var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
        this.mouseX = e.clientX + scrollX;
        this.mouseY = e.clientY + scrollY;
      }

      var star = this.stars[this.starIndex];
      star.style.left = this.mouseX + 'px';
      star.style.top = this.mouseY + 'px';
      star.style.visibility = 'visible';

      this.fadeStar(this.starIndex, 100);
      this.starIndex = (this.starIndex + 1) % this.numStars;
    },
    fadeStar: function (index, opacity) {
      if (opacity <= 0) {
        this.stars[index].style.visibility = 'hidden';
        return;
      }
      if (this.isIE) {
        this.stars[index].style.filter = 'alpha(opacity=' + opacity + ')';
      } else {
        this.stars[index].style.opacity = opacity / 100;
      }
      var nextOpacity = opacity - 10;
      setTimeout('window.GeoFire_StarUtils.fadeStar(' + index + ',' + nextOpacity + ')', 70);
    },
    // --- Configuration and State ---
    numStars: 15,
    starChar: '*',
    starColor: '#FFFF00',
    stars: [],
    starIndex: 0,
    mouseX: 0,
    mouseY: 0,
    isIE: document.all && !window.opera
  };

  // No explicit .bind() call needed here anymore. The logic is inside init().

  // Start the process
  window.GeoFire_StarUtils.init();
})();
