// A central registry for all available plugins in GeoFire '99.
// This provides a single source of truth for plugin metadata.

module.exports = {
  hitcounter: {
    name: 'Hit Counter',
    legacyNames: ['HitCounter'],
    description: 'Adds a classic 90s-style visitor counter to your home page (index.html).',
    module: 'hitcounter.js'
  },
  guestbook: {
    name: 'Guestbook',
    description:
      'Adds a guestbook to your site. Choose between a link to a separate page or a form embedded directly on your home page.',
    module: 'guestbook.js',
    options: {
      displayMode: {
        label: 'Display Mode:',
        choices: [
          { value: 'link', text: 'Link to separate page (Default)' },
          { value: 'embed', text: 'Embed form on home page' }
        ]
      }
    }
  },
  webring: {
    name: 'Web Ring',
    legacyNames: ['WebRing'],
    description: 'Link to other sites in your neighborhood with a classic Web Ring navigation bar.',
    module: 'webring.js'
  },
  bgmusic: {
    name: 'Background Music (MIDI)',
    description:
      'Select a MIDI file from your /sounds folder to play automatically. Requires at least one .mid file to be uploaded.',
    module: 'bgmusic.js',
    hasDynamicOptions: true, // This is the key that triggers file system reads
    options: {
      file: {
        label: 'MIDI File:'
      }
    }
  },
  mousetrails: {
    name: 'Animated Mouse Trails',
    description: "Add a fun, animated trail effect to your visitors' mouse cursor.",
    module: 'mousetrails.js',
    options: {
      effect: {
        label: 'Trail Effect:',
        choices: [
          { value: 'matrix_trail.js', text: 'Matrix (Recommended)' },
          { value: 'sparkle_trail.js', text: 'Bright Sparkles' },
          { value: 'star_trail.js', text: 'Gold Stars' }
        ]
      }
    }
  },
  constructiongif: {
    name: 'Under Construction GIF',
    description: 'Place a classic animated "Under Construction" GIF on your page.',
    module: 'constructiongif.js',
    options: {
      gif: {
        label: 'GIF Style:',
        choices: [
          { value: 'construct_classic.gif', text: 'Classic' },
          { value: 'construct_blink.gif', text: 'Blinking Lights' },
          { value: 'construct_worker.gif', text: 'Working Man' }
        ]
      }
    }
  },
  flashplayer: {
    name: 'Flash Player',
    description:
      'Enables support for Macromedia Flash (.swf) animations and applications. This allows the AI to embed .swf files from your /flash directory.',
    module: 'flashplayer.js'
  }
};
