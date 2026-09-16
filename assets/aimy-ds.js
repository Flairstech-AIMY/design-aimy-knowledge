/* ═══════════════════════════════════════════════════════════════════════
   aimy-ds.js — AiMY Design System behaviour, product-consumable layer
   ───────────────────────────────────────────────────────────────────────
   EXTRACTED, NOT AUTHORED. Source: design-system/index.html <script> block
   (lines 11012-11823) at commit fef41de.

   Kept   theme toggle · tab switcher · outside-click/Escape closers ·
          filter-tray chips · the delegated data-* click router · the
          Enter-to-submit handler · the whole .v2-dropdown controller
          (keyboard model, typeahead, ARIA normalisation, hidden input).
   Dropped the copy engine, sidebar scrollspy, quick-find, and every
          demo* function — documentation-page behaviour with no product use.

   ONE ADAPTATION, stated rather than smuggled in: the source's
   [data-submit-on-enter] handler called the page's demoSendOverlay()
   directly. Here it dispatches a bubbling 'aimy:submit' CustomEvent, so
   the product owns what submitting means without this file knowing.

   The pre-paint theme script is NOT here — it must run before first paint
   and is inlined in each page's <head>.
   ═══════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   THEME TOGGLE
═══════════════════════════════════════════════════ */
(function () {
  const btn = document.getElementById('ds-theme-toggle');
  if (!btn) return;
  /* Swapping the theme re-resolves every token at once, and any element that
     also declares a transition on the property that changed will ANIMATE to
     its new value instead of arriving at it. Measured before this existed:
     .entry-action crossfaded rgb(51,105,255) -> rgb(29,78,216) over 150ms
     while the topnav beside it, which transitions nothing, flipped on the
     same frame. Half the page dissolving into the new theme while the other
     half snaps is not a transition, it is a tear — and it read as the button
     having kept the old theme's fill, because for 150ms it had.

     So the swap is not a moment to animate: nothing moved, nothing opened,
     a value was simply replaced. `.theme-swapping` suppresses transitions for
     exactly one frame while that happens. Removed on the frame AFTER the
     paint, not on a timer — a timer either fires early and lets the tail of
     the swap animate, or fires late and eats the first real interaction. */
  let swapFrame = 0;
  btn.addEventListener('click', function () {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';

    root.classList.add('theme-swapping');
    if (next === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    /* Force the recalc now, with transitions still suppressed, so the new
       values are committed before anything is allowed to animate again.
       This is the same idiom knowledge.js already uses. */
    void root.offsetWidth;

    /* rAF does not fire in a hidden tab, and this class suppresses ALL motion
       while it is on — the one failure that must not be possible here is it
       getting stuck. The timer is not a second mechanism, it is the floor
       under the first. */
    const release = function () { root.classList.remove('theme-swapping'); };
    cancelAnimationFrame(swapFrame);
    swapFrame = requestAnimationFrame(function () {
      swapFrame = requestAnimationFrame(release);
    });
    setTimeout(release, 100);

    try { localStorage.setItem('aimy-ds-theme', next); } catch (e) {}
  });
})();

/* ═══════════════════════════════════════════════════
   TABS — switch panel within a .ds-tabs group
═══════════════════════════════════════════════════ */
function dsTab(btn, panelId) {
  const root = btn.closest('.ds-section') || document;
  root.querySelectorAll('.ds-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  root.querySelectorAll('.ds-tabpanel').forEach(p => {
    p.style.display = (p.getAttribute('data-tp') === panelId) ? '' : 'none';
  });
}

/* ═══════════════════════════════════════════════════
   ONE LAYER AT A TIME

   Every transient surface on this page opened without knowing the others were
   there: the bell, the account menu, a document's version list, a dropdown, a
   settings popover. Two could therefore stand at once, each waiting for a
   click SOMEWHERE ELSE to dismiss it - and the click that opened the second
   was never the one that dismissed the first. So opening a menu while another
   was open left both on screen, overlapping, and the only way out was a third
   click on the page behind them.

   A layer announces itself here and says two things about itself: whether it
   is open, and how to close. Opening any one closes the rest.

   WHAT COUNTS AS A LAYER. A surface that FLOATS over the page and is dismissed
   by looking away from it. A disclosure that lives in the document flow - a
   rail section, the answer's trace, a tree branch - is not one, and must not
   be closed by this: collapsing the section somebody was reading because they
   opened the bell throws away their place for nothing.
   ═══════════════════════════════════════════════════ */
