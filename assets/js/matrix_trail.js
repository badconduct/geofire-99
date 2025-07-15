// Retro Matrix Trail Effect for GeoFire '99
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
  window.GeoFire_MatrixUtils = {
    init: function () {
      if (document.body) {
        this.createChars();
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
        setTimeout('window.GeoFire_MatrixUtils.init()', 200);
      }
    },
    createChars: function () {
      for (var i = 0; i < this.numChars; i++) {
        var c = document.createElement('div');
        c.style.position = 'absolute';
        c.style.top = '0px';
        c.style.left = '0px';
        c.style.visibility = 'hidden';
        c.style.zIndex = '1001';
        c.style.fontFamily = 'monospace, "Courier New"';
        c.style.fontSize = '12pt';
        c.style.fontWeight = 'bold';
        // --- IE6 Compatibility Fix ---
        // Add explicit dimensions and initial content to prevent element collapse.
        c.innerHTML = this.trailChars[0];
        c.style.color = this.trailColors[this.trailColors.length - 1]; // Start dim
        c.style.width = '1em';
        c.style.height = '1em';
        c.style.lineHeight = '1em';
        document.body.appendChild(c);
        this.chars[i] = c;
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

      var charEl = this.chars[this.charIndex];
      charEl.innerHTML = this.trailChars[Math.floor(Math.random() * this.trailChars.length)];
      charEl.style.left = this.mouseX + 'px';
      charEl.style.top = this.mouseY + 'px';
      charEl.style.visibility = 'visible';
      charEl.style.color = this.trailColors[0]; // Set to brightest color

      this.fadeChar(this.charIndex, 1); // Start fading from the second color
      this.charIndex = (this.charIndex + 1) % this.numChars;
    },
    fadeChar: function (index, colorStep) {
      if (colorStep >= this.trailColors.length) {
        this.chars[index].style.visibility = 'hidden';
        return;
      }
      this.chars[index].style.color = this.trailColors[colorStep];
      var nextStep = colorStep + 1;
      setTimeout('window.GeoFire_MatrixUtils.fadeChar(' + index + ',' + nextStep + ')', 50);
    },
    // --- Configuration and State ---
    numChars: 25,
    trailChars: ['█', '▓', '▒', '░'], // Using safer, more common block characters
    trailColors: ['#00FF00', '#00DD00', '#00BB00', '#009900', '#007700', '#005500'],
    chars: [],
    charIndex: 0,
    mouseX: 0,
    mouseY: 0
  };

  // No explicit .bind() call needed here anymore. The logic is inside init().

  // Start the process
  window.GeoFire_MatrixUtils.init();
})();
