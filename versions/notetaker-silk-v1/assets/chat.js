/* ═══════════════════════════════════════════════════════════════════════
   chat.js — the gate

   Loaded BEFORE knowledge.js, which is what makes the handshake work: this
   file only registers `window.AIMY_GATE`, and knowledge.js calls `init(api)`
   from its own boot once the conversation machinery is up. Nothing here runs
   on its own clock.

   WHAT THIS FILE IS NOT. It does not render conversations, threads, messages
   or answers — those are the Console's, reached by id and reused verbatim.
   What it owns is the shell around them: the greeting, the suggestion chips,
   the dust, the rail's collapse, and the one piece of state that tells the page
   whether it is empty or in a conversation.

   THE API IS NARROW ON PURPOSE. `submit`, `paintThread`, `paintChats`, the
   agent registry and two accessors. No `patch`, no `writeURL`, no
   `applyFilters` — "the gate does not manipulate the surface" is a property
   of what it can reach, not a rule somebody has to remember.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ══ SUGGESTIONS ═══════════════════════════════════════════════════════
     One set, because this build is one agent. QA, Talent and Sales are their
     own deployments behind the tab strip; nothing on this page chooses who
     answers, so there is nothing to vary the list by.

     Rendered with `.overlay-sugg-chip`, the Console's class, so the delegated
     handler that already routes a chip click into `submit` picks these up with
     nothing added to it.

     EVERY ONE OF THESE WAS RUN AGAINST THE ANSWER ENGINE AND KEPT ONLY IF THE
     ANSWER CAME BACK GROUNDED. Not a formality: the first draft was written
     from what the product sounds like it should handle, and half of it --
     "what of mine still needs a decision?", "which answers are standing on
     expired sources?" -- resolved to "Nothing in the corpus grounds an answer
     to that." A suggestion the product cannot answer is worse than none: it is
     the product demonstrating its own floor, on the screen everybody sees
     first. These three are the Console's own OPENERS, which return the richest
     answers here -- full prose, inline citations, a source list. */
  const SUGGESTIONS = [
    'Can EU customers get a refund after activating?',
    'What does the corpus say about data residency?',
    'Which articles contradict each other on refunds?'
  ];

  let API = null;

  /* ══ EMPTY OR IN A CONVERSATION ════════════════════════════════════════
     One attribute on <body>, and every difference between the two states —
     the greeting, the bloom, the chips, whether the composer floats in the
     middle or sits on the floor — hangs off it in CSS. No element is measured
     and nothing is toggled individually.

     Read from the DOM rather than tracked in a variable because the thread is
     written by three different callers in knowledge.js (`push`, `paintThread`
     and the answer swap inside `ask`), and a flag maintained beside them would
     be a fourth thing to keep in step. */
  function syncThreadState() {
    const th = $('#overlayThread');
    if (!th) return;
    const active = API ? API.hasTurns() : th.children.length > 0;
    document.body.setAttribute('data-thread', active ? 'active' : 'empty');
  }

  /* ══ CHIPS ═════════════════════════════════════════════════════════════
     `--i` carries the index and CSS turns it into the delay. The repo already
     uses this idiom and css-audit already exempts the token, so the stagger
     costs one custom property and no JavaScript timers — which also means it
     cannot desynchronise from the paint. */
  function paintChips() {
    const host = $('#gateChips');
    if (!host || !API) return;
    host.innerHTML = SUGGESTIONS.map((q, i) =>
      `<button class="overlay-sugg-chip" type="button" style="--i:${i}">${API.esc(q)}</button>`
    ).join('');
  }

  /* ══ DUST ══════════════════════════════════════════════════════════════
     Twenty-eight motes drifting up through the bloom. A FIXED TABLE, not
     `Math.random()`: a random field is different every load, which means it
     can never be reviewed, tuned, or reproduced when somebody says "that one
     in the corner is too bright". These numbers can be argued with.

     Each row is [x%, y%, size px, peak opacity, rise vh, sideways vw, seconds].
     Rise is negative because they go up. Durations are spread across 19-43s
     and share no common factor with each other in any obvious way, so the
     field never falls into a visible pulse.

     All seven values become custom properties and CSS does the rest — no
     timers, no rAF, nothing on the main thread after this runs once. */
  const DUST = [
    [  4, 82, 2.0, 0.30, -62, 1.4, 31], [ 11, 96, 1.4, 0.20, -74, -0.9, 38],
    [ 17, 71, 2.6, 0.34, -55,  2.1, 25], [ 23, 88, 1.2, 0.16, -68, -1.6, 41],
    [ 29, 63, 1.8, 0.26, -49,  0.7, 28], [ 34, 92, 2.2, 0.31, -71, -2.3, 34],
    [ 40, 77, 1.3, 0.18, -58,  1.9, 43], [ 45, 99, 2.8, 0.36, -80, -1.1, 22],
    [ 51, 68, 1.6, 0.23, -52,  2.6, 37], [ 56, 85, 2.1, 0.29, -66, -0.6, 26],
    [ 62, 94, 1.1, 0.15, -76,  1.2, 40], [ 67, 73, 2.4, 0.33, -54, -2.8, 29],
    [ 73, 90, 1.7, 0.24, -70,  0.4, 35], [ 78, 66, 2.0, 0.28, -47,  1.7, 23],
    [ 84, 97, 1.5, 0.21, -79, -1.4, 42], [ 89, 79, 2.5, 0.35, -60,  2.2, 27],
    [ 94, 87, 1.3, 0.17, -67, -0.8, 39], [ 98, 70, 1.9, 0.27, -51,  1.0, 32],
    [  8, 61, 1.6, 0.22, -45, -1.9, 36], [ 20, 99, 2.3, 0.32, -83,  0.9, 24],
    [ 37, 58, 1.2, 0.14, -42,  2.4, 44], [ 48, 81, 1.9, 0.25, -63, -1.3, 30],
    [ 59, 60, 2.7, 0.34, -44,  1.5, 21], [ 70, 98, 1.4, 0.19, -81, -2.0, 45],
    [ 81, 64, 1.8, 0.26, -48,  0.6, 33], [ 92, 93, 2.2, 0.30, -73, -1.7, 28],
    [ 14, 75, 1.1, 0.13, -57,  2.8, 46], [ 65, 84, 1.5, 0.20, -64, -0.5, 20]
  ];

  function paintDust() {
    const host = $('#gateDust');
    if (!host) return;
    host.innerHTML = DUST.map((m, i) =>
      `<span class="gate-mote" style="--x:${m[0]}%;--y:${m[1]}%;--s:${m[2]}px;` +
      `--o:${m[3]};--t:${m[4]}vh;--dx:${m[5]}vw;--d:${m[6]}s;--i:${i}"></span>`
    ).join('');
  }

  /* ══ THE RAIL ══════════════════════════════════════════════════════════
     One button, and what it does follows from what the rail currently is.
     Above 900 the conversation column is part of the layout, so the button
     COLLAPSES it and gives the width back. Below 900 it is already a drawer,
     so the same button OPENS it. Two behaviours rather than two controls,
     because they are the same intent — "get the list out of my way" and "bring
     the list back" — and a second button for the second half of that would be
     a second thing to find.

     The label has to move with the behaviour or the button lies in one of the
     two states, which is worse than having no label at all. */
  const NARROW = '(max-width: 56.25rem)';
  const RAIL_KEY = 'aimy-gate-rail';
  const isNarrow = () => window.matchMedia(NARROW).matches;

  function setRail(state) {
    if (state) document.body.setAttribute('data-rail', state);
    else document.body.removeAttribute('data-rail');

    const narrow = isNarrow();
    const shown = narrow ? state === 'open' : state !== 'collapsed';
    const label = narrow
      ? (shown ? 'Close conversations' : 'Open conversations')
      : (shown ? 'Collapse conversations' : 'Show conversations');
    /* Both placements, because only one is ever on screen and whichever it is
       has to describe the same state. */
    $$('[data-rail-toggle]').forEach((t) => {
      t.setAttribute('aria-expanded', shown ? 'true' : 'false');
      t.setAttribute('aria-label', label);
      t.setAttribute('title', label);
    });
  }

  function toggleRail() {
    const cur = document.body.getAttribute('data-rail');
    if (isNarrow()) { setRail(cur === 'open' ? '' : 'open'); return; }
    const next = cur === 'collapsed' ? '' : 'collapsed';
    setRail(next);
    /* Only the desktop collapse is remembered. A drawer is a momentary thing;
       restoring one on load would open a panel over the conversation somebody
       came back to read. */
    try { localStorage.setItem(RAIL_KEY, next); } catch (e) {}
  }

  /* ══ BOOT ══════════════════════════════════════════════════════════════ */
  function init(api) {
    API = api;

    const name = $('#gateName');
    /* First name only. "Hello, Nour Wael" is a greeting from an institution;
       the product already knows which one it is talking to. */
    if (name && api.user && api.user.name) name.textContent = String(api.user.name).split(' ')[0];

    paintChips();
    paintDust();
    syncThreadState();

    /* Restore the collapse, and only on a width where collapsing means
       anything. Reading it through a try/catch because a locked-down browser
       throws on localStorage rather than returning null, and a thrown boot is
       a blank page. */
    let remembered = '';
    try { remembered = localStorage.getItem(RAIL_KEY) || ''; } catch (e) {}
    setRail(!isNarrow() && remembered === 'collapsed' ? 'collapsed' : '');

    /* The thread is written by knowledge.js, which has no reason to know this
       shell exists. Observing it keeps the seam one-directional: the gate
       reacts to the conversation rather than the conversation reporting to the
       gate. childList only — the answer swap inside `ask` replaces a bubble's
       innerHTML, and subtree:true would fire this on every character of it. */
    const th = $('#overlayThread');
    if (th && window.MutationObserver) {
      new MutationObserver(syncThreadState).observe(th, { childList: true });
    }

    document.addEventListener('click', (e) => {
      const t = e.target;
      let el;

      if (t.closest('[data-rail-toggle]')) { toggleRail(); return; }
      if (t.closest('#gateScrim')) { setRail(''); return; }
      /* Below 900px the rail is a drawer over the conversation, so choosing
         one has to put it away — otherwise the thing you just opened is behind
         the thing you opened it from. */
      if (t.closest('[data-chat], [data-newchat]') && isNarrow()) setRail('');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      /* Escape on the gate must never dismiss the surface the page is made of,
         so the drawer is the only thing it closes. */
      if (document.body.getAttribute('data-rail') === 'open') setRail('');
    });

    /* Landing with the caret in the box is the whole promise of a chat-first
       front door. Only when there is nothing to read yet — arriving into a
       conversation, the thread is what you came for. */
    const input = $('#overlayInput');
    if (input && !api.hasTurns()) input.focus();
  }

  window.AIMY_GATE = { init: init };
})();
