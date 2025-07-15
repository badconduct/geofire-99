// Retro Sparkle Trail Effect for GeoFire '99
// Compatible with Internet Explorer 6+ and other old browsers.
(function () {
  var path = window.location.pathname.toLowerCase();
  var isRoot = path.slice(-1) === '/';
  var isIndex = path.indexOf('/index.html', path.length - 11) !== -1;

  // Only run the script on the root of the site or on index.html
  if (!isRoot && !isIndex) {
    return;
  }

  // This object will be globally accessible for setTimeout calls.
  window.GeoFire_SparkleUtils = {
    init: function () {
      if (document.body) {
        this.createSparkles();
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
        setTimeout('window.GeoFire_SparkleUtils.init()', 200);
      }
    },
    createSparkles: function () {
      for (var i = 0; i < this.numSparkles; i++) {
        var s = document.createElement('div');
        s.style.position = 'absolute';
        s.style.top = '0px';
        s.style.left = '0px';
        s.style.visibility = 'hidden';
        s.style.zIndex = '1001';
        s.style.fontFamily = 'serif';
        s.style.fontSize = '14pt';
        s.style.fontWeight = 'bold';
        s.innerHTML = this.sparkleChar;
        // --- IE6 Compatibility Fix ---
        // Add explicit dimensions to prevent element collapse.
        s.style.width = '1em';
        s.style.height = '1em';
        s.style.lineHeight = '1em';
        document.body.appendChild(s);
        this.sparkles[i] = s;
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

      var sparkle = this.sparkles[this.sparkleIndex];
      sparkle.style.left = this.mouseX + 'px';
      sparkle.style.top = this.mouseY + 'px';
      sparkle.style.visibility = 'visible';
      sparkle.style.color = this.sparkleColors[this.sparkleIndex % this.sparkleColors.length];

      this.fadeSparkle(this.sparkleIndex, 100);
      this.sparkleIndex = (this.sparkleIndex + 1) % this.numSparkles;
    },
    fadeSparkle: function (index, opacity) {
      if (opacity <= 0) {
        this.sparkles[index].style.visibility = 'hidden';
        return;
      }
      if (this.isIE) {
        this.sparkles[index].style.filter = 'alpha(opacity=' + opacity + ')';
      } else {
        this.sparkles[index].style.opacity = opacity / 100;
      }
      var nextOpacity = opacity - 10;
      setTimeout('window.GeoFire_SparkleUtils.fadeSparkle(' + index + ',' + nextOpacity + ')', 50);
    },
    // --- Configuration and State ---
    numSparkles: 20,
    sparkleChar: '*',
    sparkleColors: ['#FFFFFF', '#FFFF00', '#00FFFF', '#FF00FF'],
    sparkles: [],
    sparkleIndex: 0,
    mouseX: 0,
    mouseY: 0,
    isIE: document.all && !window.opera
  };

  // No explicit .bind() call needed here anymore. The logic is inside init().

  // Start the process
  window.GeoFire_SparkleUtils.init();
})();
