/* ══ After-Hours Config, filled in by hand (AIMY-2974) ══════════════════════
   A Configuration File made with New document is a form, not an upload. The
   fields are the developers' (after-hours-config-fields-for-design.json, 11
   Nov 2026): six sections in their order, each field with its label, kind,
   help, default and, where set, the field it waits on. Uploading a file stays
   possible from the form's head; the templates do not come with it.

   What the form keeps is `o.x.form`, keyed by the field's dotted key, plus
   `_custom` for the fields a product adds. knowledge.js draws it in the
   document's subject region and asks it two things: how many required fields
   are still empty (the Publish gate) and what to draw. Every edit lands on
   the document at once and raises the page's own Save / Discard bar.

   Loaded before knowledge.js by console.html and index.html. */
(function () {
  'use strict';

  /* ── The fields, as the developers wrote them ──
     Labels and help are theirs, word for word, except where the control
     changed: the team hours are typed per day rather than dragged on a clock,
     and a number's unit sits in its field, so "(minutes)" left its label. */
  const SCHEMA = [
    { key: 'tickets', title: 'Tickets', fields: [
      { key: 'tickets.crm_source', label: 'Ticket system', kind: 'choice', required: true,
        help: 'Where this product\u2019s tickets arrive.',
        options: [['freshdesk', 'Freshdesk'], ['zendesk', 'Zendesk'], ['teamsupport', 'TeamSupport']] }
    ] },
    { key: 'schedule', title: 'When AiMY covers', help: 'Set when the team works. AiMY covers the rest of the week.', fields: [
      { key: 'schedule.timezone', label: 'Timezone', kind: 'timezone', required: true,
        help: 'The team hours below are in this timezone.' },
      { key: 'schedule.working_hours', label: 'Team hours', kind: 'hours', required: true,
        help: 'Turn on the days the team works and type when they start and stop. A shift can end the next day.' },
      { key: 'schedule.pre_window_minutes', label: 'Hand over before the team starts', kind: 'number', unit: 'min', step: 5,
        help: 'Tickets that arrive this close to the team starting are left for them.', def: 15, min: 0, max: 240, advanced: true },
      { key: 'schedule.holidays', label: 'Holidays', kind: 'table', add: 'Add a holiday',
        help: 'Days off. AiMY covers them all day.', advanced: true,
        columns: [['date', 'Date', 'date', '11rem'], ['name', 'Name', 'text', 'minmax(0, 1fr)']] }
    ] },
    { key: 'coverage', title: 'Who is covered', fields: [
      { key: 'coverage.customer_tiers', label: 'Covered tiers', kind: 'table', add: 'Add a tier',
        help: 'Each support tier AiMY covers, and on which days: all days or weekdays only.',
        columns: [['tier', 'Tier', 'text', 'minmax(0, 1fr)'], ['covered_days', 'Days', 'days', 'auto']] },
      { key: 'coverage.tier_source', label: 'Where to check a customer\u2019s tier', kind: 'text',
        help: 'A ticket field, an organization tag, or a contract list.' },
      { key: 'coverage.special_customers', label: 'Customer exceptions', kind: 'table', add: 'Add a customer',
        help: 'Customers with their own rule, whatever their tier. For example: always escalate.',
        columns: [['customer', 'Customer', 'text', 'minmax(0, 1fr)'], ['rule', 'Rule', 'text', 'minmax(0, 1.4fr)']] }
    ] },
    { key: 'urgent', title: 'What\u2019s urgent', fields: [
      { key: 'urgent.examples', label: 'Urgent when', kind: 'list', required: true, add: 'Add a case',
        help: 'One per line. For example: users can\u2019t log in.' },
      { key: 'urgent.keywords', label: 'Urgent keywords', kind: 'list', add: 'Add a word',
        help: 'Words that flag a ticket as urgent. Add \u201curgent\u201d if the word alone is enough.' },
      { key: 'urgent.match', label: 'A ticket is urgent when it matches', kind: 'choice', def: 'any', advanced: true,
        help: 'Most products need only one.', options: [['any', 'Any of the above'], ['all', 'All of the above']] },
      { key: 'urgent.definition', label: 'Definition', kind: 'long', advanced: true,
        help: 'What urgent means for this product, in one or two sentences.' },
      { key: 'urgent.min_users_affected', label: 'Fewest users affected', kind: 'number', unit: 'users', step: 1, min: 1, advanced: true,
        help: 'Fewer users than this is not urgent.' },
      { key: 'urgent.triage_questions', label: 'Questions when it\u2019s unclear', kind: 'table', add: 'Add a question', advanced: true,
        help: 'What to ask, and what each answer means.',
        columns: [['question', 'Question', 'long', 'minmax(0, 1fr)'], ['means', 'What the answer means', 'long', 'minmax(0, 1.25fr)']] }
    ] },
    { key: 'not_urgent', title: 'What\u2019s not urgent', fields: [
      { key: 'not_urgent.action', label: 'What AiMY does', kind: 'choice', required: true,
        help: 'For a ticket that can wait.',
        options: [['clear', 'Leave it for business hours, no reply'], ['acknowledge', 'Reply that it\u2019s received'],
                  ['downgrade', 'Reply and lower the priority'], ['call_customer', 'Call the customer, then lower the priority']] },
      { key: 'not_urgent.examples', label: 'Not urgent when', kind: 'list', add: 'Add a case', advanced: true,
        help: 'One per line. For example: a forgotten password.' }
    ] },
    { key: 'on_call', title: 'When it\u2019s urgent', fields: [
      { key: 'on_call.source', label: 'Who\u2019s on call', kind: 'choice', required: true,
        help: 'Where AiMY finds the person to call.',
        options: [['teamup', 'Check the TeamUp calendar'], ['list', 'Use the people listed here']] },
      { key: 'on_call.teamup_link', label: 'TeamUp calendar link', kind: 'text', when: ['on_call.source', 'teamup'],
        help: 'This product\u2019s on-call calendar.' },
      { key: 'on_call.people', label: 'On-call people', kind: 'table', add: 'Add a person', ordered: true, when: ['on_call.source', 'list'],
        help: 'Called in this order.',
        columns: [['name', 'Name', 'text', 'minmax(0, 1fr)'], ['phone', 'Phone', 'phone', 'minmax(0, 1.2fr)']] },
      { key: 'on_call.management_fallback', label: 'If nobody answers', kind: 'table', add: 'Add a person', ordered: true, required: true,
        help: 'Called in this order once everyone on call has been tried.',
        columns: [['name', 'Name', 'text', 'minmax(0, 1fr)'], ['phone', 'Phone', 'phone', 'minmax(0, 1.2fr)']] },
      { key: 'on_call.steps', label: 'Before calling', kind: 'list', add: 'Add a step', advanced: true,
        help: 'Anything to do first, one step per line.' },
      { key: 'on_call.wait_before_next_minutes', label: 'Minutes before trying the next person', kind: 'number', unit: 'min', step: 5, def: 15, min: 0, advanced: true,
        help: 'How long to wait for an answer.' },
      { key: 'on_call.calls_per_person', label: 'Calls to each person', kind: 'number', unit: 'calls', step: 1, def: 2, min: 1, advanced: true,
        help: 'How many times to call before moving on.' },
      { key: 'on_call.confirmation_wait_minutes', label: 'Minutes to wait for action after an answer', kind: 'number', unit: 'min', step: 5, def: 15, min: 0, advanced: true,
        help: 'If nothing happens on the ticket in this time, AiMY calls the next person.' }
    ] }
  ];
  const CUSTOM_HELP = 'Anything this product needs that the form does not have. Only this configuration gets them.';
  const CUSTOM_KINDS = [['text', 'Text'], ['long', 'Long text'], ['number', 'Number'], ['boolean', 'Yes / no'],
                        ['choice', 'Choice'], ['multi', 'Multi-choice'], ['list', 'List'], ['table', 'Table']];
  const KIND_LABEL = CUSTOM_KINDS.reduce((a, k) => { a[k[0]] = k[1]; return a; }, {});

  const FIELD = {};
  SCHEMA.forEach((s) => s.fields.forEach((f) => { f.sec = s.key; FIELD[f.key] = f; }));

  /* ── Small things ── */
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const idOf = (k) => 'cf-' + String(k).replace(/[^\w-]/g, '-');
  /* Lucide, verbatim, on the 24 grid. */
  const svg = (p, s) => `<svg width="${s || 16}" height="${s || 16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    upload: '<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    cal: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'
  };

  /* One dialable number: digits, spaces, + ( ) . - and an optional extension. */
  const PHONE_OK = /^\+?[\d\s().-]{6,}(\s*(ext\.?|x)\s*\d{1,6})?$/i;
  const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dateSay = (iso) => { const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? +m[3] + ' ' + MON3[+m[2] - 1] + ' ' + m[1] : iso; };
  const DAYS = [['mon', 'Mon', 'Monday'], ['tue', 'Tue', 'Tuesday'], ['wed', 'Wed', 'Wednesday'], ['thu', 'Thu', 'Thursday'],
                ['fri', 'Fri', 'Friday'], ['sat', 'Sat', 'Saturday'], ['sun', 'Sun', 'Sunday']];
  const DAY_I = DAYS.reduce((a, d, i) => { a[d[0]] = i; return a; }, {});
  const WEEK = 7 * 1440;

  /* ── Times ──
     Typed the way people say them: 9, 930, 9:30, 9.30, 6pm, 6:30 pm, 18,
     noon, midnight. Stored as HH:mm. */
  function parseTime(raw) {
    let s = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!s) return null;
    if (s === 'noon') return '12:00';
    if (s === 'midnight') return '00:00';
    const ap = (s.match(/(am|pm|a|p)$/) || [])[1];
    if (ap) s = s.slice(0, -ap.length);
    let h, m;
    let mm = s.match(/^(\d{1,2})[:.h]?(\d{2})?$/);
    if (!mm && /^\d{3,4}$/.test(s)) mm = [s, s.slice(0, s.length - 2), s.slice(-2)];
    if (!mm) return null;
    h = +mm[1]; m = mm[2] ? +mm[2] : 0;
    if (m > 59) return null;
    if (ap) { if (h < 1 || h > 12) return null; if (ap[0] === 'p' && h < 12) h += 12; if (ap[0] === 'a' && h === 12) h = 0; }
    if (h === 24 && m === 0) h = 0;
    if (h > 23) return null;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
  const toMin = (t) => { const p = parseTime(t); return p ? +p.slice(0, 2) * 60 + +p.slice(3) : null; };
  const fromMin = (n) => { n = ((n % 1440) + 1440) % 1440; return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); };
  /* "6 pm", "8:30 am", "midnight", "noon". */
  function say12(t) {
    const n = toMin(t);
    if (n === null) return t;
    if (n === 0) return 'midnight';
    if (n === 720) return 'noon';
    const h = Math.floor(n / 60), m = n % 60;
    return ((h % 12) || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? ' am' : ' pm');
  }

  /* The team's week as merged spans of minutes from Monday 00:00. */
  function teamSpans(rows) {
    const raw = [];
    (rows || []).forEach((r) => {
      const d = DAY_I[r.day], s = toMin(r.start), e = toMin(r.end);
      if (d === undefined || s === null || e === null) return;
      const len = e > s ? e - s : e === s ? 1440 : e + 1440 - s;
      const S = d * 1440 + s, E = S + len;
      if (E <= WEEK) raw.push([S, E]); else { raw.push([S, WEEK]); raw.push([0, E - WEEK]); }
    });
    raw.sort((a, b) => a[0] - b[0]);
    const out = [];
    raw.forEach((r) => { const l = out[out.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else out.push(r.slice()); });
    return out;
  }

  /* When AiMY covers, in words: the gaps between the team's shifts. Nights
     with the same times on days in a row are said once ("Mon to Thu,
     5 pm to 9 am"). */
  function aimyWindows(rows) {
    const spans = teamSpans(rows);
    if (!spans.length) return ['All week'];
    const gaps = [];
    spans.forEach((sp, i) => {
      const nx = spans[(i + 1) % spans.length];
      const a = sp[1], b = i + 1 < spans.length ? nx[0] : nx[0] + WEEK;
      if (b > a) gaps.push([a, b]);
    });
    if (!gaps.length) return [];
    const D = DAYS.map((d) => d[1]);
    const at = (m) => ({ d: Math.floor(m / 1440) % 7, t: fromMin(m % 1440) });
    const items = gaps.map((g) => ({ s: at(g[0]), e: at(g[1]), len: g[1] - g[0] }));
    const out = [];
    for (let i = 0; i < items.length; i++) {
      let j = i;
      while (j + 1 < items.length && items[j + 1].s.t === items[i].s.t && items[j + 1].len === items[i].len && items[i].len < 1440 && items[j + 1].s.d === (items[j].s.d + 1) % 7) j++;
      const it = items[i];
      if (j > i) out.push(D[it.s.d] + ' to ' + D[items[j].s.d] + ', ' + say12(it.s.t) + ' to ' + say12(it.e.t) + (it.e.d !== it.s.d ? ' next day' : ''));
      else if (it.len >= WEEK) out.push('All week');
      else out.push(D[it.s.d] + ' ' + say12(it.s.t) + ' to ' + (it.e.d === it.s.d && it.len < 1440 ? '' : D[it.e.d] + ' ') + say12(it.e.t));
      i = j;
    }
    return out;
  }
  const teamMinutes = (rows) => teamSpans(rows).reduce((n, s) => n + s[1] - s[0], 0);

  /* ── Timezones ── */
  let ZONES = null;
  const zones = () => {
    if (ZONES) return ZONES;
    try { ZONES = Intl.supportedValuesOf('timeZone'); } catch (e) { ZONES = []; }
    if (ZONES.indexOf('UTC') < 0) ZONES.push('UTC');
    return ZONES;
  };
  const zoneOk = (z) => !!z && zones().indexOf(z) > -1;
  const zoneCity = (z) => String(z).split('/').pop().replace(/_/g, ' ');
  function zoneMatches(q) {
    q = String(q || '').trim().toLowerCase().replace(/[\s_]+/g, ' ');
    if (!q) return [];
    const all = zones();
    const score = (z) => {
      const city = zoneCity(z).toLowerCase(), full = z.toLowerCase().replace(/_/g, ' ');
      if (city.indexOf(q) === 0) return 0;
      if (full.indexOf(q) === 0) return 1;
      if (city.indexOf(q) > -1) return 2;
      if (full.indexOf(q) > -1) return 3;
      return 9;
    };
    return all.map((z) => [z, score(z)]).filter((x) => x[1] < 9).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).slice(0, 6).map((x) => x[0]);
  }
  function zoneNow(z) {
    try {
      return new Intl.DateTimeFormat('en-US', { timeZone: z, hour: 'numeric', minute: '2-digit', weekday: 'long' })
        .format(new Date()).replace('AM', 'am').replace('PM', 'pm');
    } catch (e) { return ''; }
  }

  /* ── Values ──
     Keys are the developers' dotted keys. A custom field's value is reached
     with `c:<id>`, its options with `co:<id>`, its columns with `cc:<id>`. */
  const customs = (form) => form._custom || (form._custom = []);
  const custom = (form, id) => customs(form).filter((c) => c.id === id)[0] || null;
  function getV(form, key) {
    const m = String(key).match(/^(c|co|cc):(.+)$/);
    if (!m) return form[key];
    const c = custom(form, m[2]);
    if (!c) return undefined;
    return m[1] === 'c' ? c.value : m[1] === 'co' ? c.options : c.columns;
  }
  function setV(form, key, v) {
    const m = String(key).match(/^(c|co|cc):(.+)$/);
    if (!m) { if (v === undefined) delete form[key]; else form[key] = v; return; }
    const c = custom(form, m[2]);
    if (!c) return;
    if (m[1] === 'c') c.value = v; else if (m[1] === 'co') c.options = v; else c.columns = v;
  }
  /* The descriptor a custom field is drawn with, shaped like a schema field. */
  function customField(c) {
    const f = { key: 'c:' + c.id, kind: c.kind, label: c.name || 'Untitled field', custom: c };
    if (c.kind === 'number') { f.step = 1; }
    if (c.kind === 'list') f.add = 'Add an item';
    if (c.kind === 'table') {
      f.add = 'Add a row';
      f.columns = (c.columns || []).map((n, i) => ['c' + i, n || 'Column ' + (i + 1), 'text', 'minmax(0, 1fr)']);
    }
    return f;
  }
  const fieldOf = (form, key) => FIELD[key] || (/^c:/.test(key) ? (custom(form, key.slice(2)) && customField(custom(form, key.slice(2)))) : null);

  const shown = (f, form) => !f.when || form[f.when[0]] === f.when[1];
  function filled(f, v) {
    if (v === undefined || v === null) return false;
    if (f.kind === 'hours') return Array.isArray(v) && v.length > 0;
    if (f.kind === 'list') return Array.isArray(v) && v.some((s) => String(s).trim());
    if (f.kind === 'table') return Array.isArray(v) && v.some((r) => Object.keys(r).some((k) => String(r[k] == null ? '' : r[k]).trim()));
    if (f.kind === 'number') return v !== '' && !isNaN(v);
    return String(v).trim() !== '';
  }
  const missingIn = (form, sec) => SCHEMA.filter((s) => !sec || s.key === sec).reduce((a, s) =>
    a.concat(s.fields.filter((f) => f.required && shown(f, form) && !filled(f, form[f.key]))), []);
  const required = (form) => SCHEMA.reduce((a, s) => a.concat(s.fields.filter((f) => f.required && shown(f, form))), []);
  function left(o) { return missingIn((o && o.x && o.x.form) || {}).length; }

  /* Advanced fields the person has opened this session, per document. A field
     with a value is always open; one at its default waits behind its pill. */
  const OPENED = {};
  const opened = (o) => OPENED[o.id] || (OPENED[o.id] = {});
  const isOpen = (o, f) => !f.advanced || filled(f, o.x.form[f.key]) || !!opened(o)[f.key];

  /* ── Drawing ── */
  let HOST = null;
  let CTX = { product: '' };
  /* One-shot motion marks, read by the next paint and cleared: what just
     entered gets an entrance, nothing else moves. */
  let FX = {};
  /* The doc being drawn. */
  let CUR = null;

  function render(o, ctx) {
    if (ctx) CTX = ctx;
    if (!o.x.form) o.x.form = {};
    const html = `<section class="dv-subject is-wide cf" data-type="config" data-cf-root="${esc(o.id)}" aria-label="The configuration">${inner(o)}</section>`;
    FX = {};
    return html;
  }

  /* ── A ticket's night ──
     The config is drawn as the path a ticket takes after hours. Each stop
     asks the question AiMY asks the ticket and shows this product's answer;
     the rail forks at "Is it urgent?". Picking a stop opens its editor: on a
     desk beside the path, level with the stop; on a phone as a view of its
     own, with Back to the night and Next. */
  const PATH = ['tickets', 'schedule', 'coverage', 'urgent', 'not_urgent', 'on_call', 'custom'];
  const PICK = {};      // the stop whose editor is open beside the path
  const PHONE = {};     // on a phone, the stop opened as its own view
  let NARROW = false;
  /* Wide: the editor sits beside the canvas inside the document column, and
     the document's own right panel stays as it is (Nour). Canvas (18rem at
     least) + gap + editor (30rem at least): below 50rem the canvas stands
     alone and a node opens as its own view. */
  const narrowNow = () => {
    const r = root();
    const w = r ? r.getBoundingClientRect().width : 0;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return w ? w < 50 * rem : window.innerWidth < 1100;
  };
  const IC = {
    tickets: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    schedule: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    coverage: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    urgent: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    not_urgent: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    on_call: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    custom: '<path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/>'
  };
  /* The question AiMY asks at each stop, and what the editor explains. */
  const Q = {
    tickets: ['Tickets', ''],
    schedule: ['Hours', 'When the team works. AiMY covers the rest of the week.'],
    coverage: ['Customers', 'Which support tiers AiMY covers, where to check a customer’s tier, and who has their own rule.'],
    urgent: ['Urgency', 'What makes a ticket urgent for this product.'],
    not_urgent: ['Routine', 'What AiMY does with a ticket that can wait.'],
    on_call: ['Calls', 'Who AiMY calls when it’s urgent, in what order, and how long it waits.'],
    custom: ['Extras', CUSTOM_HELP]
  };
  const needOf = (o, k) => (k === 'custom' ? [] : missingIn(o.x.form, k));
  const firstNeed = (o) => PATH.filter((k) => needOf(o, k).length)[0] || null;

  function inner(o) {
    CUR = o;
    NARROW = narrowNow();
    const head = `<div class="cf-head">
        <p class="cf-for">For <b>${esc(CTX.product || 'this product')}</b>. The product is set under What it is.</p>
        <button class="btn btn-ghost btn-sm" type="button" data-pick-files=".yaml,.yml,.json,.xml">${svg(I.upload, 14)}<span>Upload a file instead</span></button>
      </div>`;
    if (NARROW && PHONE[o.id]) {
      return head + `<div class="cf-view${FX.view ? ' is-in-' + FX.view : ''}">${stopEditor(o, PHONE[o.id], true)}</div>`;
    }
    if (!NARROW && !PICK[o.id]) PICK[o.id] = firstNeed(o) || 'tickets';
    const canvas = `<div class="cf-canvas${FX.view ? ' is-in-' + FX.view : ''}">
        <div class="cf-flow" role="list" aria-label="What happens to a ticket after hours">${flowHTML(o)}</div>
      </div>`;
    return head + progressHTML(o) + (NARROW ? canvas : `<div class="cf-cp">${canvas}
        <section class="cf-side${FX.panel ? ' is-swap' : ''}" data-cf-side="${esc(o.id)}" aria-label="${esc(Q[PICK[o.id]][0])}, being changed">${stopEditor(o, PICK[o.id], false, false)}</section>
      </div>`);
  }

  function progressHTML(o) {
    const form = o.x.form;
    const req = required(form), miss = missingIn(form);
    const done = req.length - miss.length;
    const next = firstNeed(o);
    return `<div class="cf-progress${miss.length ? '' : ' is-ok'}">
        <div class="cf-meter" aria-hidden="true"><i style="transform: scaleX(${req.length ? (done / req.length).toFixed(3) : 1})"></i></div>
        <p><b>${done} of ${req.length}</b> required answers in. ${miss.length
          ? 'Publish opens when all are in.'
          : 'Everything AiMY needs is here. Publish is open.'}</p>
        ${next && !(PICK[o.id] === next && !NARROW) ? `<button class="btn btn-ghost btn-sm" type="button" data-cf-stop="${next}"><span>Answer the next: ${esc(Q[next][0])}</span>${svg('<path d="m9 18 6-6-6-6"/>', 14)}</button>` : ''}
      </div>`;
  }

  /* What a stop says on the path: its answer, short, in the shape of its data. */
  const rowsOf = (v) => (Array.isArray(v) ? v.filter((r) => Object.keys(r || {}).some((x) => String(r[x] == null ? '' : r[x]).trim())) : []);
  const itemsOf = (v) => (Array.isArray(v) ? v.filter((s) => String(s).trim()) : []);
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const hrs = (m) => (Math.round(m / 6) / 10).toString();
  const initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const needSay = (o, k) => {
    const m = needOf(o, k);
    return m.length ? `<span class="cf-a is-need">Needs ${esc(m.map((f) => /^[A-Z][a-z]/.test(f.label) && !/^AiMY/.test(f.label) ? f.label.charAt(0).toLowerCase() + f.label.slice(1) : f.label).join(' and '))}</span>` : '';
  };

  const ANSWER = {
    tickets: (o, form) => needSay(o, 'tickets') || `<span class="cf-a">In <b>${esc(optLabel(FIELD['tickets.crm_source'], form['tickets.crm_source']))}</b></span>`,
    schedule: (o, form) => {
      const rows = form['schedule.working_hours'] || [];
      const tz = form['schedule.timezone'];
      const hol = rowsOf(form['schedule.holidays']).length;
      const pre = form['schedule.pre_window_minutes'] !== undefined ? form['schedule.pre_window_minutes'] : 15;
      const win = rows.length ? aimyWindows(rows) : [];
      return (needSay(o, 'schedule') || '<span class="cf-a">AiMY covers</span>') +
        (win.length ? `<span class="cf-a-list is-plain">${win.map((w) => `<span>${esc(w)}</span>`).join('')}</span>` : '') +
        `<span class="cf-a-sub">${tz && zoneOk(tz) ? esc(zoneCity(tz)) + ' time' : 'No timezone yet'} · hands over ${pre} min before the team starts${hol ? ' · ' + plural(hol, 'holiday', 'holidays') : ''}</span>`;
    },
    coverage: (o, form) => {
      const tiers = rowsOf(form['coverage.customer_tiers']);
      const ex = rowsOf(form['coverage.special_customers']);
      return (tiers.length ? `<span class="cf-a">Covers <b>${esc(tiers.map((t) => (t.tier || 'a tier') + (t.covered_days ? ', ' + t.covered_days : '')).join('; '))}</b></span>`
          : '<span class="cf-a">No tiers listed yet</span>') +
        `<span class="cf-a-sub">${form['coverage.tier_source'] ? 'Checked in ' + esc(form['coverage.tier_source']) : 'No place to check a tier yet'}${ex.length ? ' · ' + plural(ex.length, 'exception', 'exceptions') : ''}</span>`;
    },
    urgent: (o, form) => {
      const ex = itemsOf(form['urgent.examples']), kw = itemsOf(form['urgent.keywords']);
      const match = form['urgent.match'] || 'any';
      const n = ex.length + kw.length;
      return (needSay(o, 'urgent') || `<span class="cf-a">Urgent when it matches <b>${match === 'all' ? 'all' : 'any'} of ${plural(n, 'sign', 'signs')}</b></span>`) +
        (ex.length ? `<span class="cf-a-list">${ex.slice(0, 2).map((s) => `<span>${esc(s)}</span>`).join('')}${ex.length > 2 ? `<span class="cf-a-more">and ${ex.length - 2} more</span>` : ''}</span>` : '');
    },
    not_urgent: (o, form) => {
      const a = form['not_urgent.action'];
      const ex = itemsOf(form['not_urgent.examples']);
      return (needSay(o, 'not_urgent') || `<span class="cf-a"><b>${esc(optLabel(FIELD['not_urgent.action'], a))}</b></span>`) +
        (ex.length ? `<span class="cf-a-sub">${plural(ex.length, 'example', 'examples')} of what can wait</span>` : '');
    },
    on_call: (o, form) => {
      const src = form['on_call.source'];
      const ppl = src === 'list' ? rowsOf(form['on_call.people']) : [];
      const fb = rowsOf(form['on_call.management_fallback']);
      const calls = form['on_call.calls_per_person'] !== undefined ? form['on_call.calls_per_person'] : 2;
      const wait = form['on_call.wait_before_next_minutes'] !== undefined ? form['on_call.wait_before_next_minutes'] : 15;
      const person = (p, fall) => `<span class="cf-chain-p${fall ? ' is-fall' : ''}"><span class="cf-av" aria-hidden="true">${esc(initials(p.name))}</span><span>${esc(p.name || 'Unnamed')}</span></span>`;
      const first = src === 'teamup' ? `<span class="cf-chain-p"><span class="cf-av" aria-hidden="true">${svg('<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>', 13)}</span><span>Whoever TeamUp has on call</span></span>`
        : ppl.map((p) => person(p)).join('');
      return needSay(o, 'on_call') + (first || fb.length ? `<span class="cf-chain">${first}${fb.length ? `<span class="cf-chain-gap">If nobody answers</span>${fb.map((p) => person(p, true)).join('')}` : ''}</span>` : '') +
        (src ? `<span class="cf-a-sub">${plural(calls, 'call', 'calls')} each, the next after ${wait} min</span>` : '');
    },
    custom: (o, form) => {
      const list = customs(form);
      if (!list.length) return '<span class="cf-a-sub">Nothing extra yet</span>';
      const say = (c) => {
        const v = c.value;
        if (Array.isArray(v)) return v.length ? plural(v.length, c.kind === 'table' ? 'row' : 'item', c.kind === 'table' ? 'rows' : 'items') : 'empty';
        if (v === true) return 'yes';
        if (v === false) return 'no';
        return v === undefined || v === '' ? 'empty' : String(v);
      };
      return `<span class="cf-a-kv">${list.map((c) => `<span><span>${esc(c.name || 'Untitled field')}</span><b>${esc(say(c))}</b></span>`).join('')}</span>`;
    }
  };

  /* A node: what AiMY checks or does, and this product's answer under it.
     The whole card opens it. */
  function nodeHTML(o, k) {
    const cur = !NARROW && PICK[o.id] === k;
    const need = needOf(o, k).length > 0;
    return `<div class="cf-nd${cur ? ' is-current' : ''}${need ? ' is-need' : ''}" role="listitem" data-cf-nd="${k}">
        <button class="cf-nd-btn" type="button" data-cf-stop="${k}" aria-expanded="${cur}" aria-label="${esc(Q[k][0])}${need ? ', needs answers' : ''}, change">
          <span class="cf-nd-ic" aria-hidden="true">${svg(IC[k], 16)}</span>
          <span class="cf-nd-t">${esc(Q[k][0])}</span>
        </button>
        <div class="cf-nd-a">${ANSWER[k](o, o.x.form)}</div>
      </div>`;
  }

  function flowHTML(o) {
    return nodeHTML(o, 'tickets') + nodeHTML(o, 'schedule') + nodeHTML(o, 'coverage') + nodeHTML(o, 'urgent') +
      `<div class="cf-fk" role="presentation"><div class="cf-lane is-no"><span class="cf-fk-tag is-no">Not urgent</span>${nodeHTML(o, 'not_urgent')}</div><div class="cf-lane is-yes"><span class="cf-fk-tag is-yes">Urgent</span>${nodeHTML(o, 'on_call')}</div></div>` +
      `<div class="cf-fk-extra" role="presentation">${nodeHTML(o, 'custom')}</div>`;
  }

  /* The editor for one stop: its question, the fields, then the next stop. */
  function stopEditor(o, k, phone, side) {
    const i = PATH.indexOf(k);
    const prev = PATH[i - 1], next = PATH[i + 1];
    const short = (x) => Q[x][0];
    const body = k === 'custom' ? customHTML(o) : secHTML(o, SCHEMA.filter((s) => s.key === k)[0]);
    return `${phone ? `<button class="btn btn-ghost btn-sm cf-back" type="button" data-cf-night>${svg('<path d="m15 18-6-6 6-6"/>', 16)}<span>Back to the canvas</span></button>` : ''}
      <header class="cf-panel-head">
        <span class="cf-node" aria-hidden="true">${svg(IC[k], 18)}</span>
        <div><h2 id="${idOf('t-' + k)}" tabindex="-1">${esc(Q[k][0])}</h2>${Q[k][1] ? `<p>${esc(Q[k][1])}</p>` : ''}</div>
        ${side ? `<button class="cf-side-x" type="button" data-cf-sideclose aria-label="Close ${esc(Q[k][0])} and show the document's details">${svg(I.x, 16)}</button>` : ''}
      </header>
      <div class="cf-ed">${body}</div>
      <div class="cf-ed-foot">
        ${prev ? `<button class="btn btn-ghost btn-sm" type="button" data-cf-stop="${prev}">${svg('<path d="m15 18-6-6 6-6"/>', 14)}<span>${esc(short(prev))}</span></button>` : '<span></span>'}
        ${next ? `<button class="btn btn-brand btn-sm" type="button" data-cf-stop="${next}"><span>Next: ${esc(short(next))}</span>${svg('<path d="m9 18 6-6-6-6"/>', 14)}</button>`
          : phone ? `<button class="btn btn-brand btn-sm" type="button" data-cf-night><span>Back to the canvas</span>${svg('<path d="m9 18 6-6-6-6"/>', 14)}</button>` : '<span></span>'}
      </div>`;
  }




  function secHTML(o, s) {
    const form = o.x.form;
    const open = s.fields.filter((f) => shown(f, form) && isOpen(o, f) && !f.when);
    const more = s.fields.filter((f) => f.advanced && !isOpen(o, f));
    /* A field that waits on another sits right under it, so the choice and
       what it brings stay together. */
    const body = open.map((f) => {
      const kids = s.fields.filter((k) => k.when && k.when[0] === f.key && shown(k, form));
      return fieldHTML(o, f) + kids.map((k) => fieldHTML(o, k)).join('');
    }).join('');
    return `<section class="cf-sec" data-cf-sec="${s.key}" aria-labelledby="${idOf('t-' + s.key)}">
        <div class="cf-fields">${body}</div>
        ${more.length ? `<div class="cf-more"><span class="cf-more-lab">Also set</span><div class="cf-more-pills">${more.map((f) =>
          `<button class="chip default cf-pill" type="button" data-cf-open="${f.key}">${svg(I.plus, 14)}<span>${esc(f.label)}${f.def !== undefined
            ? `<span class="cf-pill-val">${esc(f.kind === 'choice' ? optLabel(f, f.def) : f.def + ' ' + f.unit)}</span>` : ''}</span></button>`).join('')}</div></div>` : ''}
      </section>`;
  }
  const optLabel = (f, v) => ((f.options || []).filter((p) => p[0] === v)[0] || [v, v])[1];

  function fieldHTML(o, f) {
    const form = o.x.form;
    const v = getV(form, f.key);
    const id = idOf(f.key);
    const group = f.kind === 'choice' || f.kind === 'hours' || f.kind === 'table' || f.kind === 'list' || f.kind === 'boolean' || f.kind === 'multi';
    const req = f.required && !filled(f, v) ? '<span class="tag tag-warn cf-req">Required</span>' : '';
    const close = f.advanced ? `<button class="link cf-close" type="button" data-cf-close="${f.key}">${f.def !== undefined ? 'Back to the default' : 'Remove'}</button>` : '';
    const enter = FX.enter === f.key ? ' is-entering' : '';
    return `<div class="cf-field${enter}" data-cf-field="${esc(f.key)}" data-kind="${f.kind}">
        <div class="cf-label-row">${group
          ? `<span class="cf-label" id="${id}-l">${esc(f.label)}</span>`
          : `<label class="cf-label" id="${id}-l" for="${id}">${esc(f.label)}</label>`}${req}${close}</div>
        ${f.help ? `<p class="cf-help" id="${id}-h">${esc(f.help)}</p>` : ''}
        <div class="cf-control">${control(o, f, v)}</div>
      </div>`;
  }

  function control(o, f, v) {
    const id = idOf(f.key), lab = `aria-labelledby="${id}-l"`, desc = f.help ? ` aria-describedby="${id}-h"` : '';
    switch (f.kind) {
      case 'choice': return choiceHTML(f, v === undefined ? f.def : v, lab);
      case 'boolean': return choiceHTML({ key: f.key, options: [[true, 'Yes'], [false, 'No']] }, v, lab);
      case 'multi': return multiHTML(o, f, v, lab);
      case 'timezone': return tzHTML(f, v, desc);
      case 'hours': return hoursHTML(f, v || [], lab);
      case 'number': {
        const val = v === undefined || v === null ? (f.def !== undefined ? f.def : '') : v;
        return `<span class="cf-numrow"><span class="stepper">
            <button type="button" data-cf-step="${esc(f.key)}|-1" aria-label="Less" tabindex="-1">${svg(I.minus, 14)}</button>
            <input id="${id}" inputmode="numeric" autocomplete="off" data-cf-num="${esc(f.key)}" value="${esc(val)}"${desc}${f.unit ? ` aria-label="${esc(f.label)}, in ${esc(f.unit === 'min' ? 'minutes' : f.unit)}"` : ''}>
            <button type="button" data-cf-step="${esc(f.key)}|1" aria-label="More" tabindex="-1">${svg(I.plus, 14)}</button>
          </span>${f.unit ? `<span class="cf-unit" aria-hidden="true">${esc(+val === 1 && f.unit !== 'min' ? f.unit.replace(/s$/, '') : f.unit)}</span>` : ''}${f.def !== undefined && +val === f.def ? '<span class="tag tag-neutral">The default</span>' : ''}</span>`;
      }
      case 'long': return `<textarea class="ds-textarea cf-ta" id="${id}" rows="2" data-cf-text="${esc(f.key)}" data-grow${desc}>${esc(v || '')}</textarea>`;
      case 'list': return listHTML(f, v || [], lab);
      case 'table': return tableHTML(f, v || [], lab);
      default: return `<input class="input cf-in" id="${id}" type="text" autocomplete="off" spellcheck="false" data-cf-text="${esc(f.key)}" value="${esc(v || '')}"${desc}>`;
    }
  }

  /* A short set of short answers is a segmented row; anything longer reads
     as a list of options, one per line. One click either way. */
  function choiceHTML(f, v, lab) {
    const long = f.options.length > 3 || f.options.some((p) => String(p[1]).length > 22);
    const has = f.options.some((p) => p[0] === v);
    if (long) {
      /* The library's radio cards: real radios, so arrows move between them. */
      const name = idOf('r-' + f.key);
      return `<div class="radio-cards cf-rcards" role="radiogroup" ${lab}>${f.options.map((p) =>
        `<label class="radio-card"><input type="radio" name="${name}" ${p[0] === v ? 'checked' : ''} data-cf-pick="${esc(f.key)}|${esc(JSON.stringify(p[0]))}"><span class="rc-title">${esc(p[1])}</span></label>`).join('')}</div>`;
    }
    return `<div class="seg cf-seg" role="radiogroup" ${lab}>${f.options.map((p, i) => {
      const on = p[0] === v;
      return `<button class="seg-btn${on ? ' active' : ''}" type="button" role="radio" aria-checked="${on}"
          tabindex="${on || (!has && i === 0) ? 0 : -1}" data-cf-pick="${esc(f.key)}|${esc(JSON.stringify(p[0]))}">${esc(p[1])}</button>`;
    }).join('')}</div>`;
  }

  function multiHTML(o, f, v, lab) {
    const c = f.custom, opts = (c.options || []).filter((s) => String(s).trim());
    const on = Array.isArray(v) ? v : [];
    return `<div class="cf-sub"><span class="cf-sub-lab">Options</span>${listHTML({ key: 'co:' + c.id, add: 'Add an option' }, c.options || [], lab)}</div>
      ${opts.length ? `<div class="cf-sub"><span class="cf-sub-lab">${c.kind === 'multi' ? 'Picked' : 'Picked'}</span>${c.kind === 'multi'
        ? `<div class="seg cf-seg is-wrap" role="group" ${lab}>${opts.map((s) => `<button class="seg-btn${on.indexOf(s) > -1 ? ' active' : ''}" type="button" aria-pressed="${on.indexOf(s) > -1}" data-cf-mpick="${esc(f.key)}|${esc(s)}">${esc(s)}</button>`).join('')}</div>`
        : choiceHTML({ key: f.key, options: opts.map((s) => [s, s]) }, v, lab)}</div>`
      : '<p class="cf-note">Add the options first, then pick.</p>'}`;
  }

  function tzHTML(f, v, desc) {
    const id = idOf(f.key);
    const ok = zoneOk(v);
    return `<div class="cf-tz">
        <input class="input cf-in" id="${id}" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list"
          aria-expanded="false" aria-controls="${id}-list" data-cf-tz="${esc(f.key)}" value="${esc(v || '')}" placeholder="Type a city, like New York"${desc}>
        <div class="cf-tz-list" id="${id}-list" role="listbox" hidden></div>
      </div>
      ${v ? (ok ? `<p class="cf-note">It\u2019s ${esc(zoneNow(v))} in ${esc(zoneCity(v))} now.</p>`
        : `<p class="cf-note is-err">AiMY doesn\u2019t know \u201c${esc(v)}\u201d. Type a city and pick it from the list.</p>`) : ''}`;
  }

  /* A time is the Schedule page's chip: the time and a down arrow; it opens
     the Console's list of half hours, and its arrow keys step half an hour. */
  const hm = (t) => { const v = say12(t); return v === 'midnight' ? '12 am' : v === 'noon' ? '12 pm' : v; };
  const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const tchip = (key, d, r, k) => `<button class="ah-wchip cf-tchip" type="button" aria-haspopup="listbox" data-cf-tchip="${esc(key)}|${d[0]}|${k}"
      aria-label="${esc(d[2] + ', the team ' + (k === 'start' ? 'starts at ' : 'stops at ') + hm(r[k]) + ', change')}">${esc(hm(r[k]))}${CHEV}</button>`;
  function tchipMenu(anchor) {
    const S = window.AIMY_SETTINGS;
    if (!S || !S.pop) return;
    const v = anchor.getAttribute('data-cf-tchip');
    const o = docOf(), p = v.split('|');
    const r = o && (o.x.form[p[0]] || []).filter((x) => x.day === p[1])[0];
    if (!r) return;
    const cur = toMin(r[p[2]]);
    const opts = [];
    for (let m = 0; m < 1440; m += 30) opts.push(m);
    if (cur !== null && opts.indexOf(cur) < 0) { opts.push(cur); opts.sort((x, y) => x - y); }
    const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    const pop = S.pop(anchor, opts.map((m) =>
      `<button class="set2-pop-i is-scope${m === cur ? ' is-on' : ''}" type="button" role="option" aria-selected="${m === cur}" data-cf-tgo="${esc(v + '|' + fromMin(m))}">` +
        `<span class="set2-pop-tx"><span class="set2-pop-n">${esc(hm(fromMin(m)))}</span></span><span class="set2-pop-k">${tick}</span></button>`).join(''), 'is-times');
    const on = (pop || document.getElementById('setPop') || document).querySelector('.is-on');
    if (on && on.parentElement) on.parentElement.scrollTop = on.offsetTop - on.parentElement.clientHeight / 2 + on.offsetHeight / 2;
  }
  /* A date: the library's calendar (.cal), in the Console's popover. */
  const CALV = {};
  function calHTML(o, key) {
    const p = key.split('|');
    const r = (getV(o.x.form, p[0]) || [])[+p[1]] || {};
    const cur = r[p[2]] || '';
    const view = CALV[key];
    const y = view.getUTCFullYear(), mo = view.getUTCMonth();
    const lead = (new Date(Date.UTC(y, mo, 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    const iso = (d) => d.toISOString().slice(0, 10);
    const today = iso(new Date());
    const cells = [];
    for (let i = lead; i > 0; i--) cells.push({ d: new Date(Date.UTC(y, mo, 1 - i)), muted: true });
    for (let i = 1; i <= days; i++) cells.push({ d: new Date(Date.UTC(y, mo, i)) });
    while (cells.length % 7) cells.push({ d: new Date(Date.UTC(y, mo, days + cells.length - lead - days + 1)), muted: true });
    const chev = (d) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
    return `<div class="cal" role="dialog" aria-label="Pick a date">
      <div class="cal-head">
        <button class="cal-nav" type="button" data-cf-calnav="${esc(key)}|-1" aria-label="Previous month">${chev('m15 18-6-6 6-6')}</button>
        <div class="cal-title">${MONL[mo]} ${y}</div>
        <button class="cal-nav" type="button" data-cf-calnav="${esc(key)}|1" aria-label="Next month">${chev('m9 18 6-6-6-6')}</button>
      </div>
      <div class="cal-grid">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<div class="cal-dow">${d.slice(0, 2)}</div>`).join('')}${cells.map((c) => {
        const d = iso(c.d);
        const cls = ['cal-day'].concat(c.muted ? ['muted'] : [], d === today ? ['today'] : [], d === cur ? ['selected'] : []);
        return `<button class="${cls.join(' ')}" type="button" data-cf-calday="${esc(key)}|${d}" aria-label="${esc(dateSay(d))}"${d === cur ? ' aria-pressed="true"' : ''}>${c.d.getUTCDate()}</button>`;
      }).join('')}</div>
    </div>`;
  }
  function calOpen(anchor) {
    const S = window.AIMY_SETTINGS, o = docOf();
    if (!S || !S.pop || !o) return;
    const key = anchor.getAttribute('data-cf-date'), p = key.split('|');
    const cur = ((getV(o.x.form, p[0]) || [])[+p[1]] || {})[p[2]];
    const base = /^\d{4}-\d{2}-\d{2}$/.test(cur || '') ? new Date(cur + 'T00:00:00Z') : new Date();
    CALV[key] = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
    S.pop(anchor, calHTML(o, key), 'is-cal');
  }
  function setTime(o, v, t) {
    const p = v.split('|');
    setHours(o, p[0], (rs) => { const r = rs.filter((x) => x.day === p[1])[0]; if (r) r[p[2]] = t; });
    touch(o);
    paint(o, '[data-cf-tchip="' + v + '"]');
  }

  function hoursHTML(f, rows, lab) {
    const byDay = {};
    rows.forEach((r) => { byDay[r.day] = r; });
    /* Offered only while Tuesday to Friday differ from Monday. */
    const mon = byDay.mon && ['tue', 'wed', 'thu', 'fri'].some((d) => !byDay[d] || byDay[d].start !== byDay.mon.start || byDay[d].end !== byDay.mon.end) ? byDay.mon : null;
    const win = rows.length ? aimyWindows(rows) : [];
    return `<div class="cf-week" ${lab}>
        ${DAYS.map((d) => {
          const r = byDay[d[0]];
          const s = r && toMin(r.start), e = r && toMin(r.end);
          const tag = !r || s === null || e === null ? '' : s === e ? 'all day' : e !== 0 && e < s ? 'next day' : '';
          return `<div class="cf-wk-row${r ? ' is-on' : ''}" data-cf-wk="${d[0]}">
            <button class="chip ${r ? 'active' : 'default'} cf-day" type="button" aria-pressed="${!!r}" data-cf-day="${esc(f.key)}|${d[0]}"
              aria-label="${esc(d[2])}: ${r ? 'the team works' : 'the team is off'}">${d[1]}</button>
            <div class="cf-wk-times">${r
              ? `${tchip(f.key, d, r, 'start')}<span class="cf-to" aria-hidden="true">–</span>${tchip(f.key, d, r, 'end')}
                 ${tag ? `<span class="cf-wk-tag">${tag}</span>` : ''}`
              : '<span class="cf-off">Off. AiMY covers the day.</span>'}</div>
          </div>`;
        }).join('')}
        <div class="cf-wk-foot">
          <p class="cf-wk-sum"><b>AiMY covers</b> ${win.length ? win.map(esc).join('; ') : 'nothing: the team works all week'}.</p>
        </div>
        ${mon ? `<button class="btn btn-ghost btn-sm cf-add" type="button" data-cf-copy="${esc(f.key)}">${svg(I.copy, 14)}<span>Use Monday’s hours for Tuesday to Friday</span></button>` : ''}
        ${rows.length ? '' : `<button class="btn btn-ghost btn-sm cf-add" type="button" data-cf-week="${esc(f.key)}">${svg(I.plus, 14)}<span>Start from Monday to Friday, 9 am to 5 pm</span></button>`}
      </div>`;
  }

  function listHTML(f, items, lab) {
    return `<div class="cf-list${items.length ? '' : ' is-empty'}" data-cf-list="${esc(f.key)}" role="group" ${lab}>
        ${items.map((s, i) => `<div class="cf-li${FX.enter === f.key + '|' + i ? ' is-entering' : ''}">
          <textarea class="input cf-li-in" rows="1" data-grow data-cf-item="${esc(f.key)}|${i}" aria-label="Item ${i + 1}">${esc(s)}</textarea>
          <button class="icon-btn cf-x" type="button" data-cf-li-del="${esc(f.key)}|${i}" aria-label="Remove item ${i + 1}">${svg(I.x, 14)}</button>
        </div>`).join('')}
        <input class="input cf-li-add" type="text" autocomplete="off" data-cf-li-add="${esc(f.key)}" placeholder="${esc(f.add || 'Add one')}, then press Enter" aria-label="${esc(f.add || 'Add one')}">
      </div>`;
  }

  function tableHTML(f, rows, lab) {
    const cols = f.columns || [];
    const grid = (f.ordered ? '1.5rem ' : '') + cols.map((c) => c[3]).join(' ') + ' 3.75rem';
    const cell = (r, i, c) => {
      const k = f.key + '|' + i + '|' + c[0], v = r[c[0]] == null ? '' : r[c[0]];
      const al = `aria-label="${esc(c[1])}, row ${i + 1}"`;
      if (c[2] === 'days') {
        return `<div class="seg cf-seg is-sm" role="radiogroup" ${al}>${[['all days', 'All days'], ['weekdays only', 'Weekdays']].map((p) =>
          `<button class="seg-btn${v === p[0] ? ' active' : ''}" type="button" role="radio" aria-checked="${v === p[0]}" data-cf-cellpick="${esc(k)}|${esc(p[0])}">${p[1]}</button>`).join('')}</div>`;
      }
      /* A date opens the library's calendar; it reads as words ("25 Dec 2026"). */
      if (c[2] === 'date') {
        return `<button class="input cf-date" type="button" aria-haspopup="dialog" data-cf-date="${esc(k)}" ${al}>${v ? esc(dateSay(v)) : '<span class="cf-date-none">Pick a date</span>'}${svg(I.cal, 14)}</button>`;
      }
      /* A phone column holds one number AiMY can dial, nothing else. */
      if (c[2] === 'phone') {
        const bad = v && !PHONE_OK.test(String(v).trim());
        return `<input class="input cf-cell${bad ? ' error' : ''}" type="tel" inputmode="tel" autocomplete="tel" spellcheck="false" data-cf-cell="${esc(k)}" data-phone value="${esc(v)}" ${al}${bad ? ' aria-invalid="true"' : ''}>` +
          (bad ? '<p class="field-error cf-phone-err">A phone number only, like +44 20 7946 0101 or (514) 555-0137 ext. 6037.</p>' : '');
      }
      /* Text wraps instead of running off the cell. Only "long" columns take a new line. */
      return `<textarea class="input cf-cell cf-ta" rows="1" data-grow${c[2] === 'long' ? '' : ' data-oneline'} data-cf-cell="${esc(k)}" ${al}>${esc(v)}</textarea>`;
    };
    return `<div class="cf-table${rows.length ? '' : ' is-empty'}" role="group" ${lab} style="--cf-cols: ${grid}">
        ${rows.length ? `<div class="cf-tr cf-th" aria-hidden="true">${f.ordered ? '<span></span>' : ''}${cols.map((c) => `<span>${esc(c[1])}</span>`).join('')}<span></span></div>` : ''}
        ${rows.map((r, i) => `<div class="cf-tr${FX.enter === f.key + '|' + i ? ' is-entering' : ''}" data-cf-row="${esc(f.key)}|${i}">
          ${f.ordered ? `<span class="cf-ord">${i + 1}</span>` : ''}${cols.map((c) => `<div class="cf-td" data-col="${esc(c[1])}">${cell(r, i, c)}</div>`).join('')}
          <span class="cf-row-acts">${f.ordered && i ? `<button class="icon-btn cf-x" type="button" data-cf-row-up="${esc(f.key)}|${i}" aria-label="Call row ${i + 1} sooner" title="Call sooner">${svg(I.up, 14)}</button>` : ''}<button class="icon-btn cf-x" type="button" data-cf-row-del="${esc(f.key)}|${i}" aria-label="Remove row ${i + 1}">${svg(I.x, 14)}</button></span>
        </div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm cf-add" type="button" data-cf-row-add="${esc(f.key)}">${svg(I.plus, 14)}<span>${esc(f.add || 'Add a row')}</span></button>`;
  }

  function customHTML(o) {
    const form = o.x.form;
    const list = customs(form);
    return `<section class="cf-sec" data-cf-sec="custom" aria-labelledby="${idOf('t-custom')}">
        <div class="cf-fields">${list.map((c) => {
          const f = customField(c);
          const id = idOf(f.key);
          return `<div class="cf-field cf-cust${FX.enter === f.key ? ' is-entering' : ''}" data-cf-field="${esc(f.key)}" data-kind="${c.kind}">
              <div class="cf-label-row">
                <input class="input cf-cust-name" id="${id}-l" type="text" autocomplete="off" spellcheck="false" data-cf-cname="${esc(c.id)}" value="${esc(c.name || '')}" placeholder="Name this field" aria-label="Field name">
                <span class="tag tag-accent">${esc(KIND_LABEL[c.kind] || c.kind)}</span>
                <button class="link cf-close" type="button" data-cf-cdel="${esc(c.id)}">Remove</button>
              </div>
              ${c.kind === 'table' ? `<div class="cf-sub"><span class="cf-sub-lab">Columns</span>${listHTML({ key: 'cc:' + c.id, add: 'Add a column' }, c.columns || [], `aria-labelledby="${id}-l"`)}</div>` : ''}
              <div class="cf-control">${c.kind === 'choice' || c.kind === 'multi' ? multiHTML(o, f, c.value, `aria-labelledby="${id}-l"`)
                : c.kind === 'table' && !(c.columns || []).some((s) => String(s).trim()) ? '<p class="cf-note">Name the columns first, then add rows.</p>'
                : control(o, f, c.value)}</div>
            </div>`;
        }).join('')}</div>
        <div class="cf-more"><span class="cf-more-lab">Add a field</span><div class="cf-more-pills">${CUSTOM_KINDS.map((k) =>
          `<button class="chip default cf-pill" type="button" data-cf-cadd="${k[0]}">${svg(I.plus, 14)}<span>${k[1]}</span></button>`).join('')}</div></div>
      </section>`;
  }

  /* ── Painting in place ──
     Structure changes repaint the form; typing never does. Focus and the
     caret come back to the same control by its data key. */
  const root = () => document.querySelector('[data-cf-root]');
  /* The form and its editor in the rail, together. */
  const scope = () => { const r = root(); return (r && r.closest('.doc-page')) || r || document; };
  const inForm = (t) => !!(t && t.closest && t.closest('[data-cf-root], [data-cf-side]'));
  const docOf = () => { const r = root(); return r && HOST ? HOST.doc(r.getAttribute('data-cf-root')) : null; };
  function focusKey(el) {
    if (!el || !el.attributes) return null;
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      if (/^data-cf-/.test(a.name)) return '[' + a.name + '="' + (window.CSS && CSS.escape ? CSS.escape(a.value) : a.value) + '"]';
    }
    return null;
  }
  /* The editor beside the canvas is sticky; it must end above the floating
     composer, or its last fields sit under it and out of reach (Nour). Its
     height is what is left between its sticky top and the composer's top. */
  function fitSide() {
    const side = document.querySelector('[data-cf-side]');
    if (!side) return;
    const port = scroller();
    /* Where it sticks: the scroller's top, plus its own top padding, plus
       the 1rem the editor sticks at. */
    const top = (port ? port.getBoundingClientRect().top + (parseFloat(getComputedStyle(port).paddingTop) || 0) : 0) + 16;
    /* The composer, and the answer card that opens above it when it has one. */
    let barTop = Infinity;
    ['aimyFloatWrap', 'aimyPeek'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || !el.offsetHeight) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
      barTop = Math.min(barTop, el.getBoundingClientRect().top);
    });
    const bottom = Math.min(port ? port.getBoundingClientRect().bottom : window.innerHeight, barTop) - 16;
    side.style.maxHeight = Math.max(240, Math.round(bottom - top)) + 'px';
  }
  let PAINTING = false;
  function paint(o, focusSel, fx) {
    const r = root();
    if (!r || !o) return;
    const sc = scope();
    const a = document.activeElement;
    const keep = focusSel === undefined && a && inForm(a) ? focusKey(a) : focusSel;
    const caret = a && 'selectionStart' in a && keep === focusKey(a) ? [a.selectionStart, a.selectionEnd] : null;
    FX = fx || {};
    /* Replacing the focused field blurs it, and that blur is not the person
       leaving: onFocusOut ignores everything while this runs. */
    PAINTING = true;
    try { r.innerHTML = inner(o); } finally { PAINTING = false; }
    FX = {};
    grow(sc);
    fitSide();
    if (keep) {
      const el = sc.querySelector(keep);
      if (el) {
        el.focus({ preventScroll: true });
        if (caret && 'setSelectionRange' in el) try { el.setSelectionRange(caret[0], caret[1]); } catch (e) { /* date inputs */ }
      }
    }
  }
  /* The index and the Required tags follow typing without a repaint. */
  function meta(o) {
    const r = root();
    if (!r) return;
    /* The canvas's answers and the progress line follow the typing. */
    const flow = r.querySelector('.cf-flow');
    if (flow) flow.innerHTML = flowHTML(o);
    const pr = r.querySelector('.cf-progress');
    if (pr) pr.outerHTML = progressHTML(o);
    scope().querySelectorAll('.cf-field').forEach((el) => {
      const f = FIELD[el.getAttribute('data-cf-field')];
      if (!f || !f.required) return;
      const tag = el.querySelector('.cf-req');
      const need = !filled(f, o.x.form[f.key]);
      if (need && !tag) el.querySelector('.cf-label').insertAdjacentHTML('afterend', '<span class="tag tag-warn cf-req">Required</span>');
      if (!need && tag) tag.remove();
    });
  }
  function touch(o) { if (HOST) HOST.dirty(o); }
  function grow(scope) {
    (scope || document).querySelectorAll('[data-cf-root] [data-grow], [data-cf-side] [data-grow]').forEach(fit);
  }
  function fit(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }

  /* Removing with an exit first, then the splice, with undo. */
  function leave(el, then) {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduce) { then(); return; }
    el.classList.add('is-leaving');
    setTimeout(then, 150);
  }
  function undoable(o, msg, before) {
    if (!HOST) return;
    HOST.toast(msg, 'Undo', null, () => {
      o.x.form = before;
      touch(o);
      paint(o, null);
    });
  }
  const clone = (v) => JSON.parse(JSON.stringify(v));

  /* ── Scroll spy for the index ── */
  function scroller() {
    const r = root();
    let p = r && r.parentElement;
    while (p && p !== document.body) {
      const s = getComputedStyle(p).overflowY;
      if ((s === 'auto' || s === 'scroll') && p.scrollHeight > p.clientHeight) return p;
      p = p.parentElement;
    }
    return null;
  }
  function spy() {
    const r = root(), sc = scroller();
    if (!r) return;
    const line = (sc ? sc.getBoundingClientRect().top : 0) + 160;
    let cur = null;
    r.querySelectorAll('.cf-sec').forEach((s) => { if (s.getBoundingClientRect().top <= line) cur = s.getAttribute('data-cf-sec'); });
    if (!cur) { const first = r.querySelector('.cf-sec'); cur = first && first.getAttribute('data-cf-sec'); }
    r.querySelectorAll('[data-cf-go]').forEach((a) => {
      const on = a.getAttribute('data-cf-go') === cur;
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  /* ── Changes ── */
  function setHours(o, key, fn) {
    const rows = clone(o.x.form[key] || []);
    fn(rows);
    rows.sort((a, b) => DAY_I[a.day] - DAY_I[b.day]);
    if (rows.length) o.x.form[key] = rows; else delete o.x.form[key];
  }
  function addItem(o, key, text, viaKey) {
    const parts = String(text).split(/\r?\n/).map((s) => s.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean);
    if (!parts.length) return false;
    const list = (getV(o.x.form, key) || []).slice().concat(parts);
    setV(o.x.form, key, list);
    touch(o);
    /* Typed with Enter: no motion (it happens a hundred times a list).
       Pasted or clicked: the new line enters. */
    paint(o, '[data-cf-li-add="' + key + '"]', viaKey ? {} : { enter: key + '|' + (list.length - 1) });
    return true;
  }

  function onClick(e) {
    const t = e.target;
    /* A time picked in the Console's popover, which sits outside the form. */
    const go = t.closest && t.closest('[data-cf-tgo]');
    if (go) {
      const o = docOf(), v = go.getAttribute('data-cf-tgo'), i = v.lastIndexOf('|');
      if (window.AIMY_SETTINGS && window.AIMY_SETTINGS.closePop) window.AIMY_SETTINGS.closePop();
      if (o) setTime(o, v.slice(0, i), v.slice(i + 1));
      return;
    }
    const cal = t.closest && t.closest('[data-cf-calnav], [data-cf-calday]');
    if (cal) {
      const o = docOf();
      if (!o) return;
      if (cal.hasAttribute('data-cf-calnav')) {
        const raw = cal.getAttribute('data-cf-calnav'), j = raw.lastIndexOf('|');
        const key = raw.slice(0, j), v = CALV[key];
        CALV[key] = new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth() + +raw.slice(j + 1), 1));
        const pop = document.getElementById('setPop');
        if (pop) pop.innerHTML = calHTML(o, key);
        return;
      }
      const v = cal.getAttribute('data-cf-calday'), i = v.lastIndexOf('|');
      const key = v.slice(0, i), p = key.split('|');
      const rows = clone(getV(o.x.form, p[0]) || []);
      if (!rows[+p[1]]) rows[+p[1]] = {};
      rows[+p[1]][p[2]] = v.slice(i + 1);
      setV(o.x.form, p[0], rows);
      if (window.AIMY_SETTINGS && window.AIMY_SETTINGS.closePop) window.AIMY_SETTINGS.closePop();
      touch(o);
      paint(o, '[data-cf-date="' + key + '"]');
      return;
    }
    if (!inForm(t)) { closeTz(); return; }
    const o = docOf();
    if (!o) return;
    const form = o.x.form;
    let el;
    /* A stop on the path, Next and Previous: on a desk the editor beside
       the path changes; on a phone the stop opens as its own view. */
    /* A node (anywhere on its card), Next and Previous: wide, the rail
       becomes its editor; narrow, it opens as its own view. */
    if ((el = t.closest('[data-cf-stop]')) || (!t.closest('button, a, input, textarea') && (el = t.closest('[data-cf-nd]')))) {
      const to = el.getAttribute('data-cf-stop') || el.getAttribute('data-cf-nd');
      const phone = narrowNow();
      const from = phone ? PHONE[o.id] : PICK[o.id];
      if (to === from && !phone) return;
      if (phone) PHONE[o.id] = to; else PICK[o.id] = to;
      const back = from && PATH.indexOf(to) < PATH.indexOf(from);
      paint(o, null, phone ? { view: back ? 'back' : 'fwd' } : { panel: true });
      const sc = scope(), port = scroller();
      const target = phone ? sc.querySelector('.cf-view') : null;
      if (port && target) {
        const t0 = target.getBoundingClientRect().top - port.getBoundingClientRect().top;
        if (t0 < 0 || t0 > port.clientHeight * 0.6) port.scrollTop += t0 - 16;
      }
      const h = sc.querySelector(phone ? '.cf-view .cf-panel-head h2' : '.cf-side .cf-panel-head h2');
      if (h) h.focus({ preventScroll: true });
      return;
    }
    if ((el = t.closest('[data-cf-sideclose]'))) {
      const from = PICK[o.id];
      PICK[o.id] = null;
      paint(o, null);
      const btn = from && scope().querySelector('.cf-nd-btn[data-cf-stop="' + from + '"]');
      if (btn) btn.focus({ preventScroll: true });
      return;
    }
    if ((el = t.closest('[data-cf-night]'))) {
      const from = PHONE[o.id];
      PHONE[o.id] = null;
      paint(o, null, { view: 'back' });
      const btn = from && scope().querySelector('.cf-nd-btn[data-cf-stop="' + from + '"]');
      if (btn) { btn.focus({ preventScroll: true }); btn.scrollIntoView({ block: 'center' }); }
      return;
    }
    if ((el = t.closest('[data-cf-go]'))) {
      e.preventDefault();
      const s = document.getElementById(idOf('sec-' + el.getAttribute('data-cf-go')));
      if (s) {
        s.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        const first = s.querySelector('input, textarea, button[role="radio"][tabindex="0"], button');
        if (first) setTimeout(() => first.focus({ preventScroll: true }), 350);
      }
      return;
    }
    if ((el = t.closest('[data-cf-pick]'))) {
      const v = el.getAttribute('data-cf-pick'), i = v.indexOf('|');
      const key = v.slice(0, i), val = JSON.parse(v.slice(i + 1));
      const f = fieldOf(form, key);
      const before = getV(form, key);
      setV(form, key, val);
      touch(o);
      /* A choice that brings a field in lets it enter. */
      const kid = SCHEMA.reduce((a, s) => a.concat(s.fields), []).filter((k) => k.when && k.when[0] === key && k.when[1] === val)[0];
      paint(o, '[data-cf-pick="' + CSS.escape(v) + '"]', kid && before !== val ? { enter: kid.key } : {});
      return;
    }
    if ((el = t.closest('[data-cf-mpick]'))) {
      const v = el.getAttribute('data-cf-mpick'), i = v.indexOf('|');
      const key = v.slice(0, i), val = v.slice(i + 1);
      const cur = (getV(form, key) || []).slice();
      const at = cur.indexOf(val);
      if (at > -1) cur.splice(at, 1); else cur.push(val);
      setV(form, key, cur);
      touch(o);
      paint(o);
      return;
    }
    if ((el = t.closest('[data-cf-cellpick]'))) {
      const p = el.getAttribute('data-cf-cellpick').split('|');
      const rows = clone(getV(form, p[0]) || []);
      if (rows[+p[1]]) rows[+p[1]][p[2]] = p[3];
      setV(form, p[0], rows);
      touch(o);
      paint(o);
      return;
    }
    if ((el = t.closest('[data-cf-open]'))) {
      const key = el.getAttribute('data-cf-open');
      opened(o)[key] = true;
      paint(o, null, { enter: key });
      const fld = scope().querySelector('[data-cf-field="' + key + '"]');
      const inp = fld && fld.querySelector('input, textarea, [role="radio"][tabindex="0"], button.cf-add');
      if (inp) inp.focus({ preventScroll: false });
      return;
    }
    if ((el = t.closest('[data-cf-close]'))) {
      const key = el.getAttribute('data-cf-close');
      const f = FIELD[key];
      const before = clone(form);
      const had = filled(f, form[key]);
      leave(el.closest('.cf-field'), () => {
        delete form[key];
        delete opened(o)[key];
        touch(o);
        paint(o, null);
        if (had) undoable(o, f.def !== undefined ? f.label + ' is back to ' + (f.kind === 'choice' ? optLabel(f, f.def) : f.def + ' ' + f.unit) : f.label + ' removed', before);
      });
      return;
    }
    if ((el = t.closest('[data-cf-step]'))) {
      const p = el.getAttribute('data-cf-step').split('|');
      const f = fieldOf(form, p[0]);
      const cur = getV(form, p[0]);
      let n = (cur === undefined || cur === null || cur === '' ? (f.def !== undefined ? f.def : (f.min || 0)) : +cur) + (+p[1]) * (f.step || 1);
      if (f.min !== undefined) n = Math.max(f.min, n);
      if (f.max !== undefined) n = Math.min(f.max, n);
      setV(form, p[0], n);
      touch(o);
      paint(o, '[data-cf-num="' + p[0] + '"]');
      return;
    }
    if ((el = t.closest('[data-cf-li-del]'))) {
      const v = el.getAttribute('data-cf-li-del'), i = v.lastIndexOf('|');
      const key = v.slice(0, i), at = +v.slice(i + 1);
      const before = clone(form);
      leave(el.closest('.cf-li'), () => {
        const list = (getV(form, key) || []).slice();
        const gone = list.splice(at, 1)[0];
        setV(form, key, list);
        touch(o);
        paint(o, '[data-cf-li-add="' + key + '"]');
        if (String(gone || '').trim()) undoable(o, 'Removed \u201c' + String(gone).slice(0, 48) + (String(gone).length > 48 ? '\u2026' : '') + '\u201d', before);
      });
      return;
    }
    if ((el = t.closest('[data-cf-row-add]'))) {
      const key = el.getAttribute('data-cf-row-add');
      const rows = (getV(form, key) || []).slice();
      rows.push({});
      setV(form, key, rows);
      touch(o);
      paint(o, '[data-cf-row="' + key + '|' + (rows.length - 1) + '"] .cf-cell', { enter: key + '|' + (rows.length - 1) });
      const first = scope().querySelector('[data-cf-row="' + CSS.escape(key + '|' + (rows.length - 1)) + '"] .cf-cell, [data-cf-row="' + CSS.escape(key + '|' + (rows.length - 1)) + '"] .cf-seg-btn');
      if (first) first.focus();
      return;
    }
    if ((el = t.closest('[data-cf-row-del]'))) {
      const v = el.getAttribute('data-cf-row-del'), i = v.lastIndexOf('|');
      const key = v.slice(0, i), at = +v.slice(i + 1);
      const before = clone(form);
      const row = (getV(form, key) || [])[at] || {};
      const had = Object.keys(row).some((k) => String(row[k] || '').trim());
      leave(el.closest('.cf-tr'), () => {
        const rows = (getV(form, key) || []).slice();
        rows.splice(at, 1);
        setV(form, key, rows.length ? rows : undefined);
        if (/^c:/.test(key)) setV(form, key, rows);
        touch(o);
        paint(o, '[data-cf-row-add="' + key + '"]');
        if (had) undoable(o, 'Row removed', before);
      });
      return;
    }
    if ((el = t.closest('[data-cf-row-up]'))) {
      const v = el.getAttribute('data-cf-row-up'), i = v.lastIndexOf('|');
      const key = v.slice(0, i), at = +v.slice(i + 1);
      const rows = (getV(form, key) || []).slice();
      const r = rows.splice(at, 1)[0];
      rows.splice(at - 1, 0, r);
      setV(form, key, rows);
      touch(o);
      paint(o, at - 1 > 0 ? '[data-cf-row-up="' + key + '|' + (at - 1) + '"]' : '[data-cf-row-del="' + key + '|0"]');
      return;
    }
    if ((el = t.closest('[data-cf-day]'))) {
      const p = el.getAttribute('data-cf-day').split('|');
      const key = p[0], day = p[1];
      const rows = form[key] || [];
      const on = rows.some((r) => r.day === day);
      /* A day turned on takes the hours of the nearest working day before it,
         or nine to five when there is none. */
      const near = rows.slice().sort((a, b) => DAY_I[b.day] - DAY_I[a.day]).filter((r) => DAY_I[r.day] < DAY_I[day])[0] || rows[0];
      setHours(o, key, (rs) => {
        if (on) rs.splice(rs.findIndex((r) => r.day === day), 1);
        else rs.push({ day, start: near ? near.start : '09:00', end: near ? near.end : '17:00' });
      });
      touch(o);
      paint(o, '[data-cf-day="' + key + '|' + day + '"]');
      return;
    }
    if ((el = t.closest('[data-cf-copy]'))) {
      const key = el.getAttribute('data-cf-copy');
      const before = clone(form);
      const mon = (form[key] || []).filter((r) => r.day === 'mon')[0];
      if (!mon) return;
      setHours(o, key, (rs) => {
        ['tue', 'wed', 'thu', 'fri'].forEach((d) => {
          const r = rs.filter((x) => x.day === d)[0];
          if (r) { r.start = mon.start; r.end = mon.end; } else rs.push({ day: d, start: mon.start, end: mon.end });
        });
      });
      touch(o);
      paint(o, '[data-cf-copy="' + key + '"]');
      undoable(o, 'Tuesday to Friday now run ' + say12(mon.start) + ' to ' + say12(mon.end), before);
      return;
    }
    if ((el = t.closest('[data-cf-tchip]'))) { tchipMenu(el); return; }
    if ((el = t.closest('[data-cf-date]'))) { calOpen(el); return; }
    if ((el = t.closest('[data-cf-week]'))) {
      const key = el.getAttribute('data-cf-week');
      form[key] = ['mon', 'tue', 'wed', 'thu', 'fri'].map((d) => ({ day: d, start: '09:00', end: '17:00' }));
      touch(o);
      paint(o, '[data-cf-tchip="' + key + '|mon|start"]');
      return;
    }
    if ((el = t.closest('[data-cf-cadd]'))) {
      const kind = el.getAttribute('data-cf-cadd');
      const id = 'f' + Date.now().toString(36);
      const c = { id, kind, name: '' };
      if (kind === 'list' || kind === 'multi') c.value = [];
      if (kind === 'table') { c.columns = ['', '']; c.value = []; }
      if (kind === 'choice' || kind === 'multi') c.options = [];
      customs(form).push(c);
      touch(o);
      paint(o, '[data-cf-cname="' + id + '"]', { enter: 'c:' + id });
      return;
    }
    if ((el = t.closest('[data-cf-cdel]'))) {
      const id = el.getAttribute('data-cf-cdel');
      const before = clone(form);
      const c = custom(form, id);
      leave(el.closest('.cf-field'), () => {
        form._custom = customs(form).filter((x) => x.id !== id);
        if (!form._custom.length) delete form._custom;
        touch(o);
        paint(o, null);
        undoable(o, (c && c.name ? '\u201c' + c.name + '\u201d' : 'The field') + ' removed', before);
      });
      return;
    }
    if ((el = t.closest('[data-cf-tz-opt]'))) {
      pickTz(o, el);
      return;
    }
  }

  function onInput(e) {
    const t = e.target;
    if (!inForm(t)) return;
    const o = docOf();
    if (!o) return;
    const form = o.x.form;
    let v;
    if (t.hasAttribute('data-grow')) fit(t);
    if ((v = t.getAttribute('data-cf-text'))) { setV(form, v, t.value.trim() ? t.value : undefined); touch(o); meta(o); return; }
    if ((v = t.getAttribute('data-cf-item'))) {
      const i = v.lastIndexOf('|'), key = v.slice(0, i);
      /* A line pasted with breaks in it is several items. */
      if (/\n/.test(t.value)) {
        const list = (getV(form, key) || []).slice();
        const parts = t.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        list.splice(+v.slice(i + 1), 1, ...parts);
        setV(form, key, list);
        touch(o);
        paint(o, '[data-cf-li-add="' + key + '"]');
        return;
      }
      const list = (getV(form, key) || []).slice();
      list[+v.slice(i + 1)] = t.value;
      setV(form, key, list);
      touch(o); meta(o); return;
    }
    if (t.hasAttribute('data-phone')) {
      const bad = t.value.trim() && !PHONE_OK.test(t.value.trim());
      t.classList.toggle('error', !!bad);
      if (bad) t.setAttribute('aria-invalid', 'true'); else t.removeAttribute('aria-invalid');
      let msg = t.parentElement.querySelector('.cf-phone-err');
      if (bad && !msg) t.insertAdjacentHTML('afterend', '<p class="field-error cf-phone-err">A phone number only, like +44 20 7946 0101 or (514) 555-0137 ext. 6037.</p>');
      if (!bad && msg) msg.remove();
    }
    if ((v = t.getAttribute('data-cf-cell'))) {
      const p = v.split('|');
      const rows = clone(getV(form, p[0]) || []);
      if (!rows[+p[1]]) rows[+p[1]] = {};
      rows[+p[1]][p[2]] = t.value;
      setV(form, p[0], rows);
      touch(o); meta(o); return;
    }
    if ((v = t.getAttribute('data-cf-cname'))) {
      const c = custom(form, v);
      if (c) { c.name = t.value; touch(o); meta(o); }
      return;
    }
    if ((v = t.getAttribute('data-cf-num'))) {
      const s = t.value.replace(/[^\d]/g, '');
      if (s !== t.value) t.value = s;
      t.style.setProperty('--n', Math.max(1, s.length));
      setV(form, v, s === '' ? undefined : +s);
      touch(o); meta(o);
      return;
    }
    if ((v = t.getAttribute('data-cf-tz'))) {
      setV(form, v, t.value.trim() ? t.value.trim() : undefined);
      touch(o); meta(o);
      openTz(t);
      return;
    }
  }

  /* The suggestions under the timezone field: typing is the way in, the list
     only finishes the word. */
  let tzIdx = -1;
  function openTz(input) {
    const list = document.getElementById(input.getAttribute('aria-controls'));
    if (!list) return;
    const m = zoneMatches(input.value);
    tzIdx = -1;
    if (!m.length || (m.length === 1 && m[0] === input.value)) { list.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    list.innerHTML = m.map((z, i) => `<button class="cf-tz-opt" type="button" role="option" id="${list.id}-${i}" aria-selected="false" tabindex="-1" data-cf-tz-opt="${esc(z)}">
        <span>${esc(zoneCity(z))}</span><span class="cf-tz-full">${esc(z)}</span><span class="cf-tz-now">${esc(zoneNow(z).replace(/^\w+ /, ''))}</span></button>`).join('');
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  function closeTz() {
    document.querySelectorAll('[data-cf-root] .cf-tz-list, [data-cf-side] .cf-tz-list').forEach((l) => { l.hidden = true; });
    document.querySelectorAll('[data-cf-tz]').forEach((i) => { i.setAttribute('aria-expanded', 'false'); i.removeAttribute('aria-activedescendant'); });
  }
  function pickTz(o, opt) {
    const z = opt.getAttribute('data-cf-tz-opt');
    const input = opt.closest('.cf-tz').querySelector('[data-cf-tz]');
    setV(o.x.form, input.getAttribute('data-cf-tz'), z);
    touch(o);
    paint(o, '[data-cf-tz="' + input.getAttribute('data-cf-tz') + '"]');
  }

  function onKey(e) {
    const t = e.target;
    if (!inForm(t)) return;
    const o = docOf();
    if (!o) return;
    const form = o.x.form;
    let v;
    /* Nothing here should reach the page's own shortcuts. */
    if (/^(INPUT|TEXTAREA)$/.test(t.tagName)) e.stopPropagation();
    if ((v = t.getAttribute('data-cf-li-add'))) {
      /* Emptied before the repaint: the field the repaint removes still
         blurs, and a blur with text in it adds that text again. */
      if (e.key === 'Enter') { e.preventDefault(); const text = t.value; t.value = ''; addItem(o, v, text, true); return; }
      return;
    }
    if ((v = t.getAttribute('data-cf-item'))) {
      const i = v.lastIndexOf('|'), key = v.slice(0, i), at = +v.slice(i + 1);
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const add = scope().querySelector('[data-cf-li-add="' + CSS.escape(key) + '"]'); if (add) add.focus(); return; }
      if (e.key === 'Backspace' && t.value === '') {
        e.preventDefault();
        const list = (getV(form, key) || []).slice();
        list.splice(at, 1);
        setV(form, key, list);
        touch(o);
        paint(o, at > 0 ? '[data-cf-item="' + key + '|' + (at - 1) + '"]' : '[data-cf-li-add="' + key + '"]');
        return;
      }
      return;
    }
    if ((v = t.getAttribute('data-cf-tchip'))) {
      const step = { ArrowUp: 30, ArrowRight: 30, ArrowDown: -30, ArrowLeft: -30 }[e.key];
      if (!step) return;
      e.preventDefault();
      const p = v.split('|');
      const r = (o.x.form[p[0]] || []).filter((x) => x.day === p[1])[0];
      const n = r ? toMin(r[p[2]]) : null;
      setTime(o, v, fromMin((n === null ? 540 : Math.round(n / 30) * 30) + step));
      return;
    }
    if ((v = t.getAttribute('data-cf-num'))) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const b = scope().querySelector('[data-cf-step="' + CSS.escape(v + '|' + (e.key === 'ArrowUp' ? 1 : -1)) + '"]');
        if (b) b.click();
      }
      if (e.key === 'Enter') { e.preventDefault(); t.blur(); }
      return;
    }
    if ((v = t.getAttribute('data-cf-tz'))) {
      const list = document.getElementById(t.getAttribute('aria-controls'));
      const opts = list && !list.hidden ? list.querySelectorAll('[role="option"]') : [];
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && opts.length) {
        e.preventDefault();
        tzIdx = (tzIdx + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
        opts.forEach((x, i) => x.setAttribute('aria-selected', String(i === tzIdx)));
        t.setAttribute('aria-activedescendant', opts[tzIdx].id);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const pick = opts[tzIdx >= 0 ? tzIdx : 0];
        if (pick) pickTz(o, pick); else { closeTz(); paint(o); }
        return;
      }
      if (e.key === 'Escape') { if (opts.length) { e.preventDefault(); closeTz(); } return; }
      return;
    }
    if (t.getAttribute('role') === 'radio' && /^Arrow/.test(e.key)) {
      const g = t.closest('[role="radiogroup"]');
      const rs = Array.prototype.slice.call(g.querySelectorAll('[role="radio"]'));
      const i = rs.indexOf(t) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
      const n = rs[(i + rs.length) % rs.length];
      e.preventDefault();
      n.click();
      return;
    }
    if (t.hasAttribute('data-cf-text') && t.tagName === 'INPUT' && e.key === 'Enter') { e.preventDefault(); t.blur(); }
    if (t.hasAttribute('data-oneline') && e.key === 'Enter') { e.preventDefault(); }
  }

  function onFocusOut(e) {
    const t = e.target;
    /* A field this form's own repaint removed is not being left. */
    if (PAINTING || !t.isConnected) return;
    if (!inForm(t)) return;
    const o = docOf();
    if (!o) return;
    const next = e.relatedTarget;
    /* Leaving a field tidies what was typed: the times read as times, a
       number fits its range, the timezone list closes. */
    if (t.hasAttribute('data-cf-num')) {
      const key = t.getAttribute('data-cf-num'), f = fieldOf(o.x.form, key);
      let n = getV(o.x.form, key);
      if (n !== undefined) {
        if (f.min !== undefined && n < f.min) n = f.min;
        if (f.max !== undefined && n > f.max) n = f.max;
        setV(o.x.form, key, n);
      }
      later(() => paint(o, next && next.isConnected ? focusKey(next) : undefined));
      return;
    }
    if (t.hasAttribute('data-cf-tz')) {
      if (next && next.closest && next.closest('.cf-tz')) return;
      later(() => { closeTz(); paint(o, next && next.isConnected && inForm(next) ? focusKey(next) : undefined); });
      return;
    }
    if (t.hasAttribute('data-cf-li-add') && t.isConnected && t.value.trim()) {
      const key = t.getAttribute('data-cf-li-add');
      const text = t.value;
      t.value = '';
      later(() => { const kept = next && next.isConnected ? focusKey(next) : null; addItem(o, key, text, false); const el = kept && root() && scope().querySelector(kept); if (el) el.focus(); });
    }
  }

  function onPaste(e) {
    const t = e.target;
    if (!t.closest || !t.hasAttribute || !t.hasAttribute('data-cf-li-add')) return;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!/\n/.test(text)) return;
    e.preventDefault();
    const o = docOf();
    const was = t.value;
    t.value = '';
    if (o) addItem(o, t.getAttribute('data-cf-li-add'), was + '\n' + text, false);
  }

  /* A field that tidies itself on blur repaints the form. Pressed with the
     pointer, the button that took the focus would be replaced between its
     press and its click, and the click would be lost. So while a press is
     down in the form, the repaint waits for the click to land first. */
  let PDOWN = false;
  let PENDING = [];
  function later(fn) { if (PDOWN) PENDING.push(fn); else setTimeout(fn, 0); }
  function flush() { const q = PENDING; PENDING = []; q.forEach((fn) => fn()); }

  let bound = false;
  function attach(host) {
    HOST = host;
    if (bound) return;
    bound = true;
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('paste', onPaste);
    const bar = document.getElementById('aimyFloatWrap');
    if (bar && window.ResizeObserver) {
      const ro = new ResizeObserver(() => fitSide());
      ro.observe(bar);
      const peek = document.getElementById('aimyPeek');
      if (peek) ro.observe(peek);
    }
    /* The answer card shows and hides by class on the wrapper. */
    if (bar && window.MutationObserver) new MutationObserver(() => setTimeout(fitSide, 260)).observe(bar, { attributes: true, attributeFilter: ['class'] });
    /* And when the page itself repaints on that same press (the document's
       title commits on blur by redrawing everything), the control pressed is
       found again by its key and given the press it lost. */
    let downEl = null, downKey = null, downHit = false;
    /* A press whose click did land needs nothing more. */
    document.addEventListener('click', (e) => { if (downEl && downEl.contains(e.target)) downHit = true; }, true);
    document.addEventListener('pointerdown', (e) => {
      if (!inForm(e.target)) return;
      PDOWN = true;
      downHit = false;
      downEl = e.target.closest('button, input, textarea, [data-cf-tile]');
      downKey = downEl ? focusKey(downEl) || (downEl.hasAttribute('data-cf-tile') ? '[data-cf-tile="' + downEl.getAttribute('data-cf-tile') + '"]' : null) : null;
    }, true);
    const up = () => {
      if (!PDOWN) return;
      PDOWN = false;
      const was = downEl, key = downKey;
      setTimeout(() => {
        const hit = downHit;
        downEl = downKey = null;
        downHit = false;
        if (!hit && was && !was.isConnected && key && root()) {
          const el = scope().querySelector(key);
          if (el) { if (/^(INPUT|TEXTAREA)$/.test(el.tagName)) el.focus(); else el.click(); }
        }
        flush();
      }, 0);
    };
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
    window.addEventListener('resize', () => {
      if (!root()) return;
      if (narrowNow() !== NARROW && CUR) paint(CUR, undefined); else { grow(); fitSide(); }
    });
  }
  /* After knowledge.js has put the form on the page. */
  function painted() {
    const r = root();
    if (!r) return;
    /* The first paint guessed the width from the window; correct it once. */
    if (narrowNow() !== NARROW && CUR) { paint(CUR, undefined); return; }
    grow(scope());
    fitSide();
  }

  window.AIMY_CFGFORM = { SCHEMA, render, attach, painted, left, parseTime, teamMinutes, say12 };
})();
