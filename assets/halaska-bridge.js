/* ═══════════════════════════════════════════════════════════════════════
   halaska-bridge.js — teach Halaska Kit to speak AiMY

   The kit ships its own design language: Geist, a #60a5fa blue, and radii
   that START at the 16px AiMY uses as its LARGEST. Dropped in unbridged,
   every kit component reads as a foreign panel pasted into the product.

   Nothing here forks the kit. Three of its four design axes are already
   open:

     colour   `tokens.dark` / `tokens.light` are plain mutable objects, and
              usePal(theme) reads them on every render
     motion   the `motion` object is CSS custom properties with fallbacks —
              --halaska-t-* / --halaska-e-* — so setting them on :root wins
     type     tokens.font reads --halaska-sans / --halaska-mono

   So the bridge writes AiMY's own resolved token values into those, and
   the components come out wearing the product.

   READ THROUGH getComputedStyle, NOT from the stylesheet text. aimy-ds.css
   reaches most of its values through the alias layer (--accent -> --qa-accent
   and ~300 more call sites), and var() only resolves at use time. Reading the
   declaration would hand us the string "var(--qa-accent)"; reading the
   computed value hands us the colour, in whichever theme is live.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!window.Halaska) {
    console.warn('[halaska-bridge] load after halaska-kit.bundle.js — nothing to bridge');
    return;
  }

  var Kit = window.Halaska;
  var read = function (name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback || '';
  };

  /* ── COLOUR ───────────────────────────────────────────────────────────
     The kit asks for 31 roles; AiMY names its surfaces and its ink
     separately, so each one is mapped by what it is FOR, not by position
     in a ramp.

     The three "quieter text" roles are the ones to be careful with. The
     kit reaches for textTertiary and textMuted to say a thing is less
     important, which in this product is the one thing type may not do —
     every ink role here clears AA (floor 5.37:1) precisely so that a state
     is said in words and colour rather than by making it harder to read.
     So these map onto AiMY's named ink roles and stop there: the hierarchy
     survives, the muting does not. A kit component that wanted to whisper
     will speak instead, which is the house style. */
  function paletteFromCSS() {
    return {
      bg:            read('--body-bg'),
      bgElevated:    read('--card-bg-raised'),
      bgSubtle:      read('--card-bg'),
      bgMuted:       read('--card-bg-raised'),
      bgHover:       read('--card-bg-raised'),
      bgInput:       read('--card-bg'),

      border:        read('--card-border'),
      borderSubtle:  read('--card-border'),
      borderInput:   read('--card-border'),
      borderFocus:   read('--brand'),

      text:          read('--text-strong'),
      textSecondary: read('--text-primary'),
      textTertiary:  read('--text-secondary'),
      textMuted:     read('--text-subtext'),
      textInverse:   read('--body-bg'),

      shadow:        read('--shadow-sm'),
      shadowMd:      read('--shadow-md'),
      shadowLg:      read('--shadow-lg'),

      /* All four from the BRAND family, and that matters: AiMY carries two
         brand colours — --brand (#3369ff) and --accent, which is the QA/AI
         purple (#8b4ff4). The kit assumes accent and accentBg are the same
         hue and fills a surface with one while drawing its border in the
         other. Mapping the tint to --accent-dim while accent stayed --brand
         produced exactly that: HandoffPattern rendered a purple block with a
         blue left border. One family, all four. */
      accent:        read('--brand'),
      accentHover:   read('--brand-hover', read('--brand')),
      accentBg:      read('--brand-dim'),
      accentText:    read('--brand'),

      success:       read('--ok'),
      successHover:  read('--ok'),
      successBg:     read('--ok-bg'),
      warning:       read('--warn', read('--ok')),
      warningHover:  read('--warn', read('--ok')),
      warningBg:     read('--warn-bg', read('--ok-bg')),
      danger:        read('--err'),
      dangerHover:   read('--err'),
      dangerBg:      read('--err-bg')
    };
  }

  /* ── SHAPE ────────────────────────────────────────────────────────────
     AiMY's radius scale tops out at 16px, which is where the kit's begins.
     Mapped by ROLE rather than by name, so `radius.md` — what most kit
     components reach for — lands on AiMY's card radius instead of its
     largest. Left unmapped, every kit surface would be rounder than any
     surface beside it. */
  function shapeFromCSS() {
    return {
      radius: {
        xs:   parseFloat(read('--r-sm',  '6px')),
        sm:   parseFloat(read('--r-md',  '8px')),
        md:   parseFloat(read('--r-lg',  '10px')),
        lg:   parseFloat(read('--r-xl',  '12px')),
        xl:   parseFloat(read('--r-2xl', '16px')),
        pill: 9999
      },
      space: {
        xs: 4, sm: 8, md: 16, lg: 32, xl: 40, xxl: 80, xxxl: 160, xxxxl: 240
      }
    };
  }

  /* ── MOTION ───────────────────────────────────────────────────────────
     Straight onto the seven-rung AiMY scale. The kit's five duration names
     map by USAGE, not by nearest number: `normal` is what its opens run on
     so it takes --t-base; `fast` is hovers and closes so it takes --t-fast.

     --halaska-e-out gets AiMY's --ease-out, which is NOT the CSS keyword:
     in this product that name means cubic-bezier(0.22,1,0.36,1). Same
     spelling as the kit's own ease-out, opposite meaning — which is exactly
     why the kit's _root.css was never imported wholesale. */
  function applyMotion() {
    var s = document.documentElement.style;
    s.setProperty('--halaska-t-fast',   read('--t-fast',     '150ms'));
    s.setProperty('--halaska-t-normal', read('--t-base',     '250ms'));
    s.setProperty('--halaska-t-smooth', read('--t-medium',   '350ms'));
    s.setProperty('--halaska-t-spring', read('--t-slow',     '400ms'));
    s.setProperty('--halaska-t-slow',   read('--t-emphasis', '500ms'));

    var easeOut = read('--ease-out', 'cubic-bezier(0.22,1,0.36,1)');
    var spring  = read('--ease-spring', 'cubic-bezier(0.34,1.56,0.64,1)');
    s.setProperty('--halaska-e-inout',  easeOut);
    s.setProperty('--halaska-e-out',    easeOut);
    s.setProperty('--halaska-e-emph',   easeOut);
    s.setProperty('--halaska-e-spring', spring);
  }

  /* ── TYPE ─────────────────────────────────────────────────────────────
     setKitFont() is not used: it only takes a Google family name, appends a
     hardcoded fonts.googleapis.com link, and pre-marks Geist as loaded. The
     fonts are already on the page, so the variables are set directly and no
     second request is made for a face the product has.

     (Geist itself never arrives in this kit, in any project: injectStyles
     emits a @media rule ahead of its @import, and the parser drops any
     @import that is not first. Measured — zero rules in the CSSOM, zero
     requests to Google. Another reason to take the type from here.) */
  function applyType() {
    var s = document.documentElement.style;
    s.setProperty('--halaska-sans', read('--font-sans', '"Urbanist", system-ui, sans-serif'));
    s.setProperty('--halaska-mono', read('--font-mono', '"JetBrains Mono", monospace'));
  }

  /* ── SYNC ─────────────────────────────────────────────────────────────
     Only ONE theme's values are readable at a time — the computed value is
     whatever `data-theme` currently resolves to — so this fills the palette
     for the live theme and runs again when it changes. Both kit palettes are
     seeded on load so a component mounted with an explicit theme="light"
     against a dark page still has something coherent to read. */
  function sync() {
    var theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    var pal = paletteFromCSS();
    Object.assign(Kit.tokens[theme], pal);
    var shape = shapeFromCSS();
    Object.assign(Kit.tokens.radius, shape.radius);
    Object.assign(Kit.tokens.space, shape.space);
    applyMotion();
    applyType();
    return theme;
  }

  /* Mutating tokens does not re-render anything: usePal reads a plain object,
     so React has no reason to know it changed. Every live root is re-rendered
     by hand after a sync. `mount` keeps its roots in a WeakMap keyed by the
     host node, so the record of what to re-render is the same one that makes
     an update patch instead of remount. */
  var mounted = [];
  var _mount = Kit.mount;
  Kit.mount = function (el, Component, props, children) {
    var node = typeof el === 'string' ? document.querySelector(el) : el;
    var root = _mount.call(Kit, el, Component, props, children);
    mounted.push({ node: node, Component: Component, props: props || {}, children: children || null });
    return root;
  };

  function rerenderAll() {
    mounted = mounted.filter(function (m) { return m.node && m.node.isConnected; });
    mounted.forEach(function (m) { _mount.call(Kit, m.node, m.Component, m.props, m.children); });
  }

  var theme = sync();
  /* Seed the other palette too, so an explicitly-themed component is never
     reading the kit's stock greys. It is the live theme's values until the
     toggle has been through once, which is closer than #60a5fa. */
  Object.assign(Kit.tokens[theme === 'dark' ? 'light' : 'dark'], paletteFromCSS());

  /* The toggle swaps an attribute on <html> and fires nothing, so observe it.
     Same event the .theme-swapping guard rides. */
  new MutationObserver(function () { sync(); rerenderAll(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  Kit.bridge = { sync: sync, rerenderAll: rerenderAll, read: read, paletteFromCSS: paletteFromCSS };
})();
