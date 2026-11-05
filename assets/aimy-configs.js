/* ══ AiMY after-hours configuration files ══════════════════════════════════
   One file per product tells AiMY how to handle its tickets after hours
   (Confluence: "AiMY After-Hours Support Automation - Project Brief", AC2,
   Feature 0, and AIMY-2974). It is a Knowledge document of the type
   "Configuration File", written in YAML, JSON or XML, and the Console's 24/7
   pages read it: Schedule takes the coverage window and the manager from it,
   Configuration shows it, checks it and keeps its versions.

   Loaded before knowledge.js and settings.js, by both index.html and
   console.html, so the library and the Console read the same files and the
   same rules about what a valid one is. Nothing here touches the DOM except
   XML parsing, which borrows the browser's parser. */
(function () {
  'use strict';

  /* The four extensions AIMY-2974 accepts. `.yml` and `.yaml` are one
     format with two spellings. */
  const EXT = ['.yaml', '.yml', '.json', '.xml'];
  const FMT_OF = { yaml: 'yaml', yml: 'yaml', json: 'json', xml: 'xml' };
  const FMT_LABEL = { yaml: 'YAML', json: 'JSON', xml: 'XML' };
  const fmtOf = (name) => FMT_OF[String(name || '').split('.').pop().toLowerCase()] || '';

  const TZ = ['EST', 'AEST', 'GMT'];
  const WEEKENDS = ['all_day', 'nights', 'none'];

  /* ── What a valid file holds ──
     Path, kind, and whether it may be left out. Order is the order a person
     reads the file in, so the first problem reported is the first one met. */
  const FIELDS = [
    ['product_id', 'string'],
    ['name', 'string', true],
    ['crm_source', 'string'],
    ['coverage_windows', 'object'],
    ['coverage_windows.timezone', 'tz'],
    ['coverage_windows.weeknights', 'object'],
    ['coverage_windows.weeknights.from', 'time'],
    ['coverage_windows.weeknights.to', 'time'],
    ['coverage_windows.weekends', 'weekends'],
    ['urgency_criteria', 'object'],
    ['urgency_criteria.keywords', 'list'],
    ['urgency_criteria.customer_tiers', 'list', true],
    ['urgency_criteria.impact', 'list', true],
    ['non_urgent_criteria', 'object'],
    ['non_urgent_criteria.keywords', 'list'],
    ['oncall_manager', 'object'],
    ['oncall_manager.name', 'string'],
    ['oncall_manager.phone', 'string'],
    ['pre_window_minutes', 'number'],
    ['confirmation_wait_minutes', 'number']
  ];

  /* ── Writing a file from its data ── */
  const needsQuotes = (s) => s === '' || /^[\s-]|[:#\[\]{},&*!|>'"%@`]|\s$/.test(s) || /^(true|false|null|-?\d+(\.\d+)?)$/i.test(s);
  const yScalar = (v) => typeof v === 'string' ? (needsQuotes(v) ? '"' + v.replace(/"/g, '\\"') + '"' : v) : String(v);
  function toYaml(o, ind) {
    ind = ind || '';
    return Object.keys(o).map((k) => {
      const v = o[k];
      if (Array.isArray(v)) return ind + k + ':\n' + v.map((x) => ind + '  - ' + yScalar(x)).join('\n');
      if (v && typeof v === 'object') return ind + k + ':\n' + toYaml(v, ind + '  ');
      return ind + k + ': ' + yScalar(v);
    }).join('\n');
  }
  const xEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function toXml(o, ind) {
    ind = ind || '  ';
    return Object.keys(o).map((k) => {
      const v = o[k];
      if (Array.isArray(v)) return ind + '<' + k + '>\n' + v.map((x) => ind + '  <item>' + xEsc(x) + '</item>').join('\n') + '\n' + ind + '</' + k + '>';
      if (v && typeof v === 'object') return ind + '<' + k + '>\n' + toXml(v, ind + '  ') + '\n' + ind + '</' + k + '>';
      return ind + '<' + k + '>' + xEsc(v) + '</' + k + '>';
    }).join('\n');
  }
  function write(data, fmt) {
    if (fmt === 'json') return JSON.stringify(data, null, 2) + '\n';
    if (fmt === 'xml') return '<?xml version="1.0" encoding="UTF-8"?>\n<after_hours_config>\n' + toXml(data) + '\n</after_hours_config>\n';
    return '# AiMY after-hours configuration\n' + toYaml(data) + '\n';
  }

  /* ── Reading one back ──
     A small reader for the shape these files have: maps, lists of plain
     values, and plain values. Every failure carries the line it happened
     on, because "the file is invalid" sends someone back to read all of it. */
  const fail = (line, msg) => { const e = new Error(msg); e.line = line; throw e; };
  function scalar(v, n) {
    v = v.trim();
    if (/^"/.test(v) || /^'/.test(v)) {
      const q = v[0];
      if (v.length < 2 || v[v.length - 1] !== q) fail(n, 'A quote is opened and never closed');
      return v.slice(1, -1).replace(/\\"/g, '"');
    }
    if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean).map((x) => scalar(x, n));
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    if (v === 'true' || v === 'false') return v === 'true';
    return v;
  }
  function readYaml(text) {
    const toks = [];
    text.replace(/\r/g, '').split('\n').forEach((raw, i) => {
      if (/^\s*(#.*)?$/.test(raw)) return;
      const lead = raw.match(/^[ \t]*/)[0];
      if (lead.indexOf('\t') > -1) fail(i + 1, 'This line is indented with a tab. Use spaces');
      toks.push({ ind: lead.length, s: raw.trim().replace(/\s+#.*$/, ''), n: i + 1 });
    });
    let p = 0;
    function block(ind) {
      const list = /^-(\s|$)/.test(toks[p].s);
      const out = list ? [] : {};
      while (p < toks.length && toks[p].ind === ind) {
        const t = toks[p];
        if (list) {
          if (!/^-(\s|$)/.test(t.s)) fail(t.n, 'A list item should start with “- ”');
          out.push(scalar(t.s.slice(1), t.n)); p++; continue;
        }
        const m = t.s.match(/^([A-Za-z_][\w-]*)\s*:(?:\s+(.*))?$/);
        if (!m) fail(t.n, /^-/.test(t.s) ? 'A list item sits where a “name: value” line should be' : 'This line should read “name: value”');
        p++;
        if (m[2] === undefined || m[2] === '') out[m[1]] = p < toks.length && toks[p].ind > ind ? block(toks[p].ind) : null;
        else out[m[1]] = scalar(m[2], t.n);
      }
      if (p < toks.length && toks[p].ind > ind) fail(toks[p].n, 'This line is indented further than the one above it');
      return out;
    }
    if (!toks.length) fail(1, 'The file is empty');
    const data = block(toks[0].ind);
    if (p < toks.length) fail(toks[p].n, 'This line is indented less than the block it belongs to');
    return data;
  }
  function readJson(text) {
    try { return JSON.parse(text); } catch (err) {
      const m = String(err.message).match(/line (\d+)/i) || null;
      const pos = String(err.message).match(/position (\d+)/i);
      const line = m ? +m[1] : pos ? text.slice(0, +pos[1]).split('\n').length : 1;
      fail(line, 'This line is not valid JSON. Check for a missing comma or quote');
    }
  }
  function readXml(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const bad = doc.getElementsByTagName('parsererror')[0];
    if (bad) {
      const m = bad.textContent.match(/line (\d+)/i);
      fail(m ? +m[1] : 1, 'This line is not valid XML. Check that every tag is closed');
    }
    const walk = (el) => {
      const kids = Array.prototype.filter.call(el.childNodes, (c) => c.nodeType === 1);
      if (!kids.length) return scalar(el.textContent, 0);
      if (kids.every((c) => c.tagName === 'item')) return kids.map((c) => scalar(c.textContent, 0));
      const o = {};
      kids.forEach((c) => { o[c.tagName] = walk(c); });
      return o;
    };
    return walk(doc.documentElement);
  }
  function read(text, fmt) {
    return fmt === 'json' ? readJson(text) : fmt === 'xml' ? readXml(text) : readYaml(text);
  }

  /* The line a field is written on, found by its name after its parent's. */
  function lineOf(text, path) {
    const lines = text.replace(/\r/g, '').split('\n');
    let from = 0;
    let found = 1;
    path.split('.').forEach((k) => {
      const re = new RegExp('(^|[\\s"<{,])' + k.replace(/[-_]/g, '[-_]') + '(["\'>]|\\s*:)');
      for (let i = from; i < lines.length; i++) if (re.test(lines[i])) { found = i + 1; from = i + 1; return; }
    });
    return found;
  }
  const at = (o, path) => path.split('.').reduce((v, k) => (v && typeof v === 'object' ? v[k] : undefined), o);
  const isTime = (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

  /* ── Is this file usable for this product? ──
     Returns { ok, data } or { ok: false, line, msg }. `product` is the id the
     file is being put on; a file written for another product is refused,
     because AiMY would read the wrong product's rules. */
  function check(text, fmt, product) {
    if (!fmt) return { ok: false, line: 0, msg: 'Only .yaml, .yml, .json or .xml files can be a configuration file' };
    let data;
    try { data = read(text, fmt); } catch (err) { return { ok: false, line: err.line || 1, msg: err.message }; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, line: 1, msg: 'The file should hold named fields, not a list' };
    for (let i = 0; i < FIELDS.length; i++) {
      const [path, kind, optional] = FIELDS[i];
      if (/^coverage_windows\.(weeknights|weekends)/.test(path) && data.coverage_windows && data.coverage_windows.all_day === true) continue;
      const v = at(data, path), name = path.split('.').pop();
      const parent = path.indexOf('.') > -1 ? path.slice(0, path.lastIndexOf('.')) : '';
      if (v === undefined || v === null || v === '') {
        if (optional) continue;
        return { ok: false, line: parent ? lineOf(text, parent) : 1, field: path, msg: '“' + name + '” is missing' + (parent ? ' from “' + parent.split('.').pop() + '”' : '') };
      }
      const line = lineOf(text, path);
      const say = (m) => ({ ok: false, line, field: path, msg: m });
      if (kind === 'object' && (typeof v !== 'object' || Array.isArray(v))) return say('“' + name + '” should hold named fields');
      if (kind === 'list' && !Array.isArray(v)) return say('“' + name + '” should be a list');
      if (kind === 'string' && typeof v !== 'string') return say('“' + name + '” should be text');
      if (kind === 'number' && (typeof v !== 'number' || v < 0)) return say('“' + name + '” should be a number of minutes');
      if (kind === 'time' && !isTime(v)) return say('“' + name + '” should be a time like 18:00, not “' + v + '”');
      if (kind === 'tz' && TZ.indexOf(v) < 0) return say('“timezone” should be EST, AEST or GMT, not “' + v + '”');
      if (kind === 'weekends' && WEEKENDS.indexOf(v) < 0) return say('“weekends” should be all_day, nights or none, not “' + v + '”');
    }
    /* When this file applies (the GitHub Actions way, like a workflow's
       `on:`): `default`, or exactly one of days, dates or customer tiers. */
    const aw = data.applies_when;
    if (aw !== undefined && aw !== null && aw !== 'default') {
      const line = lineOf(text, 'applies_when');
      const say = (m) => ({ ok: false, line, field: 'applies_when', msg: m });
      const keys = aw && typeof aw === 'object' && !Array.isArray(aw) ? Object.keys(aw) : [];
      if (keys.length !== 1 || ['days', 'dates', 'customer_tiers'].indexOf(keys[0]) < 0) return say('“applies_when” should be default, or one of days, dates or customer_tiers');
      const list = aw[keys[0]];
      if (!Array.isArray(list) || !list.length) return say('“' + keys[0] + '” should be a list');
      if (keys[0] === 'days') { const bad = list.filter((d) => DAYS.indexOf(String(d).toLowerCase()) < 0)[0]; if (bad !== undefined) return say('“days” should be day names like saturday, not “' + bad + '”'); }
      if (keys[0] === 'dates') { const bad = list.filter((d) => !/^\d{4}-\d{2}-\d{2}$/.test(String(d)))[0]; if (bad !== undefined) return say('“dates” should be dates like 2026-12-25, not “' + bad + '”'); }
    }
    if (product && data.product_id !== product) {
      return { ok: false, line: lineOf(text, 'product_id'), field: 'product_id', msg: 'This file is for “' + data.product_id + '”, not “' + product + '”' };
    }
    return { ok: true, data };
  }

  /* ── When a file applies ── */
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const listSay = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  const dateSay = (d) => +d.slice(8) + ' ' + MON[+d.slice(5, 7) - 1];
  const awOf = (data) => (data && data.applies_when) || 'default';
  /* "Saturdays and Sundays", "26 Nov, 25 Dec and 1 Jan", "Platinum customers". */
  function appliesSay(aw) {
    if (!aw || aw === 'default') return 'Every ticket the others don’t take';
    if (aw.days) return listSay(aw.days.map((d) => String(d).charAt(0).toUpperCase() + String(d).slice(1).toLowerCase() + 's'));
    if (aw.dates) return listSay(aw.dates.map(dateSay));
    return listSay(aw.customer_tiers) + ' customers, any time';
  }
  /* Does this file set the hours for the night that starts on `iso`? Days and
     dates do; a file for certain customers applies ticket by ticket, so it
     never sets a night's hours. The default takes every night. */
  function appliesNight(aw, iso) {
    if (!aw || aw === 'default') return true;
    if (aw.days) return aw.days.map((d) => String(d).toLowerCase()).indexOf(DAYS[new Date(iso + 'T12:00:00').getDay()]) > -1;
    if (aw.dates) return aw.dates.indexOf(iso) > -1;
    return false;
  }
  /* A file's name: its own `name`, or what its condition says. */
  function nameOf(data) {
    if (data && data.name) return data.name;
    const aw = awOf(data);
    if (aw === 'default') return 'Default';
    if (aw.days) return aw.days.length === 2 && aw.days.join() === 'saturday,sunday' ? 'Weekends' : 'Set days';
    if (aw.dates) return 'Set dates';
    return listSay(aw.customer_tiers) + ' customers';
  }
  /* The most files one product may have. */
  const MAX_FILES = 4;

  /* ── Templates ──
     The GitHub Actions way: each says when to use it before what is in it,
     and downloads in any of the three formats with the product filled in. */
  const base = (over) => Object.assign({
    product_id: 'your-product-id',
    crm_source: 'Freshdesk: your after-hours queue',
    coverage_windows: { timezone: 'EST', weeknights: { from: '18:00', to: '09:00' }, weekends: 'all_day' },
    urgency_criteria: { keywords: ['outage', 'down', 'data loss', 'cannot log in'], customer_tiers: ['Gold', 'Platinum'], impact: ['all users', 'production'] },
    non_urgent_criteria: { keywords: ['how to', 'feature request', 'billing'] },
    oncall_manager: { name: 'Your manager', phone: '+1 555 0100' },
    pre_window_minutes: 15,
    confirmation_wait_minutes: 15,
    applies_when: 'default'
  }, over || {});
  const TEMPLATES = [
    { id: 'every-night', name: 'Every night and weekend',
      when: 'Use when someone must be reachable from close of business to opening every night, and all weekend.',
      data: base() },
    { id: 'weeknights', name: 'Weeknights only',
      when: 'Use when the day team covers weekends, so AiMY only takes Monday to Friday nights.',
      data: base({ coverage_windows: { timezone: 'EST', weeknights: { from: '18:00', to: '09:00' }, weekends: 'none' } }) },
    { id: 'tiered', name: 'Tiered customers only',
      when: 'Use when only Gold and Platinum customers are covered after hours. Everyone else hears back in working hours.',
      data: base({ urgency_criteria: { keywords: ['outage', 'down', 'data loss'], customer_tiers: ['Gold', 'Platinum'] },
                   non_urgent_criteria: { keywords: ['how to', 'feature request', 'billing', 'Bronze', 'Silver'] } }) },
    { id: 'outages', name: 'Outages only',
      when: 'Use when only a full outage should wake someone up. Everything else waits for the morning.',
      data: base({ urgency_criteria: { keywords: ['outage', 'service down', 'all users affected'], impact: ['all users'] },
                   non_urgent_criteria: { keywords: ['how to', 'slow', 'one user', 'feature request', 'billing'] } }) }
  ];
  const template = (id) => TEMPLATES.filter((t) => t.id === id)[0] || null;
  /* A template's data with the product filled in. */
  const fill = (t, product) => JSON.parse(JSON.stringify(Object.assign({}, t.data, product ? { product_id: product } : {})));

  /* ── The files already written ──
     One per product that has one, as Knowledge holds them: the document id,
     the file name, and every version in order, oldest first. The prototype's
     products: CXS Support Copilot, and three of Upland's four (FileBound has
     none yet, which is the state the Configuration page is for). */
  const cfg = (t, over) => Object.assign(fill(template(t)), over);
  const copilot1 = cfg('every-night', {
    product_id: 'cxs-copilot', crm_source: 'Freshdesk: CXS Support Copilot – After hours',
    coverage_windows: { timezone: 'GMT', weeknights: { from: '18:00', to: '09:00' }, weekends: 'all_day' },
    urgency_criteria: { keywords: ['outage', 'down', 'cannot log in'], customer_tiers: ['Gold', 'Platinum'], impact: ['all users', 'production'] },
    oncall_manager: { name: 'Mona Adel', phone: '+20 100 555 0142' } });
  const copilot2 = cfg('every-night', Object.assign({}, copilot1, {
    urgency_criteria: { keywords: ['outage', 'down', 'cannot log in', 'data loss'], customer_tiers: ['Gold', 'Platinum'], impact: ['all users', 'production'] } }));
  const interfax = (over) => cfg('tiered', Object.assign({
    product_id: 'interfax', crm_source: 'Freshdesk: InterFAX – After hours',
    coverage_windows: { timezone: 'EST', weeknights: { from: '18:00', to: '08:00' }, weekends: 'all_day' },
    oncall_manager: { name: 'Sherif Nabil', phone: '+1 646 555 0187' } }, over || {}));
  /* InterFAX has four files, the most a product can have: key accounts,
     holidays and weekends ahead of its default. Its default no longer takes
     weekends, because the weekend file does. */
  const ifx = (over) => interfax(Object.assign({ coverage_windows: { timezone: 'EST', weeknights: { from: '18:00', to: '08:00' }, weekends: 'none' } }, over || {}));
  const allDay = { timezone: 'EST', all_day: true };
  const FILES = {
    'cxs-copilot': [
      { doc: 'cfg-cxs-copilot', file: 'support-copilot-after-hours.yml', from: 'every-night', versions: [
        { by: 'Habeba Mourad', when: '2026-10-21', note: 'First version', data: copilot1 },
        { by: 'Habeba Mourad', when: '2026-11-02', note: 'Data loss counts as urgent', data: copilot2 } ] } ],
    interfax: [
      { doc: 'cfg-interfax-key-accounts', file: 'interfax-key-accounts.xml', from: null, versions: [
        { by: 'Mona Adel', when: '2026-11-03', note: 'First version', data: ifx({ name: 'Key accounts', coverage_windows: allDay, pre_window_minutes: 0, confirmation_wait_minutes: 10,
          urgency_criteria: { keywords: ['any ticket'], customer_tiers: ['Platinum'] }, non_urgent_criteria: { keywords: ['feature request'] },
          oncall_manager: { name: 'Mona Adel', phone: '+20 100 555 0142' }, applies_when: { customer_tiers: ['Platinum'] } }) } ] },
      { doc: 'cfg-interfax-holidays', file: 'interfax-holidays.json', from: null, versions: [
        { by: 'Habeba Mourad', when: '2026-10-30', note: 'First version', data: ifx({ name: 'Holidays', coverage_windows: allDay, pre_window_minutes: 0,
          urgency_criteria: { keywords: ['outage', 'down', 'data loss', 'cannot send'], customer_tiers: ['Silver', 'Gold', 'Platinum'] },
          applies_when: { dates: ['2026-11-26', '2026-12-25'] } }) },
        { by: 'Habeba Mourad', when: '2026-11-02', note: 'Added 1 Jan', data: ifx({ name: 'Holidays', coverage_windows: allDay, pre_window_minutes: 0,
          urgency_criteria: { keywords: ['outage', 'down', 'data loss', 'cannot send'], customer_tiers: ['Silver', 'Gold', 'Platinum'] },
          applies_when: { dates: ['2026-11-26', '2026-12-25', '2027-01-01'] } }) } ] },
      { doc: 'cfg-interfax-weekends', file: 'interfax-weekends.yaml', from: null, versions: [
        { by: 'Mahmoud Mohamed', when: '2026-10-28', note: 'First version', data: ifx({ name: 'Weekends', coverage_windows: allDay, pre_window_minutes: 0,
          oncall_manager: { name: 'Yara Sameh', phone: '+1 646 555 0142' }, applies_when: { days: ['saturday', 'sunday'] } }) } ] },
      { doc: 'cfg-interfax', file: 'interfax-after-hours.yaml', from: 'tiered', versions: [
        { by: 'Habeba Mourad', when: '2026-10-20', note: 'First version', data: ifx({ pre_window_minutes: 30 }) },
        { by: 'Mahmoud Mohamed', when: '2026-10-28', note: 'Pre-window down to 15 minutes', data: ifx() },
        { by: 'Habeba Mourad', when: '2026-11-02', note: 'Nights end at 8 am', data: ifx() } ] } ],
    accuroute: [
      { doc: 'cfg-accuroute', file: 'accuroute-after-hours.json', from: 'weeknights', versions: [
        { by: 'Habeba Mourad', when: '2026-10-24', note: 'First version', data: cfg('weeknights', {
          product_id: 'accuroute', crm_source: 'Freshdesk: AccuRoute – After hours',
          coverage_windows: { timezone: 'AEST', weeknights: { from: '17:30', to: '08:30' }, weekends: 'none' },
          oncall_manager: { name: 'Sherif Nabil', phone: '+1 646 555 0187' } }) } ] } ],
    kapost: [
      { doc: 'cfg-kapost', file: 'kapost-after-hours.xml', from: 'outages', versions: [
        { by: 'Mahmoud Mohamed', when: '2026-10-30', note: 'First version', data: cfg('outages', {
          product_id: 'kapost', crm_source: 'Freshdesk: Kapost – After hours',
          coverage_windows: { timezone: 'GMT', weeknights: { from: '19:00', to: '07:00' }, weekends: 'nights' },
          oncall_manager: { name: 'Yara Sameh', phone: '+44 20 7946 0321' } }) } ] } ]
  };
  /* Each version carries its text in the file's own format. */
  Object.keys(FILES).forEach((k) => FILES[k].forEach((f) => {
    f.fmt = fmtOf(f.file);
    f.versions.forEach((v) => { v.text = write(v.data, f.fmt); });
  }));

  window.AIMY_CFG = { EXT, FMT_LABEL, fmtOf, TZ, FIELDS, write, read, check, TEMPLATES, template, fill, FILES,
    MAX_FILES, awOf, appliesSay, appliesNight, nameOf };
})();
