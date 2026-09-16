/* ═══════════════════════════════════════════════════════════════════════
   motion.js — the substrate every animated surface in the product sits on

   Three jobs, and they are here together because they are the same job seen
   from three sides: make a change in this app READ as a change of state
   rather than as a repaint.

     1 · SWAPPING      A view is replaced by writing innerHTML. That is a
                       teardown, and the eye reads a teardown as a blink. swap()
                       turns it into a cross-dissolve, and flip() turns a
                       reordered set into a set that moved.
     2 · WAITING       There is no async in this product — no fetch, no await,
                       no promise. Every wait is fabricated, and until now each
                       one was a number chosen at its own call site (3000 here,
                       4000 there, 2200, 1400). latency owns them all, so the
                       app has one pace that can be turned off in one place the
                       day a real API arrives.
     3 · FINISHING     Not one transitionend or animationend listener existed;
                       durations were duplicated by hand between CSS and JS
                       (1.5s/1500, 5s/5000, 2.4s/2400) with nothing keeping the
                       pairs honest. after() reads the duration off the element.

   NOTHING HERE MAY DEPEND ON A FRAME ARRIVING. requestAnimationFrame does not
   fire in a backgrounded tab, and fires zero times in an embedded pane that
   never composites — the same reason halaska-mounts.js floors its run under a
   setTimeout and aimy-ds.js floors the theme swap at 100ms. Every path below
   either resolves on a timer as well, or is written so that the animation
   never arriving leaves the DOM in its correct final state anyway.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.documentElement;

  /* Read from the stylesheet rather than restated here. The scale lives in
     aimy-ds.css and this file is a consumer of it like any other. */
  function token(name, fallback) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }
  function ms(name, fallback) {
    var v = token(name, '');
    if (!v) return fallback;
    if (v.slice(-2) === 'ms') return parseFloat(v);
    if (v.slice(-1) === 's') return parseFloat(v) * 1000;
    return fallback;
  }

  function reduced() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ═══════════════════════════════════════════════
     FINISHING — 0.4

     `after` prefers the real event and keeps a floor under it. The floor is
     not a fallback for slow machines, it is the ONLY path in a pane that
     composites nothing: there, the event never comes and without the timer the
     callback would never run at all.
  ═══════════════════════════════════════════════ */
  function cssMs(el, which) {
    if (!el) return 0;
    var cs = getComputedStyle(el);
    var raw = (which === 'transition' ? cs.transitionDuration : cs.animationDuration) || '0s';
    /* The longest leg decides when the whole thing is over. */
    return raw.split(',').reduce(function (max, part) {
      part = part.trim();
      var n = parseFloat(part) * (part.slice(-2) === 'ms' ? 1 : 1000);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
  }

  function after(el, fn, opt) {
    opt = opt || {};
    var evt = opt.transition ? 'transitionend' : 'animationend';
    var wait = opt.ms != null ? opt.ms
      : cssMs(el, opt.transition ? 'transition' : 'animation');
    var done = false;
    function fire() {
      if (done) return;
      done = true;
      if (el) el.removeEventListener(evt, onEvt);
      fn();
    }
    function onEvt(e) { if (e.target === el) fire(); }
    if (el) el.addEventListener(evt, onEvt);
    /* +40ms so the event wins the race when there is one to win, and the timer
       is a floor rather than a competitor. */
    setTimeout(fire, Math.max(0, wait) + 40);
    return fire;
  }

  /* ═══════════════════════════════════════════════
     WAITING — 0.3

     A profile, not a per-call number. `instant` runs the work SYNCHRONOUSLY,
     which is the shape the real API wants: hold(0, fn) and fn() have to be
     indistinguishable, or every call site grows a branch for the day the
     fixtures are replaced.
  ═══════════════════════════════════════════════ */
  var FACTORS = { instant: 0, natural: 1, slow: 2.5 };
  var profile = (function () {
    var q = '';
    try { q = new URLSearchParams(location.search).get('latency') || ''; } catch (e) {}
    if (!q) { try { q = localStorage.getItem('aimy-latency') || ''; } catch (e) {} }
    return FACTORS[q] != null ? q : 'natural';
  })();

  var latency = {
    get profile() { return profile; },
    set profile(p) {
      if (FACTORS[p] == null) return;
      profile = p;
      try { localStorage.setItem('aimy-latency', p); } catch (e) {}
    },
    /* The one place a fabricated duration is scaled. Every call site keeps its
       own number as the argument — those numbers were reading decisions and
       they stay reading decisions; this only decides whether the reading
       happens at all. */
    ms: function (base) { return Math.round((base || 0) * FACTORS[profile]); },
    /* Returns a canceller in every case, including the synchronous one, so a
       caller never has to know which path it took. */
    hold: function (base, fn) {
      var wait = latency.ms(base);
      if (wait <= 0) { fn(); return function () {}; }
      var id = setTimeout(fn, wait);
      return function () { clearTimeout(id); };
    },
    /* A sequence of named beats — the shape a phased thinking state or a
       staged block-resolve wants. `onStep(name, i, total)` fires per beat,
       `done` once at the end. Cancelling stops the remaining beats. */
    steps: function (list, onStep, done) {
      var i = 0, cancelled = false, cancel = function () {};
      function next() {
        if (cancelled) return;
        if (i >= list.length) { if (done) done(); return; }
        var beat = list[i];
        onStep(beat.label != null ? beat.label : beat, i, list.length);
        i++;
        cancel = latency.hold(beat.ms != null ? beat.ms : 900, next);
      }
      next();
      return function () { cancelled = true; cancel(); };
    }
  };

  /* ═══════════════════════════════════════════════
     SWAPPING — 0.1

     Two mechanisms and a rule for choosing between them.

     A view transition is the right answer for a wholesale replacement: the
     browser photographs the old state, lets the mutation happen, and
     cross-fades the two. It is the only way to get continuity out of an
     innerHTML architecture without rewriting it into a diffing one. Elements
     that persist across the change can carry a view-transition-name and MORPH
     instead of dissolving.

     The mutation runs asynchronously inside it, which is the one thing callers
     have to know: anything that must read the DOM after a swap belongs inside
     the callback, not after the call.
  ═══════════════════════════════════════════════ */
  var supportsVT = typeof document.startViewTransition === 'function';
  var live = null;

  function swap(fn, opt) {
    opt = opt || {};
    /* Quiet is not a degraded swap, it is a different decision: the caller has
       said this change is not a change of state. Typing into a filter is the
       case that matters — a cross-dissolve on every debounced keystroke is the
       strobe this whole file exists to prevent. */
    if (opt.quiet || !supportsVT || reduced()) { fn(); return null; }

    /* A second navigation while the first is still dissolving abandons the
       first rather than queueing behind it. Queueing makes a fast sequence of
       clicks feel like the app is lagging the user, which is worse than not
       animating at all. */
    if (live && live.skipTransition) { try { live.skipTransition(); } catch (e) {} }

    var t;
    try { t = document.startViewTransition(fn); }
    catch (e) { fn(); return null; }
    live = t;
    var clear = function () { if (live === t) live = null; };
    var hush = function () {};
    /* EVERY promise this hands back has to be answered, including the ones
       nothing here waits on. A transition is SKIPPED whenever the document is
       hidden - a backgrounded tab, an embedded pane that composites nothing -
       and a skip REJECTS ready and finished. Left unhandled those surface as
       uncaught InvalidStateError in the console, five deep after a few
       navigations, for a condition that is entirely normal and already handled
       by the callback still running. */
    if (t.ready && t.ready.catch) t.ready.catch(hush);
    if (t.updateCallbackDone && t.updateCallbackDone.catch) t.updateCallbackDone.catch(hush);
    if (t.finished && t.finished.then) t.finished.then(clear, clear);
    /* The floor. `finished` never settles where nothing composites, and a
       permanently non-null `live` would make every later swap skip a
       transition that had already ended. */
    setTimeout(clear, ms('--t-slow', 400) + 400);
    return t;
  }

  /* ── IDENTICAL MARKUP IS NOT A REPAINT ──
     The cheapest transition is the one that does not happen. A filter that
     narrows to the same set, a tab clicked twice, a popstate that lands where
     it started: all of them currently tear down a region and build back the
     same bytes, which resets scroll, drops focus, and replays every entrance
     animation attached to anything inside.

     The cached string is written only here, so a host whose descendants are
     mutated surgically elsewhere must not be passed through this — see
     knowledge.js for which regions qualify. */
  function paintInto(host, html, opt) {
    if (!host) return false;
    opt = opt || {};
    if (host.__aimyPaint === html) return false;
    host.__aimyPaint = html;

    /* Scroll and focus are half of what makes a repaint read as a blink. A
       stage that rebuilds and lands at the top has moved the reader without
       being asked to. */
    var scroller = opt.scroll || null;
    var top = scroller ? scroller.scrollTop : 0;
    var active = document.activeElement;
    var path = (opt.keepFocus && active && host.contains(active)) ? focusPath(active) : null;

    host.innerHTML = html;

    if (scroller && scroller.scrollTop !== top) scroller.scrollTop = top;
    if (path) refocus(host, path);
    return true;
  }

  function dirty(host) { if (host) host.__aimyPaint = null; }

  /* ── WHEN DID THE REPAINT ACTUALLY LAND? ──
     Inside a view transition the mutation runs on the browser's schedule, not
     on ours, so anything that has to touch an element the repaint PRODUCES
     cannot simply run on the next line.

     The pattern this replaces is a fixed `setTimeout(fn, 30)` - a guess that
     happened to be longer than a frame, which is to say a race that happened
     to be winnable. Where a transition is in flight this waits on the real
     event; where there is none it keeps the old 30ms so nothing that depended
     on that ordering changes behaviour.

     setTimeout(0) after the callback resolves, not the callback itself,
     because updateCallbackDone settles as a microtask - at which point the DOM
     is written but style has not been recalculated, and a caller measuring or
     focusing wants the layout, not just the nodes. */
  function afterPaint(fn) {
    if (live && live.updateCallbackDone && live.updateCallbackDone.then) {
      var run = function () { setTimeout(fn, 0); };
      live.updateCallbackDone.then(run, run);
      return;
    }
    setTimeout(fn, 30);
  }

  /* Focus survives by address, because the node itself does not survive at
     all. An id wins where there is one; otherwise the element is found by its
     position among its own kind, which is stable for a list that re-rendered
     with the same shape. */
  function focusPath(el) {
    if (el.id) return { id: el.id, start: el.selectionStart, end: el.selectionEnd };
    var sel = el.tagName.toLowerCase();
    if (el.name) sel += '[name="' + el.name + '"]';
    var all = el.parentNode ? Array.prototype.slice.call(el.parentNode.querySelectorAll(sel)) : [];
    return { sel: sel, i: all.indexOf(el), start: el.selectionStart, end: el.selectionEnd };
  }
  function refocus(host, p) {
    var el = p.id ? document.getElementById(p.id)
      : (host.querySelectorAll(p.sel)[p.i] || null);
    if (!el || !el.focus) return;
    el.focus({ preventScroll: true });
    if (p.start != null && el.setSelectionRange) {
      try { el.setSelectionRange(p.start, p.end); } catch (e) {}
    }
  }

  /* ── FLIP ──
     First, Last, Invert, Play. A set that reorders or narrows is a set that
     MOVED; rebuilding it at new coordinates is the blink again, one level down.

     All reads happen before any write — that is the whole discipline, and
     getting it wrong here costs more than the repaint this replaces, because
     a read after a write forces a synchronous layout per element.

     fill: 'none' is deliberate. The DOM is already in its final, correct state
     before the animation starts; if no frame ever arrives the element is
     simply where it belongs. The motion is an addition, never a dependency. */
  function flip(nodes, mutate, opt) {
    opt = opt || {};
    var list = Array.prototype.slice.call(nodes || []);
    if (reduced() || !list.length || !list[0].animate) { mutate(); return; }

    var first = list.map(function (n) { return n.getBoundingClientRect(); });
    mutate();
    var last = list.map(function (n) { return n.getBoundingClientRect(); });

    var dur = opt.ms || ms('--t-base', 250);
    var ease = opt.ease || token('--ease-out', 'cubic-bezier(0.22,1,0.36,1)');
    var stagger = opt.stagger || 0;
    var moved = 0;
    for (var i = 0; i < list.length; i++) {
      var a = first[i], b = last[i];
      /* Out of the layout at either end — an entrance or an exit, not a move,
         and the two are somebody else's animation. */
      if (!a.width && !a.height) continue;
      if (!b.width && !b.height) continue;
      var dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) continue;
      list[i].animate(
        [{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' }, { transform: 'none' }],
        { duration: dur, easing: ease, fill: 'none',
          delay: Math.min(moved, 8) * stagger });
      moved++;
    }
  }

  window.AIMY_MOTION = {
    reduced: reduced,
    token: token,
    ms: ms,
    cssMs: cssMs,
    after: after,
    latency: latency,
    swap: swap,
    supportsViewTransitions: supportsVT,
    paintInto: paintInto,
    dirty: dirty,
    afterPaint: afterPaint,
    flip: flip
  };
})();
