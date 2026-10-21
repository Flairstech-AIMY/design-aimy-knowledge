/* ══ NOTETAKER — the Silk companion (AIMY-2684) ══════════════════════════════
   AiMY takes notes in a meeting. It is started from the live voice session
   (the "Notes" pill voice.js shows when this file is on the page), asks once
   for consent on the stage, and then the orb itself leaves the stage and
   floats in the corner, still listening.

   ONE CONVERSATION, TWO PLACES. The orb opens into a card; the card opens into
   the AiMY canvas. Both are drawn from the one model below — the stream, the
   notes, the open tab, Note or Ask, and the draft being typed — so nothing is
   ever "sent" from one to the other: it is already in both.

     collapsed   the Silk orb, who is speaking, a count of AiMY's new notes
     card        Chat (one stream: lines, AiMY's notes, your notes and
                 questions) | Notes (summary so far, decided, to do, waiting
                 on, yours); one bar that adds a Note or asks AiMY
     canvas      the Console's own canvas: the meeting is a row under "Now" in
                 the conversations column, the same chat replaces the thread,
                 the same notes sit in a column on the right, the canvas bar
                 gets the Note / Ask switch

   AFTER END, THREE STEPS IN THE CHAT. Processing the recording, Analyzing
   what was said, Summarizing: each ticks off with what it found and sends a
   notification (a banner that stacks, and a row in the topnav bell). The
   final notes are then posted in the chat and in Notes.

   THE MEETING IS A FIXTURE. There is no meeting app here and the browser
   cannot hear one, so a recorded Upland check-in plays at the pace of speech.
   Everything else — collapse, the canvas, notes, questions, the steps, the
   notifications — is real and works on whatever the fixture says.

   This file only touches the canvas through knowledge.js's AIMY_KNOW hooks
   (show, close, toast, bell, chats column) and the overlay's own elements. */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clock = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const K = () => window.AIMY_KNOW || null;

  /* Lucide 0.460, path data verbatim. */
  const I = {
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    square: '<rect width="18" height="18" x="3" y="3" rx="2"/>',
    max: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>',
    min: '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/>',
    pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
    up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    todo: '<path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5"/><path d="m9 11 3 3L22 4"/>',
    wait: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    spin: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    retry: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    cal: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>'
  };
  const ic = (n, s, cls) => `<svg class="nt-ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="${s || 16}" height="${s || 16}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  /* The product's own mark, from the page's own symbol. */
  const MARK = (s) => `<svg class="nt-mk" width="${s || 16}" height="${Math.round((s || 16) * 1.11)}" viewBox="0 0 18 20" aria-hidden="true"><use href="#aimy-logo-small"/></svg>`;

  /* ── The meeting (fixture) ───────────────────────────────────────────── */
  const MEET = 'Upland weekly check-in';
  const PHOTO = 'https://randomuser.me/api/portraits/';
  const P = {
    dana:  { name: 'Dana Whitfield', short: 'Dana',  ini: 'DW', photo: PHOTO + 'women/44.jpg' },
    priya: { name: 'Priya Raman',    short: 'Priya', ini: 'PR', photo: PHOTO + 'women/65.jpg' },
    ahmed: { name: 'Ahmed Mahfouz',  short: 'Ahmed', ini: 'AM', photo: PHOTO + 'men/46.jpg' },
    you:   { name: 'Nour Ali',       short: 'You',   ini: 'NA', photo: null }
  };
  const L = [
    { p: 'dana',  t: 40,  x: 'Thanks for joining. I want to start with the Freshdesk sync, because half of last week’s tickets never showed up.' },
    { p: 'ahmed', t: 82,  x: 'That was the merge tag rule. Merged tickets were skipped, which is right, but the rule also caught the parent ticket.' },
    { p: 'dana',  t: 125, x: 'So the parent tickets are missing too. That’s the part our agents noticed.' },
    { p: 'you',   t: 151, x: 'We can split it: skip the merged ticket, keep the parent. I can have that ready by Thursday.' },
    { p: 'priya', t: 190, x: 'If it’s Thursday, can we re-sync the last two weeks after that? Our team lead wants the March numbers clean.' },
    { p: 'ahmed', t: 228, x: 'Yes. Fourteen days is about two thousand tickets, and it runs in under an hour.' },
    { p: 'dana',  t: 302, x: 'Good. Second thing is the focus fields. Agents want Product and Plan on every answer.' },
    { p: 'you',   t: 340, x: 'Product is mapped already. Plan isn’t, because Freshdesk sends it as a code. I need the labels for those codes.' },
    { p: 'priya', t: 391, x: 'I’ll send you the list today. There are six plans, and two of them are retired.' },
    { p: 'dana',  t: 495, x: 'Last one. Renewal is in November, and I’d like a short note on what AiMY saved us this quarter.' },
    { p: 'ahmed', t: 537, x: 'I’ll pull that from the Usage page: chats answered, tickets solved without an agent, and time saved.' },
    { p: 'dana',  t: 580, x: 'Perfect. Let’s meet again next Tuesday, same time.' }
  ];
  /* What was decided and promised, keyed to the line it was said in. Not
     shown while the meeting runs: the analysis after it finds them. Kept for
     answering "What did I promise?" and "Decided so far" mid-meeting. */
  const N = {
    3:  { k: 'act',  h: 'To do',      x: 'You split the merge tag rule by Thursday 22 Oct.' },
    5:  { k: 'dec',  h: 'Decided',    x: 'Re-sync the last 14 days once the rule is split.' },
    7:  { k: 'wait', h: 'Waiting on', x: 'Labels for the six Plan codes, from Priya.' },
    8:  { k: 'act',  h: 'To do',      x: 'Priya sends the Plan labels today.' },
    10: { k: 'act',  h: 'To do',      x: 'Ahmed writes the renewal note from the Usage page.' },
    11: { k: 'dec',  h: 'Decided',    x: 'Next meeting Tuesday 27 Oct, same time.' }
  };
  const SUMMARY = 'The Freshdesk sync dropped parent tickets because the merge tag rule matched them too. The rule gets split by Thursday, then 14 days are re-synced. Plan needs labels before it can be a focus field, and Upland wants a value note before the November renewal.';
  const DECIDED = ['Split the merge tag rule: skip merged tickets, keep the parent.', 'Re-sync the last 14 days once the rule is split.', 'Next check-in Tuesday 27 Oct, same time.'];
  const TODO = [
    { who: 'you',   x: 'Split the merge tag rule',               m: 'Nour Ali, Thu 22 Oct' },
    { who: 'priya', x: 'Send the labels for the six Plan codes', m: 'Priya Raman, today' },
    { who: 'ahmed', x: 'Re-sync the last 14 days',               m: 'Ahmed Mahfouz, Fri 23 Oct' },
    { who: 'ahmed', x: 'Renewal note from the Usage page',       m: 'Ahmed Mahfouz, Fri 30 Oct' }
  ];
  const STEPS = [
    { run: 'Processing the recording', done: 'Recording processed', sub: '9 min 40 s, 4 speakers, 12 turns',               nf: 'Transcript ready: 12 turns from 4 speakers.' },
    { run: 'Analyzing what was said',  done: 'Analysis done',       sub: '3 decisions, 4 to-dos, 1 thing you’re waiting on', nf: 'Found 3 decisions and 4 to-dos.' },
    { run: 'Summarizing',              done: 'Summary written',     sub: 'Posted below and in Notes',                     nf: 'Your meeting notes are ready.' }
  ];
  /* Speech pace, a breath between speakers, and how long each step takes. */
  const WORD_MS = 150, LINE_GAP = 1300, STEP_MS = 2600, SHORT_S = 30, BANNER_MS = 6000;
  const STATUS = { live: 'Taking notes', ended: 'Meeting ended', writing: 'Writing the notes', ready: 'Notes ready', short: 'Too short to summarise', failed: 'Notes not written' };
  const ASK = 'Ask AiMY about this meeting';
  /* How long after the last word the call is treated as over. */
  const HANGUP_MS = 3500;

  /* ── The model ───────────────────────────────────────────────────────── */
  const S = { phase: 'off', view: 'fold', tab: 'chat', kind: 'note', draft: '', n: 0, clock: 0, unread: 0,
              items: [], steps: null, nfs: [], failNext: false, cvDraft: '' };
  let timers = [], tick = 0, nextT = 0, root = null, cvParts = null;
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  const clearAll = () => { timers.forEach(clearTimeout); timers = []; clearInterval(tick); tick = 0; clearTimeout(nextT); };
  const isLive = () => S.phase === 'live';
  const on = () => S.phase !== 'off';

  /* ── Pieces ──────────────────────────────────────────────────────────── */
  const av = (k, sm) => P[k].photo
    ? `<img class="nt-av${sm ? ' is-sm' : ''}" src="${P[k].photo}" alt="" decoding="async">`
    : `<span class="nt-av${sm ? ' is-sm' : ''}">${P[k].ini}</span>`;
  const words = (x) => x.split(' ').map((w) => `<span class="nt-wd">${esc(w)}</span>`).join(' ');
  const rec = '<span class="nt-rec" aria-hidden="true"></span>';
  const only = `<span class="nt-only">${ic('lock', 11)}Only you</span>`;
  const status = `<span class="nt-st" data-nt="status">${STATUS.live}</span>`;
  const timer = '<span class="nt-tm nt-live-only" data-nt="timer">0:00</span>';
  /* Notes end when the meeting does, like Gemini's in Meet. Stop is for
     ending early, when someone asks not to be recorded, so it is said in
     words and kept within reach. */
  const ctl = () => '<span class="nt-ctl nt-live-only">' +
    `<button class="nt-pill nt-end" type="button" data-nt-act="stop" title="Stop taking notes now">${ic('square', 11)}Stop</button></span>`;
  const chips = () => '<div class="nt-chips">' +
    '<button type="button" class="nt-chip" data-nt-ask="catch">Catch me up</button>' +
    '<button type="button" class="nt-chip" data-nt-ask="mine">What did I promise?</button>' +
    '<button type="button" class="nt-chip" data-nt-ask="dec">Decided so far</button></div>';
  const notesPanel = () => `<div class="nt-np" data-nt-np data-done="false">
    <p class="nt-np-state" data-nt="np-state" hidden></p>
    <div class="nt-np-live"><p class="nt-np-wait">${MARK(14)}<span>AiMY writes the summary, decisions and to-dos when the meeting ends. Until then, this is where your own notes go.</span></p></div>
    <div class="nt-np-final" data-nt="final"></div>
    <section><h5>${ic('pen', 14)}Your notes${only}</h5><ul data-nt="mine"></ul>
      <form class="nt-add" data-nt-noteform>${ic('pen', 14)}<input class="nt-add-in" data-nt-notedraft placeholder="Add a note and press Enter" aria-label="Add a private note" autocomplete="off"></form></section>
  </div>`;
  function finalHTML() {
    return `<div class="nt-sum"><p>${SUMMARY}</p></div>
      <div class="nt-rs"><h6>Decided</h6><ul>${DECIDED.map((d) => `<li>${ic('check', 15)}<span>${d}</span></li>`).join('')}</ul>
      <h6>To do</h6><ul>${TODO.map((t) => `<li>${av(t.who, true)}<span>${t.x}<small>${t.m}</small></span></li>`).join('')}</ul>
      <div class="nt-btns"><button class="btn btn-brand btn-sm" type="button" data-nt-act="doc">${ic('file', 14)}Open as a document</button>` +
      `<button class="btn btn-ghost btn-sm" type="button" data-nt-act="send">${ic('mail', 14)}Send to everyone</button>` +
      `<button class="btn btn-ghost btn-sm" type="button" data-nt-act="tasks">${ic('todo', 14)}Make 4 tasks</button></div></div>`;
  }

  /* ── The widget: the orb, and the card it opens into ─────────────────── */
  function mountWidget() {
    if (root) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="nt-w" id="ntWidget" data-view="fold" data-phase="live" data-tab="chat" hidden>
        <button class="nt-fold" type="button" data-nt-act="open" aria-label="Open the meeting notes" aria-expanded="false">
          <span class="nt-orb" data-nt-orb="fold"><canvas></canvas></span><span class="nt-badge" data-nt="count"></span>
          <span class="nt-who-pill">${rec}<span data-nt="who">Listening</span></span>
        </button>
        <button class="nt-x nt-after-only" type="button" data-nt-act="close" aria-label="Close the meeting notes" title="Close">${ic('x', 12)}</button>
        <div class="nt-card" role="dialog" aria-label="Meeting notes">
          <div class="nt-h"><span class="nt-orb is-sm" data-nt-orb="card"><canvas></canvas></span>
            <div class="nt-ht"><b>${MEET}</b><span class="nt-ps">${rec}${status}${timer}</span><span class="nt-who" data-nt="who"></span></div>
            <div class="nt-hb"><button class="nt-ib" type="button" data-nt-act="canvas" aria-label="Open in the canvas" title="Open in the canvas">${ic('max', 16)}</button>` +
            `<button class="nt-ib" type="button" data-nt-act="collapse" aria-label="Collapse to the orb" title="Collapse">${ic('min', 16)}</button>` +
            `<button class="nt-ib nt-after-only" type="button" data-nt-act="close" aria-label="Close the meeting notes" title="Close">${ic('x', 16)}</button></div>
          </div>
          <div class="nt-tabs" role="tablist"><button type="button" role="tab" data-nt-tab="chat" aria-selected="true">Chat</button><button type="button" role="tab" data-nt-tab="notes" aria-selected="false">Notes</button>${ctl()}</div>
          <div class="nt-body"><div class="nt-stream" data-nt-stream></div>${notesPanel()}</div>
          <form class="nt-cz nt-chat-only" data-nt-form>${chips()}
            <div class="overlay-input-bar nt-ask-bar"><span class="aimy-float-icon" aria-hidden="true">${MARK(16)}</span><input class="overlay-input nt-in" data-nt-draft placeholder="${ASK}" aria-label="${ASK}" autocomplete="off"><button class="overlay-send" aria-label="Ask">${ic('send', 14)}</button></div>
          </form>
        </div>
      </div>
      <div class="nt-banners" id="ntBanners" aria-live="polite"></div>`);
    root = $('#ntWidget');
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    root.addEventListener('input', onDraft);
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || S.view !== 'card') return;
      e.stopPropagation(); setView('fold');
      $('.nt-fold', root).focus();
    });
    $('#ntBanners').addEventListener('click', onClick);
    bindDrag();
    const silk = window.AIMY_VOICE && window.AIMY_VOICE.silk;
    $$('[data-nt-orb] canvas', root).forEach((c) => { if (silk) c._silk = silk(c); });
  }

  /* ── The canvas: injected once, shown only while the meeting is open ─── */
  function mountCanvas() {
    if (cvParts) return cvParts;
    const ov = $('#aimyOverlay'), main = ov && $('.overlay-main', ov), wrap = ov && $('.overlay-input-wrap', ov);
    if (!ov || !main || !wrap) return null;
    const input = $('#overlayInput', ov), bar = $('.overlay-input-bar', ov), sendBtn = $('#overlaySend', ov);
    wrap.insertAdjacentHTML('beforebegin', `<div class="nt-cv" data-nt-cv>
      <div class="nt-cv-h"><span class="nt-orb is-xs" data-nt-orb="canvas"><canvas></canvas></span>
        <div class="nt-ht"><b>${MEET}</b><span class="nt-ps">${rec}${status}${timer}</span><span class="nt-who" data-nt="who"></span></div>
        <div class="nt-tabs nt-cv-tabs" role="tablist"><button type="button" role="tab" data-nt-tab="chat" aria-selected="true">Chat</button><button type="button" role="tab" data-nt-tab="notes" aria-selected="false">Notes</button></div>
        ${ctl()}<button class="btn btn-ghost btn-sm nt-back" type="button" data-nt-act="back">${ic('min', 14)}<span>Back to the meeting</span></button>
      </div>
      <div class="nt-stream nt-cv-stream" data-nt-stream></div>
      <div class="nt-cv-np">${notesPanel()}</div>
    </div>`);
    wrap.insertAdjacentHTML('afterbegin', chips().replace('nt-chips', 'nt-chips nt-cv-chips'));
    const silk = window.AIMY_VOICE && window.AIMY_VOICE.silk;
    const c = $('[data-nt-orb="canvas"] canvas', ov); if (silk) c._silk = silk(c);
    ov.addEventListener('click', (e) => {
      if (!ov.classList.contains('is-meeting')) return;
      if (e.target.closest('.nt-cv, .nt-cv-chips')) onClick(e);
    });
    $('.nt-cv', ov).addEventListener('submit', onSubmit);
    $('.nt-cv', ov).addEventListener('input', onDraft);
    /* Every other conversation in the column is still a conversation: going
       to one leaves the meeting, and the orb comes back over the canvas. */
    $('#overlayChats').addEventListener('click', (e) => {
      if (e.target.closest('[data-nt-row]')) { e.stopPropagation(); toCanvas(); return; }
      if (ov.classList.contains('is-meeting') && e.target.closest('[data-chat], [data-newchat]')) leaveCanvas('fold');
    }, true);
    /* The canvas bar is the meeting's bar while the meeting is open. CAPTURE
       on its wrapper, so this runs before knowledge.js's send and voice.js's
       empty-bar voice button, and neither sees a note or a meeting question. */
    const take = (e) => {
      if (!ov.classList.contains('is-meeting')) return;
      e.preventDefault(); e.stopPropagation();
      S.draft = input.value; send();
    };
    wrap.addEventListener('keydown', (e) => { if (e.target === input && e.key === 'Enter' && !e.shiftKey) take(e); }, true);
    wrap.addEventListener('click', (e) => { if (sendBtn.contains(e.target)) take(e); }, true);
    input.addEventListener('input', () => { if (ov.classList.contains('is-meeting')) { S.draft = input.value; syncDraft(input); } });
    /* However the canvas closes — the ×, Escape, a click off it — the meeting
       goes back to being the card. */
    new MutationObserver(() => {
      if (!ov.classList.contains('open') && ov.classList.contains('is-meeting')) leaveCanvas('card');
    }).observe(ov, { attributes: true, attributeFilter: ['class'] });
    cvParts = { ov, input, bar, placeholder: input.getAttribute('placeholder') };
    replayInto(ov);
    return cvParts;
  }

  /* ── Drawing ─────────────────────────────────────────────────────────── */
  const all = (sel) => $$(sel).filter((el) => root && (root.contains(el) || (cvParts && cvParts.ov.contains(el))));
  const slots = (n) => all(`[data-nt="${n}"]`);

  function paint() {
    if (!root) return;
    const live = isLive();
    root.hidden = !on() || S.closed;
    root.dataset.side = S.side; root.dataset.vert = S.vert;
    root.dataset.view = S.view; root.dataset.phase = S.phase; root.dataset.tab = S.tab;
    if (cvParts) { cvParts.ov.dataset.ntPhase = S.phase; cvParts.ov.dataset.ntTab = S.tab; }
    $('.nt-fold', root).setAttribute('aria-expanded', String(S.view !== 'fold'));
    all('[data-nt-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.ntTab === S.tab)));
    if (cvParts && cvParts.ov.classList.contains('is-meeting')) cvParts.input.setAttribute('placeholder', ASK);
    slots('status').forEach((e) => { e.textContent = STATUS[S.phase] || ''; });
    slots('chat-sub').forEach((e) => { e.textContent = 'Meeting, ' + (STATUS[S.phase] || '').toLowerCase(); });
    if (!live) slots('who').forEach((e) => { e.textContent = 'The meeting has ended'; });
    slots('count').forEach((e) => {
      const show = S.view === 'fold' && (S.unread > 0 || S.phase === 'ready');
      e.classList.toggle('is-on', show); e.classList.toggle('is-ok', S.phase === 'ready' && !S.unread);
      e.innerHTML = S.unread ? String(S.unread) : S.phase === 'ready' ? ic('check', 11) : '';
    });
    all('[data-nt-np]').forEach((np) => { np.dataset.done = String(S.phase === 'ready'); });
    slots('final').forEach((f) => { if (S.phase === 'ready' && !f.innerHTML) f.innerHTML = finalHTML(); });
    const msg = { short: 'The meeting ran under 30 seconds, so there is nothing to summarise. What was said is kept.',
                  failed: 'AiMY couldn’t write the summary. The recording and the transcript are safe. Try again from the chat.',
                  writing: 'Writing the notes. They show here when the summary is done.' }[S.phase];
    slots('np-state').forEach((e) => { e.hidden = !msg; e.textContent = msg || ''; });
    paintClock();
    /* One orb runs at a time: the one you can see. */
    const want = S.view;
    all('[data-nt-orb] canvas').forEach((c) => {
      if (!c._silk) return;
      c._silk.phase(S.phase === 'live' ? 'listening' : S.phase === 'writing' ? 'thinking' : 'muted');
      if (on() && c.closest('[data-nt-orb]').dataset.ntOrb === want) c._silk.start(); else c._silk.stop();
    });
    /* The column and the bell only when what they show has changed. */
    const k = K(), sig = S.phase + S.view + (cvParts && cvParts.ov.classList.contains('is-meeting'));
    if (k && k.paintChats && sig !== paint.sig) { paint.sig = sig; k.paintChats(); }
    if (k && k.bellSync && S.nfs.length !== paint.nf) { paint.nf = S.nfs.length; k.bellSync(); }
  }
  function paintClock() { const t = clock(S.clock); slots('timer').forEach((e) => { e.textContent = t; }); }

  function itemHTML(it) {
    if (it.type === 'line') {
      const l = L[it.i], you = l.p === 'you';
      return `<div class="nt-cl${you ? ' is-you' : ''}">${you ? '' : av(l.p)}<div class="nt-cl-b"><div class="nt-cl-n"><span class="nt-sp-${l.p}">${you ? 'You' : P[l.p].short}</span><time>${clock(it.t)}</time></div><p>${words(l.x)}</p></div></div>`;
    }
    if (it.type === 'note') return `<div class="nt-an">${MARK(15)}<div><div class="nt-an-k">AiMY noted: ${it.n.h.toLowerCase()}</div><p>${it.n.x}</p></div></div>`;
    if (it.type === 'mine') return `<div class="nt-yn">${ic('pen', 14)}<div><div class="nt-yn-h">Your note, ${clock(it.t)} ${only}</div><p>${esc(it.x)}</p></div></div>`;
    if (it.type === 'ask') return `<div class="nt-q"><span>${esc(it.q)}</span>${only}</div><div class="nt-am">${MARK(15)}<div class="nt-am-b"><p>${words(it.a)}</p></div></div>`;
    if (it.type === 'steps') return stepsHTML();
    if (it.type === 'result') return `<div class="nt-am">${MARK(15)}<div class="nt-am-b"><p><b>Your notes for ${MEET}</b></p>${finalHTML()}</div></div>`;
    if (it.type === 'fail') return `<div class="nt-am">${MARK(15)}<div class="nt-am-b"><p class="nt-err">The summary didn’t finish.</p><p>The recording and the transcript are safe. Nothing was sent to anyone.</p><div class="nt-btns"><button class="btn btn-brand btn-sm" type="button" data-nt-act="retry">${ic('retry', 14)}Try again</button></div></div></div>`;
    if (it.type === 'short') return `<div class="nt-am">${MARK(15)}<div class="nt-am-b"><p>The meeting ran under 30 seconds, so there is nothing to summarise. What was said is kept above.</p></div></div>`;
    return '';
  }
  function stepsHTML() {
    return `<div class="nt-am" data-nt-steps>${MARK(15)}<div class="nt-am-b"><p>${S.how === 'stopped' ? 'You stopped notes' : 'The meeting ended'} at ${clock(S.clock)}. Writing your notes now; I’ll tell you when each part is done.</p><div class="nt-steps">` +
      STEPS.map((s, i) => {
        const st = S.steps[i];
        return `<div class="nt-step" data-s="${st}"><span class="nt-step-i">${ic('spin', 15, 'nt-i-run')}${ic('check', 15, 'nt-i-done')}${ic('alert', 15, 'nt-i-fail')}</span>` +
          `<span><b>${st === 'done' ? s.done : st === 'fail' ? 'Summary didn’t finish' : s.run}</b>${st === 'done' ? `<small>${s.sub}</small>` : ''}</span></div>`;
      }).join('') + '</div></div></div>';
  }

  /* Everything said goes to every stream there is, the card's and the
     canvas's, and into every notes panel. */
  function put(it, animate, scope) {
    const html = itemHTML(it);
    $$('[data-nt-stream]', scope).forEach((box) => {
      const near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      box.insertAdjacentHTML('beforeend', html);
      if (animate) stream(Array.from(box.lastElementChild.querySelectorAll('.nt-wd')));
      if (near || !animate) box.scrollTop = box.scrollHeight;
    });
    const sl = (n) => $$(`[data-nt="${n}"]`, scope);
    if (it.type === 'line') {
      const l = L[it.i];
      sl('who').forEach((e) => { e.textContent = l.p === 'you' ? 'You are speaking' : P[l.p].short + ' is speaking'; });
    }
    if (it.type === 'note') sl(it.n.k).forEach((ul) => { ul.querySelector('.is-none')?.remove(); ul.insertAdjacentHTML('beforeend', `<li>${it.n.x}</li>`); });
    if (it.type === 'mine') sl('mine').forEach((ul) => { ul.querySelector('.is-none')?.remove(); ul.insertAdjacentHTML('beforeend', `<li>${esc(it.x)}<small>${clock(it.t)}</small></li>`); });
  }
  function replayInto(scope) { S.items.forEach((it) => put(it, false, scope)); }
  function add(it, animate) {
    S.items.push(it);
    put(it, animate, document);
    if (animate && S.view === 'fold' && /^(result|fail)$/.test(it.type)) S.unread++;
    paint();
  }
  function stream(spans) {
    if (reduced() || !spans.length) return;
    spans.forEach((s) => s.classList.add('is-pre'));
    const orbs = all('[data-nt-orb] canvas').map((c) => c._silk).filter(Boolean);
    spans.forEach((s, i) => later(() => {
      s.classList.remove('is-pre');
      orbs.forEach((o) => o.level(0.35 + Math.random() * 0.45));
      if (i === spans.length - 1) later(() => orbs.forEach((o) => o.level(0)), 200);
      scrollAll();
    }, i * WORD_MS));
  }
  function scrollAll(force) {
    all('[data-nt-stream]').forEach((b) => { if (force || b.scrollHeight - b.scrollTop - b.clientHeight < 120) b.scrollTop = b.scrollHeight; });
  }
  function line(i, animate) {
    add({ type: 'line', i, t: animate ? S.clock : L[i].t }, animate);
  }
  function answer(k, q) {
    const dec = Object.keys(N).filter((x) => x < S.n && N[x].k === 'dec').map((x) => N[x].x);
    const t = (q || '').toLowerCase();
    if (!k) k = /promis|i said|\bmy\b/.test(t) ? 'mine' : /decid|agree/.test(t) ? 'dec' : /renew/.test(t) ? 'renew' : 'catch';
    const a = {
      catch: S.n < 3 ? 'Dana opened with the Freshdesk sync: last week’s tickets didn’t all arrive.'
        : 'The sync dropped parent tickets because of the merge tag rule. ' + (S.n > 4 ? 'You split the rule by Thursday, then 14 days get re-synced. ' : '') + (S.n > 8 ? 'Priya sends the Plan labels today.' : ''),
      mine: S.n > 3 ? 'You said you’d split the merge tag rule by Thursday 22 Oct, at 2:31.' + (S.n > 7 ? ' You also need the labels for the Plan codes, which Priya is sending.' : '') : 'Nothing yet.',
      dec: dec.length ? 'So far: ' + dec.join(' ') : 'Nothing has been decided yet.',
      renew: S.n > 9 ? 'Dana wants a short note before the November renewal. Ahmed writes it from the Usage page.' : 'Renewal hasn’t come up yet.'
    }[k];
    return { type: 'ask', q: q || { catch: 'Catch me up', mine: 'What did I promise?', dec: 'Decided so far' }[k], a: a.trim() };
  }

  /* ── The meeting runs ────────────────────────────────────────────────── */
  function runClock() { clearInterval(tick); tick = setInterval(() => { if (S.phase === 'live') { S.clock++; paintClock(); } }, 1000); }
  function next(delay) {
    clearTimeout(nextT);
    if (S.n >= L.length) { nextT = later(() => { if (isLive()) stop('ended'); }, HANGUP_MS); return; }
    nextT = later(() => {
      if (S.phase !== 'live') return;
      const i = S.n++; line(i, true);
      next(L[i].x.split(' ').length * WORD_MS + LINE_GAP);
    }, delay);
  }
  /* Clears what is drawn and draws the model again, everywhere. */
  function redraw() {
    all('[data-nt-stream]').forEach((b) => { b.innerHTML = ''; });
    all('[data-nt-np]').forEach((np) => {
      const fresh = document.createElement('div'); fresh.innerHTML = notesPanel(); np.replaceWith(fresh.firstElementChild);
    });
    replayInto(document);
    paint(); scrollAll(true);
  }
  function begin(o) {
    clearAll();
    mountWidget();
    Object.assign(S, { phase: o.phase || 'live', view: o.view || 'fold', tab: o.tab || 'chat', draft: '', noteDraft: '', how: '', clock: o.clock || 0,
                       unread: o.unread || 0, items: [], steps: null, nfs: [], failNext: false, closed: false });
    S.n = o.n || 0;
    for (let i = 0; i < S.n; i++) {
      S.items.push({ type: 'line', i, t: L[i].t });
      if (o.mine && i === 4) S.items.push({ type: 'mine', x: 'Ask about the March numbers', t: 205 });
      if (o.mine && i === 6) { const keep = S.n; S.n = 7; S.items.push(answer('catch')); S.n = keep; }
    }
    if (o.after) o.after();
    all('[data-nt-draft], [data-nt-notedraft]').forEach((i) => { i.value = ''; });
    redraw();
    if (isLive() && !o.still) { runClock(); next(o.first || 1800); }
  }

  /* ── Views ───────────────────────────────────────────────────────────── */
  /* ── Moving the orb ─────────────────────────────────────────────────────
     Collapsed, the orb can be dragged anywhere and settles on the nearer
     side, the way a Messenger chat head does. A press that does not move is
     still a press and opens the card. The card then opens from the orb:
     towards the middle of the screen, up from a low orb and down from a high
     one. */
  S.side = 'r'; S.vert = 'b'; S.y = null;
  function place() {
    if (!root) return;
    const m = 20;
    root.style.left = root.style.right = root.style.top = root.style.bottom = '';
    if (S.y == null) return;
    root.style[S.side === 'l' ? 'left' : 'right'] = m + 'px';
    root.style.top = S.y + 'px';
    root.style.bottom = 'auto';
  }
  function bindDrag() {
    const fold = $('.nt-fold', root);
    let start = null, moved = false;
    fold.addEventListener('pointerdown', (e) => {
      if (S.view !== 'fold' || e.button !== 0) return;
      const r = root.getBoundingClientRect();
      start = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, w: r.width, h: r.height };
      moved = false;
      fold.setPointerCapture(e.pointerId);
    });
    fold.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      root.classList.add('is-dragging');
      const x = Math.max(8, Math.min(innerWidth - start.w - 8, start.l + dx));
      const y = Math.max(8, Math.min(innerHeight - start.h - 8, start.t + dy));
      root.style.right = root.style.bottom = 'auto';
      root.style.left = x + 'px'; root.style.top = y + 'px';
    });
    const end = (e) => {
      if (!start) return;
      fold.releasePointerCapture(e.pointerId);
      if (moved) {
        const r = root.getBoundingClientRect();
        S.side = r.left + r.width / 2 < innerWidth / 2 ? 'l' : 'r';
        S.vert = r.top + r.height / 2 < innerHeight / 2 ? 't' : 'b';
        S.y = Math.round(r.top);
        root.classList.remove('is-dragging');
        place(); paint();
        fold.dataset.dragged = '1';
      }
      start = null;
    };
    fold.addEventListener('pointerup', end);
    fold.addEventListener('pointercancel', end);
    /* The click that ends a drag is not a press. */
    fold.addEventListener('click', (e) => { if (fold.dataset.dragged) { delete fold.dataset.dragged; e.stopImmediatePropagation(); } }, true);
    window.addEventListener('resize', () => { if (S.y != null) { S.y = Math.min(S.y, innerHeight - 140); place(); } });
  }
  /* Kept on screen: a card opened near an edge is nudged back inside. */
  function fitCard() {
    const card = $('.nt-card', root); if (!card) return;
    card.style.setProperty('--nt-dy', '0px');
    const r = card.getBoundingClientRect(), top = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-height')) || 56) + 8;
    let dy = 0;
    if (r.bottom > innerHeight - 8) dy = innerHeight - 8 - r.bottom;
    if (r.top + dy < top) dy = top - r.top;
    card.style.setProperty('--nt-dy', dy + 'px');
  }
  function closeWidget() {
    if (isLive()) return;
    S.closed = true; S.view = 'fold';
    paint();
    toast('Meeting notes closed', null, 'They are under the bell, and in the canvas under Today');
  }

  function setView(v) {
    if (v === 'canvas') return toCanvas();
    if (S.view === 'canvas') return leaveCanvas(v);
    S.view = v; if (v !== 'fold') S.unread = 0;
    paint();
    if (v === 'card') { fitCard(); later(() => scrollAll(true), 30); const i = $('.nt-in', root); if (i) i.focus({ preventScroll: true }); }
  }
  /* The canvas opens out of the card's own rectangle and closes back into
     it, so the two read as one surface changing size. */
  function cardClip(ov) {
    const card = $('.nt-card', root), r = card.getBoundingClientRect(), o = ov.getBoundingClientRect();
    return `inset(${Math.max(0, r.top - o.top)}px ${Math.max(0, o.right - r.right)}px ${Math.max(0, o.bottom - r.bottom)}px ${Math.max(0, r.left - o.left)}px round 16px)`;
  }
  function toCanvas() {
    const k = K(), parts = mountCanvas();
    if (!k || !parts || !on()) return;
    if (S.closed) { S.closed = false; S.view = 'card'; paint(); }
    if (S.view === 'fold') { S.view = 'card'; paint(); }
    const ov = parts.ov, from = cardClip(ov);
    parts.cvDraft = parts.input.value;
    ov.classList.add('is-meeting');
    S.view = 'canvas'; S.unread = 0;
    k.canvas.show(['Meeting notes']);
    requestAnimationFrame(() => { if (S.view === 'canvas' && !k.canvas.isOpen()) k.canvas.show(['Meeting notes']); });
    parts.input.value = S.draft;
    paint(); scrollAll(true); later(() => scrollAll(true), 60);
    if (!reduced()) ov.animate([{ clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    setTimeout(() => parts.input.focus({ preventScroll: true }), 60);
  }
  function leaveCanvas(to) {
    if (!cvParts) return;
    const ov = cvParts.ov;
    ov.classList.remove('is-meeting');
    cvParts.input.setAttribute('placeholder', cvParts.placeholder);
    cvParts.input.value = cvParts.cvDraft || '';
    S.view = to || 'card';
    paint();
    if (S.view === 'card') later(() => scrollAll(true), 30);
  }
  function backToCard() {
    if (!cvParts) return;
    const ov = cvParts.ov, k = K();
    S.view = 'card'; root.dataset.view = 'card';
    const to = cardClip(ov);
    const end = () => { leaveCanvas('card'); if (k) k.canvas.close({ quiet: true }); };
    if (reduced()) return end();
    ov.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: to }], { duration: 350, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' })
      .onfinish = (e) => { end(); e.target.cancel(); };
  }

  /* ── After End ───────────────────────────────────────────────────────── */
  function stop(how) {
    if (!isLive()) return;
    S.how = how === 'ended' ? 'ended' : 'stopped';
    all('.nt-wd.is-pre').forEach((w) => w.classList.remove('is-pre'));
    clearAll();
    if (S.clock < SHORT_S) {
      S.phase = 'short'; add({ type: 'short' }, true);
      notify({ k: 'short', t: 'Too short to summarise', x: MEET + ' ran under 30 seconds.' });
      return;
    }
    S.phase = 'writing'; S.steps = STEPS.map(() => 'wait'); S.steps[0] = 'run';
    if (S.view === 'fold') S.view = 'card';
    add({ type: 'steps' }, false); scrollAll(true);
    runSteps(0);
  }
  function runSteps(i) {
    later(() => {
      if (S.failNext && i === 2) {
        S.steps[i] = 'fail'; drawSteps(); S.phase = 'failed';
        add({ type: 'fail' }, true);
        notify({ k: 'fail', t: 'Notes not written', x: 'The summary didn’t finish. Your transcript is safe.', act: 'Try again', go: 'retry' });
        return;
      }
      S.steps[i] = 'done'; drawSteps();
      notify({ k: 'ok', t: STEPS[i].done, x: STEPS[i].nf, act: i === 2 ? 'Open the notes' : '', go: 'open-notes' });
      if (i < 2) { S.steps[i + 1] = 'run'; drawSteps(); runSteps(i + 1); return; }
      S.phase = 'ready'; add({ type: 'result' }, true);
    }, STEP_MS);
  }
  function drawSteps() {
    all('[data-nt-steps]').forEach((el) => {
      const f = document.createElement('div'); f.innerHTML = stepsHTML();
      el.querySelector('.nt-steps').replaceWith(f.querySelector('.nt-steps'));
    });
    scrollAll();
  }
  function retry() {
    S.items = S.items.filter((i) => i.type !== 'fail');
    S.steps[2] = 'run'; S.phase = 'writing'; S.failNext = false;
    redraw(); runSteps(2);
  }

  /* ── Notifications ───────────────────────────────────────────────────── */
  let nfSeq = 0;
  function notify(n) {
    n.id = 'nt-' + (++nfSeq); n.at = clock(S.clock);
    S.nfs.unshift(n);
    const host = $('#ntBanners'); if (!host) return;
    host.insertAdjacentHTML('afterbegin', bannerHTML(n));
    const el = host.firstElementChild;
    while (host.children.length > 3) host.lastElementChild.remove();
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 360); }, BANNER_MS);
    paint();
  }
  function bannerHTML(n) {
    const icon = n.k === 'fail' ? ic('alert', 15) : n.k === 'short' ? ic('hourglass', 15) : ic('check', 15);
    return `<div class="nt-nf" role="status"><span class="nt-nf-i is-${n.k}">${icon}</span>` +
      `<span class="nt-nf-t"><span class="nt-nf-src">${MARK(11)}AiMY, ${n.at}</span><b>${n.t}</b><span>${n.x}</span>` +
      `${n.act ? `<button class="nt-lk" type="button" data-nt-act="${n.go}">${n.act}</button>` : ''}</span>` +
      `<button class="nt-ib" type="button" data-nt-act="nf-x" aria-label="Dismiss" title="Dismiss">${ic('x', 14)}</button></div>`;
  }

  /* ── Doing things ────────────────────────────────────────────────────── */
  function send() {
    const x = S.draft.trim(); if (!x) return;
    S.draft = '';
    all('[data-nt-draft]').forEach((i) => { i.value = ''; });
    if (cvParts && cvParts.ov.classList.contains('is-meeting')) cvParts.input.value = '';
    add(answer(null, x), true);
    scrollAll(true);
  }
  function addNote(from) {
    const x = S.noteDraft.trim(); if (!x) return;
    S.noteDraft = '';
    all('[data-nt-notedraft]').forEach((i) => { i.value = ''; });
    add({ type: 'mine', x, t: S.clock }, true);
    if (from) from.focus({ preventScroll: true });
  }
  function syncDraft(from) {
    all('[data-nt-draft]').forEach((i) => { if (i !== from) i.value = S.draft; });
    if (cvParts && from !== cvParts.input && cvParts.ov.classList.contains('is-meeting')) cvParts.input.value = S.draft;
  }
  function onDraft(e) {
    if (e.target.matches('[data-nt-draft]')) { S.draft = e.target.value; syncDraft(e.target); }
    if (e.target.matches('[data-nt-notedraft]')) { S.noteDraft = e.target.value; all('[data-nt-notedraft]').forEach((i) => { if (i !== e.target) i.value = S.noteDraft; }); }
  }
  function onSubmit(e) {
    e.preventDefault();
    if (e.target.matches('[data-nt-noteform]')) addNote(e.target.querySelector('input')); else send();
  }
  function toast(msg, undo, sub) { const k = K(); if (k && k.toast) k.toast(msg, undo, sub); }

  function onClick(e) {
    const a = e.target.closest('[data-nt-act], [data-nt-tab], [data-nt-ask]');
    if (!a) return;
    if (a.dataset.ntTab) { S.tab = a.dataset.ntTab; paint(); scrollAll(true); return; }
    if (a.dataset.ntAsk) { add(answer(a.dataset.ntAsk), true); scrollAll(true); return; }
    const act = a.dataset.ntAct;
    if (act === 'open') setView('card');
    else if (act === 'collapse') setView('fold');
    /* The press that opens the canvas must not also reach the Console's
       click-off, which would close it again on the same click. */
    else if (act === 'canvas') { e.stopPropagation(); toCanvas(); }
    else if (act === 'back') backToCard();
    else if (act === 'stop') stop('stopped');
    else if (act === 'close') closeWidget();
    else if (act === 'retry') retry();
    else if (act === 'open-notes') { S.tab = 'notes'; if (S.view === 'fold') setView('card'); else paint(); }
    else if (act === 'nf-x') { const n = a.closest('.nt-nf'); n.classList.add('is-out'); setTimeout(() => n.remove(), 360); }
    else if (act === 'send') toast('Sent to Dana, Priya and Ahmed', 'Undo', 'AiMY’s notes only. Your own notes stay with you.');
    else if (act === 'tasks') toast('4 tasks made', 'Undo', 'Each with its owner and date');
    else if (act === 'doc') toast('Saved as a Meeting notes document', null, 'Linked to Upland, with the full transcript');
  }

  /* ── From the voice session ──────────────────────────────────────────────
     voice.js hands over its stage. The consent is asked there, inline, in
     the line under the orb; on yes the orb's light flies to the corner where
     the companion will sit, and the voice session ends. */
  function fromVoice(o) {
    const stage = o.stage, center = $('.vx-center', stage);
    if (!center || $('.nt-cons', stage)) return;
    stage.classList.add('nt-asking');
    /* Part of the stage, not a box on it: the line under the orb becomes the
       question. Which meeting first, so you know what you are agreeing to;
       telling the others is one checkbox, on by default, rather than a
       second button that reads like a second way to start. */
    center.insertAdjacentHTML('beforeend', `<div class="nt-cons" role="group" aria-labelledby="ntConsH">
      <span class="nt-cons-meet">${ic('cal', 14)}${MEET}<span>Now, 4 people</span></span>
      <p class="nt-cons-h" id="ntConsH">Take notes in this meeting?</p>
      <p class="nt-cons-p">AiMY writes down what is said and sums it up when the meeting ends. Only people in the meeting can open the notes.</p>
      <button class="nt-cons-tell" type="button" role="checkbox" aria-checked="true" data-nt-tell><span class="nt-box">${ic('check', 12)}</span>Tell everyone in the meeting chat</button>
      <div class="nt-cons-go"><button class="btn btn-brand nt-cons-start" type="button" data-nt-go="start">${ic('pen', 15)}Start taking notes</button>` +
      `<button class="btn btn-ghost" type="button" data-nt-go="no">Not now</button></div></div>`);
    const cons = $('.nt-cons', stage);
    cons.querySelector('[data-nt-go="start"]').focus();
    cons.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); cons.querySelector('[data-nt-go="no"]').click(); } });
    cons.addEventListener('click', (e) => {
      const t = e.target.closest('[data-nt-tell]');
      if (t) { t.setAttribute('aria-checked', String(t.getAttribute('aria-checked') !== 'true')); return; }
      const b = e.target.closest('[data-nt-go]'); if (!b) return;
      const drop = () => { cons.remove(); stage.classList.remove('nt-asking'); };
      if (b.dataset.ntGo === 'no') { drop(); return; }
      const tell = cons.querySelector('[data-nt-tell]').getAttribute('aria-checked') === 'true';
      const orbBox = (o.orb || center).getBoundingClientRect();
      drop();
      begin({ n: 0, clock: 0, view: 'fold' });
      root.classList.add('is-arriving');
      o.done();
      fly(orbBox, $('.nt-orb', root).getBoundingClientRect(), () => root.classList.remove('is-arriving'));
      toast('AiMY is taking notes', null, tell ? 'A message was posted in the meeting chat' : 'Nobody was told. Let them know it is on.');
    });
  }
  function fly(from, to, done) {
    if (reduced()) { done(); return; }
    const g = document.createElement('div'); g.className = 'nt-ghost'; document.body.appendChild(g);
    g.animate([{ left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' },
               { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' }],
      { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }).onfinish = () => { g.remove(); done(); };
  }

  /* ── What knowledge.js asks of this file ─────────────────────────────── */
  /* The meeting, as the first row of the conversations column while it runs. */
  function chatRow(host) {
    if (!on() || !host) return;
    const here = cvParts && cvParts.ov.classList.contains('is-meeting');
    if (here) $$('.ov-chat.is-here', host).forEach((b) => { b.classList.remove('is-here'); b.removeAttribute('aria-current'); });
    const find = $('.ov-chat-find', host); if (!find) return;
    find.insertAdjacentHTML('afterend', `<div class="ov-chat-group nt-chat-now"><div class="ov-chat-cap">${isLive() ? 'Now' : 'Today'}</div>
      <div class="ov-chat-row"><button class="ov-chat${here ? ' is-here' : ''}" type="button" data-nt-row ${here ? 'aria-current="true"' : ''}>
        <span class="ov-chat-lines"><span class="ov-chat-name">${isLive() ? rec : ''}${MEET}</span><span class="ov-chat-agent" data-nt="chat-sub">Meeting, ${(STATUS[S.phase] || '').toLowerCase()}</span></span>
      </button></div></div>`);
  }
  /* Rows for the topnav bell, in its own shape. */
  function bellRows() {
    return S.nfs.map((n) => ({ id: n.id, type: 'Meeting notes', when: n.at, body: n.t + '. ' + n.x, cta: n.go === 'retry' ? 'Try again' : 'Open the notes',
      needs: 'canvas', nav: 'console.html', go: () => { S.closed = false; if (n.go === 'retry' && S.phase === 'failed') retry(); S.tab = 'notes'; if (S.view === 'fold') setView('card'); else paint(); } }));
  }
  /* The prototype panel's "Meeting notes, each state". */
  const JUMPS = {
    collapsed: () => begin({ n: 8, clock: 412, view: 'fold', unread: 2, mine: true }),
    card:      () => begin({ n: 8, clock: 412, view: 'card', mine: true }),
    canvas:    () => { begin({ n: 8, clock: 412, view: 'card', mine: true }); later(toCanvas, 60); },
    after:     () => { begin({ n: L.length, clock: 581, view: 'card', still: true, mine: true }); stop('ended'); },
    ready:     () => begin({ n: L.length, clock: 581, view: 'card', phase: 'ready', mine: true, after: () => {
                   S.steps = ['done', 'done', 'done']; S.items.push({ type: 'steps' }, { type: 'result' });
                   STEPS.forEach((s, i) => S.nfs.unshift({ id: 'nt-' + (++nfSeq), k: 'ok', t: s.done, x: s.nf, at: '9:41', go: 'open-notes', act: i === 2 ? 'Open the notes' : '' })); } }),
    short:     () => { begin({ n: 1, clock: 22, view: 'card', still: true }); stop('stopped'); },
    failed:    () => { begin({ n: L.length, clock: 581, view: 'card', still: true, mine: true }); S.failNext = true; stop('ended'); },
    off:       () => { clearAll(); if (cvParts && cvParts.ov.classList.contains('is-meeting')) backToCard(); S.phase = 'off'; S.nfs = []; paint(); }
  };
  function jump(k) {
    if (cvParts && cvParts.ov.classList.contains('is-meeting') && k !== 'canvas') { leaveCanvas('card'); const kn = K(); if (kn) kn.canvas.close({ quiet: true }); }
    (JUMPS[k] || JUMPS.card)();
  }

  window.AIMY_NOTES = { fromVoice, chatRow, bellRows, jump, isOn: on, _state: S };
})();