window.AIMY_LAYERS = (function () {
  var reg = [];
  function closeAll(except) {
    for (var i = 0; i < reg.length; i++) {
      var l = reg[i];
      if (l === except) continue;
      /* One layer that throws on close must not strand the others open. */
      try { if (l.isOpen()) l.close(); } catch (e) {}
    }
  }
  return {
    add: function (layer) { reg.push(layer); return layer; },
    closeAll: closeAll,
    openCount: function () {
      var n = 0;
      reg.forEach(function (l) { try { if (l.isOpen()) n++; } catch (e) {} });
      return n;
    }
  };
})();

/* Close open menus / popovers on outside click or Escape */
document.addEventListener('click', function (e) {
  document.querySelectorAll('.menu-anchor.open, .pop.open').forEach(function (el) {
    if (!el.contains(e.target)) el.classList.remove('open');
  });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') document.querySelectorAll('.menu-anchor.open, .pop.open').forEach(el => el.classList.remove('open'));
});


/* ═══════════════════════════════════════════════════
   FILTER TRAY — chip selection
═══════════════════════════════════════════════════ */
function toggleFilterChip(btn) {
  btn.classList.toggle('active');
}
function clearFilterChips(btn) {
  const tray = btn.closest('.filter-tray-inner');
  if (tray) tray.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
}

/* ═══════════════════════════════════════════════════
   DELEGATED EVENT BINDING

   One listener on the document, dispatching on data-*
   attributes. Replaces the inline onclick string
   handlers that used to be scattered through the page.

   Why it matters beyond tidiness: inline handlers are
   parsed as script from a markup attribute, which is
   exactly what a strict Content-Security-Policy blocks.
   A component whose behaviour lives in an attribute
   cannot be shipped into a CSP-enforcing product, and
   markup copied from this page would carry that
   limitation with it.

   closest() resolves nesting on its own — an inner
   handler wins over an outer one without needing
   event.stopPropagation().
═══════════════════════════════════════════════════ */
document.addEventListener('click', function (e) {
  const t = e.target;
  let el;


  /* ── Overlay open / close / toggle by id ── */
  if ((el = t.closest('[data-open]')))   { byId(el, 'data-open',   n => n.classList.add('open'));    return; }
  if ((el = t.closest('[data-close]')))  { byId(el, 'data-close',  n => n.classList.remove('open')); return; }
  if ((el = t.closest('[data-toggle]'))) { byId(el, 'data-toggle', n => n.classList.toggle('open')); return; }
  if ((el = t.closest('[data-show]')))   { byId(el, 'data-show',   n => n.style.display = 'flex');   return; }
  if ((el = t.closest('[data-hide]')))   { byId(el, 'data-hide',   n => n.style.display = 'none');   return; }

  /* Backdrop dismiss — only when the backdrop itself was clicked */
  if (t.hasAttribute && t.hasAttribute('data-hide-on-backdrop')) {
    t.style.display = 'none';
    return;
  }

  /* ── Removal ── */
  if ((el = t.closest('[data-remove-parent]'))) { el.parentElement.remove(); return; }
  if ((el = t.closest('[data-remove-closest]'))) {
    const target = el.closest(el.getAttribute('data-remove-closest'));
    if (target) target.remove();
    return;
  }

  /* ── Single-select within a sibling group ── */
  if ((el = t.closest('[data-select-sibling]'))) {
    Array.from(el.parentElement.children).forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    return;
  }

  /* ── Tabs ── */
  if ((el = t.closest('[data-tab]'))) { dsTab(el, el.getAttribute('data-tab')); return; }

  /* ── Number stepper ── */
  if ((el = t.closest('[data-step]'))) {
    const input = el.parentElement.querySelector('input');
    if (input) {
      const delta = parseInt(el.getAttribute('data-step'), 10);
      input.value = Math.max(0, (parseInt(input.value, 10) || 0) + delta);
    }
    return;
  }

  /* ── Password visibility ── */
  if ((el = t.closest('[data-toggle-pw]'))) {
    const input = document.getElementById(el.getAttribute('data-toggle-pw'));
    if (input) {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      el.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    }
    return;
  }

  /* ── Briefing card ── */
  if ((el = t.closest('[data-toggle-dismiss]'))) {
    const picker = el.closest('.bcard-ack-row').querySelector('.bcard-dismiss-picker');
    if (picker) picker.classList.toggle('open');
    return;
  }
  if ((el = t.closest('[data-toggle-card]'))) {
    const panel = el.querySelector('.bcard-data');
    if (panel) panel.classList.toggle('open');
    const chev = el.querySelector('.expand-toggle');
    if (chev) chev.classList.toggle('open');
    return;
  }

  /* ── Filter tray ── */
  if ((el = t.closest('[data-filter-chip]'))) { toggleFilterChip(el); return; }
  if ((el = t.closest('[data-clear-filter-chips]'))) { clearFilterChips(el); return; }
});

