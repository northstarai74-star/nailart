/**
 * art.js — procedural nail-art artwork.
 *
 * Every visual on the site is drawn as inline SVG so the project ships with no
 * binary assets. `renderArt(el, style)` paints a tile; `mountArt(root)` walks the
 * DOM and paints anything carrying `data-art`.
 */
(function (global) {
  'use strict';

  var uid = 0;
  var NAIL = {
    almond: 'M50 8C69 20 79 60 77 110c-2 33-13 47-27 47s-25-14-27-47C21 60 31 20 50 8Z',
    coffin: 'M50 8c18 0 27 8 29 24l10 106c2 12-4 19-16 19H27c-12 0-18-7-16-19L21 32C23 16 32 8 50 8Z',
    square: 'M27 8h46c9 0 15 6 15 15v114c0 9-6 15-15 15H27c-9 0-15-6-15-15V23c0-9 6-15 15-15Z',
    stiletto: 'M50 4c14 22 24 66 26 112 1 26-11 41-26 41s-27-15-26-41C26 70 36 26 50 4Z'
  };

  /* Each palette is [background, wash, base, accent, detail]. */
  var PALETTES = {
    blush:    ['#F7EDEA', '#EFD9DD', '#E9C3CB', '#B8465C', '#FFFFFF'],
    mocha:    ['#F1EAE3', '#E0D2C4', '#C9AE95', '#6B4A34', '#FFF6EC'],
    noir:     ['#E9E5E4', '#CFC8C6', '#2A2422', '#C39A5A', '#F7F2EF'],
    lilac:    ['#EFEBF6', '#DED5EE', '#B9A7D6', '#5B4880', '#FFFFFF'],
    chrome:   ['#EAEBEE', '#D5D8DE', '#B6BCC6', '#5C636E', '#FFFFFF'],
    sage:     ['#EAEFE9', '#D3DED0', '#A8BCA3', '#41563C', '#FDFDF7'],
    coral:    ['#FBEAE1', '#F7D4C1', '#F0A882', '#B2422A', '#FFF7F0'],
    midnight: ['#E4E7EE', '#C6CDDD', '#1F2A44', '#8FA6D8', '#F2F5FF'],
    gold:     ['#F6EEDF', '#EDDFC2', '#DCC08A', '#8A6A2F', '#FFFDF6'],
    rose:     ['#F9E9EC', '#F2D2D9', '#D98A9C', '#7E2C3E', '#FFFFFF']
  };

  function el(name, attrs, kids) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (var k in attrs) {
      if (attrs[k] !== undefined && attrs[k] !== null) node.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (kid) { node.appendChild(kid); });
    return node;
  }

  /* Deterministic PRNG so a given tile always looks the same. */
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }

  /* ---------- finishes: paint one nail body ---------- */

  var FINISHES = {
    /* Classic french: pale base, crisp smile line. */
    french: function (g, p, defs, id, rand) {
      g.appendChild(el('path', { d: NAIL.almond, fill: p[2] }));
      g.appendChild(el('path', {
        d: 'M22 44c8 10 18 15 28 15s20-5 28-15c-1-19-11-32-28-36C33 12 23 25 22 44Z',
        fill: p[4], opacity: .95
      }));
      g.appendChild(el('path', { d: NAIL.almond, fill: 'url(#gloss' + id + ')' }));
    },

    /* Vertical ombre fade from base to accent. */
    ombre: function (g, p, defs, id) {
      var grad = el('linearGradient', { id: 'omb' + id, x1: 0, y1: 0, x2: 0, y2: 1 }, [
        el('stop', { offset: '0%', 'stop-color': p[4] }),
        el('stop', { offset: '48%', 'stop-color': p[2] }),
        el('stop', { offset: '100%', 'stop-color': p[3] })
      ]);
      defs.appendChild(grad);
      g.appendChild(el('path', { d: NAIL.almond, fill: 'url(#omb' + id + ')' }));
      g.appendChild(el('path', { d: NAIL.almond, fill: 'url(#gloss' + id + ')' }));
    },

    /* Marble veining over a milky base. */
    marble: function (g, p, defs, id, rand) {
      g.appendChild(el('path', { d: NAIL.almond, fill: p[4] }));
      var clip = el('clipPath', { id: 'clip' + id }, [el('path', { d: NAIL.almond })]);
      defs.appendChild(clip);
      var veins = el('g', { 'clip-path': 'url(#clip' + id + ')' });
      veins.appendChild(el('ellipse', { cx: 34, cy: 60, rx: 40, ry: 30, fill: p[1], opacity: .8 }));
      veins.appendChild(el('ellipse', { cx: 70, cy: 120, rx: 34, ry: 26, fill: p[2], opacity: .5 }));
      for (var i = 0; i < 3; i++) {
        var y = 40 + i * 38 + rand() * 12;
        veins.appendChild(el('path', {
          d: 'M6 ' + y + 'q22 -18 44 2t44 -6',
          fill: 'none', stroke: p[3], 'stroke-width': 1.4 - i * .25, opacity: .75,
          'stroke-linecap': 'round'
        }));
      }
      g.appendChild(veins);
      g.appendChild(el('path', { d: NAIL.almond, fill: 'url(#gloss' + id + ')' }));
    },

    /* Metallic chrome sweep. */
    chrome: function (g, p, defs, id) {
      var grad = el('linearGradient', { id: 'chr' + id, x1: 0, y1: 0, x2: 1, y2: 1 }, [
        el('stop', { offset: '0%', 'stop-color': p[4] }),
        el('stop', { offset: '28%', 'stop-color': p[2] }),
        el('stop', { offset: '52%', 'stop-color': p[3] }),
        el('stop', { offset: '74%', 'stop-color': p[2] }),
        el('stop', { offset: '100%', 'stop-color': p[4] })
      ]);
      defs.appendChild(grad);
      g.appendChild(el('path', { d: NAIL.almond, fill: 'url(#chr' + id + ')' }));
      g.appendChild(el('path', {
        d: 'M30 30c14 20 16 60 8 106', fill: 'none',
        stroke: p[4], 'stroke-width': 5, opacity: .5, 'stroke-linecap': 'round'
      }));
    },

    /* Hand-painted florals. */
    floral: function (g, p, defs, id, rand) {
      g.appendChild(el('path', { d: NAIL.almond, fill: p[1] }));
      var clip = el('clipPath', { id: 'clip' + id }, [el('path', { d: NAIL.almond })]);
      defs.appendChild(clip);
      var art = el('g', { 'clip-path': 'url(#clip' + id + ')' });
      for (var f = 0; f < 3; f++) {
        var cx = 26 + rand() * 48, cy = 40 + f * 38 + rand() * 10, r = 6 + rand() * 3;
        var flower = el('g', { transform: 'translate(' + cx + ' ' + cy + ')' });
        for (var petal = 0; petal < 5; petal++) {
          flower.appendChild(el('ellipse', {
            cx: 0, cy: -r, rx: r * .55, ry: r,
            fill: f % 2 ? p[4] : p[3], opacity: .92,
            transform: 'rotate(' + petal * 72 + ')'
          }));
        }
        flower.appendChild(el('circle', { r: r * .42, fill: p[3] === p[4] ? p[2] : '#C39A5A' }));
        art.appendChild(flower);
      }
      art.appendChild(el('path', {
        d: 'M18 150q26 -40 20 -80t14 -60', fill: 'none',
        stroke: p[3], 'stroke-width': 1.2, opacity: .55
      }));
      g.appendChild(art);
      g.appendChild(el('path', { d: NAIL.almond, fill: 'url(#gloss' + id + ')' }));
    },

    /* Fine-line minimalist graphics. */
    line: function (g, p, defs, id) {
      g.appendChild(el('path', { d: NAIL.almond, fill: p[4] }));
      var clip = el('clipPath', { id: 'clip' + id }, [el('path', { d: NAIL.almond })]);
      defs.appendChild(clip);
      var art = el('g', { 'clip-path': 'url(#clip' + id + ')', stroke: p[3], fill: 'none', 'stroke-width': 1.6, 'stroke-linecap': 'round' });
      art.appendChild(el('path', { d: 'M8 108q42 -34 84 -6' }));
      art.appendChild(el('path', { d: 'M8 124q42 -34 84 -6', opacity: .6 }));
      art.appendChild(el('circle', { cx: 50, cy: 56, r: 16 }));
      art.appendChild(el('path', { d: 'M50 30v52', opacity: .5 }));
      g.appendChild(art);
    },

    /* Glitter / chrome-fleck confetti. */
    glitter: function (g, p, defs, id, rand) {
      g.appendChild(el('path', { d: NAIL.almond, fill: p[2] }));
      var clip = el('clipPath', { id: 'clip' + id }, [el('path', { d: NAIL.almond })]);
      defs.appendChild(clip);
      var art = el('g', { 'clip-path': 'url(#clip' + id + ')' });
      for (var i = 0; i < 46; i++) {
        var x = 10 + rand() * 80, y = 10 + rand() * 140;
        var weight = rand();
        art.appendChild(el('circle', {
          cx: x, cy: y, r: .8 + weight * 2.2,
          fill: weight > .65 ? p[4] : p[3],
          opacity: (.35 + weight * .6).toFixed(2)
        }));
      }
      g.appendChild(art);
      g.appendChild(el('path', { d: NAIL.almond, fill: 'url(#gloss' + id + ')' }));
    },

    /* Encapsulated jelly with a foil flake. */
    jelly: function (g, p, defs, id, rand) {
      g.appendChild(el('path', { d: NAIL.almond, fill: p[2], opacity: .82 }));
      var clip = el('clipPath', { id: 'clip' + id }, [el('path', { d: NAIL.almond })]);
      defs.appendChild(clip);
      var art = el('g', { 'clip-path': 'url(#clip' + id + ')' });
      for (var i = 0; i < 7; i++) {
        var x = 18 + rand() * 62, y = 26 + rand() * 112, s = 6 + rand() * 10;
        art.appendChild(el('path', {
          d: 'M0 0l' + s + ' ' + (s * .3) + 'l' + (-s * .2) + ' ' + s + 'l' + (-s * .8) + ' ' + (-s * .4) + 'Z',
          transform: 'translate(' + x + ' ' + y + ') rotate(' + (rand() * 360).toFixed(0) + ')',
          fill: p[3], opacity: .8
        }));
      }
      g.appendChild(art);
      g.appendChild(el('path', { d: NAIL.almond, fill: 'url(#gloss' + id + ')' }));
    },

    /* Celestial: stars and a crescent. */
    celestial: function (g, p, defs, id, rand) {
      g.appendChild(el('path', { d: NAIL.almond, fill: p[2] }));
      var clip = el('clipPath', { id: 'clip' + id }, [el('path', { d: NAIL.almond })]);
      defs.appendChild(clip);
      var art = el('g', { 'clip-path': 'url(#clip' + id + ')' });
      art.appendChild(el('path', {
        d: 'M62 44a22 22 0 1 0 0 34 26 26 0 0 1 0-34Z', fill: p[3]
      }));
      for (var i = 0; i < 9; i++) {
        var x = 14 + rand() * 72, y = 22 + rand() * 128, s = 2 + rand() * 4;
        art.appendChild(el('path', {
          d: 'M0 ' + -s + 'q' + s * .3 + ' ' + s * .7 + ' ' + s + ' ' + s +
             'q' + -s * .7 + ' ' + s * .3 + ' ' + -s + ' ' + s +
             'q' + -s * .3 + ' ' + -s * .7 + ' ' + -s + ' ' + -s +
             'q' + s * .7 + ' ' + -s * .3 + ' ' + s + ' ' + -s + 'Z',
          transform: 'translate(' + x + ' ' + y + ')', fill: p[4], opacity: .9
        }));
      }
      g.appendChild(art);
      g.appendChild(el('path', { d: NAIL.almond, fill: 'url(#gloss' + id + ')' }));
    },

    /* Animal print. */
    leopard: function (g, p, defs, id, rand) {
      g.appendChild(el('path', { d: NAIL.almond, fill: p[1] }));
      var clip = el('clipPath', { id: 'clip' + id }, [el('path', { d: NAIL.almond })]);
      defs.appendChild(clip);
      var art = el('g', { 'clip-path': 'url(#clip' + id + ')' });
      for (var i = 0; i < 10; i++) {
        var x = 14 + rand() * 72, y = 24 + rand() * 124, r = 5 + rand() * 4;
        art.appendChild(el('ellipse', { cx: x, cy: y, rx: r, ry: r * .78, fill: p[2], opacity: .85 }));
        art.appendChild(el('path', {
          d: 'M' + (x - r - 2) + ' ' + y + 'a' + (r + 2) + ' ' + (r + 1) + ' 0 0 1 ' + (2 * r + 4) + ' 0',
          fill: 'none', stroke: p[3], 'stroke-width': 2.2, 'stroke-linecap': 'round',
          transform: 'rotate(' + (rand() * 360).toFixed(0) + ' ' + x + ' ' + y + ')'
        }));
      }
      g.appendChild(art);
      g.appendChild(el('path', { d: NAIL.almond, fill: 'url(#gloss' + id + ')' }));
    }
  };

  var FINISH_NAMES = Object.keys(FINISHES);
  var PALETTE_NAMES = Object.keys(PALETTES);

  /**
   * Paint a tile.
   * @param {Element} node    container (usually `.art`)
   * @param {string}  finish  key of FINISHES, or 'auto'
   * @param {string}  palette key of PALETTES, or 'auto'
   * @param {string}  seed    any string; identical seeds render identically
   */
  function renderArt(node, finish, palette, seed) {
    var rand = rng(hashString(String(seed || node.dataset.art || 'lacque') + '::' + finish + palette));
    var f = FINISHES[finish] ? finish : FINISH_NAMES[Math.floor(rand() * FINISH_NAMES.length)];
    var pKey = PALETTES[palette] ? palette : PALETTE_NAMES[Math.floor(rand() * PALETTE_NAMES.length)];
    var p = PALETTES[pKey];
    var id = ++uid;

    var svg = el('svg', {
      viewBox: '0 0 300 400', preserveAspectRatio: 'xMidYMid slice',
      role: 'img', 'aria-hidden': 'true', focusable: 'false'
    });
    var defs = el('defs');
    svg.appendChild(defs);

    /* Shared gloss highlight used by most finishes. */
    defs.appendChild(el('linearGradient', { id: 'gloss' + id, x1: 0, y1: 0, x2: 1, y2: 1 }, [
      el('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': .42 }),
      el('stop', { offset: '38%', 'stop-color': '#fff', 'stop-opacity': .06 }),
      el('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': .1 })
    ]));
    defs.appendChild(el('radialGradient', { id: 'bg' + id, cx: '30%', cy: '22%', r: '88%' }, [
      el('stop', { offset: '0%', 'stop-color': p[0] }),
      el('stop', { offset: '100%', 'stop-color': p[1] })
    ]));

    svg.appendChild(el('rect', { width: 300, height: 400, fill: 'url(#bg' + id + ')' }));

    /* Soft studio backdrop shapes. */
    svg.appendChild(el('circle', { cx: 236, cy: 82, r: 68, fill: p[2], opacity: .18 }));
    svg.appendChild(el('circle', { cx: 58, cy: 330, r: 92, fill: p[3], opacity: .08 }));
    svg.appendChild(el('path', {
      d: 'M0 400V286c74-34 132 24 300-22v136Z', fill: p[1], opacity: .55
    }));

    /* Three nails on a gentle arc. */
    var layout = [
      { x: 44,  y: 118, s: .78, r: -13 },
      { x: 116, y: 78,  s: .94, r: -2  },
      { x: 196, y: 104, s: .84, r: 10  }
    ];
    layout.forEach(function (slot, i) {
      var g = el('g', {
        transform: 'translate(' + slot.x + ' ' + slot.y + ') rotate(' + slot.r + ' 50 80) scale(' + slot.s + ')'
      });
      /* Drop shadow under each tip. */
      svg.appendChild(el('ellipse', {
        cx: slot.x + 50 * slot.s, cy: slot.y + 168 * slot.s,
        rx: 32 * slot.s, ry: 7 * slot.s, fill: p[3], opacity: .13
      }));
      FINISHES[f](g, p, defs, id + '_' + i, rand);
      svg.appendChild(g);
    });

    /* Signature speck of foil. */
    svg.appendChild(el('circle', { cx: 268, cy: 348, r: 5, fill: p[3], opacity: .55 }));

    node.innerHTML = '';
    node.appendChild(svg);
    node.dataset.artFinish = f;
    node.dataset.artPalette = pKey;
    return { finish: f, palette: pKey };
  }

  /** Paint every `[data-art]` inside `root`. */
  function mountArt(root) {
    var nodes = (root || document).querySelectorAll('[data-art]');
    Array.prototype.forEach.call(nodes, function (node) {
      renderArt(node, node.dataset.art, node.dataset.palette, node.dataset.seed || node.dataset.art);
    });
  }

  global.NailArt = {
    render: renderArt,
    mount: mountArt,
    finishes: FINISH_NAMES,
    palettes: PALETTE_NAMES
  };
})(window);
