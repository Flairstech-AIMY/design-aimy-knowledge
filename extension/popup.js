(() => {
  'use strict';

  const APP_URL = 'https://aimy-knowledge.pages.dev/';
  const root = document.documentElement;
  const question = document.getElementById('question');
  const form = document.getElementById('askForm');
  const answerPreview = document.getElementById('answerPreview');
  const answerText = document.getElementById('answerText');
  const toast = document.getElementById('toast');
  const toneMenu = document.getElementById('toneMenu');
  const toneStatus = document.getElementById('toneStatus');
  const supportPage = document.body.classList.contains('support-page');
  const gatePage = document.body.classList.contains('gate-page');
  const ticketId = document.body.dataset.ticketId || null;
  let chatOpenRecorded = false;
  let conversationStage = 'idle';
  let flowRunId = 0;
  let demoSpeed = 1;
  let busy = false;

  const storage = globalThis.chrome?.storage?.local;
  const load = (keys) => storage ? storage.get(keys) : Promise.resolve({});
  const save = (value) => storage ? storage.set(value) : Promise.resolve();
  let panelTabId = null;

  if (gatePage && globalThis.chrome?.tabs?.query) {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      panelTabId = tab?.id ?? null;
    });
  }

  // Recorded only when a question is actually asked, never when the panel
  // merely renders — that is what tells a genuine ask apart from the panel
  // being open in the background.
  async function recordChatOpened() {
    if (!storage || !ticketId || chatOpenRecorded) return;
    chatOpenRecorded = true;
    const { ticketChatOpens = {} } = await load({ ticketChatOpens: {} });
    ticketChatOpens[ticketId] = {
      count: (ticketChatOpens[ticketId]?.count || 0) + 1,
      lastOpenedAt: new Date().toISOString()
    };
    save({ ticketChatOpens });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function setTheme(theme) {
    if (theme === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    save({ theme });
  }

  function resizeQuestion() {
    if (!question) return;
    question.style.height = 'auto';
    question.style.height = `${Math.min(question.scrollHeight, 120)}px`;
    syncComposer();
  }

  function ask(text) {
    const clean = text.trim();
    if (!clean) {
      question.focus();
      showToast('Write a question first');
      return;
    }
    if (gatePage && busy) {
      showToast('AiMY is still answering');
      return;
    }
    question.value = clean;
    resizeQuestion();
    if (gatePage) {
      const thread = document.getElementById('gateThread');
      const empty = document.getElementById('emptyConversation');
      if (empty) empty.hidden = true;
      if (thread) {
        if (conversationStage === 'idle') runInitialFlow(thread);
        else runFollowUp(thread, clean);
      }
      document.body.dataset.thread = 'active';
      document.querySelector('.gate-main')?.classList.add('has-flow');
      recordChatOpened();
      // The question now lives in the thread; the composer is for the next one.
      question.value = '';
      resizeQuestion();
      save({ lastQuestion: clean });
      return;
    }
    if (supportPage) {
      document.getElementById('emptyConversation')?.setAttribute('hidden', '');
      document.querySelector('.ticket-summary')?.removeAttribute('hidden');
      document.querySelector('.message-block')?.removeAttribute('hidden');
    }
    if (answerText && answerPreview) {
      answerText.textContent = `I found a few places to start with “${clean}”. Connect your sources in the full Console to see grounded results here.`;
      answerPreview.hidden = false;
    }
    save({ lastQuestion: clean });
    showToast('AiMY is ready to investigate');
  }

  function escapeHtml(value) {
    return value.replace(/[&<>]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character]));
  }

  function markdownHtml(value) {
    const escaped = escapeHtml(value);
    return escaped
      .split(/\n\s*\n/)
      .map((paragraph) => {
        const lines = paragraph.split('\n');
        if (lines.every((line) => /^\s*-\s+/.test(line))) {
          return `<ul>${lines.map((line) => `<li>${line.replace(/^\s*-\s+/, '')}</li>`).join('')}</ul>`;
        }
        return `<p>${lines.join('<br>')}</p>`;
      })
      .join('')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // A paragraph that opens in bold is a field ("Issue", "Status"): label
      // and value are laid out apart, so the colon has nothing left to do.
      // data-field lets a field that means something more (the status, the
      // one thing to ask) be set differently from the rest.
      .replace(/<p><strong>(.+?):?<\/strong>\s*(.*?)<\/p>/g, (match, label, value) =>
        `<p class="field" data-field="${label.toLowerCase().replace(/[^a-z]+/g, '-')}"><strong class="field-label">${label}</strong><span class="field-value">${value}</span></p>`);
  }

  function waitFor(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  /* Follows the answer down only while the reader is already at the bottom:
     scrolling up to re-read is never fought. */
  function followThread(element) {
    const thread = element?.closest('.gate-thread');
    if (!thread) return;
    if (thread.scrollHeight - thread.scrollTop - thread.clientHeight < 96) thread.scrollTop = thread.scrollHeight;
  }

  /* Renders the markdown at every step, closing a half-typed bold run, so the
     answer is formatted as it arrives instead of switching from raw
     asterisks to styled text on the last character. */
  async function streamText(element, text, runId) {
    if (!element) return false;
    element.classList.add('is-streaming');
    for (let index = 0; index < text.length; index += 3) {
      if (runId !== flowRunId || !element.isConnected) return false;
      let partial = text.slice(0, index + 1);
      if ((partial.match(/\*\*/g) || []).length % 2) partial += '**';
      element.innerHTML = markdownHtml(partial.replace(/\*$/, ''));
      followThread(element);
      await waitFor(14 / demoSpeed);
    }
    element.innerHTML = markdownHtml(text);
    element.classList.remove('is-streaming');
    followThread(element);
    return true;
  }

  /* ══ THE THINKING MARK ═════════════════════════════════════════════════
     Ported from Knowledge (knowledge.js: sampleMark, thinkFrame, swapLabel)
     so the panel thinks the way the app does. The AiMY mark is sampled into
     about ninety dots, each coloured from the mark's own gradient; they come
     apart into an orbit and gather back into the mark while the caption beside
     it moves on to the next thing that is true. No bubble around it: there is
     nothing to frame until the answer arrives.

     One loop paints every mark on screen and stops itself when none is left,
     so a finished answer never leaves a frame loop running behind it. */
  const THINK_N = 90;
  /* Dwell in the orbit, gather, hold the mark, scatter again. */
  const T_SCATTER = 620, T_ORBIT = 900, T_GATHER = 620, T_HOLD = 420;
  const T_CYCLE = T_SCATTER + T_ORBIT + T_GATHER + T_HOLD;
  /* Reduced motion still gets the mark, drawn once at rest: the state is
     information, only the movement is decoration. */
  const T_AT_REST = T_SCATTER + T_ORBIT + T_GATHER + 1;
  let thinkPoints = null;
  let thinkPointsLoading = null;
  let thinkRAF = 0;
  let thinkStart = 0;

  const hexRGB = (hex) => {
    let h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return h.length === 6 && !Number.isNaN(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : null;
  };

  /* SVG's own rule at the ends: before the first stop and after the last, the
     gradient holds that stop's colour rather than fading out. */
  function stopColour(stops, o) {
    if (o <= stops[0].o) return stops[0].c;
    const last = stops[stops.length - 1];
    if (o >= last.o) return last.c;
    for (let i = 1; i < stops.length; i += 1) {
      if (o <= stops[i].o) {
        const a = stops[i - 1], b = stops[i];
        const t = (o - a.o) / (b.o - a.o || 1);
        return a.c.map((channel, k) => Math.round(channel + (b.c[k] - channel) * t));
      }
    }
    return last.c;
  }

  /* Read from the same file the header uses, so the dots are the mark and
     not a drawing of it. */
  function sampleMark(svgText) {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const d = doc.querySelector('path')?.getAttribute('d');
    if (!d || typeof Path2D === 'undefined') return [];
    const box = (doc.documentElement.getAttribute('viewBox') || '0 0 151.43 147.66').split(/[\s,]+/).map(Number);
    const VW = box[2], VH = box[3];
    const g = doc.querySelector('radialGradient');
    const stops = [...(g?.querySelectorAll('stop') || [])]
      .map((stop) => ({ o: parseFloat(stop.getAttribute('offset')), c: hexRGB(stop.getAttribute('stop-color')) }))
      .filter((stop) => stop.c && !Number.isNaN(stop.o))
      .sort((a, b) => a.o - b.o);
    const grad = {
      cx: parseFloat(g?.getAttribute('cx')) || VW / 2,
      cy: parseFloat(g?.getAttribute('cy')) || VH / 2,
      r: parseFloat(g?.getAttribute('r')) || VW / 2,
      stops: stops.length ? stops : [{ o: 0.26, c: [140, 79, 244] }, { o: 0.95, c: [0, 102, 255] }]
    };
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return [];
    const shape = new Path2D(d);
    const points = [];
    /* A jittered grid rather than pure random: an even spread reads as the
       shape, where clustering reads as noise. */
    const step = Math.sqrt((VW * VH) / (THINK_N * 2.2));
    for (let y = step / 2; y < VH; y += step) {
      for (let x = step / 2; x < VW; x += step) {
        const jx = x + (((x * 7 + y * 13) % 10) / 10 - 0.5) * step * 0.8;
        const jy = y + (((x * 11 + y * 5) % 10) / 10 - 0.5) * step * 0.8;
        if (!ctx.isPointInPath(shape, jx, jy)) continue;
        const offset = Math.hypot(jx - grad.cx, jy - grad.cy) / grad.r;
        points.push({ x: jx / VW - 0.5, y: jy / VH - 0.5, c: `rgb(${stopColour(grad.stops, offset).join(',')})` });
      }
    }
    /* A fixed orbit seat per point, so it always leaves for the same place and
       comes back to the same petal. Random seats every cycle read as static. */
    points.forEach((point, i) => {
      const angle = Math.atan2(point.y, point.x) + (i % 5) * 0.21;
      const radius = 0.34 + ((i * 37) % 11) / 55;
      point.ox = Math.cos(angle) * radius;
      point.oy = Math.sin(angle) * radius;
      point.sp = 0.6 + ((i * 17) % 7) / 10;
      point.sz = 0.7 + ((i * 23) % 5) / 8;
    });
    return points;
  }

  function loadThinkPoints() {
    if (thinkPoints) return Promise.resolve(thinkPoints);
    thinkPointsLoading ||= fetch(MARK_SRC)
      .then((response) => response.text())
      .then((svg) => (thinkPoints = sampleMark(svg)))
      .catch(() => (thinkPoints = []));
    return thinkPointsLoading;
  }

  function thinkFrame(canvas, ms) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !thinkPoints?.length) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Cached: a layout read per frame for a value that only changes on resize.
    const css = canvas._thinkCSS || (canvas._thinkCSS = canvas.clientWidth || 26);
    if (canvas.width !== Math.round(css * dpr)) {
      canvas.width = Math.round(css * dpr);
      canvas.height = Math.round(css * dpr);
    }
    const S = canvas.width;
    ctx.clearRect(0, 0, S, S);

    const phase = ms % T_CYCLE;
    // 0 in the mark, 1 in the orbit.
    let mix = 0;
    if (phase < T_SCATTER) mix = easeInOutCubic(phase / T_SCATTER);
    else if (phase < T_SCATTER + T_ORBIT) mix = 1;
    else if (phase < T_SCATTER + T_ORBIT + T_GATHER) mix = 1 - easeInOutCubic((phase - T_SCATTER - T_ORBIT) / T_GATHER);

    const spin = (ms / 2600) * Math.PI * 2;
    for (const p of thinkPoints) {
      // The seats turn in the orbit; in the mark they do not, so the logo
      // arrives upright rather than at whatever angle the spin had reached.
      const a = spin * p.sp;
      const ox = p.ox * Math.cos(a) - p.oy * Math.sin(a);
      const oy = p.ox * Math.sin(a) + p.oy * Math.cos(a);
      const x = (p.x + (ox - p.x) * mix) * S * 0.92 + S / 2;
      const y = (p.y + (oy - p.y) * mix) * S * 0.92 + S / 2;
      ctx.globalAlpha = 0.45 + (1 - mix) * 0.55;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.6, p.sz * (S / 26) * (1 - mix * 0.25)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function paintThinking(now) {
    const marks = document.querySelectorAll('.think-mark');
    const still = prefersReducedMotion();
    marks.forEach((canvas) => thinkFrame(canvas, still ? T_AT_REST : now - thinkStart));
    thinkRAF = marks.length && !still ? requestAnimationFrame(paintThinking) : 0;
  }

  function startThinking() {
    loadThinkPoints().then(() => {
      if (thinkRAF) return;
      // Each fresh loop starts on the whole mark, then comes apart.
      thinkStart = performance.now();
      thinkRAF = requestAnimationFrame(paintThinking);
    });
  }

  /* Out is quick and up, in is slower and from below: what is leaving gets
     out of the way, what is arriving is the part worth watching land. */
  function swapLabel(element, text) {
    if (!element || element.textContent === text) return;
    if (prefersReducedMotion()) { element.textContent = text; return; }
    element.classList.remove('is-in');
    element.classList.add('is-out');
    window.setTimeout(() => {
      element.textContent = text;
      element.classList.remove('is-out');
      void element.offsetWidth;
      element.classList.add('is-in');
    }, 150);
  }

  function thinkingHtml(label) {
    return `<div class="ai-thinking" role="status"><canvas class="think-mark" width="26" height="26" aria-hidden="true"></canvas><span class="ai-thinking-label">${label}</span></div>`;
  }

  /* Holds the mark in `host` through each beat and says what AiMY is doing
     at that moment. False when the run was replaced while it waited. */
  async function think(host, beats, runId) {
    host.innerHTML = thinkingHtml(beats[0].label);
    startThinking();
    followThread(host);
    for (let index = 0; index < beats.length; index += 1) {
      if (index) swapLabel(host.querySelector('.ai-thinking-label'), beats[index].label);
      await waitFor(beats[index].ms / demoSpeed);
      if (runId !== flowRunId || !host.isConnected) return false;
    }
    return true;
  }

  const ACTION_ICONS = {
    copy: 'assets/icons/copy-icon.svg',
    note: 'assets/icons/add-as-a-comment.svg',
    like: 'assets/icons/like-icon.svg',
    dislike: 'assets/icons/dislike-icon.svg'
  };

  function actionButtonHtml(action, label) {
    return `<button type="button" data-action="${action}" aria-label="${label}" title="${label}"><span class="action-icon" style="--icon:url('${ACTION_ICONS[action]}')" aria-hidden="true"></span></button>`;
  }

  function actionsRowHtml(includeTone) {
    const tone = includeTone
      ? '<button type="button" class="tone-toggle" data-action="tone" aria-expanded="false" aria-controls="toneMenu"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-tone"/></svg><span>Tone</span></button>'
      : '';
    return `<div class="flow-actions">${actionButtonHtml('copy', 'Copy')}${actionButtonHtml('note', 'Add as note')}${actionButtonHtml('like', 'Helpful')}${actionButtonHtml('dislike', 'Not helpful')}${tone}</div>`;
  }

  const TONES = {
    Formal: 'The customer reported receiving an AI-Assist error stating that submitted content was flagged for prohibited text while attempting to obtain an answer about customer-defined BGP communities, traffic engineering, and blackholing for DDoS. The issue was reported via email, but no additional diagnostic details or troubleshooting steps are currently documented.\n\nPlease confirm whether this error occurs only for the specific DDoS/BGP-related question or also for unrelated AI-Assist questions.',
    Friendly: 'The customer ran into a prohibited-text flag while asking about BGP and DDoS. We still need to check whether other questions trigger it too.',
    Sincere: 'The customer is blocked by a prohibited-text flag while asking about BGP and DDoS, and one clarification from them will help us resolve it.'
  };

  function toneControlsHtml() {
    const options = Object.keys(TONES).map((tone) => `<button type="button" data-tone="${tone}" aria-pressed="false">${tone}</button>`).join('');
    return `<div class="flow-meta">${actionsRowHtml(true)}<div class="tone-menu" id="toneMenu" role="group" aria-label="Rewrite in a tone" hidden>${options}</div><div class="tone-status" id="toneStatus" hidden></div></div>`;
  }

  /* Sources as one grouped card rather than loose pills: they are a set, and
     each row says what kind of document it is before it is opened. */
  function docListHtml(docs) {
    const rows = docs.map((doc) => `<li><button type="button" class="doc-row" data-doc="${doc.title}"><span class="doc-tile" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#icon-file"/></svg></span><span class="doc-text"><span class="doc-title">${doc.title}</span><span class="doc-kind">${doc.kind}</span></span></button></li>`).join('');
    return `<ul class="flow-doc-list" aria-label="Related documents">${rows}</ul>`;
  }

  /* One answer at a time: the composer says so, and a question sent over the
     top of an answer still streaming is held rather than cutting it off. */
  function setBusy(value) {
    busy = value;
    syncComposer();
  }

  /* The beam runs on the bar while an answer is coming, and the send button
     becomes the way to call it off, as in Knowledge's composer. */
  function syncComposer() {
    form?.classList.toggle('is-generating', busy);
    const send = document.getElementById('sendQuestion');
    if (send) {
      const label = busy ? 'Stop answering' : 'Send';
      send.setAttribute('aria-label', label);
      send.title = label;
    }
  }

  function stoppedHtml() {
    return '<div class="msg-stopped">Stopped</div>';
  }

  /* Ends the run in place. Whatever had already been said stays, with a note
     under it; a turn still thinking is replaced by the note. */
  function stopRun() {
    if (!busy) return;
    flowRunId += 1;
    document.querySelectorAll('#gateThread .ai-thinking').forEach((thinking) => {
      const host = thinking.parentElement;
      if (host.id === 'toneStatus') { host.hidden = true; host.replaceChildren(); return; }
      host.innerHTML = stoppedHtml();
    });
    document.querySelectorAll('#gateThread .is-streaming').forEach((element) => {
      element.classList.remove('is-streaming');
      (element.closest('.tone-result') || element.closest('.flow-answer'))?.insertAdjacentHTML('beforeend', stoppedHtml());
    });
    conversationStage = 'ready';
    setBusy(false);
    question?.focus();
  }

  // Two automatic requests open every ticket conversation: a summary, then
  // recommended next steps. Each thinks in place before its result streams.
  async function runInitialFlow(thread) {
    const runId = ++flowRunId;
    conversationStage = 'summarizing';
    setBusy(true);
    thread.innerHTML = '<article class="flow-answer" id="flowSummaryBlock"></article>';

    const summaryBlock = document.getElementById('flowSummaryBlock');
    const summaryReady = await think(summaryBlock, [
      { label: 'Reading the ticket…', ms: 650 },
      { label: 'Summarizing…', ms: 550 }
    ], runId);
    if (!summaryReady) return;
    summaryBlock.innerHTML = '<h2>Ticket summary</h2><div class="markdown-body" id="summaryStream"></div>';
    const summaryText = '**Issue:** The customer received an AI-Assist error stating that submitted content was flagged for prohibited text while requesting an answer about customer-defined BGP communities, traffic engineering, and blackholing for DDoS.\n\n**Investigation:** The issue was reported by email; no diagnostic detail or troubleshooting steps are documented yet.\n\n**Status:** Not stated in the ticket.';
    if (!await streamText(document.getElementById('summaryStream'), summaryText, runId)) return;
    summaryBlock.insertAdjacentHTML('beforeend', actionsRowHtml(false));

    conversationStage = 'steps';
    thread.insertAdjacentHTML('beforeend', '<article class="flow-answer" id="flowStepsBlock"></article>');
    const stepsBlock = document.getElementById('flowStepsBlock');
    const stepsReady = await think(stepsBlock, [
      { label: 'Searching the corpus…', ms: 650 },
      { label: 'Nothing matched yet, widening…', ms: 650 }
    ], runId);
    if (!stepsReady) return;
    stepsBlock.innerHTML = '<h2>Recommended next steps</h2><div class="markdown-body" id="stepsStream"></div>';
    const stepsText = 'No matching documentation was found for this AI-Assist prohibited-text flagging error.\n\n**Clarify:** Ask whether the error occurs only with this DDoS/BGP question or also with unrelated AI-Assist questions.';
    if (!await streamText(document.getElementById('stepsStream'), stepsText, runId)) return;
    stepsBlock.insertAdjacentHTML('beforeend', toneControlsHtml());
    followThread(stepsBlock);

    conversationStage = 'ready';
    setBusy(false);
  }

  // Everything after the initial summary/steps is a real follow-up: list more
  // documents, paraphrase, or anything else, each thinking in its own turn.
  async function runFollowUp(thread, questionText) {
    const runId = ++flowRunId;
    setBusy(true);
    const blockId = `flowFollowUp${Date.now()}`;
    thread.insertAdjacentHTML('beforeend', `<div class="gate-user-message">${escapeHtml(questionText)}</div><article class="flow-answer" id="${blockId}"></article>`);
    thread.scrollTop = thread.scrollHeight;

    const wantsDocuments = /document/i.test(questionText);
    const wantsParaphrase = /paraphrase/i.test(questionText);
    const beats = wantsDocuments
      ? [{ label: 'Searching the corpus…', ms: 600 }, { label: 'Reading 3 documents…', ms: 600 }]
      : wantsParaphrase
        ? [{ label: 'Rewriting in plainer words…', ms: 700 }]
        : [{ label: 'Searching the corpus…', ms: 600 }, { label: 'Composing the answer…', ms: 500 }];

    const block = document.getElementById(blockId);
    if (!await think(block, beats, runId)) return;
    const resultText = wantsDocuments
      ? 'These three are the closest matches in the corpus:'
      : wantsParaphrase
        ? 'Here is a simpler version: we could not find documentation for this specific flag. Does it happen only with the BGP/DDoS question, or with other questions too?'
        : `I found a few places to start with “${questionText}”. Connect your sources in the full Console to see grounded results here.`;
    block.innerHTML = '<div class="markdown-body" id="followUpStream"></div>';
    const stream = document.getElementById('followUpStream');
    stream.removeAttribute('id');
    if (!await streamText(stream, resultText, runId)) return;
    if (wantsDocuments) block.insertAdjacentHTML('beforeend', docListHtml([
      { title: 'AI-Assist content moderation categories', kind: 'Reference' },
      { title: 'Proposal question troubleshooting guide', kind: 'Guide' },
      { title: 'Escalation path for flagged-content errors', kind: 'Playbook' }
    ]));
    block.insertAdjacentHTML('beforeend', actionsRowHtml(false));
    followThread(block);
    setBusy(false);
  }

  function copyMessage(button) {
    const block = button.closest('.tone-result, .flow-answer');
    const text = block?.querySelector('.markdown-body')?.innerText || block?.innerText || '';
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
    button.classList.add('is-active');
  }

  function toggleToneMenu(force) {
    const menu = document.getElementById('toneMenu');
    const toggle = document.querySelector('[data-action="tone"]');
    if (!menu) return;
    const open = typeof force === 'boolean' ? force : menu.hidden;
    if (open && busy) { showToast('AiMY is still answering'); return; }
    menu.hidden = !open;
    toggle?.setAttribute('aria-expanded', String(open));
    if (open) followThread(menu);
  }

  /* A rewrite replaces the previous one rather than stacking under it: the
     agent is choosing a voice, not collecting drafts. */
  async function adjustTone(tone) {
    const menu = document.getElementById('toneMenu');
    const status = document.getElementById('toneStatus');
    const answer = menu?.closest('.flow-answer');
    if (!menu || !status || !answer || busy) return;
    const runId = ++flowRunId;
    setBusy(true);
    menu.querySelectorAll('[data-tone]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.tone === tone)));
    toggleToneMenu(false);
    answer.querySelector('.tone-result')?.remove();
    status.hidden = false;
    const ready = await think(status, [{ label: `Rewriting in a ${tone.toLowerCase()} tone…`, ms: 900 }], runId);
    status.hidden = true;
    status.replaceChildren();
    if (!ready) return;
    const result = document.createElement('div');
    result.className = 'tone-result';
    result.innerHTML = `<h2>${tone} version</h2><div class="markdown-body"></div>`;
    answer.appendChild(result);
    if (!await streamText(result.querySelector('.markdown-body'), TONES[tone], runId)) return;
    result.insertAdjacentHTML('beforeend', actionsRowHtml(false));
    followThread(result);
    setBusy(false);
  }

  function resetConversation() {
    if (gatePage) {
      flowRunId += 1;
      setBusy(false);
      question.value = '';
      resizeQuestion();
      document.getElementById('gateThread')?.replaceChildren();
      chatOpenRecorded = false;
      showToast('New conversation ready');
      const thread = document.getElementById('gateThread');
      document.getElementById('emptyConversation')?.setAttribute('hidden', '');
      document.body.dataset.thread = 'active';
      document.querySelector('.gate-main')?.classList.add('has-flow');
      recordChatOpened();
      if (thread) runInitialFlow(thread);
      return;
    }
    if (!supportPage) return;
    question.value = '';
    resizeQuestion();
    question.placeholder = 'Ask me anything ....';
    document.getElementById('emptyConversation')?.removeAttribute('hidden');
    document.querySelector('.ticket-summary')?.setAttribute('hidden', '');
    document.querySelector('.message-block')?.setAttribute('hidden', '');
    document.querySelectorAll('.message-actions button').forEach((button) => button.classList.remove('is-active'));
    if (toneMenu) toneMenu.hidden = true;
    showToast('New conversation ready');
    question.focus();
  }

  function resetForUrlChange() {
    if (!gatePage) return;
    question.value = '';
    resizeQuestion();
    resetToGate();
    showToast('Page changed. New conversation ready.');
  }

  /* ══ THE START SEQUENCE ═══════════════════════════════════════════════
     gate → loading → leaving → flying → settled. The button holds a spinner
     for a beat, the rest of the start screen clears, and only then does the
     mark fly, so the three never compete for attention at once.

     Every transition is guarded on the phase it leaves from. A double-click on
     the button, or a timer firing after the demo was reset, is a no-op instead
     of a jump to the wrong screen. Under reduced motion the whole ceremony is
     skipped — there is nothing to watch, so there is nothing to wait for. */
  const LOADING_HOLD_MS = 400;
  const LEAVING_MS = 260;
  const FLIGHT_DURATION_MS = 720;
  const MARK_SRC = 'assets/aimy-full.svg';
  let phase = 'gate';
  let phaseTimer = null;
  let markElement = null;

  /* Each row is [x%, y%, size px, peak opacity, rise vh, sideways vw, seconds].
     A fixed table rather than Math.random(): a random field is different every
     load, so it can never be reviewed or tuned. These can be argued with. */
  const DUST = [
    [4, 82, 2.0, 0.30, -62, 1.4, 31], [11, 96, 1.4, 0.20, -74, -0.9, 38],
    [17, 71, 2.6, 0.34, -55, 2.1, 25], [23, 88, 1.2, 0.16, -68, -1.6, 41],
    [29, 63, 1.8, 0.26, -49, 0.7, 28], [34, 92, 2.2, 0.31, -71, -2.3, 34],
    [40, 77, 1.3, 0.18, -58, 1.9, 43], [45, 99, 2.8, 0.36, -80, -1.1, 22],
    [51, 68, 1.6, 0.23, -52, 2.6, 37], [56, 85, 2.1, 0.29, -66, -0.6, 26],
    [62, 94, 1.1, 0.15, -76, 1.2, 40], [67, 73, 2.4, 0.33, -54, -2.8, 29],
    [73, 90, 1.7, 0.24, -70, 0.4, 35], [78, 66, 2.0, 0.28, -47, 1.7, 23],
    [84, 97, 1.5, 0.21, -79, -1.4, 42], [89, 79, 2.5, 0.35, -60, 2.2, 27],
    [94, 87, 1.3, 0.17, -67, -0.8, 39], [98, 70, 1.9, 0.27, -51, 1.0, 32],
    [8, 61, 1.6, 0.22, -45, -1.9, 36], [20, 99, 2.3, 0.32, -83, 0.9, 24],
    [37, 58, 1.2, 0.14, -42, 2.4, 44], [48, 81, 1.9, 0.25, -63, -1.3, 30],
    [59, 60, 2.7, 0.34, -44, 1.5, 21], [70, 98, 1.4, 0.19, -81, -2.0, 45],
    [81, 64, 1.8, 0.26, -48, 0.6, 33], [92, 93, 2.2, 0.30, -73, -1.7, 28],
    [14, 75, 1.1, 0.13, -57, 2.8, 46], [65, 84, 1.5, 0.20, -64, -0.5, 20]
  ];

  function paintDust() {
    const host = document.getElementById('gateDust');
    if (!host) return;
    host.innerHTML = DUST.map((m, i) =>
      `<span class="gate-mote" style="--x:${m[0]}%;--y:${m[1]}%;--s:${m[2]}px;` +
      `--o:${m[3]};--t:${m[4]}vh;--dx:${m[5]}vw;--d:${m[6]}s;--i:${i}"></span>`
    ).join('');
  }

  function prefersReducedMotion() {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setPhase(next) {
    phase = next;
    document.body.dataset.phase = next;
  }

  /* Centres, because the mark scales about its own centre: translating centre
     to centre keeps the two consistent however much it shrinks. */
  function measureFlight(shell, from, to) {
    const shellRect = shell.getBoundingClientRect();
    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();
    if (!fromRect.width || !toRect.width) return null;
    return {
      left: fromRect.left - shellRect.left,
      top: fromRect.top - shellRect.top,
      size: fromRect.width,
      dx: toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2),
      dy: toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2),
      scale: toRect.width / fromRect.width
    };
  }

  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  /* The wind-up occupies this much of the flight before the mark launches. */
  const WINDUP = 0.14;
  /* How far into the travel the spin completes; the rest is pure settle. */
  const SPIN_DONE = 0.85;
  const WINDUP_DIP_PX = 7;
  const SAMPLES = 40;

  /* Sampled along a curve rather than hand-placed, which is what makes three
     things possible at once: a genuine arc, a wind-up before launch so it
     reads as a push-off rather than a slide, and a spin that settles ahead of
     the travel so the mark arrives upright rather than still turning. */
  function buildKeyframes({ dx, dy, scale }) {
    const cx = dx * 0.22;
    const cy = dy * 1.18;
    const frames = [];
    for (let i = 0; i < SAMPLES; i += 1) {
      const t = i / SAMPLES;
      let x = 0, y = 0, s = 1, r = 0;
      if (t < WINDUP) {
        const w = easeInOutCubic(t / WINDUP);
        y = WINDUP_DIP_PX * w;
        s = 1 - 0.07 * w;
        r = -10 * w;
      } else {
        const u = (t - WINDUP) / (1 - WINDUP);
        const p = easeInOutCubic(u);
        x = 2 * (1 - p) * p * cx + p * p * dx;
        y = Math.pow(1 - p, 2) * WINDUP_DIP_PX + 2 * (1 - p) * p * cy + p * p * dy;
        s = 0.93 + (scale - 0.93) * p;
        r = -10 + 370 * easeOutCubic(Math.min(1, u / SPIN_DONE));
      }
      frames.push({ transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`, offset: t });
    }
    // Pinned to the target exactly, whatever floating point did on the way:
    // this is the frame the static header mark takes over from.
    frames.push({ transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(360deg)`, offset: 1 });
    return frames;
  }

  /* The mark lives outside both screens on purpose: the gate is hidden and the
     header lockup takes over, so an element owned by either could not travel
     between them. It sits on the start screen from first paint, measured
     against the orbit that holds its place. */
  function positionMark() {
    const shell = document.getElementById('gateShell');
    const orbit = document.getElementById('gateOrbit');
    const anchor = document.getElementById('brandAnchor');
    if (!shell || !orbit || !anchor) return null;
    const flight = measureFlight(shell, orbit, anchor);
    if (!flight) return null;
    if (!markElement) {
      markElement = document.createElement('img');
      markElement.className = 'logo-flight';
      markElement.src = MARK_SRC;
      markElement.alt = '';
      markElement.setAttribute('aria-hidden', 'true');
      shell.appendChild(markElement);
    }
    markElement.style.left = `${flight.left}px`;
    markElement.style.top = `${flight.top}px`;
    markElement.style.width = `${flight.size}px`;
    markElement.style.height = `${flight.size}px`;
    return flight;
  }

  function removeMark() {
    markElement?.remove();
    markElement = null;
  }

  function settle(landed) {
    if (phase === 'settled') return;
    setPhase('settled');
    removeMark();
    const anchor = document.getElementById('brandAnchor');
    if (anchor) {
      const mark = document.createElement('img');
      mark.src = MARK_SRC;
      mark.alt = '';
      anchor.replaceChildren(mark);
      if (landed) {
        anchor.classList.add('is-landing');
        window.setTimeout(() => anchor.classList.remove('is-landing'), 320);
      }
    }
    const word = document.getElementById('brandWord');
    const ticket = document.getElementById('brandTicket');
    if (word) word.hidden = false;
    if (ticket) ticket.hidden = false;
    const gate = document.getElementById('gateStart');
    if (gate) gate.hidden = true;

    const thread = document.getElementById('gateThread');
    if (!thread) return;
    document.getElementById('emptyConversation')?.setAttribute('hidden', '');
    document.body.dataset.thread = 'active';
    document.querySelector('.gate-main')?.classList.add('has-flow');
    recordChatOpened();
    runInitialFlow(thread);
  }

  /* Hands over on the animation's own finished promise, so the static header
     mark appears on the exact frame the flight ends — a parallel timer could
     drift under a throttled tab and show a jump. */
  function flyMark() {
    const flight = positionMark();
    const mark = markElement;
    if (!flight || !mark) { settle(false); return; }

    const land = () => {
      if (phase !== 'flying') return;
      settle(true);
    };
    if (typeof mark.animate !== 'function') {
      window.setTimeout(land, FLIGHT_DURATION_MS / demoSpeed);
      return;
    }
    mark.animate(buildKeyframes(flight), {
      duration: FLIGHT_DURATION_MS / demoSpeed,
      // Easing is baked into the sampled frames; linear plays them as sampled.
      easing: 'linear',
      fill: 'forwards'
    }).finished.then(land).catch(() => {});
  }

  function beginStart() {
    if (phase !== 'gate') return;
    const button = document.getElementById('gateStartButton');
    if (prefersReducedMotion()) {
      const gate = document.getElementById('gateStart');
      if (gate) gate.hidden = true;
      settle(false);
      return;
    }
    button?.classList.add('is-loading');
    button?.setAttribute('disabled', '');
    setPhase('loading');
    phaseTimer = window.setTimeout(() => {
      if (phase !== 'loading') return;
      setPhase('leaving');
      document.getElementById('gateCopy')?.classList.add('is-leaving');
      phaseTimer = window.setTimeout(() => {
        if (phase !== 'leaving') return;
        setPhase('flying');
        flyMark();
      }, LEAVING_MS / demoSpeed);
    }, LOADING_HOLD_MS / demoSpeed);
  }

  function resetToGate() {
    window.clearTimeout(phaseTimer);
    flowRunId += 1;
    setBusy(false);
    conversationStage = 'idle';
    chatOpenRecorded = false;
    setPhase('gate');
    removeMark();
    document.getElementById('gateThread')?.replaceChildren();
    document.body.dataset.thread = 'empty';
    document.querySelector('.gate-main')?.classList.remove('has-flow');
    document.getElementById('emptyConversation')?.removeAttribute('hidden');
    const anchor = document.getElementById('brandAnchor');
    if (anchor) { anchor.replaceChildren(); anchor.classList.remove('is-landing'); }
    const word = document.getElementById('brandWord');
    const ticket = document.getElementById('brandTicket');
    if (word) word.hidden = true;
    if (ticket) ticket.hidden = true;
    const gate = document.getElementById('gateStart');
    if (gate) gate.hidden = false;
    document.getElementById('gateCopy')?.classList.remove('is-leaving');
    const button = document.getElementById('gateStartButton');
    button?.classList.remove('is-loading');
    button?.removeAttribute('disabled');
    positionMark();
  }

  load({ theme: 'dark', lastQuestion: '' }).then(({ theme, lastQuestion }) => {
    setTheme(theme || 'dark');
    // The panel opens on a fresh ticket, so it does not carry a question over.
    if (lastQuestion && question && !gatePage) question.value = lastQuestion;
  });

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
  });

  document.getElementById('openPanel')?.addEventListener('click', async () => {
    if (globalThis.chrome?.sidePanel?.open) {
      try { await chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT }); return; } catch (_) {}
    }
    showToast('Open AiMY from the side panel menu');
  });

  document.getElementById('openWorkspace')?.addEventListener('click', () => {
    if (globalThis.chrome?.tabs?.create) chrome.tabs.create({ url: APP_URL });
    else window.open(APP_URL, '_blank', 'noopener');
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (gatePage && busy) { stopRun(); return; }
    ask(question.value);
  });

  // The whole bar focuses the field, as a pill-shaped control is expected to.
  form?.addEventListener('mousedown', (event) => {
    if (event.target === form || event.target.closest('.aimy-float-icon')) {
      event.preventDefault();
      question?.focus();
    }
  });

  question?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      ask(question.value);
    }
  });

  question?.addEventListener('input', resizeQuestion);

  document.querySelectorAll('[data-prompt], [data-question]').forEach((button) => {
    button.addEventListener('click', () => {
      const text = button.dataset.prompt || button.dataset.question || '';
      question.value = text;
      question.focus();
      if (button.dataset.question || button.dataset.prompt && gatePage) ask(text);
    });
  });

  document.getElementById('clearAnswer')?.addEventListener('click', () => {
    answerPreview.hidden = true;
    question.focus();
  });

  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (action) {
      const type = action.dataset.action;
      if (type === 'tone') { toggleToneMenu(); }
      else if (!action.classList.contains('is-loading')) {
        action.classList.add('is-loading');
        action.disabled = true;
        window.setTimeout(() => {
          action.disabled = false;
          action.classList.remove('is-loading');
          if (type === 'copy') copyMessage(action);
          if (type === 'note') { action.classList.add('is-active'); showToast('Added as a note'); }
          if (type === 'like' || type === 'dislike') {
            action.parentElement.querySelectorAll('[data-action="like"], [data-action="dislike"]').forEach((button) => button.classList.remove('is-active'));
            action.classList.add('is-active');
            showToast(type === 'like' ? 'Thanks for the feedback' : 'Feedback recorded');
          }
        }, 380);
      }
    }

    const doc = event.target.closest('[data-doc]');
    if (doc) showToast(`Opening “${doc.dataset.doc}” in Knowledge`);

    const tone = event.target.closest('[data-tone]');
    if (tone) adjustTone(tone.dataset.tone);
    const activeToneMenu = document.getElementById('toneMenu');
    if (activeToneMenu && !activeToneMenu.hidden && !event.target.closest('#toneMenu, [data-action="tone"]')) toggleToneMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || document.getElementById('toneMenu')?.hidden !== false) return;
    toggleToneMenu(false);
    document.querySelector('[data-action="tone"]')?.focus();
  });

  document.getElementById('newConversation')?.addEventListener('click', resetConversation);

  const demoToolsToggle = document.getElementById('demoToolsToggle');
  const demoControls = document.getElementById('demoControls');
  demoToolsToggle?.addEventListener('click', () => {
    const expanded = !demoControls.hidden;
    demoControls.hidden = expanded;
    demoToolsToggle.setAttribute('aria-expanded', String(!expanded));
    demoToolsToggle.setAttribute('aria-label', expanded ? 'Show demo controls' : 'Hide demo controls');
  });

  const demoSpeedInput = document.getElementById('demoSpeed');
  const demoSpeedValue = document.getElementById('demoSpeedValue');
  demoSpeedInput?.addEventListener('input', () => {
    demoSpeed = Number(demoSpeedInput.value) || 1;
    if (demoSpeedValue) demoSpeedValue.textContent = `${demoSpeed}x`;
  });

  document.getElementById('demoRefresh')?.addEventListener('click', () => {
    if (!gatePage) return;
    resetToGate();
    showToast('Back to the start screen');
  });

  globalThis.chrome?.runtime?.onMessage?.addListener((message) => {
    if (message?.type === 'aimy:url-changed' && message.tabId === panelTabId) resetForUrlChange();
  });

  // The panel opens on the start screen. Nothing is asked of AiMY until the
  // agent presses Get started.
  if (gatePage) {
    paintDust();
    loadThinkPoints();
    positionMark();
    document.getElementById('gateStartButton')?.addEventListener('click', beginStart);
    // The gate centres the mark, so a resize while it waits moves it.
    window.addEventListener('resize', () => {
      if (phase === 'gate' || phase === 'loading' || phase === 'leaving') positionMark();
    });
  }
})();