function byId(el, attr, fn) {
  const node = document.getElementById(el.getAttribute(attr));
  if (node) fn(node);
}

/* Enter submits, Shift+Enter newlines — delegated, no inline onkeydown.
   Adapted from the source: dispatch an event, do not call a page function. */
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter' || e.shiftKey) return;
  const ta = e.target.closest && e.target.closest('[data-submit-on-enter]');
  if (!ta) return;
  e.preventDefault();
  ta.dispatchEvent(new CustomEvent('aimy:submit', { bubbles: true }));
});

/* ═══════════════════════════════════════════════════
   DROPDOWN (.v2-dropdown)

   A custom listbox replaces the native <select>, so
   everything the platform used to provide has to be
   re-implemented here: keyboard navigation, typeahead,
   focus management and the ARIA that makes it announce
   as a listbox. That work is the cost of the custom
   control — skipping it produces a div that looks like
   a select and is unusable without a mouse.

   Pattern: button[aria-haspopup=listbox][aria-expanded]
   + panel[role=listbox][aria-activedescendant]
   + options[role=option][aria-selected].
   Focus moves to the panel on open; the active option
   is tracked with aria-activedescendant.
═══════════════════════════════════════════════════ */
(function () {
  let openDD = null;
  let typeBuf = '', typeTimer = null;

  const parts = dd => ({
    btn:   dd.querySelector('.v2-dropdown-btn'),
    panel: dd.querySelector('.v2-dropdown-panel'),
    opts:  Array.from(dd.querySelectorAll('.v2-dropdown-option'))
  });

  function ensureIds(dd) {
    const { panel, opts } = parts(dd);
    if (!panel.id) panel.id = 'dd-panel-' + Math.random().toString(36).slice(2, 8);
    opts.forEach((o, i) => { if (!o.id) o.id = panel.id + '-opt-' + i; });
  }

  function setActive(dd, opt) {
    const { panel, opts } = parts(dd);
    opts.forEach(o => o.classList.remove('is-active'));
    if (!opt) return;
    opt.classList.add('is-active');
    panel.setAttribute('aria-activedescendant', opt.id);
    /* keep the active row in view without scrolling the page */
    const pr = panel.getBoundingClientRect(), or = opt.getBoundingClientRect();
    if (or.bottom > pr.bottom) panel.scrollTop += or.bottom - pr.bottom;
    else if (or.top < pr.top)  panel.scrollTop -= pr.top - or.top;
  }

  var ddLayer = window.AIMY_LAYERS.add({
    name: 'dropdown',
    isOpen: function () { return !!openDD; },
    close: function () { if (openDD) close(openDD, false); }
  });

  function open(dd) {
    if (openDD && openDD !== dd) close(openDD, false);
    /* Dropdowns already stood aside for each other. This is the rest of the
       page: a bell, an account menu and a version list are just as much in the
       way as a second dropdown would be. */
    window.AIMY_LAYERS.closeAll(ddLayer);
    ensureIds(dd);
    const { btn, panel, opts } = parts(dd);
    panel.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    openDD = dd;
    panel.setAttribute('tabindex', '-1');
    panel.focus();
    setActive(dd, opts.find(o => o.getAttribute('aria-selected') === 'true') || opts[0]);
  }

  function close(dd, refocus) {
    const { btn, panel, opts } = parts(dd);
    panel.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    panel.removeAttribute('aria-activedescendant');
    opts.forEach(o => o.classList.remove('is-active'));
    if (openDD === dd) openDD = null;
    if (refocus) btn.focus();
  }

  function choose(dd, opt) {
    const { btn, opts } = parts(dd);
    opts.forEach(o => { o.setAttribute('aria-selected', 'false'); o.classList.remove('selected'); });
    opt.setAttribute('aria-selected', 'true');
    opt.classList.add('selected');

    const label = btn.querySelector('.dd-label-text');
    const value = opt.getAttribute('data-value') || opt.textContent.trim();
    if (label) label.textContent = value;

    /* mirror into a hidden input so the control can live in a real form */
    const input = dd.querySelector('input[type="hidden"]');
    if (input) { input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); }

    /* .active-filter marks "not the default" — first option is the default */
    btn.classList.toggle('active-filter', opts.indexOf(opt) !== 0);
    dd.dispatchEvent(new CustomEvent('dd:change', { bubbles: true, detail: { value: value } }));
    close(dd, true);
  }

  function move(dd, delta) {
    const { opts } = parts(dd);
    const cur = opts.findIndex(o => o.classList.contains('is-active'));
    let next = cur + delta;
    if (next < 0) next = 0;
    if (next > opts.length - 1) next = opts.length - 1;
    setActive(dd, opts[next]);
  }

  function typeahead(dd, ch) {
    clearTimeout(typeTimer);
    typeBuf += ch.toLowerCase();
    typeTimer = setTimeout(() => { typeBuf = ''; }, 500);
    const { opts } = parts(dd);
    const hit = opts.find(o => o.textContent.trim().toLowerCase().startsWith(typeBuf));
    if (hit) setActive(dd, hit);
  }

  document.addEventListener('click', function (e) {
    const opt = e.target.closest('.v2-dropdown-option');
    if (opt) { choose(opt.closest('.v2-dropdown'), opt); return; }

    const btn = e.target.closest('.v2-dropdown-btn');
    if (btn) {
      if (btn.disabled) return;
      const dd = btn.closest('.v2-dropdown');
      (dd === openDD) ? close(dd, true) : open(dd);
      return;
    }
    if (openDD) close(openDD, false);
  });

  document.addEventListener('keydown', function (e) {
    const btn = e.target.closest && e.target.closest('.v2-dropdown-btn');
    if (btn && !openDD) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(btn.closest('.v2-dropdown'));
      }
      return;
    }
    if (!openDD) return;

    const dd = openDD;
    switch (e.key) {
      case 'Escape':    e.preventDefault(); close(dd, true); break;
      case 'Tab':       close(dd, false); break;
      case 'ArrowDown': e.preventDefault(); move(dd, 1); break;
      case 'ArrowUp':   e.preventDefault(); move(dd, -1); break;
      case 'Home':      e.preventDefault(); setActive(dd, parts(dd).opts[0]); break;
      case 'End':       e.preventDefault(); setActive(dd, parts(dd).opts.slice(-1)[0]); break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const act = parts(dd).opts.find(o => o.classList.contains('is-active'));
        if (act) choose(dd, act);
        break;
      }
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) typeahead(dd, e.key);
    }
  });

  /* Normalise markup written without the full ARIA set */
  document.querySelectorAll('.v2-dropdown').forEach(dd => {
    const { btn, panel, opts } = parts(dd);
    if (!btn || !panel) return;
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-haspopup', 'listbox');
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('role', 'listbox');
    opts.forEach(o => {
      o.setAttribute('role', 'option');
      if (!o.hasAttribute('aria-selected')) {
        o.setAttribute('aria-selected', o.classList.contains('selected') ? 'true' : 'false');
      }
    });
    ensureIds(dd);
  });
})();
