/* ═══════════════════════════════════════════════════════════════════════
   knowledge.js — AiMY Knowledge v2

   One surface. The URL is the state, and the only state: every filter, the
   open document, and the view mode live in it, which is what makes the page
   drivable by an agent as well as by a person.

   The input is not a chat box. It routes on the shape of what was typed, into
   one of four classified entry modes:

     filter-like     → mutates the URL, the grid refilters      · direct
     a known title   → opens that document in place             · direct
     a question      → opens the canvas with a grounded answer  · investigate
     a write         → stages a commit surface, changes nothing · review

   Prototype scope: there is no backend. The corpus, the user, the source
   health and the timings are fixtures. Everything that would be a platform
   capability is simulated at the seam where it would really sit.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════ */
  /* ── Which shell this script is running in ──

     Read at LOAD, not in init(), because a handful of listeners below are
     armed at module scope and one of them must not arm on settings: that page
     ships a command palette of its own on the same key, and two palettes
     answering one chord is one too many. The script is at the end of <body>,
     so the attribute is already there to read.

     The rest of the module-scope listeners are guarded by an id or a class
     that settings does not have and are inert there on their own; only the
     ones that would COST something — a stolen chord, a `closest()` on every
     mouse move over a page with nothing to cite — are gated by hand. */
  const CHROME_ONLY = !!(document.body && document.body.getAttribute('data-page') === 'settings');

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ══ A TAG IS A NAME, SO IT IS CAPITALISED LIKE ONE ═══════════════════
     Sentence case is right for anything with a verb doing work — a button,
     a filter, a line of prose. A tag is none of those. "Voice Operations"
     is the NAME of a service; "voice operations" is a thing a team does.
     Both words take the capital, the way a proper noun does.

     Past two words it has stopped being a name and become a phrase, and
     title-casing a phrase turns it into a headline — so those are left
     alone. The same string can be a tag here and a filter label two
     screens away; this runs where the pill is drawn, never on the table
     it came from. */
  const tagCase = (v) => {
    const t = String(v == null ? '' : v);
    const w = t.split(' ');
    return w.length === 2
      ? w.map((x) => x.replace(/^./, (c) => c.toUpperCase())).join(' ')
      : t;
  };

  /* Icons ALWAYS carry width/height. An <svg> with a viewBox and no dimensions
     is a replaced element with no intrinsic size — inside any container that
     does not size it in CSS it expands to fill. */
  const svg = (d, w, size) =>
    `<svg viewBox="0 0 24 24" width="${size || 14}" height="${size || 14}" ` +
    `fill="none" stroke="currentColor" stroke-width="${w || 2}" ` +
    `stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  const ICO = {
    shield:   svg('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'),
    clock:    svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    slash:    svg('<circle cx="12" cy="12" r="10"/><path d="M4.929 4.929 19.07 19.071"/>'),
    question: svg('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
    arrow:    svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
    eye:      svg('<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>'),
    search:   svg('<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>'),
    folder:   svg('<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'),
    grid:     svg('<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>'),
    scales:   svg('<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/>'),
    refresh:  svg('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'),
    check:    svg('<path d="M20 6 9 17l-5-5"/>'),
    x:        svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    warn:     svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
    doc:      svg('<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'),
    ticket:   svg('<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>'),
    target:   svg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
    megaphone:svg('<path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14"/><path d="M8 6v8"/>'),
    image:    svg('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
    trophy:   svg('<path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"/><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"/><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/>'),
    book:     svg('<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>'),
    globe:    svg('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'),
    /* A screen on a stand. Distinct from `image` at 11px, which is the size the
       card's meta line draws a type glyph at — a deck and a marketing asset are
       neighbours in the taxonomy and must not be neighbours in silhouette. */
    deck:     svg('<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>'),
    flag:     svg('<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>'),
    quote:    svg('<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>'),
    left:     svg('<path d="m15 18-6-6 6-6"/>'),
    pen:      svg('<path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>'),
    plus:     svg('<path d="M5 12h14"/><path d="M12 5v14"/>'),
    tag:      svg('<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>'),
    plug:     svg('<path d="M12 22v-5"/><path d="M15 8V2"/><path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M9 8V2"/>'),
    /* The arrow leaves the box. Every other glyph here draws something that
       happens on this page; this one has to say "and then you are somewhere
       else", which is the only reason a link out needs a picture at all. */
    external: svg('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
    box:      svg('<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>'),
    /* Lucide `package` and `concierge-bell`, for the two types that name a
       thing the company SELLS. Not `box`, which is three lines above and is an
       archive crate — at 14px on a menu the two would be the same picture, and
       these two rows are the only ones whose choice has an effect outside the
       library. A sealed carton and a service bell: goods and people. */
    pkg:      svg('<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>'
              + '<path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>'),
    bell:     svg('<path d="M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z"/>'
              + '<path d="M20 16a8 8 0 1 0-16 0"/><path d="M12 4v4"/><path d="M10 4h4"/>'),
    send:     svg('<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>'),
    /* The same picture the drop layer draws, so choosing a file and dropping
       one read as the same capability rather than two. */
    upload:   svg('<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>'),

    /* ── Added for the conversation features ──
       Same factory, same stroke weights. `more` is three dots rather than a
       chevron because it opens a menu of unlike things; a chevron promises a
       list of one kind. */
    copy:     svg('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
    pin:      svg('<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>'),
    /* Lucide `archive-restore`. `box` is the archive crate and already means
       "put this away"; this is the same crate with the arrow coming back out,
       so the pair reads as one verb and its undo rather than as two boxes. */
    unarchive: svg('<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h2"/>'
              + '<path d="M20 8v11a2 2 0 0 1-2 2h-2"/><path d="m9 15 3-3 3 3"/><path d="M12 12v9"/>'),
    trash:    svg('<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    more:     svg('<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'),
    chevron:  svg('<path d="m6 9 6 6 6-6"/>'),
    thumbUp:  svg('<path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/><path d="M7 10v12"/>'),
    thumbDown:svg('<path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/><path d="M17 14V2"/>'),
    share:    svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>'),
    clip:     svg('<path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/>'),
    /* Lucide `link-2-off`. Two other variants were tried in the same 24px box
       and both lost on the same axis — what survives at 14px. `unlink` draws
       the break literally, two halves pulled apart, but it spends four of its
       six subpaths on spark lines that are the first thing to go at this size;
       `unlink-2` is one clean stroke and reads as *a link* on a row whose
       every neighbour is one. This keeps a whole link and strikes it through,
       so the meaning is carried by the single longest stroke in the glyph.
       It also rhymes: `slash` already marks the excluded effect in every
       commit surface, and this is the same diagonal. */
    unlink:   svg('<path d="M9 17H7A5 5 0 0 1 7 7"/><path d="M15 7h2a5 5 0 0 1 4 8"/>'
              + '<line x1="8" x2="12" y1="12" y2="12"/><line x1="2" x2="22" y1="2" y2="22"/>'),
    skill:    svg('<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>'),
    person:   svg('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    folder2:  svg('<path d="M20 5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2.5a1.5 1.5 0 0 1 1.2.6l.6.8a1.5 1.5 0 0 0 1.2.6z"/><path d="M3 8.268a2 2 0 0 0-1 1.738V19a2 2 0 0 0 2 2h11a2 2 0 0 0 1.732-1"/>')
  };

  const AIMY_MARK = (w, h) =>
    `<svg width="${w || 12}" height="${h || 14}" viewBox="0 0 18 20" aria-hidden="true"><use href="#aimy-logo-small"/></svg>`;

  /* ═══════════════════════════════════════════════
     STATUS — computed, never attested

     The previous model was Verified / Due / Expired: a claim that a named
     person confirmed this content on a date. Nobody does that. These are the
     company's knowledge documents, used across the ecosystem — there is no
     author submitting and no reviewer approving, so a badge that implied one
     was describing a ritual the product does not have.

     Every value below is derived from something the system already knows.
     Precedence is top to bottom: the first that applies is the one shown,
     because one badge you can trust beats five you have to reconcile.
  ═══════════════════════════════════════════════ */
  const UNUSED_DAYS = 90;

  /* ── Who answers for a document ──

     A ticket's `owner` is its ingestion marker — *Ingested · Freshdesk* — not a
     person, so the accountable party is the assignee. Everything that asks
     "who answers for this" goes through here rather than reading `o.owner`,
     which is what let the same screen disagree with itself: the byline read
     "No owner — it arrived from Freshdesk" while the rail's Owner row two inches
     below read "Owned by —", because one printed the field and the other
     looked it up in OWNERS and found nothing.

     It stays in the owner SLOT on every surface. Moving an assignee somewhere
     else per type would ask a scanner to relearn the position eight times,
     which is the one thing the library's card spec is most explicit about.

     Declared here, above `statusOf`, because `recompute()` runs during module
     evaluation and a `const` declared further down would be a TDZ crash at
     load rather than a bug you find later. */
  const responsible = (o) => (o.x && o.x.assignee) || o.owner;

  /* Symmetric, and it has to be: the rail's Owner row is a control, not a
     label. Reading the assignee while writing `o.owner` would leave the
     dropdown shadowed by the field it was not writing to — a control that
     changes nothing and says nothing about why. */
  const setResponsible = (o, v) => {
    if (o.x && 'assignee' in o.x) o.x.assignee = v; else o.owner = v;
  };

  /* `tone` maps onto the library's state pill, which carries the colour ramp.
     The class is named for trust; what it actually implements is a tone-bearing
     status pill, and reusing it beats writing a parallel one. See ../GAPS.md. */
  const STATUS = {
    superseded:  { label: 'Superseded',  ico: ICO.arrow,    tone: 'superseded', excluded: true,
                   why: 'A newer document replaced it.' },
    outdated:    { label: 'Out of date', ico: ICO.refresh,  tone: 'expired',    excluded: false,
                   why: 'The source changed after our copy.' },
    conflicting: { label: 'Conflicting', ico: ICO.warn,     tone: 'expired',    excluded: false,
                   why: 'It disagrees with another document.' },
    draft:       { label: 'Draft',       ico: ICO.pen,      tone: 'due',        excluded: false,
                   why: 'Written but not published. The owner says who wrote it.' },
    unowned:     { label: 'Unowned',     ico: ICO.question, tone: 'unverified', excluded: false,   // library tone name; see ../GAPS.md
                   why: 'Nobody is accountable for it.' },
    unused:      { label: 'Unused',      ico: ICO.clock,    tone: 'due',        excluded: false,
                   why: 'Nothing has cited or opened it in three months.' },
    /* Not "Current". That reads as a word about dates, so it sounded like a
       claim about recency — and it is not: it is the one status that means the
       computation found nothing wrong. Naming it after the absence makes the
       whole set read as a list of problems with one clear entry. */
    current:     { label: 'No issues',   ico: ICO.check,    tone: 'verified',   excluded: false,
                   why: 'Owned, in use, matching its source, and nothing disagrees with it.' }
  };

  function statusOf(o) {
    /* A person can overrule the computation, and when they have, that is the
       answer. It is marked wherever it shows: an override you cannot see is
       indistinguishable from a fact, which is the whole failure of the
       attestation model this replaced. */
    if (o.statusSet) return o.statusSet;
    const r = RELATED[o.id];
    if (r && r.supersededBy) return 'superseded';
    /* Only meaningful where there is an upstream to fall behind. */
    if (o.src !== 'upload' && o.xu < o.upd) return 'outdated';
    if (r && r.contradicts && r.contradicts.length) return 'conflicting';
    if (o.work === 'drafted') return 'draft';
    if (responsible(o) === 'Unassigned') return 'unowned';
    if (o.used > UNUSED_DAYS) return 'unused';
    return 'current';
  }

  function statusBadge(value, byHand) {
    const s = STATUS[value];
    return `<span class="trust-state ts-${s.tone}${s.excluded ? ' is-excluded' : ''}${byHand ? ' is-pinned' : ''}" ` +
           `data-status="${value}" title="${esc(byHand ? 'Set by hand. ' + byHand : s.why)}">${s.ico}${s.label}` +
           `${byHand ? '<span class="pin-dot" aria-label="set by hand"></span>' : ''}</span>`;
  }

  /* Where each status leads. The computation says what is true; this says what
     you can do about it, which is the half that was missing — a draft could
     never become live because nothing offered to publish it. */
  const STATUS_EXIT = {
    draft:       ['review',      'Publish',        'publish'],
    conflicting: ['investigate', 'Compare',        'compare'],
    outdated:    ['review',      'Re-sync',        'resync'],
    unowned:     ['review',      'Set an owner',   'assign'],
    unused:      ['review',      'Archive or keep','triage'],
    superseded:  ['direct',      'Go to successor','successor'],
    current:     ['direct',      'Open',           'open']
  };

  /* ── An AI action looks like one (README §"An AI action looks like one") ──

     Keyed on the ACTION, not the entry mode, because the two are orthogonal and
     both directions have a live counter-example: `triage` is a REVIEW that opens
     an answer, and picking a successor is an INVESTIGATE that only navigates.
     MODE_ICO cannot express that, and hanging the mark on `investigate` would
     have drawn AiMY over a patch({doc}).

     `compare` is what made it visible: the card said Compare, drew a magnifying
     glass, and opened an AiMY answer. */
  const AI_EXIT = { compare: 1, findsuccessor: 1, triage: 1, ground: 1, connect: 1 };

  /* Work state stays in the data and on the attribute, because §2.3 requires
     every surfaced item to declare what AiMY has done with it. It stopped being
     a second badge: Draft, Conflicting and Out of date now say the same things
     in the vocabulary a reader actually uses. */
  const WORK_LABEL = {
    detected: 'Flagged', recommended: 'Suggested', drafted: 'Draft',
    completed: 'Up to date', failed: 'Blocked'
  };

  const MODE_ICO = { direct: ICO.eye, investigate: ICO.search, prompt: AIMY_MARK(12, 14), review: ICO.scales };
  /* `ico` overrides the entry mode's default glyph where the mode is right but
     the picture is not — a direct action to create something is still direct,
     but an eye is the wrong thing to draw on it. */
  function entryAction(mode, label, data, ico) {
    const glyph = (ico || MODE_ICO[mode] || ICO.eye).replace('<svg', '<svg class="em-ico"');
    return `<button class="entry-action em-${mode}" data-entry-mode="${mode}" ${data || ''}>${glyph}${esc(label)}</button>`;
  }

  /* ═══════════════════════════════════════════════
     WHO IS LOOKING

     Entitlement decides what may be shown; ownership and recent activity
     decide what is shown first. Both are simulated here at the seam where the
     platform would supply them. Where the guarantee does not hold, the surface
     says so rather than implying a completeness it cannot deliver.
  ═══════════════════════════════════════════════ */
  const USER = {
    name: 'Nour Wael', initials: 'NW', role: 'Product Design',
    owner: 'N. Wael',
    collections: ['policies', 'support', 'marketing', 'sales'],   // legal is not entitled
    recent: ['article-sso', 'ticket-48120', 'story-nordwind']
  };

  /* ═══════════════════════════════════════════════
     TAXONOMY — the mind-map's axes, one vocabulary

     Everything the input can set, the chip bar can show, and the URL can
     carry, is declared once here. A filter that is not in this table cannot
     be typed, cannot be linked to, and cannot be shown — which is the point.
  ═══════════════════════════════════════════════ */
  const TYPES = {
    article:  { label: 'Article',         ico: ICO.doc },
    ticket:   { label: 'Ticket',          ico: ICO.ticket },
    icp:      { label: 'ICP',             ico: ICO.target },
    campaign: { label: 'Campaign',        ico: ICO.megaphone },
    asset:    { label: 'Marketing Asset', ico: ICO.image },
    /* The slug is the format because that is what everyone calls the thing;
       the LABEL is the kind of thing it is, because a reader scanning mixed
       results needs a noun, not a file extension. A deck is not a Marketing
       Asset with a different format: an asset is sent, a deck is PRESENTED, so
       what it carries is a slide count and where it was last shown. */
    pptx:     { label: 'Presentation',    ico: ICO.deck },
    story:    { label: 'Success Story',   ico: ICO.trophy },
    blog:     { label: 'Blog',            ico: ICO.book },
    webpage:  { label: 'Web Page',        ico: ICO.globe },
    /* ── THE TWO THAT LEAVE THE LIBRARY ──
       Every type above describes something the company HAS. These two describe
       something it SELLS, and that is not a shade of the same thing: a Product
       document is the record AiMY Sales reads its catalogue from, so writing
       one here is how a new offering comes into existence. See SELLABLE. */
    product:  { label: 'Product',         ico: ICO.pkg },
    service:  { label: 'Service',         ico: ICO.bell }
  };

  /* Which types are an offering. Named once so the settings bridge, the blank
     record and the menu note cannot disagree about it. */
  const SELLABLE = { product: 'Product', service: 'Service' };

  /* Sources carry their own operational state, because there is nowhere else
     for it to live: the mind map's Updates branch — trigger sync for a source,
     trigger sync for one document — is an action on this record, and it is
     reached by filtering to the source rather than by going to a sources page. */
  const SRC = {
    confluence: { label: 'Confluence',    health: 'ok',     note: 'Synced 14 minutes ago',
                  last: 0, cadence: 'Every 15 minutes',
                  history: [[0, 'ok', '14 objects checked, 2 updated'], [1, 'ok', '14 objects checked, none changed'], [2, 'ok', '13 objects checked, 1 added']] },
    freshdesk:  { label: 'Freshdesk',     health: 'failed', note: 'OAuth token rejected since 26 Jul',
                  last: 4, cadence: 'Every hour', code: 'AUTH_401_TOKEN_EXPIRED',
                  history: [[0, 'failed', 'OAuth token rejected'], [2, 'failed', 'OAuth token rejected'], [4, 'ok', '9 objects checked, 3 updated']] },
    teamsupport:{ label: 'TeamSupport',   health: 'warn',   note: '3 records skipped — missing owner',
                  last: 0, cadence: 'Every 6 hours',
                  history: [[0, 'warn', '12 checked, 3 skipped — no owner'], [1, 'warn', '12 checked, 3 skipped — no owner'], [3, 'ok', '11 checked, 1 added']] },
    web:        { label: 'Website crawl', health: 'failed', note: 'Crawler blocked by robots.txt since 11 Jul',
                  last: 19, cadence: 'Weekly', code: 'CRAWL_403_ROBOTS',
                  history: [[0, 'failed', 'Blocked by robots.txt'], [7, 'failed', 'Blocked by robots.txt'], [19, 'ok', '5 pages crawled, 2 changed']] },
    upload:     { label: 'Manual upload', health: 'ok',     note: 'No schedule — uploaded by hand',
                  last: 1, cadence: 'On demand',
                  history: [[1, 'ok', '1 document uploaded by N. Wael'], [5, 'ok', '1 document uploaded by N. Wael']] }
  };

  /* ═══════════════════════════════
     THE UPSTREAM, AS AN ADDRESS

     A document that came from Confluence has a page in Confluence, and the
     product knew that and would not say where. Every route out of the
     provenance block acted on OUR copy — re-sync it, reconnect the connector,
     go find a different source — and not one of them opened THEIRS. Somebody
     who wants to fix the wrong sentence has to leave, open Confluence, and
     search for a title they can only retype by hand.

     Two of the five sources already carry a real address, because a crawled
     page IS its address: `x.url` on a webpage, `x.canonical` on a blog. Those
     are used verbatim — never invented over.

     The other two upstreams are record systems, and the corpus carries no
     external id for them, because these objects were written to exercise
     filters rather than deep links. `extRef` stands in for one: derived from
     the document id, so it is stable across repaints and identical between the
     byline and the rail, and computed in ONE place so the seam where a real
     ingestion id arrives is a single function to replace.

     `upload` returns nothing on purpose. A file somebody dropped has no
     upstream to open, and a link that resolves to the uploader's own laptop is
     worse than no link. `noUpstream` already states that in words.
  ═══════════════════════════════ */
  const extRef = (o) => {
    let h = 0;
    for (let i = 0; i < o.id.length; i++) h = (h * 31 + o.id.charCodeAt(i)) % 90000;
    return 10000 + h;
  };

  /* A crawled address is stored without a scheme — "aimy.app/security" — because
     that is how it reads on the page. An href needs one. */
  const httpsify = (u) => 'https://' + String(u).replace(/^https?:\/\//, '');

  const SRC_ORIGIN = {
    /* Space key from the collection, so the link lands in the space the
       document is actually filed under rather than a generic search. */
    confluence: (o) => 'https://aimy.atlassian.net/wiki/spaces/'
      + String(o.col).toUpperCase() + '/pages/' + extRef(o),
    /* A ticket already wears its number in its id — #48120 — so this one is
       not invented at all. */
    freshdesk: (o) => 'https://aimy.freshdesk.com/a/tickets/'
      + ((String(o.id).match(/\d+/) || [extRef(o)])[0]),
    teamsupport: (o) => 'https://aimy.teamsupport.com/a/contacts/' + extRef(o),
    web: (o) => {
      const u = (o.x || {}).url || (o.x || {}).canonical;
      return u && u !== '—' ? httpsify(u) : '';
    },
    upload: () => ''
  };

  /* The one accessor. The byline, the provenance block and the webpage subject
     all ask this, so none of them can send you somewhere the others do not. */
  function originHref(o) {
    const mk = SRC_ORIGIN[o.src];
    return mk ? mk(o) || '' : '';
  }

  /* A label names where you LAND, and for four of the five sources that is the
     source's own name. `web` is the exception and reads badly as one: "Open in
     Website crawl" names the crawler that fetched the copy rather than the page
     you are about to open, and nobody has ever opened a crawl. */
  const originLabel = (o) => o.src === 'web'
    ? 'Open the live page' : 'Open in ' + SRC[o.src].label;

  /* ══ THE CAMPAIGN THIS BRIEF IS FOR ═══════════════════════════════════

     The record here is deliberately the brief and nothing else — who has been
     called and how far it has got live in AiMY Sales. A reader who wants the
     half this page does not hold should not have to go and find it by name.

     GATED ON `camp`, and that is the point. A campaign document is a document:
     somebody can write one for a push that was never set up in Sales, and most
     of the time the honest answer to "open it in Sales" is that there is
     nothing there to open. A button that always shows and sometimes lands on a
     campaign that is not this one is worse than no button. So the id is data
     on the document, and the link exists only where the id does.

     Same origin as the top bar's Sales tab. Hard-coded in one place rather than
     read from that <a>, because a link's href is markup and this is a fact
     about where the product lives. */
  const SALES_ORIGIN = 'https://aimy-sales.nour-ali.workers.dev/';
  const salesHref = (o) => o.camp ? SALES_ORIGIN + '?camp=' + encodeURIComponent(o.camp) : '';

  /* An entry-mode affordance for the fifth thing a control can do: none of the
     four modes fits, because direct completes in place, investigate and prompt
     open the canvas, and review proposes a change — and this one takes you off
     the page entirely. So it is an <a>, with a target and the arrow that leaves
     the box, and it says so before you press it. */
  function entryLink(href, label, title) {
    return `<a class="entry-action em-out" href="${esc(href)}" target="_blank"
       rel="noopener noreferrer"${title ? ` title="${esc(title)}"` : ''}>`
      + ICO.external.replace('<svg', '<svg class="em-ico"') + esc(label) + '</a>';
  }

  /* ═══════════════════════════════
     CLIENTS, AND THE PRODUCTS THEY OWN

     Three kinds of product, which is why one flat list could not hold them:

       OWNED       a client's own product line. InterFAX belongs to Upland and
                   to nobody else, so choosing another client must take it off
                   the list rather than leave it there reading zero.
       STANDALONE  owned by no client. Always offered.
       AiMY        Copilot, Sales and Voice — ours, not a client's. Always
                   offered, always last, whichever client is chosen.

     Ownership is DECLARED here because it is a fact about the world, not a
     pattern in the corpus: InterFAX would still be Upland's if no document
     mentioned it. That is the opposite of the client↔product COUNTS, which are
     derived, and the two do different jobs — ownership decides which products
     are on the list, counts say how much is behind each one.

     Upland's fourteen are the real list from the console. The other five
     clients' products are PLACEHOLDERS, named to the same convention, and
     should be replaced when the real lists arrive.

     Two oddities carried over from the console rather than tidied away: it
     lists `valsoft` twice — one client, listed once here — and it has both a
     client called Asteris and a standalone product called `asteris`. They are
     different axes, so the slug collision is harmless, but it is the kind of
     thing that is a data-entry artifact and worth confirming.
  ═══════════════════════════════ */
  const CLIENTS = {
    /* The four tenancies first, named exactly as the console's TREE names them,
       so the two halves of the product are talking about the same clients. */
    flairs: 'FlairsTech', cxs: 'CXS', upland: 'Upland', medfar: 'MedFar',
    asteris: 'Asteris', valsoft: 'Valsoft',
    connect: 'Connect', flighthub: 'FlightHub',
    nordwind: 'Nordwind GmbH', tavola: 'Tavola Retail',
    meridian: 'Meridian Health', orbit: 'Orbit BPO'
  };

  const CLIENT_PRODUCTS = {
    upland: {
      interfax: 'InterFAX Support', powersteering: 'PowerSteering Service & Support',
      secondstreet: 'Second Street Support', kapost: 'Kapost Support', psa: 'PSA Support',
      bainsight: 'BA Insight Support', filebound: 'FileBound Support',
      ingenius: 'InGenius Support', roinnovation: 'RO Innovation Support',
      ultriva: 'Ultriva Support', eclipse: 'Eclipse Support',
      rightanswers: 'RightAnswers Support', panviva: 'Panviva Support',
      qvidian: 'Qvidian Support'
    },
    /* ── placeholders below this line ── */
    asteris:   { asterisImaging: 'Imaging Support', asterisVet: 'Vet Cloud Support' },
    valsoft:   { aspire: 'Aspire Support', hark: 'Hark Support' },
    connect:   { connectDesk: 'Connect Desk Support', connectVoice: 'Connect Voice Support' },
    cxs:       { cxsQa: 'QA Support', cxsAnalytics: 'Analytics Support' },
    flighthub: { fhBooking: 'Booking Support', fhCare: 'Care Support' }
  };

  const STANDALONE_PRODUCTS = { pov: 'POV', portableSupport: 'Portable Support', asterisProduct: 'Asteris' };
  const AIMY_PRODUCTS = { copilot: 'Copilot', sales: 'Sales', voice: 'Voice' };

  /* Which client owns a product, inverted once from the map above so the two
     cannot disagree. A product missing from this is owned by nobody. */
  const CLIENT_OF_PRODUCT = {};
  Object.keys(CLIENT_PRODUCTS).forEach((c) => {
    Object.keys(CLIENT_PRODUCTS[c]).forEach((prod) => { CLIENT_OF_PRODUCT[prod] = c; });
  });

  /* Every product, flat. This is what `VALUE_LABEL`, the chips and the document
     property editor read — they need a label for a slug and do not care who
     owns it. The filter list is built from the groups instead. */
  const PRODUCTS = Object.assign({}, STANDALONE_PRODUCTS, AIMY_PRODUCTS);
  Object.keys(CLIENT_PRODUCTS).forEach((c) => Object.assign(PRODUCTS, CLIENT_PRODUCTS[c]));
  const COLLECTIONS = { policies: 'Policies', support: 'Support', sales: 'Sales', marketing: 'Marketing', legal: 'Legal' };

  /* The mind map's own axes, which the first pass collapsed into generic tags.
     ICP carries Services and Region; Success Story carries Services, Region and
     Client. Audience is the Permission branch — Clients · Admins · Stakeholders. */
  const REGIONS  = { emea: 'EMEA', apac: 'APAC', amer: 'Americas', global: 'Global' };
  const SERVICES = { qa: 'Quality assurance', voice: 'Voice operations', support: 'Support delivery',
                     cx: 'CX consulting', analytics: 'Analytics' };
  const AUDIENCE = { clients: 'Clients', admins: 'Admins', stakeholders: 'Stakeholders' };

  /* ── The tenancy, above the content ──

     `client` names the account a document is about, and it is the only axis
     there is: FlairsTech, CXS, Upland and MedFar are clients, and so are the
     accounts they in turn serve. There used to be an `org` above it — a level
     this product does not have — and it held nothing a client did not
     already say.

     THE ORGANISATION AXIS IS GONE, and it was never a second fact. `o.org` was
     derived — `ORG_OF_CLIENT[o.client] || 'flairs'` — so a document's
     "Organisation" was its client rolled up one level, and a document with no
     client read "FlairsTech" because that was the fallback rather than because
     anyone had said so.

     There is no level above a client to roll up to any more, and CLIENTS above
     already carries the tenancies themselves: Upland and CXS sit in it beside
     Nordwind and Tavola. One axis, one name, one value. */

  /* Who works with it. A SET, not a choice — a residency policy is read by the
     reviewers who check it and the managers who quote it, and a control that
     makes you pick one of those is a control that will be answered wrongly. */
  const GROUPS = { qa: 'QA Reviewers', leads: 'Support Leads',
                   am: 'Account Managers', se: 'Solution Engineers' };
  /* Seeded from the collection for the same reason region is seeded from the
     tags: the answer is already in the record, and an axis nobody fills is an
     axis that is empty everywhere and therefore says nothing. */
  const GROUPS_OF_COL = { policies: ['qa', 'leads'], support: ['leads', 'qa'],
                          sales: ['am', 'se'], marketing: ['am'], legal: ['qa'] };

  /* Collection-level governance. Ownership, retention and per-agent grounding
     are properties of a collection, so they are stated wherever a collection is
     — on the axis panel when you filter to one, and on every document that
     belongs to it. There is no matrix, because a matrix is only a way of
     looking at one of these rows at a time, and the filter does that.

     No review cadence: nothing here runs on a clock that expects a signature. */
  const AGENTS = [
    { id: 'copilot', name: 'Copilot', external: false },
    { id: 'sales',   name: 'Sales',   external: false },
    { id: 'voice',   name: 'Voice',   external: true  }
  ];
  /* `retain` is the auto-archive rule in days since last update — 0 means never.
     `purge` is how long an archived document is kept before it can be deleted
     for good; nothing is ever deleted automatically, because a rule that
     destroys content without anyone looking is the one rule you cannot undo. */
  const COLLECTION_META = {
    policies:  { owner: 'A. Mahfouz', retain: 0,    purge: 365, grounding: { copilot: true,  sales: false, voice: false } },
    support:   { owner: 'N. Wael',    retain: 730,  purge: 180, grounding: { copilot: true,  sales: false, voice: true  } },
    sales:     { owner: 'Sales Ops',  retain: 540,  purge: 365, grounding: { copilot: false, sales: true,  voice: false } },
    marketing: { owner: 'Marketing',  retain: 730,  purge: 365, grounding: { copilot: false, sales: true,  voice: false } },
    legal:     { owner: 'Legal',      retain: 0,    purge: 2555, grounding: { copilot: false, sales: false, voice: false } }
  };

  const SYNC_SCHEDULES = ['Every 15 minutes', 'Every hour', 'Every 6 hours', 'Daily', 'Weekly', 'On demand'];
  const RETAIN_OPTIONS = [[0, 'Never'], [365, 'After 1 year'], [540, 'After 18 months'], [730, 'After 2 years']];

  /* Today is fixed so the prototype's relative dates do not drift as it ages.
     Every date on an object is stored as days-before-today, which is also what
     the date filters compare against — one representation, no parsing. */
  const TODAY = new Date('2026-07-30T00:00:00Z');
  const dayMs = 86400000;
  const dateOf = (days) => new Date(TODAY.getTime() - days * dayMs);
  const fmtDate = (days) =>
    dateOf(days).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const fmtShort = (days) =>
    dateOf(days).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  /* How long ago, in one vocabulary. Lifted out of `usedLabel` when the
     ingestion date started saying it too: two copies of "27 days ago" that
     round differently is the same disagreement `citedPhrase` exists to
     prevent. `usedLabel` keeps the never-cited zero, which is an absence
     rather than a duration and belongs to that phrase alone. */
  const ageLabel = (d) => d === 0 ? 'Today'
    : d === 1 ? 'Yesterday'
    : d < 30 ? d + ' days ago'
    : Math.round(d / 30) === 1 ? '1 month ago'
    : Math.round(d / 30) + ' months ago';
  const WINDOWS = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const WINDOW_LABEL = { '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days', '1y': 'last year' };

  /* ═══════════════════════════════════════════════
     THE CORPUS

     Thirty-six objects across all eight types. Every one carries the full
     mind-map field set — tags, source, client, product, collection, both
     internal dates and both external ones — because a filter that only some
     objects can answer is a filter that lies about its result count.
  ═══════════════════════════════════════════════ */
  const CORPUS = [
    { id:'article-refund', t:'article', work:'detected', owner:'A. Mahfouz',
      title:'Refund eligibility — EU customers', col:'policies', src:'confluence', prod:'copilot', client:'',
      tags:['refunds','eu','policy'], upd:197, ing:410, xc:520, xu:197,
      sum:'30-day window from purchase, provided the item has not been activated.',
      x:{ applies:'EU storefront · all plans' } },

    { id:'article-returns-faq', t:'article', work:'detected', owner:'A. Mahfouz',
      title:'Returns FAQ — activated items', col:'support', src:'freshdesk', prod:'kapost', client:'upland',
      tags:['refunds','warranty','policy'], upd:26, ing:300, xc:480, xu:26,
      sum:'Activation ends refund eligibility. Faults are handled under warranty instead.',
      x:{ applies:'All storefronts — unscoped' } },

    { id:'article-warranty', t:'article', work:'completed', owner:'A. Mahfouz',
      title:'Warranty process — EU', col:'policies', src:'confluence', prod:'copilot', client:'',
      tags:['warranty','eu','policy'], upd:28, ing:400, xc:500, xu:28,
      sum:'What happens after activation, and where the 30-day refund window stops applying.',
      x:{ applies:'EU storefront · activated items' } },

    { id:'article-sso', t:'article', work:'completed', owner:'N. Wael',
      title:'SSO provisioning — enterprise', col:'support', src:'confluence', prod:'ingenius', client:'upland',
      tags:['sso','enterprise','provisioning'], upd:12, ing:220, xc:260, xu:12,
      sum:'SCIM provisioning, group mapping, and the two failure modes support sees most.',
      x:{ applies:'Enterprise tier' } },

    { id:'article-residency', t:'article', work:'recommended', owner:'N. Wael',
      title:'Data residency — EU and APAC', col:'policies', src:'confluence', prod:'copilot', client:'',
      tags:['gdpr','eu','apac','security'], upd:88, ing:390, xc:470, xu:88,
      sum:'Where customer data is stored per region, and what changes on an enterprise contract.',
      x:{ applies:'All tiers · EU and APAC regions' } },

    { id:'article-sla', t:'article', work:'completed', owner:'N. Wael',
      title:'Support SLA — response and resolution', col:'support', src:'confluence', prod:'copilot', client:'upland',
      tags:['sla','support'], upd:19, ing:300, xc:340, xu:19,
      sum:'First response and resolution targets per tier, and what pauses the clock.',
      x:{ applies:'All support tiers' } },

    { id:'article-billing', t:'article', work:'recommended', owner:'N. Wael',
      title:'Billing cycles and proration', col:'policies', src:'confluence', prod:'sales', client:'',
      tags:['billing','policy'], upd:74, ing:380, xc:450, xu:74,
      sum:'How mid-cycle upgrades are prorated, and when a credit is issued instead.',
      x:{ applies:'Self-serve and enterprise' } },

    { id:'article-onboarding', t:'article', work:'drafted', owner:'Unassigned',
      title:'Onboarding checklist — enterprise', col:'support', src:'upload', prod:'cxsQa', client:'cxs',
      tags:['onboarding','enterprise'], upd:6, ing:6, xc:6, xu:6,
      sum:'Drafted by AiMY from twelve resolved onboarding tickets. Nobody has published it.',
      x:{ applies:'Enterprise tier · first 30 days' } },

    { id:'article-gdpr-dsr', t:'article', work:'completed', owner:'O. Said',
      title:'Handling a GDPR data subject request', col:'policies', src:'confluence', prod:'copilot', client:'',
      tags:['gdpr','security','policy'], upd:41, ing:360, xc:430, xu:41,
      sum:'The 30-day clock, who signs off, and what support may confirm before legal review.',
      x:{ applies:'EU data subjects' } },

    { id:'article-churn-signals', t:'article', work:'completed', owner:'Sales Ops',
      title:'Churn signals — 2025 model', col:'sales', src:'confluence', prod:'sales', client:'',
      tags:['churn','sales'], upd:240, ing:600, xc:700, xu:240,
      sum:'Replaced by the 2026 churn model. Kept for reference and excluded from answers.',
      /* Not "Superseded 12 Mar 2026". That was the supersession written into a
         scope field, and once the card started reading the scope aloud it came
         out as "Applies to superseded 12 mar 2026". The status and the Replaced
         by edge already say it; this field says what it is for. */
      x:{ applies:'Sales teams — reference only' } },

    { id:'article-voice-handoff', t:'article', work:'completed', owner:'Unassigned',
      title:'Voice-to-agent handoff rules', col:'support', src:'upload', prod:'connectVoice', client:'connect',
      tags:['voice','support','sla'], upd:15, ing:15, xc:15, xu:15,
      sum:'When a voice call escalates to a human, and what context is carried across.',
      x:{ applies:'Voice deployments' } },

    { id:'ticket-48120', t:'ticket', work:'detected', owner:'Ingested · Freshdesk',
      title:'#48120 — Refund declined after activation', col:'support', src:'freshdesk', prod:'copilot', client:'nordwind',
      tags:['refunds','eu'], upd:150, ing:150, xc:158, xu:150,
      sum:'Customer activated before requesting a refund; policy exception granted on goodwill.',
      x:{ requester:'Nordwind GmbH', assignee:'A. Mahfouz', status:'Resolved', resolution:'Goodwill credit issued; policy exception logged.' } },

    { id:'ticket-51004', t:'ticket', work:'completed', owner:'Ingested · Freshdesk',
      title:'#51004 — SCIM group mapping fails silently', col:'support', src:'freshdesk', prod:'copilot', client:'meridian',
      tags:['sso','enterprise','provisioning'], upd:34, ing:34, xc:38, xu:34,
      sum:'Groups synced but roles did not apply. Root cause was a stale mapping cache.',
      x:{ requester:'Meridian Health', assignee:'N. Wael', status:'Resolved', resolution:'Cache invalidated on mapping change; fix shipped 24 Jun.' } },

    { id:'ticket-51877', t:'ticket', work:'completed', owner:'Ingested · Freshdesk',
      title:'#51877 — Data residency question, APAC contract', col:'support', src:'freshdesk', prod:'copilot', client:'tavola',
      tags:['gdpr','apac','security'], upd:9, ing:9, xc:11, xu:9,
      sum:'Asked where APAC data is stored under an enterprise contract. Answer could not be grounded.',
      x:{ requester:'Tavola Retail', assignee:'O. Said', status:'Awaiting legal', resolution:'Open — routed to the policy owner.' } },

    { id:'ticket-52310', t:'ticket', work:'completed', owner:'Ingested · Freshdesk',
      title:'#52310 — Proration disputed on mid-cycle upgrade', col:'support', src:'freshdesk', prod:'sales', client:'orbit',
      tags:['billing'], upd:4, ing:4, xc:5, xu:4,
      sum:'Customer expected a credit rather than a prorated charge.',
      x:{ requester:'Orbit BPO', assignee:'N. Wael', status:'Resolved', resolution:'Credit applied; billing article flagged as unclear.' } },

    { id:'ticket-52488', t:'ticket', work:'failed', owner:'Ingested · Freshdesk',
      title:'#52488 — Voice call dropped at handoff', col:'support', src:'freshdesk', prod:'voice', client:'orbit',
      tags:['voice','sla'], upd:2, ing:2, xc:2, xu:2,
      sum:'Ingestion incomplete — the transcript attachment could not be fetched.',
      x:{ requester:'Orbit BPO', assignee:'Unassigned', status:'Open', resolution:'Blocked — Freshdesk credentials expired mid-sync.' } },

    { id:'icp-bpo', t:'icp', work:'recommended', owner:'Sales Ops',
      title:'Mid-market BPO — EMEA', col:'sales', src:'teamsupport', prod:'sales', client:'',
      tags:['emea','sales','qa'], upd:171, ing:400, xc:430, xu:171,
      sum:'Outsourced contact-centre operators between 200 and 2,000 seats across EMEA.',
      x:{ segment:'200–2,000 seats · outsourced support', score:92,
          fit:['Multi-client contact centre operation','Existing QA function with a named owner'],
          dis:['Single-client captive centres','Under 200 seats — no QA budget'] } },

    { id:'icp-bpo-apac', t:'icp', work:'detected', owner:'Sales Ops',
      title:'Mid-market BPO — APAC', col:'sales', src:'teamsupport', prod:'sales', client:'',
      tags:['apac','sales','qa'], upd:290, ing:420, xc:450, xu:290,
      sum:'The APAC cut of the BPO segment. Nothing has cited it since February.',
      x:{ segment:'150–1,500 seats · outsourced support', score:61,
          fit:['English-language delivery','Regional QA mandate'],
          dis:['Domestic-only operators','No data residency requirement'] } },

    { id:'icp-healthcare', t:'icp', work:'completed', owner:'Sales Ops',
      title:'Regulated healthcare support — EU', col:'sales', src:'teamsupport', prod:'sales', client:'',
      tags:['eu','security','sales'], upd:23, ing:200, xc:230, xu:23,
      sum:'In-house support teams inside regulated healthcare providers.',
      x:{ segment:'Regulated providers · in-house support', score:84,
          fit:['Named compliance owner','Existing audit obligation'],
          dis:['No residency requirement','Outsourced support only'] } },

    { id:'icp-retail-voice', t:'icp', work:'drafted', owner:'Unassigned',
      title:'Retail voice operations', col:'sales', src:'upload', prod:'voice', client:'flighthub',
      tags:['voice','sales'], upd:8, ing:8, xc:8, xu:8,
      sum:'Drafted by AiMY from six won deals. No owner.',
      x:{ segment:'Retail · seasonal voice volume', score:44,
          fit:['Seasonal peaks above 3× baseline','Existing IVR'],
          dis:['Flat annual volume','No voice channel'] } },

    /* `camp` is the campaign's id in AiMY Sales, and the brief below is this
       campaign's own definition read off that page — see salesHref. The two
       have to agree: a link that opens a campaign saying something else makes
       the reader trust neither. */
    { id:'campaign-q3', t:'campaign', work:'completed', owner:'Marketing', camp:'c6',
      title:'Q3 — Quality at scale', col:'marketing', src:'teamsupport', prod:'asterisImaging', client:'asteris',
      tags:['emea','qa','campaign'], upd:32, ing:120, xc:140, xu:32,
      sum:'Pipeline generation against the mid-market BPO segment.',
      x:{ goal:'Our first software account in MENA for AiMY QA.',
          sells:'AiMY QA · Product, and Finance and back office · Service',
          persona:'Head of Quality, QA Manager, Service Delivery Manager',
          sector:'Software',
          size:'200 to 1,000 staff',
          window:'5 Jul to 22 Oct',
          pitch:'They are in MENA, and they are running this with people rather than with a system. AiMY QA is quality scored on every conversation, not on a sample. Open on what it costs them today, not on what we do.' } },

    { id:'campaign-q4-voice', t:'campaign', work:'recommended', owner:'Marketing',
      title:'Q4 — Voice that does not drop', col:'marketing', src:'teamsupport', prod:'voice', client:'',
      tags:['voice','campaign'], upd:61, ing:100, xc:110, xu:61,
      sum:'Launch campaign for the voice handoff work. Window opens before the next review date.',
      x:{ goal:'First 5 accounts for AiMY Voice in EMEA.',
          sells:'AiMY Voice · Product',
          persona:'Head of Customer Experience, Support Director',
          sector:'Retail and e-commerce',
          size:'200 to 1,000 staff',
          window:'1 Oct to 31 Dec',
          pitch:'Their handoffs drop and they know it. Open on the calls that never reached a person, not on the agent.' } },

    { id:'campaign-residency', t:'campaign', work:'detected', owner:'Marketing', camp:'c7',
      title:'EU residency — compliance push', col:'marketing', src:'teamsupport', prod:'copilot', client:'',
      tags:['gdpr','eu','campaign'], upd:210, ing:300, xc:320, xu:210,
      sum:'Ran in Q1 and never closed out.',
      x:{ goal:'2 accounts won off a competitor for AiMY Knowledge.',
          sells:'AiMY Knowledge · Product',
          persona:'Head of Digital, Chief Information Officer, Head of Shared Services',
          sector:'Healthcare',
          size:'1,000 to 5,000 staff',
          window:'19 Aug to 5 Dec',
          pitch:'They are in Benelux, and they are running this with people rather than with a system. AiMY Knowledge is one answer surface over documentation nobody can find. Open on what it costs them today, not on what we do.' } },

    /* ══ TWO OFFERINGS THAT EXIST ONLY AS DOCUMENTS ══════════════════════

       Deliberately NOT two of the eight already hardcoded in settings. A
       document called "AiMY Voice" would sit in the sell picker beside the
       constant of the same name and the pair would be indistinguishable — which
       would demonstrate the duplicate, not the feature. These are the two real
       gaps in that list: the company sells Copilot and it sells CX consulting,
       and neither is in the eight, so each one only reaches AiMY Sales by being
       written down here. That is the whole point of the type.

       `pitch` is the line the Sales picker prints; `sum` is what the document
       says. See pitchOf — they are different lengths for different readers, and
       the second is not a fallback for the first except when it has to be. */
    { id:'product-copilot', t:'product', work:'completed', owner:'N. Wael',
      title:'AiMY Copilot', col:'sales', src:'confluence', prod:'copilot', client:'',
      tags:['copilot','catalogue'], upd:18, ing:64, xc:70, xu:18,
      sum:'Copilot answers from the company’s own documents, inside the tools people already have open — the helpdesk, the CRM, the chat client. It cites what it used, so an answer can be checked rather than trusted.\n\nSold per seat, with a floor of twenty. The knowledge base it grounds on is whatever the client already has; there is no migration step and no content project before it is useful.',
      x:{ pitch:'answers from your own documents, in the tools you already use' } },

    { id:'service-cx', t:'service', work:'completed', owner:'O. Said',
      title:'CX consulting', col:'sales', src:'upload', prod:'sales', client:'',
      tags:['cx','catalogue'], upd:9, ing:9, xc:9, xu:9,
      sum:'A six-week engagement. We map the journey as it actually runs — from the recordings and the ticket history, not from the process diagram — and come back with the three moments that lose the most customers, costed.\n\nIt ends in a decision, not a report: each of the three comes with what it would take to fix and what it is worth. Clients who take two of the three typically see it back inside two quarters.',
      x:{ pitch:'we map the journey, then cost the three moments that lose customers' } },

    { id:'asset-onepager', t:'asset', work:'completed', owner:'Brand',
      title:'Quality at scale — one-pager', col:'marketing', src:'upload', prod:'aspire', client:'valsoft',
      tags:['qa','emea','collateral'], upd:27, ing:27, xc:27, xu:27,
      sum:'Two-page PDF used in outbound to the BPO segment.',
      x:{ format:'PDF · A4 · 2pp', usage:'External — customer-facing', approval:'approved' } },

    /* Filed as a Marketing Asset until there was a Presentation to file it as —
       a "buyer deck" whose format field read "16:9 · 14 slides", which is the
       taxonomy admitting through a text field what it had no type for. The id
       keeps its `asset-` prefix: two EDGES and one EXTRA row address it, and an
       id is an opaque handle rather than a claim about the object. */
    { id:'asset-deck-security', t:'pptx', work:'recommended', owner:'Brand',
      title:'Security and residency — buyer deck', col:'marketing', src:'upload', prod:'sales', client:'',
      tags:['security','gdpr','collateral'], upd:96, ing:96, xc:96, xu:96,
      sum:'Used in enterprise deals. Cites the residency article, which is itself due.',
      props:{ 'source-file': 'security-residency-buyer-deck.pptx', size: '4.2 MB' },
      x:{ slides:14, presented:'Enterprise deals — ongoing', usage:'External — under NDA', approval:'approved' } },

    { id:'asset-voice-demo', t:'asset', work:'drafted', owner:'Unassigned',
      title:'Voice handoff — demo script', col:'marketing', src:'upload', prod:'voice', client:'',
      tags:['voice','collateral'], upd:5, ing:5, xc:5, xu:5,
      sum:'Drafted for the Q4 campaign. Not yet cleared for external use.',
      x:{ format:'Doc · 3pp', usage:'Internal only', approval:'pending' } },

    { id:'asset-pricing-sheet', t:'asset', work:'detected', owner:'Brand',
      title:'Enterprise pricing sheet — 2025', col:'marketing', src:'upload', prod:'pov', client:'',
      tags:['pricing','collateral'], upd:230, ing:230, xc:230, xu:230,
      sum:'Superseded pricing still circulating in outbound. Past review and excluded.',
      x:{ format:'PDF · A4 · 1pp', usage:'External — customer-facing', approval:'approved' } },

    { id:'story-nordwind', t:'story', work:'completed', owner:'Marketing',
      title:'Nordwind — 31% faster resolution', col:'marketing', src:'teamsupport', prod:'sales', client:'nordwind',
      tags:['qa','emea','proof'], upd:39, ing:120, xc:130, xu:39,
      sum:'Eight hundred seats, three months, measured against their own baseline.',
      x:{ size:'800 seats', outcome:'31% faster first resolution',
          quote:'We stopped guessing which conversations to review.', approval:'pending' } },

    { id:'story-meridian', t:'story', work:'completed', owner:'Marketing',
      title:'Meridian Health — audit-ready in six weeks', col:'marketing', src:'teamsupport', prod:'copilot', client:'meridian',
      tags:['security','eu','proof'], upd:54, ing:140, xc:150, xu:54,
      sum:'A regulated provider reaching audit readiness without adding headcount.',
      x:{ size:'240 seats', outcome:'Audit readiness in 6 weeks',
          quote:'The evidence was already there. We just could not find it.', approval:'approved' } },

    { id:'story-tavola', t:'story', work:'recommended', owner:'Marketing',
      title:'Tavola Retail — peak season without extra headcount', col:'marketing', src:'teamsupport', prod:'voice', client:'tavola',
      tags:['voice','proof'], upd:104, ing:180, xc:190, xu:104,
      sum:'Seasonal volume absorbed by voice deflection rather than temporary staff.',
      x:{ size:'410 seats', outcome:'Peak absorbed with 0 temporary hires',
          quote:'December stopped being the month we dread.', approval:'approved' } },

    { id:'story-orbit', t:'story', work:'drafted', owner:'Unassigned',
      title:'Orbit BPO — multi-client QA in one view', col:'marketing', src:'upload', prod:'sales', client:'orbit',
      tags:['qa','proof'], upd:3, ing:3, xc:3, xu:3,
      sum:'Drafted by AiMY from the account notes. No customer sign-off, no owner.',
      x:{ size:'1,200 seats', outcome:'One QA view across 9 client programmes',
          quote:'Awaiting approval — do not quote externally.', approval:'pending' } },

    { id:'blog-quality-scale', t:'blog', work:'completed', owner:'Marketing',
      title:'Why quality does not scale by hiring reviewers', col:'marketing', src:'web', prod:'sales', client:'',
      tags:['qa','opinion'], upd:47, ing:47, xc:52, xu:47,
      sum:'The argument the Q3 campaign runs on, in long form.',
      x:{ pub:'Published', canonical:'aimy.app/blog/quality-does-not-scale', author:'A. Mahfouz' } },

    { id:'blog-residency', t:'blog', work:'recommended', owner:'Marketing',
      title:'Data residency, plainly', col:'marketing', src:'web', prod:'copilot', client:'',
      tags:['gdpr','eu','apac','opinion'], upd:119, ing:119, xc:124, xu:119,
      sum:'Public-facing explainer. Points at the residency article, which is due.',
      x:{ pub:'Published', canonical:'aimy.app/blog/data-residency', author:'O. Said' } },

    { id:'blog-voice-draft', t:'blog', work:'drafted', owner:'Unassigned',
      title:'What a good voice handoff sounds like', col:'marketing', src:'upload', prod:'voice', client:'',
      tags:['voice','opinion'], upd:1, ing:1, xc:1, xu:1,
      sum:'Drafted for the Q4 campaign. Unpublished.',
      x:{ pub:'Draft — unpublished', canonical:'—', author:'AiMY · awaiting an owner' } },

    { id:'page-pricing', t:'webpage', work:'detected', owner:'Unassigned',
      title:'Pricing — Enterprise tier', col:'marketing', src:'web', prod:'sales', client:'',
      tags:['pricing','enterprise'], upd:134, ing:400, xc:600, xu:26,
      sum:'The live pricing page. Changed at source three weeks after our last crawl.',
      /* No `crawl` or `change` string. Both were hand-written phrases that
         disagreed with the numbers beside them — page-security read
         "7 days ago" against an `upd` of 21 — so they are derived now:
         `upd` IS the last crawl, and `xu` is when the source moved. */
      x:{ url:'aimy.app/pricing/enterprise' } },

    { id:'page-security', t:'webpage', work:'completed', owner:'O. Said',
      title:'Security overview', col:'marketing', src:'web', prod:'copilot', client:'',
      tags:['security','gdpr'], upd:21, ing:300, xc:410, xu:21,
      sum:'The public security page. Crawled weekly, no unexplained drift.',
      x:{ url:'aimy.app/security' } },

    { id:'page-status', t:'webpage', work:'failed', owner:'Unassigned',
      title:'Service status and incident history', col:'support', src:'web', prod:'interfax', client:'upland',
      tags:['sla','support'], upd:19, ing:210, xc:300, xu:19,
      sum:'Crawl blocked since 11 July. What is stored is nineteen days old.',
      x:{ url:'status.aimy.app' } },

    /* ── Legal. Not entitled to this user, and therefore never counted, never
       ranked and never cited. The three objects exist so the entitlement
       filter has something real to withhold: a filter that only ever hides
       nothing is not a filter anyone can trust. ── */
    { id:'article-dpa', t:'article', work:'completed', owner:'Legal',
      title:'Data processing addendum — standard terms', col:'legal', src:'confluence', prod:'copilot', client:'',
      tags:['gdpr','security'], upd:16, ing:340, xc:400, xu:16,
      sum:'The standard DPA offered to enterprise customers.',
      x:{ applies:'Enterprise contracts' } },
    { id:'article-retention', t:'article', work:'recommended', owner:'Legal',
      title:'Retention and deletion schedule', col:'legal', src:'confluence', prod:'copilot', client:'',
      tags:['gdpr','policy'], upd:110, ing:350, xc:410, xu:110,
      sum:'How long each class of record is kept, and what triggers deletion.',
      x:{ applies:'All regions' } },
    { id:'ticket-49002', t:'ticket', work:'completed', owner:'Ingested · Freshdesk',
      title:'#49002 — Legal hold on an account under dispute', col:'legal', src:'freshdesk', prod:'copilot', client:'orbit',
      tags:['security'], upd:70, ing:70, xc:72, xu:70,
      sum:'Account data preserved pending resolution.',
      x:{ requester:'Orbit BPO', assignee:'Legal', status:'On hold', resolution:'Open — legal hold in force.' } }
  ];

  /* Per-object overrides, kept out of the records above so the corpus stays
     readable.

     `used` is days since anything last cited or opened the document and `uses`
     is how many times in the last ninety — the two numbers the retrieval layer
     is already counting, and the ones that say whether a document is doing any
     work. Where they are absent below, `used` falls out of the last update: a
     document written last week has been read this week.

     `xu` lower than `upd` means the source moved on after our copy, which is
     what makes a document out of date. */
  const EXTRA = {
    'article-residency':    { props: { tier: 'all', jurisdiction: 'EU + APAC' }, used: 3, uses: 61 },
    'article-billing':      { used: 122, uses: 2 },
    'article-retention':    { used: 140, uses: 1 },
    'article-dpa':          { props: { tier: 'enterprise', 'legal-review': 'annual' }, used: 21, uses: 9 },
    'article-sso':          { props: { tier: 'enterprise' }, services: ['support'], used: 1, uses: 148 },
    'article-refund':       { xu: 40, used: 2, uses: 210 },
    'article-returns-faq':  { used: 2, uses: 173 },
    'article-churn-signals':{ used: 210, uses: 0 },
    'icp-bpo':              { region: 'emea', services: ['qa', 'support'], props: { 'deal-band': '40–120k' }, used: 6, uses: 34 },
    'icp-bpo-apac':         { region: 'apac', services: ['qa', 'support'], used: 168, uses: 1 },
    'icp-healthcare':       { region: 'emea', services: ['qa', 'cx'], props: { 'deal-band': '80–250k' }, used: 4, uses: 27 },
    'icp-retail-voice':     { region: 'amer', services: ['voice', 'analytics'], used: 8, uses: 3 },
    'campaign-residency':   { used: 196, uses: 0 },
    'asset-deck-security':  { xu: 20, used: 11, uses: 18 },
    'asset-pricing-sheet':  { used: 154, uses: 4 },
    'story-nordwind':       { region: 'emea', services: ['qa'], props: { seats: '800', 'go-live': 'Mar 2026' }, used: 5, uses: 42 },
    'story-meridian':       { region: 'emea', services: ['qa', 'cx'], props: { seats: '240' }, used: 9, uses: 31 },
    'story-tavola':         { region: 'emea', services: ['voice'], props: { seats: '410' }, used: 118, uses: 2 },
    'story-orbit':          { region: 'apac', services: ['qa', 'analytics'], props: { seats: '1,200' }, used: 3, uses: 6 },
    'blog-quality-scale':   { xu: 12, used: 14, uses: 22 },
    'blog-residency':       { used: 131, uses: 3 },
    'page-pricing':         { used: 7, uses: 88 }
  };

  /* ═══════════════════════════════
     THE WRITTEN NINE — one worked example of every type

     `o.html` was empty on all forty objects, so every document in the corpus
     rendered the same two lines: its summary, then the type's boilerplate
     sentence out of BODY_COPY. That is enough to exercise a filter and not
     nearly enough to review a TYPE — you cannot tell whether an ICP reads
     correctly from a document whose entire body is "Fit is assessed on the
     criteria above".

     So nine documents are written out in full, one per entry in TYPES, and
     they are the nine the landing surface leads with. They were picked for
     their EDGES rather than at random: refund contradicts the returns FAQ,
     answers #48120 and is referenced by the Nordwind story, which the Q3 blog
     post cites, which the Q3 campaign runs, which sends the one-pager. Reading
     the nine walks the graph rather than sampling nine unrelated things.

     Bodies are HTML rather than markdown on purpose. `mdToHTML` is declared
     four thousand lines below this and `mdInline` beside it is a `const`, so
     calling it from the boot pass would read a binding in its temporal dead
     zone. HTML is also what `o.html` holds everywhere else — `writeBody`
     stores innerHTML — so the fixture and the running document are one format.

     The tag vocabulary is the body's own: h3, h4, p, ul/ol, blockquote. No
     tables — nothing styles one inside `#editBody`, and a fixture that renders
     unstyled is a fixture that lies about the type.
  ═══════════════════════════════ */
  const BODIES = {

    /* ARTICLE — prose IS the document, so this one is the longest. It is also
       the corpus's out-of-date exemplar, and the body has to be worth the
       banner above it: the policy in full, with the activation clause the
       Returns FAQ contradicts stated plainly enough that the conflict is
       legible when you open both. */
    'article-refund': `
      <p>A customer on the EU storefront may return a purchase for a full refund within <strong>30 days of the purchase date</strong>, provided the item has not been activated. The window runs from purchase, not from delivery, and it does not pause while an item is in transit.</p>
      <h3>What counts as activation</h3>
      <p>An item is activated the first time its licence key is redeemed, its seat is assigned to a named user, or its trial is converted. Activation is recorded against the order and is visible to support on the account timeline. Once it appears there, the refund window is closed regardless of how many days remain.</p>
      <ul>
        <li><strong>Licence keys</strong> — redeemed is activated, even if the customer never signed in afterwards.</li>
        <li><strong>Seats</strong> — assigning a seat activates it. Unassigning does not reverse this.</li>
        <li><strong>Trials</strong> — a converted trial is activated on the conversion date, not on the trial start.</li>
      </ul>
      <h3>What happens after activation</h3>
      <p>An activated item is out of scope for a refund and in scope for warranty. If the customer's complaint is that the product does not work, route it to the warranty process rather than declining it — the two are different remedies for different problems, and declining a fault as a late refund is the most common mishandling of this policy.</p>
      <h3>Exceptions</h3>
      <p>Support may grant a goodwill credit outside the window without approval up to the value of one seat-month. Anything above that needs the policy owner. Every exception is logged against the account so the pattern is visible at renewal — an account with three goodwill credits is a signal, not three unrelated incidents.</p>
      <blockquote>An exception is a decision about one customer. It does not change the policy, and it must not be cited back as though it did.</blockquote>
      <h3>What support may confirm</h3>
      <ol>
        <li>The purchase date, and therefore the last day of the window.</li>
        <li>Whether the item shows as activated, and on what date.</li>
        <li>That an activated item is handled under warranty instead.</li>
      </ol>
      <p>Support may not confirm whether an exception will be granted before it has been. Saying "that should be fine" and then declining is the single largest driver of escalation on this policy.</p>`,

    /* TICKET — the record leads and this is evidence beneath it, so it reads
       as a transcript rather than as guidance. The resolution field says the
       exception was granted; the body says what was actually said, which is
       the thing an owner needs when they are deciding whether the article is
       at fault. */
    'ticket-48120': `
      <p><strong>Raised 3 Mar 2026 · Nordwind GmbH · via email</strong></p>
      <p>Customer bought 40 seats on the EU storefront on 2 February and assigned twelve of them the same week. On 1 March they asked to return the unused twenty-eight, having decided to standardise on a different tool for that team.</p>
      <h3>What the customer said</h3>
      <blockquote>We are 27 days in and we have not touched 28 of these seats. We would like to return the ones we have not used.</blockquote>
      <p>First response declined the request on the grounds that the order had been activated. The customer replied that the seats they were asking about had never been assigned to anyone, and that they had read the 30-day window as applying per seat.</p>
      <h3>Where it went wrong</h3>
      <p>The policy is written per <em>order</em> and the storefront sells per <em>seat</em>. Nothing in the refund article says which one activation attaches to, and the agent's reading — order-level — is the one the billing system implements. The customer's reading is the one the purchase flow implies.</p>
      <h3>How it was closed</h3>
      <p>A goodwill credit was issued for the twenty-eight unassigned seats, above the one-seat-month ceiling, approved by the policy owner. The exception is logged against the account. The customer accepted and renewed in April.</p>
      <p>Flagged to the policy owner: the article needs to say whether activation is per order or per seat. Two further tickets have arrived on the same ambiguity since.</p>`,

    /* ICP — the criteria are the record above; this is the part sellers get
       wrong, which is the disqualifier half. Written as instructions to a
       person mid-call rather than as a description of a segment. */
    'icp-bpo': `
      <h3>Who this is</h3>
      <p>Outsourced contact-centre operators running between 200 and 2,000 seats across EMEA, serving several client programmes from the same floor. They sell quality as part of their contract, which means quality is a line item somebody defends in a QBR rather than an internal aspiration.</p>
      <h3>Why they buy</h3>
      <p>Their client contracts carry review obligations — a percentage of interactions scored, evidence retained, results reported monthly. Meeting that with human reviewers costs roughly one reviewer per twenty agents, and it does not scale past the point where a new client programme lands. They buy coverage, and they buy the evidence trail that comes with it.</p>
      <h4>What a good conversation sounds like</h4>
      <ul>
        <li>They can name the person who owns QA, and that person is on the call.</li>
        <li>They talk about client audits, not about internal quality scores.</li>
        <li>They already sample manually and can tell you the percentage.</li>
      </ul>
      <h3>Reading the disqualifiers</h3>
      <p>The two disqualifiers above are hard, not advisory. A single-client captive centre has no client audit to satisfy and buys on internal budget, which is a different sale with a different cycle — those deals close at roughly a third of the rate and take twice as long. Under 200 seats there is usually no named QA owner at all, and the deal stalls in the gap between operations and finance.</p>
      <p>A prospect failing either one is out, regardless of how well it scores elsewhere. A high fit score on a disqualified account is the profile telling you the account looks right, not that it is.</p>
      <h3>Where to take it next</h3>
      <p>APAC is a separate profile with a lower score and a different residency conversation — do not run this one there. For proof, the Orbit and Nordwind stories are the two that were measured against a customer's own baseline.</p>`,

    /* CAMPAIGN — operational, not promotional, which the boilerplate has been
       claiming since the type existed. So: what ran, what it returned, and the
       one thing that went wrong. */
    'campaign-q3': `
      <h3>What ran</h3>
      <p>Three-month pipeline campaign against the mid-market BPO segment in EMEA, opening 1 July. Six assets across three landing pages, an outbound sequence to a 1,400-contact list built from the ICP, and two webinars co-run with a partner.</p>
      <h4>The sequence</h4>
      <ol>
        <li><strong>Weeks 1–4</strong> — the quality-at-scale one-pager into cold outbound, landing page A.</li>
        <li><strong>Weeks 5–8</strong> — the Nordwind story to anyone who opened twice, landing page B.</li>
        <li><strong>Weeks 9–12</strong> — webinar invitations to the engaged half, landing page C.</li>
      </ol>
      <h3>What it returned</h3>
      <ul>
        <li>1,400 contacts, 312 opens on the second touch, 71 landing-page conversions.</li>
        <li>19 qualified meetings, of which 14 matched the ICP on both disqualifiers.</li>
        <li>4 opportunities still open at the close of the window.</li>
      </ul>
      <p>The five meetings that did not match the profile all came from the same list segment — operators under 200 seats who had been included because the seat-count field was empty rather than because it was low. The list build now treats an empty field as a fail.</p>
      <h3>What we learned</h3>
      <p>The story outperformed the one-pager by a factor of three on the second touch, and the effect was almost entirely in reply rate rather than open rate. People opened both and answered the one with a customer's name on it. Q4 leads with proof.</p>
      <blockquote>The asset list above is the authority on what may be sent. Two assets circulated during this campaign that are not on it, both pulled from an old shared drive.</blockquote>`,

    /* ASSET — prose is 'absent' for this type, meaning it does not INVITE
       writing, not that writing is impossible. So this is short and it is
       about the file: what is in it, who it is for, and the one clause that
       decides whether it may be sent. */
    'asset-onepager': `
      <p>Two-page PDF, A4, built for cold outbound into the BPO segment. Page one is the argument; page two is the Nordwind result and a single proof point per claim.</p>
      <h3>What is in it</h3>
      <ul>
        <li><strong>Page 1</strong> — why reviewer headcount does not scale, the coverage gap illustrated at 2% and at 100%, and what changes for a client audit.</li>
        <li><strong>Page 2</strong> — the Nordwind numbers, a two-line quote, and the contact block.</li>
      </ul>
      <h3>Using it</h3>
      <p>Cleared for external use and customer-facing, so it may be attached to cold outbound without approval. It carries one measured claim — 31% faster first resolution — and that claim is sourced to the Nordwind story. If that story's approval ever lapses, this asset has to come out of circulation with it.</p>
      <p>Do not edit the PDF locally to change the numbers for a specific prospect. Every version in circulation should be this one, so that a claim can be traced to a single file.</p>`,

    /* PRESENTATION — a deck nobody can read in the browser, so the body is
       the note beside it: what is on each run of slides, which ones to skip,
       and what has gone stale since it was last shown. */
    'asset-deck-security': `
      <p>Fourteen slides, used in enterprise deals where security review starts before commercial terms. Cleared to present under NDA — not customer-facing without one, because slides 9 to 11 name sub-processors.</p>
      <h3>How it runs</h3>
      <ul>
        <li><strong>1–3</strong> — the shape of the platform and where data sits. Always show.</li>
        <li><strong>4–8</strong> — residency by region, with the EU and APAC split. This is the run that does the work.</li>
        <li><strong>9–11</strong> — sub-processors and the DPA. Skip unless legal is in the room; it invites a line-by-line review that stalls the meeting.</li>
        <li><strong>12–14</strong> — certifications, the audit trail, and the incident history.</li>
      </ul>
      <h3>What has moved since it was built</h3>
      <p>Slides 5 and 6 restate the residency article, and that article is itself past its review date — the APAC half in particular has been flagged twice. Do not read those two slides out verbatim in an APAC deal until the article is settled; state the EU position, which is stable, and take APAC as a follow-up.</p>
      <blockquote>A deck is cleared to present, not cleared to send. If somebody asks for the file afterwards, send the security page instead.</blockquote>`,

    /* SUCCESS STORY — the record carries the outcome and the quote; this is
       the sequence that produced them, which is what a seller needs when the
       prospect asks "how long did that actually take". Approval is pending, so
       the body says so where somebody about to quote it will see it. */
    'story-nordwind': `
      <p>Nordwind GmbH runs 800 seats across three client programmes from Hamburg and Kraków. Their contracts oblige them to score 2% of interactions and report monthly. They were meeting that with six reviewers and missing it in December every year.</p>
      <h3>What they had before</h3>
      <ul>
        <li>2% sampled, chosen by whoever was reviewing that day.</li>
        <li>Results in three spreadsheets, one per programme, reconciled by hand.</li>
        <li>Roughly eleven days between an interaction and anyone looking at it.</li>
      </ul>
      <h3>What changed</h3>
      <p>Full coverage from week three, with reviewers moved off sampling and onto the interactions that were actually flagged. The reporting pack that took two days a month became a view their client could be given directly.</p>
      <h4>The measured result</h4>
      <p><strong>31% faster first resolution</strong>, measured against their own pre-deployment baseline over the three months to March, on the same two programmes throughout. Reviewer headcount was unchanged — nobody was replaced, and the story should never be told as though anybody was.</p>
      <blockquote>We stopped guessing which conversations to review.</blockquote>
      <h3>Before you use this</h3>
      <p>Approval is <strong>pending</strong>. The numbers are cleared internally and the quote is not yet cleared by Nordwind's marketing team, so it may be used in conversation and must not appear in anything published or sent. The 31% figure is the only measured claim here; everything else above is context and is not a claim.</p>`,

    /* BLOG — prose is primary, so this is the post as published rather than
       a note about it. It is the argument the Q3 campaign runs on, which is
       why the campaign record above points at it. */
    'blog-quality-scale': `
      <p>Every contact centre that has ever tried to improve quality has started in the same place: hire more reviewers. It works, briefly, and then it stops working — and the reason it stops is arithmetic rather than effort.</p>
      <h3>The arithmetic</h3>
      <p>A reviewer can score somewhere between twenty and forty interactions a day, depending on channel and how much of the surrounding context they have to read. Call that thirty. A hundred agents handling forty contacts a day produce four thousand interactions. One reviewer covers 0.75% of them.</p>
      <p>To reach 10% coverage you need thirteen reviewers for every hundred agents. To reach 100% you need a hundred and thirty-three, which is more reviewers than agents, which is not a plan.</p>
      <h3>So everybody samples</h3>
      <p>Sampling is a reasonable response to an impossible number, and it has one property nobody says out loud: <em>the sample is not random</em>. Reviewers pick the calls they can find, from the queues they know, at the times they are working. The interactions least likely to be reviewed are the ones from the busiest hour of the worst day — which are exactly the ones worth reviewing.</p>
      <blockquote>A 2% sample tells you about 2% of your operation. It does not tell you about the other 98%, and it never claimed to.</blockquote>
      <h3>What changes with full coverage</h3>
      <p>The interesting part is not the score. It is that reviewers stop choosing what to look at and start being told. Their day shifts from finding problems to deciding what to do about the ones already found — which is the part of the job that needed a person in the first place.</p>
      <p>Nordwind ran this and measured 31% faster first resolution against their own baseline, with the same six reviewers they started with. Nobody was replaced. The reviewers just stopped spending their mornings picking calls.</p>
      <h3>The honest limitation</h3>
      <p>Full coverage makes the sampling problem go away and does not make the calibration problem go away. If your scorecard is ambiguous, scoring everything with it produces a great deal of consistent ambiguity. Fix the scorecard first; it is a week of work and it is the week with the highest return in this entire exercise.</p>`,

    /* WEB PAGE — a COPY we crawl, not writing of ours, so the body is what was
       stored and the freshness claim above it is about this text. Written as
       the page reads rather than as a note about the page. */
    'page-security': `
      <h3>Where your data is</h3>
      <p>Customer data is stored in the region selected at the time the account is created. EU accounts are stored in Frankfurt with a failover replica in Dublin; APAC accounts are stored in Singapore. Data does not leave its region for processing, and backups are held in-region.</p>
      <h3>Who can reach it</h3>
      <p>Access is role-based and logged. Support staff can see account metadata and configuration by default; reading customer conversation content requires an explicit, time-boxed grant that the customer can see in their own audit log. Every such grant expires automatically after eight hours.</p>
      <h3>Certifications</h3>
      <ul>
        <li>ISO 27001, current, scoped to the platform and the supporting infrastructure.</li>
        <li>SOC 2 Type II, reported annually, available under NDA.</li>
        <li>Annual third-party penetration test, summary available on request.</li>
      </ul>
      <h3>Sub-processors and terms</h3>
      <p>The list of sub-processors is published and versioned, and customers on enterprise agreements are notified thirty days before any addition. The standard data processing addendum is offered to all enterprise customers and covers the residency commitments stated above.</p>
      <h3>Reporting something</h3>
      <p>Security reports go to security@aimy.app. Reports are acknowledged within one business day and triaged within three. We do not run a paid bounty programme and we do credit reporters who ask to be credited.</p>`
  };

  /* The two file-backed types are records ABOUT a file, and three of the four
     had no file — so the subject region drew "No file attached" over a record
     describing its format in detail. A Marketing Asset whose format field says
     "PDF · A4 · 2pp" and whose subject says there is no PDF is the fixture
     contradicting itself on one screen. */
  const FILES = {
    'asset-onepager':      { 'source-file': 'quality-at-scale-onepager.pdf', size: '1.1 MB' },
    'asset-voice-demo':    { 'source-file': 'voice-handoff-demo-script.docx', size: '84 KB' },
    'asset-pricing-sheet': { 'source-file': 'enterprise-pricing-2025.pdf', size: '640 KB' }
  };

  /* Two archived objects. Archive is the mind map's manual-update branch, and it
     is not deletion: archived content stays addressable, stays restorable, and
     is excluded from the surface until you ask for it with `?archived=1`. */
  CORPUS.push(
    { id:'article-refund-2024', t:'article', work:'completed', owner:'A. Mahfouz', arch:true,
      title:'Refund eligibility — EU customers (2024 terms)', col:'policies', src:'confluence', prod:'copilot', client:'',
      tags:['refunds','eu','policy'], upd:520, ing:700, xc:760, xu:520,
      sum:'The 14-day window that preceded the current 30-day policy.',
      x:{ applies:'EU storefront · superseded 12 Mar 2025' } },
    { id:'campaign-q1-launch', t:'campaign', work:'completed', owner:'Marketing', arch:true,
      title:'Q1 — Launch week', col:'marketing', src:'teamsupport', prod:'sales', client:'',
      tags:['campaign'], upd:290, ing:320, xc:330, xu:290,
      sum:'Closed out and archived. Kept for what it targeted and what it was for.',
      x:{ goal:'Launch awareness in the Nordics.',
          sells:'AiMY Sales · Product',
          persona:'Sales Director, Head of Revenue Operations',
          sector:'Software',
          size:'100 to 500 staff',
          window:'6 Jan to 20 Jan',
          pitch:'A launch list, called once each. Open on what they run today.' } }
  );

  /* Defaults, derived once. Region falls out of the tags where the object
     already says which region it is about; audience falls out of the type,
     because what makes a document client-visible is what kind of document it
     is. Both are overridable in EXTRA where the real answer is not derivable. */
  /* A deck is shown TO a customer, so it is client-facing by default for the
     same reason an asset is. Whether it may leave the building is `x.approval`,
     which is a separate question from who can see it here. */
  const CLIENT_FACING = ['blog', 'webpage', 'asset', 'story', 'pptx'];
  CORPUS.forEach((o) => {
    Object.assign(o, EXTRA[o.id] || {});
    /* The written nine, and the files the file-backed types are about. Merged
       here rather than inlined above for the same reason EXTRA is: a 300-line
       body sitting inside a record would bury the fields the record exists to
       declare, and nobody would read the corpus again. */
    if (BODIES[o.id]) o.html = BODIES[o.id].replace(/\n\s+/g, '');
    if (FILES[o.id]) o.props = Object.assign({}, FILES[o.id], o.props);
    if (!o.region) {
      o.region = o.tags.indexOf('apac') > -1 ? 'apac'
        : (o.tags.indexOf('eu') > -1 || o.tags.indexOf('emea') > -1) ? 'emea' : 'global';
    }
    o.services = o.services || [];
    o.groups = o.groups || (GROUPS_OF_COL[o.col] || []).slice();
    o.props = o.props || {};
    o.arch = !!o.arch;
    o.aud = o.aud || (o.col === 'legal' ? ['admins']
      : CLIENT_FACING.indexOf(o.t) > -1 ? ['clients', 'admins', 'stakeholders']
      : ['admins', 'stakeholders']);
    /* A document written last week has been read this week. */
    if (o.used === undefined) o.used = Math.min(o.upd, 30);
    if (o.uses === undefined) o.uses = Math.max(0, 40 - Math.round(o.used / 3));
  });

  const byId = (id) => CORPUS.find((o) => o.id === id);
  const TOTAL = CORPUS.length;

  /* Status is derived, so it is derived again after anything that could change
     it — an edit, an archive, a restore, a re-sync. One call, everywhere. */
  /* Findings are derived from status, so whatever moves status invalidates
     them. Declared up here rather than beside the helpers that use them:
     recompute() runs inside the boot normalisation pass, and a `const` arrow
     declared 4,000 lines further down is in its temporal dead zone by then. */
  let insAll = null;
  let insBy  = null;
  function dropInsights() { insAll = null; insBy = null; }

  function recompute() { CORPUS.forEach((o) => { o.status = statusOf(o); }); dropInsights(); }

  /* `used` counts days since the last citation, so 0 means "today" — except
     when nothing has ever cited it, where 0 is the absence of a date rather
     than a date. A document created a minute ago read "used today"; so did one
     nobody has ever opened. A zero is not a date. */
  const neverCited = (o) => !o.uses;

  const usedLabel = (o) => neverCited(o) ? 'Never' : ageLabel(o.used);

  /* One phrase for "how much has anything used this", so the four places that
     say it cannot disagree — and so none of them has to special-case the zero. */
  const citedPhrase = (o) => neverCited(o)
    ? 'Never cited'
    : 'Cited ' + o.uses + ' times in 90 days — last ' + usedLabel(o).toLowerCase();

  /* Relationships. Kept out of the object bodies because they are a graph, and
     a graph half-stored on each node goes out of sync the first time one side
     is edited. */
  /* ═══════════════════════════════════════════════
     THE GRAPH

     This corpus has always been one. Every document carries typed edges — to a
     collection, a source, an owner, a client, a product, a region, its tags —
     and the product has only ever rendered them as filter dropdowns. That is
     the string reading of the data: `client` is a column and `nordwind` is a
     value in it. The other reading is Google's — things, not strings — where
     Nordwind is a thing with four documents, a success story, two tickets and
     an owner hanging off it.

     Nothing new is stored to get that. What changes is that the edges become
     addressable in both directions, and that an edge can say where it came
     from.

     TWO KINDS, and the distinction is the whole design.

     IMPLICIT edges are the fields themselves. They are derived, always true,
     cost nothing, and nobody asserted them — so nothing claims anybody did.

     ASSERTED edges are claims: this contradicts that, this replaced that.
     Somebody or something said so, and the edge carries who and when. That is
     Glean's point about edge properties, and it is the rule this product
     already holds for status — a computed fact and a claimed one must never
     look identical — finally applied to relationships too.
  ═══════════════════════════════════════════════ */
  const ENTITY = {
    doc:        { kind: 'Document',      filter: 'ids',        label: (id) => (byId(id) || {}).title || id },
    owner:      { kind: 'Person or team', filter: 'ids',       label: (id) => id },
    collection: { kind: 'Collection',    filter: 'collection', label: (id) => COLLECTIONS[id] || id },
    source:     { kind: 'Source',        filter: 'source',     label: (id) => (SRC[id] || {}).label || id },
    client:     { kind: 'Client',        filter: 'client',     label: (id) => CLIENTS[id] || id },
    group:      { kind: 'Group',         filter: 'group',      label: (id) => GROUPS[id] || id },
    product:    { kind: 'Product',       filter: 'product',    label: (id) => PRODUCTS[id] || id },
    region:     { kind: 'Region',        filter: 'region',     label: (id) => REGIONS[id] || id },
    service:    { kind: 'Service',       filter: 'service',    label: (id) => SERVICES[id] || id },
    tag:        { kind: 'Tag',           filter: 'tag',        label: (id) => id }
  };

  const entityLabel = (kind, id) => (ENTITY[kind] ? ENTITY[kind].label(id) : id) || id;

  /* Read straight off the document. The phrase is what gets rendered — the
     relationship is the sentence, not a label above a value. */
  const IMPLICIT = [
    { type: 'ownedBy',   to: 'owner',      phrase: 'Owned by',      get: (o) => responsible(o) ? [responsible(o)] : [] },
    { type: 'in',        to: 'collection', phrase: 'Filed in',      get: (o) => [o.col] },
    { type: 'from',      to: 'source',     phrase: 'Came from',     get: (o) => [o.src] },
    { type: 'about',     to: 'client',     phrase: 'About',         get: (o) => o.client ? [o.client] : [] },
    { type: 'sharedWith',to: 'group',      phrase: 'Shared with',   get: (o) => o.groups || [] },
    { type: 'serves',    to: 'product',    phrase: 'Answers for',   get: (o) => o.prod ? [o.prod] : [] },
    { type: 'covers',    to: 'region',     phrase: 'Covers',        get: (o) => o.region ? [o.region] : [] },
    { type: 'uses',      to: 'service',    phrase: 'Part of',       get: (o) => o.services || [] },
    { type: 'tagged',    to: 'tag',        phrase: 'Tagged',        get: (o) => o.tags || [] }
  ];

  /* Somebody claimed these. `by` and `at` are not decoration: an edge with no
     author is a fact, and an edge with one is an opinion, and the reader is
     owed the difference. */
  const ASSERTED = {
    contradicts:  { phrase: 'Disagrees with', inverse: 'contradicts',  tone: 'err' },
    supersededBy: { phrase: 'Replaced by',    inverse: 'supersedes' },
    supersedes:   { phrase: 'Replaces',       inverse: 'supersededBy' },
    related:      { phrase: 'Related to',     inverse: 'related' },
    /* Both halves of a one-way claim have to be entries, or looking at the far
       end falls through to the generic phrase. `references` used to name its
       inverse as prose — 'referenced by' — which is not a key, so a document
       that something else referenced said only "Related to" and lost the
       direction the claim was made in. */
    references:   { phrase: 'References',     inverse: 'referencedBy' },
    referencedBy: { phrase: 'Referenced by',  inverse: 'references' },
    /* The commonest real link in this corpus and the model could not hold it:
       a ticket that an article resolves. */
    answers:      { phrase: 'Answers',        inverse: 'answeredBy' },
    answeredBy:   { phrase: 'Answered by',    inverse: 'answers' }
  };

  /* Every live document has at least one of these. Eight edges across
     forty-two documents left thirty-four rails restating their own fields and
     calling it a graph. */
  const EDGES = [
    /* Refunds, returns and warranty — the conflict the product is built around. */
    { from: 'article-refund',        to: 'article-returns-faq', type: 'contradicts',  by: 'AiMY',       at: 12 },
    { from: 'article-refund',        to: 'article-warranty',    type: 'related',      by: 'A. Mahfouz', at: 40 },
    { from: 'article-returns-faq',   to: 'article-warranty',    type: 'related',      by: 'A. Mahfouz', at: 40 },
    { from: 'article-refund',        to: 'ticket-48120',        type: 'answers',      by: 'A. Mahfouz', at: 11 },
    { from: 'article-refund-2024',   to: 'article-refund',      type: 'supersededBy', by: 'A. Mahfouz', at: 120 },
    /* Residency, GDPR and the DPA. */
    { from: 'article-residency',     to: 'blog-residency',      type: 'related',      by: 'N. Wael',    at: 26 },
    { from: 'article-residency',     to: 'article-gdpr-dsr',    type: 'related',      by: 'N. Wael',    at: 26 },
    { from: 'article-residency',     to: 'ticket-51877',        type: 'answers',      by: 'N. Wael',    at: 20 },
    { from: 'article-retention',     to: 'ticket-49002',        type: 'answers',      by: 'Legal',      at: 33 },
    { from: 'article-dpa',           to: 'article-retention',   type: 'contradicts',  by: 'AiMY',      at: 7 },
    { from: 'page-security',         to: 'article-dpa',         type: 'references',   by: 'Marketing',  at: 44 },
    { from: 'asset-deck-security',   to: 'article-residency',   type: 'references',   by: 'Brand',      at: 30 },
    { from: 'asset-deck-security',   to: 'page-security',       type: 'references',   by: 'Brand',      at: 30 },
    { from: 'campaign-residency',    to: 'blog-residency',      type: 'references',   by: 'Marketing',  at: 22 },
    /* Onboarding, SSO and the SLA. */
    { from: 'article-sso',           to: 'ticket-51004',        type: 'answers',      by: 'O. Said',    at: 16 },
    { from: 'article-onboarding',    to: 'article-sso',         type: 'related',      by: 'O. Said',    at: 48 },
    { from: 'article-sla',           to: 'article-onboarding',  type: 'related',      by: 'O. Said',    at: 48 },
    { from: 'article-sla',           to: 'page-status',         type: 'contradicts',  by: 'AiMY',      at: 5 },
    /* Billing. */
    { from: 'article-billing',       to: 'ticket-52310',        type: 'answers',      by: 'N. Wael',    at: 14 },
    { from: 'page-pricing',          to: 'asset-pricing-sheet', type: 'references',   by: 'Marketing',  at: 18 },
    /* Voice. */
    { from: 'article-voice-handoff', to: 'ticket-52488',        type: 'answers',      by: 'O. Said',    at: 8 },
    { from: 'asset-voice-demo',      to: 'article-voice-handoff', type: 'references', by: 'Brand',      at: 24 },
    { from: 'blog-voice-draft',      to: 'article-voice-handoff', type: 'references', by: 'Marketing',  at: 6 },
    { from: 'campaign-q4-voice',     to: 'asset-voice-demo',    type: 'references',   by: 'Marketing',  at: 21 },
    /* Segments and the stories that prove them. */
    { from: 'article-churn-signals', to: 'icp-bpo',             type: 'supersededBy', by: 'O. Said',    at: 55 },
    { from: 'icp-bpo',               to: 'icp-bpo-apac',        type: 'related',      by: 'Sales Ops',  at: 60 },
    { from: 'story-nordwind',        to: 'ticket-48120',        type: 'references',   by: 'N. Wael',    at: 9 },
    { from: 'story-orbit',           to: 'icp-bpo',             type: 'references',   by: 'Sales Ops',  at: 35 },
    { from: 'story-meridian',        to: 'icp-healthcare',      type: 'references',   by: 'Sales Ops',  at: 28 },
    { from: 'story-tavola',          to: 'icp-retail-voice',    type: 'references',   by: 'Sales Ops',  at: 19 },
    /* Campaigns. */
    { from: 'campaign-q3',           to: 'asset-onepager',      type: 'references',   by: 'Marketing',  at: 50 },
    { from: 'campaign-q1-launch',    to: 'campaign-q3',         type: 'supersededBy', by: 'Marketing',  at: 90 },
    { from: 'blog-quality-scale',    to: 'story-nordwind',      type: 'references',   by: 'Marketing',  at: 38 },
    /* The catalogue entries are in the graph like everything else — a campaign
       sells one of them, and a segment is where the other one lands. */
    { from: 'campaign-q3',           to: 'product-copilot',     type: 'references',   by: 'Marketing',  at: 17 },
    { from: 'service-cx',            to: 'icp-bpo',             type: 'related',      by: 'O. Said',    at: 9 }
  ];

  /* RELATED is now a PROJECTION of the edge list, not a second copy of it.
     Twenty call sites read it and every one of them still works; the four that
     used to mutate it go through assertEdge instead, so provenance cannot be
     forgotten by accident. */
  let RELATED = {};

  function rebuildRelated() {
    RELATED = {};
    const slot = (id) => (RELATED[id] = RELATED[id] || { related: [], contradicts: [] });
    EDGES.forEach((e) => {
      const a = slot(e.from), b = slot(e.to);
      if (e.type === 'contradicts') {
        if (a.contradicts.indexOf(e.to) < 0) a.contradicts.push(e.to);
        if (b.contradicts.indexOf(e.from) < 0) b.contradicts.push(e.from);
      } else if (e.type === 'supersededBy') {
        a.supersededBy = e.to;
        if (b.related.indexOf(e.from) < 0) b.related.push(e.from);
      } else if (e.type === 'supersedes') {
        b.supersededBy = e.from;
        if (a.related.indexOf(e.to) < 0) a.related.push(e.to);
      } else {
        if (a.related.indexOf(e.to) < 0) a.related.push(e.to);
        if (b.related.indexOf(e.from) < 0) b.related.push(e.from);
      }
    });
  }
  rebuildRelated();

  /* Claims go in and out through here, so every one of them carries an author
     and a date, and undoing one is exact. */
  function assertEdge(from, to, type, by) {
    dropEdge(from, to);
    EDGES.push({ from: from, to: to, type: type, by: by || USER.owner, at: 0 });
    rebuildRelated();
  }
  function dropEdge(from, to) {
    for (let i = EDGES.length - 1; i >= 0; i--) {
      const e = EDGES[i];
      if ((e.from === from && e.to === to) || (e.from === to && e.to === from)) EDGES.splice(i, 1);
    }
    rebuildRelated();
  }

  /* Everything connected to one thing, in both directions, as phrases.
     Returns [{ phrase, kind, id, label, by, at }] — the peek renders it
     straight, because the sentence IS the relationship. */
  function edgesOf(kind, id) {
    const out = [];
    const push = (phrase, k, target, e) => {
      if (!target) return;
      out.push({ phrase: phrase, kind: k, id: target, label: entityLabel(k, target),
                 by: e && e.by, at: e && e.at });
    };

    if (kind === 'doc') {
      const o = byId(id);
      if (!o) return out;
      EDGES.forEach((e) => {
        if (e.from === id) push((ASSERTED[e.type] || {}).phrase || e.type, 'doc', e.to, e);
        else if (e.to === id) {
          const inv = (ASSERTED[e.type] || {}).inverse;
          const ph = (ASSERTED[inv] || {}).phrase || 'Related to';
          push(ph, 'doc', e.from, e);
        }
      });
      IMPLICIT.forEach((r) => r.get(o).forEach((v) => push(r.phrase, r.to, v, null)));
      return out;
    }

    /* Any other entity: the documents that point at it, then what those
       documents have in common — which is how you get from a client to the
       person who owns everything about them without ever leaving the panel. */
    const rel = IMPLICIT.find((r) => r.to === kind);
    if (!rel) return out;
    const docs = ENTITLED.filter((o) => !o.arch && rel.get(o).indexOf(id) > -1);
    docs.forEach((o) => push('Includes', 'doc', o.id, null));
    const seen = {};
    IMPLICIT.forEach((r) => {
      if (r.to === kind) return;
      docs.forEach((o) => r.get(o).forEach((v) => {
        const key = r.to + ':' + v;
        if (seen[key]) return;
        seen[key] = 1;
        push(r.phrase === 'Owned by' ? 'Owned by' : r.phrase, r.to, v, null);
      }));
    });
    return out;
  }

  /* The documents an entity gathers — used for its count and for the URL that
     puts them on the surface. */
  function docsOf(kind, id) {
    if (kind === 'doc') return [byId(id)].filter(Boolean);
    const rel = IMPLICIT.find((r) => r.to === kind);
    return rel ? ENTITLED.filter((o) => !o.arch && rel.get(o).indexOf(id) > -1) : [];
  }

  /* Status reads the relationship graph, so the first derivation waits for it. */
  recompute();

  /* ── Comments belong to the document ──

     They were a fixture in the editor's markup, which meant a document created
     ten seconds ago opened carrying somebody else's remark from two days ago.
     Seeded here on the two documents the fixture was written about; everything
     else — and everything new — starts with none. */
  CORPUS.forEach((o) => { o.comments = []; seedVersions(o); });
  /* ── One remark on each of the written nine ──

     Seeding two of forty was right while the fixture was two documents. Now
     that a reader is expected to open one of every type in turn, a comment
     thread that appears on the Article and on nothing else reads as a feature
     the other eight types do not have. Each of these is a real remark about
     the document it sits on — the kind that makes an owner do something —
     rather than filler proving the region renders. */
  const REMARKS = {
    'article-refund':       ['A. Mahfouz', 'AM', '2 days ago',
      'The exception needs to name the warranty article explicitly — support keeps landing here and then having to search again.'],
    'article-residency':    ['O. Said', 'OS', 'last week',
      'APAC is the half nobody has written. A ticket came in on it again yesterday.'],
    'ticket-48120':         ['N. Wael', 'NW', '4 days ago',
      'Third one this quarter on per-order vs per-seat. I am not raising a fourth — the article needs the sentence.'],
    'icp-bpo':              ['Sales Ops', 'SO', 'last week',
      'Two reps ran this at captive centres last month because the fit score looked good. The disqualifiers need to be louder than the number.'],
    'campaign-q3':          ['Marketing', 'MK', '3 days ago',
      'Can we get the two off-list assets named here? Nobody can pull something they cannot identify.'],
    'asset-onepager':       ['Brand', 'BR', '2 weeks ago',
      'This is sourced to a story whose approval is still pending. If that lapses we have outbound in flight carrying the claim.'],
    'asset-deck-security':  ['O. Said', 'OS', 'last week',
      'Slides 5 and 6 are the residency article verbatim. When it is fixed, this deck has to be re-exported — a note here will not travel with the file.'],
    'story-nordwind':       ['Marketing', 'MK', '6 days ago',
      'Chased Nordwind again on the quote. Until it clears, this is conversation-only and two decks already have it on a slide.'],
    'blog-quality-scale':   ['A. Mahfouz', 'AM', 'last month',
      'The 0.75% figure assumes thirty scored a day. Worth stating the assumption inline — somebody will check it.'],
    'page-security':        ['O. Said', 'OS', '3 weeks ago',
      'Crawled copy still lists the old triage window. The live page says three days; this says three. Fine now, but it drifts every time legal edits it.']
  };
  Object.keys(REMARKS).forEach((id) => {
    const o = byId(id);
    if (!o) return;
    const r = REMARKS[id];
    o.comments = [{ who: r[0], initials: r[1], when: r[2], text: r[3] }];
  });

  /* `problem` marks a reported fault rather than a remark. The two read
     differently because they ask different things of the owner: one is a
     conversation, the other is a job. */
  function addComment(o, text, problem) {
    o.comments = (o.comments || []).concat([
      { who: USER.name, initials: USER.initials, when: 'just now', text: text, problem: !!problem }
    ]);
  }

  const openProblems = (o) => (o.comments || []).filter((c) => c.problem && !c.done).length;

  /* ═══════════════════════════════════════════════
     STATE — the URL, and nothing else

     Every filter, the open document and the view mode live in the query
     string. Nothing filters off a variable the URL does not also hold, which
     is what makes the surface drivable by an agent: to change what a person
     is looking at, write a URL.
  ═══════════════════════════════════════════════ */
  const LIST_KEYS = ['type', 'tag', 'source', 'client', 'group', 'product', 'collection',
                     'status', 'region', 'service', 'audience', 'ids'];
  const DATE_KEYS = ['updated', 'ingested', 'extCreated', 'extUpdated'];
  const FLAG_KEYS = ['mine', 'archived'];
  const ALL_KEYS  = LIST_KEYS.concat(DATE_KEYS, FLAG_KEYS, ['q', 'prop']);

  /* The settings view's own keys, kept apart from ALL_KEYS on purpose: those
     are FILTERS, and changing one re-composes the working set. These are a
     PLACE YOU ARE. The two clear each other in `patch` for that reason. */
  const SET_KEYS  = ['m', 'skill', 'part', 'node', 'role', 'vs', 'sc', 'sp', 'crm', 'f', 'who', 'sec'];

  /* Parse a query string into the full state object. Split out from `readURL`
     so a stored conversation can be turned back into state by the same code
     that reads the address bar — a session's snapshot IS a query string, and
     two parsers for one format is one parser too many.

     Every key is written, defaulted when absent. That is what makes restoring
     a session a RESET rather than a merge: a partial object would leave
     whatever filters happened to be set standing underneath the ones it
     restores, and the surface would be neither state. */
  function parseParams(p) {
    /* No mode. A document is one surface — reading and writing are the same
       act — so there is nothing for the URL to say about which one you are in.
       `?mode=edit` in an old link is simply ignored. */
    const st = { doc: p.get('doc') || '',
                 settings: p.get('settings') || '',
                 /* Which conversation is open. Not a filter — it changes
                    nothing about the working set — but it is a place you
                    can be, so it is addressable like every other place,
                    and a link to it carries the thread as well as the
                    surface. */
                 chat: p.get('chat') || '',
                 view: p.get('view') === 'tree' ? 'tree' : 'grid',
                 /* Which edge the tree walks. Every axis in the folder view is
                    an implicit edge type, so grouping by client IS traversing
                    the `about` edge — and like everything else, it is a link.

                    `by`, not `group`: Group is now an axis of its own — the
                    people a document is shared with — and one word cannot name
                    both a filter value and the thing being filtered on. */
                 by: AXES[p.get('by')] ? p.get('by') : 'col',
                 /* One named ordering, not a sort menu. It answers "what needs
                    a person first", which is the only ordering question this
                    surface has ever been asked.

                    Three values, two states. Absent means "whatever this
                    surface's default is" — attention for the composed landing
                    set, recency for a filtered one — so `recent` has to be
                    writable or the toggle would be dead in the one place the
                    default is already on. */
                 sort: /^(attention|recent)$/.test(p.get('sort') || '') ? p.get('sort') : '',
                 /* ══ SETTINGS IS A VIEW OF THIS SURFACE ══════════════════
                    Not a page beside it, so its state belongs in the one
                    query string this file already owns. `m` is the module;
                    EMPTY MEANS THE CORPUS, which is what lets the way out of
                    settings be `patch({ m: '' })` — state removal, the same
                    move as closing a document — rather than a link that would
                    reload the shell you are already standing in.

                    These live here rather than in settings.js because that
                    file's own writer rebuilt the query string from scratch
                    and would have dropped every filter on the way past. One
                    writer, or the two disagree about what the URL says. */
                 m: p.get('m') || '',
                 skill: p.get('skill') || '',
                 /* Which part of the open skill is showing — Instructions,
                    Precedence or Reach. A place you are, like `skill` and
                    `sec`, so it is linkable: the chain that explains why an
                    answer came out the way it did is a thing people paste at
                    each other. settings.js falls back to Instructions for an
                    unknown value rather than rendering nothing. */
                 part: p.get('part') || '',
                 /* Which node of the tenancy tree People is standing on. A
                    place you are, and the one worth pasting: "who reaches
                    InterFAX Support" is the question a client asks by name.
                    settings.js falls back to the root for an id it does not
                    recognise, so a stale link lands on the directory rather
                    than on nothing. */
                 node: p.get('node') || '',
                 /* Which role Roles is showing, and which one it is being read
                    against. Two places you are, not two filters: `vs` does not
                    narrow anything, it decides what the page compares. Both
                    linkable, because "how does Admin differ from Super Admin"
                    is a question people settle by sending each other a URL. */
                 role: p.get('role') || '',
                 vs: p.get('vs') || '',
                 /* ── The settings scope ──
                    `sp` is the PRODUCT and it is the page's scope, picked once
                    in the module bar and carried across every Client module —
                    the way the design puts one product dropdown in the chrome
                    and scopes the whole page under it. `crm` is a sub-choice
                    inside Config only, because a product can read from more
                    than one connector and only the field mapping differs per
                    connector.

                    Both are absent by default and BOTH DEFAULT TO SOMETHING
                    REAL when read. Nobody should meet a page that asks which
                    product before it will show them anything. */
                 /* The CLIENT. It was hard-coded text in the scope bar while
                    only the product was pickable — which hid a real mismatch:
                    the bar read "Client CXS > FileBound Support" and FileBound
                    Support belongs to Upland. A scope you cannot change is a
                    scope nobody checks. */
                 sc: p.get('sc') || '',
                 /* Which PAGE of a module. A module is a group of settings
                    pages now, not one long page with a map down its side, so
                    "Connections" names three destinations and this says which
                    of them you are on. Absent means the first — a link to a
                    module without one lands where opening it lands. */
                 sec: p.get('sec') || '',
                 sp: p.get('sp') || '',
                 crm: p.get('crm') || '',
                 /* Which record the detail panel is showing. A place you are,
                    so it is addressable: a link to someone's access opens on
                    them. The SELECTION beside it is deliberately not here —
                    ticking three rows is a gesture mid-operation, and
                    restoring it on a fresh load would restore an intention the
                    reader no longer has. */
                 who: p.get('who') || '',
                 /* One key for every in-module filter set, as `key:value`
                    pairs — `f=role:Admin,status:Active`. One key rather than
                    one per control, because these are scoped to whichever
                    module is open and a dedicated key per filter would put
                    six dead parameters in the address bar of the five modules
                    that do not have them. Cleared whenever `m` changes. */
                 f: p.get('f') || '' };
    LIST_KEYS.forEach((k) => { st[k] = (p.get(k) || '').split(',').filter(Boolean); });
    DATE_KEYS.forEach((k) => { st[k] = p.get(k) || ''; });
    FLAG_KEYS.forEach((k) => { st[k] = p.get(k) === '1'; });
    st.q = p.get('q') || '';
    /* A custom property, as `key:value`. The mind map names custom properties
       alongside tags and types; making them filterable is the only way they are
       worth introducing at all. */
    st.prop = p.get('prop') || '';
    return st;
  }

  function readURL() { return parseParams(new URLSearchParams(location.search)); }

  /* Shared by the search input's debounce and by the two controls that cancel
     it — the × and Escape — so a pending keystroke cannot land after a clear
     and put the query back. */
  let Q_T = 0;

  /* True when the URL carries no filter at all — the landing case, where the
     surface composes a working set rather than showing the whole corpus. */
  function isComposed(st) {
    return !st.q && !st.mine && !st.archived && !st.prop &&
      LIST_KEYS.every((k) => !st[k].length) && DATE_KEYS.every((k) => !st[k]);
  }

  /* THE ONE SERIALIZER. `writeURL` puts this in the address bar, and a
     conversation stores it verbatim as the surface it was had on — so the two
     can never disagree about what a state looks like, and what a session
     restores is exactly what a pasted link would restore.

     Stored as this string rather than as a parsed object, because the string
     is what a pasted link already carries and there is then only one thing
     that can be wrong. */
  function serialize(st) {
    const p = new URLSearchParams();
    if (st.q) p.set('q', st.q);
    LIST_KEYS.forEach((k) => { if (st[k] && st[k].length) p.set(k, st[k].join(',')); });
    DATE_KEYS.forEach((k) => { if (st[k]) p.set(k, st[k]); });
    FLAG_KEYS.forEach((k) => { if (st[k]) p.set(k, '1'); });
    if (st.prop) p.set('prop', st.prop);
    if (st.doc) p.set('doc', st.doc);
    if (st.settings) p.set('settings', st.settings);
    if (st.view === 'tree') p.set('view', 'tree');
    if (st.by && st.by !== 'col') p.set('by', st.by);
    if (st.sort) p.set('sort', st.sort);
    if (st.chat) p.set('chat', st.chat);
    if (st.m) p.set('m', st.m);
    if (st.skill) p.set('skill', st.skill);
    if (st.part) p.set('part', st.part);
    if (st.node) p.set('node', st.node);
    if (st.role) p.set('role', st.role);
    if (st.vs) p.set('vs', st.vs);
    if (st.sc) p.set('sc', st.sc);
    if (st.sec) p.set('sec', st.sec);
    if (st.sp) p.set('sp', st.sp);
    if (st.crm) p.set('crm', st.crm);
    if (st.who) p.set('who', st.who);
    if (st.f) p.set('f', st.f);
    /* `lens` stood here. It addressed the Effective / Organization / Yours
       control on a skill's Precedence tab; precedence is two parties now and
       the control is gone, so the key goes with it rather than staying as a
       parameter nothing reads. */
    /* Prototype affordance, carried so a forced state survives a filter change
       and the degraded case can actually be driven rather than just looked at. */
    if (forcedState) p.set('state', forcedState);
    /* Commas and colons are left unencoded. A filter URL is meant to be read, pasted and
       written by hand as well as by an agent, and `type=article,ticket` is
       legible in a way `type=article%2Cticket` is not. Both parse identically. */
    return p.toString().replace(/%2C/g, ',').replace(/%3A/g, ':');
  }

  /* Set only while a conversation is being restored — see the `[data-chat]`
     handler. Module-level rather than an argument because `writeURL` is called
     from everywhere and only one caller has anything to say about this. */
  let restoring = false;

  /* Where the address bar currently points. The back button changes it before
     it tells us, so blocking a navigation means putting this back. */
  let hereURL = location.pathname + location.search;

  function writeURL(st, opt) {
    /* ── The canvas gets out of the way of its own results ──

       Anything that changes the page while the canvas is open was clicked IN
       the canvas — it is a full overlay, so nothing behind it is reachable —
       and the point of clicking it was to see what it did. This used to be ten
       scattered `canvas.close()` calls at ten call sites, which meant every new
       action arrived not closing it until somebody noticed.

       One rule at the funnel every URL change already goes through. `ask()`
       does not write the URL, so a follow-up answer still opens normally.

       AND ONE EXCEPTION. Switching conversations is the only URL change made
       in order to STAY in the canvas: it moves the surface underneath on
       purpose, because the surface is half of what a session is. Closing over
       the thread you just asked for would throw away the reason for the
       click. */
    if (!restoring && canvas && canvas.open) canvas.close();
    const qs = serialize(st);
    /* Recorded here rather than in rememberFilter, because the two want
       opposite ends of the same move: `lastFilter` is where you were, so it
       reads the URL before it changes, and a recent is a set you actually
       looked at, so it has to be the one being written. Hooking the funnel also
       means every path gets it — a typed phrase, a chip, a card's tag link and
       an insight's figure all land here. */
    /* `keepRecent` feeds the briefing's "Recent filters". A settings view is a
       place, not a set, so offering it back under that heading would be naming
       something that cannot be re-applied as a filter. */
    if (!restoring && !st.m) keepRecent(st);
    const url = location.pathname + (qs ? '?' + qs : '');
    if (opt && opt.replace) history.replaceState(null, '', url);
    else history.pushState(null, '', url);
    hereURL = url;
    render();
  }

  /* Merge a partial change into the current URL. Everything that mutates the
     surface goes through here, so there is exactly one writer. */
  function patch(changes, opt) {
    const st = readURL();
    const from = st.doc;
    Object.keys(changes).forEach((k) => { st[k] = changes[k]; });
    /* Changing a filter drops the open document: you asked to look at the set
       again, and leaving one document open on top of a set you can no longer
       see is the classic lost-place bug. */
    if (Object.keys(changes).some((k) => ALL_KEYS.indexOf(k) > -1)) st.doc = '';

    /* ── A filter and a settings module are two different places ──
       Changing a filter means you asked for the corpus again, so it drops the
       module for exactly the reason it drops the open document one line up.
       Opening a module drops the document, because both want the same stage.

       Changing module also clears what was open INSIDE the last one: a skill
       id left standing while `m` moved to `sync` addresses nothing, and the
       module would render its list with a detail param it cannot use. */
    if (Object.keys(changes).some((k) => ALL_KEYS.indexOf(k) > -1))
      SET_KEYS.forEach((k) => { st[k] = ''; });
    /* ── THE MODULE IS NOT DROPPED WHEN A DOCUMENT OPENS ──

       Opening a module drops the document "because both want the same stage",
       and for a moment this cleared `m` on the way in to say the same thing
       back. That fixed the stage and lost the way home: opened from Archive,
       the document's back button said *All documents*, because by then nothing
       remembered there had been an Archive.

       So `m` stays in the address and `render` gives the stage to the document
       instead — see `isDoc` there. `?doc=…&m=archive` is not a contradiction,
       it is a document open IN a module, and closing it falls back to the
       module it was opened from with no extra key to carry. */
    if (changes.m !== undefined) {
      st.doc = '';
      if (changes.skill === undefined) st.skill = '';
      /* `sp` deliberately SURVIVES a module change — it is the page's scope,
         not the module's, and re-asking which product on every rail click is
         the flow this replaced. `crm` does not: it means nothing outside
         Config. */
      if (changes.crm === undefined) st.crm = '';
      if (changes.who === undefined) st.who = '';
      /* A page id belongs to the module that lists it. `sec=webhooks` carried
         into Connections names nothing there, and the module would fall back
         to its first page anyway — silently, with a dead key in the URL. */
      if (changes.sec === undefined) st.sec = '';
      /* A filter set belongs to the module that drew the controls. Carrying
         `role:Admin` from People into Skills would narrow a list by a key it
         has never heard of, invisibly. */
      if (changes.f === undefined) st.f = '';
    }
    /* ── Nothing leaves a document with unsaved changes ──

       Every way out of a document ends up here — the back button in the top
       bar, a filter chip, a citation, a card, an answer that opens something
       else — because this is the one writer of the URL. So this is the one
       place the question has to be asked, and asking it here means no route
       can be added later that forgets to.

       The change is not thrown away while the question is open: it is replayed
       verbatim once it has been answered, so whatever you clicked still
       happens, and it happens to the document you decided about. */
    if (!(opt && opt.pastGuard) && from && st.doc !== from && isDirty(byId(from))) {
      guardLeave(() => patch(changes, Object.assign({}, opt, { pastGuard: true })));
      return;
    }
    /* The type-switch note describes a switch you JUST made. Leaving the
       document ends "just", so it does not wait on the object to be reopened
       days later and announce itself as news. */
    if (changes.doc !== undefined && switchNoted && switchNoted.doc !== changes.doc) switchNoted = null;
    /* An unfolded row belongs to the document it was unfolded on. Left set,
       the next document that happens to have a field of the same name would
       open with that row already unfolded and the caret in it, which is a
       different document answering for a click made on this one. */
    if (changes.doc !== undefined) { openXField = null; openProp = null; }
    writeURL(st, opt);
  }

  /* ═══════════════════════════════════════════════
     FILTERING
  ═══════════════════════════════════════════════ */
  /* Scalar axes — one value per object. */
  const FIELD_OF = { type: 't', source: 'src', client: 'client', product: 'prod',
                     collection: 'col', status: 'status', region: 'region' };
  /* Multi-value axes — a set per object, matched on any overlap. */
  const MULTI_OF = { tag: 'tags', service: 'services', audience: 'aud', group: 'groups' };
  const DATE_FIELD = { updated: 'upd', ingested: 'ing', extCreated: 'xc', extUpdated: 'xu' };

  /* ══ DOCUMENTS YOU WROTE HERE COME BACK ════════════════════════════

     THE LINE IS "CREATED HERE", NOT "CHANGED HERE". The forty-odd fixtures
     above are the demo corpus and they reset, which is honest — nobody expects
     a tweak to somebody else's seeded article to still be there tomorrow. A
     document YOU made is different in kind: it existed nowhere before you
     wrote it, so losing it on a reload is not a reset, it is a deletion you did
     not ask for. That asymmetry became visible the moment Sales picks started
     persisting: tick a Product you wrote, reload, and the pick survived while
     the product did not.

     RESTORED HERE, and the position is load-bearing in two directions. Above
     this line `CORPUS.forEach` seeds comments and versions onto every entry,
     and a restored document carries its OWN — seeding it would wipe the note
     you left on it. Below this line `ENTITLED` and `LIVE` are derived from
     CORPUS, so anything pushed after them is invisible to every count, filter
     and search on the surface. Between the two is the only correct place.

     `made` marks them rather than the `new-` id shape. The id is a detail of
     how they are numbered; whether a person made it is the fact being stored,
     and the two should not be the same assertion. */
  const DOC_STORE = 'aimy-k-docs';

  function loadDocs() {
    let raw = null;
    try { raw = localStorage.getItem(DOC_STORE); } catch (e) { return; }
    if (!raw) return;
    let d;
    try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d || d.v !== 1 || !Array.isArray(d.docs)) return;
    d.docs.forEach((o) => {
      /* A record whose type this build no longer has would render through the
         article fallback and read as a document that silently changed kind, so
         it is dropped instead. Same for a collection this reader cannot see:
         `ENTITLED` would filter it out one line below anyway, and keeping it in
         CORPUS would only inflate the withheld count. */
      if (!o || typeof o.id !== 'string' || !TYPES[o.t]) return;
      if (byId(o.id)) return;
      /* The shapes the surface indexes into without checking. A stored record
         is the one input here that did not come from this file. */
      o.tags = Array.isArray(o.tags) ? o.tags : [];
      o.services = Array.isArray(o.services) ? o.services : [];
      o.aud = Array.isArray(o.aud) ? o.aud : [];
      o.groups = Array.isArray(o.groups) ? o.groups : [];
      o.comments = Array.isArray(o.comments) ? o.comments : [];
      o.versions = Array.isArray(o.versions) ? o.versions : [];
      o.x = (o.x && typeof o.x === 'object') ? o.x : {};
      o.props = (o.props && typeof o.props === 'object') ? o.props : {};
      o.made = 1;
      CORPUS.push(o);
    });
  }
  loadDocs();

  /* Written from CORPUS, so a delete needs no hook of its own: a document that
     has been spliced out simply is not in the next save. Debounced and
     compared against the last write, because the only caller is `render`,
     which runs on navigations that changed nothing. */
  let docSaveTimer = null, docSaveLast = null;
  function saveDocs() {
    let out;
    try {
      out = JSON.stringify({ v: 1, docs: CORPUS.filter((o) => o.made) });
    } catch (e) { return; }
    if (out === docSaveLast) return;
    try { localStorage.setItem(DOC_STORE, out); docSaveLast = out; } catch (e) {}
  }
  function scheduleDocSave() {
    if (docSaveTimer) clearTimeout(docSaveTimer);
    docSaveTimer = setTimeout(saveDocs, 400);
  }

  /* Entitlement is a hard filter and must be visibly true: a briefing or a
     result set that silently includes inaccessible material is both a trust
     failure and a leak. Applied before anything the user typed. */
  const ENTITLED = CORPUS.filter((o) => USER.collections.indexOf(o.col) > -1);
  const WITHHELD = CORPUS.length - ENTITLED.length;
  /* What the surface counts and composes from. Archived objects are entitled
     and reachable, but they are not part of the live corpus and must not be
     counted as though they were. */
  const LIVE = ENTITLED.filter((o) => !o.arch);

  /* ── What a search actually searches ──

     Title and CONTENT, which is what the research says and what anybody typing
     a phrase assumes. It was title + summary + tags, and the summary is not the
     content: `o.sum` is the first paragraph, and `o.html` is the document — so
     searching for a phrase that appears three paragraphs down returned nothing
     and read as an empty corpus rather than as a search that never looked.

     The type record goes in too. A ticket's resolution, an ICP's segment, a
     story's outcome and a blog's author are the most searchable text those
     types have, and none of it is in the prose: `sum` on a ticket is the
     customer's question, not how it was closed.

     Tags stay. They are what somebody filed it under, which is a legitimate
     thing to search by even though `tag=` can also filter by it exactly. */
  const haystack = (o) => [
    o.title,
    o.sum,
    stripTags(o.html),
    o.tags.join(' '),
    Object.keys(o.x || {}).map((k) => {
      const v = o.x[k];
      return Array.isArray(v) ? v.join(' ') : String(v == null ? '' : v);
    }).join(' '),
    Object.keys(o.props || {}).map((k) => k + ' ' + o.props[k]).join(' ')
  ].join(' ').toLowerCase();

  function applyFilters(st) {
    /* `ids` is exclusive by design. It is how an answer puts its own sources on
       the surface, and mixing it with the filters that were active beforehand
       would show a set that is neither the answer's nor yours. */
    if (st.ids.length) return st.ids.map(byId).filter(Boolean);

    /* Archived content is out of the way, not gone. It stays addressable and
       restorable, and asking for it is one parameter. */
    let out = ENTITLED.filter((o) => (st.archived ? o.arch : !o.arch));
    if (st.mine) out = out.filter((o) => responsible(o) === USER.owner);
    Object.keys(FIELD_OF).forEach((k) => {
      if (st[k] && st[k].length) out = out.filter((o) => st[k].indexOf(o[FIELD_OF[k]]) > -1);
    });
    Object.keys(MULTI_OF).forEach((k) => {
      if (st[k] && st[k].length) out = out.filter((o) => st[k].some((v) => o[MULTI_OF[k]].indexOf(v) > -1));
    });
    DATE_KEYS.forEach((k) => {
      const v = st[k];
      if (!v) return;
      if (WINDOWS[v]) { out = out.filter((o) => o[DATE_FIELD[k]] <= WINDOWS[v]); return; }
      const m = RANGE_RE.exec(v);
      if (!m) return;
      /* Stored as days-before-today, so the OLDER end is the larger number. */
      const older = offsetOf(m[1]), newer = offsetOf(m[2]);
      out = out.filter((o) => o[DATE_FIELD[k]] <= older && o[DATE_FIELD[k]] >= newer);
    });
    if (st.prop) {
      const [pk, pv] = st.prop.split(':');
      out = out.filter((o) => o.props[pk] !== undefined && (!pv || String(o.props[pk]).toLowerCase() === pv.toLowerCase()));
    }
    if (st.q) {
      const q = st.q.toLowerCase();
      out = out.filter((o) => haystack(o).indexOf(q) > -1);
    }
    return out;
  }

  /* What needs a person, ranked. Used for the composed landing set and for the
     "needs attention" sort — one definition, so the two cannot disagree. */
  const NEED_SCORE = { outdated: 5, conflicting: 5, draft: 3, unowned: 2, unused: 2, superseded: 1, current: 0 };
  const WORK_SCORE = { failed: 4, drafted: 3, detected: 3, recommended: 2, completed: 0 };
  const needScore = (o) =>
    (NEED_SCORE[o.status] || 0) + (WORK_SCORE[o.work] || 0) + (responsible(o) === USER.owner ? 2 : 0);

  /* Nine exemplars plus nine attention picks. It was 12, which is the right
     number for a set that is only "what needs you" and three short of a set
     that has to cover the taxonomy first. The cap is still STATED on the
     surface rather than applied quietly — the count line prints the length. */
  const COMPOSED_CAP = 18;

  function sortSet(list, sort) {
    const s = list.slice();
    /* Status leads, and then needScore breaks the tie. Ranking on needScore
       alone let the "+2 because it is yours" and the work state outweigh the
       status: an unowned document sat below four documents with nothing wrong,
       which is not what a control called Needs attention can mean. Severity
       first, then whose it is. */
    if (sort === 'attention') return s.sort((a, b) =>
      (NEED_SCORE[b.status] || 0) - (NEED_SCORE[a.status] || 0)
      || needScore(b) - needScore(a)
      || a.upd - b.upd);
    if (sort === 'title') return s.sort((a, b) => a.title.localeCompare(b.title));
    return s.sort((a, b) => a.upd - b.upd);           // most recently updated first
  }

  /* ── One of every kind, before anything else ──

     The landing set was yours-first, attention-ranked, capped at twelve — and
     it showed four of the nine types. Five kinds of document existed in the
     product and could not be seen without typing a filter for a type you had
     to already know was there. A taxonomy nobody can see is a taxonomy nobody
     trusts.

     So the set opens with one document of every type, in TYPES order, and the
     ranked composition follows underneath it. Which document represents a type
     is DERIVED, not a list of ids: whichever one of that type has a written
     body, and among those the one the ordering already puts first. That keeps
     the guarantee true when the corpus changes — write a fuller ICP tomorrow
     and it becomes the ICP on the landing page without anybody editing this
     function — and it degrades honestly, falling back to the best-ranked
     document of the type when none of them has been written out.

     `sort` still reaches both halves: it picks the exemplar within each type
     and it orders the tail. The toggle stays a live control, which is what the
     result line promises it is. */
  const isWritten = (o) => !!(o.html || '').trim();

  function typeExemplars(sort) {
    return Object.keys(TYPES).map((t) => {
      const of = sortSet(LIVE.filter((o) => o.t === t), sort);
      return of.filter(isWritten)[0] || of[0];
    }).filter(Boolean);
  }

  /* The landing set: one of every kind, then what you own or touched, ranked
     by what needs you. The cap is stated on the surface rather than applied
     quietly — a list that hides its tail overstates how contained the problem
     is.

     The order is passed in rather than hard-coded, so one function decides it
     for every surface and the toggle is a live control here too. */
  function composedSet(sort) {
    const lead = typeExemplars(sort);
    const left = LIVE.filter((o) => lead.indexOf(o) === -1);
    const mine = left.filter((o) => responsible(o) === USER.owner || USER.recent.indexOf(o.id) > -1);
    const rest = left.filter((o) => mine.indexOf(o) === -1);
    return lead.concat(sortSet(mine, sort), sortSet(rest, sort)).slice(0, COMPOSED_CAP);
  }

  /* Absent means "this surface's default": the composed set leads with what
     needs a person, a filtered set with what changed last. */
  const orderOf = (st, composed) => st.sort || (composed ? 'attention' : 'updated');

  /* ═══════════════════════════════════════════════
     THE INPUT — one field, four routes

     Routing is decided on the shape of what was typed, never on a mode
     switch. Each route is a classified entry mode, and three of the four never
     open the canvas — which is the rule the previous build broke.
  ═══════════════════════════════════════════════ */

  /* The lexicon. Everything the input can recognise is declared here, so what
     the parser understands and what the chip bar can show are the same list. */
  const LEX = [
    /* The old vocabulary still arrives — people type what the last build
       taught them — so it is mapped to the nearest thing that now exists
       rather than silently matching nothing. */
    [/\bexpired\b|\bstale\b/i,            { status: 'outdated' }],
    [/\bunverified\b|\bnever verified\b/i,{ status: 'unowned' }],
    [/\bsuperseded\b|\breplaced\b/i,      { status: 'superseded' }],
    [/\bverified\b/i,                     { status: 'current' }],
    // types
    [/\barticles?\b/i,                    { type: 'article' }],
    [/\btickets?\b/i,                     { type: 'ticket' }],
    [/\bicps?\b|\bideal customer\b/i,     { type: 'icp' }],
    [/\bcampaigns?\b/i,                   { type: 'campaign' }],
    [/\b(?:marketing )?assets?\b|\bcollateral\b/i, { type: 'asset' }],
    /* Every word anybody uses for one, including the format itself — "the pptx"
       is what somebody types when they are looking for the deck. */
    [/\bpresentations?\b|\bdecks?\b|\bpptx?\b|\bpower ?points?\b|\bslides?\b/i, { type: 'pptx' }],
    [/\bsuccess stor(?:y|ies)\b|\bcase stud(?:y|ies)\b/i, { type: 'story' }],
    [/\bblogs?(?: posts?)?\b/i,           { type: 'blog' }],
    [/\bweb ?pages?\b|\bpages?\b/i,       { type: 'webpage' }],
    // sources
    [/\bteam ?support\b/i,                { source: 'teamsupport' }],
    [/\bconfluence\b/i,                   { source: 'confluence' }],
    [/\bfresh ?desk\b/i,                  { source: 'freshdesk' }],
    [/\bcrawl(?:ed|er)?\b|\bwebsite\b/i,  { source: 'web' }],
    [/\buploaded?\b|\bmanual\b/i,         { source: 'upload' }],
    // products
    [/\bcopilot\b/i,                      { product: 'copilot' }],
    [/\bvoice\b/i,                        { product: 'voice' }],
    [/\bsales\b/i,                        { product: 'sales' }],
    // clients
    [/\bnordwind\b/i,                     { client: 'nordwind' }],
    [/\btavola\b/i,                       { client: 'tavola' }],
    [/\bmeridian\b/i,                     { client: 'meridian' }],
    [/\borbit\b/i,                        { client: 'orbit' }],
    // the tenancies, which are clients like any other
    [/\bflairstech\b|\bflairs\b/i,        { client: 'flairs' }],
    [/\bcxs\b/i,                          { client: 'cxs' }],
    [/\bupland\b/i,                       { client: 'upland' }],
    [/\bmedfar\b/i,                        { client: 'medfar' }],
    /* Named in full, and read BEFORE the collections below — the lexicon eats
       what it matches, so "support leads" has to be spent as a group before
       the bare word support is spent as a collection. */
    [/\bqa reviewers?\b/i,                 { group: 'qa' }],
    [/\bsupport leads?\b/i,                { group: 'leads' }],
    [/\baccount managers?\b/i,             { group: 'am' }],
    [/\bsolution engineers?\b/i,           { group: 'se' }],
    // collections
    [/\bpolic(?:y|ies)\b/i,               { collection: 'policies' }],
    [/\bsupport\b/i,                      { collection: 'support' }],
    [/\bmarketing\b/i,                    { collection: 'marketing' }],
    // tags
    [/\brefunds?\b/i,                     { tag: 'refunds' }],
    [/\bwarrant(?:y|ies)\b/i,             { tag: 'warranty' }],
    [/\bsso\b|\bsingle sign-?on\b/i,      { tag: 'sso' }],
    [/\bgdpr\b|\bresidency\b/i,           { tag: 'gdpr' }],
    [/\bsecurity\b/i,                     { tag: 'security' }],
    [/\bbilling\b|\bproration\b/i,        { tag: 'billing' }],
    [/\bpricing\b/i,                      { tag: 'pricing' }],
    [/\bsla\b/i,                          { tag: 'sla' }],
    [/\bonboarding\b/i,                   { tag: 'onboarding' }],
    [/\benterprise\b/i,                   { tag: 'enterprise' }],
    [/\bchurn\b/i,                        { tag: 'churn' }],
    [/\beu\b|\beurope(?:an)?\b/i,         { tag: 'eu' }],
    // region — the mind map's own axis on ICP and Success Story
    [/\bemea\b/i,                         { region: 'emea' }],
    [/\bapac\b/i,                         { region: 'apac' }],
    [/\bamericas?\b|\bnorth america\b/i,  { region: 'amer' }],
    [/\bglobal\b/i,                       { region: 'global' }],
    /* Services are named in full. The bare words — qa, voice — are already
       tags, and mapping one word onto two axes would AND them together and
       return nothing, which reads as an empty corpus rather than a collision. */
    [/\bquality assurance\b/i,            { service: 'qa' }],
    [/\bvoice operations\b/i,             { service: 'voice' }],
    [/\bsupport delivery\b/i,             { service: 'support' }],
    [/\bcx consulting\b/i,                { service: 'cx' }],
    [/\banalytics service\b/i,            { service: 'analytics' }],
    // audience — the Permission branch
    [/\bclient[- ]facing\b|\bvisible to clients\b|\bfor clients\b/i, { audience: 'clients' }],
    [/\badmins? only\b|\bfor admins?\b/i, { audience: 'admins' }],
    [/\bstakeholders?\b/i,                { audience: 'stakeholders' }],
    // archive
    [/\barchived?\b/i,                    { archived: true }],
    // dates — internal by default, external when the input says so
    [/\b(?:external(?:ly)?|at source|upstream)[^.]{0,16}\b(?:changed|updated)\b/i, { extUpdated: '30d' }],
    [/\bingested\b[^.]{0,16}\b(?:this month|last 30)\b/i, { ingested: '30d' }],
    [/\bingested\b[^.]{0,16}\b(?:this week|last 7)\b/i,   { ingested: '7d' }],
    [/\bingested\b/i,                     { ingested: '90d' }],
    [/\b(?:this|past|last) week\b|\blast 7 days\b/i,      { updated: '7d' }],
    [/\b(?:this|past|last) month\b|\blast 30 days\b/i,    { updated: '30d' }],
    [/\b(?:this|past|last) quarter\b|\blast 90 days\b/i,  { updated: '90d' }],
    [/\b(?:this|past|last) year\b/i,      { updated: '1y' }],
    // ownership
    [/\bmine\b|\bi own\b|\bmy own\b|\bowned by me\b/i,    { mine: true }],
    // status — the one state axis, so the words for it are worth knowing
    [/\bwaiting on (?:me|you)\b|\bnot live\b|\bdrafts?\b/i,  { status: 'draft' }],
    [/\bunused\b|\bnot used\b|\bstale\b|\bforgotten\b/i,      { status: 'unused' }],
    [/\bout of date\b|\boutdated\b|\bbehind\b/i,              { status: 'outdated' }],
    [/\bconflict(?:ing|s)?\b|\bcontradict\w*\b/i,             { status: 'conflicting' }],
    [/\bunowned\b|\bno owner\b|\bownerless\b/i,               { status: 'unowned' }],
    [/\bcurrent\b|\bhealthy\b/i,                              { status: 'current' }]
  ];

  const WRITE_VERB = /^(add|create|new|draft|archive|delete|remove|verify|re-?verify|review|publish|unpublish|expire|reassign|restore|approve|tag|untag|move)\b/i;
  const QUESTION   = /^(what|why|how|when|who|which|can|does|do|is|are|should|where|will)\b|^tell me\b|^explain\b|^summari[sz]e\b/i;

  /* Which route. Order matters: a write is checked first because "archive the
     expired ICPs" also parses as a filter, and running it as one would be a
     write silently reinterpreted as a read. */
  /* ── The fifth route: settings ──

     Settings are part of the surface, so the one input reaches them like it
     reaches everything else. It opens the sheet with the change STAGED rather
     than applied — you see what it will do to the control before it does it,
     which is the same courtesy the commit surfaces pay for bigger changes. */
  /* `archiv\w*` matched the past participle as well as the gerund, so typing
     "archived" — which the lexicon reads as a FILTER, and which is now the only
     way to reach archived documents since that dropdown left the row — opened
     the retention sheet instead. "Archiving" is the setting; "archived" is a
     state a document is in. The sheet is still one click away in the rail, and
     "archive the old ICPs" is a WRITE, which parseIntent checks first. */
  const SETTINGS_WORD = /\b(setting|settings|schedule|sync|retention|archiving|archival|grounding|connect|reconnect)\b/i;
  const CADENCE_WORD = [
    [/\bevery 15\b|\bquarter[- ]?hour|\b15 min/i, 'Every 15 minutes'],
    [/\bhourly\b|\bevery hour\b/i, 'Every hour'],
    [/\bevery 6\b|\bsix hours?\b/i, 'Every 6 hours'],
    [/\bdaily\b|\bevery day\b/i, 'Daily'],
    [/\bweekly\b|\bevery week\b/i, 'Weekly'],
    [/\bon demand\b|\bmanual(ly)?\b/i, 'On demand']
  ];

  function parseSettings(s) {
    if (!SETTINGS_WORD.test(s)) return null;
    const lower = s.toLowerCase();

    /* Which thing the sentence is about. A named source or collection wins; the
       word "archiving" or "retention" alone lands on the data sheet. */
    const srcKey = Object.keys(SRC).find((k) => lower.indexOf(SRC[k].label.toLowerCase()) > -1 || lower.indexOf(k) > -1);
    const colKey = Object.keys(COLLECTIONS).find((k) => lower.indexOf(COLLECTIONS[k].toLowerCase()) > -1);

    if (srcKey) {
      const hit = CADENCE_WORD.find(([re]) => re.test(s));
      return { route: 'settings', target: 'source:' + srcKey,
               stage: hit ? { key: 'cadence', value: hit[1] } : null };
    }
    if (colKey) {
      const months = (s.match(/\b(\d+)\s*(month|year)s?\b/i) || [])[0];
      const opt = months && RETAIN_OPTIONS.find(([, l]) => l.toLowerCase().indexOf(months.toLowerCase().replace(/s\b/, '')) > -1);
      return { route: 'settings', target: 'collection:' + colKey,
               stage: opt ? { key: 'retain', value: String(opt[0]) } : null };
    }
    if (/\barchiv|\bretention|\bdelet/i.test(s)) return { route: 'settings', target: 'data', stage: null };
    return null;
  }

  function parseIntent(text) {
    const s = text.trim();
    if (!s) return { route: 'empty' };

    if (WRITE_VERB.test(s)) return { route: 'write', verb: s.match(WRITE_VERB)[1].toLowerCase(), text: s };

    const set = parseSettings(s);
    if (set) return set;

    /* A known object: enough of a title to be a name rather than a keyword
       that happens to appear in one. */
    const lower = s.toLowerCase();
    const hits = LIVE.filter((o) => {
      const t = o.title.toLowerCase();
      return t.indexOf(lower) > -1 || lower.indexOf(t.slice(0, 14)) > -1;
    });
    if (hits.length === 1 && lower.length >= hits[0].title.length * 0.5) {
      return { route: 'object', id: hits[0].id };
    }

    /* Both routes parse filters. A question is not exempt from narrowing the
       surface — that is the whole point of one input serving both. */
    const parsed = parseFilters(s);
    if (QUESTION.test(s) || s.endsWith('?')) {
      /* Free text left over from a question is the question itself, and using
         it as a search term would filter the surface down to whichever
         documents happen to contain the words of the sentence. Drop it; the
         recognised axes are the only part that is a filter. */
      delete parsed.set.q;
      return Object.assign({ route: 'question', text: s }, parsed);
    }
    return Object.assign({ route: 'filter' }, parsed);
  }

  /* Natural language to filter state. Whatever the lexicon does not claim is
     left as free text, so a term the parser has never seen still narrows the
     surface instead of being silently dropped. */
  function parseFilters(s) {
    const set = {};
    let rest = ' ' + s + ' ';
    LEX.forEach(([re, out]) => {
      const m = rest.match(re);
      if (!m) return;
      Object.keys(out).forEach((k) => {
        const v = out[k];
        if (LIST_KEYS.indexOf(k) > -1) { set[k] = set[k] || []; if (set[k].indexOf(v) === -1) set[k].push(v); }
        else set[k] = v;
      });
      rest = rest.replace(re, ' ');
    });
    /* Words the lexicon already consumed the meaning of, plus the connective
       tissue around them. Left in, they become a free-text filter for a word
       nothing contains, and an empty result reads as an empty corpus. */
    const leftover = rest.replace(
      /\b(?:show|find|get|list|give|all|any|every|everything|anything|the|a|an|me|my|our|we|us|from|with|for|in|on|at|to|by|and|or|of|that|about|regarding|concerning|is|are|was|were|be|been|has|have|only|just|please|shared?|documents?|docs?|objects?|items?|content|stuff|services?|regions?|audiences?|updated?|changed?|ingested?|created?|modified|edited|synced?|review(?:ed)?|last|past|recent(?:ly)?|since|before|after|days?|weeks?|months?|years?|quarters?)\b/gi, ' ')
                         .replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (leftover.length > 2) set.q = leftover;
    return { set: set, matched: Object.keys(set).length > 0 };
  }

  /* AiMY's reading of what you typed, in the vocabulary of the filters. Shown
     because a surface that rearranged itself without saying what it understood
     is indistinguishable from one that misunderstood. */
  const READ_LABEL = {
    type: 'Type', tag: 'Tag', source: 'Source', client: 'Client', product: 'Product',
    collection: 'Collection', trust: 'Trust', work: 'Work state', q: 'Text',
    group: 'Group',
    region: 'Region', service: 'Service', audience: 'Audience', prop: 'Property',
    updated: 'Updated', ingested: 'Ingested', extCreated: 'Created at source',
    extUpdated: 'Changed at source', mine: 'Owner', ids: 'Documents',
    archived: 'Archive'
  };
  const VALUE_LABEL = {
    type: (v) => TYPES[v] ? TYPES[v].label : v,
    source: (v) => SRC[v] ? SRC[v].label : v,
    client: (v) => CLIENTS[v] || v,
    group: (v) => GROUPS[v] || v,
    product: (v) => PRODUCTS[v] || v,
    collection: (v) => COLLECTIONS[v] || v,
    status: (v) => STATUS[v] ? STATUS[v].label : v,
    work: (v) => WORK_LABEL[v] || v,
    region: (v) => REGIONS[v] || v,
    service: (v) => SERVICES[v] || v,
    audience: (v) => AUDIENCE[v] || v,
    tag: (v) => v,
    mine: () => USER.name,
    archived: () => 'Archived only'
  };
  function valueLabel(key, v) {
    if (DATE_KEYS.indexOf(key) > -1) return rangeLabel(v);
    const f = VALUE_LABEL[key];
    return f ? f(v) : String(v);
  }

  /* ═══════════════════════════════════════════════
     THE CHIP BAR — the URL, made removable

     Filter chips are `.ctx-chip`, the design system's "what the prompt can
     see" primitive. That is exactly what a filter is here: the set AiMY is
     looking at when it answers. One vocabulary for both.
  ═══════════════════════════════════════════════ */
  /* Collections and sources have something to say about themselves, so their
     chip's label opens that conversation. The × still just removes the filter.
     This is what replaced the panel: the entry point costs no chrome. */
  const TALKATIVE = ['collection', 'source'];

  function chip(key, value, label) {
    const talks = TALKATIVE.indexOf(key) > -1;
    return `<span class="ctx-chip${talks ? ' is-talkative' : ''}" data-chip="${esc(key)}" data-chip-val="${esc(value)}">
      <span class="ctx-ico">${ICO.tag.replace('<svg', '<svg width="10" height="10"')}</span>
      ${talks
        ? `<button class="ctx-ask" data-settings="${esc(key)}:${esc(value)}"
             title="Settings for ${esc(label)}"><span class="ctx-key">${esc(READ_LABEL[key] || key)}</span>${esc(label)}</button>`
        : `<span class="ctx-key">${esc(READ_LABEL[key] || key)}</span>${esc(label)}`}
      <button aria-label="Remove ${esc(READ_LABEL[key] || key)} ${esc(label)}" data-chip-drop>&times;</button></span>`;
  }

  /* Chips carry only what a dropdown cannot say. Everything a control can show,
     the control shows — a chip and a dropdown never state the same fact. */
/* The axes that still have a control of their own. A chip is suppressed for
   these while they hold ONE value, because the dropdown beside it is already
   showing that value and two statements of one fact is one too many.

   It has to track the filter row exactly. Nine axes left that row and kept
   their place on this list for as long as it took to notice: with no control
   to show them, `status=unowned` narrowed the set to two documents and put
   nothing on screen to say why, and the only way back was the browser's own
   back button. A filter with neither a control nor a chip is a filter that has
   silently taken something away.

   Lazy, because FACET_FILTERS is declared further down the file and a const
   that read it up here would be evaluated in its temporal dead zone. */
  const ddKeys = () => FACET_FILTERS.map((c) => c.key).concat(DATE_KEYS);

  function activeChips(st) {
    const out = [];
    if (st.ids.length) out.push(chip('ids', '', st.ids.length + ' from an answer'));
    LIST_KEYS.forEach((k) => {
      if (k === 'ids') return;
      /* One value on a dropdown axis is already on screen. Two or more is not —
         the control is single-select and can only show the first. */
      if (ddKeys().indexOf(k) > -1 && st[k].length < 2) return;
      (st[k] || []).forEach((v) => out.push(chip(k, v, valueLabel(k, v))));
    });
    /* One date axis is on the control. If a link or an agent set more than one,
       the rest become chips — a control that can only name one must not be the
       reason the others are invisible. */
    const shown = activeDateKey(st);
    DATE_KEYS.forEach((k) => {
      if (st[k] && k !== shown) out.push(chip(k, st[k], valueLabel(k, st[k])));
    });
    if (st.prop) out.push(chip('prop', st.prop, st.prop.replace(':', ' = ')));
    if (st.q) out.push(chip('q', st.q, '“' + st.q + '”'));
    return out;
  }

  function renderChips(st) {
    const host = $('#chipBar');
    if (!host) return;
    const chips = activeChips(st);
    if (!chips.length) { host.innerHTML = ''; return; }
    host.innerHTML = `<div class="chip-bar"><div class="ctx-chips">${chips.join('')}</div></div>`;
  }

  /* ═══════════════════════════════════════════════
     THE FILTER ROW

     The filters are controls, not just an outcome of typing. Someone who does
     not know the vocabulary can still narrow the surface, and someone who does
     can see what the vocabulary contains.

     This is also how AiMY reports what it understood. Typing "expired ICPs in
     emea" lights up Type, Status and Region — a prose restatement underneath
     was only ever needed because the controls were invisible.

     `.v2-dropdown` is the system's only select control and carries the whole
     keyboard model. It is strictly single-select and its change event only
     reports the label, so the machine value rides on `data-slug` and is read
     off the selected option rather than parsed back out of the label.
  ═══════════════════════════════════════════════ */
  const opts = (obj, order) => (order || Object.keys(obj)).map((k) => [k, typeof obj[k] === 'string' ? obj[k] : obj[k].label]);

  /* ── Five, and the reason the other nine left ──

     There were fourteen controls: five here, six behind a *More* disclosure,
     plus the date range, *Mine* and *More* itself. Measured, their intrinsic
     width came to 1146px in 991px of row — it had never fitted, which is what
     the disclosure was for.

     A filter can leave the row without leaving the product, because the input
     already speaks all of it. Checked against LEX before removing anything:
     status all seven, type all nine, source all five, client all four, product
     all three, region, service and audience complete, the date windows, `mine`
     and `archived`. Every key removed is typeable today.

     COLLECTION has now left too, and it is the one removal that costs reach:
     `collection` is the single axis the lexicon does not cover — policies,
     support and marketing are in it, sales and legal are not. It goes anyway,
     because it was answering a question this row is no longer the place for.
     Where a document is FILED is a fact about our shelving; who it is about,
     what it answers for and where it came from are facts about the document.
     The first is still on every card, still a chip, still an addressable
     entity with a settings page behind it — and now, with no control of its
     own, `?collection=` draws a chip rather than hiding behind a dropdown,
     which is the rule that has always governed a filter without a control.

     What stays is what you narrow by before you know what you are looking for:
     where it lives, what it is, what it is ABOUT, and when it moved. Everything
     else is a question about the set, and a question belongs in the thing that
     answers questions.

     DATA SOURCE takes the seat Collection left, and it is the axis the
     removal argued for: five connectors, each with its own health, cadence and
     failure — the corpus's most operational fact and the first cut somebody
     makes when a sync has gone wrong. "What did TeamSupport give us" is not a
     question about our filing, it is a question about the material, and until
     now the only way to ask it was to type the connector's name.

     Product and Client are that third clause, and they came back for it. They
     are not questions about the set — they are the ground a reader is already
     standing on when they arrive: someone who works one account and someone who
     works one product both begin by cutting the corpus down to theirs. And
     typeable is not the same as reachable. The four client slugs and the three
     product slugs appear nowhere else on the surface, so the lexicon could only
     be spoken by someone who already knew the words — which is the test the
     removal was supposed to apply and, for these two, got wrong.

     They cost far less room than the disclosure they replaced, and swapping
     Collection for Data Source did not change that arithmetic: the widest
     value on the new axis is *Website crawl*, and the widest on the old one
     was *Marketing*. Measured with Urbanist at 1536, the five controls take
     450.14px of the 1160px row while empty, and 725.92px carrying the longest
     value on every axis — Meridian Health, PowerSteering Service & Support,
     Website crawl, Marketing Asset and a named date range. One line either
     way, with the search field still beside them. The row wraps rather than
     overflows below that, reaching three lines on a 390px phone, where the
     tray and the input are the way in anyway.

     `work` is not migrated because it never worked: the key is absent from
     LIST_KEYS, so serialize never wrote it and parseParams never read it, and
     applyFilters has never mentioned it. Six options that filtered nothing. */
  /* ═══════════════════════════════
     ALL FOUR TAKE MORE THAN ONE ANSWER

     `.v2-dropdown` is strictly single-select and its panel closes on choose.
     Neither is a bug: it is the library's only select control, and it was the
     right one for Collection and Type for as long as those were believed to
     take one answer each. They are not. "Policies OR Legal" and "Tickets OR
     Articles" are the same shape of question as "Upland OR CXS", the URL has
     stored a LIST per axis since the beginning, and the chip bar has always
     been able to name several — the control was the only part that could not
     say it, and a control that can only say one thing quietly teaches that only
     one thing can be asked.

     So the row has one kind of control now rather than two. Four multi-selects
     and the date range, which is the odd one out for a real reason: WHEN is a
     range, not a set, and four windows on one axis is a contradiction rather
     than a union.

     So this is a product extension standing beside the library's dropdown, not
     a fork of it, on the same reasoning the date range was: it borrows the
     panel's shape and the search field, adds the checkbox, the group heading
     and *Select all*, and is recorded in GAPS.md as the multi-select the system
     does not ship. Nothing here reaches into `.v2-dropdown`, so the library's
     keyboard model and close-on-choose stay exactly as they were for the
     controls that want them.

     The panel is rendered OPEN from module state rather than toggled by a
     class, because choosing a value writes the URL and a write repaints the
     row — a panel owned by the DOM would close on every tick. `calOpen` solved
     the same problem for the calendar and this follows it.
  ═══════════════════════════════ */
  let facetOpen = null;
  let facetQuery = '';

  /* Clients are one flat list. Products are grouped, and the grouping is the
     connection the row is being asked for: a client's own products, then the
     ones nobody owns, then ours.

     Choosing clients SCOPES the list — other clients' products leave it rather
     than sit there reading zero, because a product belonging to another tenant
     is not a narrower slice of what you are looking at, it is somebody else's
     shelf. Standalone and AiMY never leave: they belong to no client, so no
     choice of client can exclude them. */
  function clientGroups() {
    return [{ label: '', items: opts(CLIENTS) }];
  }

  /* Data Source and Type have nothing to group BY — no owner, no hierarchy — so
     they are one untitled list each, which is what `is-untitled` renders
     without a heading and without a divider when it stands alone. */

  /* Sources that ENTITLED actually holds. The same rule the collection filter
     was built on and the reason it could be dropped without taking anything
     with it: a row for a source whose every document sits in a collection this
     reader cannot open is a filter that can only ever return nothing.

     Read off the corpus rather than off `SRC`, so a connector added to the
     fixture with nothing ingested yet does not put an empty row on the panel.
     `SRC`'s own key order decides the order on screen — the connectors are
     listed there in the order the product presents them everywhere else. */
  function sourceGroups() {
    const live = Object.keys(SRC).filter((k) => ENTITLED.some((o) => o.src === k));
    return [{ label: '', items: opts(SRC, live) }];
  }

  function typeGroups() {
    return [{ label: '', items: opts(TYPES) }];
  }

  function productGroups(st) {
    const sel = st.product || [];
    const chosen = (st.client || []).filter((c) => CLIENT_PRODUCTS[c]);
    const owners = chosen.length ? chosen : Object.keys(CLIENT_PRODUCTS);
    const groups = owners.map((c) => ({ label: CLIENTS[c] || c, items: opts(CLIENT_PRODUCTS[c]) }));

    /* A product already CHOSEN stays on the list even when its owner has been
       scoped out from under it. Pick Kapost, then narrow the clients to CXS,
       and scoping alone would take Kapost off the panel while it carried on
       filtering the grid — an active filter with no control and no chip, which
       is the one thing this row is not allowed to do. It comes back under its
       owner's name, alone rather than with its thirteen siblings, so the list
       still says whose it is without un-scoping anything you did not choose. */
    Object.keys(CLIENT_PRODUCTS).forEach((c) => {
      if (owners.indexOf(c) > -1) return;
      const kept = opts(CLIENT_PRODUCTS[c]).filter(([slug]) => sel.indexOf(slug) > -1);
      if (kept.length) groups.push({ label: CLIENTS[c] || c, items: kept });
    });
    /* No heading on the unowned ones. Every other group is headed by the client
       that owns it, and there is no client to name here — a word like
       "Standalone" in that position reads as one more owner. They take a
       hairline instead, which separates without claiming anything. */
    groups.push({ label: '', items: opts(STANDALONE_PRODUCTS) });
    groups.push({ label: 'AiMY', items: opts(AIMY_PRODUCTS) });
    return groups;
  }

  /* The order is the order a reader arrives in: whose it is, what it answers
     for, where it came from, what it is — then when it moved, which the date
     control adds on the end. Client and Product lead because they are the
     ground somebody is already standing on; Data Source and Type are questions
     about the material itself and only get asked once the account is chosen. */
  const FACET_FILTERS = [
    { key: 'client',  label: 'Client',      groups: clientGroups },
    { key: 'product', label: 'Product',     groups: productGroups },
    { key: 'source',  label: 'Data Source', groups: sourceGroups },
    { key: 'type',    label: 'Type',        groups: typeGroups }
  ];

  /* ── Keeping the pair answerable ──

     Client and Product are not independent, and not simply nested either. A
     client-owned product belongs to exactly ONE client, so `client=CXS` with
     `product=Kapost` is not a narrow question — Kapost is Upland's, and the
     pair can only ever return nothing. The other half of the vocabulary is the
     opposite: Copilot is ours and answers under every client, so choosing it
     implies nothing about whose the document is. The corpus says the same —
     twelve documents pair a client with an AiMY product against seven with the
     client's own — so treating Client as a master and Product as its detail
     would be wrong more often than right. These rules touch OWNED products
     only.

       a chosen product puts its owner in the client filter
       dropping a client drops the products it owns

     Both sit out while no client is chosen, because an empty client filter
     excludes nobody and there is nothing to contradict. That is what keeps
     "I just want Kapost" from lighting up a client nobody asked for.

     Worth knowing which way round the trouble actually arrives, because it is
     not symmetrical. Choosing the client first cannot produce the bad pair —
     scoping has already taken the other clients' products off the list, so
     there is nothing wrong left to press. It comes from the other order:
     choose Kapost while the row is open, then add CXS. The one exception is a
     client that owns nothing at all, where the list falls back to every owner
     and a foreign product is reachable again. Both routes land in the same
     rule.

     What this is NOT is a reset. Clearing Product whenever Client changed was
     the obvious fix and the wrong one: it makes the row ORDER-DEPENDENT, so
     client-then-product would land somewhere other than product-then-client,
     and a filter is a set of conditions rather than a sequence of moves.
     Nothing here removes anything the reader did not remove themselves.

     It runs on interaction only. A link that arrives already contradicting
     itself is left alone — rewriting what a link asked for is the one thing
     the URL contract does not allow — and `productGroups` keeps the orphan
     listed under its owner so it can still be taken off. */
  function reconcileScope(st, droppedClient) {
    if (droppedClient) {
      st.product = st.product.filter((v) => CLIENT_OF_PRODUCT[v] !== droppedClient);
    }
    if (!st.client.length) return st;
    st.product.forEach((v) => {
      const owner = CLIENT_OF_PRODUCT[v];
      if (owner && st.client.indexOf(owner) === -1) st.client = st.client.concat([owner]);
    });
    return st;
  }

  /* ═══════════════════════════════════════════════
     DATE RANGE — the design system's .cal, given two ends

     The library ships `.cal` as a single-date month calendar: head with two
     nav buttons, a seven-column grid, and `.muted` / `.today` / `.selected`
     days. Every one of those parts is used here unchanged. What it does not
     ship is a RANGE — there is no start, no end, and nothing to draw the days
     between — so those three states are added as a product extension and
     recorded in GAPS.md rather than quietly forked.

     The trigger is the same `.v2-dropdown-btn` the other filters use. A filter
     row where one control looks foreign is worse than one that is slightly
     less literal about what opens underneath it.

     Both shapes live in the same URL key: `updated=30d` is a rolling window and
     `updated=2026-06-01..2026-07-30` is a fixed range. The tokens stay because
     chat writes them ("updated this year") and because a rolling window is a
     different question from a fixed one — "the last 7 days" keeps meaning the
     last 7 days tomorrow, and a range does not.
  ═══════════════════════════════════════════════ */
  const RANGE_RE = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/;
  const iso = (d) => d.toISOString().slice(0, 10);
  /* Everything on an object is stored as days-before-today, so a date coming
     out of the calendar is converted once, here, and never again. */
  const offsetOf = (isoStr) => Math.round((TODAY.getTime() - new Date(isoStr + 'T00:00:00Z').getTime()) / dayMs);

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const rangeLabel = (v) => {
    const m = RANGE_RE.exec(v || '');
    if (!m) return WINDOW_LABEL[v] || v;
    const a = new Date(m[1] + 'T00:00:00Z'), b = new Date(m[2] + 'T00:00:00Z');
    const opt = { day: 'numeric', month: 'short', timeZone: 'UTC' };
    const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
    return a.toLocaleDateString('en-GB', opt) + ' – ' +
      b.toLocaleDateString('en-GB', sameYear ? opt : Object.assign({ year: 'numeric' }, opt));
  };

  /* Which calendar is open, which month it is showing, and the first end of a
     range that has been started but not finished. View state, so none of it is
     in the URL — a half-picked range is not a thing to link to. */
  let calOpen = null;
  let calMonth = null;
  let calPick = null;

  /* Four axes, one control. Four separate pickers put four pieces of furniture
     on the row to ask one question — WHEN — and only ever answered it about one
     of them at a time anyway. The axis is a choice inside the control now, and
     choosing a different one moves the value rather than adding a second
     filter. All four keys stay in the URL, so a link or an agent can still set
     any of them; if a link sets more than one, the extras show as chips rather
     than disappearing behind a control that can only name one. */
  const DATE_FILTERS = [
    { key: 'updated',    label: 'Updated',    short: 'Updated' },
    { key: 'ingested',   label: 'Ingested',   short: 'Ingested' },
    { key: 'extCreated', label: 'Created at source', short: 'Created' },
    { key: 'extUpdated', label: 'Changed at source', short: 'Changed' }
  ];

  /* Which axis the control is editing. Defaults to whichever one already
     carries a value, so opening it lands on what you can see. */
  let dateField = null;
  const activeDateKey = (st) => (DATE_FILTERS.find((f) => st[f.key]) || DATE_FILTERS[0]).key;

  function calGrid(key, cur) {
    const m = RANGE_RE.exec(cur || '');
    const startOff = m ? offsetOf(m[2]) : null;          // newer end = smaller offset
    const endOff   = m ? offsetOf(m[1]) : null;          // older end = larger offset
    const pickOff  = calPick !== null ? calPick : null;

    const view = calMonth || new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), 1));
    const y = view.getUTCFullYear(), mo = view.getUTCMonth();
    const first = new Date(Date.UTC(y, mo, 1));
    const lead = first.getUTCDay();
    const days = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    const prevDays = new Date(Date.UTC(y, mo, 0)).getUTCDate();

    const cells = [];
    for (let i = lead - 1; i >= 0; i--) cells.push({ n: prevDays - i, muted: true, d: new Date(Date.UTC(y, mo - 1, prevDays - i)) });
    for (let i = 1; i <= days; i++)     cells.push({ n: i, muted: false, d: new Date(Date.UTC(y, mo, i)) });
    while (cells.length % 7) { const i = cells.length - lead - days + 1; cells.push({ n: i, muted: true, d: new Date(Date.UTC(y, mo + 1, i)) }); }

    return `<div class="cal">
      <div class="cal-head">
        <button class="cal-nav" type="button" data-cal-nav="-1" aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
        <div class="cal-title">${esc(MONTHS[mo])} ${y}</div>
        <button class="cal-nav" type="button" data-cal-nav="1" aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
      </div>
      <div class="cal-grid">
        ${DOW.map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells.map((c) => {
          const off = Math.round((TODAY.getTime() - c.d.getTime()) / dayMs);
          const future = off < 0;
          const isStart = off === startOff, isEnd = off === endOff;
          const between = startOff !== null && off < endOff && off > startOff;
          const isPick = pickOff !== null && off === pickOff;
          const cls = ['cal-day']
            .concat(c.muted ? ['muted'] : [])
            .concat(off === 0 ? ['today'] : [])
            .concat(isStart || isEnd || isPick ? ['selected'] : [])
            .concat(isEnd && startOff !== endOff ? ['range-start'] : [])
            .concat(isStart && startOff !== endOff ? ['range-end'] : [])
            .concat(between ? ['in-range'] : []);
          /* Nothing here has a date in the future, so offering one would be a
             control that can only ever return nothing. */
          return `<button class="${cls.join(' ')}" type="button" ${future ? 'disabled' : ''}
            data-cal-day="${iso(c.d)}" aria-label="${esc(fmtDate(off))}">${c.n}</button>`;
        }).join('')}
      </div>
      <div class="cal-hint">${calPick !== null
        ? 'Pick the second date.'
        : 'Pick two dates for a range.'}</div>
    </div>`;
  }

  function dateFilter(st) {
    const key = dateField || activeDateKey(st);
    const c = DATE_FILTERS.find((f) => f.key === key);
    const cur = st[key] || '';
    const open = calOpen === 'date';
    /* WINDOW_LABEL reads mid-sentence elsewhere ("updated in the last 30 days"),
       so it is sentence-cased here and nowhere else. */
    const raw = cur ? rangeLabel(cur) : '';
    const label = cur
      ? c.short + ' · ' + raw.charAt(0).toUpperCase() + raw.slice(1)
      : 'Any date';
    /* NOT .v2-dropdown-btn. In this design system that class carries behaviour,
       not just looks: aimy-ds.js binds every one of them on the page and then
       calls closest('.v2-dropdown'), which is null for anything that is not a
       listbox — it threw on the first click. The trigger is styled from the
       same tokens instead. Recorded in GAPS.md. */
    return `<div class="k-date${open ? ' is-open' : ''}" data-date-key="${key}">
      <button class="k-date-btn${cur ? ' active-filter' : ''}" type="button"
              aria-haspopup="dialog" aria-expanded="${open}" aria-label="${esc(c.label)}">
        ${ICO.clock.replace('<svg', '<svg class="k-date-ico" width="12" height="12"')}
        <span class="dd-label-text">${esc(label)}</span>
        ${ICO.chevron}
      </button>
      ${open ? `<div class="k-date-panel" role="dialog" aria-label="Date range">
        <div class="k-date-field">
          <span class="k-date-field-label">Which date</span>
          <div class="seg">
            ${DATE_FILTERS.map((f) => `<button class="seg-btn${f.key === key ? ' active' : ''}" type="button"
              data-date-field="${f.key}">${esc(f.short)}</button>`).join('')}
          </div>
        </div>
        <div class="k-date-body">
        <div class="k-date-quick">
          ${[['', 'Any time']].concat(Object.keys(WINDOW_LABEL).map((w) => [w, WINDOW_LABEL[w]]))
            .map(([slug, text]) => `<button class="k-date-q${slug === cur ? ' is-on' : ''}" type="button"
              data-date-set="${slug}">${esc(text.charAt(0).toUpperCase() + text.slice(1))}</button>`).join('')}
        </div>
        ${calGrid(key, cur)}
        </div>
      </div>` : ''}
    </div>`;
  }

  function facetVisible(c, st) {
    const q = facetOpen === c.key ? facetQuery.trim().toLowerCase() : '';
    const out = [];
    c.groups(st).forEach((g) => g.items.forEach(([slug, label]) => {
      if (!q || label.toLowerCase().indexOf(q) > -1) out.push(slug);
    }));
    return out;
  }

  /* Where focus goes after a repaint, in order of preference: the row just
     pressed if it survived, the search field if the list has one, and the
     trigger otherwise. The last is not a fallback for tidiness — a panel with
     no search field has nothing else focusable at the top, and without this it
     lands on `<body>`, which puts the whole keyboard model out of reach for
     exactly the short lists that were given no field. */
  const facetRefocus = (key, val) =>
    (val && $(`.k-facet.is-open [data-facet-val="${val}"]`))
    || $('.k-facet.is-open [data-facet-search]')
    || $(`[data-facet-key="${key}"] .k-facet-btn`);

  function facetControl(c, st) {
    const sel = st[c.key] || [];
    const open = facetOpen === c.key;
    const q = open ? facetQuery.trim().toLowerCase() : '';

    /* One value is named. Several cannot be — the button is one line — so it
       says how many and the chip bar does the naming, which is the same
       division of labour the single-select controls already use. */
    const label = !sel.length ? c.label
      : sel.length === 1 ? valueLabel(c.key, sel[0])
      : c.label + ' · ' + sel.length;

    const visible = facetVisible(c, st);
    const allOn = visible.length > 0 && visible.every((v) => sel.indexOf(v) > -1);

    /* Same threshold `.v2-dropdown` uses, and for the same reason: a search
       field over five collections is a box to look past rather than a way
       through. Counted across every group, because what the reader is deciding
       about is the length of the list, not the length of its longest section. */
    const total = c.groups(st).reduce((n, g) => n + g.items.length, 0);
    const searchable = total > 6;

    let hits = 0;
    const groups = c.groups(st).map((g) => {
      const rows = g.items.filter(([, text]) => !q || text.toLowerCase().indexOf(q) > -1);
      if (!rows.length) return '';
      hits += rows.length;
      return `<div class="k-facet-group${g.label ? '' : ' is-untitled'}">
        ${g.label ? `<div class="k-facet-group-label">${esc(g.label)}</div>` : ''}
        ${rows.map(([slug, text]) => {
          const on = sel.indexOf(slug) > -1;
          return `<div class="k-facet-opt${on ? ' is-on' : ''}" role="option"
            aria-selected="${on}" tabindex="-1" data-facet-val="${esc(slug)}">
            <span class="k-facet-check" aria-hidden="true"></span>
            <span class="k-facet-text">${esc(text)}</span></div>`;
        }).join('')}
      </div>`;
    }).join('');

    return `<div class="k-facet${open ? ' is-open' : ''}" data-facet-key="${c.key}">
      <button class="k-facet-btn${sel.length ? ' active-filter' : ''}" type="button"
              aria-haspopup="listbox" aria-expanded="${open}" aria-label="${esc(c.label)}">
        <span class="dd-label-text">${esc(label)}</span>
        ${ICO.chevron}
      </button>
      ${open ? `<div class="k-facet-panel" role="listbox" aria-multiselectable="true"
                     aria-label="${esc(c.label)}">
        ${searchable ? `<div class="dd-search">
          ${ICO.search.replace('<svg', '<svg width="12" height="12"')}
          <input type="text" placeholder="Search ${esc(c.label.toLowerCase())}"
                 aria-label="Search ${esc(c.label)}" value="${esc(facetQuery)}"
                 data-facet-search spellcheck="false" autocomplete="off">
        </div>` : ''}
        <button class="k-facet-all" type="button" data-facet-all>${allOn ? 'Clear all' : 'Select all'}</button>
        ${groups}
        <div class="dd-none"${hits ? ' hidden' : ''}>Nothing matches</div>
      </div>` : ''}
    </div>`;
  }

  function renderFilters(st) {
    const host = $('#filterBar');
    if (!host) return;
    const dirty = !isComposed(st);

    host.innerHTML = `
      <div class="filter-row">
        ${FACET_FILTERS.map((c) => facetControl(c, st)).join('')}
        ${dateFilter(st)}
        ${/* ── SEARCH IS NOT A FACET ──
              It sits in `.filter-row-end`, which already carries `margin-left:
              auto`, so it holds the right edge while the facets stay grouped
              at the left. That separation is the point: Client, Product,
              Data Source and Type each narrow to a value someone picked from a
              list the corpus supplied, and search narrows to whatever you
              typed. Sitting it fifth in that row would have made it look like
              a fifth facet with a very long menu.

              `q` was already real — it filters, it writes to the URL, it draws
              a chip. What it did not have was a control: the only way in was
              the ask bar at the foot of the page, which is a different
              gesture with a different result. */ ''}
        <span class="filter-row-end">
          ${/* A `div`, not a `label`: the clear button lives inside the field
                and an interactive control nested in a label is both invalid and
                ambiguous about what a click does. Click-to-focus is kept by the
                handler instead, which can tell the × from the padding. */ ''}
          <div class="k-search${st.q ? ' is-on' : ''}">
            ${ICO.search.replace('<svg', '<svg width="13" height="13" aria-hidden="true"')}
            <input class="k-search-i" type="search" value="${esc(st.q || '')}"
                   placeholder="Search documents…" data-q
                   autocomplete="off" spellcheck="false" aria-label="Search documents">
            ${/* Clears the QUERY only, and appears only when there is one. The
                  × is the reach-for gesture in a field you are typing in;
                  Escape does the same for the keyboard, and the chip below does
                  it for the reader who has already looked away. */ ''}
            ${st.q ? `<button class="k-search-x" type="button" data-q-clear
                      aria-label="Clear search">${ICO.x.replace('<svg', '<svg width="11" height="11"')}</button>` : ''}
          </div>
          ${/* Stays. It empties EVERYTHING, which is a different act from
                emptying the search box — and the facets are the case it exists
                for, so it must not vanish just because the × now handles the
                query. `isComposed` already counts every facet, date and flag. */ ''}
          ${dirty ? '<button class="k-clear" data-clear-all>Clear all</button>' : ''}
        </span>
      </div>`;
  }

  /* ═══════════════════════════════════════════════
     THE RAIL — and where the briefing went

     There was a *Since Thursday* block at the top of this rail: five findings
     in severity order, each with an action. It has been removed, and nothing
     it said has been lost.

     The reason is that it was the SECOND place saying it. `AiMY noticed` sits
     directly above the grid, reads the same needsYou() model, and says the
     same findings better in three respects — it is in the first person, its
     figures land on the sets they count, and it re-derives against whatever
     you have filtered to instead of announcing the whole corpus at you. Two
     panels computing one model on one screen is not redundancy the reader can
     use: it is the same news twice, and the rail's copy was the weaker of the
     two while occupying the more valuable column.

     One entry was NOT in needsYou(): *You were last reading X*. That is not a
     finding, it is a bookmark — it belongs with the recents below rather than
     at the head of a list of problems, and USER.recent already carries it.

     What is left in the rail is what is only here: the filters you have
     already composed, and the state of the sources feeding the corpus.
  ═══════════════════════════════════════════════ */
  /* Questions that arrived and found nothing. Rows rather than a sentence, so
     the count is derived and a corpus with no gap can say so — a real condition
     and an unreachable one while the number was written into the copy.

     Read by needsYou(), which is the only thing that reads it now. */
  const ASKED = [
    { topic: 'Data residency in APAC', n: 3,
      prompt: 'Draft an article covering data residency for APAC enterprise contracts' },
    { topic: 'Refunds on annual plans', n: 1,
      prompt: 'Draft an article covering refunds on annual plans' }
  ];

  function renderBrief(st) {
    const host = $('#brief');
    if (!host) return;

    /* The settings section, in place of "Sources & data". Same rail, same
       shape, one section further on: see `nav()` in settings.js. */
    const SET = window.AIMY_SETTINGS;

    host.innerHTML = `
      <!-- No identity block and no findings block. Who you are is in the
           topnav; what needs a person is in AiMY noticed, one column to the
           right and against the set you filtered to. This rail carries the two
           things that are only here. -->

      <!-- Nine filters left the row because the input already speaks them,
           which makes re-narrowing cheap to type and free to forget. This is
           the other half: the last five sets you looked at, named after what
           you filtered by, one click from being that set again.

           Nothing is saved and nothing is named — the list keeps itself, a
           repeat moves to the top rather than taking a second slot, and the
           sixth pushes the first out. It replaces "Resume your last filter",
           which was this with one slot. -->
      ${/* Not in settings. The list is five ways back into a filtered SET of
            documents, and settings has no set and no filters -- so every row
            in it would leave the page you are configuring, which is the one
            thing the rail's settings section exists to keep you on. It comes
            back the moment `m` is empty; nothing is forgotten, it is just not
            offered where it means nothing. */ ''}
      ${!st.m && recentFilters.length && isComposed(st) ? `
        <div class="brief-section-label">Recent filters</div>
        <div class="brief-recents">
          ${recentFilters.map((qs) => `<button class="brief-recent" data-recent="${esc(qs)}">
            <span class="brief-recent-t">${esc(recentLabel(qs))}</span>
          </button>`).join('')}
        </div>` : ''}

      <!-- ══ WHERE THE SETTINGS ARE ═══════════════════════════════════════
           This was "Sources & data": one row per connector, its health, and a
           Reconnect button, each name opening the per-source sheet. It is the
           settings NAVIGATION now — same rail, same section shape, same row
           density — because the sheet it opened only ever held a fraction of
           what a source needs, and eleven destinations were still sitting
           behind a dropdown under the account pill.

           Nothing is lost by the swap, it moves one level up: a connector that
           is down reads as "1 not connected" on Connections, and the row is the
           way to the screen that fixes it rather than to a sheet beside it. -->
      ${SET ? SET.nav(st) : ''}`;
  }


  /* ═══════════════════════════════════════════════
     THE BELL — what is still waiting on a person

     The rail says what CHANGED since Thursday. The bell says what is still
     OUTSTANDING, which is a different question and the only one worth putting
     a dot on the chrome for: a source that came back and a document that was
     published both leave the rail's story true and this one's false.

     Both read the same model, so the two can never contradict each other, and
     neither is a hand-written list that survives what it describes being
     fixed. The bell it replaces carried a hard-coded "3 notifications" and a
     red dot with nothing behind it — a count that is always three is not a
     count, and a dot nothing can clear is not a signal.

     Every row ends somewhere real, and which route it takes is the row's own
     business: a single report opens that document, a set becomes the surface,
     a question goes to the canvas. That is the same four-route contract the
     input bar honours, so the panel is not a fifth way to do things.
  ═══════════════════════════════════════════════ */
  /* ── Scoped, so the same eight findings can describe a filtered set ──

     This computed the whole corpus and only ever rendered into the bell and
     the briefing rail. The workbench — the surface somebody is actually
     looking at while they decide what to do — carried two bare counts and no
     interpretation of either, which is the "lonely insight" doctrine §1.1
     forbids, sitting on the busiest surface in the product.

     One argument fixes that. Called with a list, every finding is computed
     over THAT list, so the band above the grid re-derives as you filter and is
     about the set in front of you rather than about the corpus in general.
     Called with nothing it behaves exactly as before, which is what the bell
     and the briefing still do. */
  /* ── One finding, two routes ──

     The bell is on all three shells now, and only ONE of them can act on a row
     where it stands: the workbench has the grid a filter steers and the canvas
     an answer lands in. The gate has a canvas but no grid; settings has
     neither. A row that called `patch()` on either would rewrite the address
     bar and change nothing on screen — an inert control, which is the exact
     defect the bell was built to remove.

     So every row declares three things: `needs` is the surface its in-place
     route requires, `go` is that route, and `nav` is where it lands when the
     surface is absent. All three are written side by side on the row itself
     rather than switched on `id` further down, so a finding cannot be added
     later with only half a route. `go` and `nav` carry the same state, because
     the URL is the state — `nav` writes what `go` would have written.

     `needs` is what makes this two shells rather than one-and-the-rest. The
     gate has a CANVAS and no grid, and that is the whole of its difference: a
     row that asks a question is answered there, in the conversation, which is
     what the gate is for — and the answer's Apply button already carries its
     documents across to the Console rather than promising a grid that is not
     there. A row that FILTERS has nothing to steer, so it leaves. Settings has
     neither surface, so everything leaves.

     The two questions the console asks itself on arrival, `ask` and `stage`,
     are the only params here that are not filters: they are consumed and
     stripped the moment they land, so a reload does not re-ask. */
  const askHref  = (q) => 'console.html?ask=' + encodeURIComponent(q);
  const TRIAGE_Q = 'Across everything waiting on me right now, what should I do first and why?';
  const filtHref = (qs) => 'console.html?' + qs;

  /* Named once because each is asked by two routes, and a question that drifts
     between them is two findings wearing one label. */
  const NTF_Q = {
    source:      'Which sources stopped syncing, and what has it cost?',
    conflicting: 'Which documents contradict each other, and which one should win?',
    outdated:    'Which documents are out of date against their source?',
    unowned:     'Which documents are unowned, and who should own each one?',
    unused:      'Which documents has nobody used, and are any worth keeping?'
  };

  function needsYou(scope) {
    const out = [];
    const SET = scope || LIVE;
    const withStatus = (s) => SET.filter((o) => o.status === s);
    /* Counts here are the corpus's, not a fixture's, so every one of them can
       legitimately be 1 — and a row reading "1 documents" is a row nobody
       believes the rest of. */
    const docs = (n) => n + (n === 1 ? ' document' : ' documents');
    const is = (n, one, many) => (n === 1 ? one : many);

    /* A dead source leads whether or not it has cost a document yet: it is the
       only entry here that keeps getting worse while you read the others. */
    const failing = Object.keys(SRC).filter((k) => SRC[k].health === 'failed');
    if (failing.length && (!scope || SET.some((o) => failing.indexOf(o.src) > -1))) {
      const names = failing.map((k) => SRC[k].label);
      const starved = SET.filter((o) => failing.indexOf(o.src) > -1);
      out.push({
        id: 'source', sev: 'p1', type: 'Sync blocked',
        when: failing.length === 1 ? SRC[failing[0]].last + 'd down' : failing.length + ' sources',
        n: starved.length,
        clause: is(starved.length, 'has not updated since its source stopped syncing',
                                   'have not updated since their source stopped syncing'),
        body: names.join(' and ') + ' stopped syncing. ' + (starved.length
          ? docs(starved.length) + ' ' + is(starved.length, 'has', 'have') + ' not updated since.'
          : 'Nothing here is drawn from them yet.'),
        why: 'It is the only one that keeps getting worse while you read the rest.',
        cta: 'Why it stopped',
        ids: starved.map((o) => o.id),
        needs: 'canvas',
        go: () => submit(NTF_Q.source),
        nav: askHref(NTF_Q.source)
      });
    }

    /* The one entry a PERSON put here. Everything else is derived, which is
       exactly why this cannot be left to sort itself out. */
    const reported = SET.filter((o) => openProblems(o));
    if (reported.length) {
      const n = reported.reduce((a, o) => a + openProblems(o), 0);
      out.push({
        id: 'reported', sev: 'p1', type: 'Reported',
        when: n + ' open',
        n: reported.length,
        clause: is(reported.length, 'has a problem somebody reported', 'have a problem somebody reported'),
        body: n === 1
          ? 'Somebody reported a problem with ' + reported[0].title + ', and nobody has answered it.'
          : n + ' reported problems across ' + docs(reported.length) + ' are unanswered.',
        why: 'A person put it there, so nothing but a person will clear it.',
        cta: reported.length === 1 ? 'Open the report' : 'Show them',
        ids: reported.map((o) => o.id),
        needs: 'grid',
        go: () => reported.length === 1
          ? patch({ doc: reported[0].id })
          : patch({ ids: reported.map((o) => o.id) }),
        nav: filtHref(reported.length === 1
          ? 'doc=' + reported[0].id
          : 'ids=' + reported.map((o) => o.id).join(','))
      });
    }

    const conflicting = withStatus('conflicting');
    if (conflicting.length) {
      out.push({
        id: 'conflicting', sev: 'p1', type: 'Conflict',
        when: docs(conflicting.length),
        n: conflicting.length,
        clause: is(conflicting.length, 'disagrees with another', 'disagree with each other'),
        body: docs(conflicting.length) + ' ' + is(conflicting.length, 'disagrees', 'disagree')
          + ' with another document, and answers still stand on both sides.',
        why: 'Two answers to one question is worse than none, because both look confident.',
        cta: 'Compare them',
        ids: conflicting.map((o) => o.id),
        needs: 'canvas',
        go: () => submit(NTF_Q.conflicting),
        nav: askHref(NTF_Q.conflicting)
      });
    }

    const outdated = withStatus('outdated');
    if (outdated.length) {
      out.push({
        id: 'outdated', sev: 'p2', type: 'Behind source',
        when: docs(outdated.length),
        n: outdated.length,
        clause: is(outdated.length, 'is behind its source', 'are behind their source'),
        body: docs(outdated.length) + ' ' + is(outdated.length, 'is', 'are')
          + ' behind their source. Answers still cite them, and say so.',
        why: 'Wrong, but not getting wronger — and a blocked source is why some of it is.',
        cta: 'Re-sync them',
        ids: outdated.map((o) => o.id),
        needs: 'canvas',
        go: () => submit(NTF_Q.outdated),
        nav: askHref(NTF_Q.outdated)
      });
    }

    const drafted = withStatus('draft');
    if (drafted.length) {
      out.push({
        id: 'drafts', sev: 'p2', type: 'Not live',
        when: drafted.length + ' drafted',
        n: drafted.length,
        clause: is(drafted.length, 'I drafted is still unpublished', 'I drafted are still unpublished'),
        body: 'AiMY drafted ' + docs(drafted.length) + '. ' + is(drafted.length,
          'It answers nothing until you publish it.',
          'None of them answers anything until you publish them.'),
        why: 'Work already done that nobody can reach yet — the cheapest thing on this list to finish.',
        cta: is(drafted.length, 'Read the draft', 'Read the drafts'),
        ids: drafted.map((o) => o.id),
        /* Status is a LIST key — a bare string writes nothing and the row
           becomes a button that quietly does not work. */
        needs: 'grid',
        go: () => patch({ status: ['draft'] }),
        nav: filtHref('status=draft')
      });
    }

    const unowned = withStatus('unowned');
    if (unowned.length) {
      out.push({
        id: 'unowned', sev: 'p2', type: 'Unowned',
        when: docs(unowned.length),
        n: unowned.length,
        clause: is(unowned.length, 'has nobody accountable', 'have nobody accountable'),
        body: docs(unowned.length) + ' ' + is(unowned.length, 'has', 'have')
          + ' nobody accountable for ' + is(unowned.length, 'it', 'them') + '.',
        why: 'Every other line on this list needs somebody to send it to.',
        cta: is(unowned.length, 'Who should own it', 'Who should own them'),
        ids: unowned.map((o) => o.id),
        needs: 'canvas',
        go: () => submit(NTF_Q.unowned),
        nav: askHref(NTF_Q.unowned)
      });
    }

    /* A gap is the absence of a document, so there is nothing to filter to and
       the row stages a write rather than running one. */
    if (!scope && ASKED.length && LIVE.length) {
      const asked = ASKED.reduce((s, a) => s + a.n, 0);
      const lead = ASKED.slice().sort((a, b) => b.n - a.n)[0];
      out.push({
        id: 'gap', sev: 'p3', type: 'Coverage gap',
        when: asked + ' asked',
        /* Counts questions, not documents, so it supplies its own noun. */
        n: asked, clause: is(asked, 'question came in that nothing here answers',
                                    'questions came in that nothing here answers'),
        body: asked + ' question' + (asked === 1 ? '' : 's') + ' came in that nothing here answers. '
          + lead.topic + ' leads.',
        why: 'Nothing on the surface would ever have said so — an absence has no card.',
        cta: 'Draft the answer',
        ids: [],
        needs: 'canvas',
        go: () => canvas.stage(lead.prompt, ['Coverage gap', asked + ' unanswered questions', 'Nothing to filter to']),
        /* A gap stages a write rather than running one, so the route that
           lands from elsewhere has to stage it too, not ask it. */
        nav: 'console.html?stage=' + encodeURIComponent(lead.prompt)
      });
    }

    const unused = withStatus('unused');
    if (unused.length) {
      out.push({
        id: 'unused', sev: 'p3', type: 'Unused',
        when: 'no citations',
        n: unused.length,
        clause: is(unused.length, 'has not been cited in three months', 'have not been cited in three months'),
        body: docs(unused.length) + ' ' + is(unused.length, 'has', 'have')
          + ' not been cited or opened in three months.',
        why: 'Either dead weight or a gap in how people find things, and both are worth a look.',
        cta: is(unused.length, 'Triage it', 'Triage them'),
        ids: unused.map((o) => o.id),
        needs: 'canvas',
        go: () => submit(NTF_Q.unused),
        nav: askHref(NTF_Q.unused)
      });
    }

    return out;
  }

  /* The panel's own action, and the one question it cannot answer by listing
     itself again. Severity order is the answer, so the answer says why that is
     the order rather than restating the rows. */
  function triageAnswer() {
    const q = needsYou();
    if (!q.length) return `<div class="answer-surface">
      <div class="answer-body">
        <p>Nothing is waiting on you. Everything you can see is owned, in use, matching its
        source, and nothing disagrees with anything else.</p>
      </div>
    </div>`;
    const lead = q[0], rest = q.slice(1);
    return `<div class="answer-surface">
      <div class="answer-body">
        <p><strong>${esc(lead.type)}, first.</strong> ${esc(lead.body)} ${esc(lead.why)}</p>
        ${rest.length ? `<p>Then, in this order:</p>` +
          rest.map((t) => `<p><strong>${esc(t.type)}</strong> — ${esc(t.body)} ${esc(t.why)}</p>`).join('') : ''}
        <p>That order is severity, not age: what is still getting worse comes before what is
        merely wrong, and what is merely wrong comes before what is only untidy.</p>
      </div>
      ${lead.ids.length ? applyBtn(lead.ids, 'Show what the first one covers') : ''}
    </div>`;
  }

  const bell = {
    btn: null, panel: null, list: null, dot: null, count: null, open: false, read: {},

    /* What THIS shell can do with a row where it stands, matched against the
       row's own `needs`. Read once at init rather than per click, because the
       shell does not change under a page. See "One finding, two routes"
       above needsYou(). */
    can: { canvas: false, grid: false },

    init() {
      const page = document.body.getAttribute('data-page');
      this.can = { canvas: page === 'workbench' || page === 'gate',
                   grid:   page === 'workbench' };
      this.btn = $('#ntfBell');
      this.panel = $('#ntfPanel');
      this.list = $('#ntfList');
      if (!this.btn || !this.panel || !this.list) return;
      this.dot = $('#ntfDot');
      this.count = $('#ntfCount');

      this.btn.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });
      this._layer = (window.AIMY_LAYERS || { add: (x) => x, closeAll: () => {} }).add({
        name: 'bell',
        isOpen: () => this.open,
        close: () => this.close()
      });

      const clear = $('#ntfClear');
      if (clear) clear.addEventListener('click', () => {
        needsYou().forEach((t) => { this.read[t.id] = true; });
        this.paint();
        this.sync();
      });

      const askAll = $('#ntfAskAll');
      if (askAll) askAll.addEventListener('click', () => {
        this.close();
        /* The triage answer ends in an Apply button over a set, so it is only
           an answer where there is a set to apply it to. Elsewhere it takes
           the same road its rows do. */
        if (!this.can.canvas) { location.href = askHref(TRIAGE_Q); return; }
        canvas.ask(TRIAGE_Q,
          ['Source health', 'Reported problems', 'Every status in the library'], () => triageAnswer());
      });

      /* Chrome that survives you clicking the work behind it is a modal
         pretending not to be one. Escape is handled in the canvas's chain,
         where every dismissable layer on this page is ordered once. */
      document.addEventListener('click', (e) => {
        if (!this.open || this.panel.contains(e.target) || this.btn.contains(e.target)) return;
        this.close();
      });

      document.addEventListener('keydown', (e) => {
        if (!this.open || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
        const items = $$('.ntf-row-cta', this.list);
        if (!items.length) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement);
        if (i === -1) { items[0].focus(); return; }
        items[e.key === 'ArrowDown' ? (i + 1) % items.length
                                    : (i - 1 + items.length) % items.length].focus();
      });

      this.sync();
    },

    /* The dot and the count are DERIVED, on every render, from the same corpus
       the surface is drawing. Publish the drafts and the number goes down
       without anything having to remember to tell it. */
    sync() {
      if (!this.btn) return;
      const n = needsYou().filter((t) => !this.read[t.id]).length;
      if (this.count) { this.count.textContent = n; this.count.hidden = n === 0; }
      if (this.dot) this.dot.hidden = n === 0;
      this.btn.setAttribute('aria-label', n === 0
        ? 'Notifications, nothing waiting on you'
        : 'Notifications, ' + n + ' waiting on you');
      if (this.open) this.paint();
    },

    paint() {
      const q = needsYou();
      this.list.innerHTML = '';
      if (!q.length) {
        const empty = document.createElement('li');
        empty.className = 'ntf-empty';
        empty.textContent = 'Nothing is waiting on you.';
        this.list.appendChild(empty);
        return;
      }
      q.forEach((t) => {
        const li = document.createElement('li');
        li.className = 'ntf-row' + (this.read[t.id] ? ' is-read' : '');
        li.innerHTML =
          `
           <div class="ntf-row-main">
             <div class="ntf-row-head">
               <span class="ntf-row-type">${esc(t.type)}</span>
               <span class="ntf-row-when">${esc(t.when)}</span>
             </div>
             <p class="ntf-row-body">${esc(t.body)}</p>
             <button class="ntf-row-cta" type="button">${esc(t.cta)}</button>
           </div>`;
        $('.ntf-row-cta', li).addEventListener('click', () => this.start(t));
        this.list.appendChild(li);
      });
    },

    /* Acting on a row is what marks it read — there is no separate gesture for
       saying you have seen something you are about to deal with. The panel goes
       first, so it cannot be left floating over whatever the row just opened. */
    start(t) {
      this.read[t.id] = true;
      this.close();
      /* Where the surface a row needs is absent, the row is a link in button's
         clothing: it carries the same state to the one shell that has that
         surface, instead of steering something that is not on the page. */
      if (this.can[t.needs]) t.go(); else location.href = t.nav;
    },

    toggle() { if (this.open) this.close(true); else this.show(); },

    show() {
      (window.AIMY_LAYERS || { add: (x) => x, closeAll: () => {} }).closeAll(this._layer);
      this.paint();
      this.panel.hidden = false;
      this.open = true;
      this.btn.setAttribute('aria-expanded', 'true');
      const first = $('.ntf-row-cta', this.list);
      if (first) first.focus();
    },

    close(returnFocus) {
      if (!this.panel || !this.open) return;
      this.panel.hidden = true;
      this.open = false;
      this.btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) this.btn.focus();
      this.sync();
    }
  };

  /* ── The account menu ──

     The pill has drawn a chevron since the first build with nothing behind it,
     and `role="button" tabindex="0"` made the same promise a second time: it
     was focusable, announced as a button, and did nothing when you pressed it.
     A control that announces an affordance it does not have is worse than a
     plain <div>, because a screen-reader user is the one who acts on the claim.

     Shaped like `bell` on purpose. Same row, same flank, same problem already
     solved once, and a second dropdown language in one topnav is one too many.
     What it does not copy is the arrow-key roving: these are ordinary links,
     Tab already walks them in order, and a roving tabindex over four items
     would only add a keyboard model nobody asked for.

     What it opens is a page rather than a fourth overlay. This surface already
     carries the canvas, the settings sheet and the peek; settings is a place
     you go, not another thing that floats over the work. */
  const userMenu = {
    btn: null, panel: null, open: false,

    init() {
      this.btn = $('#userPill');
      this.panel = $('#userMenu');
      if (!this.btn || !this.panel) return;

      this.btn.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });
      this._layer = (window.AIMY_LAYERS || { add: (x) => x, closeAll: () => {} }).add({
        name: 'account',
        isOpen: () => this.open,
        close: () => this.close()
      });

      /* The identity guard, not the registration order, is what stops the
         trigger press from also reading as a click-off. Registering this before
         or after the main router makes no difference while the guard holds. */
      document.addEventListener('click', (e) => {
        if (!this.open || this.panel.contains(e.target) || this.btn.contains(e.target)) return;
        this.close();
      });

      /* Following a row is the end of the menu's job — the same rule the rail
         drawer states for itself. */
      this.panel.addEventListener('click', (e) => { if (e.target.closest('a')) this.close(); });
    },

    toggle() { if (this.open) this.close(true); else this.show(); },

    show() {
      (window.AIMY_LAYERS || { add: (x) => x, closeAll: () => {} }).closeAll(this._layer);
      this.panel.hidden = false;
      this.open = true;
      this.btn.setAttribute('aria-expanded', 'true');
      const first = $('.menu-item', this.panel);
      if (first) first.focus();
    },

    close(returnFocus) {
      if (!this.panel || !this.open) return;
      this.panel.hidden = true;
      this.open = false;
      this.btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) this.btn.focus();
    }
  };

  /* ══ THE PRODUCT MENU IS THE STRIP, READ BACK ══════════════════════
     Below 900 the ecosystem strip comes off the masthead and hangs from the
     mark as a menu (knowledge.css §THE LAST RUNG). What is in it is
     not typed out again here: the tabs are shared chrome that the three
     products carry identically, and a second list of them in this file is the
     list that drifts the first time one is added or renamed. The strip in the
     markup is the source and this is a second view of it.

     Once, at boot: the strip is static markup and nothing repaints it. Both
     shells run it, and each reads its OWN strip — which is how console.html's
     AiMY tab stays a link back to the gate while index.html's stays inert.

     WHERE THIS DEPARTS FROM SALES' fillProdMenu(), WHICH IT IS OTHERWISE A
     PORT OF: Sales makes the active entry `disabled` unconditionally, because
     its active tab is a <button> with nowhere to go. Here the active tab is a
     <span> on index.html but a REAL <a href="index.html"> on console.html —
     the way back to the gate. Disabling it on the strength of `active` would
     have deleted that exit on the one shell that has it. So `is-on` marks
     where you are and the href, not the class, decides whether it presses. */
  function fillProdMenu() {
    const menu = $('#prodMenu');
    const strip = $('.topnav-tabs-inner');
    if (!menu || !strip) return;
    /* NO CAPTION. A menu hanging off the AiMY mark, listing the AiMY products,
       does not also need a line saying Products — a label for what the next
       line already is. */
    menu.innerHTML = Array.prototype.map.call(strip.children, (tab) => {
      const on = tab.classList.contains('active');
      const href = tab.getAttribute('href');
      /* THE TAB'S OWN MARK COMES WITH IT. The strip draws the product you are
         on as the AiMY glyph and its name in the action ink; this list is a
         second view of that strip, so it carries whatever mark the tab
         carries rather than deciding for itself which entries have one. The
         size is CSS's, next to .prod-menu. */
      const mark = tab.querySelector('svg');
      const label = (mark ? mark.outerHTML : '') +
        '<span>' + esc(tab.textContent.trim()) + '</span>';
      const cls = 'menu-item' + (on ? ' is-on' : '');
      const cur = on ? ' aria-current="page"' : '';
      /* The ones with nowhere to go say so by not being pressable. A menu item
         that answers a press with nothing teaches you to stop pressing. */
      if (!href) {
        return '<button class="' + cls + '" type="button" role="menuitem"' + cur +
               ' disabled>' + label + '</button>';
      }
      return '<a class="' + cls + '" role="menuitem"' + cur +
             ' href="' + esc(href) + '">' + label + '</a>';
    }).join('');
  }

  /* Shaped like `userMenu` on purpose — same [hidden] language, same layer
     registration, same click-off guard. A second dropdown mechanism in one
     masthead is one too many, and this one sits eight pixels from the first. */
  const prodMenu = {
    btn: null, panel: null, open: false,

    init() {
      this.btn = $('#prodChev');
      this.panel = $('#prodMenu');
      if (!this.btn || !this.panel) return;
      fillProdMenu();

      this.btn.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });
      this._layer = (window.AIMY_LAYERS || { add: (x) => x, closeAll: () => {} }).add({
        name: 'products',
        isOpen: () => this.open,
        close: () => this.close()
      });

      document.addEventListener('click', (e) => {
        if (!this.open || this.panel.contains(e.target) || this.btn.contains(e.target)) return;
        this.close();
      });

      /* Following a row is the end of the menu's job — the same rule the
         account menu and the rail drawer both state for themselves. */
      this.panel.addEventListener('click', (e) => { if (e.target.closest('a')) this.close(); });

      /* ══ AND ON THE GATE IT CLOSES ITSELF ════════════════════════════
         Escape is handled in the canvas's chain, where every dismissable layer
         on the two console shells is ordered once — which is where the two
         entries for this menu live, and why it does not carry a listener of
         its own there.

         THE GATE HAS NO SUCH CHAIN. `canvas.init()` returns at `this.inline`
         before that listener is ever registered (:8520), and the gate's own
         handler in chat.js deliberately closes one thing — the rail drawer —
         on the grounds that "Escape on the gate must never dismiss the surface
         the page is made of". Measured before this existed: on index.html at
         400px the panel stayed open on Escape with aria-expanded still true,
         while the same press closed it on console.html.

         So the fallback is registered only where the chain is absent. Guarded
         on `open`, so it cannot eat an Escape meant for anything else, and
         `canvas.init()` has already run by the time this does, which is what
         makes `inline` readable here. */
      if (canvas.inline) {
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.open) { e.stopPropagation(); this.close(true); }
        });
      }

      /* A menu behind a chevron is a narrow-screen shape. Above the breakpoint
         the strip is back on the bar and the chevron is `display: none`, so an
         `open` left behind would be a panel hanging off an invisible button
         with its aria-expanded still claiming true. The CSS cannot leak it;
         this keeps the STATE honest, which is the same reason makeDrawer()
         carries the identical listener. */
      const mq = matchMedia('(max-width: 900px)');
      const onChange = () => { if (!mq.matches) this.close(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else mq.addListener(onChange);
    },

    toggle() { if (this.open) this.close(true); else this.show(); },

    show() {
      (window.AIMY_LAYERS || { add: (x) => x, closeAll: () => {} }).closeAll(this._layer);
      this.panel.hidden = false;
      this.open = true;
      this.btn.setAttribute('aria-expanded', 'true');
      /* The first row that can take focus. `.menu-item` alone would land on a
         disabled button — the product you are already on, on index.html — and
         focus falls through it to nothing. */
      const first = this.panel.querySelector('.menu-item:not([disabled])');
      if (first) first.focus();
    },

    close(returnFocus) {
      if (!this.panel || !this.open) return;
      this.panel.hidden = true;
      this.open = false;
      this.btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) this.btn.focus();
    }
  };


  /* The last filter the user ran, so the rail can offer it back. Session only:
     a resume cue that survives a machine restart is claiming a memory the
     prototype does not have. */
  let lastFilter = null;
  try { lastFilter = sessionStorage.getItem('aimy-k-last') || null; } catch (e) {}
  /* ── Where you were, and how you work ──

     `lastFilter` was already here: one slot, in sessionStorage, restored by a
     "Resume your last filter" button in the rail. It is one of these with N=1,
     and the seven places that already call rememberFilter() are every place a
     filter changes — so widening it needs no new hook anywhere.

     Two stores on purpose, because they have two lifetimes. `lastFilter` is
     WHERE I JUST WAS and should die with the tab, which is what sessionStorage
     means. Recents are HOW I WORK — the whole point is not retyping a
     combination you use every week — so they outlive the tab, which is what
     localStorage means. The theme already lives there for the same reason.

     None of this is a second source of truth. The URL still decides everything
     on screen; a recent is a remembered URL, and restoring one is a navigation.
     The README's claim that the URL is the state survives intact. */
  const RECENT_MAX = 5;
  let recentFilters = [];
  try { recentFilters = JSON.parse(localStorage.getItem('aimy-k-recent') || '[]'); } catch (e) {}

  function rememberFilter() {
    const s = location.search;
    if (!s) return;
    lastFilter = s;
    try { sessionStorage.setItem('aimy-k-last', s); } catch (e) {}

  }

  /* An open document is not a filter. `?doc=…` rides along in the query string,
     so storing a state verbatim would remember "the set I was looking at, and
     the one I had open" and restore you into a document you never asked to
     reopen. The document is dropped and the set is kept. */
  function keepRecent(st) {
    if (isComposed(st)) return;          /* nothing narrowed — nothing to remember */
    const clean = serialize(Object.assign({}, st, { doc: '' }));
    if (!clean) return;
    /* Newest first, and a repeat moves rather than duplicates: running the same
       filter twice should not cost two of the five slots. */
    recentFilters = [clean].concat(recentFilters.filter((r) => r !== clean)).slice(0, RECENT_MAX);
    try { localStorage.setItem('aimy-k-recent', JSON.stringify(recentFilters)); } catch (e) {}
  }

  /* A recent names itself. parseParams turns the stored string back into state
     — it was split out of readURL precisely so a stored conversation could be
     re-read by the code that reads the address bar — and valueLabel already
     writes the words the chip bar uses. So a saved filter can never drift from
     what the surface would call it, because it is the same function. */
  function recentLabel(qs) {
    const st = parseParams(new URLSearchParams(String(qs).replace(/^\?/, '')));
    const parts = [];
    LIST_KEYS.forEach((k) => {
      if (k === 'ids') return;
      (st[k] || []).forEach((v) => parts.push(valueLabel(k, v)));
    });
    DATE_KEYS.forEach((k) => { if (st[k]) parts.push(valueLabel(k, st[k])); });
    if (st.mine) parts.push('Mine');
    if (st.archived) parts.push('Archived');
    if (st.q) parts.push('“' + st.q + '”');
    return parts.slice(0, 3).join(' · ') + (parts.length > 3 ? ' +' + (parts.length - 3) : '');
  }

  /* ═══════════════════════════════════════════════
     TYPE CARDS — eight templates over one fixed governance row

     Type changes what a reader needs to see first, so each type renders its
     own body. What never moves is the row carrying title, type, trust state,
     work state, owner and last verified: someone scanning mixed results should
     not have to relearn where trust lives per type.
  ═══════════════════════════════════════════════ */
  const approvalPill = (state) => state === 'approved'
    ? `<span class="tc-approval is-approved">${ICO.check.replace('<svg', '<svg width="11" height="11"')}Approved</span>`
    : `<span class="tc-approval is-pending">${ICO.clock.replace('<svg', '<svg width="11" height="11"')}Awaiting approval</span>`;



  /* ── The card ──

     What a reader needs before deciding whether to open it. A Ticket without
     its resolution is useless; an ICP without its region and services is not
     an ICP; a Success Story without its client is an anecdote. The full record
     is one click away in the document, so the card's job is to be scannable,
     not complete — which is why the body is clamped there and not here. */
  /* ── The crawl, in the numbers rather than in a sentence ──

     `upd` IS the last crawl: when our copy last changed is when we last
     fetched it. `xu` is when the source moved, so a change is only DETECTED
     where the source moved after our copy — the same test `statusOf` uses to
     call a web page out of date. A blocked crawler knows neither.

     Both replaced hand-written strings that disagreed with the numbers beside
     them: page-security read "7 days ago" against an `upd` of 21, and the
     change guard tested `=== 'None'` while the corpus stored "None since last
     crawl", so every web page's rail read "None since last crawl since the
     last crawl". A phrase where a date belongs is the same defect twice. */
  const crawlPhrase = (o) => 'Crawled ' + esc(fmtDate(o.upd));
  const changePhrase = (o) => o.work === 'failed'
    ? 'Changes unknown — the crawler is blocked'
    : o.xu < o.upd ? 'Source changed ' + esc(fmtDate(o.xu))
    : 'Unchanged since the last crawl';

  /* TYPE_FACTS lived here: eight functions turning `o.x` into read-only
     phrases for the rail. The rail renders those same fields as CONTROLS now
     — see TYPE_FIELDS — and a table whose only job was to say a value out
     loud beside the field that holds it is a second vocabulary to keep in
     step. The lead phrases moved into TYPE_FIELDS with it, so nothing it said
     was lost; it just says it next to something you can change. */

  /* What the document says about itself, beyond its type. Phrases, in the
     order somebody would ask them. */
  const docFacts = (o) => [
    ownerPhrase(o),
    'Updated ' + esc(fmtDate(o.upd)),
    o.client ? 'About ' + esc(CLIENTS[o.client]) : '',
    o.prod ? 'Answers for ' + esc(PRODUCTS[o.prod]) : '',
    'Visible to ' + esc(o.aud.map((a) => AUDIENCE[a].toLowerCase()).join(' and ')),
    o.tags.length ? 'Tagged ' + esc(o.tags.join(', ')) : ''
  ].filter(Boolean);

  /* ═══════════════════════════════════════════════
     TYPE BODIES — the one zone that varies

     The library's spec is eight templates over one fixed governance row, and
     the only zone it varies is the body. This card kept the collapse of
     METADATA onto one dim line — that was right and it stays — but shrank the
     body to a single truncated fact, which is what left eight types looking
     alike: an 11px icon halfway along a five-item line was carrying the whole
     distinction.

     Differentiation is by SHAPE. The library forbids carrying type in colour,
     and the zone's position is fixed on all eight, so texture is the channel
     left — and it is the one that survives a glance. A coloured pill over a
     sentence does not read like a row of tags, which does not read like a
     monospace URL, which does not read like a ruled quotation. Nobody has to
     read the label to know which is which.

     `full` is the document, which has width the card does not and can afford
     the rows the card clamps away. ONE table for both, so the grid and the
     opened document cannot describe the same object differently — the rule
     TYPE_FACTS was written under, applied where it actually holds.

     Two rules this table is written to, both checkable against the corpus:
       · A fact earns space only if it VARIES within its type. `src` is freshdesk
         for six tickets out of six and teamsupport for three ICPs out of four —
         zero information there, real information on an article or a blog.
       · Never restate the meta line. Status, owner, edited and used are tier
         three. Repeating one here is the five-row card coming back.

     Class attributes are whole static literals, never interpolated: the
     audit's scanner (css-audit.js:30) skips any `class="…"` holding a `$`, so
     a composed class would leave every variant unchecked.
  ═══════════════════════════════════════════════ */
  const tcList = (items, negative) => !items || !items.length ? ''
    : (negative ? '<ul class="tc-list is-negative">' : '<ul class="tc-list">') +
      items.map((i) => `<li>${esc(i)}</li>`).join('') + '</ul>';

  const tcSum = (s) => s ? `<p class="tc-summary">${esc(s)}</p>` : '';

  /* Three bars and a number. The band is colour AND meter height AND the digits,
     so none of the three is carrying it alone. */
  const confBadge = (n, label) => {
    if (typeof n !== 'number' || !n) return '';
    const open = n >= 75 ? '<span class="conf-badge conf-high">'
      : n >= 50 ? '<span class="conf-badge conf-medium">'
      : '<span class="conf-badge conf-low">';
    return open + '<span class="conf-meter"><i></i><i></i><i></i></span>' +
      esc(label) + `<span class="conf-val">${n}</span></span>`;
  };

  /* Region and the service lines, as tags — the two axes both profile-shaped
     types are filed on, and the two a reader filters by. One builder, so an
     ICP and the Success Story that proves it cannot describe the same two
     axes differently. `lead` is whatever goes in front: the ICP's fit meter,
     and nothing for a story, which has no score to show.

     Two services is the cap. Every fixture carries at most two, and with the
     region in front a third would take the row to three lines at 300px. */
  const axisTags = (o, lead) => '<div class="tc-tags">' + (lead || '') +
    `<span class="tag tag-neutral">${esc(REGIONS[o.region] || o.region)}</span>` +
    o.services.slice(0, 2).map((s) =>
      `<span class="tag tag-neutral">${esc(tagCase(SERVICES[s] || s))}</span>`).join('') +
    '</div>';

  const TYPE_BODY = {
    /* The document's own words. An article IS its prose, so on the card the
       summary is the whole answer. */
    article:  (o) => tcSum(o.sum),

    campaign: (o) => tcSum(o.sum),

    /* `x.status` is the ticket's state AT SOURCE — Resolved, Awaiting legal,
       On hold — and is not `o.status`, which is ours and already on the meta
       line. It keeps the source's own word rather than translating it into our
       vocabulary, because a ticket that says "Awaiting legal" is telling you
       something none of our seven statuses can. */
    ticket:   (o) => (o.x.status === 'Resolved'
        ? '<div class="tc-tags"><span class="tag tag-ok">'
        : '<div class="tc-tags"><span class="tag tag-warn">') +
      esc(tagCase(o.x.status)) + '</span></div>' +
      (o.x.resolution && o.x.resolution !== '—' ? tcSum(o.x.resolution) : ''),

    /* Fit, then the two axes an ICP is filed on, as the tags the profile is
       actually indexed by. Four pills is the cap — at 300px a fifth wraps to a
       third row and the card stops sharing a height with its neighbours. */
    icp:      (o) => axisTags(o, confBadge(o.x.score, 'Fit')),

    /* Approval decides whether the thing can leave the building, which is the
       only question anyone asks an asset before using it. */
    asset:    (o) => `<div class="tc-tags">${approvalPill(o.x.approval)}</div>` +
      tcSum(o.x.format),

    /* Same approval pill as an asset, because it answers the same question
       before anybody uses one. What differs is the second run: an asset says
       what FORMAT it is, a deck says how long it is and where it was last
       shown — the two facts that decide whether you can reuse it on Thursday. */
    pptx:     (o) => `<div class="tc-tags">${approvalPill(o.x.approval)}</div>` +
      tcSum([o.x.slides ? o.x.slides + ' slides' : '', o.x.presented]
        .filter((v) => v && v !== '—').join(' · ')),

    /* The outcome is the claim, the quote is the evidence for it, and the
       client is who it happened to. The quote earns the ruled treatment
       because it is the one run on the grid that is somebody else's words.

       Region and services are here for the same reason they are on an ICP:
       this is the proof you reach for when a prospect matches that shape, and
       a story you cannot filter to a region is a story nobody finds. An
       earlier pass left them off to keep the card from looking like an ICP —
       wrong trade, and the wrong worry: an ICP leads with a fit meter and a
       story leads with prose, which is difference enough.

       The quote is the document's, not the card's. With the tags in it was a
       third body row and 22px on every grid row holding a story — paid for a
       fact nothing asked the card to carry. It is the evidence behind the
       outcome, and evidence is what you open something to read. */
    story:    (o) => tcSum(o.x.outcome +
        (o.client && CLIENTS[o.client] ? ' · ' + CLIENTS[o.client] : '')) +
      axisTags(o),

    /* A byline, and only where there is a date to stand behind. `x.pub` is a
       state word rather than a date, so the publish date comes from `xc` — when
       the post was created at source, which for a published post is when it
       went out — and an unpublished draft gets no date at all rather than one
       that would be a claim about something that has not happened.

       The canonical URL is the post's public address and belongs on the card
       for the reason a Web Page's does: it is what the customer sees, and the
       one fact that says whether this copy and the live one are the same page.
       Same monospace run, so the two web-shaped types read alike. */
    blog:     (o) => tcSum('By ' + o.x.author +
        (o.x.pub === 'Published' ? ' · ' + fmtDate(o.xc) : '')) +
      (o.x.canonical && o.x.canonical !== '—'
        ? `<p class="tc-mono">${esc(o.x.canonical)}</p>` : ''),

    /* The URL is the whole of what makes a web page a web page, and monospace
       is the only run of that texture anywhere on the grid. */
    webpage:  (o) => (o.x.url && o.x.url !== '—'
        ? `<p class="tc-mono">${esc(o.x.url)}</p>` : '') +
      tcSum(o.sum)
  };

  /* One wrapper, so the gutter and the clamp are declared once and a type with
     nothing to say renders no zone rather than an empty box still taking its
     padding. The fallback is the summary, which every type has.

     This took a `full` flag while the document replayed the card's body
     unclamped in its head. The document has its own record now — the same
     facts as editable rows, in the order the type reads — so every `full`
     branch was unreachable and is gone. What is left is the card's, which is
     the only caller. */
  function typeBody(o) {
    const f = TYPE_BODY[o.t];
    const inner = f ? f(o) : tcSum(o.sum);
    return inner ? `<div class="tc-body">${inner}</div>` : '';
  }

  /* ── The exit a type deserves when nothing is wrong with it ──

     *Open* is right for all eight and specific to none. The library's templates
     name the verb the object actually takes, and a grid of mixed types reads
     faster when the button under each card says what it is about to open.

     Only the LABEL moves. The mode and the action key stay the status's,
     because what a document needs DOING to it is a property of its condition,
     not of its kind — and because the click path re-derives through
     `cardAction`, so a card whose status moved between render and click still
     performs the current correct action rather than a stale one.

     Deliberately narrow: the other exits — Publish, Re-sync, Set an owner,
     Archive or keep, Compare — describe the remedy for a condition and read
     identically well on all eight. Retyping those per type would be eight ways
     to say one thing. */
  const TYPE_EXIT = {
    article:  'Open article',   ticket:  'Open ticket',  icp:   'Review fit criteria',
    /* Not "Download asset": docAct has no `download` kind, so the card
       promised a file it never delivered — and the document it opens onto now
       offers Replace, which is the honest action on a file this prototype does
       not store. An exit has to lead somewhere. */
    campaign: 'Open campaign',  asset:   'Open asset',   story: 'Open story',
    blog:     'Open post',      webpage: 'Open page',    pptx:  'Open deck',
    product:  'Open product',   service: 'Open service'
  };

  /* One action per card, and it is the status's exit — so the card offers the
     thing the badge implies rather than a second vocabulary of its own. */
  function cardAction(o) {
    if (o.arch)              return ['review', 'Restore', 'restore'];
    if (o.work === 'failed') return ['direct', 'Check the source', 'source'];
    /* An exit has to lead somewhere. "Go to successor" on a document with no
       replacement recorded went nowhere and said so in a toast, which is the
       button admitting it should not have been offered. */
    if (o.status === 'superseded' && !(RELATED[o.id] || {}).supersededBy)
      return ['investigate', 'Find what replaced it', 'findsuccessor'];
    /* Re-syncing a source that is not connected queues into nothing. The
       remedy for an out-of-date document behind a dead source is the source. */
    if (o.status === 'outdated' && SRC[o.src].health !== 'ok')
      return ['review', 'Reconnect ' + SRC[o.src].label, 'reconnect'];
    const exit = STATUS_EXIT[o.status] || ['direct', 'Open', 'open'];
    return exit[2] === 'open' && TYPE_EXIT[o.t]
      ? [exit[0], TYPE_EXIT[o.t], exit[2]]
      : exit;
  }

  /* Status as ink, not as a pill above the title. The dot and the word take the
     status tone and sit INSIDE the meta line, where colour and weight carry
     them without outranking the document's name — the same move GitHub makes
     for open and closed. The card's left edge takes the tone too, so a
     screenful reads at a glance and a document with nothing wrong stays quiet. */
  function statusInk(o) {
    const s = STATUS[o.status];
    return `<span class="tc-st" title="${esc(o.statusSet
      ? 'Set by ' + (o.statusBy || USER.owner) + '. ' + s.why : s.why)}"><i class="tc-dot"></i>${esc(s.label)}` +
      `${o.statusSet ? '<span class="pin-dot" aria-label="set by hand"></span>' : ''}</span>`;
  }

  /* ── Three tiers, not five rows ──

     The card used to stack a type row, a status pill, a title, two identically
     styled facts and an owner: six runs, four of them within 3px and two of
     them byte-identical, so it read as a grey ladder with a bigger rung in the
     middle. What every list of this kind settles on — GitHub's issue rows,
     Linear, Gmail, Notion's database cards — is the opposite rule: metadata
     collapses onto ONE dim line and never becomes rows that compete.

     So: the title first and alone, one line of the document's own words under
     it, and everything else — status, type, owner, last use — on a single
     middot line at 11px. Each tier differs from its neighbour in at least two
     of size, weight, colour and position, which is what makes the hierarchy
     legible without a single label.

     What changed since: tier two is the TYPE's body rather than one truncated
     fact. The collapse was never the problem — the problem was that collapsing
     the metadata took the type's own content down with it, and eight kinds of
     object ended up sharing one sentence shape. Three tiers still, and the
     middle one now says something different per type.

     One footer, not two. The library's card ends with a bordered, tinted
     `.tc-gov` strip followed by a bordered `.tc-action` strip holding a
     full-width button — two rules and a banner where one row does the job. */
  function typeCard(o, compact, opts) {
    const t = TYPES[o.t];
    const ins = compact ? null : cardInsight(o);
    /* The finding decides whether there is an action at all, so it is asked
       first and `cardAction` is not asked at all on a card with nothing wrong —
       which is most of a screenful. */
    const act = ins ? cardAction(o) : null;
    const meta = [
      statusInk(o),
      /* Some documents carry an ingestion marker in the owner field rather than
         a person — "Ingested · Freshdesk" — which on a middot-separated line reads
         as two more items and pointed the peek at an owner that does not exist.
         Same test the document's byline uses. */
      hasOwner(o)
        ? `<button class="tc-who" data-peek="owner:${esc(responsible(o))}">${esc(responsible(o))}</button>`
        /* When the STATUS is already Unowned the phrase would say it twice on
           one line. It still earns its place on a draft or an out-of-date
           document, where nobody being accountable is the second finding. */
        : o.status === 'unowned' ? ''
        : `<span class="tc-who is-none">${responsible(o) === 'Unassigned' ? 'nobody owns it' : 'no owner'}</span>`,
      /* Where it came from, in the governance run beside who answers for it —
         the same pair the document's byline carries, and the same peek target.
         It earns the slot on every type, not just the two that asked for it:
         an Article that arrived from Confluence and one somebody uploaded are
         different objects, and the card said nothing about which. */
      compact ? '' : `<button class="tc-src" data-peek="source:${o.src}">${esc(SRC[o.src].label)}</button>`,
      /* Both dates, because they answer different questions and one is not the
         other: a document edited last week can still be one nobody has cited in
         four months, and that gap IS the finding. The date takes a date because
         it is a point in time; used takes a distance because the question is
         how long it has been.

         The VERB follows the provenance. Nobody edits a crawled page and
         nobody edits a synced ticket — `upd` is when our copy last changed, and
         for everything with an upstream that change was an ingestion, not an
         edit. Saying "edited" of all three was one word doing three jobs and
         getting two of them wrong. */
      compact ? '' : `<span>${noUpstream(o) ? 'edited' : o.t === 'webpage' ? 'crawled' : 'ingested'} ${esc(fmtDate(o.upd))}</span>`,
      compact ? '' : `<span>${neverCited(o) ? 'never used' : 'used ' + esc(usedLabel(o).toLowerCase())}</span>`,
      /* ── The type left this line ──

         It is a chip above the title on a full card, so the meta line must not
         say it a second time. Compact renders no chip — a one-line row inside
         an answer does not get a tag row — so the glyph stays there, and only
         there, and the type is stated exactly once in both modes. */
      compact ? `<span class="tc-kind" title="${esc(t.label)}">${t.ico}<span class="k-sr">${esc(t.label)}</span></span>` : ''
    ].filter(Boolean);
    /* ── The finding and the way out of it are one object ──

       They were two. AiMY's sentence sat in a marked panel and the button that
       answers it sat outside and under it, on the card's own ground, in the
       card's own footer chrome — so the exchange was split across two
       containers and the remedy read as the card's, not as AiMY's. On the one
       card that shows it plainest: `Confluence changed it 157 days after our
       copy` in the panel, `Re-sync` below it, and nothing but proximity saying
       the second is the answer to the first.

       Inside the panel they are one piece of speech: what I found, then what I
       would do. Every other surface that carries a finding already works this
       way — the band over the grid keeps its verbs in its own wash
       (`.ins-acts`), the document rail keeps its verb on the row that states
       the finding (`.ins-row-act`), and the name-collision note in settings
       keeps its verb inside the same wash this panel uses (`.set2-ins-a`,
       lifted from these values on purpose). The card was the one surface of the
       four that stated a finding and then handed its action to somebody else.

       AND THERE IS NO ACTION WITHOUT A FINDING. An action is the step AFTER
       AiMY detects something; a document with nothing wrong with it has no
       next step, and offering one anyway was the card inventing work. It is
       what the seven quiet cards actually said: `Open campaign`, `Open asset`,
       `Open deck`, `Open post` — the card's own click target, restated as a
       verb in the bottom-right corner. A button that does what clicking
       anywhere already does is not an action, it is a label for the cursor.

       So the footer renders only when there is something to report, and the
       quiet card now ends where its facts end.

       NOTHING IS STRANDED BY IT, and the three exits worth more than an open
       were each checked against the corpus rather than assumed:

         Restore, on the two archived documents. `dv-notice` renders `Restore
         it →` on the page and the cite bar carries Restore beside it. The
         archived case is really the rule stated twice — findings are computed
         over LIVE, so an archived document can never carry one, and an archived
         document is not something AiMY detected. It is something a person put
         away.

         Go to the successor, on `article-churn-signals` — the ONE document in
         all 37 that loses an action here, because `needsYou` has no superseded
         bucket. The page opens on `Replaced. A newer document replaced it` and
         `Go to the current one →`, and the rail names the successor again under
         What it connects to.

         Check the source, on a blocked one. There is no footless card in the
         corpus with `work: failed` — the only one, `page-status`, is also
         conflicting, so it keeps its finding and its footer.

       Every other footless card is `status: current`, which is the whole point:
       nothing is wrong with it, so there is no next step to offer. And the card
       itself is still the way in — `data-card-open` is on the whole thing. */
    const actEl = !ins ? '' : `<span class="tc-foot-act">${entryAction(act[0], act[1],
      `data-card-act="${o.id}"`, AI_EXIT[act[2]] ? AIMY_MARK(12, 14) : null)}</span>`;

    /* ── THE ARCHIVE'S CARDS CARRY THEIR OWN TWO VERBS ──

       The footer above renders only when AiMY noticed something, and an
       archived document never carries a finding — findings are computed over
       LIVE, and being archived is not a detection, it is something a person
       did. So these cards were footless everywhere, which is right in a
       library and wrong on the one page whose whole job is deciding what to do
       with them.

       Restore and Delete, not one action. The card's usual one-action rule
       exists so a grid of mixed documents offers one obvious next step; here
       every card is the same kind of thing and the two verbs are the entire
       question the page asks. Delete still goes through `docAct`, so the typed
       confirmation and the audit line are the ones it has always been behind. */
    /* Two words, and nothing around them. This was `entryAction` first — which
       made Delete a FILLED BRAND BUTTON, the loudest control on the page being
       the most destructive thing on it — and then `cite-action` pills, which
       were quieter and still two chrome-heavy controls on every card of a list
       whose cards are all the same.

       They are links. The card already carries the weight: its title, its type
       and its facts are the thing being read, and these say what can be done
       about it in the smallest form that is still a control. Delete earns its
       colour and nothing else; the confirmation behind it is where the caution
       lives, and it has not moved. */
    /* Restore left, Delete hard right. Not a pair sitting together: they are
       opposite answers to the same question, and pushing them to opposite ends
       means the destructive one is never the thing your hand is already over
       after pressing the other. Icons because at this weight the two words are
       the same length and the same colour-blind grey to a fast reader — a
       crate with an arrow out of it and a bin are tellable apart before the
       label is. */
    const archEl = !(opts && opts.arch) ? '' : `<div class="tc-foot tc-foot-arch">
        <button class="tc-arch-lnk" data-act="restore" data-obj="${o.id}">${ICO.unarchive}<span>Restore</span></button>
        <button class="tc-arch-lnk is-danger" data-act="delete" data-obj="${o.id}">${ICO.trash}<span>Delete</span></button>
      </div>`;
    /* The whole card opens the document. The title stays a real button so the
       keyboard has one focusable target that announces which document it is —
       wrapping the card itself in a button would swallow the action inside it,
       and nested buttons are invalid besides. */
    return `<div class="type-card${compact ? ' is-compact' : ''}" data-obj="${o.id}" data-status="${o.status}"
         data-work-state="${o.work}" data-card-open="${o.id}">
      ${compact ? '' : `<p class="tc-type">${t.ico}${esc(t.label)}</p>`}
      <button class="tc-title-btn" data-open-doc="${o.id}"><span class="tc-title">${esc(o.title)}</span></button>
      ${compact ? '' : typeBody(o)}
      <p class="tc-meta">${meta.join('<i class="tc-sep">·</i>')}</p>
      ${compact || !ins ? '' : `<div class="tc-foot">
        <div class="tc-ins">
          <p class="tc-ins-say">${AIMY_MARK(13, 15)}<span class="tc-ins-t">${esc(ins.long)}</span></p>
          ${actEl}
        </div>
      </div>`}
      ${archEl}
    </div>`;
  }

  /* ═══════════════════════════════════════════════
     THE GRID

     The result meta line carries the count, the scope it was drawn from, and
     how many of the results are excluded from retrieval. That last number is
     the surface-level equivalent of the answer's trust disclosure: it is the
     difference between "there is nothing on this" and "there is something on
     this and AiMY may not use it".
  ═══════════════════════════════════════════════ */

  /* Collections and sources have something to say about themselves. When the
     filter names exactly one, the result line offers it — a chip would not,
     because a single value on a dropdown axis renders as the lit dropdown and
     no chip at all, which is precisely the case that needs the way in. */
  function talkativeAxis(st) {
    const named = ['collection', 'source'].filter((k) => st[k].length === 1);
    const others = ['type', 'product', 'client', 'region', 'audience', 'status'].some((k) => st[k].length);
    if (named.length !== 1 || others || st.ids.length) return null;
    return { key: named[0], value: st[named[0]][0] };
  }

  /* ── Nine kinds, and one line each on what it is for ──

     The button made whatever the filter happened to be pointing at —
     `newDocument(readURL().type[0])`, which on the unfiltered library is an
     Article — so choosing a kind meant making the wrong one first and
     correcting it in the rail afterwards. The kind is now the choice, and the
     choice is made where the action is.

     Still no gate and no second step. The argument at newDocument's own
     comment holds: an empty draft commits nothing, changes nothing anyone else
     can see, and is one click to discard. Picking from a menu is not a
     confirmation of an action — it IS the action, with its one parameter.

     Type by icon and label, never colour (§6.3). The glyph is the same one the
     byline and the card's meta line use, so a reader learns one mapping for the
     whole product.

     The nine one-line definitions that used to sit under each label were cut,
     and the reason given was: they explained what an Article or an ICP is, a
     fact learned once, on a menu opened weekly, and after the first time they
     were nine lines to scan past to reach the name you already knew.

     They are back, and the premise is what changed rather than the taste. That
     argument rests on "the names carry it", which was true of nine types that
     all meant *a document about something*. It is FALSE of Product and Service:
     their names do not tell you that writing one puts an entry in the AiMY
     Sales picker, and that is the only consequence on this menu that reaches
     outside the library. A note on those two and not the rest would be the
     worse answer — an explained row among unexplained ones reads as the odd
     one out rather than as the important one — so every row gets its line and
     the two that matter are simply the two whose line says something you could
     not have guessed. */
  const NEW_DOC_NOTE = {
    article:  'Guidance that answers a question, written once and cited.',
    ticket:   'A case as it came in, and what settled it.',
    icp:      'Who to sell to, and what rules them out.',
    campaign: 'A goal, who it targets and the window — the brief Sales runs from.',
    asset:    'A file you send — a one-pager, a sheet, an image.',
    pptx:     'A deck, with slides and where it was last shown.',
    story:    'A customer, a number, and their words for it.',
    blog:     'A public post, drafted here before it ships.',
    webpage:  'A page we already publish, pulled in to be checked.',
    product:  'Something you sell. It appears in AiMY Sales settings.',
    service:  'Something you run for a client. Appears in AiMY Sales settings.'
  };

  /* The trigger is passed in, because the two surfaces that offer this have
     different buttons — a text action on the result line, a filled one on the
     empty state — and only the panel is shared. Closing on outside-click and
     on Escape is the design system's, already wired. */
  /* ── ARRIVING WITH THIS MENU ALREADY OPEN ──

     Set by `newOffering` when somebody followed *Create a product/service* out
     of Sales settings. It is STATE THE RENDER READS, not a class poked onto the
     DOM afterwards, and that is the second attempt: poking worked and then a
     repaint 420ms later threw it away, because a class nothing re-draws is a
     class that lives until the next draw. Anything that repaints while this is
     set draws the menu open and the two rows flagged, so the number of
     repaints in that second stops mattering. */
  let flagNewTypes = false;

  function newDocMenu(trigger) {
    return `<span class="menu-anchor${flagNewTypes ? ' open' : ''}">
      ${trigger}
      <div class="menu new-menu" role="menu" aria-label="What kind of document">
        <div class="menu-label">New document</div>
        ${Object.keys(TYPES).map((k) => `<button class="menu-item${NEW_DOC_NOTE[k] ? ' has-note' : ''}${flagNewTypes && SELLABLE[k] ? ' is-flagged' : ''}" type="button" role="menuitem" data-new-type="${k}">
          ${TYPES[k].ico.replace('<svg', '<svg width="14" height="14"')}
          <span class="new-menu-tx">
            <span class="new-menu-name">${esc(TYPES[k].label)}</span>
            ${NEW_DOC_NOTE[k] ? `<span class="new-menu-note">${esc(NEW_DOC_NOTE[k])}</span>` : ''}
          </span>
        </button>`).join('')}
      </div>
    </span>`;
  }

  function resultMeta(st, list, composed) {
    const axis = talkativeAxis(st);
    const axisLabel = axis && (axis.key === 'collection' ? COLLECTIONS[axis.value] : SRC[axis.value].label);
    return `<div class="rm">
      <div class="rm-main">
        <span class="rm-count">${list.length}</span>
        <span class="rm-word">document${list.length === 1 ? '' : 's'}</span>
        ${composed
          /* "one of each kind, then your work" described how the FIXTURE was
             composed — a demo note, useful while the landing set was being
             built and meaningless to anybody using the product. What the set
             IS, on any real workspace, is the reader's own work, and that is
             what the landing view is for. The fixture still opens with one of
             every kind so every card shape gets exercised; that is a property
             of the sample data, not something the page should narrate. */
          ? `<span class="rm-note">your work</span>`
          : axis
            ? `<span class="rm-note">in <button class="rm-ask" data-settings="${axis.key}:${axis.value}">${esc(axisLabel)}</button></span>`
            : `<span class="rm-note">of ${LIVE.length}</span>`}
      </div>
      <div class="rm-end">
        <!-- One ordering, named after the question it answers. A real control
             on every surface, including the landing set, where it starts on and
             turning it off gives you what changed last. It was a dead label
             there, which is the worst place for a dead control. -->
        <button class="rm-sort${orderOf(st, composed) === 'attention' ? ' is-on' : ''}"
                type="button" data-sort-attention
                aria-pressed="${orderOf(st, composed) === 'attention'}">
          ${ICO.flag ? ICO.flag.replace('<svg', '<svg width="12" height="12"') : ''}Needs attention</button>
        <!-- Two readings of one set. The library's segmented control, so it
             reads as a view switch rather than as an action. -->
        <div class="seg rm-views" role="group" aria-label="How to show these">
          ${VIEWS.map(([v, label]) => `<button class="seg-btn${(st.view || 'grid') === v ? ' active' : ''}"
            type="button" data-view="${v}" aria-pressed="${(st.view || 'grid') === v}">
            ${(v === 'tree' ? ICO.folder : ICO.grid).replace('<svg', '<svg width="12" height="12"')}${esc(label)}</button>`).join('')}
        </div>
        <!-- AFTER the switch, not before it. Rendered first, the picker moved
             the switcher 141px right the moment you chose Folders — out from
             under the pointer that had just clicked it. It is a sub-option OF
             Folders, so it belongs downstream of the control that turns it on,
             where it can appear and disappear without moving anything. -->
        ${st.view === 'tree' ? groupPicker(st) : ''}
        <!-- No file control here. The result line is about the set you are
             looking at, and New document is the one action that belongs to it.
             Starting from a file is reachable where you are already starting
             something — the blank document's row — and by dropping one, which
             works on this page and says what it will do. -->
        ${newDocMenu(entryAction('direct', 'New document', 'data-new-menu="1" aria-haspopup="true" aria-expanded="false"', ICO.plus))}
      </div>
    </div>`;
  }

  /* ══ WHAT AiMY NOTICED ABOUT THIS SET ══════════════════════════

     What stood here first was `.rm-disclosure`: two numbers, *4 not used in
     answers* and *3 unowned*, with no interpretation, no severity and nothing
     to click. Doctrine §1.1 has a name for that shape — "a metric without an
     interpretation is merely a number wearing office clothes". It became three
     stacked rows, which fixed the interpretation and the action but still read
     as a panel the product had rather than as something AiMY said.

     This is AiMY QA/Sales' `Since your last visit` block, ported. The form is
     the argument: ONE first-person paragraph with the figures pressable inside
     it. "I looked at 12 documents. Two things need you: 3 disagree with each
     other, and 2 are behind their source." A list of findings is a report; a
     sentence in the first person is somebody telling you what they found, and
     the second is what AiMY is.

     Provenance is carried the way Sales carries it — the mark first in the
     head, the accent wash on the panel, first-person voice, and an accent
     underline on every figure. No badge and no "AI" wordmark: a thing that has
     to label itself AI is a thing that does not read as AI.

     A figure lands on exactly the set it counts. That is Sales' rule for
     `.slv-n` and it is the whole reason the numbers are pressable rather than
     bold — each one runs the finding's own `go()`, which is already one of the
     four endings §1.2 allows.

     Nothing here is a new finding. `needsYou()` has computed all eight since
     the bell was built; they were simply never shown over the corpus. Passing
     it the filtered list is the mechanism: filter to Conflicting and the
     paragraph narrows to the conflict, because it describes what you filtered
     to rather than announcing the corpus at you.

     THREE, hard. §5.1 asks for "a small, prioritised set of insights rather
     than an inventory", and the inventory is directly underneath — it is the
     grid. p1 before p2 before p3, which is the order needsYou() returns.

     Nothing to say renders nothing. There is no all-clear state, because a
     line that says everything is fine is a line you learn to skip, and then
     you skip the line that was not fine. */
  const INS_MAX = 3;
  const INS_COUNT = ['', 'One', 'Two', 'Three'];

  /* ── The finding is the target, not the digit ──

     Sales' rule for `.slv-n` is that what you press is the SIZE OF THE SET YOU
     LAND ON, and that rule is kept. What was wrong was the HIT AREA it was
     implemented with: one glyph, about 8px wide, carrying the only route from
     a finding to the documents it is about. Everything else in the clause —
     the noun, the verb, the whole statement of what is wrong — was inert text
     you could click straight through. A target that small also cannot be seen
     as a target across a paragraph; the underline reads as emphasis until you
     happen to be over it.

     The whole clause is the control now. *6 documents have not updated since
     their source stopped syncing* is one target that lands on those six, and
     the underline is drawn under all of it rather than under the digit: an
     affordance around 8px of a run you can press 300px of tells the reader the
     words are inert, which was the remaining half of the same defect. The
     figure keeps its weight and its tabular numerals, which is what makes it
     scan as a figure; it stops being the only marked thing in a clause it does
     not own.

     The division of labour is unchanged: the clause filters to exactly the
     documents it counted, and the action underneath is where the AI answer
     lives. Show me them, then do something about them.

     A finding with no ids counts something that is not a document — a coverage
     gap counts questions nobody could answer — so there is nothing to land on
     and the clause is not a control at all.

     ── Why a span and not a button ──

     A clause is a run of words in the middle of a sentence and has to break
     across lines like one. A `<button>` cannot: `display: inline` is not
     honoured on form controls, the box stays atomic, and the paragraph treats
     the whole clause as one unbreakable object. Measured at 260px — the text
     before it ended at x=469 and the clause started at the paragraph's left
     edge 21px lower, so *Three things need you:* sat alone on its own line
     with the clause dropped underneath it. Invisible at desktop width, wrong
     at every width below it, and the rail renders this band at 320px.

     So it is a span carrying the button role, with `tabindex` and an
     Enter/Space handler doing what the element would have done for free. That
     is the deal `role="button"` always is: you take the semantics and you owe
     the keyboard. Paid below, next to the click router that already routes
     `data-ins-n`. */
  const insFigure = (t) => `<span class="ins-n">${esc(String(t.n))}</span>`;

  function insightBand(list) {
    const found = needsYou(list).slice(0, INS_MAX);
    if (!found.length) return '';
    /* The noun goes on the FIRST figure only. Every finding here counts the
       same thing, so repeating "documents" three times in one sentence is the
       list-of-rows this form exists to stop being. Established once, the
       figures after it inherit it. `gap` counts questions, not documents, and
       brings its own noun. */
    const clauses = found.map((t, i) => {
      const body = insFigure(t)
        + (i === 0 && t.id !== 'gap' ? ' document' + (t.n === 1 ? '' : 's') : '')
        + ' ' + esc(t.clause);
      return t.ids && t.ids.length
        ? `<span class="ins-clause" role="button" tabindex="0" data-ins-n="${esc(t.id)}"
             aria-label="Show the ${esc(String(t.n))} ${esc(t.clause)}">${body}</span>`
        : `<span class="ins-clause is-flat">${body}</span>`;
    });
    const joined = clauses.length === 1 ? clauses[0]
      : clauses.slice(0, -1).join(', ') + ' and ' + clauses[clauses.length - 1];
    /* The result line directly above already reads "12 documents of 36", so the
       opener says what AiMY's relationship to them IS rather than counting them
       again — which is the first-person move, and it only works if it is not
       also a statistic. The scope is named only when you filtered to something,
       where naming it is the useful half. */
    const scoped = !isComposed(readURL());
    return `<section class="ins-band" aria-label="What AiMY noticed">
      <div class="ins-head">
        <!-- The attributes are a floor. .ins-head sizes the mark in em so it
             scales with the title rather than sitting pinned beside it, which
             is Sales' move and is why the head reads as one object. -->
        ${AIMY_MARK(12, 14)}
        <h2 class="ins-title">AiMY noticed</h2>
        ${scoped ? `<span class="ins-scope">in what you filtered to</span>` : ''}
      </div>
      <div class="ins-body">
        <p class="ins-line">These are what I answer from.
          <strong>${esc(INS_COUNT[found.length] || String(found.length))} thing${found.length === 1 ? '' : 's'} need${found.length === 1 ? 's' : ''} you</strong>: ${joined}.</p>
      </div>
      <!-- The actions, and nothing framing them. This was a captioned section
           of three ghost cards under an accent rule — 134px of a 279px block,
           half the panel spent on chrome around three verbs. The reason each
           card carried is not lost: INSIGHT_MINE says the per-document version
           of it on the card and in the rail, which is where a reason is worth
           reading, beside the one document it is about. -->
      <div class="ins-acts" role="group" aria-label="What AiMY would do">
        ${found.map((t) => `<button class="ins-act" type="button" data-ins="${esc(t.id)}">${esc(t.cta)}</button>`).join('')}
      </div>
    </section>`;
  }

  /* ═══════════════════════════════════════════════
     THE TREE — the graph, walked one edge at a time

     A second view, not a second product. Whatever the filters say is what the
     tree contains, so switching between grid and tree keeps your place and
     changes only the shape of what you are looking at.

     The hierarchy used to be hard-coded Collection → Type → document, which is
     one traversal of a graph that has ten implicit edge types, frozen. It is a
     **grouping**
     now, and every axis in the list is an implicit edge type: grouping by
     client is walking the `about` edge, grouping by owner is walking `ownedBy`.
     A folder view over a knowledge graph is not a filing cabinet, it is a
     choice of which relationship to see the corpus through, and `?by=` is
     where that choice lives.

     Three things make it a graph rather than a re-sort. The group headers are
     entities — the name opens the peek, so a folder can tell you what it IS.
     Documents with no value on the axis get their own honest group instead of
     being dropped. And each document carries its asserted edges on the line
     beneath it, so the connections are visible in the structure rather than
     one click away inside each document.

     Built on the library's `.tree`, which is native <details>, so it needs no
     state of its own and survives a re-render open.
  ═══════════════════════════════════════════════ */
  const AXES = {
    col:    { label: 'Collection', kind: 'collection', of: (o) => o.col,
              none: 'Not filed anywhere', order: () => USER.collections },
    client: { label: 'Client',     kind: 'client',     of: (o) => o.client, none: 'Not about any client' },
    prod:   { label: 'Product',    kind: 'product',    of: (o) => o.prod,   none: 'Answers for no product' },
    owner:  { label: 'Owner',      kind: 'owner',      of: (o) => responsible(o),  none: 'Nobody owns it' },
    src:    { label: 'Source',     kind: 'source',     of: (o) => o.src,    none: 'From nowhere' },
    region: { label: 'Region',     kind: 'region',     of: (o) => o.region, none: 'Covers no region' },
    t:      { label: 'Type',       kind: null,         of: (o) => o.t,      none: 'Untyped' }
  };

  /* The second level is Type, unless Type is already the first — then it is
     Collection, because a level that repeats the one above it is a level that
     says nothing. */
  const subGroup = (g) => (g === 't' ? 'col' : 't');

  const groupName = (g, id) => !id ? AXES[g].none
    : AXES[g].kind ? entityLabel(AXES[g].kind, id)
    : (TYPES[id] || {}).label || id;

  /* Narrowing the surface to a group. Most axes are filter keys; owner is not
     — there is no `owner` in the URL — so it narrows by identity instead,
     which is the same result reached the only way the model allows. */
  function groupFilterAttr(g, id, docs) {
    if (!id) return '';
    const f = AXES[g].kind && ENTITY[AXES[g].kind].filter;
    if (g === 't') return `data-open-axis="type:${esc(id)}"`;
    if (!f || f === 'ids') return `data-apply-ids="${docs.map((d) => d.id).join(',')}"`;
    return `data-open-axis="${f}:${esc(id)}"`;
  }

  /* A document's claims, on the line beneath it. Only the asserted ones: the
     implicit edges are the tree's own structure and repeating them here would
     print the folder name inside every folder. */
  function treeEdges(o) {
    const out = [];
    EDGES.forEach((e) => {
      if (e.from === o.id) out.push([(ASSERTED[e.type] || {}).phrase || e.type, e.to]);
      else if (e.to === o.id) {
        const inv = (ASSERTED[e.type] || {}).inverse;
        out.push([(ASSERTED[inv] || {}).phrase || 'Related to', e.from]);
      }
    });
    if (!out.length) return '';
    return `<p class="ws-tree-edges">${out.map(([phrase, id]) =>
      `<button class="ws-tree-edge" data-open-doc="${esc(id)}">
        <em>${esc(phrase)}</em> ${esc(entityLabel('doc', id))}</button>`).join('')}</p>`;
  }

  function bucket(docs, g) {
    const by = {};
    docs.forEach((o) => { (by[AXES[g].of(o) || ''] = by[AXES[g].of(o) || ''] || []).push(o); });
    const pref = (AXES[g].order ? AXES[g].order() : []).filter((k) => by[k]);
    /* Preferred order first, then whatever else the filter dragged in, and the
       group with no value last — it is a finding, not a heading, and it belongs
       at the end where a finding goes. */
    return pref
      .concat(Object.keys(by).filter((k) => k && pref.indexOf(k) < 0).sort((a, b) =>
        groupName(g, a).localeCompare(groupName(g, b))))
      .concat(by[''] ? [''] : [])
      .map((k) => [k, by[k]]);
  }

  function renderTree(st, list) {
    const g = AXES[st.by] ? st.by : 'col';
    const sub = subGroup(g);
    const top = bucket(list, g);

    return `<div class="tree ws-tree">
      ${top.map(([id, docs]) => {
        const needs = docs.filter((o) => STATUS[o.status].tone !== 'verified').length;
        const name = groupName(g, id);
        return `<details class="ws-tree-col"${top.length <= 2 ? ' open' : ''}>
          <summary>
            <svg class="tree-chev" width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            ${ICO.folder ? ICO.folder.replace('<svg', '<svg width="13" height="13"') : ''}
            ${id && AXES[g].kind
              ? `<button class="ws-tree-name is-ent" data-peek="${AXES[g].kind}:${esc(id)}"
                   title="What else touches ${esc(name)}">${esc(name)}</button>`
              : `<span class="ws-tree-name${id ? '' : ' is-none'}">${esc(name)}</span>`}
            <span class="ws-tree-n">${docs.length}</span>
            ${needs ? `<span class="ws-tree-needs" title="${needs} need a person">${needs}</span>` : ''}
            ${id ? `<button class="ws-tree-only" ${groupFilterAttr(g, id, docs)}
                    title="Show only ${esc(name)}">Only this</button>` : ''}
          </summary>
          <div class="tree-children">
            ${bucket(docs, sub).map(([sid, sdocs]) => `<details class="ws-tree-type" open>
              <summary>
                <svg class="tree-chev" width="11" height="11" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                ${sub === 't' && TYPES[sid] ? TYPES[sid].ico.replace('<svg', '<svg width="12" height="12"') : ''}
                <span class="ws-tree-name${sid ? '' : ' is-none'}">${esc(groupName(sub, sid))}</span>
                <span class="ws-tree-n">${sdocs.length}</span>
              </summary>
              <div class="tree-children">
                ${sdocs.map((o) => `<div class="ws-tree-leaf">
                  <button class="tree-leaf ws-tree-doc" data-card-open="${o.id}">
                    <span class="ws-tree-doc-title">${esc(o.title)}</span>
                    ${statusBadge(o.status)}
                    <span class="ws-tree-doc-who">${esc(responsible(o))}</span>
                  </button>
                  ${treeEdges(o)}
                </div>`).join('')}
              </div>
            </details>`).join('')}
          </div>
        </details>`;
      }).join('')}
    </div>`;
  }

  /* The grouping control. It is a dropdown rather than a segmented control
     because seven axes in a row would be a menu bar pretending to be a switch. */
  function groupPicker(st) {
    const cur = AXES[st.by] ? st.by : 'col';
    return `<div class="v2-dropdown k-filter k-group" data-axis-key>
      <button class="v2-dropdown-btn" type="button" aria-haspopup="listbox" aria-expanded="false"
              aria-label="Group the tree by">
        <span class="dd-label-text">Grouped by ${esc(AXES[cur].label.toLowerCase())}</span>
        ${ICO.chevron}
      </button>
      <div class="v2-dropdown-panel" role="listbox">
        ${Object.keys(AXES).map((k) => `<div class="v2-dropdown-option${k === cur ? ' selected' : ''}"
          role="option" aria-selected="${k === cur}" data-value="${esc(AXES[k].label)}"
          data-slug="${k}">${esc(AXES[k].label)}</div>`).join('')}
      </div>
    </div>`;
  }

  const VIEWS = [['grid', 'Cards'], ['tree', 'Folders']];

  function renderGrid(st) {
    const stage = $('#wbStage');
    const composed = isComposed(st);
    /* The composed set arrives already ordered — yours first, then everything
       else, each ranked by what needs a person. Re-sorting it here is what
       silently threw the ownership half of the composition away. */
    /* One ordering decision for both surfaces, so the toggle and the landing
       page cannot disagree about what "needs a person" means. */
    const order = orderOf(st, composed);
    const list = composed ? composedSet(order) : sortSet(applyFilters(st), order);

    if (!list.length) { stage.innerHTML = emptyResult(st); return; }

    /* The band is a washed, bordered section, so it cannot be a flex child of
       the result row. It sits BELOW the count and above the set: the count line
       says what you are looking at, the band says what AiMY noticed about it. */
    stage.innerHTML = resultMeta(st, list, composed) + insightBand(list) +
      (st.view === 'tree' ? renderTree(st, list)
                          : `<div class="ws-grid">${list.map((o) => typeCard(o)).join('')}</div>`);
  }

  /* An empty result is a finding about the filter, not an absence — except
     when the shelf itself is bare, and then it is the opposite finding and the
     Clear filters button is a lie.

     `LIVE.length` was printed either way, so browsing an empty archive read
     "37 documents, none of them matching all of these filters" over a button
     that would clear a filter that was not the reason. The count has to come
     from the set the filter was applied TO. */
  function emptyResult(st) {
    const shelf = ENTITLED.filter((o) => (st.archived ? o.arch : !o.arch));
    const noun = st.archived ? 'archived document' : 'document';
    const bare = !shelf.length;
    return `<div class="empty-state k-enter">
      <div class="empty-state-icon">${(bare ? ICO.box : ICO.search).replace('<svg', '<svg width="20" height="20"')}</div>
      <div class="empty-state-title">${bare
        ? (st.archived ? 'Nothing is archived' : 'Nothing here yet')
        : 'No matches'}</div>
      <div class="empty-state-desc">${bare
        ? (st.archived
            ? 'Archive a document and it waits here, kept whole and restorable.'
            : 'Write one, or drop a file on this page to start from something you already have.')
        : shelf.length + ' ' + noun + (shelf.length === 1 ? '' : 's')
          + ', none of them matching all of these filters.'}</div>
      <div class="k-row k-gap-2" style="justify-content:center;margin-top:14px">
        ${bare
          ? (st.archived
              ? '<button class="btn btn-ghost btn-sm" data-clear-all>Back to the library</button>'
              : `${newDocMenu('<button class="btn btn-brand btn-sm" data-new-menu aria-haspopup="true" aria-expanded="false">New document</button>')}
                 <button class="btn btn-ghost btn-sm" data-pick-files>Choose a file</button>`)
          : '<button class="btn btn-brand btn-sm" data-clear-all>Clear filters</button>'}
      </div>
      ${bare && !st.archived ? `<p class="empty-state-fine">${FILE_KINDS}</p>` : ''}
    </div>`;
  }

  /* ═══════════════════════════════════════════════
     THE DOCUMENT MODAL — viewer (AIMY-1145) and editor (AIMY-1146)

     A document opens OVER the workbench, never instead of it. Same frame as the
     canvas: absolute inside .app-main, blurred backdrop, the briefing rail and
     the input still live, Escape closes, focus returns to whatever opened it.

     `?doc=` and `&mode=` still drive it. The modal is how it renders; the URL is
     still what it is.
  ═══════════════════════════════════════════════ */
  const BODY_COPY = {
    article: ['This is the stored body — what AiMY answers from, which is not always what the live source says.'],
    /* "the criteria below" for the life of this prototype, over criteria that
       were in the fixture and on no screen. They render above it now, so the
       sentence points at something and only the direction had to change. */
    icp: ['Fit is assessed on the criteria above, in order. A prospect failing any disqualifier is out regardless of how well it scores elsewhere.'],
    ticket: ['Ingested from the source system. Ticket content is evidence, not policy — it records what was decided once, for one customer.'],
    story: ['Cleared claims only. Anything not listed as an outcome has not been measured and must not be repeated externally.'],
    campaign: ['This is the brief AiMY Sales runs from, not a record of the running. Who has been called, what they said and how far it has got are in Sales, against the campaign itself.'],
    asset: ['Approval and usage rights travel with the asset. Verified is not the same as cleared for external use.'],
    pptx: ['The deck is the content; this is the note beside it. What a reader needs from here is whether it may be shown, and whether it has been shown recently enough to still be true.'],
    blog: ['Published content. The canonical URL is what search engines and customers see; this is the copy AiMY grounds on.'],
    webpage: ['Crawled content. Where the live page has changed since the last crawl, what is stored here is what AiMY answers from.']
  };

  /* Grounding, stated on the document rather than in a matrix. This is the fact
     a person actually needs about governance — can an agent answer from this —
     and it belongs where the document is. */




  /* Versions, fixtures. The mind map lists seeing versions under VIEWING as
     well as editing, so the viewer carries them too — collapsed, because a
     reader deciding whether to trust content needs to know a history exists
     before they need to read it. */
  /* Each version carries the body it held, so opening one shows what the
     document actually said then rather than a label claiming it changed. */
  /* Versions are data, not a computed fixture.

     They used to be derived from the object on every render, which meant
     nothing could ever be added to them: accepting an AiMY rewrite changed the
     body and the history said the same three things it always had. Now each
     version carries the body it held, newest first, and every change that
     alters the text appends one. */
  const VERSIONS = (o) => o.versions || [];

  const VERSION_BODY = (o, i) => (VERSIONS(o)[i] || {}).body || o.sum;

  function seedVersions(o) {
    o.versions = [
      { v: 'v3', label: 'Clarified the ' + TYPES[o.t].label.toLowerCase() + ' scope',
        who: responsible(o), how: 'edited in the document editor', at: o.upd, body: o.sum, current: true },
      { v: 'v2', label: 'Rewritten from 12 resolved tickets', who: 'AiMY', how: 'accepted by ' + responsible(o),
        at: o.upd + 26, ai: true, body: 'Rewritten from twelve resolved tickets. ' + o.sum },
      { v: 'v1', label: 'Imported from ' + SRC[o.src].label, who: 'A. Mahfouz', how: 'first ingestion',
        at: o.ing, body: 'Imported from ' + SRC[o.src].label + '. ' + (o.sum || '').split('.')[0] + '.' }
    ];
  }

  /* Appends a version and makes it current. `body` is what the document now
     says, so restoring an older one has something real to restore to. */
  function addVersion(o, label, who, how, body, ai) {
    o.versions = o.versions || [];
    o.versions.forEach((v) => { v.current = false; });
    const n = o.versions.length + 1;
    const text = body === undefined ? o.sum : body;
    o.versions.unshift({
      v: 'v' + n, label: label, who: who, how: how, at: 0,
      body: text, ai: !!ai, current: true,
      /* The markup goes with it. A version that only kept plain text meant
         restoring one silently flattened every heading and list in it. */
      html: body === undefined ? o.html : (text === o.sum ? o.html : '')
    });
    previewVer = null;
  }

  /* Rows are buttons in the editor, where opening one has somewhere to go, and
     plain rows in the viewer, where it does not. A row that looks pressable and
     is not is worse than one that never offered. */
  const versionList = (o, pickable) => `<div class="ver-list">${VERSIONS(o).map((x, i) => {
    const inner = `<span class="ver-mark">${x.ai ? AIMY_MARK(10, 11) : esc(x.v)}</span>
      <div class="ver-main">
        <div class="ver-label">${esc(x.label)}</div>
        <div class="ver-author"><strong>${esc(x.who)}</strong> · ${esc(x.how)}</div>
      </div>
      <div class="ver-side">${x.current ? '<span class="ver-tag">Current</span>' : ''}<span class="ver-time">${esc(fmtShort(x.at))}</span></div>`;
    const cls = `ver-item${x.current ? ' is-current' : ''}${x.ai ? ' is-ai' : ''}` +
                (pickable ? ' is-pickable' : '') + (previewVer === i ? ' is-viewing' : '');
    return pickable
      ? `<button class="${cls}" data-open-ver="${i}" aria-pressed="${previewVer === i}">${inner}</button>`
      : `<div class="${cls}">${inner}</div>`;
  }).join('')}</div>`;


  /* ═══════════════════════════════════════════════
     THE PEEK — a thing, opened where you found it

     Entity pages were the obvious answer and the wrong one: a route per client
     would put back the destinations this whole build spent ten passes removing.
     So the graph surfaces in place. Click any entity anywhere and a panel opens
     anchored to it, carrying what it is, everything connected to it, and what
     you can do about it. Click a connection inside the panel and you are on the
     next thing, with a back arrow — traversal without ever leaving the page you
     were reading.

     `.cite-preview` is the library's hovercard and is the right look, but it
     cannot be the mechanism: it is `position: absolute` against a `.cite-wrap`
     parent and its open state is `:hover` on that parent. A panel that can be
     anchored to an owner's name in a card footer, a source in a rail and a row
     inside itself needs fixed positioning and a click. Recorded in GAPS.md.
  ═══════════════════════════════════════════════ */
  let peekStack = [];
  let peekOpener = null;

  /* What this thing is, in sentences. Same rule as everywhere else: no label
     above a value, a phrase that carries its own meaning. */
  function peekFacts(kind, id) {
    const n = docsOf(kind, id).length;
    const count = n + (n === 1 ? ' document' : ' documents');
    if (kind === 'doc') {
      const o = byId(id);
      if (!o) return [];
      return [TYPES[o.t].label + ' in ' + COLLECTIONS[o.col],
              'Owned by ' + responsible(o),
              'Updated ' + fmtDate(o.upd),
              STATUS[o.status].why];
    }
    if (kind === 'source') {
      const s = SRC[id];
      return [s.health === 'ok' ? 'Syncing ' + s.cadence.toLowerCase() : 'Not syncing',
              s.note, count + ' came from it'];
    }
    if (kind === 'collection') {
      const m = COLLECTION_META[id];
      const on = AGENTS.filter((a) => m.grounding[a.id]);
      return ['Owned by ' + m.owner, count,
              on.length ? on.map((a) => a.name).join(' and ') + ' can answer from it'
                        : 'No agent answers from it',
              m.retain ? 'Archives after ' + Math.round(m.retain / 30) + ' months'
                       : 'Never archives on its own'];
    }
    if (kind === 'owner') {
      const docs = docsOf(kind, id);
      const needs = docs.filter((o) => STATUS[o.status].tone !== 'verified').length;
      const cols = [...new Set(docs.map((o) => COLLECTIONS[o.col]))];
      return [count, cols.length ? 'Across ' + cols.join(', ') : '',
              needs ? needs + ' of them need a person' : 'None of them need anything'];
    }
    const docs = docsOf(kind, id);
    const stale = docs.filter((o) => STATUS[o.status].tone !== 'verified').length;
    return [count, stale ? stale + ' need a person' : 'Nothing here needs attention'];
  }

  /* ── The panel says what only it can say ──

     It used to try to be a knowledge panel: the documents, then everything
     those documents had in common, as folds. One region came out at 490px with
     thirteen visible rows and fifty-five interactive elements behind them, six
     of which were near-identical counts — *8 owners · 4 collections · 5 sources
     · 2 clients · 3 products · 20 tags* — with no priority between them. A data
     dump wearing a panel, and it was read twice as unreadable.

     Every one of those questions already has a better home:

       what else is in this region  →  Show its N documents
       who owns them                →  Folders, grouped by owner
       which of them need a person  →  Needs attention

     The surface is bigger, filterable, groupable and sortable; a 320px panel
     was competing with it and losing. So the panel keeps the one thing the
     surface cannot tell you — what this thing IS — and hands the rest over. */
  function peekBody(kind, id) {
    if (kind !== 'doc') return '';
    const groups = {};
    edgesOf(kind, id).forEach((e) => { (groups[e.phrase] = groups[e.phrase] || []).push(e); });
    /* Claims before fields: what somebody said about this document outranks
       what its own fields say, and Disagrees with outranks all of it. */
    const rank = (p) => (p === 'Disagrees with' ? 0 : ASSERTED_PHRASES.indexOf(p) > -1 ? 1 : 2);
    return Object.keys(groups)
      .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
      .map((phrase) => `<div class="peek-group">
        <span class="peek-phrase">${esc(phrase)}</span>
        <div class="peek-items">
          ${groups[phrase].map((e) => `<button class="peek-item"
              ${e.kind === 'doc' ? `data-open-doc="${esc(e.id)}"` : `data-peek="${esc(e.kind)}:${esc(e.id)}"`}>
            ${e.kind === 'doc' && byId(e.id) ? TYPES[byId(e.id).t].ico.replace('<svg', '<svg width="11" height="11"') : ''}
            <span class="peek-item-label">${esc(e.label)}</span>
            ${e.by ? `<span class="peek-by">${esc(e.by)}, ${esc(fmtShort(e.at))}</span>` : ''}
          </button>`).join('')}
        </div>
      </div>`).join('');
  }

  const ASSERTED_PHRASES = Object.keys(ASSERTED).map((k) => ASSERTED[k].phrase);

  function peekRender() {
    const host = $('#peek');
    if (!host || !peekStack.length) return;
    const top = peekStack[peekStack.length - 1];
    const { kind, id } = top;
    const docs = docsOf(kind, id);
    const facts = peekFacts(kind, id).filter(Boolean);
    const f = ENTITY[kind] || {};

    host.innerHTML = `
      <div class="peek-head">
        ${peekStack.length > 1
          ? `<button class="peek-back" data-peek-back aria-label="Back">
               ${ICO.arrow.replace('<svg', '<svg width="13" height="13" style="transform:rotate(180deg)"')}</button>`
          : ''}
        <span class="peek-title">${esc(entityLabel(kind, id))}</span>
        <span class="peek-kind">${esc(f.kind || kind)}</span>
        <button class="peek-close" data-peek-close aria-label="Close">
          ${ICO.x.replace('<svg', '<svg width="13" height="13"')}</button>
      </div>
      <p class="peek-facts">${facts.map(esc).join(' · ')}</p>
      <!-- What you can do comes BEFORE what is connected. It used to be last,
           under 978px of list in a 520px panel, which meant the panel opened
           showing you a list and no way out of it. -->
      <div class="peek-foot">
        ${kind === 'doc'
          /* The panel's first fact already says what kind of thing this is, so
             the button under it may as well name the same object. Falls back to
             the generic word for anything without a type. */
          ? entityAction(TYPE_EXIT[(byId(id) || {}).t] || 'Open it', `data-open-doc="${id}"`)
          : docs.length
            ? entityAction('Show its ' + docs.length + (docs.length === 1 ? ' document' : ' documents'),
                `data-peek-show="${esc(kind)}:${esc(id)}"`)
            : ''}
        ${kind === 'source' ? entityAction('Settings', `data-settings="source:${id}"`) : ''}
        ${kind === 'collection' ? entityAction('Settings', `data-settings="collection:${id}"`) : ''}
      </div>
      <div class="peek-body">${peekBody(kind, id)}</div>`;
    host.hidden = false;
    void host.offsetWidth;
    host.classList.add('is-open');
    peekPlace(top.rect);
    const first = $('[data-peek-back], .peek-item, [data-peek-close]', host);
    if (first) setTimeout(() => first.focus(), 40);
  }

  const entityAction = (label, attr) =>
    `<button class="peek-act" ${attr}>${esc(label)}</button>`;

  /* Anchored to what you clicked, and kept on screen. A panel that opens off
     the bottom of the window is a panel that did not open. */
  function peekPlace(rect) {
    const host = $('#peek');
    if (!host || !rect) return;
    const w = host.offsetWidth, h = host.offsetHeight;
    const pad = 10;
    let left = rect.left + rect.width / 2 - w / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
    let top = rect.bottom + 8;
    if (top + h > window.innerHeight - pad) top = Math.max(pad, rect.top - h - 8);
    host.style.left = Math.round(left) + 'px';
    host.style.top = Math.round(top) + 'px';
  }

  function openPeek(kind, id, anchor, push) {
    if (!ENTITY[kind]) return;
    const rect = anchor ? anchor.getBoundingClientRect()
                        : (peekStack[peekStack.length - 1] || {}).rect;
    if (!push) { peekStack = []; peekOpener = anchor || null; }
    peekStack.push({ kind: kind, id: id, rect: rect });
    peekRender();
  }

  function closePeek() {
    const host = $('#peek');
    if (!host || !peekStack.length) return;
    peekStack = [];
    host.classList.remove('is-open');
    setTimeout(() => { host.hidden = true; host.innerHTML = ''; }, 160);
    const back = peekOpener;
    peekOpener = null;
    if (back && document.contains(back)) setTimeout(() => back.focus(), 40);
  }

  /* Focus stays inside an open overlay. Extracted from the document modal when
     the document became a page: the settings sheet still needs it. */
  function trapFocus(root, e) {
    const f = $$('a[href],button:not([disabled]),input:not([disabled]),textarea,[contenteditable="true"],[tabindex]:not([tabindex="-1"])', root)
      .filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ── The settings sheet ──

     The same overlay as a document, because it is the same kind of thing:
     something you open over the work, act on, and close. It replaced a fake
     conversation — clicking a settings row pushed "Tell me about Confluence"
     into the thread as though you had said it, and answered with facts and a
     button per field that each opened its own dialog. None of that was editing
     settings. */
  const setModal = {
    el: null, sheet: null, open: false, openerSel: null,

    init() {
      this.el = $('#setOverlay');
      this.sheet = $('#setSheet');
      if (!this.el) return;
      document.addEventListener('keydown', (e) => {
        if (!this.open) return;
        if (e.key === 'Escape' && !$('#commitHost').innerHTML) { e.preventDefault(); this.close(); }
        if (e.key === 'Tab') this.trap(e);
      });
      this.el.addEventListener('mousedown', (e) => { if (e.target === this.el) this.close(); });
    },

    trap(e) { trapFocus(this.sheet, e); },

    show(html, key) {
      /* One thing at a time on top of the work. */
      if (!this.open && canvas.open) canvas.close({ quiet: true });
      const fresh = !this.open || key !== this.shownKey;
      const keep = fresh ? 0 : this.sheet.scrollTop;
      this.shownKey = key || null;
      this.sheet.innerHTML = html;
      this.sheet.scrollTop = keep;
      if (!this.open) {
        this.el.hidden = false;
        void this.el.offsetWidth;
        this.el.classList.add('open');
        this.open = true;
        const f = $('[data-set-close]', this.sheet);
        if (f) setTimeout(() => f.focus(), 60);
      }
    },

    close() {
      if (!this.open) return;
      this.el.classList.remove('open');
      this.open = false;
      setTimeout(() => { this.el.hidden = true; this.sheet.innerHTML = ''; }, 220);
      if (readURL().settings) patch({ settings: '' });
      setTimeout(() => { const back = $('.rail-set-name'); if (back) back.focus(); }, 60);
    }
  };

  /* Version history belongs in the chrome, not at the bottom of the body. The
     mind map puts seeing versions under VIEWING, and a collapsed panel below a
     long document is only found by someone who already knew it was there. */
  /* When each document was last written, this session. A document with nothing
     in it reports nothing — there is no save to report. */
  const savedClock = {};
  function noteSave(o) {
    if (!o || !String(o.sum || '').trim()) return;
    const d = new Date();
    savedClock[o.id] = { at: d.getTime(),
      clock: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') };
    const el = $('#docSaved');
    if (el) el.innerHTML = ICO.check.replace('<svg', '<svg width="12" height="12"') + 'Saved just now';
  }

  function savedLabel(o) {
    const rec = savedClock[o.id];
    if (!rec) return '';
    const fresh = Date.now() - rec.at < 60000;
    return `<span class="doc-saved" id="docSaved">${ICO.check.replace('<svg', '<svg width="12" height="12"')}` +
           `${fresh ? 'Saved just now' : 'Saved · ' + rec.clock}</span>`;
  }


  /* ── Unsaved changes ──

     Editing used to be its own commit: every keystroke and every field wrote
     through to the object, and the only thing the page said about it was a
     grey "Saved just now". That is autosave, and autosave has no answer to the
     two questions people actually ask of a document they are changing — "is
     this written down yet" and "can I take that back". There was no back: the
     write had already happened, in the corpus, under the search, in front of
     everybody the collection is shared with.

     So the writes still land on the object — the whole editor renders FROM the
     object, and buffering every field would mean a second copy of the document
     and two places for it to be wrong — but they are no longer a commit. The
     state the document was in when the round of edits started is kept whole,
     and the two ways out of a round are both offered, both explicit, and one
     of them has to be taken before the document can be left.

     `snap` is that state: a full clone, because a document is plain data and
     there is nothing in it a clone cannot carry. Restoring assigns back INTO
     the same object rather than swapping it, so every array in the corpus that
     holds this document keeps holding this document. */
  let edits = { id: null, snap: null, dirty: false };

  /* Key ORDER is not a change. Renaming a custom property moves its key to the
     end of the bag, re-typing a value that was never there adds one — a plain
     stringify calls both of those a difference even when the document reads
     identically, and this comparison is what decides whether the bar claims
     there is something to save. */
  const snapOf = (o) => JSON.stringify(o, (k, v) => (
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v).sort().reduce((a, kk) => { a[kk] = v[kk]; return a; }, {})
      : v));
  const clearEdits = () => { edits = { id: null, snap: null, dirty: false }; };

  /* The last clean paint IS the baseline. Every path that changes the document
     marks it dirty BEFORE it repaints, so a paint that arrives with nothing
     pending is by definition a paint of the saved document — which is exactly
     what a discard has to put back. It also means the actions that carry their
     own commit surface and their own Undo — re-syncing, restoring a version,
     recording a supersession — re-baseline through the render they already do,
     rather than being swept up in the next Discard. */
  function baseline(o) {
    if (!o) return;
    if (edits.dirty && edits.id === o.id) return;
    edits = { id: o.id, snap: snapOf(o), dirty: false };
  }

  /* ── The body as it was drawn ──

     A document does not arrive as a page. Most of the corpus stores a summary
     and no markup at all, and the editor renders that into paragraphs — so
     writing an untouched body back to the object replaced a one-line summary
     with the renderer's own output and set `html` on a document that never had
     any. Nobody edited anything; the renderer caught up with itself. That was
     invisible while it was autosaved the instant it happened. Offer a Save and
     it stops being invisible: putting the pointer in the body and taking it
     out again announced unsaved changes to a document nobody had touched.

     So renderDoc records what it put in the body, and the body's writer
     compares against THAT rather than against the object. Nothing moved,
     nothing is written — which is also what stops `html` from collecting a
     layer of the template's whitespace on every focus.

     `bodyWritten` closes the one hole in that: once this round HAS written the
     body, every later write has to go through, or a body edited and then
     deleted back to the markup it was drawn with would leave the object
     holding the edit. Only the untouched case is skipped. */
  let bodyDrawn = null;
  let bodyWritten = false;

  /* A round typed back to where it started is not a round. The field surfaces
     commit on blur, so a value restored with Escape — or typed out and typed
     back — arrives here identical to the baseline, and the bar should say so
     rather than holding a Save over nothing.

     Only at commit points. Mid-keystroke the object has not caught up with the
     field yet, and checking there would make the buttons flicker in and out
     under the typing. */
  function settle(o, quiet) {
    if (!isDirty(o) || snapOf(o) !== edits.snap) return;
    edits.dirty = false;
    if (!quiet) paintTopEnd(o);
  }

  /* Marked, then settled: together these two ask the object whether anything
     actually differs from the baseline, in both directions. Every commit point
     runs it, so a change raises the Save and an edit undone by hand puts it
     away again — without either of them needing to know what was touched. */
  function recheck(o, quiet) { markDirty(o, quiet); settle(o, quiet); }

  /* Whatever is under the caret right now, written down. The bar's buttons do
     not take focus — they cannot, or the blur would repaint them out from
     under the click — so the field they were clicked from is still open, and
     what it holds is part of the round being saved. */
  function commitLive() {
    const t = document.activeElement;
    if (!t || !t.closest || !t.closest('.doc-page') || !t.hasAttribute) return;
    if (t.id === 'editBody') { writeBody(t); return; }
    if (t.hasAttribute('data-edit-title')) {
      const o = byId(readURL().doc);
      const v = t.textContent.trim();
      if (o && v) o.title = v;
      return;
    }
    if (t.hasAttribute('data-x-val')) { commitXField(t); return; }
    if (t.hasAttribute('data-prop-k') || t.hasAttribute('data-prop-v')) { commitProp(t); return; }
  }

  const isDirty = (o) => !!(o && edits.dirty && edits.id === o.id);
  const dirtyDoc = () => (edits.dirty && edits.id ? byId(edits.id) : null);

  /* Called where noteSave used to be — the same two funnels every edit already
     went through. The top bar is swapped in place rather than repainted with
     the page, because the body writes through on every keystroke and a repaint
     would take the caret with it. */
  function markDirty(o, quiet) {
    if (!o) return;
    if (edits.id !== o.id) { edits = { id: o.id, snap: snapOf(o), dirty: false }; }
    if (edits.dirty) return;
    edits.dirty = true;
    if (!quiet) paintTopEnd(o);
  }

  function paintTopEnd(o) {
    const el = $('.doc-top-end');
    if (el && byId(readURL().doc) === o) el.innerHTML = docTopEnd(o);
  }

  /* Publish is a way out of the document too, so it is closed while there is
     something unwritten — but it does not SAY so. Every other reason the gate
     is shut goes in the label, because nothing else on the bar is saying it;
     this one is already said twice over by the words and the two buttons
     immediately to its left, and a third copy of it is just width. */
  const publishTitle = (o) => (isDirty(o)
    ? 'Save or discard your changes first'
    : publishGate(o) + ' — a document that does not say what it is cannot go live');

  /* What sits at the end of the top bar. One function, because the bar is
     drawn twice — once with the page, once in place on the keystroke that
     makes the document dirty — and two copies would drift.

     Discard says "Discard changes" and not "Discard", because the slot it
     lands in already has a Discard: an untouched blank document offers to
     throw ITSELF away, and the two are one word and one click apart. */
  function docTopEnd(o) {
    const pending = isDirty(o);
    const gate = publishGate(o);
    return `
            ${pending
              ? `<span class="doc-unsaved">${ICO.warn.replace('<svg', '<svg width="12" height="12"')}Unsaved changes</span>
                 <button class="btn btn-ghost btn-sm" data-changes-discard>Discard changes</button>
                 <button class="btn btn-brand btn-sm" data-changes-save>Save changes</button>`
              : `${savedLabel(o)}
                 ${isBlankDoc(o) ? `<button class="btn btn-ghost btn-sm" data-discard="${o.id}">Discard</button>` : ''}`}
            ${o.status === 'draft'
              ? `<button class="btn btn-brand btn-sm" data-act="publish" data-obj="${o.id}" data-publish
                   ${gate || pending ? `disabled title="${esc(publishTitle(o))}"` : ''}
                 >${gate || 'Publish'}</button>` : ''}
            <button class="doc-rail-toggle" data-rail-toggle aria-expanded="${railOpen}"
                    aria-label="${railOpen ? 'Hide details' : 'Show details'}">
              ${ICO.sidebar ? ICO.sidebar.replace('<svg', '<svg width="15" height="15"') : ICO.eye.replace('<svg', '<svg width="15" height="15"')}</button>`;
  }

  /* Writing the round down. There is no new version and no new date: this is
     the save the editor never had, not the publish it already has. */
  function saveChanges(quiet) {
    commitLive();
    const o = byId(readURL().doc);
    if (!isDirty(o)) return false;
    edits = { id: o.id, snap: snapOf(o), dirty: false };
    noteSave(o);
    recompute();
    render();
    if (!quiet) toast('Changes saved', null, 'The document now says what you wrote');
    return true;
  }

  /* And putting the round back. Own keys added since the baseline are removed
     rather than left behind — a property invented during the round is part of
     the round. */
  function discardChanges(quiet) {
    const o = byId(readURL().doc);
    if (!isDirty(o) || !edits.snap) return false;
    const was = JSON.parse(edits.snap);
    Object.keys(o).forEach((k) => { if (!(k in was)) delete o[k]; });
    Object.assign(o, was);
    edits = { id: o.id, snap: snapOf(o), dirty: false };
    /* Both of these point at a row that may not exist any more. */
    openXField = null;
    openProp = null;
    recompute();
    render();
    if (!quiet) toast('Changes discarded', null, 'The document is back as it was');
    return true;
  }

  /* ── The changes guard ──

     One question, asked at the one place every way out of a document goes
     through, with both answers on it and neither of them chosen for you.
     Cancel is not a third answer — it is staying, which is what you were
     already doing.

     Deferred by a tick because a leave can be triggered from inside a commit
     surface's own onRun, and the click handler tears that surface down the
     moment onRun returns — including this one, if it opened synchronously. */
  let guardNext = null;
  function guardLeave(go) {
    const o = dirtyDoc();
    if (!o) { go(); return; }
    guardNext = go;
    setTimeout(() => {
      if (!guardNext) return;
      commit({
        title: 'You have unsaved changes',
        cancel: 'Keep editing',
        confirm: 'Save and leave',
        current: 'Unsaved edits',
        proposed: 'Written to the document',
        rationale: `<strong>${esc(o.title)}</strong> has changes that have not been written yet.
          Leaving is fine — but the changes go one way or the other first, and which way is yours to say.`,
        effects: [
          ['ok', 'Saving writes them to the document, then leaves.'],
          ['skip', 'Discarding puts the document back as it was, then leaves.']
        ],
        reversible: 'Nothing here is published. Publishing is still a separate decision.',
        extra: '<button class="btn btn-ghost" data-guard-discard>Discard and leave</button>',
        onRun: () => { saveChanges(true); runGuardNext(); return true; }
      });
    }, 0);
  }

  function runGuardNext() {
    const go = guardNext;
    guardNext = null;
    if (go) go();
  }


  /* ── Comments ──

     In the viewer, not the editor. Commenting on a document is something you do
     while READING it — you have just found the thing you want to say something
     about. Putting the thread behind Edit meant taking a document out of
     everyone's hands to leave a note on it, and it hid the notes from every
     person who only ever reads.

     A draft still has none: nobody can read it, so there is nobody to discuss
     it with. Publishing is what gives a document readers. */
  function commentThread(o) {
    if (o.status === 'draft') return '';
    const list = o.comments || [];
    return `<div class="comment-thread">
      <div class="comment-thread-head">
        <span class="comment-thread-label">Comments</span>
        ${list.length ? `<span class="comment-thread-n">${list.length}</span>` : ''}
      </div>
      ${list.length
        ? list.map((c, i) => `<div class="comment${c.problem ? (c.done ? ' is-problem is-done' : ' is-problem') : ''}">
            <div class="avatar avatar-sm">${esc(c.initials)}</div>
            <div class="comment-body">
              <div class="comment-head"><span class="comment-author">${esc(c.who)}</span>
                ${c.problem ? `<span class="comment-flag">${ICO.flag.replace('<svg', '<svg width="11" height="11"')}
                  ${c.done ? 'Resolved' : 'Reported a problem'}</span>` : ''}
                <span class="comment-time">${esc(c.when)}</span></div>
              <div class="comment-text">${esc(c.text)}</div>
              <!-- A report is a job, so it has a way to be finished. Anyone who
                   can read the document can close it: the person who fixed it
                   is not always the owner, and a queue only one person can
                   clear is a queue that does not clear. -->
              ${c.problem && !c.done
                ? `<button class="comment-resolve" data-resolve-problem="${i}">Mark it resolved</button>` : ''}
            </div>
          </div>`).join('')
        : `<p class="comment-empty">Nothing yet. A comment is the way to raise something
           without changing the document.</p>`}
      <!-- One control, not two. A word-button beside a field asks you to read
           it before you can use the field; a send glyph inside it is the same
           affordance every message box has, and Enter already did the job. -->
      <div class="comment-compose">
        <input class="field-input" type="text" placeholder="Add a comment…" aria-label="Add a comment"
               data-comment-input>
        <button class="comment-send" data-comment-add aria-label="Add this comment" title="Add this comment">
          ${ICO.send.replace('<svg', '<svg width="14" height="14"')}</button>
      </div>
    </div>`;
  }


  /* ── Editor (AIMY-1146): toolbar, formatting, comments, versions, AI ── */
  const TOOLBAR = [
    ['bold', '<strong>B</strong>', 'Bold'], ['italic', '<em>I</em>', 'Italic'],
    ['underline', '<span style="text-decoration:underline">U</span>', 'Underline'], ['|'],
    ['formatBlock:h3', 'H2', 'Heading'], ['formatBlock:h4', 'H3', 'Subheading'], ['|'],
    ['insertUnorderedList', '&#8226;&#8202;&#8212;', 'Bulleted list'],
    ['insertOrderedList', '1.&#8202;&#8212;', 'Numbered list'],
    ['formatBlock:blockquote', '&#8220;', 'Quote'], ['|'],
    ['undo', '&#8630;', 'Undo'], ['redo', '&#8631;', 'Redo']
  ];

  /* What can be done to WORDS rather than to a block. The selection menu carries
     these; the block toolbar carries the rest, because a heading or a list is a
     property of the paragraph and applying one to three words means applying it
     to the paragraph they are in. */
  /* Each figure gets a name it keeps. Opening the native file dialog blurs the
     page, which blurs the body, which repaints the editor — so the element that
     asked for the file is gone by the time the file arrives. A name survives the
     repaint; a reference does not. */
  let figSeq = 0;

  const SEL_FMT = [
    ['bold', '<strong>B</strong>', 'Bold'],
    ['italic', '<em>I</em>', 'Italic'],
    ['underline', '<span style="text-decoration:underline">U</span>', 'Underline']
  ];

  /* ── The block types ──

     The toolbar could already make a heading or a list out of the block you
     were in, which is formatting. What it could not do is what every document
     tool is expected to do: ADD a block of a different kind. So there is one
     list of block types, reachable two ways — the + in the block toolbar, for
     the first time, and `/` on an empty line, for every time after.

     The first five run execCommand, because the browser already knows how to
     turn a paragraph into a heading or a list. The last three insert real
     markup, because there is no command for "a code block". */
  /* `insertHTML` sanitises a <pre> or a <figure> into an inline span and drops
     it wherever the caret happens to be — mid-word, inside the paragraph. A
     block has to arrive as a block, so this places it in the body itself: after
     the block being written, or in its place when that one is empty. The caret
     lands on the part you would type next. */
  function insertBlock(html) {
    const body = $('#editBody');
    if (!body) return;
    let at = caretBlock();
    if (!at || at.parentElement !== body) at = body.lastElementChild;

    const wrap = document.createElement('div');
    wrap.innerHTML = html + '<p><br></p>';
    const made = [...wrap.children];
    const after = at ? at.nextSibling : null;
    made.forEach((n) => body.insertBefore(n, after));
    /* An empty paragraph you were sitting in was only ever a place to stand, so
       the new block takes its place. An empty code block or figure is empty on
       purpose — waiting for you — and stays. */
    if (at && !at.textContent.trim() && /^(P|H3|H4|DIV|BLOCKQUOTE)$/.test(at.tagName)) at.remove();

    const fill = made[0].querySelector('code, figcaption') || made[made.length - 1];
    const r = document.createRange();
    r.selectNodeContents(fill); r.collapse(true);
    putCaret(r);
  }

  const BLOCKS = [
    ['Text',          'T',   () => document.execCommand('formatBlock', false, 'p')],
    ['Heading',       'H',   () => document.execCommand('formatBlock', false, 'h3')],
    ['Subheading',    'H',   () => document.execCommand('formatBlock', false, 'h4')],
    ['Bulleted list', '&#8226;',  () => document.execCommand('insertUnorderedList')],
    ['Numbered list', '1.',  () => document.execCommand('insertOrderedList')],
    ['Quote',         '&#8220;',  () => document.execCommand('formatBlock', false, 'blockquote')],
    /* The block arrives empty with the caret in it and its hint drawn by CSS,
       the way a real editor does it. Placeholder *text* would have to be
       selected to be replaced, and a selection is what makes the toolbar hand
       over to the selection menu — so the tools would vanish on arrival. */
    ['Code',          '&lt;&gt;', () => insertBlock('<pre class="doc-code"><code></code></pre>')],
    /* No upload in a prototype, and a fake one would be worse than none. The
       block says what it is waiting for, and the drop handler this document
       already has is what fills it. */
    /* ── Choose, do not drop ──

       The placeholder used to read "Drop an image on the document to fill
       this", which asked for the one gesture the page had already claimed: the
       workbench's drop layer turns any dropped file into a new document, so
       aiming at the figure made a document instead of an image. Two meanings
       for one gesture, and the block always lost. A file field is a control
       everyone has already been taught, and it collides with nothing. */
    ['Image',         '&#9635;',  () => insertBlock(
      '<figure class="doc-figure" data-fig="' + (++figSeq) + '">' +
      '<button type="button" class="doc-figure-ph" contenteditable="false" ' +
      'data-pick-image="' + figSeq + '">Choose an image</button><figcaption></figcaption></figure>')],
    ['Divider',       '&#8212;',  () => insertBlock('<hr class="doc-hr">')]
  ];

  /* ═══════════════════════════════════════════════
     THE EDITOR (AIMY-1146)

     Editor state that is not the document's: which right-hand tab is open, and
     which version is being previewed. Both are view state, so neither belongs
     in the URL — reopening an editor on the Properties tab is not a place
     anyone would want to link to.
  ═══════════════════════════════════════════════ */
  let editorTab = 'props';
  let previewVer = null;
  /* Which custom property is open for editing. View state, like the rest of
     this — nobody wants to link to a document with one field unfolded. */
  let openProp = null;
  /* Which set-valued field has its panel open, by key. One at a time, for the
     same reason the dropdowns are one at a time: two panels over a 320px rail
     cover the rows they belong to. */
  let openMulti = null;

  const OWNERS = ['N. Wael', 'A. Mahfouz', 'O. Said', 'Sales Ops', 'Marketing', 'Brand', 'Legal', 'Unassigned'];

  /* Every property is a control that writes straight through to the object.
     Status is shown and not set: it is derived, and a field you could type into
     would be the attestation model coming back through a side door.

     ── The field is NAMED, not narrated ──

     This panel used to read as sentences — *Owned by N. Wael*, *Filed in
     Support*, *About no client*, *It is an Article*. The argument was that a
     phrase says what a label cannot. In a 320px column of nine facts it does
     the opposite: every row opens with a different function word, so the left
     edge no longer aligns on anything a reader can scan, and the eye has to
     parse a preposition before it reaches the fact. *About* is also the
     weakest word in the product — it is a preposition, an editing verb and a
     rail heading, and none of the three tells you the row holds a client.

     So the lead is the field's NAME and the value is the value: *Client:
     Nordwind GmbH*. Nine rows that start with a noun, one colon, no grammar to
     agree with. The sentence reading is not lost — it moves to where a
     sentence earns its keep, which is the graph: an edge still reads *Belongs
     to CXS* in the connections rail, because there the phrase IS the
     relationship rather than a label wearing one.

     Consequently `blank` is *None* and not *no client*: a sentence-completion
     under a label reads as a value called "no client". The colon comes from
     `.props .prop-lead::after`, so it is punctuation in the stylesheet rather
     than nine copies of it in the copy. */
  const artic = (s) => (/^[aeiou]/i.test(s) ? 'an ' : 'a ') + s;

  /* Ordered as the tenancy is: who owns it, what it is, then the tree above
     the content — the client, then the product inside it — then the filing.
     `lead` is gone; a field whose lead is its own name does not need to say it
     twice. */
  const PROP_FIELDS = [
    { key: 'owner',  label: 'Owner',        map: () => OWNERS.map((x) => [x, x]) },
    { key: 't',      label: 'Type',         map: () => opts(TYPES) },
    { key: 'client', label: 'Client',       map: () => opts(CLIENTS),     blank: 'None' },
    { key: 'col',    label: 'Collection',   map: () => opts(COLLECTIONS), blank: 'None' },
    { key: 'prod',   label: 'Product',      map: () => opts(PRODUCTS),    blank: 'None' },
    { key: 'region', label: 'Region',       map: () => opts(REGIONS),     blank: 'None' }
  ];

  /* `row` puts the lead inside the trigger and lets it fill the line. The
     library's panel, keyboard model and ARIA are untouched — only the trigger
     changes shape, and `data-value` carries the display form so selecting a new
     option does not drop the article the trigger was reading with. */
  function propDropdown(f, o, row) {
    /* `x.` addresses the type's own bag. One accessor rather than a second
       dropdown builder, so every field on this panel keeps the same trigger,
       the same panel and the same keyboard model. */
    const cur = (f.key === 'owner' ? responsible(o)
      : f.key.slice(0, 2) === 'x.' ? xVal(o, f.key.slice(2))
      : o[f.key]) || '';
    const blank = f.blank || '—';
    const rows = [['', blank, blank]]
      .concat(f.map().map(([v, l]) => [v, f.disp ? f.disp(l) : l, l]));
    const label = rows.reduce((acc, r) => (r[0] === cur ? r[1] : acc), blank);
    return `<div class="v2-dropdown k-prop${row ? ' k-row' : ''}" data-prop-key="${f.key}">
      <button class="v2-dropdown-btn" type="button" aria-haspopup="listbox" aria-expanded="false"
              aria-label="${esc(f.label)}">
        ${row && (f.lead || f.label) ? `<span class="prop-lead">${esc(f.lead || f.label)}</span>` : ''}
        <span class="dd-label-text">${esc(label)}</span>
        ${ICO.chevron}
      </button>
      <div class="v2-dropdown-panel" role="listbox">
        ${rows.map(([v, value, text]) => `<div class="v2-dropdown-option${v === cur ? ' selected' : ''}"
          role="option" aria-selected="${v === cur}" data-value="${esc(value)}" data-slug="${esc(v)}">${esc(text)}</div>`).join('')}
      </div>
    </div>`;
  }

  /* An empty tag field inside a sentence used to render as a full stop after a
     blank — "and it touches ." — so the placeholder answers the sentence
     instead of instructing the field. */
  /* ═══════════════════════════════════════════════
     THE TYPE'S OWN FIELDS, AS CONTROLS

     Everything in `o.x` was read-only. Eight types' worth of facts that the
     card renders, the document renders and the rail read aloud — a ticket's
     resolution, a blog's author, a web page's URL, an ICP's fit criteria —
     and not one of them could be changed anywhere in the product. The panel's
     own rule two hundred lines up is that every property here is a control
     that writes straight through to the object; the type-specific half had
     simply never been given one.

     This REPLACES the read-only facts block that used to sit at the top of
     the panel. That block rendered these same values as phrases, so keeping
     both would put every fact on screen twice, four rows apart — once as
     prose and once as a field. The lead phrases below are the ones the facts
     block used, so nothing about how it reads has been lost.

     Four kinds, because four is what the data actually is:
       text   — a phrase. Reads as a fact, becomes an input when clicked,
                the same rule the title, the body and the custom facts follow.
       pick   — a closed set. A ticket is Resolved or it is not, and a text
                box would invite a ninth spelling of a word with four.
       number — the ICP's fit score, clamped 0-100 because it is a percentage
                and a field that accepts 900 is a field that will hold 900.
       list   — the ICP's criteria, which are SENTENCES. `tagField` cannot
                hold them: it slugs its input on Enter, so "Existing QA
                function" would be stored as "existing-qa-function".

     Ticket assignee is deliberately absent: it is edited through the Owner
     row, which is where every surface already puts whoever answers for the
     document. Two controls for one field is how they drift.
  ═══════════════════════════════════════════════ */
  const TYPE_FIELDS = {
    /* One row, and it is the row Sales reads. Everything else about an
       offering — what it is, who it suits, what it costs — is the document's
       own prose, which is where a reader is already looking. */
    product:  [['pitch', 'One line for Sales', 'text']],
    service:  [['pitch', 'One line for Sales', 'text']],
    article:  [['applies', 'Applies to', 'text']],
    ticket:   [['status', 'At source it is', 'pick', ['Resolved', 'Open', 'Awaiting legal', 'On hold']],
               ['requester', 'Raised by', 'text'],
               ['resolution', 'Closed with', 'long']],
    icp:      [['score', 'Fit score', 'number'],
               ['segment', 'Segment', 'text'],
               ['fit', 'Fits when', 'list'],
               ['dis', 'Ruled out by', 'list']],
    /* ── THE CAMPAIGN, AS AiMY SALES DEFINES ONE ──

       These three rows were this file's own idea of a campaign — aimed at, ran,
       includes — and AiMY Sales, which is where campaigns actually live, holds
       a different and larger record. Read off a campaign page there, the block
       above the fold is: the goal, what we sell them, the client, the targeted
       persona, the sector, the region, the company size band, the window, the
       sales pitch and the team. Everything BELOW that fold is the working of it
       — who has been called, callbacks, never-called, connect rates, what came
       up on which call.

       This is the distillation, so the line is drawn at that fold. What
       survives is what somebody had to decide in order for the campaign to
       exist; what goes is everything the campaign then accumulated by running.
       `assets` went with it: a list of pieces sent is the same kind of fact as
       a list of calls made.

       Four of Sales' ten are NOT here because the console already holds them on
       every document — client, region and owner are core fields, and the team
       is the owner — and repeating them as campaign properties would be the
       same fact in two rows of one panel. */
    campaign: [['goal', 'The goal', 'text'],
               ['sells', 'What we sell them', 'text'],
               ['persona', 'Targeted persona', 'text'],
               ['sector', 'Sector', 'text'],
               ['size', 'Company size', 'text'],
               ['window', 'Runs', 'text'],
               ['pitch', 'Sales pitch', 'long']],
    asset:    [['format', 'Format', 'text'],
               ['usage', 'Used', 'pick', ['External — customer-facing', 'External — under NDA', 'Internal only']],
               ['approval', 'Approval', 'pick', [['approved', 'Approved'], ['pending', 'Awaiting approval']]]],
    /* No `format` row: the format IS the type, and a field whose only honest
       value is the name of the type it is on is the same fact twice. */
    /* A deck is not a percentage, so it does not stop at 100. 999 is not a
       real ceiling either — it is the point past which a number is a typo. */
    pptx:     [['slides', 'Slides', 'number', { max: 999 }],
               ['presented', 'Last presented', 'text'],
               ['usage', 'Shown', 'pick', ['External — customer-facing', 'External — under NDA', 'Internal only']],
               ['approval', 'Approval', 'pick', [['approved', 'Cleared to present'], ['pending', 'Not cleared']]]],
    /* No `customer` row. The research draws a Success Story's customer as an
       edge to CLIENT, and this document already has one: `o.client` is the
       filterable relation, it is what the card prints, and it is what
       `?client=nordwind` narrows by. A second free-text field saying the same
       name is a fact the surface cannot use and the two can disagree.

       What that field carried and the relation does not is the SIZE of the
       engagement — "800 seats" — so the scale keeps a row of its own and the
       name keeps the edge. */
    story:    [['size', 'Size', 'text'],
               ['outcome', 'Outcome', 'text'],
               ['quote', 'They said', 'long'],
               ['approval', 'Approval', 'pick', [['approved', 'Cleared to quote'], ['pending', 'Not cleared']]]],
    blog:     [['pub', 'State', 'pick', ['Published', 'Draft — unpublished']],
               ['author', 'Written by', 'text'],
               ['canonical', 'Canonical at', 'text']],
    webpage:  [['url', 'Source URL', 'text']]
  };

  /* Which type field is unfolded. Its own variable rather than a namespaced
     `openProp`, because custom property keys are free text and a collision
     would fold the wrong row. */
  let openXField = null;

  const xVal = (o, k) => (o.x || {})[k];

  /* Same click-to-edit shape as a custom fact, minus the key input and the
     delete button — the key is the type's, not yours, and the field cannot be
     removed without changing what kind of thing the document is. */
  const xText = (o, k, lead, cfg) => {
    const v = xVal(o, k);
    const shown = v === undefined || v === '' || v === '—' ? '—' : String(v);
    return `<div class="prop-kv is-fixed${openXField === k ? ' is-open' : ''}" data-x-pair="${esc(k)}">
      <button class="prop-kv-read" data-x-open="${esc(k)}">
        <span class="prop-lead">${esc(lead)}</span>
        <span class="prop-kv-val">${esc(shown)}</span>
      </button>
      ${xInput(o, k, lead, cfg || {})}
    </div>`;
  };

  /* Reads exactly like a text row — same lead, same left edge, same truncation
     — and opens the modal instead of unfolding an input. The affordance has to
     be identical or the panel grows a second kind of row for a difference the
     reader cannot see. */
  const xLong = (o, k, lead) => {
    const v = xVal(o, k);
    const shown = v === undefined || v === '' || v === '—' ? '—' : String(v);
    return `<div class="prop-kv is-fixed" data-x-pair="${esc(k)}">
      <button class="prop-kv-read" data-x-modal="${esc(k)}" data-x-lead="${esc(lead)}">
        <span class="prop-lead">${esc(lead)}</span>
        <span class="prop-kv-val">${esc(shown)}</span>
      </button>
    </div>`;
  };

  /* Prose, not slugs. Reuses the token look and nothing else — the add field
     is wide because a criterion is a sentence, and Enter stores what you
     typed rather than a hyphenated version of it. */
  const xList = (o, k, lead) => {
    const vals = xVal(o, k) || [];
    return `<div class="tag-input is-prose${vals.length ? '' : ' is-empty'}" data-x-list="${esc(k)}">
      ${vals.map((v, i) => `<span class="tag-token">${esc(v)}
        <button type="button" data-x-drop="${i}" aria-label="Remove ${esc(v)}">&times;</button></span>`).join('')}
      <input type="text" placeholder="${vals.length ? 'add another…' : 'nothing yet'}"
             aria-label="Add to ${esc(lead)}" data-x-add="${esc(k)}">
    </div>`;
  };

  /* ── A field whose read face is a shape ──

     A fit score reads as a three-bar meter, an approval as a pill, a canonical
     URL as a monospace run. Each of those is also a field somebody edits, and
     the obvious build — draw the shape, then draw the row underneath it —
     puts the same fact on screen twice forty pixels apart, which is exactly
     what TYPE_FACTS was deleted for (:2232).

     So the shape IS the read face of the row. Same `prop-kv` grid, same
     unfold, same commit path, same `data-x-val` the focusout handler already
     reads — this is `xText` with `esc(shown)` swapped for trusted markup, and
     it wires to nothing new.

     `face` is markup this file built from a value it already escaped —
     confBadge, approvalPill, a `.tc-mono` span — and never a raw field. A
     caller passing user input straight in would be writing the one XSS hole in
     the product, so callers build the face through the same primitives the
     card uses. */
  const xFaced = (o, k, lead, face, opt) => {
    const cfg = opt || {};
    return `<div class="prop-kv is-fixed${!cfg.modal && openXField === k ? ' is-open' : ''}" data-x-pair="${esc(k)}">
      <button class="prop-kv-read"
        ${cfg.modal ? `data-x-modal="${esc(k)}" data-x-lead="${esc(lead)}"` : `data-x-open="${esc(k)}"`}>
        <span class="prop-lead">${esc(lead)}</span>
        <span class="prop-kv-val">${face}</span>
      </button>
      ${cfg.modal ? '' : xInput(o, k, lead, cfg)}
    </div>`;
  };

  /* ── The editing control for a field, in the product's own clothes ──

     A number was `<input type="number">` and nothing else, so the browser drew
     its own stepper on it: two grey chevrons that belong to Chrome, next to a
     page where every other control is the design system's. The library ships a
     `.stepper` — bordered, its own buttons, the native spin buttons already
     suppressed — and it was simply never used here.

     `data-step` carries the direction rather than a handler per button, and the
     input keeps `data-x-val`, so the stepper commits through exactly the same
     writer as typing into it does. Nothing about the commit path is new. */
  const xInput = (o, k, lead, cfg) => {
    const raw = xVal(o, k);
    const blankish = raw === undefined || raw === '—';
    const val = esc(blankish ? '' : String(raw));
    if (!cfg.num) {
      return `<input class="field-input" type="text" value="${val}" data-x-val="${esc(k)}"
             placeholder="${esc(lead)}" aria-label="${esc(lead)}">`;
    }
    return `<span class="stepper">
      <button type="button" data-step="-1" aria-label="Less" tabindex="-1">&minus;</button>
      <input type="number" inputmode="numeric" min="${cfg.min === undefined ? 0 : cfg.min}"
             max="${cfg.max === undefined ? 100 : cfg.max}" step="1"
             value="${val}" data-x-val="${esc(k)}" aria-label="${esc(lead)}">
      <button type="button" data-step="1" aria-label="More" tabindex="-1">+</button>
    </span>`;
  };

  /* ── A field too long for the rail ──

     A resolution and a customer quote are sentences, and a 320px column shows
     about thirty characters of one before the ellipsis takes over. Inline, the
     value could neither be READ nor sensibly edited: a single-line input
     scrolling a fifty-character sentence four characters at a time is a worse
     way to fix a typo than not offering to.

     So the row stays a row — same lead, same left edge, same click — and what
     opens is a surface with room. Not `commit()`: that surface exists to stage
     a consequential write, and it always ends in an effects list and a
     reversibility line. Every other field on this panel writes straight
     through, and a field that demanded confirmation because its VALUE is long
     would be ceremony chosen by character count. Same library modal, none of
     the ritual. */
  function xModal(o, k, lead) {
    const host = $('#commitHost');
    if (!host) return;
    const v = xVal(o, k);
    host.innerHTML = `
      <div class="modal-backdrop" style="display:flex" data-xm-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(lead)}"
             style="width:520px;max-width:100%">
          <div class="modal-header">
            <div class="modal-title">${esc(lead)}</div>
            <button class="modal-close" data-xm-close aria-label="Close">${ICO.x.replace('<svg', '<svg width="14" height="14"')}</button>
          </div>
          <div class="modal-body">
            <p class="xm-of">On <strong>${esc(o.title)}</strong></p>
            <textarea class="field-input xm-text" data-xm-val="${esc(k)}" rows="5"
                      spellcheck="false" aria-label="${esc(lead)}"
                      placeholder="${esc(lead)}">${esc(v === undefined || v === '—' ? '' : String(v))}</textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" data-xm-close>Cancel</button>
            <button class="btn btn-brand" data-xm-save="${esc(k)}">Save</button>
          </div>
        </div>
      </div>`;
    const ta = $('.xm-text', host);
    if (ta) setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 60);
  }

  const closeXModal = () => { const h = $('#commitHost'); if (h) h.innerHTML = ''; };

  /* `skip` lets a view draw one of its own rows as a faced row (§xFaced) and
     suppress the plain one, without a fifth `kind` and without TYPE_FIELDS
     growing a column that only two types would use. One fact, one control. */
  function typeFieldRows(o, skip) {
    const drop = skip || [];
    return (TYPE_FIELDS[o.t] || []).filter(([k]) => drop.indexOf(k) < 0).map(([k, lead, kind, opts]) => {
      if (kind === 'pick') return propDropdown({
        key: 'x.' + k, label: lead, lead: lead, blank: '—',
        map: () => opts.map((v) => (Array.isArray(v) ? v : [v, v]))
      }, o, true);
      if (kind === 'list') return propRow(lead, xList(o, k, lead));
      if (kind === 'long') return xLong(o, k, lead);
      /* For a number the fourth slot carries its bounds — `pick` is the only
         other kind that uses it, and it is not a number. A slide count and a
         percentage do not share a ceiling. */
      if (kind === 'number') return xText(o, k, lead, Object.assign({ num: true }, opts || {}));
      return xText(o, k, lead, null);
    }).join('');
  }

  const tagField = (o, key, label, lookup) => {
    const vals = o[key] || [];
    return `<div class="tag-input${vals.length ? '' : ' is-empty'}" data-tag-field="${key}">
      ${vals.map((v) => `<span class="tag-token">${esc(lookup ? lookup[v] || v : v)}
        <button type="button" data-tag-drop="${esc(v)}" aria-label="Remove ${esc(v)}">&times;</button></span>`).join('')}
      <input type="text" placeholder="${vals.length ? 'add…' : 'none — add one'}"
             aria-label="Add ${esc(label)}" data-tag-add="${key}">
    </div>`;
  };

  /* ── A closed set that takes more than one answer ──

     Groups and Audience are the two fields here a document can hold several of.
     They were four and three checkboxes standing open in the rail, which was
     honest about being multi-select and wrong about everything else: seven
     always-visible rows in a column of nine facts, so two fields took a third
     of the panel, and neither read like the seven fields above it. A rail of
     rows should be a rail of rows.

     So: the same trigger, the same panel position, the same lead-and-value
     shape as every dropdown on this panel — with checkboxes inside instead of
     options, because the answer is a set.

     It cannot BE a `.v2-dropdown`. That class is behaviour, not looks:
     aimy-ds.js binds every `.v2-dropdown-btn` and every `.v2-dropdown-option`
     on the page, and `choose()` is strictly single-select — it clears every
     other selection, writes one label and closes the panel. A second tick
     would undo the first. `.k-date` reached the same conclusion for the
     calendar and is the precedent this follows: own classes, own open state,
     visual rule mirrored from the same tokens, recorded in GAPS.md.

     What that buys, besides not fighting the library: the rows are real
     `<input type="checkbox">` in real `<label>`s, so Tab walks them and Space
     ticks them without a keyboard model of our own.

     The trigger NAMES rather than counts. "2 selected" is a control describing
     itself; "QA Reviewers +1" says one true thing and how much more there is.
     Empty is *None* — the same word the dropdowns use, because a field with
     nothing in it is a fact and a dash is a shrug. */
  function multiField(o, key, label, vocab) {
    const on = o[key] || [];
    const keys = Object.keys(vocab);
    const open = openMulti === key;
    const first = keys.find((k) => on.indexOf(k) > -1);
    const text = !on.length ? 'None'
      : on.length === 1 ? vocab[first]
      : vocab[first] + ' +' + (on.length - 1);
    return `<div class="k-multi k-row${open ? ' is-open' : ''}" data-multi-key="${esc(key)}">
      <button class="k-multi-btn" type="button" aria-haspopup="true" aria-expanded="${open}"
              aria-label="${esc(label)}">
        <span class="prop-lead">${esc(label)}</span>
        <span class="dd-label-text">${esc(text)}</span>
        ${ICO.chevron}
      </button>
      ${open ? `<div class="k-multi-panel" role="group" aria-label="${esc(label)}">
        ${keys.map((k) => `<label class="ds-choice k-multi-opt">
          <input type="checkbox" data-multi-opt="${esc(k)}"${on.indexOf(k) > -1 ? ' checked' : ''}>
          <span></span><span class="k-multi-text">${esc(vocab[k])}</span></label>`).join('')}
      </div>` : ''}
    </div>`;
  }

  /* ── The details are rows ──

     Three shapes have now been tried on this panel. A LABEL column was two
     things to read where one would do. A flowing SENTENCE with the controls
     inside it fixed that and broke something else: prose wrapped around six
     inline controls cannot avoid orphaning its own punctuation — measured at
     three lines with a comma stranded at x=296 of 320 and a full stop starting
     the last line — and an open panel landed on the words after it.

     So: one fact per row, the phrase and its value together, and the whole row
     is the control. The lead sits inside the trigger, which means one hit
     target per fact, a scannable left edge, no flow, no punctuation to orphan,
     and a panel that opens under its own row instead of over the next fact. */
  const propRow = (lead, body) => `<div class="prop-row">
    <span class="prop-lead">${esc(lead)}</span>${body}</div>`;

  /* ── Changing the type swaps the record; it does not accumulate two ──

     The old line was `o.x = Object.assign({}, BLANK_X[o.t] || {}, o.x)`, which
     merges the new type's blank UNDERNEATH everything the document has ever
     held. An object that has been an Article, a Ticket and an ICP therefore
     carries `applies`, `requester`, `assignee`, `status`, `resolution`,
     `segment`, `score`, `fit` and `dis` for the rest of its life. Nothing on
     screen showed it, because each TYPE_VIEW reads only its own keys — and
     that is what made it worth fixing rather than tolerating: `responsible()`
     reads `x.assignee`, so a ticket key nobody could see went on deciding who
     owned an article, which decides its status, which decides its badge.

     Swap, stash, and state it. The outgoing record is kept whole under its own
     slug, so switching back restores what you typed rather than a blank. The
     incoming one is the new type's blank, filled from its own stash if it has
     one. Nothing is silently destroyed and nothing invisible is carried. */
  let switchNoted = null;

  function switchType(o, was) {
    o.xStash = o.xStash || {};
    const out = o.x || {};
    const back = o.xStash[o.t];
    const whoWas = responsible(o);
    /* The PHRASE, not the name. "Owned by Unassigned" is not a sentence
       anybody wrote — ownerPhrase already knows that an unassigned document
       reads "Nobody owns it" and an ingestion marker reads "No owner — it
       arrived from Freshdesk", and the note has no business inventing a second
       way to say either. Captured before the swap, because after it the
       function would describe the state it is trying to contrast with. */
    const ownedWas = ownerPhrase(o);
    /* Ownership is a fact about the document, not a field of the ticket it
       used to be. Dropping `x.assignee` with the rest of the bag would move
       responsible() silently, which is the defect this function exists to
       fix — so the fact is promoted on the way out rather than stashed. */
    if (was === 'ticket' && out.assignee && out.assignee !== 'Unassigned') o.owner = out.assignee;
    o.xStash[was] = out;
    o.x = Object.assign({}, BLANK_X[o.t] || {}, back || {});
    delete o.xStash[o.t];
    switchNoted = { doc: o.id, was: was, now: o.t, restored: !!back,
                    kept: Object.keys(out).length,
                    ownedWas: responsible(o) !== whoWas ? ownedWas : '' };
    /* Before the undo closure is built: statusOf reads responsible(). */
    recompute();
    undoStack = () => {
      o.t = was; o.x = out; delete o.xStash[was];
      if (back) o.xStash[o.t] = back;
      if (was === 'ticket') o.owner = whoWas;
      switchNoted = null; recompute(); render();
    };
    repaintEditor();
    /* Three surfaces, each doing its own job (:4436 — an action has to be
       visible where you are looking). The record flashes because the record is
       what moved; the toast is the receipt and the way back; the line inside
       the record is the part that outlives both, because a toast is gone in
       four seconds and an ownership change is not. */
    markAfter('.dv-record', $('#docCanvas'));
    /* Labels keep their own case. `.toLowerCase()` reads fine on Article and
       Ticket and turns ICP into "icp", which is the acronym announcing that a
       string got a transformation nobody checked against the whole table. */
    toast('Now ' + artic(TYPES[o.t].label), 'Undo',
      (back ? 'Its ' + TYPES[o.t].label + ' record came back'
            : 'A blank ' + TYPES[o.t].label + ' record') +
      ' — the ' + TYPES[was].label + "'s is kept");
  }

  /* The switch, stated where it happened, until you have read it. `.prop-why`
     is already exactly this shape — a value and the reason behind it — so this
     borrows the pattern rather than inventing a fourth kind of notice.

     Deliberately NOT `.dv-notice`: that primitive means "trust state excludes
     this document from retrieval", direction §6.4 requires it whenever trust
     holds an excluded value, and it ships into other agents' surfaces. A third
     tone on it for a reversible edit you just made would dilute the one badge
     that means AiMY may not answer from this. */
  function switchNote(o) {
    const n = switchNoted;
    if (!n || n.doc !== o.id) return '';
    return `<p class="prop-why">Was ${artic(TYPES[n.was].label)}.
      ${n.restored ? 'Its ' + TYPES[n.now].label + ' record came back.'
                   : 'This record starts blank.'}
      The ${TYPES[n.was].label}'s ${n.kept} field${n.kept === 1 ? '' : 's'}
      ${n.kept === 1 ? 'is' : 'are'} kept — switch back and ${n.kept === 1 ? 'it returns' : 'they return'}.
      ${n.ownedWas ? `Who owns it moved with the record. As ${artic(TYPES[n.was].label)}:
        ${n.ownedWas}. Now: ${ownerPhrase(o)}.` : ''}
      <button class="prop-add" data-note-clear>Got it</button></p>`;
  }

  function propsPanel(o) {
    const custom = Object.keys(o.props);
    return `<div class="props">

      <!-- ── Status first ──

           It kept its own block BELOW the rows on the argument that it carries
           a reason as well as a value. The block is right; the position was
           not. Status is the only field here that decides whether AiMY may use
           the document at all, and it was the last thing in the panel — nine
           rows and a tag field down, past the fold on a 320px rail, inside a
           details element that was itself closed. The one control anybody
           opens this panel to reach was the hardest thing in it to reach.

           The reason still travels with it. That is why it is a block and not
           another row. -->
      <div class="prop-status">
        ${propDropdown({ key: 'statusSet', label: 'Status', blank: 'Automatic',
          map: () => Object.keys(STATUS).map((k) => [k, STATUS[k].label]) }, o, true)}
        <span class="prop-why">${o.statusSet
          ? 'Set by ' + esc(o.statusBy || USER.owner) + '. Choose Automatic to compute it again.'
          : esc(STATUS[o.status].why)}</span>
      </div>

      <!-- What this KIND of thing says about itself has LEFT this panel. A
           ticket's resolution is the reason you opened the ticket, and it was
           in a 320px column behind a <details>, described in the head by a
           read-only sentence you could not act on. It is the record on the
           document now — same rows, same commit path, moved rather than
           copied, because openXField resolves by global selector and two
           copies of one key would unfold both and focus the wrong input.

           What stays is the taxonomy every kind shares, which is the split
           §6.4 draws: constant governance chrome in the rail, type-appropriate
           rendering on the document. -->
      <div class="prop-rows">
        ${PROP_FIELDS.map((f) => propDropdown(f, o, true)).join('')}
        <!-- ── The closed sets sit with the closed choices ──

             Groups and Audience are the same KIND of fact as the seven rows
             above them — a value out of a vocabulary the product owns — and
             differ only in taking more than one. Tags and Services are the
             other kind: open vocabularies you type into. Splitting the panel
             on that line puts every control that opens a panel together and
             every control that takes a caret together, which is one boundary
             instead of two interleaved ones. -->
        ${multiField(o, 'groups', 'Groups', GROUPS)}
        ${multiField(o, 'aud', 'Audience', AUDIENCE)}
        ${propRow('Tags', tagField(o, 'tags', 'Tags'))}
        <!-- "Touches" said nothing and "Part of" said it as grammar. The field
             holds which of our service lines the document belongs to — Support
             delivery, Voice operations — so the row is called Services. -->
        ${propRow('Services', tagField(o, 'services', 'Services', SERVICES))}
      </div>

      <!-- ── Anything the fixed fields cannot hold ──

           This was the one block that never got the phrase treatment: the words
           "It also says:" over two bare text boxes, whose only names were
           aria-label attributes a sighted reader never sees. Two unlabelled
           inputs and a sentence fragment, which is exactly as much as it
           explained.

           It reads as a fact now — "tier: enterprise" — and becomes the two
           inputs when you click it, which is the same rule as the title, the
           body and every other row on this page. A new one arrives already
           open, with the placeholders doing the naming the labels used to fail
           to do. -->
      ${/* No "+ Add a fact". A document's facts come from the source it was
            synced from, and a box for typing your own invited a second,
            hand-maintained vocabulary alongside the mapped one — two answers
            to "what is this document's tier", disagreeing, with nothing
            saying which the product reads.

            Facts already on a record still READ and still EDIT here. What
            went is the invitation to invent one. */ ''}
      ${custom.length ? `<div class="prop-custom">
        <p class="prop-also">Other facts about it</p>
        ${custom.map((k) => `<div class="prop-kv${k === openProp ? ' is-open' : ''}" data-prop-pair="${esc(k)}">
          <button class="prop-kv-read" data-prop-open="${esc(k)}">
            <span class="prop-lead">${esc(k)}</span>
            <span class="prop-kv-val">${esc(o.props[k]) || '—'}</span>
          </button>
          <input class="field-input" value="${esc(k)}" data-prop-k="${esc(k)}"
                 placeholder="Name" aria-label="Property name">
          <input class="field-input" value="${esc(o.props[k])}" data-prop-v="${esc(k)}"
                 placeholder="Value" aria-label="Value of ${esc(k)}">
          <button class="prop-kv-x" data-prop-del="${esc(k)}" aria-label="Remove ${esc(k)}">${ICO.x.replace('<svg', '<svg width="12" height="12"')}</button>
        </div>`).join('')}
      </div>` : ''}
    </div>`;
  }


  /* ═══════════════════════════════════════════════
     THE DOCUMENT

     One surface. There is no view mode and no edit mode, because a person
     reading a document and a person fixing a sentence in it are the same
     person half a second apart, and making them press a button in between was
     the product asking them to declare an intention they had not formed yet.

     Click the title, you are editing the title. Click the body, you are in the
     body. Nothing is disabled and nothing is armed; the affordance appears
     under the pointer and is otherwise absent, so the thing reads as a document
     rather than as a form with a document in it.

     It is also a page now, not a modal. A modal has no room for a rail, and a
     document with eleven facts, its connections, its history and its comments
     needs one. The URL is unchanged — `?doc=` — so every link still resolves
     and Back still returns to the surface you filtered.
  ═══════════════════════════════════════════════ */
  let railOpen = true;

  /* ── Which rail blocks you shut ──

     All three open on arrival. The `<details>` themselves cannot remember what
     you did with them, because renderDoc rewrites the rail's markup on every
     repaint and the browser has nothing to restore across a fresh element —
     which the old comment on `railBlock` claimed the opposite of, for as long
     as the rail has existed. Closing one held until the next keystroke
     committed a field, and then it opened again by itself.

     So the exception is ours, and it is stored as the exception: shut blocks
     only, by name, module-level beside railOpen for the same reason — it is a
     preference about the chrome, not a fact about a document, and it should
     not reset because you opened a different one. */
  const railShut = {};

  /* Some documents carry an ingestion marker in the owner field rather than a
     person. As a label over a value that read as odd data; as a sentence,
     "Owned by Ingested · Freshdesk" reads as nonsense. The phrase treatment makes
     the defect visible, which is the argument for the phrase treatment. */
  const hasOwner = (o) => OWNERS.indexOf(responsible(o)) > -1 && responsible(o) !== 'Unassigned';
  const ownerPhrase = (o) => hasOwner(o) ? 'Owned by ' + esc(responsible(o))
    : responsible(o) === 'Unassigned' ? 'Nobody owns it'
    : 'No owner — it arrived from ' + esc(SRC[o.src].label);

  /* The byline. Everything a masthead would say, as one line of phrases, each
     entity in it openable. */
  /* `hushStatus` is set by renderDoc when the notice above this line already
     names the status. The note where it is computed says which states those
     are, and which two deliberately are not. */
  function docByline(o, hushStatus) {
    const src = SRC[o.src];
    return `<div class="doc-byline">
      ${hushStatus ? '' : statusBadge(o.status, o.statusSet ? 'Set by ' + esc(o.statusBy || USER.owner) : '')}
      <!-- What kind of thing it is, first. The byline said status, owner, date,
           source and collection and never once said whether you were looking at
           a ticket or a policy — the most basic fact about an object, and the
           only masthead in the product that left it out. Icon AND label, never
           colour, which is the library's rule for type everywhere. -->
      <span class="doc-by-kind">${TYPES[o.t].ico}${esc(TYPES[o.t].label)}</span>
      <button class="doc-by-ent" data-peek="owner:${esc(responsible(o))}">${ownerPhrase(o)}</button>
      <!-- ── When it changed, and every time it changed ──

           This lived in the topbar behind the word "3 versions", beside the
           save indicator, at the far end of a row you read past on your way to
           the document. But the question a version answers is the one the
           byline already raises: how current is this? So the date and its
           history are one control, in the line that states the date. -->
      ${VERSIONS(o).length ? `<details class="doc-versions doc-by-ver" id="docVersions"${previewVer !== null ? ' open' : ''}>
        <summary><span class="doc-by-vd">Updated ${esc(fmtDate(o.upd))}</span>
          <span class="doc-by-vn">${VERSIONS(o).length} version${VERSIONS(o).length === 1 ? '' : 's'}</span></summary>
        <div class="doc-versions-panel">
          ${versionList(o, true)}
          <p class="ver-hint">Open a version to read it. Only the current one can be edited.</p>
        </div>
      </details>`
      /* A document written a minute ago has no history, and "0 versions" over
         an empty panel is a control that opens onto nothing. */
      : `<span>Updated ${esc(fmtDate(o.upd))}</span>`}
      <!-- "Came from Manual upload" is not where a document you typed came
           from. It came from you, here. -->
      <!-- ── The one run on this line that names a place you can go ──

           Owner, collection and source all opened the same kind of peek, so
           "Came from Confluence" read as a filter — three documents, a sync
           cadence, a health note — when what it plainly says is that the
           original is in Confluence. It is that link now: same words, an
           address behind them, and the arrow that says you are leaving. The
           source's own record is still one click away on every card in the
           grid, which is where a reader goes to ask about the CONNECTOR rather
           than about this document. An upload has no upstream and stays a
           peek, because there is nowhere to send anybody. -->
      <!-- ── A CAMPAIGN'S UPSTREAM IS AiMY SALES ──

           This slot names the one place you can GO from the byline, and for
           nine types that is the source the copy was pulled from. A campaign
           brief is the exception: the connector it happens to have been synced
           through is a fact about plumbing, and the thing a reader actually
           wants from this line is the campaign being run. So Sales takes the
           slot when there is a campaign to take it to.

           Nothing is lost. The source, its health and its cadence are still in
           the rail's "Where it came from", which is the block that exists to
           answer questions about the connector; this line only ever held the
           shortcut. -->
      ${salesHref(o)
        ? `<a class="doc-by-ent doc-by-out" href="${esc(salesHref(o))}" target="_blank"
             rel="noopener noreferrer" title="Opens the live campaign in AiMY Sales"
             >Open in AiMY Sales${ICO.external.replace('<svg', '<svg class="doc-by-out-ico"')}</a>`
        : bornHere(o)
        ? '<span>Written here</span>'
        : originHref(o)
        ? `<a class="doc-by-ent doc-by-out" href="${esc(originHref(o))}" target="_blank"
             rel="noopener noreferrer" title="Opens ${esc(src.label)} in a new tab"
             >Came from ${esc(src.label)}${ICO.external.replace('<svg', '<svg class="doc-by-out-ico"')}</a>`
        : `<button class="doc-by-ent" data-peek="source:${o.src}">Came from ${esc(src.label)}</button>`}
      <button class="doc-by-ent" data-peek="collection:${o.col}">Filed in ${esc(COLLECTIONS[o.col])}</button>
    </div>`;
  }

  /* The rail. Four blocks, each a native `<details>`, open unless you shut
     this one — see railShut, which is the only reason the key is passed. */
  const railBlock = (key, title, body, n) => `
    <details class="rail-block" data-rail-block="${key}"${railShut[key] ? '' : ' open'}>
      <summary>
        <svg class="tree-chev" width="11" height="11" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        <span class="rail-block-title">${esc(title)}</span>
        ${n ? `<span class="rail-block-n">${n}</span>` : ''}
      </summary>
      <div class="rail-block-body">${body}</div>
    </details>`;

  /* Connections, as sentences. Each row reads "Disagrees with Returns FAQ —
     AiMY, 18 Jul": the relationship, the thing, and who said so. An implicit
     edge has no author because nobody authored it. */
  /* Claims only. Measured: seven of the nine groups here — Owned by, Filed in,
     Came from, Answers for, Covers, Touches, Tagged — were the implicit edges,
     which are the document's own fields, which are editable rows six inches
     above in About it. 316px of the rail restating 316px of the rail. The
     implicit edges are real and the model still holds them; they are simply not
     news twice on one screen.

     What is left is what somebody claimed, which is the half a reader cannot
     work out for themselves. */
  const claimsOf = (o) => edgesOf('doc', o.id).filter((e) => ASSERTED_PHRASES.indexOf(e.phrase) > -1);

  /* ── ONE PLACE FOR WHAT A DOCUMENT IS CONNECTED TO ──

     This took a `skip` list. One phrase per type — a ticket's *Answered by*, a
     web page's *References* — was pulled OUT of here and rendered inside
     `.dv-record`, in the run of the type's editable rows, on the grounds that
     a resolution nobody can trace is evidence of one case only and the article
     answering it should not be three blocks away behind a closed <details>.

     THE <details> ARE NOT CLOSED ANY MORE. All three rail blocks open on
     arrival, so the premise that split rested on is gone — and what the split
     left behind is worse than the problem it solved: a read-only list of links
     standing in a column of editable property rows, in their exact clothes,
     with no control on it and nothing saying why. Everything around it could
     be typed into; it could not.

     So it comes back, and the spec that named a phrase now names the one to
     FEATURE rather than the one to remove. Featured means two things: it leads
     the block, and it renders even when it is empty — so a ticket with nothing
     answering it still says why that is worth knowing instead of falling
     silent about the one connection its type is defined by. */
  function connectionsBlock(o, feature) {
    const groups = {};
    claimsOf(o).forEach((e) => { (groups[e.phrase] = groups[e.phrase] || []).push(e); });
    const keys = Object.keys(groups);
    const lead = feature && feature.phrase;
    /* Featured but unfilled: the group is still drawn, carrying the type's own
       sentence about the absence. */
    if (lead && keys.indexOf(lead) < 0) keys.unshift(lead);
    else if (lead) keys.splice(keys.indexOf(lead), 1), keys.unshift(lead);

    const group = (phrase) => `<div class="rail-conn">
          <span class="rail-conn-phrase">${esc(phrase)}</span>
          ${(groups[phrase] || []).length
            ? groups[phrase].map((e) => `<div class="rail-conn-row">
                <button class="rail-conn-item"
                  ${e.kind === 'doc' ? `data-open-doc="${esc(e.id)}"` : `data-peek="${esc(e.kind)}:${esc(e.id)}"`}>
                  <span class="rail-conn-label">${esc(e.label)}</span>
                  ${e.by ? `<span class="rail-conn-by">${esc(e.by)}, ${esc(fmtShort(e.at))}</span>` : ''}
                </button>
                <!-- Outside the row's button, not inside it: a button in a
                     button is not a thing, and the click that removes a claim
                     must not be one pixel's difference from the click that
                     navigates to it. -->
                <button class="rail-conn-drop" data-act="disconnect"
                  data-obj="${esc(o.id)}" data-arg="${esc(e.id)}"
                  aria-label="Remove ${esc(phrase.toLowerCase())} ${esc(e.label)}"
                  title="Remove this connection">${ICO.unlink.replace('<svg', '<svg width="14" height="14"')}</button>
              </div>`).join('')
            : `<p class="rail-empty">${esc((feature && feature.empty) || 'Nothing yet.')}</p>`}
        </div>`;

    return (keys.length
      ? keys.map(group).join('')
      : '<p class="rail-empty">Nobody has connected this to anything yet.</p>')
      /* Finding a connection is a search over forty-two documents. It was in
         here — a neighbour list plus a picker holding thirty-four hidden rows
         — inside a 320px column, and it was most of why the rail ran to twice
         the window. The rail describes; the canvas searches. */
      /* Named the same thing as the starter row that opens the same surface.
         "Find connections" described what this used to be — a discovery answer
         in the canvas — and kept the name after it became a picker you connect
         from, so one action had two names and neither matched its heading. */
      + `<div class="rail-act">${entryAction('investigate', 'Connect it to documents',
           `data-act="connect" data-obj="${o.id}"`, AIMY_MARK(12, 14))}</div>`;
  }

  /* ── What nobody claimed ──

     The rest of the graph is real, it is just implicit: two documents about the
     same client, answering for the same product, carrying the same tags. Walking
     the edges a document already has finds its neighbours without anyone having
     to assert anything.

     They are kept apart from the claims and labelled as computed, for exactly
     the reason a hand-set status carries a marker — a thing the system noticed
     and a thing a person claimed must never render identically. Narrowest axis
     first, because "also about Nordwind" is worth something and "also came from
     Confluence" is worth almost nothing. */
  const NEIGHBOUR = [
    { has: (o) => !!o.client, phrase: (o) => 'Also about ' + CLIENTS[o.client],
      match: (a, b) => b.client === a.client },
    { has: (o) => !!o.prod,   phrase: (o) => 'Also answers for ' + PRODUCTS[o.prod],
      match: (a, b) => b.prod === a.prod },
    { has: (o) => o.tags.length > 1, phrase: (o) => 'Also tagged ' + o.tags.slice(0, 2).join(' and '),
      match: (a, b) => b.tags.filter((t) => a.tags.indexOf(t) > -1).length > 1 },
    { has: () => true,        phrase: (o) => 'Also filed in ' + COLLECTIONS[o.col],
      match: (a, b) => b.col === a.col },
    { has: (o) => hasOwner(o), phrase: (o) => 'Also owned by ' + responsible(o),
      match: (a, b) => responsible(b) === responsible(a) },
    { has: () => true,        phrase: (o) => 'Also came from ' + SRC[o.src].label,
      match: (a, b) => b.src === a.src }
  ];

  function neighbours(o, max) {
    /* Anything already claimed is a connection, not a suggestion, and it is in
       the block above. Suggesting it again would make asserting it look like a
       no-op. */
    const claimed = {};
    EDGES.forEach((e) => {
      if (e.from === o.id) claimed[e.to] = 1;
      if (e.to === o.id) claimed[e.from] = 1;
    });
    const out = [];
    NEIGHBOUR.forEach((n) => {
      if (out.length >= (max || 3) || !n.has(o)) return;
      const docs = LIVE.filter((x) => x.id !== o.id && !claimed[x.id] && n.match(o, x));
      if (docs.length) out.push({ phrase: n.phrase(o), docs: docs });
    });
    return out;
  }

  /* ── Connecting is picking several things at once ──

     It used to be a canvas answer: a list of neighbour groups over a search,
     with a `+` per row that opened its own confirmation. Three problems. On a
     document created a minute ago the suggestions are noise — a new document
     shares its collection and owner with almost everything. The rows were
     `data-open-doc`, so clicking one NAVIGATED AWAY from the document you were
     connecting. And one commit per connection is the wrong unit: what you want
     at creation is to pick the three things this relates to and be done.

     One list, then. Search over all of it, checkboxes rather than links, the
     relationship chosen once for the batch, and one confirmation. The
     suggestions survive as a REASON on a row rather than as a section, which
     keeps the noticed-versus-claimed distinction without giving guesses their
     own real estate. */
  const CONNECT_AS = [
    ['related', 'Related to'], ['references', 'References'],
    ['supersedes', 'Replaces'], ['answers', 'Answers']
  ];

  function connectCandidates(o) {
    const claimed = {};
    EDGES.forEach((e) => {
      if (e.from === o.id) claimed[e.to] = 1;
      if (e.to === o.id) claimed[e.from] = 1;
    });
    /* Why AiMY would have suggested it, as a caption — narrowest axis wins, so
       a shared client beats a shared source. */
    const why = {};
    neighbours(o, 6).forEach((g) => g.docs.forEach((d) => {
      if (!why[d.id]) why[d.id] = g.phrase;
    }));
    return LIVE.filter((x) => x.id !== o.id && !claimed[x.id])
      .sort((a, b) => (why[b.id] ? 1 : 0) - (why[a.id] ? 1 : 0) || a.title.localeCompare(b.title))
      .map((d) => ({ d: d, why: why[d.id] || '' }));
  }

  function connectPicker(o) {
    const rows = connectCandidates(o);
    if (!rows.length) { toast('Nothing left to connect', null, 'It is already connected to everything else'); return; }
    commit({
      title: 'Connect this to other documents',
      sheet: true, width: 420,
      rationale: `Whatever you pick becomes <strong>your</strong> claim about
        <strong>${esc(o.title)}</strong>, and carries your name and today's date wherever it is read.`,
      extra: '',
      /* The foot counts what you have ticked, so the button is the answer to
         "how many did I pick?" — the one question a long list keeps raising. */
      confirm: 'Pick some documents', done: 'Connected',
      effects: [['ok', 'Both documents show the connection, from either end'],
                ['ok', 'Recorded as asserted by ' + esc(USER.owner)]],
      body: `<div class="cx-pick">
        <div class="cx-as">
          <span class="cx-as-lead">Connect them as</span>
          <div class="seg cx-seg" role="group" aria-label="What kind of connection">
            ${CONNECT_AS.map(([v, label], i) => `<button class="seg-btn${i === 0 ? ' active' : ''}"
              type="button" data-cx-as="${v}" aria-pressed="${i === 0}">${esc(label)}</button>`).join('')}
          </div>
        </div>
        <input class="field-input cx-q" type="search" placeholder="Find a document"
               aria-label="Find a document to connect" data-pick-q autocomplete="off">
        <div class="cx-list">
          ${rows.map(({ d, why }) => `<label class="cx-row ds-choice" data-pick-row="${esc(d.title.toLowerCase())}">
            <input type="checkbox" data-cx-pick="${d.id}"><span></span>
            <span class="cx-row-text">
              <span class="cx-row-title">${esc(d.title)}</span>
              ${why ? `<span class="cx-row-why">${esc(why)}</span>` : ''}
            </span>
          </label>`).join('')}
          <p class="cx-none" hidden>Nothing here matches that.</p>
        </div>
      </div>`,
      onRun: () => {
        const type = ($('.cx-seg .seg-btn.active') || {}).getAttribute
          ? $('.cx-seg .seg-btn.active').getAttribute('data-cx-as') : 'related';
        const picked = $$('[data-cx-pick]').filter((c) => c.checked).map((c) => c.getAttribute('data-cx-pick'));
        if (!picked.length) { toast('Nothing was selected', null, 'Nothing changed'); return true; }
        picked.forEach((id) => assertEdge(o.id, id, type));
        recompute(); render(); markCard(o.id); picked.forEach(markCard);
        const label = (CONNECT_AS.filter((c) => c[0] === type)[0] || CONNECT_AS[0])[1].toLowerCase();
        toast('Connected to ' + picked.length + ' document' + (picked.length === 1 ? '' : 's'),
          'Undo', esc(o.title) + ' — ' + label);
        /* One undo for the batch. Dropping them one at a time would leave a
           half-made claim if you stopped halfway. */
        undoStack = () => { picked.forEach((id) => dropEdge(o.id, id)); recompute(); render(); };
        return true;
      }
    });
    syncPickCount();
  }

  /* ── Removing one is not the inverse of adding several ──

     Connecting is a batch: you arrive with three documents in mind, tick them
     in one list and commit once. Removing is never a batch — you are looking
     at ONE sentence in the rail that is wrong. So the control lives on the row
     rather than back inside the picker, and it takes what the row already
     shows instead of making you find the same document again among forty-one
     others.

     It goes through `commit` for the reason `resolve` does, and it is not
     ceremony: two of the asserted phrases are what `statusOf` computes a badge
     from, so dropping one can move a document from Conflicting to No issues
     without anybody having touched a word of either document. The dialog says
     so by MEASURING it — drop the edge, read both badges, put it back — rather
     than by guessing from the phrase, because `statusSet` and supersession
     both outrank a contradiction and a guess would be wrong on exactly the
     documents where it matters. */
  function disconnectClaim(o, otherId) {
    const other = byId(otherId);
    if (!other) return;
    /* The raw records, not just the pair of ids. `dropEdge` takes the id pair
       and `assertEdge` would put the edge back under YOUR name and today's
       date — so an undo would quietly reassign somebody else's claim to you.
       Keeping the records means undo restores the author and the date too. */
    const saved = EDGES.filter((e) =>
      (e.from === o.id && e.to === otherId) || (e.from === otherId && e.to === o.id));
    if (!saved.length) return;

    /* The phrase as the rail says it, which is the direction it was claimed
       in — `Replaces` from this end and `Replaced by` from the other. */
    const link = edgesOf('doc', o.id).filter((e) => e.kind === 'doc' && e.id === otherId)[0];
    const phrase = (link && link.phrase) || 'Related to';

    /* Dropped and restored inside one synchronous pass, so nothing renders in
       between and nothing outside this function can observe the gap. */
    const was = [statusOf(o), statusOf(other)];
    dropEdge(o.id, otherId);
    const then = [statusOf(o), statusOf(other)];
    saved.forEach((e) => EDGES.push(e));
    rebuildRelated();

    const moved = [[o, was[0], then[0]], [other, was[1], then[1]]]
      .filter((r) => r[1] !== r[2])
      .map((r) => ['warn', `<strong>${esc(r[0].title)}</strong> goes from
        <strong>${esc(STATUS[r[1]].label)}</strong> to <strong>${esc(STATUS[r[2]].label)}</strong>.`]);

    const by = saved[0].by;
    const when = fmtShort(saved[0].at);

    commit({
      title: 'Remove a connection',
      current: phrase + ' ' + other.title,
      proposed: 'Not connected',
      /* Who said it, and when. An edge AiMY drew and an edge a colleague drew
         are the same row on screen and are not the same thing to remove: one
         is disagreeing with a detector, the other is overwriting a person. */
      rationale: by === 'AiMY'
        ? `AiMY claimed this on <strong>${esc(when)}</strong>. Removing it says the detection was
           wrong — nothing inside either document changes, only what is claimed between them.`
        : `<strong>${esc(by || 'Somebody')}</strong> claimed this on <strong>${esc(when)}</strong>.
           Removing it drops <em>their</em> claim, not yours. Nothing inside either document changes.`,
      confirm: 'Remove it', done: 'Removed', danger: true,
      effects: moved.concat([
        ['ok', 'Neither document shows it any more, from either end'],
        ['skip', 'Both documents stay exactly where they are — nothing is archived or deleted']
      ]),
      onRun: () => {
        dropEdge(o.id, otherId);
        recompute(); render(); markCard(o.id); markCard(otherId);
        toast('Connection removed', 'Undo',
          esc(o.title) + ' — no longer ' + esc(phrase.toLowerCase()) + ' ' + esc(other.title));
        undoStack = () => {
          saved.forEach((e) => EDGES.push(e));
          rebuildRelated(); recompute(); render();
        };
        return true;
      }
    });
  }

  function gateReport() {
    const btn = $('#commitRun'), box = $('[data-report-what]');
    if (!btn || !box) return;
    const on = !!box.value.trim();
    btn.disabled = !on;
    btn.style.opacity = on ? '' : '.45';
    btn.style.cursor = on ? '' : 'not-allowed';
  }

  /* Same gating the typed confirmation uses: the button says what it will do
     and cannot be pressed until that is something. */
  function syncPickCount() {
    const btn = $('#commitRun');
    if (!btn || !$('[data-cx-pick]')) return;
    const n = $$('[data-cx-pick]').filter((c) => c.checked).length;
    btn.textContent = n ? 'Connect ' + n + ' document' + (n === 1 ? '' : 's') : 'Pick some documents';
    btn.disabled = !n;
    btn.style.opacity = n ? '' : '.45';
    btn.style.cursor = n ? '' : 'not-allowed';
  }

  /* The source's own dates, as phrases rather than a four-cell grid of labels. */
  /* ── Some documents have no upstream at all ──

     `newDocument` files everything under the `upload` source with today's date
     in all four fields, and this block used to print them literally. A document
     you had just written said: *Ingested 30 Jul 2026 · Created in Manual upload
     30 Jul 2026 · Manual upload changed it 30 Jul 2026 · Cited 0 times — last
     today*, over a **Re-sync from Manual upload** button that would have
     replaced the body with nothing. Four false statements and a destructive
     dead end on every document the product invites you to make.

     A dropped file and a document typed here are both origins without an
     upstream — `dropFiles` marks the first with a `source-file` property — and
     neither of them syncs. Nothing to sync from, so no button offering to. */
  const bornHere = (o) => /^new-/.test(o.id) && !o.props['source-file'];
  const noUpstream = (o) => o.src === 'upload';

  /* `opt.skipSync` hands the whole upstream to the view, for the one type that
     states its address and its crawl freshness on the document itself. That
     type owns BOTH controls — the re-sync and the way out to the page — because
     the address it would send you to is printed one line above them. A webpage
     offered "Open the live page" in its subject and "Open in Website crawl"
     three blocks below, which is one link, twice, under two names. Everything
     else about the block is unchanged. */
  function provenanceBlock(o, opt) {
    const cfg = opt || {};
    const s = SRC[o.src];
    const behind = o.xu < o.upd;
    if (noUpstream(o)) {
      const file = o.props['source-file'];
      return `<div class="rail-facts">
        <p class="rail-lead-fact">${bornHere(o) ? 'You wrote it here, ' + esc(fmtDate(o.ing))
                         : 'You uploaded ' + esc(file || 'it') + ', ' + esc(fmtDate(o.ing))}
          <span class="rail-lead-age">${esc(ageLabel(o.ing))}</span></p>
        <p>Nothing syncs into it — ${bornHere(o) ? 'it has no source'
                                                 : 'a dropped file is not a live source'}</p>
        <p>${esc(citedPhrase(o))}</p>
        <!-- The line above states an absence; this is the one thing you can do
             about it, so it sits directly under it. -->
        <div class="rail-act">
          ${entryAction('investigate', 'Find a source for it', `data-act="ground" data-obj="${o.id}"`, AIMY_MARK(12, 14))}
        </div>
      </div>`;
    }
    const href = originHref(o);
    return `<div class="rail-facts">
      <!-- ── The date this block exists to state ──

           Four lines in one grey at one size, and the one fact a reader opens
           the block FOR — how old the copy in front of them is — had to be
           found by reading all four. It leads now, and it carries the duration
           beside the date, because "17 Jun 2026" makes you do the arithmetic
           and the arithmetic is the answer. -->
      <p class="rail-lead-fact">Ingested ${esc(fmtDate(o.ing))}
        <span class="rail-lead-age">${esc(ageLabel(o.ing))}</span></p>
      <p>Created in ${esc(s.label)} ${esc(fmtDate(o.xc))}</p>
      <p${behind ? ' class="is-overdue"' : ''}>${esc(s.label)} changed it ${esc(fmtDate(o.xu))}</p>
      <p>${esc(citedPhrase(o))}</p>
      <div class="rail-act">
        <!-- The original leads. Every other action here is about our copy of
             the document — pull it again, repair the connector, replace the
             upstream — and this is the only one that reaches the thing all
             three of them are talking about. -->
        ${href && !cfg.skipSync
          ? entryLink(href, originLabel(o), 'Opens in a new tab') : ''}
        <!-- Pulling a source is not a thing you look at, so it stops carrying
             the direct mode's eye. And finding one is AiMY's job, so it
             carries AiMY's mark. -->
        ${cfg.skipSync ? ''
          : s.health === 'ok'
          ? entryAction('direct', 'Re-sync from ' + s.label, `data-act="resync" data-obj="${o.id}"`, ICO.refresh)
          : entryAction('review', 'Reconnect ' + s.label, `data-act="reconnect" data-obj="${o.id}"`)}
        ${entryAction('investigate', 'Find another source', `data-act="ground" data-obj="${o.id}"`, AIMY_MARK(12, 14))}
      </div>
    </div>`;
  }

  /* ── One gate, two readers ──

     renderDoc draws the Publish button and writeBody re-labels it on every
     keystroke, and each held its own copy of the test. Two copies of a rule
     drift, and this one had already drifted into saying the wrong thing: the
     only reason either could give was "Add some content first", which is a
     true sentence about an article and a false one about an asset whose
     content is a file. The gate returns the REASON it is closed, so the
     button's label is the reason and there is one place to change it. */
  function publishGate(o) {
    return viewFor(o).ready(o);
  }

  /* The rail's three blocks, addressed by name so a view can order them.
     `railBlock` itself is untouched — still a native `<details>`, so what you
     closed survives every repaint with no state of ours. `view` is optional:
     without one every block behaves exactly as it did when the order was
     hard-coded. */
  /* The boilerplate second paragraph, suppressed for anything you made here —
     a document you just typed has no ingestion to describe. Lifted out of the
     body template unchanged. */
  const bodyBoilerplate = (o) => o.src === 'upload' && /^new-/.test(o.id)
    ? '' : `<p>${esc((BODY_COPY[o.t] || [''])[0])}</p>`;

  /* A blank document's starting moves, BELOW the empty body rather than above
     it — put between the title and the body they would break the same run of
     editable blocks the head exists to keep contiguous. A document with a body
     does not need them: the assistant is on the block, connecting is in the
     rail. Which moves are offered is the view's, because "start from a file"
     is the whole point on an asset and noise on a ticket. */
  function startMoves(o, view) {
    const want = (view && view.start) || ['ai', 'file', 'connect'];
    const btn = {
      ai: `<button class="doc-ai" data-ai-doc aria-haspopup="true" aria-expanded="false">
             ${AIMY_MARK(13, 15)}<span>Draft with AiMY</span></button>`,
      /* Starting from a file you already have is the third way in, and it was
         the only one with no control — a drag gesture and nothing else. */
      file: `<button class="doc-start-act" data-pick-files>
               ${ICO.upload ? ICO.upload.replace('<svg', '<svg width="13" height="13"') : ''}<span>Start from a file</span></button>`,
      connect: `<button class="doc-start-act" data-act="connect" data-obj="${o.id}">
                  ${AIMY_MARK(13, 15)}<span>Connect it to documents</span></button>`
    };
    return `<div class="doc-start">${want.map((k) => btn[k] || '').join('')}</div>
      <p class="doc-start-fine">${o.pendingText
        ? `<strong>${esc(o.pendingText)}</strong> is filed here — its text has not been
           pulled out yet, which needs the ingestion service. Draft from it, or write it here.`
        : `Or drop one on the page — ${esc(FILE_KINDS)}`}</p>`;
  }

  /* Reading history is reading one body, not eight templates: the version you
     opened is a string this object held on a date, and no record, subject or
     starting move belongs beside it. It short-circuits the whole region list. */
  const previewBody = (o) => `<div class="dv-body" spellcheck="false" id="editBody" data-drop-body
       data-placeholder="Write here, drop a file, or use Draft with AiMY above."
     ><p>${esc(VERSION_BODY(o, previewVer))}</p></div>`;

  /* ── What AiMY noticed, about ONE document ──

     needsYou() attaches the ids it is talking about to every finding, so asking
     "which of these is about THIS document" is a filter, not a second analysis —
     and the answer cannot drift from the band over the grid or the queue under
     the bell, because all three read one computation.

     The band upstairs counts: "3 documents disagree with each other". Beside a
     document a count is the wrong shape — you are looking at one of the three,
     and what you want is which other one and why. INSIGHT_MINE is that: one
     first-person sentence per finding, about this object. The card uses the
     same map, so the three surfaces say one thing in one voice.

     It sits ABOVE the three blocks and outside them, because it is the only
     thing in the column that is not a description of the document: it is what
     AiMY thinks about the description. The rail's rule is "describes, and only
     describes", and this keeps it — the row states a finding and its action
     leaves for the canvas or the set. Nothing is done in the rail.

     A document with nothing wrong with it renders nothing, which is the common
     case and should cost no height. */
  const INSIGHT_MINE = {
    conflicting: (o) => {
      const c = (RELATED[o.id] || {}).contradicts || [];
      const other = c.length ? byId(c[0]) : null;
      return other ? 'It disagrees with ' + other.title + ', and I am answering from both.'
                   : 'It disagrees with another document, and I am answering from both.';
    },
    outdated: (o) => SRC[o.src].label + ' changed it ' + Math.max(1, o.upd - o.xu) + ' days after our copy.',
    /* The meta line already says *no owner*. What it does not say is that I am
       answering out of it anyway, which is the reason this needs a person. */
    unowned:  (o) => o.uses ? 'I have answered from it ' + o.uses + ' times with nobody accountable.'
                            : 'Nobody answers for it, and nothing has cited it.',
    drafts:   () => 'I drafted it and nobody published it, so I cannot cite it.',
    /* And the meta line already says *used 4 months ago*. The peer number is
       the one that decides whether that is neglect or just a quiet corner. */
    unused:   (o) => { const peers = LIVE.filter((x) => x.col === o.col);
                       const avg = Math.round(peers.reduce((a, x) => a + x.uses, 0) / Math.max(1, peers.length));
                       return 'I cite it ' + o.uses + ' times against ' + avg + ' across ' + COLLECTIONS[o.col] + '.'; },
    reported: (o) => openProblems(o) + ' reported problem' + (openProblems(o) === 1 ? '' : 's') +
                     ' nobody has answered.',
    source:   (o) => SRC[o.src].label + ' has been down ' + SRC[o.src].last + ' days, so this copy is frozen.'
    /* `gap` is the absence of a document. It has no ids and cannot appear here. */
  };
  const insightMine = (t, o) => (INSIGHT_MINE[t.id] ? INSIGHT_MINE[t.id](o) : t.why);

  /* ── One corpus computation per paint ──

     needsYou() makes eight passes over LIVE. renderGrid maps typeCard over the
     list, so asking each card for its own finding is eight passes PER CARD —
     twelve cards on the landing set before a filter is touched. It is the same
     answer every time, because the corpus cannot move between two cards in one
     paint.

     Module-level and nulled, the way railOpen / openProp / previewVer /
     previewVer already are: view-derived state that must not outlive the paint it
     was computed for. Two invalidation points, and both are load-bearing —

       render()     every URL-driven paint, before anything reads it;
       recompute()  the only thing that moves o.status, which is what six of the
                    eight findings key on, and it runs on paths that end in
                    repaintEditor() rather than render().

     First writer wins, and that IS the severity rule: needsYou returns
     p1 → p2 → p3 by construction, so no sort is needed to give a card its
     worst finding. */
  function corpusFindings() { return insAll || (insAll = needsYou()); }

  function cardInsight(o) {
    if (!insBy) {
      insBy = {};
      corpusFindings().forEach((t) => {
        t.ids.forEach((id) => { if (!insBy[id]) insBy[id] = t; });
      });
    }
    const t = insBy[o.id];
    /* `gap` counts questions nobody could answer, so it has no ids and can
       never land here. Anything else without a phrase falls back to the
       finding's own reason rather than rendering an empty row. */
    return t ? { sev: t.sev, long: insightMine(t, o) } : null;
  }

  function docInsights(o) {
    const found = corpusFindings().filter((t) => t.ids.indexOf(o.id) > -1).slice(0, 2);
    if (!found.length) return '';
    /* The reply to a report. `reported` is the one finding whose subject is an
       ANSWER rather than a document — somebody read something AiMY said, and
       said it was wrong — and until now the only response was a state change
       on a card. The host is rendered here and filled after the paint; empty
       on every other document, and empty when the patterns are not loaded. */
    const repaired = openProblems(o)
      ? `<div class="agent-repair" id="agentRepair"></div>` : '';
    return `${repaired}<div class="ins-band">
      <p class="ins-rail-lead">${AIMY_MARK(12, 14)}<span>AiMY noticed</span></p>
      ${found.map((t) => `<div class="ins-row">
        <p class="ins-row-text">${esc(insightMine(t, o))}</p>
        <button class="ins-row-act" type="button" data-ins="${esc(t.id)}">${esc(t.cta)}</button>
      </div>`).join('')}
    </div>`;
  }


  /* ── All three open ──

     The order below is still the view's — a ticket leads with where it came
     from, because a ticket's identity IS its source record — but which one
     STARTS open is no longer a question a view gets asked. It answered "one
     of them", and the other two then read as three labels stacked at the
     bottom of the column: a document whose owner, collection, audience and
     sources are all one click from being visible at all.

     The `<details>` stay, so closing one still survives every repaint with no
     state of ours. They just do not start closed. */
  const RAIL_BLOCK = {
    what: (o) => railBlock('what', 'What it is', propsPanel(o)),
    connects: (o, view) => railBlock('connects', 'What it connects to',
      connectionsBlock(o, view && view.links), claimsOf(o).length),
    came: (o, view) => railBlock('came', 'Where it came from',
      provenanceBlock(o, view && view.ownsSync ? { skipSync: true } : null))
  };

  /* ── The regions a document is made of ──

     Addressed by string key so a view's content order is pure data: `regions:
     ['record', 'prose']` is a statement anybody can read, and a test can
     assert the eight orders without executing them.

     Every one of these is a SIBLING of `#editBody`, never a child. The body is
     contenteditable and `writeBody` writes its innerHTML back to `o.html` on
     the first edit, so anything rendered inside it becomes the document's own
     stored content the first time somebody types. */
  /* `recordLinks` was here: the featured connection phrase, rendered inside
     the record beside the editable rows. See connectionsBlock — it is one
     block in the rail again, and the reason it was ever two is gone. */

  /* ── The record: what this kind of thing is, editable where it leads ──

     Two strata and nothing between them. `facts` is DERIVED — a crawl date, a
     client name, the axes a profile is indexed by — and is also the texture
     channel, because type is carried by shape and never by colour. `fields` is
     EDITABLE, and it is `typeFieldRows` verbatim: the same rows the rail drew,
     moved rather than copied, because `openXField` resolves by global selector
     and two copies of one key would unfold both and focus the wrong input.

     One fact, one control. Nothing appears in both strata. */
  function docRecord(o, view) {
    const facts  = view.facts  ? view.facts(o)  : '';
    const fields = view.fields ? view.fields(o) : '';
    const note   = switchNote(o);
    /* A type with nothing to say renders no zone rather than an empty box
       still taking its padding — the rule typeBody already follows. */
    if (!facts && !fields && !note) return '';
    return `<section class="dv-record" data-type="${esc(o.t)}"
                     aria-label="${esc(TYPES[o.t].label)} record">
      ${note}
      ${facts ? `<div class="dv-typed">${facts}</div>` : ''}
      ${fields ? `<div class="prop-rows">${fields}</div>` : ''}
    </section>`;
  }

  /* ── The subject: the thing the document is ABOUT ──

     Two types are not documents so much as records of something else — a file,
     and a live page — and for those the subject leads and the prose is a note
     about it. Selected by o.t rather than by a class hole, so the audit still
     reads every class literally. */
  /* The file a subject-led type is about. `source-file` is what ingestion
     recorded; `pendingText` is what a drop recorded when there was no text to
     extract, which for a deck is always. One accessor, so the subject, the
     publish gate and the replace label cannot disagree about whether there is
     a file. */
  const subjectFile = (o) => o.props['source-file'] || o.pendingText || '';

  function docSubject(o) {
    if (o.t === 'webpage') {
      const url = xVal(o, 'url');
      /* Re-sync lives HERE and not in the rail for this type: the crawl state
         is stated on this line, and the one thing you can do about it belongs
         under the statement rather than three blocks away. provenanceBlock is
         told to leave it out, so it is offered once. */
      return `<section class="dv-subject" data-type="webpage" aria-label="The live page">
        ${xFaced(o, 'url', 'Source URL', url && url !== '—'
          ? `<span class="tc-mono">${esc(url)}</span>` : '—')}
        <p class="dv-subject-state">${crawlPhrase(o)} · ${changePhrase(o)}</p>
        <!-- This type owns the re-sync, so it owns the way out to the page
             too — the address is stated one line above, and offering to open
             it anywhere else would be offering it twice. -->
        <div class="rail-act">${originHref(o)
          ? entryLink(originHref(o), originLabel(o), 'Opens the page in a new tab') : ''}${
          SRC[o.src].health === 'ok'
          ? entryAction('direct', 'Re-sync from ' + SRC[o.src].label,
              `data-act="resync" data-obj="${o.id}"`, ICO.refresh)
          : entryAction('review', 'Reconnect ' + SRC[o.src].label,
              `data-act="reconnect" data-obj="${o.id}"`)}</div>
      </section>`;
    }
    const file = subjectFile(o);

    /* A deck is the one type whose content is a file nobody can read here and
       nobody should have to: you present it. So the subject is the deck, the
       upload is the primary action, and the two facts under it are how long it
       is and whether it may be shown — which is what somebody asks before
       reusing one on Thursday.

       The picker is narrowed to presentation formats. This control says "the
       deck"; a picker that would also accept a spreadsheet is offering to make
       something the sentence above it just said this was not. */
    if (o.t === 'pptx') {
      const n = +xVal(o, 'slides') || 0;
      const cleared = xVal(o, 'approval') === 'approved';
      return `<section class="dv-subject" data-type="pptx" aria-label="The deck">
        <p class="tc-mono">${esc(file || 'No deck uploaded')}</p>
        <p class="dv-subject-state">${file
          ? esc(n ? n + (n === 1 ? ' slide' : ' slides') : 'Slide count not recorded') + ' · ' +
            (cleared ? 'cleared to present' : 'not cleared to present')
          : 'Its content is the deck, and there is not one yet — so there is nothing here to present or cite.'}</p>
        <div class="rail-act">${entryAction('direct', file ? 'Replace the deck' : 'Upload the deck',
          `data-pick-files="${esc(DECK_ACCEPT)}"`, ICO.upload)}</div>
      </section>`;
    }

    /* An asset's content is the file. The document is the record ABOUT it, and
       the honest set of actions on a file this prototype does not store is:
       say what it is, and replace it. No Download control — a button that has
       to explain why it did nothing is a button admitting it should not have
       been offered. */
    return `<section class="dv-subject" data-type="asset" aria-label="The file">
      <p class="tc-mono">${esc(file || 'No file is attached')}</p>
      <p class="dv-subject-state">${file
        ? 'This is the record about the file. Its rights and approval are below.'
        : 'Its content is the file, and there is not one yet — so nothing here can be cited.'}</p>
      <div class="rail-act">${entryAction('direct', file ? 'Replace the file' : 'Attach a file',
        'data-pick-files', ICO.upload)}</div>
    </section>`;
  }

  const DOC_REGION = {
    record:  (o, view) => docRecord(o, view),
    subject: (o) => docSubject(o),
    prose: (o, view, blank) => {
      const cfg = (view && view.copy) || {};
      /* 'absent' means the type does not INVITE prose, not that prose is
         impossible. An asset ingested with a description still shows it; a
         blank one shows no empty page and no placeholder asking to be filled
         with the one thing that is not the point.

         The starting moves stay. Returning nothing here left a blank asset
         with no body to type into and no way to make one — "does not invite"
         had quietly become "cannot ever", which is a different decision and
         not one anybody took. */
      if (view && view.prose === 'absent' && blank) return startMoves(o, view);
      /* Prose that is not the point still has to say what it is for. Quieter
         than a heading inside the body, which is the document's own writing. */
      const label = view && view.prose === 'secondary' && cfg.prose
        ? `<h2 class="dv-run-label">${esc(cfg.prose)}</h2>` : '';
      return label + `<div class="dv-body${blank ? ' is-blank' : ''}"
             spellcheck="false" id="editBody" data-drop-body
             tabindex="0" aria-label="Document — press Enter to edit"
             data-placeholder="${esc(cfg.body || 'Write here, drop a file, or use Draft with AiMY above.')}">
          ${/* One empty paragraph, not nothing. An empty body has no block for
               the caret to be IN, so `caretBlock` returned null, so the toolbar
               never appeared and the + with it — on the one document where you
               have the most to add. Typing into a bare body also makes a naked
               text node the block model cannot see. */
            blank ? '<p><br></p>' : o.html || `<p>${esc(o.sum)}</p>${bodyBoilerplate(o)}`}
        </div>`
        + (blank ? startMoves(o, view) : '');
    }
  };

  /* ═══════════════════════════════════════════════
     THE EIGHT VIEWS — §6.3, wired

     The library's spec is eight templates over one fixed governance row, and
     for the life of this prototype the document honoured the second half only:
     ONE template, no type dispatch, and the type's own facts rendered as a
     read-only sentence in the head while the fields holding them sat in a
     320px rail behind a closed <details>. A Ticket without its resolution in
     front of you is useless; an ICP whose disqualifiers are three clicks away
     is misleading. So the record leads, per type, and it is editable where it
     leads.

     What is CONSTANT is §6.4's list and it deliberately does not appear here:
     the topbar, the notice, the byline (status · type · owner · updated ·
     source · collection), the title, the AiMY proposal, the comments and the
     rail's foot. Someone scanning mixed types must not have to relearn where
     trust lives. This table declares only what §6.4 calls variable.

     Two invariants, both checkable:

       · ONE FACT, ONE CONTROL. A TYPE_FIELDS key renders as its editable row
         in `fields` and nowhere else. `facts` carries only what is DERIVED,
         which is also the texture channel — a ruled quote does not read like a
         row of tags, which does not read like a monospace URL — because type
         is carried by shape and never by colour.

       · WHERE PROSE LEADS, NOTHING COMES BETWEEN THE TITLE AND THE BODY. The
         head exists because status used to interrupt the only two editable
         blocks on the page; a structured block dropped in there would be the
         same defect wearing a new name.
  ═══════════════════════════════════════════════ */
  const TYPE_VIEW = {

    /* An article IS its prose. Its one row qualifies what you just read rather
       than being the thing you came for, so it follows the body. */
    article: {
      regions: ['prose', 'record'],
      prose:   'primary',
      rail:    ['what', 'connects', 'came'],
      fields:  (o) => typeFieldRows(o),
      start:   ['ai', 'file', 'connect'],
      ai:      { blank:  ['Write a first draft', 'Outline it'],
                 filled: ['Rewrite for support agents', 'Shorten', 'Expand', 'Fill the gaps'] },
      ready:   (o) => String(o.sum || '').trim() ? '' : 'Add some content first',
      copy:    { body: 'Write here, drop a file, or use Draft with AiMY above.' }
    },

    /* A case record, in the order somebody reads one: the state the source has
       it in, who raised it, how it was closed, and what answered it. `x.status`
       is the SOURCE's word — "Awaiting legal" says something none of our seven
       statuses can — and is not o.status, which is ours and on the byline.

       The narrative from Freshdesk is evidence under the record, not the point
       of the page. And "Where it came from" opens, because a ticket's identity
       IS its source record and that is the second question after the fix. */
    ticket: {
      regions: ['record', 'prose'],
      prose:   'secondary',
      rail:    ['came', 'what', 'connects'],
      fields:  (o) => typeFieldRows(o),
      /* §6.3 names "linked articles" as a ticket's distinguishing CONTENT. The
         real edge is `answers`, so from this end it reads "Answered by". */
      /* Featured in the rail's connections block: it leads, and it renders
         even when empty, because a ticket with no traceable resolution is the
         one thing §6.3 says a ticket cannot be. */
      links:   { phrase: 'Answered by',
                 empty:  'Nothing answers it yet — a resolution nobody can trace is evidence of one case only.' },
      start:   ['ai', 'connect'],
      ai:      { blank:  ['Write a first draft'],
                 filled: ['Rewrite for support agents', 'Shorten', 'Fill the gaps'] },
      /* A ticket with no resolution is the one thing §6.3 says a ticket cannot
         be. "Add some content first" was the only reason the gate could give,
         and on a ticket it named the wrong absence. */
      ready:   (o) => !String(o.sum || '').trim() ? 'Add some content first'
                    : xVal(o, 'resolution') && xVal(o, 'resolution') !== '—' ? ''
                    : 'Say how it was closed first',
      copy:    { body: 'What the customer asked, and what was said back.',
                 prose: 'What the ticket says' }
    },

    /* Segment, fit, disqualifiers — the three things §6.3 names, as the
       document's primary content. BODY_COPY.icp has told every reader that fit
       is assessed "on the criteria above" for the life of this prototype,
       while the criteria sat in the fixture and on no screen worth the name.
       They render here now, and the copy finally points at something.

       The fit meter is the read AND the control: confBadge is the read face of
       the score field, so the number is not on screen twice. */
    icp: {
      regions: ['record', 'prose'],
      prose:   'secondary',
      rail:    ['what', 'connects', 'came'],
      /* Region and the service lines. Derived from o.region / o.services, not
         from o.x, so no field row restates them — and they are the two axes a
         seller filters a profile by. */
      facts:   (o) => axisTags(o),
      fields:  (o) => xFaced(o, 'score', 'Fit score',
                        confBadge(o.x.score, 'Fit') || '—', { num: true }) +
                      typeFieldRows(o, ['score']),
      start:   ['ai', 'connect'],
      ai:      { blank:  ['Write a first draft', 'Outline it'],
                 filled: ['Rewrite for sellers', 'Shorten', 'Fill the gaps'] },
      /* Both halves, because §6.3's argument is specifically that a profile
         without its disqualifiers is worse than no profile. */
      ready:   (o) => !(xVal(o, 'fit') || []).length ? 'Add a fit criterion first'
                    : !(xVal(o, 'dis') || []).length ? 'Add a disqualifier first' : '',
      copy:    { body: 'How to use the profile — and what it is not for.',
                 prose: 'How to use this profile' }
    },

    /* The brief, and the pieces it points at. The record answers what the
       campaign is FOR — goal, who it targets, the window — and the `references`
       edges are what it has to send: a brief whose material you cannot reach is
       a date range. What it has DONE is not here and is not meant to be; that
       lives in AiMY Sales, against the campaign itself. */
    campaign: {
      regions: ['record', 'prose'],
      prose:   'secondary',
      rail:    ['what', 'connects', 'came'],
      fields:  (o) => typeFieldRows(o),
      /* Featured in the rail's connections block. The wording used to make the
         asset LIST the authority on what may be sent; there is no asset list
         any more, so the links are that authority instead — which was always
         the more honest version, since a linked document can be opened and a
         line of text saying "6 assets" cannot. */
      links:   { phrase: 'References',
                 empty:  'Nothing is linked to it yet — what is linked here is what may be sent.' },
      start:   ['ai', 'connect'],
      ai:      { blank:  ['Write a first draft', 'Outline it'],
                 filled: ['Rewrite for marketing', 'Shorten', 'Fill the gaps'] },
      ready:   (o) => xVal(o, 'goal') && xVal(o, 'goal') !== '—' ? ''
                    : 'Say what it is for first',
      copy:    { body: 'How it ran, and what was learned.',
                 prose: 'Campaign notes' }
    },

    /* The one type whose content is not text. The file leads; the record is
       about the file; and the prose is absent rather than an empty page
       inviting the one thing that is not the point. */
    asset: {
      regions: ['subject', 'record', 'prose'],
      prose:   'absent',
      /* The document is a record ABOUT a file, so picking a file replaces the
         one it is about rather than making a second document beside it. */
      ownsFile: true,
      rail:    ['what', 'came', 'connects'],
      fields:  (o) => typeFieldRows(o),
      /* No 'file': the subject already carries Attach/Replace, and it is the
         one control on the page that is about the actual content. Two buttons
         opening the same picker on one screen is the same fact twice. */
      start:   ['ai', 'connect'],
      ai:      { blank:  ['Write a first draft'],
                 filled: ['Rewrite for marketing', 'Shorten'] },
      /* Not the body: an asset's content is the file, so the gate asks for the
         thing that makes the record usable instead. */
      ready:   (o) => xVal(o, 'format') && xVal(o, 'format') !== '—' ? ''
                    : 'Say what format it is first',
      copy:    { body: 'Anything worth saying about the file.',
                 prose: 'About the file' }
    },

    /* A deck reads like an asset and is governed like one, and the two things
       that differ are the two that matter. Its content is a file nobody can
       read in a browser and nobody should have to — you present it — so the
       deck leads and uploading it is the primary action.

       And its gate is the deck itself, not a metadata field. An asset with no
       file still describes something somebody can go and find; a Presentation
       with no deck is a title and four empty rows, and publishing it would put
       a citable document into the corpus with nothing behind it. */
    pptx: {
      regions: ['subject', 'record', 'prose'],
      prose:   'absent',
      ownsFile: true,
      rail:    ['what', 'came', 'connects'],
      fields:  (o) => typeFieldRows(o),
      start:   ['ai', 'connect'],
      ai:      { blank:  ['Write a first draft'],
                 filled: ['Rewrite for sellers', 'Shorten'] },
      ready:   (o) => subjectFile(o) ? '' : 'Upload the deck first',
      copy:    { body: 'What to say alongside it, and what changed since it was last shown.',
                 prose: 'Notes for presenting it' }
    },

    /* The outcome is the claim, the quote is the evidence, and approval decides
       whether either may leave the building. The quote earns the ruled
       treatment because it is somebody else's words. */
    story: {
      regions: ['record', 'prose'],
      prose:   'secondary',
      rail:    ['what', 'connects', 'came'],
      facts:   (o) => axisTags(o) + (o.client && CLIENTS[o.client] ? tcSum(CLIENTS[o.client]) : ''),
      fields:  (o) => typeFieldRows(o, ['quote']) +
                      xFaced(o, 'quote', 'They said', xVal(o, 'quote')
                        ? `<blockquote class="tc-quote">${esc(xVal(o, 'quote'))}</blockquote>` : '—',
                        { modal: true }),
      start:   ['ai', 'connect'],
      ai:      { blank:  ['Write a first draft', 'Outline it'],
                 filled: ['Rewrite for sellers', 'Shorten', 'Fill the gaps'] },
      /* Gated on the outcome, not on approval. §6.3 is explicit that approval
         is not verification and leaves whether it becomes a trust value open;
         making Publish depend on it would settle that ruling here, in the one
         primitive that ships into other agents' surfaces. */
      ready:   (o) => xVal(o, 'outcome') && xVal(o, 'outcome') !== '—' ? ''
                    : 'Say what the outcome was first',
      copy:    { body: 'What happened, in order.',
                 prose: 'The full story' }
    },

    /* A post IS the post, so prose leads exactly as it does on an article.
       Where it is published follows it. */
    blog: {
      regions: ['prose', 'record'],
      prose:   'primary',
      rail:    ['what', 'came', 'connects'],
      fields:  (o) => typeFieldRows(o, ['canonical']) +
                      xFaced(o, 'canonical', 'Canonical at', xVal(o, 'canonical') && xVal(o, 'canonical') !== '—'
                        ? `<span class="tc-mono">${esc(xVal(o, 'canonical'))}</span>` : '—'),
      start:   ['ai', 'file', 'connect'],
      ai:      { blank:  ['Write a first draft', 'Outline it'],
                 filled: ['Rewrite for readers', 'Shorten', 'Expand', 'Fill the gaps'] },
      ready:   (o) => String(o.sum || '').trim() ? '' : 'Add some content first',
      copy:    { body: 'The post, as published.' }
    },

    /* Blog and Web Page are both web-shaped and share the monospace texture,
       and they diverge on purpose: a post's content is the writing, a web page
       is a COPY we crawl. Only one of them has change detection, and change
       detection is a claim about the copy rather than about the writing — so
       the URL and the freshness lead, and the stored text is what we answer
       from underneath it. The one field it has is in the subject, so there is
       no record region to draw. */
    webpage: {
      /* `record` earns its place here even with no fields of its own: it draws
         nothing unless there is something to draw, and it is where the
         type-switch note lives. Without it, switching TO a Web Page would
         report the switch nowhere. */
      regions: ['subject', 'record', 'prose'],
      prose:   'secondary',
      ownsSync: true,
      rail:    ['came', 'what', 'connects'],
      start:   ['ai', 'connect'],
      ai:      { blank:  ['Write a first draft'],
                 filled: ['Rewrite for readers', 'Shorten', 'Fill the gaps'] },
      ready:   (o) => xVal(o, 'url') && xVal(o, 'url') !== '—' ? ''
                    : 'Give it a source URL first',
      copy:    { body: 'What we stored from the page.',
                 prose: 'What we stored from it' }
    }
  };

  const viewFor = (o) => TYPE_VIEW[o.t] || TYPE_VIEW.article;

  /* Where the back button goes, and what it is therefore called. The module's
     own name comes from settings rather than a table here, so a module renamed
     there cannot leave this button naming a page that no longer exists. */
  function backLabel(st) {
    const SET = window.AIMY_SETTINGS;
    if (!st.m || !SET || !SET.has(st.m)) return 'All documents';
    const m = (SET.modules || []).filter((x) => x.id === st.m)[0];
    return m ? 'Back to ' + m.name : 'All documents';
  }

  function renderDoc(st) {
    const o = byId(st.doc);
    if (!o) { patch({ doc: '' }, { replace: true }); return; }
    /* Before anything is drawn from it: a paint with nothing pending is a
       paint of the saved document, and that is what Discard restores. */
    baseline(o);
    const stage = $('#wbStage');
    /* ── A document with no body is a document with no body ──

       This also required the title to start with "Untitled", which was a proxy
       for "you just made this" and stopped being true the moment a file could
       name one. Every ingested document therefore got the starting moves
       suppressed — a filled title over an empty page and nothing offered, which
       is exactly what a Word file looked like on arrival. The test is the body,
       and the same test the drop layer uses. */
    const blank = isBlankDoc(o);
    const preview = previewVer !== null ? VERSIONS(o)[previewVer] : null;
    const owns = responsible(o) === USER.owner;
    const keep = stage.dataset.doc === o.id ? $('#docCanvas') && $('#docCanvas').scrollTop : 0;
    const live = document.activeElement;
    /* ── What was being typed into, across the paint that replaces it ──

       `armedSel` first: see armEditable. activeElement is right when renderDoc
       is called from anywhere but a focus transition, and wrong on the one
       path — title to body — where losing it costs you the body.

       Only for a paint of the SAME document. A different one opens read-first
       like every other, and carrying an arming across the gap would open it
       with the caret already in the text of a document nobody has touched. */
    const same = stage.dataset.doc === o.id;
    if (!same) { armedSel = null; armedAt = null; }
    const armed = !same ? null : armedSel
      || (live && live.getAttribute && live.getAttribute('contenteditable') === 'true' && isEditable(live)
      ? (live.id === 'editBody' ? '#editBody' : '[data-edit-title]') : null);
    const armedPoint = armedAt;
    /* ── A record field keeps its caret across the repaint that commits it ──

       For a list field the repaint IS the commit: `data-x-add` writes the
       value and calls repaintEditor, which replaces the input the caret was
       in. That was survivable in a rail nobody types into more than once. It
       is not survivable now that an ICP's fit criteria are the document's
       primary content and three of them meant three clicks back into the same
       box.

       `pendingFocus` when we got here through repaintEditor, which captured it
       before renderGrid detached the element; activeElement when renderDoc was
       called directly and nothing has been wiped yet. Mutually exclusive with
       `armed` — isEditable matches only the body and the title, and neither
       carries a data-x attribute. */
    const xKeep = pendingFocus || focusKeyOf(live);
    pendingFocus = null;
    /* Which record this kind of thing is, and in what order it reads. */
    const view = viewFor(o);
    const regions = view.regions;
    const rail = view.rail;

    /* ── ONE FACT, SAID ONCE ──

       The notice below and the trust chip in the byline are the same fact
       twice, forty pixels apart, under the same icon. The notice is the one
       that earns its place: it carries the REASON ("Confluence changed after
       our copy"), the CONSEQUENCE ("Still used in answers, and answers say
       so") and, on two of the three states, the button out of it. The chip
       carries the word and its own tone, and the word is the notice’s first
       word. So the chip goes — and the byline gets to lead with the kind of
       thing you are looking at, which is what the comment inside docByline
       argues it should have led with all along.

       TWO CASES WHERE IT IS NOT THE SAME FACT, checked against the corpus
       rather than reasoned about:

         ARCHIVED. The notice says "Archived." and the chip says the computed
         status, which is something else. article-refund-2024 is archived AND
         superseded: banner "Archived.", chip "Superseded". Two facts, and
         dropping the chip would lose the second one.

         SET BY HAND. The chip carries a pin and a title saying who set it.
         Nothing else on the page does, and this file argues a few hundred
         lines up that "an override you cannot see is indistinguishable from
         a fact, which is the whole failure of the attestation model this
         replaced". So a hand-set status keeps its chip.

       What is left is outdated and superseded computed from the facts, where
       the notice says "Out of date." over a chip saying "Out of date", and
       "Replaced." over a chip saying "Superseded". */
    const noticeShows = STATUS[o.status].excluded || o.arch || o.status === 'outdated';
    const hushStatus = noticeShows && !o.arch && !o.statusSet &&
      (o.status === 'outdated' || o.status === 'superseded');
    const notice = noticeShows ? `
      <div class="dv-notice is-${o.arch || o.status === 'superseded' ? 'superseded' : 'expired'}">
        ${o.arch ? ICO.box : o.status === 'superseded' ? ICO.arrow : ICO.refresh}
        <span class="dv-notice-text"><strong>${o.arch ? 'Archived.' : o.status === 'superseded' ? 'Replaced.' : 'Out of date.'}</strong>
        ${o.arch ? 'Kept whole and restorable. Not used in answers.'
          : o.status === 'superseded' ? 'A newer document replaced it. Not used in answers.'
          : esc(SRC[o.src].label) + ' changed after our copy. Still used in answers, and answers say so.'}</span>
        ${o.arch || o.status === 'superseded'
          ? `<button class="dv-notice-link" data-act="${o.arch ? 'restore' : 'successor'}" data-obj="${o.id}">
               ${o.arch ? 'Restore it →'
                 : (RELATED[o.id] || {}).supersededBy ? 'Go to the current one →' : 'Find what replaced it →'}</button>`
          : ''}
      </div>` : '';

    stage.dataset.doc = o.id;
    stage.innerHTML = `
      <div class="doc-page${railOpen ? '' : ' rail-closed'}">
        <div class="doc-topbar">
          <!-- Named for the destination, not for the gesture. Opened from a
               module, the Archive today, this is the way back INTO it, and
               "All documents" would be a button that says one thing and does
               another. No backticks in here: this comment sits inside a
               template literal and one would end the string. -->
          <button class="doc-back" data-doc-close>
            ${ICO.arrow.replace('<svg', '<svg width="14" height="14" style="transform:rotate(180deg)"')}
            ${esc(backLabel(readURL()))}</button>
          <span class="doc-top-end">${docTopEnd(o)}
          </span>
        </div>

        <div class="doc-canvas" id="docCanvas">
          <div class="doc-paper">
            ${preview ? `<div class="ver-preview">
                ${ICO.clock.replace('<svg', '<svg width="14" height="14"')}
                <span>Reading <strong>${esc(preview.v)}</strong> from ${esc(fmtShort(preview.at))} — you cannot edit history.</span>
                <span class="ver-preview-end">
                  ${preview.current ? '' : `<button class="btn btn-ghost btn-sm" data-restore="${o.id}">Restore this version</button>`}
                  <button class="btn btn-brand btn-sm" data-close-ver>Back to the current one</button>
                </span>
              </div>`
            : ''}

            <!-- ── Everything ABOUT the document comes before it ──

                 The notice, the byline and the ownership note used to sit
                 BETWEEN the title and the body — 73px of status interrupting
                 the two things you can actually click and edit. The document's
                 whole model is that you touch text and it becomes editable, and
                 that reads as one surface only when the editable blocks are
                 contiguous. So the head is a head: it goes above the title, and
                 title and body are neighbours. -->
            ${(notice || docByline(o) || (!preview && !owns)) ? `<header class="doc-head">
              ${notice}
              ${docByline(o, hushStatus)}
              <!-- The type's own content used to render HERE, as a read-only
                   replay of the card's body — the one type-aware run on the
                   page, describing fields you then had to open a rail to
                   change. It is the record region now: same facts, in the
                   order the type reads, with the fields as the controls. The
                   head keeps what §6.4 calls constant and nothing else. -->
              <!-- It said "Owned by A. Mahfouz, not you" directly under a
                   byline that had just said "Owned by A. Mahfouz" — four words
                   repeated at twenty pixels’ distance, and the only new thing
                   in the sentence was the warning. The warning is what it is
                   for, so the warning is what it says.

                   It also stops lying on an unowned document. The owns flag is
                   comparison against USER.owner, so this rendered for an
                   unassigned one too — "Owned by Unassigned, not you", which
                   is the exact defect ownerPhrase was written to prevent,
                   reintroduced two hundred lines below it. The byline says
                   "Nobody owns it" there and this no longer contradicts it. -->
              ${!preview && !owns ? `<p class="doc-note">Not your document. Your edit is recorded against your name.</p>` : ''}
            </header>` : ''}

            <!-- No contenteditable at rest. See armEditable: the attribute
                 arrives under the pointer and leaves when you look away, so
                 what you land on is a document, not a form holding one. -->
            <h1 class="doc-title" spellcheck="false" data-edit-title
                ${preview ? '' : 'tabindex="0" aria-label="Title — press Enter to edit"'}
                >${esc(o.title)}</h1>

            <!-- ── What this KIND of thing is, in the order it reads ──

                 One template served all eight for the life of this prototype,
                 which the library's own spec never asked for: eight templates
                 over one fixed governance row. The row is everything above and
                 below this line — notice, byline, title, proposal, comments,
                 rail foot — and stays in the same place whatever you opened.
                 What varies is here. -->
            ${preview ? previewBody(o)
              : regions.map((k) => (DOC_REGION[k] ? DOC_REGION[k](o, view, blank) : '')).join('')}

            ${aiDraftBlock(o)}

            <!-- Comments belong under the writing, not beside it. You comment
                 on a document while READING it — you have just found the thing
                 you want to say something about — and in a 320px rail the
                 thread was 141px of somebody else's column. -->
            ${preview ? '' : (() => {
              const thread = commentThread(o);
              if (!thread) return '';
              const n = (o.comments || []).length;
              return `<section class="doc-comments" aria-label="Comments">
                <h2 class="doc-comments-head">${n ? n + ' comment' + (n === 1 ? '' : 's') : 'No comments yet'}</h2>
                ${thread}
              </section>`;
            })()}
          </div>
        </div>

        <aside class="doc-rail" aria-label="About this document">
          ${docInsights(o)}
          <!-- What it is opens; the other two wait to be asked.

               All three used to be closed, on the argument that three open
               blocks answer questions nobody put. That holds for the other
               two — what a document connects to and where it came from are
               things you go looking for. It does not hold for the first one,
               which is the only place the document's properties can be
               CHANGED. Closed, every field on the page was a click away from
               being visible at all, and the rail read as three labels.

               The titles are the questions each one answers, in parallel, so
               the summary alone tells you whether to open it. "About it" was
               vague enough to mean any of the three. -->
          ${rail.map((k) => RAIL_BLOCK[k](o, view)).join('')}
          <div class="rail-foot">
            <!-- Not on a draft. Nobody else can read it, so there is nobody to
                 report it to and no thread for the report to land in — pressing
                 this on a draft used to write a comment into a document that
                 renders none, and say it had worked. -->
            ${o.status === 'draft' ? ''
              : `<button class="cite-action" data-act="report" data-obj="${o.id}">${ICO.flag}Report a problem</button>`}
            <button class="cite-action" data-act="${o.arch ? 'restore' : 'archive'}" data-obj="${o.id}">${ICO.box}${o.arch ? 'Restore' : 'Archive'}</button>
            ${o.arch ? `<button class="cite-action is-danger" data-act="delete" data-obj="${o.id}">${ICO.x}Delete</button>` : ''}
          </div>
        </aside>
      </div>`;

    const canvas = $('#docCanvas');
    if (canvas) canvas.scrollTop = keep;
    if (!preview) wireSelectionMenu();
    /* Here rather than in the template, because the pattern is React and needs
       the node to exist first — the same ordering `bodyDrawn` below needs. */
    if (window.AIMY_AGENT) {
      const rep = $('#agentRepair');
      if (rep) {
        /* The newest unresolved problem is the one being answered. Quoting what
           the person actually wrote is the difference between a reply and a
           form letter — and it is already on the document. */
        const open = (o.comments || []).filter((c) => c.problem && !c.done);
        const last = open[open.length - 1];
        window.AIMY_AGENT.repair(rep, o, last ? {
          note: last.who + ' reported: “' + last.text + '”',
          fixes: [
            'Stopped citing it until the report is cleared',
            'Sent it to ' + responsible(o) + ', who owns this document'
          ]
        } : null);
      }
    }
    /* A repaint replaces the DOM the caret was living in. Scroll was already
       carried across; the armed state has to travel with it or an AI accept
       mid-edit would drop you back out of the text you were in. */
    /* ── Whatever was being typed into keeps the caret ──

       One chain, in the order of what the person is doing, and exactly one
       branch runs.

       An OPEN ROW outranks the armed body: clicking a field while the body was
       armed is a request to edit the field, and re-arming the body would take
       the caret straight back out of the row that just unfolded.

       This is also the ONLY place a row's input gets focused. It used to be
       the click handler, which captured the element and focused it on a 40ms
       timer — so the reference went stale if anything repainted in between,
       and the row unfolded under the pointer with the caret nowhere. Focusing
       it here happens in the same synchronous render that created it, and it
       re-establishes on every later repaint for as long as the row is open. */
    const openInput = openXField ? `[data-x-val="${openXField.replace(/"/g, '\\"')}"]`
      : openProp ? `[data-prop-v="${openProp.replace(/"/g, '\\"')}"]` : null;

    /* Mid-commit: the repaint IS the write, so go back to the field it came
       from. Not `select()` on an add-input — it is empty by definition after a
       commit, and selecting nothing then typing reads as a lost keystroke. */
    if (xKeep) {
      const f = $(`[${xKeep[0]}="${xKeep[1].replace(/"/g, '\\"')}"]`);
      if (f) { f.focus(); if (xKeep[0] === 'data-x-val' && f.select) f.select(); }
    }
    else if (openInput) {
      const f = $(openInput);
      if (f) { f.focus(); if (f.select) f.select(); }
    }
    /* The point, when the repaint was caused by a click that had one: the
       layout it lands in is the layout that was clicked, so the same
       coordinates put the caret where the pointer is. caretToEnd is the
       fallback for the repaints nobody pointed at — an AI accept, a field
       commit — where the end of what you were writing is where you were. */
    else if (armed) {
      const el = $(armed);
      if (el) {
        if (armedPoint) armEditable(el, armedPoint.x, armedPoint.y);
        else { armEditable(el); caretToEnd(el); }
        /* Consumed. The point belongs to the gesture that armed the block and
           this is that gesture's paint; a later one — an AI accept, a field
           commit — belongs at the end of what has been written since, not back
           at where the pointer first went down. */
        armedAt = null;
        /* A point outside the block it was taken in — the page reflowed, or
           the click was on the padding — leaves the caret nowhere. */
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !el.contains(sel.anchorNode)) caretToEnd(el);
      }
    }
    /* A new document opens with the caret in its title. Only if nothing else
       is armed by the time the timer runs — otherwise a click that landed in
       the body between the paint and the timer is undone 80ms after it. */
    else if (blank) {
      const t = $('[data-edit-title]');
      if (t) setTimeout(() => { if (!armedSel && !$('.doc-page [contenteditable="true"]')) armEditable($('[data-edit-title]')); }, 80);
    }

    /* Last, because it reads the body out of the page this function just put
       there. See bodyDrawn: what the renderer made of a stored summary is the
       starting state, not the first edit. */
    const drawn = $('#editBody');
    bodyDrawn = drawn ? drawn.innerHTML : null;
    bodyWritten = false;
  }

  /* ── Read first, edit on touch ──

     The page used to render with `contenteditable` already on, which made it an
     editor displaying a document rather than a document you can change. Nothing
     is armed now. The attribute arrives when you put the pointer in the text and
     leaves when you look away, and the formatting toolbar comes with it — at
     rest there is no chrome to say "this is a form".

     Because the element was NOT editable when the pointer went down, the browser
     does not place a caret for us. We place it at the point, or the click would
     silently jump to the start of the block and you would type in the wrong
     place. */
  function editableAt(x, y) {
    if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
    if (!document.caretPositionFromPoint) return null;
    const p = document.caretPositionFromPoint(x, y);
    if (!p) return null;
    const r = document.createRange();
    r.setStart(p.offsetNode, p.offset); r.collapse(true);
    return r;
  }

  function putCaret(range) {
    if (!range) return;
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
  }

  function caretToStart(el) { const r = document.createRange(); r.selectNodeContents(el); r.collapse(true); putCaret(r); }
  function caretToEnd(el)   { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); putCaret(r); }

  /* ── What is armed, said by the code that armed it ──

     renderDoc used to answer "what was being typed into" by reading
     `document.activeElement`, and on the one path that matters most it read
     the wrong thing. Moving from the title into the body fires `focusout` on
     the title BEFORE the focus lands, and during that dispatch activeElement
     is `<body>` — not the block we just armed. So the repaint the focusout
     commits with saw nothing armed, drew a fresh un-armed body, and the blank
     branch below put the caret back in the title 80ms later. On a new document
     the title was the only thing you could ever type into.

     `armedSel` is the intent, recorded where the intent is expressed. It
     outlives the focus transition because it is not focus. `armedAt` carries
     the point so the caret comes back where the pointer was and not at the end
     of the prose. */
  let armedSel = null;
  let armedAt = null;
  const selOf = (el) => el && el.id === 'editBody' ? '#editBody'
    : el && el.hasAttribute && el.hasAttribute('data-edit-title') ? '[data-edit-title]' : null;

  function armEditable(el, x, y) {
    if (!el || el.getAttribute('contenteditable') === 'true') return;
    /* History is readable, never writable — the version banner says so and the
       attribute must agree with it. */
    if ($('.ver-preview')) return;
    el.setAttribute('contenteditable', 'true');
    armedSel = selOf(el);
    armedAt = typeof x === 'number' ? { x: x, y: y } : null;
    const page = el.closest('.doc-page');
    if (page && el.id === 'editBody') page.classList.add('is-writing');
    el.focus({ preventScroll: true });
    if (typeof x === 'number') putCaret(editableAt(x, y));
    else caretToStart(el);
    if (el.id === 'editBody') setTimeout(placeBlockMark, 0);
  }

  function disarmEditable(el) {
    if (!el || !el.removeAttribute) return;
    /* Only the block that IS armed can disarm. The title's focusout arrives
       after the body has already been armed by the same gesture, and clearing
       unconditionally there is what threw the intent away. */
    if (selOf(el) === armedSel) { armedSel = null; armedAt = null; }
    el.removeAttribute('contenteditable');
    const page = el.closest && el.closest('.doc-page');
    if (page) page.classList.remove('is-writing');
    dropBlockMark();
  }

  /* ── One toolbar, on the block you are editing ──

     The document has one rule — nothing is armed until you touch it — and the
     writing tools used to ignore it twice over: a formatting toolbar pinned to
     the top of the paper, occupying 46px of hidden box on every document, and
     an assistant in the right gutter whose menu had 104px to open into and so
     clipped itself.

     They are one thing now, above the block the caret is in, where there is the
     full measure to open into. Invisible in view mode, following the caret, and
     gone when the caret is. */
  function dropBlockMark() {
    const m = $('#blkTools');
    if (m) m.remove();
    closeBlockMenu();
  }

  function caretBlock() {
    const body = $('#editBody');
    if (!body || body.getAttribute('contenteditable') !== 'true') return null;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !body.contains(sel.anchorNode)) return null;
    /* Two menus over one paragraph is one too many: a selection belongs to
       wireSelectionMenu, which is already anchored to the words. */
    if (!sel.isCollapsed) return null;
    let n = sel.anchorNode;
    while (n && n.parentElement !== body) n = n.parentElement;
    return n && n.nodeType === 1 ? n : null;
  }

  function placeBlockMark() {
    const block = caretBlock();
    const host = $('#docCanvas');
    if (!block || !host) { dropBlockMark(); return; }
    let m = $('#blkTools');
    if (!m) {
      m = document.createElement('div');
      m.id = 'blkTools';
      m.className = 'toolbar blk-tools';
      m.setAttribute('role', 'toolbar');
      m.setAttribute('aria-label', 'Writing tools');
      m.innerHTML = `<button class="icon-btn blk-add" type="button" data-blocks
           aria-haspopup="true" aria-expanded="false"
           aria-label="Add a block" title="Add a block">+</button>
         <span class="toolbar-sep"></span>`
        + TOOLBAR.map(([cmd, glyph, label]) => cmd === '|'
        ? '<span class="toolbar-sep"></span>'
        : `<button class="icon-btn" type="button" aria-label="${esc(label)}" title="${esc(label)}"
             data-fmt="${esc(cmd)}">${glyph}</button>`).join('')
        + '<span class="toolbar-sep"></span>'
        + `<button class="blk-ai" type="button" data-ai-doc aria-haspopup="true" aria-expanded="false"
             aria-label="Rewrite this with AiMY" title="Rewrite with AiMY">
             ${AIMY_MARK(13, 15)}<span>AiMY</span></button>`;
      host.appendChild(m);
      syncToolbar();
    }
    const hr = host.getBoundingClientRect(), br = block.getBoundingClientRect();
    /* Above the block, aligned to the text's left edge — the measure is 762px
       wide, so the menu this opens has somewhere to go. In the gutter it had
       104px and clipped itself. */
    m.style.top = (br.top - hr.top + host.scrollTop - m.offsetHeight - 8) + 'px';
    m.style.left = Math.max(0, br.left - hr.left) + 'px';
  }

  const isEditable = (el) => !!el && !!el.matches && el.matches('[data-edit-title], #editBody');

  /* The block list, from the + or from a slash. `slashed` remembers that the
     block still holds the "/" that opened it, so choosing an item clears it
     first — otherwise every block made this way starts with a stray character. */
  let slashed = null;

  function closeBlockMenu() {
    const m = $('#blkMenu');
    if (m) m.remove();
    const btn = $('[data-blocks]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function openBlockMenu(rect, fromSlash) {
    closeBlockMenu();
    const host = $('#docCanvas');
    if (!host) return;
    slashed = fromSlash ? caretBlock() : null;
    const hr = host.getBoundingClientRect();
    const m = document.createElement('div');
    m.id = 'blkMenu';
    m.className = 'blk-menu k-enter';
    m.setAttribute('role', 'menu');
    m.innerHTML = BLOCKS.map(([label, glyph], i) =>
      `<button class="blk-menu-item" type="button" role="menuitem" data-block="${i}">
         <span class="blk-menu-ico">${glyph}</span>${esc(label)}</button>`).join('');
    host.appendChild(m);
    m.style.left = Math.max(0, rect.left - hr.left) + 'px';
    m.style.top = (rect.bottom - hr.top + host.scrollTop + 6) + 'px';
  }

  /* ── The AiMY proposal ──

     This used to live in the editor's template with fixture copy inside it,
     hidden by a class, and aiPropose overwrote its innards. Anything that
     repainted the editor — accepting, most of all — rebuilt it from the
     fixture, so accepting made the block come back wearing words nobody had
     proposed.

     It is state now. No draft, no block. */
  let aiDraft = null;

  function aiDraftBlock(o) {
    if (!aiDraft || aiDraft.doc !== o.id) return '';
    /* A blank document has nothing to strike through. What AiMY wrote for it is
       a draft, not a revision of something, and drawing a diff against "(empty)"
       said the opposite. */
    const isNew = !aiDraft.was;

    /* ══ WHILE IT IS STILL BEING WRITTEN ══════════════════════════
       The same box, in the same place, at roughly the same size - so the
       proposal resolves INTO the shape the reader is already looking at rather
       than pushing the document around when it arrives.

       No foot. There is nothing to accept yet, and a disabled Accept under a
       draft that does not exist is a control that lies about what it can do.

       The caption reuses `.ai-thinking-label` deliberately: this is the same
       state as the chat's thinking line - AiMY is working and has said what on
       - so it should be the same words in the same treatment, and swapLabel
       already knows how to change it without a repaint. */
    if (aiDraft.pending) {
      return `<div class="ai-suggestion is-pending" id="aiSuggest" aria-busy="true">
        <div class="ai-suggestion-head">${AIMY_MARK(12, 13)}${esc(aiDraft.label)}</div>
        <div class="ai-suggestion-body">
          <div class="ai-thinking-label ai-suggestion-note">${esc(aiDraft.note || 'Working')}</div>
          <div class="skeleton" style="height:0.75rem"></div>
          <div class="skeleton" style="height:0.75rem"></div>
          <div class="skeleton" style="height:0.75rem;width:62%"></div>
        </div>
      </div>`;
    }

    return `<div class="ai-suggestion" id="aiSuggest">
      <div class="ai-suggestion-head">${AIMY_MARK(12, 13)}${esc(isNew ? 'AiMY drafted this' : aiDraft.label)}</div>
      <div class="ai-suggestion-body">
        ${isNew ? '' : `<del>${esc(aiDraft.was)}</del>`}
        <!-- The proposal is document copy, so it renders as document copy. It is
             also what Edit hands you: paragraphs and headings you can work on,
             rather than one line describing what a rewrite would have done. -->
        <ins${aiDraft.editing ? ' contenteditable="true" class="is-editing"' : ''}>${aiDraft.proposed}</ins>
      </div>
      <div class="ai-suggestion-foot">
        <button class="btn btn-brand btn-sm" data-suggest="accept">Accept</button>
        <button class="btn btn-ghost btn-sm" data-suggest="edit">${aiDraft.editing ? 'Editing…' : 'Edit'}</button>
        <button class="btn btn-ghost btn-sm" data-suggest="reject">Reject</button>
      </div>
    </div>`;
  }

  function aiPropose(label, proposed) {
    const o = byId(readURL().doc);
    if (!o) return;
    const body = $('#editBody');
    const wasText = (body ? body.innerText : String(o.sum || '')).trim().split(/\r?\n/)[0];

    /* The canvas is the record of what AiMY has been asked to do. It is not
       opened — that would cover the document being edited, which is what §5.3
       says selection and document scope must never do. It collects, and the
       badge on the input says how much is waiting. */
    canvas.push('user', esc(label + ' — ' + o.title));

    /* ══ AIMY IS SEEN TO WORK ══════════════════════════════════
       The proposal used to be in the document in the same frame as the click
       that asked for it, which reads as a thing that was already there rather
       than as a thing that was written for you. There is no model behind this
       to be slow, so the wait is a reading decision - the same kind the chat's
       three seconds is - and it is spent SAYING what is happening rather than
       spinning.

       The canvas gets the question now and the answer when there is one. A
       completed reply sitting in the record while the document is still
       drafting would be the surface disagreeing with itself.

       AIMY_LATENCY owns the pace, so `?latency=instant` collapses all three
       beats and the proposal lands in the click, exactly as before. */
    if (aiHold) { aiHold(); aiHold = null; }
    aiDraft = { doc: o.id, label: label, was: wasText || '', proposed: proposed,
                msg: '', editing: false, pending: true, note: 'Reading the document' };
    renderDoc(readURL());
    const waiting = $('#aiSuggest');
    if (waiting) {
      /* The BOX arrives here, once. What happens when the draft is ready is
         its contents resolving inside a box the reader is already looking at -
         see `is-resolving` below. A second box-level entrance there would
         announce the same card twice. */
      const M1 = window.AIMY_MOTION;
      waiting.classList.add('is-proposing');
      if (M1) M1.after(waiting, () => waiting.classList.remove('is-proposing'), { ms: 900 });
      waiting.scrollIntoView({ block: 'nearest' });
    }

    const land = () => {
      aiHold = null;
      /* Navigated away, or a second proposal superseded this one. */
      if (!aiDraft || aiDraft.doc !== o.id || !aiDraft.pending) return;
      aiDraft.pending = false;
      canvas.push('aimy', `<div class="answer-surface"><div class="answer-body">${proposed}</div>
      <div class="answer-scope">${ICO.pen.replace('<svg', '<svg style="width:12px;height:12px"')}
      <span>Proposed in the document. Not applied.</span></div></div>`, 'ai-' + (++aiSeq));
      aiDraft.msg = 'ai-' + aiSeq;
      bumpCanvasBadge();
      renderDoc(readURL());
      markAfter('#aiSuggest', $('#docCanvas'));
      landProposal();
    };

    const M0 = window.AIMY_MOTION;
    if (!M0) { land(); return; }
    aiHold = M0.latency.steps([
      { label: 'Reading the document', ms: 700 },
      { label: 'Drafting the change', ms: 900 },
      { label: 'Checking it against the sources', ms: 600 }
    ], (text) => {
      /* Banked on the draft as well as written to the node, because a repaint
         of the document rebuilds this card and would otherwise redraw it
         holding the first beat. */
      if (aiDraft) aiDraft.note = text;
      const note = $('#aiSuggest .ai-suggestion-note');
      if (note) swapLabel(note, text);
    }, land);
  }

  /* Split out so the pending path and the no-motion path arm the entrance the
     same way rather than each keeping its own copy. */
  function landProposal() {
    const card = $('#aiSuggest');
    if (card) {
      /* ══ THE ENTRANCE IS ARMED HERE, NOT IN THE TEMPLATE ════════════
         renderDoc rebuilds this card on every repaint for as long as the draft
         is live - every keystroke in the document under it, every status
         change, every comment. An entrance written into the markup would
         replay on all of them, which is the strobe rather than the arrival.

         Added at the one moment a proposal is actually made. The node is
         destroyed by the next repaint and the class goes with it, so there is
         nothing to clean up - the timer below is only for the case where the
         animation never runs at all. */
      const M = window.AIMY_MOTION;
      card.classList.add('is-resolving');
      if (M) M.after(card, () => card.classList.remove('is-resolving'), { ms: 900 });
      card.scrollIntoView({ block: 'nearest' });
    }
  }

  /* What you did with a proposal is part of the record. Written back into the
     message it belongs to, so the thread reads as request → response → outcome
     rather than a list of things AiMY offered and no sign of what happened. */
  let aiSeq = 0;
  /* The beats of a proposal still being drafted. Cancelled when another
     proposal starts, so two cannot narrate over each other. */
  let aiHold = null;
  function aiOutcome(msgId, verdict) {
    const el = msgId && document.getElementById(msgId);
    if (!el) return;
    el.insertAdjacentHTML('beforeend',
      `<div class="ai-outcome is-${verdict}">${(verdict === 'accept' ? ICO.check : ICO.x).replace('<svg', '<svg width="12" height="12"')}
       <span>${verdict === 'accept' ? 'Applied to the document.' : 'Rejected. Kept in the trail.'}</span></div>`);
  }

  /* An action has to be visible where you are looking. A toast is a receipt
     from somewhere else; this takes the eye to the thing that actually moved.
     Removed after the animation so a later repaint can fire it again. */
  function markChanged(el) {
    if (!el || !el.classList) return;
    el.classList.remove('just-changed');
    void el.offsetWidth;
    el.classList.add('just-changed');
    setTimeout(() => el.classList.remove('just-changed'), 1500);
  }

  /* Mark by selector after the repaint that produced the element — the node the
     caller was holding is gone by then, which is why this takes a selector. */
  function markAfter(sel, root) {
    const go = () => {
      const el = (root || document).querySelector(sel);
      if (el) markChanged(el);
    };
    /* The repaint that produces this element may be running inside a view
       transition, which lands on the browser's schedule rather than ours. The
       30ms this used to wait was a guess that was longer than a frame; where
       there is a real event to wait for, afterPaint waits for it, and where
       there is not it still waits 30ms. */
    const M = window.AIMY_MOTION;
    if (M && M.afterPaint) M.afterPaint(go);
    else setTimeout(go, 30);
  }

  /* The card for a document, wherever it is on the grid. */
  function markCard(id) { markAfter(`#wbStage [data-card-open="${id}"]`); }

  /* Replace a word in place while the thing it names is still happening. Used
     by the thinking state, where the mark keeps turning and only the caption
     resolves into the next true statement.

     The reflow between removing the class and adding it back is what
     guarantees the entrance replays - without it both writes land in one style
     recalculation and the browser sees no change to animate. The same idiom
     markChanged uses, for the same reason.

     `after` rather than a hardcoded wait: the out duration lives in the
     stylesheet, and a number repeated here would be a number that drifts. */
  function swapLabel(el, text) {
    if (!el || el.textContent === text) return;
    const M = window.AIMY_MOTION;
    if (!M || M.reduced()) { el.textContent = text; return; }
    el.classList.remove('is-in');
    el.classList.add('is-out');
    M.after(el, () => {
      el.textContent = text;
      el.classList.remove('is-out');
      void el.offsetWidth;
      el.classList.add('is-in');
    });
  }

  /* One writer for the body. o.sum is the plain-text projection the cards,
     the search, the Publish gate and the version bodies all read; o.html is
     what the document actually says, formatting and all. */
  function writeBody(el) {
    const o = byId(readURL().doc);
    if (!o || !el) return o;
    /* Every way the body can change ends up here — typing, the formatting
       toolbar, the block menu, an image landing in a figure, an AiMY draft —
       so this is where the document finds out it has changed. But two callers
       that are NOT edits reach it too: the blur that follows a click into the
       body, and the blur that follows an Escape. Against the body as it was
       drawn, both are visibly nothing, and nothing is what they write. */
    if (bodyWritten || bodyDrawn === null || el.innerHTML !== bodyDrawn) {
      bodyWritten = true;
      o.sum = el.innerText.trim();
      o.html = o.sum ? el.innerHTML : '';
      markDirty(o);
    }
    el.classList.toggle('is-blank', !o.sum);
    const b = $('.doc-page [data-publish]');
    if (b) {
      /* The same two facts the top bar drew the button with, so typing into
         the body cannot leave it saying something the gate no longer says, nor
         re-open it over a round of edits that has not been written down. */
      const gate = publishGate(o);
      b.disabled = !!(gate || isDirty(o));
      /* A button that is open has nothing to explain, so it carries no
         tooltip either — the title is the reason it is shut. */
      if (b.disabled) b.title = publishTitle(o); else b.removeAttribute('title');
      b.textContent = gate || 'Publish';
    }
    return o;
  }

  /* A toolbar that never shows what is already on is telling you nothing. */
  function syncToolbar() {
    $$('.doc-page [data-fmt]').forEach((btn) => {
      const [cmd, val] = btn.getAttribute('data-fmt').split(':');
      let on = false;
      try {
        on = cmd === 'formatBlock'
          ? document.queryCommandValue('formatBlock').toLowerCase() === val
          : document.queryCommandState(cmd);
      } catch (e) {}
      btn.classList.toggle('is-on', !!on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function bumpCanvasBadge(n) {
    const b = $('.float-badge');
    if (!b) return;
    const next = Math.max(0, n === undefined ? (+b.textContent || 0) + 1 : n);
    b.textContent = String(next);
    b.hidden = next === 0;
  }

  /* A property changed: write it, re-derive, and repaint both the editor and
     the grid behind it, so the badge on the card moves as you edit. */
  /* ── The field the repaint is about to destroy ──

     `renderGrid` writes to `#wbStage`, which is the same stage the document
     lives in, so by the time `renderDoc` runs the element that had focus is
     already detached and `document.activeElement` is the body. Reading it
     there finds nothing, every time. It has to be captured before the wipe,
     which means here — the single funnel every property write goes through. */
  let pendingFocus = null;

  const focusKeyOf = (el) => el && el.getAttribute
    ? (el.hasAttribute('data-x-add') ? ['data-x-add', el.getAttribute('data-x-add')]
      : el.hasAttribute('data-x-val') ? ['data-x-val', el.getAttribute('data-x-val')]
      /* Ticking a box repaints, which detaches the box that was ticked. Without
         this, choosing three groups is three clicks back into the panel — the
         same defect the list fields above were fixed for. Unambiguous because
         only one multi panel is ever open. */
      : el.hasAttribute('data-multi-opt') ? ['data-multi-opt', el.getAttribute('data-multi-opt')] : null)
    : null;

  /* ── One writer per field, called rather than fired ──

     These lived inside the focusout listener, which made "click somewhere
     else" the only way to commit. Enter now calls the same function directly
     instead of calling blur() and hoping the focus event arrives: a commit
     that depends on a focus event firing is a commit that silently does
     nothing wherever those events do not arrive, and the difference between
     "wrote nothing" and "wrote nothing and said so" is invisible here.

     Returns whether anything changed, so the caller decides about repainting —
     focusout has folding rules of its own that Enter does not share. */
  /* A field that accepts 900 is a field that will hold 900, and a fit meter
     would render off its own end. The bounds come off the CONTROL rather than
     being written here: a percentage and a slide count do not share a ceiling,
     and a clamp that disagrees with the input it is clamping is a clamp nobody
     can see is wrong. */
  const clampToField = (t, raw) => {
    if (raw === '') return 0;
    const lo = t.min === '' || t.min === undefined ? -Infinity : Number(t.min);
    const hi = t.max === '' || t.max === undefined ? Infinity : Number(t.max);
    return Math.max(lo, Math.min(hi, Math.round(Number(raw) || 0)));
  };

  function commitXField(t) {
    const o = byId(readURL().doc);
    if (!o || !t || !t.getAttribute) return false;
    const k = t.getAttribute('data-x-val');
    if (!k) return false;
    const raw = String(t.value || '').trim();
    o.x = o.x || {};
    o.x[k] = t.type === 'number' ? clampToField(t, raw) : raw;
    return true;
  }

  function commitProp(t) {
    const o = byId(readURL().doc);
    if (!o || !t || !t.hasAttribute) return false;
    if (t.hasAttribute('data-prop-k')) {
      const was = t.getAttribute('data-prop-k');
      const now = String(t.value || '').trim();
      /* The key IS the identity, so a rename has to carry the open marker with
         it or the pair folds shut under the pointer mid-edit. */
      if (!now || now === was) return false;
      o.props[now] = o.props[was];
      delete o.props[was];
      if (openProp === was) openProp = now;
      return true;
    }
    if (t.hasAttribute('data-prop-v')) {
      o.props[t.getAttribute('data-prop-v')] = String(t.value || '').trim();
      return true;
    }
    return false;
  }

  function repaintEditor() {
    /* After the write and before the paint is the one moment the question has
       an exact answer, so it is asked in both directions: something moved, or
       something moved back. Quietly — renderDoc is about to draw the bar. */
    recheck(byId(readURL().doc), true);
    recompute();
    pendingFocus = focusKeyOf(document.activeElement);
    const st = readURL();
    renderGrid(st);
    renderBrief(st);
    renderDoc(st);
  }



  /* ── AiMY, at document scope ──

     The toolbar's AiMY button used to raise a toast telling you to select
     something first, which is a button explaining why it does nothing. It now
     opens the same `.ai-menu` the selection uses, with the actions that apply
     to a whole document. A blank one leads with the only action that matters
     when there is nothing there yet. */
  const DOC_AI = {
    /* Not a constant. "Draft from a linked ticket" was offered on every blank
       document, and a blank document has no connections at all — so it named a
       ticket out of nowhere, and only ever a ticket. It is offered when there
       is something to draft FROM, it works off whatever is actually connected,
       and it says which. The loop is: connect it, then draft from them. */
    blank:  ['Write a first draft', 'Outline it'],
    fromConnections: 'Draft from what it connects to',
    /* "Find a source for this" is not a writing action — it runs
       groundingAnswer, which finds what SUPPORTS the document — and filing it
       under a menu named for rewriting made the one genuinely useful thing in
       here the hardest to find. It lives in Where it came from now, beside the
       source it is asking about. */
    filled: ['Rewrite for support agents', 'Shorten', 'Expand', 'Fill the gaps']
  };

  /* ── What AiMY actually writes ──

     Every one of these used to be paired with a sentence DESCRIBING what AiMY
     had done — "AiMY drafted this from the twelve most-cited tickets" — and
     that sentence went into <ins> and then into the document. The draft read
     like a prompt because it was one: the prompt describing itself.

     These return copy the document could actually contain, built from what it
     already knows about itself. Prose, in paragraphs, which is also what makes
     Edit worth pressing — there is something real in there to change. */
  const stripTags = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = (t) => String(t || '').split(/(?<=[.!?])\s+/).filter((x) => x.trim());
  const paras = (arr) => arr.filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join('');

  function aiCopy(action, o, selection) {
    /* An untitled document has no name to write about yet, so it is described
       instead. Capitalised because it opens a sentence. */
    const named = !/^Untitled\s/i.test(o.title);
    const what = named ? o.title : 'This ' + TYPES[o.t].label.toLowerCase();
    const col = COLLECTIONS[o.col];
    const body = String(o.sum || '').trim();
    const sent = sentences(body);
    const tags = (o.tags || []).slice(0, 2).join(' and ');

    /* ── Rewriting for an audience, for any audience ──

       This was one `case 'Rewrite for support agents'`, from when every type
       opened the same menu. Now that a profile offers "Rewrite for sellers"
       and a campaign "Rewrite for marketing", a single case would let the
       other three fall through to `default:` — which returns the first
       sentence of the SELECTION, and at document scope there is no selection,
       so it returns nothing. The menu would have offered an action that
       proposed replacing the document with an empty one.

       The audience is in the label, so one branch reads it and covers all
       four. The plain-language substitutions are audience-neutral and stay. */
    const forWhom = /^Rewrite for (.+)$/.exec(action);
    if (forWhom) {
      const LEAD = {
        'support agents': 'The exception first, because it is what the customer is already asking about.',
        'sellers':        'What qualifies a prospect, and what rules one out — in that order.',
        'marketing':      'What may be said outside the building, and what may not.',
        'readers':        'The short answer first. The reasoning under it.'
      };
      return paras([LEAD[forWhom[1]] || 'Written for ' + forWhom[1] + '.']
        .concat(sent.map((s) => s.replace(/\bshall\b/gi, 'must').replace(/\bmay be\b/gi, 'can be'))));
    }

    switch (action) {
      /* ── a blank document ── */
      case 'Write a first draft':
        return paras([
          `${what} applies to every request handled through ${col}, and to the agents that answer from it. Where it and a customer contract disagree, the contract governs.`,
          `The rule is stated first and the exceptions after it, so a reader who stops at the first paragraph has still read something true. Anything not written here is not policy${tags ? ', including the parts of ' + tags + ' that are handled elsewhere' : ''}.`,
          `Raise a change through the owner of ${col} rather than editing in place when the change affects what customers are told.`
        ]);

      /* Built from the documents actually connected, whatever type they are, so
         it cannot invent a source and always says what it drew on. */
      case DOC_AI.fromConnections: {
        const from = claimsOf(o).slice(0, 3);
        if (!from.length) return paras(['Nothing is connected to this yet, so there is nothing to draft from.']);
        const names = from.map((e) => e.label);
        const list = names.length === 1 ? names[0]
          : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
        const kinds = [...new Set(from.map((e) => {
          const d = byId(e.id); return d ? TYPES[d.t].label.toLowerCase() : 'document';
        }))];
        return paras([
          `${what} draws on ${list}. What follows is what those ${kinds.length === 1 ? kinds[0] + 's' : 'documents'} already establish, written once so a reader does not have to open all ${names.length}.`,
          `Where they agree, the rule is stated here and they are the evidence for it. Where they disagree, the disagreement is the finding, and it is named rather than smoothed over.`,
          `Each of them remains the record of its own case. This is the part that generalises${tags ? ', including what ' + tags + ' has in common across them' : ''}.`
        ]);
      }

      case 'Outline it':
        /* Real headings, so the writing tools have something to work on. */
        return `<h3>Scope</h3><p>Who this covers and what it does not reach.</p>` +
               `<h3>Rules</h3><p>The rule, stated before its exceptions.</p>` +
               `<h3>Exceptions</h3><p>The cases that do not follow the rule, and why.</p>` +
               `<h3>Related</h3><p>What else in ${esc(col)} a reader needs alongside this.</p>`;

      /* ── a document that already says something ── */
      case 'Shorten':
        return paras(sent.slice(0, Math.max(1, Math.ceil(sent.length / 2))));

      case 'Expand':
        return paras(sent.concat([
          `Two cases come up often enough to state: a request made inside the window but completed outside it, and one made by someone other than the account holder. The first is in scope; the second needs the account holder's confirmation first.`
        ]));

      case 'Fill the gaps':
        return paras(sent.concat([
          `Not currently answered here: what happens when the request arrives through a reseller rather than direct. The linked tickets treat the reseller as the customer of record.`,
          `Also missing: who approves an exception, and how long they have to answer.`
        ]));

      /* ── selection scope: the highlighted words, changed ── */
      case 'Rewrite':
        return paras([`${String(selection || '').trim().replace(/[.,;:\s]+$/, '')} — stated plainly: the rule holds unless the item has been activated, and then the warranty process applies instead.`]);
      case 'Add the missing scope':
        return paras([`${String(selection || '').trim().replace(/[.,;:\s]+$/, '')}, for customers buying through the EU storefront. Resellers and APAC are covered separately.`]);
      default:
        /* Shorten, applied to a selection rather than the whole body. */
        return paras(sentences(selection).slice(0, 1));
    }
  }

  function aiMenu(anchor, items, attr) {
    const host = $('#docCanvas');
    if (!host) return null;
    const old = $('.ai-menu', host);
    if (old) { old.remove(); if (old.dataset.for === anchor.dataset.k) return; }
    const hr = host.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'ai-menu is-open k-enter';
    menu.style.left = Math.max(8, ar.left - hr.left) + 'px';
    menu.style.top = (ar.bottom - hr.top + host.scrollTop + 6) + 'px';
    menu.innerHTML = items.map((label, i) =>
      `<button${i === 0 ? ' class="ai-menu-primary"' : ''} ${attr}="${esc(label)}">${esc(label)}</button>`).join('');
    host.appendChild(menu);
    anchor.setAttribute('aria-expanded', 'true');
    return menu;
  }

  /* Selection scope (§5.3). The AI interactions that happen constantly while
     writing must never cover the thing being written, so this opens beside the
     selection and closes the moment it collapses. */
  function wireSelectionMenu() {
    const body = $('#editBody');
    if (!body) return;
    const kill = () => { const m = $('.ai-menu'); if (m) m.remove(); };
    body.addEventListener('mouseup', () => {
      setTimeout(() => {
        const sel = window.getSelection();
        kill();
        if (!sel || sel.isCollapsed || !body.contains(sel.anchorNode)) return;
        const r = sel.getRangeAt(0).getBoundingClientRect();
        const host = $('#docCanvas');
        const hr = host.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'ai-menu is-open k-enter';
        menu.style.left = Math.max(8, r.left - hr.left) + 'px';
        menu.style.top = (r.bottom - hr.top + host.scrollTop + 8) + 'px';
        /* The library's menu is buttons in a row with an optional primary and
           separators. It has no header slot, so the earlier version invented
           `.ai-menu-head` and `.ai-menu-item`, which resolved to nothing. */
        menu.dataset.sel = sel.toString().trim();
        /* ── Formatting first, because that is what a selection is for ──

           This menu carried only the AiMY actions, and the formatting lived in
           the block toolbar — which hides the moment there IS a selection, so
           selecting a word and reaching for Bold found nothing anywhere on the
           page. The two halves of "I have selected some words" belong in one
           place: what to do to them, then what to ask AiMY about them. */
        menu.innerHTML =
          SEL_FMT.map(([cmd, glyph, label]) =>
            `<button class="ai-menu-fmt" type="button" data-fmt="${esc(cmd)}"
               aria-label="${esc(label)}" title="${esc(label)}">${glyph}</button>`).join('')
          + '<span class="sep"></span>'
          + ['Rewrite', 'Shorten', 'Add the missing scope', 'Find a source']
            .map((l, i) => `<button${i === 0 ? ' class="ai-menu-primary"' : ''} data-ai-sel="${esc(l)}">${esc(l)}</button>`)
            .join('<span class="sep"></span>');
        host.appendChild(menu);
        syncToolbar();
      }, 10);
    });
    body.addEventListener('keydown', kill);
    const scroller = $('#docCanvas');
    if (scroller) scroller.addEventListener('scroll', kill, { passive: true });
  }



  /* ═══════════════════════════════════════════════
     CONVERSATIONS — a thread is a place you were, not a transcript

     The canvas held exactly one conversation and it existed only as DOM: turns
     were appended and nothing recorded them, so there was no second thread to
     go back to and no first one to come back FROM. Doctrine §2.2 stage 4 asks
     for "page position, filters, selected scope, conversation history" on
     return, and only the first three were ever kept.

     EACH SESSION CARRIES ITS SURFACE. `state` is the query string the
     conversation was had on, and the switch handler lays it back over the URL
     — so picking a conversation moves the page behind it to what that
     conversation was about. That is the whole claim: a session is not a
     transcript, it is a place you were.

     Ported from AiMY Sales, which is where this was first built.
  ═══════════════════════════════════════════════ */

  /* Turns, by thread key. A turn is `{ who, html, id? }` where `html` is a
     string or — for a LIVE answer — a function returning one, which is what
     `canvas.repaint()` re-runs. Memory panels are turns too (`who: 'memory'`),
     because a thread you return to has to come back whole. */
  const THREADS    = Object.create(null);
  /* Free-standing conversations: `{ title, at, state, blank? }`. */
  const SESSIONS   = Object.create(null);
  /* When each thread was last touched, for the column's order. */
  const THREAD_AT  = Object.create(null);
  /* Whether the "carried from an earlier thread" panel has been shown in this
     thread. This was one flag on the canvas, set once and never reset, so it
     fired for the first conversation and never again for any other. */
  const THREAD_MEM = Object.create(null);
  let sessSeq = 0, threadSeq = 0;

  /* Flat sessions: a conversation belongs to itself. `surface` is where a
     question asked with nothing open goes, and it always exists.

     A `?chat=` naming a conversation that is not here resolves to the
     surface rather than to itself. Nothing in this prototype survives a
     reload except the seeded threads, so a link kept from a previous visit
     points at a conversation that no longer exists — and honouring it would
     conjure an empty thread into the column with the raw key for a title.
     A conversation you cannot return to is one you land beside, not one the
     product invents a stub for. */
  const threadKey = () => {
    const k = readURL().chat;
    return (k && (SESSIONS[k] || THREADS[k])) ? k : 'surface';
  };

  /* READING A THREAD IS NOT TOUCHING IT.

     The stamp lived in this accessor, on the reasoning that every write comes
     through here first so a stamp nobody has to remember cannot be missed.
     The cost was worse than the bug it prevented: `paintThread` reads too, so
     merely OPENING a conversation re-sorted the column — the row you had just
     clicked jumped to the top and every other row moved under the cursor. A
     list that reorders itself as a result of being read cannot be used twice
     in a row, and switching between two conversations is the thing this column
     exists to make easy.

     So the accessor is a pure read, and the stamp is explicit at the two
     moments a conversation actually gains something: when it is created, and
     when a turn lands in it. */
  const thread$ = () => {
    const k = threadKey();
    return THREADS[k] || (THREADS[k] = []);
  };

  /* Takes a key, because a conversation is stamped at the moment it is made —
     before the URL has been told about it. */
  const touchThread = (key) => { THREAD_AT[key || threadKey()] = ++threadSeq; };

  /* What a thread is called in the column. */
  function threadName(key) {
    if (SESSIONS[key]) return SESSIONS[key].title;
    return key === 'surface' ? 'Across the corpus' : key;
  }

  /* The surface a conversation was had on, as the string a pasted link would
     carry. `chat` is stripped: a session pointing at itself is a fact the key
     already carries, and leaving it in would let a stale one override the
     conversation actually being opened. */
  function snapshot() {
    const st = readURL();
    st.chat = '';
    return serialize(st);
  }

  /* The title is the question, trimmed — the same rule every thread list uses,
     and the only one that does not require a person to name things. */
  const sessTitle = (q) => {
    const t = String(q == null ? '' : q).trim().replace(/\s+/g, ' ');
    return t.length > 42 ? t.slice(0, 41) + '…' : t;
  };

  /* ══ WHO IS ANSWERING ═══════════════════════════════════════════════════
     A conversation used to carry no record of which agent held it, because
     there was only ever one and the app said so in its chrome. The gate lists
     conversations from several side by side, and at that point "which one was
     this?" stops being answerable from the title — two threads about a refund
     read identically whether Knowledge or QA answered them.

     So the agent is a field, and the row prints it. Not an icon: a logo beside
     a title is a second thing to learn before the list can be read, and the
     word is already the shortest unambiguous form of itself.

     `id` matches the ecosystem tab it belongs to. `blurb` is what the picker
     shows underneath the name — one line, no marketing.

     ONE PER TAB. The registry is the product strip, so a conversation can
     carry whichever console held it. Only AiMY has a chat gate; the rest are
     consoles, and a thread held in one of them arrives here already labelled.
     This build holds one corpus — AiMY's
     — and an agent that can only answer from somebody else's material by
     pretending it is its own is a label on a wrong answer. Both already link
     out to their own deployments from the tab strip, which is the honest place
     for them until their corpora are here.

     What the three below split is not subject matter but the QUESTION each is
     good at: prose and policy, the health of the corpus, and its shape. Each
     one's suggestions were run against the answer engine and kept only where
     the answer came back grounded. */
  const CHAT_AGENTS = {
    aimy:    { label: 'AiMY',    blurb: 'Policies, articles and the corpus' },
    connect: { label: 'Connect', blurb: 'Integrations and the systems they touch' },
    talent:  { label: 'Talent',  blurb: 'People, roles and hiring' },
    qa:      { label: 'QA',      blurb: 'Corpus health — staleness, conflicts, sources' },
    sales:   { label: 'Sales',   blurb: 'Accounts, pipeline and what was promised' }
  };
  const DEFAULT_AGENT = 'aimy';
  /* Reading it back is the one place a stale or hand-edited key can arrive, so
     it resolves rather than indexes. */
  const agentOf = (key) => CHAT_AGENTS[(SESSIONS[key] || {}).agent] ? (SESSIONS[key] || {}).agent : DEFAULT_AGENT;

  /* WHICH AGENT THIS BUILD IS -- a constant, not a preference.

     There was a picker in the composer for a while and it was the wrong shape
     for this ecosystem: QA, Talent and Sales are separate deployments, linked
     out from the tab strip, so a conversation started HERE belongs to Knowledge
     by construction and choosing was a decision nobody had to make.

     The field survives the picker because the LIST spans the ecosystem: a
     thread held in the QA app appears here carrying its own label, which is the
     whole reason the subtitle exists. What changed is that this page reads that
     field rather than writing anything but its own name into it. */
  const PAGE_AGENT = DEFAULT_AGENT;

  function startSession(question) {
    const key = 'sess-' + (++sessSeq);
    SESSIONS[key] = { title: sessTitle(question), at: iso(TODAY), state: snapshot(), agent: PAGE_AGENT };
    THREADS[key] = [];
    touchThread(key);
    return key;
  }

  /* THE SESSION FOLLOWS YOU. Ask something, narrow the surface, ask again —
     coming back should land where the conversation ENDED rather than where it
     started, because that is the state the last answer is about. */
  function stampSession() {
    const sess = SESSIONS[threadKey()];
    if (sess) sess.state = snapshot();
  }

  /* What the search box holds. Deliberately NOT URL state: it narrows a list
     of conversations rather than the surface, and a pasted link carrying
     somebody's half-typed search would restore a filtered column nobody asked
     for. */
  let CHAT_Q = '';
  /* Which row has its menu open, and which is being renamed. Both are view
     state, not conversation state, so neither goes in the URL or the store —
     the same reasoning that keeps CHAT_Q out of both. */
  let CHAT_MENU = '';
  let CHAT_EDIT = '';
  const isPinned = (k) => !!(SESSIONS[k] && SESSIONS[k].pinned);

  /* What a turn SAYS, as words. Turns here hold rendered HTML rather than
     Sales' plain text, so a raw substring search would match tag names, class
     names and every id inside an answer — looking for "article" would hit
     `data-open-doc="article-refund"` in a conversation that never mentions
     one. Stripped to text, and cached except on live turns, whose text is a
     function of a model that moves. */
  function turnText(t) {
    const live = typeof t.html === 'function';
    if (!live && t._text != null) return t._text;
    let raw;
    if (t.who === 'memory') raw = (t.cue.lines || []).map((l) => l.join(' ')).join(' ');
    else raw = live ? t.html() : t.html;
    const box = document.createElement('div');
    box.innerHTML = String(raw == null ? '' : raw);
    const out = (box.textContent || '').replace(/\s+/g, ' ').trim();
    if (!live) t._text = out;
    return out;
  }

  /* The three openers. Rendered rather than written into the markup: static
     chips could only ever be hidden, and a thread you switch away from and
     come back to empty has to show them again. */
  const OPENERS = [
    'Can EU customers get a refund after activating?',
    'What does the corpus say about data residency?',
    'Which articles contradict each other on refunds?',
  ];
  const openersHtml = () =>
    '<div class="overlay-suggestions" id="overlaySuggestions">' +
    OPENERS.map((q) => `<button class="overlay-sugg-chip">${esc(q)}</button>`).join('') +
    '</div>';

  const memoryHtml = (cue) =>
    `<div class="mem-head">${ICO.clock.replace('<svg', '<svg width="11" height="11"')}Carried from an earlier thread
       <span class="mem-age">${esc(cue.age)}</span></div>
     <div class="mem-thread">${cue.lines.map((l) =>
       `<div class="mem-line"><span class="mem-who">${esc(l[0])}</span><span class="mem-what">${esc(l[1])}</span></div>`).join('')}</div>
     <div class="mem-foot"><button class="btn btn-ghost btn-sm" data-mem-drop>Answer without it</button></div>`;

  /* ══ AN ANSWER'S OWN CONTROLS ══════════════════════════════════════════
     Rendered inside `turnEl`, so the live append and the rebuild produce the
     same thing — the rule the whole conversation store depends on.

     The thinking placeholder is an assistant turn too, and it must not carry
     these. Rather than branch on the html string, the row is hidden by CSS
     while `.ai-thinking` is inside the bubble; it reappears by itself when
     the answer swaps in, with no second render.

     `Sources` is absent when there is nothing to show. An answer standing on
     nothing says so in its prose, and a button that opens an empty drawer
     would contradict it. */
  function msgActs(turn) {
    const q = turn.q || '';
    const ico = (k, size) => ICO[k].replace('<svg', `<svg width="${size || 13}" height="${size || 13}"`);
    const srcCount = q ? answerIds(q).length : 0;
    return `<div class="msg-acts">
      <button class="msg-act" type="button" data-msg-copy title="Copy the answer">${ico('copy')}<span>Copy</span></button>
      ${q ? `<button class="msg-act" type="button" data-msg-retry title="Ask it again">${ico('refresh')}<span>Retry</span></button>` : ''}
      ${srcCount ? `<button class="msg-act" type="button" data-msg-src aria-expanded="false" title="What this stands on">${ico('doc')}<span>${srcCount} source${srcCount === 1 ? '' : 's'}</span></button>` : ''}
      <span class="msg-acts-end">
        <button class="msg-act is-rate" type="button" data-msg-rate="up" aria-pressed="false" title="Useful">${ico('thumbUp', 12)}</button>
        <button class="msg-act is-rate" type="button" data-msg-rate="down" aria-pressed="false" title="Not useful">${ico('thumbDown', 12)}</button>
      </span>
    </div>`;
  }

  /* ══ WHAT TO ASK NEXT ═══════════════════════════════════════════════════
     Two rules, and the second is the one that makes it useful. Never offer
     the question just asked; and prefer a DIFFERENT KIND of question — the
     corpus answers computed questions (how many, what changed, what is stale)
     and written ones (refunds, residency, contradictions), and having just had
     one kind, the next useful move is usually the other. Offering three more
     of what you just asked is a carousel, not a suggestion.

     Every one of these is in the set that was checked against the answer
     engine and came back grounded. */
  const FOLLOW_COMPUTED = [
    'Which documents are out of date?',
    'What changed recently?',
    'Which documents does nobody use?',
    'Which sources have stopped syncing?',
    'How many documents do we have?'
  ];
  const FOLLOW_WRITTEN = [
    'Can EU customers get a refund after activating?',
    'What does the corpus say about data residency?',
    'Which articles contradict each other on refunds?'
  ];
  function followUps(q) {
    const asked = String(q || '').trim().toLowerCase();
    const wasComputed = !!questionShape(q);
    const near = wasComputed ? FOLLOW_WRITTEN : FOLLOW_COMPUTED;
    const far = wasComputed ? FOLLOW_COMPUTED : FOLLOW_WRITTEN;
    return near.concat(far).filter((x) => x.toLowerCase() !== asked).slice(0, 3);
  }
  /* A greeting carries its own suggestions, chosen from this person's open
     work. A second row of generic ones underneath would be the same offer
     made worse. */
  const followUpsHtml = (q) => GREETING.test(q) ? '' :
    `<div class="msg-follow">${followUps(q)
      .map((x, i) => `<button class="overlay-sugg-chip" type="button" style="--i:${i}">${esc(x)}</button>`)
      .join('')}</div>`;

  /* One turn, one element. Both the live append and the rebuild go through
     here, so a restored conversation is the one you left rather than a second
     rendering of it that drifts. */
  function turnEl(turn, entering) {
    if (turn.who === 'memory') {
      const el = document.createElement('div');
      el.className = 'memory-panel' + (entering ? ' k-enter' : '');
      el.innerHTML = memoryHtml(turn.cue);
      return el;
    }
    const wrap = document.createElement('div');
    const isUser = turn.who === 'user';
    const live = typeof turn.html === 'function';
    /* WHILE IT IS THINKING THERE IS NOTHING TO PUT IN A BUBBLE. A bordered
       box wrapped around a loading state draws a container for content that
       does not exist yet, and the avatar names a speaker who has not said
       anything. Both arrive with the first words instead — as a class change
       on an element that is already there, so nothing is re-rendered and the
       stream is not interrupted to build a frame around it. */
    wrap.className = 'chat-msg ' + (isUser ? 'user' : 'aimy') + (turn.thinking ? ' is-thinking' : '');
    /* THE QUESTION TRAVELS WITH THE ELEMENT. Everything an answer's own
       controls need — its sources, a retry — is derived from the question,
       and an element cannot reach back into the turns array to find it
       without an index that changes the moment a thread is rebuilt. */
    if (turn.q) wrap.dataset.q = turn.q;
    wrap.innerHTML =
      (isUser
        ? `<div class="msg-avatar">${esc(USER.initials)}</div>`
        : '<div class="msg-avatar aimy-av"><svg width="15" height="17" viewBox="0 0 18 20"><use href="#aimy-logo-small"/></svg></div>') +
      `<div class="msg-bubble"${turn.id ? ` id="${turn.id}"` : ''}${live ? ' data-live="1"' : ''}>${live ? turn.html() : turn.html}</div>` +
      (isUser ? '' : msgActs(turn));
    /* Re-attached on every build, not only the first, or `repaint()` would stop
       finding the closure the moment a thread was rebuilt. */
    if (live) { const b = wrap.querySelector('.msg-bubble'); if (b) b._live = turn.html; }
    return wrap;
  }

  /* The thread pane, rebuilt from the thread that is current. Called when the
     canvas opens and when you switch conversations — appends still go through
     `canvas.push`, which is cheaper and keeps the scroll behaviour it argues
     for. */
  function paintThread() {
    const th = $('#overlayThread');
    if (!th) return;
    const turns = thread$();
    th.innerHTML = turns.length ? '' : openersHtml();
    turns.forEach((t) => th.appendChild(turnEl(t)));
    th.scrollTop = th.scrollHeight;
    canvas.syncEdge();
    paintChats();
    syncTitle();
  }

  function paintChats() {
    const host = $('#overlayChats');
    if (!host) return;
    const here = threadKey();
    /* A THREAD YOU CANNOT FIND MAY AS WELL NOT HAVE PERSISTED — and a title
       taken from the first question is a poor handle on the twentieth. So it
       searches the TURNS as well: the word you remember is usually one from
       inside the conversation rather than from whatever you opened with. */
    const q = CHAT_Q.trim().toLowerCase();
    const hits = (key) => {
      if (!q) return true;
      if (threadName(key).toLowerCase().indexOf(q) > -1) return true;
      return (THREADS[key] || []).some((t) => turnText(t).toLowerCase().indexOf(q) > -1);
    };

    /* What is in the list: everything with something in it, plus whatever is
       open now — an empty thread you are standing in is still where the next
       thing goes, and hiding it until it has content would make the column
       change shape as you talk. */
    const keys = new Set();
    Object.keys(THREADS).forEach((k) => { if ((THREADS[k] || []).length) keys.add(k); });
    Object.keys(SESSIONS).forEach((k) => keys.add(k));
    if ((THREADS.surface && THREADS.surface.length) || here === 'surface') keys.add('surface');
    keys.add(here);
    /* Most recently SPOKEN IN first — not most recently opened, so the order
       holds still while you move between conversations. A seeded one that has
       never been added to keeps its own age and sorts below anything said this
       visit. */
    const at = (k) => THREAD_AT[k] || (SESSIONS[k] ? -1 : -2);
    /* Pinned first, then recency. Two keys rather than a separate list,
       because a pinned conversation is still a conversation and still sorts
       against the others inside its own band. */
    const recent = Array.from(keys).sort((a, b) =>
      (isPinned(b) ? 1 : 0) - (isPinned(a) ? 1 : 0) || at(b) - at(a));

    /* TWO LINES, AND THE SECOND IS WHO ANSWERED. `surface` is the one thread
       nobody started, so it names no agent — labelling it would claim an
       author for a conversation that is really the page itself. */
    /* A WRAPPER, because the menu control cannot live inside the row. The row
       is a <button> and a button inside a button is invalid markup that
       browsers silently reparent — the affordance would end up outside the
       row it belongs to. The wrapper makes them siblings.

       `surface` gets no menu: it is the page's own thread, not a conversation
       somebody started, so there is nothing to rename, pin or delete. */
    const rowMenu = (key) => `<div class="ov-chat-menu" role="menu">
        <button class="ov-chat-mi" type="button" role="menuitem" data-chat-rename="${esc(key)}">${ICO.pen}Rename</button>
        <button class="ov-chat-mi" type="button" role="menuitem" data-chat-pin="${esc(key)}">${ICO.pin}${isPinned(key) ? 'Unpin' : 'Pin to top'}</button>
        <button class="ov-chat-mi" type="button" role="menuitem" data-chat-share="${esc(key)}">${ICO.share}Copy link</button>
        <button class="ov-chat-mi is-danger" type="button" role="menuitem" data-chat-del="${esc(key)}">${ICO.trash}Delete</button>
      </div>`;

    const rowConfirm = (key) => `<div class="ov-chat-menu" role="menu">
        <div class="ov-chat-mq">Delete this conversation?</div>
        <button class="ov-chat-mi" type="button" data-chat-menu="">Keep it</button>
        <button class="ov-chat-mi is-danger" type="button" data-chat-del-ok="${esc(key)}">${ICO.trash}Delete</button>
      </div>`;

    const row = (key) => `<div class="ov-chat-row${CHAT_MENU.replace(/^!/, '') === key ? ' is-menu' : ''}">
      ${CHAT_EDIT === key
        ? `<input class="ov-chat-rename" id="chatRename" value="${esc(threadName(key))}"
             data-chat-rename-in="${esc(key)}" spellcheck="false" autocomplete="off" aria-label="Rename conversation" />`
        : `<button class="ov-chat${key === here ? ' is-here' : ''}" type="button"
        data-chat="${esc(key)}" ${key === here ? 'aria-current="true"' : ''}>
        <span class="ov-chat-lines">
          <span class="ov-chat-name">${isPinned(key) ? `<span class="ov-chat-pin" aria-label="Pinned">${ICO.pin.replace('<svg', '<svg width="10" height="10"')}</span>` : ''}${esc(threadName(key))}</span>
          ${SESSIONS[key] ? `<span class="ov-chat-agent">${esc(CHAT_AGENTS[agentOf(key)].label)}</span>` : ''}
        </span>
      </button>`}
      ${SESSIONS[key] && CHAT_EDIT !== key
        ? `<button class="ov-chat-more" type="button" data-chat-menu="${esc(key)}"
             aria-haspopup="menu" aria-expanded="${CHAT_MENU.replace(/^!/, '') === key ? 'true' : 'false'}"
             aria-label="More for this conversation">${ICO.more.replace('<svg', '<svg width="14" height="14"')}</button>`
        : ''}
      ${CHAT_MENU === key ? rowMenu(key) : CHAT_MENU === '!' + key ? rowConfirm(key) : ''}
    </div>`;

    /* WHAT YOU HAVE OPEN IS NEVER FILTERED OUT. A search that could hide the
       conversation in front of you would be answering a different question
       from the one being asked. */
    const found = recent.filter((k) => k === here || hits(k));
    /* … WHICH IS WHY THE MISS IS COUNTED WITHOUT IT. `found` can never be
       empty — the thread you are in is always in it — so keying the empty
       state off `found.length` left a search that matched nothing looking
       exactly like a search that matched one thing, with no line saying so.
       What the reader wants to know is whether anything ELSE matched. */
    const others = found.filter((k) => k !== here);

    host.innerHTML = `
      <button class="btn btn-brand btn-sm ov-chat-new" type="button" data-newchat>${ICO.plus}New conversation</button>
      <label class="ov-chat-find">
        <span class="k-sr">Find a conversation</span>
        <input class="ov-chat-input" type="search" id="chatFind" placeholder="Find a conversation…"
          spellcheck="false" autocomplete="off" value="${esc(CHAT_Q)}" />
      </label>
      ${q
        ? (found.length ? `<div class="ov-chat-group"><div class="ov-chat-cap">Found</div>${found.map(row).join('')}</div>` : '')
        : chatGroups(found).map((g) => `<div class="ov-chat-group">
            <div class="ov-chat-cap">${esc(g.cap)}</div>
            ${g.keys.map(row).join('')}
          </div>`).join('')}
      ${q && !others.length
        ? `<p class="ov-chat-none">Nothing else matches “${esc(CHAT_Q)}” — in a title or in anything said.</p>`
        : ''}`;
    /* The caret goes back where it was: repainting the column on every
       keystroke would otherwise send it to the end of the word. */
    const box = $('#chatFind');
    if (box && document.activeElement !== box && CHAT_Q) { box.focus(); box.setSelectionRange(CHAT_Q.length, CHAT_Q.length); }
  }

  /* ═══════════════════════════════════════════════
     THE STORE — what was said, not what is shown

     README declared, twice, that conversations do not survive a reload and
     that nothing in the build pretends otherwise. This closes that, and both
     passages are rewritten in the same change rather than left standing.

     ── The one hard part ──
     A turn's `html` may be a FUNCTION. Live answers are stored as closures and
     re-run by `canvas.repaint()`, which is how an answer citing "5 sources, 2
     failing" corrects itself after you fix a source. Functions do not
     serialize, and `JSON.stringify` drops them silently — the failure would be
     a thread that restores looking perfect and is quietly dead.

     So a live turn persists its QUESTION and is rehydrated as a fresh closure
     over `answerFor`. What comes back is not a photograph of the answer; it is
     the answer, recomputed against the corpus as it stands now.

     ── What it deliberately is not ──
     `knowledge.js` states the doctrine for this: "None of this is a second
     source of truth. The URL still decides everything on screen." The store
     holds what was SAID. It never holds what is displayed, never restores a
     scroll position, and never decides which conversation is open — `?chat=`
     still does that, alone.
  ═══════════════════════════════════════════════ */
  const CHAT_STORE = 'aimy-k-chats';
  /* Enough for months of real use; small enough that a quota error is a bug
     rather than an inevitability. Oldest go first. */
  const STORE_MAX = 40;
  /* A seed you deleted must STAY deleted. `seedSessions()` runs on every boot
     and would otherwise put it back, which reads as the delete having silently
     failed. */
  const DELETED = new Set();

  const packTurn = (t) =>
    t.who === 'memory'
      ? { who: 'memory', cue: t.cue }
      : { who: t.who, q: t.q || '', live: typeof t.html === 'function',
          html: typeof t.html === 'function' ? t.html() : t.html };

  const unpackTurn = (t) => {
    if (t.who === 'memory') return { who: 'memory', cue: t.cue };
    /* The rehydration. Without the `q` guard a live turn saved before the
       question was recorded would come back as a closure over nothing. */
    if (t.live && t.q) return { who: t.who, q: t.q, html: () => answerFor(t.q, readURL()) };
    const out = { who: t.who, html: t.html };
    if (t.q) out.q = t.q;
    return out;
  };

  function saveChats() {
    try {
      const keys = Object.keys(SESSIONS)
        .sort((a, b) => (THREAD_AT[b] || 0) - (THREAD_AT[a] || 0))
        .slice(0, STORE_MAX);
      const out = { v: 1, deleted: [...DELETED], sessions: {}, threads: {}, at: {} };
      keys.forEach((k) => {
        out.sessions[k] = SESSIONS[k];
        out.at[k] = THREAD_AT[k] || 0;
        out.threads[k] = (THREADS[k] || []).map(packTurn);
      });
      localStorage.setItem(CHAT_STORE, JSON.stringify(out));
    } catch (e) {
      /* A locked-down browser throws on access rather than returning null, and
         a full quota throws on write. Neither is worth taking the page down
         for: the conversation still works, it just will not be there tomorrow. */
    }
  }

  function loadChats() {
    let raw = null;
    try { raw = localStorage.getItem(CHAT_STORE); } catch (e) { return; }
    if (!raw) return;
    let d;
    try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d || d.v !== 1) return;

    (d.deleted || []).forEach((k) => {
      DELETED.add(k);
      delete SESSIONS[k]; delete THREADS[k]; delete THREAD_AT[k];
    });

    Object.keys(d.sessions || {}).forEach((k) => {
      if (DELETED.has(k)) return;
      SESSIONS[k] = d.sessions[k];
      THREAD_AT[k] = (d.at || {})[k] || 0;
      THREADS[k] = ((d.threads || {})[k] || []).map(unpackTurn);
      /* The counters have to clear everything restored, or the next new
         conversation is minted onto a key that already exists and silently
         takes over an old thread. */
      const m = String(k).match(/^sess-(\d+)$/);
      if (m) sessSeq = Math.max(sessSeq, Number(m[1]));
      threadSeq = Math.max(threadSeq, THREAD_AT[k] || 0);
    });
  }

  /* ══ WHEN, NOT JUST IN WHAT ORDER ══════════════════════════════════════
     One undifferentiated "Recent" heading told you the order and nothing
     else. These bands say roughly when, which is how people actually look for
     a conversation they had — not "the fourth one down" but "some time last
     week".

     Measured against TODAY, the corpus's fixed date, NOT against the wall
     clock. Every document in this build is dated relative to it, and a list
     that grouped by real time would drift out of step with everything it
     sits beside.

     Pinned comes out as its own band and keeps its place at the top, because
     a pin is a statement that this one is not to be found by date.

     `surface` has no session and therefore no date. It belongs with today's
     — it is the thread you are in right now. */
  function chatGroups(keys) {
    const band = (k) => {
      if (isPinned(k)) return 0;
      if (!SESSIONS[k]) return 1;
      const d = offsetOf(SESSIONS[k].at);
      return d <= 0 ? 1 : d === 1 ? 2 : d < 7 ? 3 : d < 30 ? 4 : 5;
    };
    const CAP = ['Pinned', 'Today', 'Yesterday', 'Earlier this week', 'This month', 'Older'];
    /* BUCKETED, not walked. Walking the sorted list and breaking on a change
       of band looks equivalent and is not: the list is ordered by recency, and
       a band is a range of dates, so one band can be entered, left and entered
       again — which printed "Earlier this week" twice with another heading
       wedged between the two halves. Buckets can only produce each heading
       once, and the keys arrive already sorted so the order inside each is the
       order the sort chose. */
    const buckets = CAP.map(() => []);
    keys.forEach((k) => buckets[band(k)].push(k));
    return buckets
      .map((ks, i) => ({ cap: CAP[i], keys: ks }))
      .filter((g) => g.keys.length);
  }

  /* ══ CONVERSATIONS THAT ALREADY EXIST ══════════════════════════════════

     The column could only ever show what you had asked in this tab, so it
     opened empty on every load — and the one thing it exists for, going back
     to a conversation, could be neither demonstrated nor used. A workbench
     somebody has been working in has a history behind it; starting from none
     is the state a product is in for its first five minutes and never again.

     EACH ONE CARRIES ITS SURFACE, and every `state` is built by the product's
     own serializer from objects the corpus actually holds — never written out
     by hand. A fixture cannot then outlive the document it names, drift from
     the URL format, or land you on a filter that matches nothing.

     The five between them cover what a restore has to put back: a filter set,
     an open document, a view and its grouping, a query with a date window, and
     a flag. If switching conversations only restored some of that, one of
     these would show it.
  ═══════════════════════════════════════════════════════════════════════ */
  function seedSessions() {
    /* Through `serialize`, so a seeded surface is byte-identical to one the
       address bar would produce for the same state. */
    const stateOf = (over) => {
      const st = parseParams(new URLSearchParams(''));
      Object.keys(over).forEach((k) => { st[k] = over[k]; });
      return serialize(st);
    };
    const seed = (key, title, ago, state, turns, agent) => {
      SESSIONS[key] = { title: title, at: iso(new Date(TODAY.getTime() - ago * 864e5)), state: state,
                        agent: agent || DEFAULT_AGENT };
      THREADS[key] = turns;
      /* Ordered by their own age, and all of them below anything touched this
         visit — `threadSeq` only ever counts up from 1. */
      THREAD_AT[key] = -ago;
    };
    const said = (you, aimy) => [{ who: 'user', html: esc(you) }, { who: 'aimy', html: esc(aimy) }];
    const one = (fn) => LIVE.filter(fn)[0];

    /* ── A filter set, and nothing open ── */
    const clash = one((o) => o.status === 'conflicting');
    if (clash) {
      seed('s-seed-1', 'Which articles contradict each other on refunds?', 2,
        stateOf({ type: ['article'], status: ['conflicting'] }),
        said('Which articles contradict each other on refunds?',
             'Two, and they are the two support reads most. The EU policy gives a 30-day '
             + 'window provided the item has not been activated; the Returns FAQ says '
             + 'activation ends eligibility outright and sends the rest to warranty. Neither '
             + 'is marked as the one to follow, so whoever answers first decides.'));
    }

    /* ── A document open. The refund topic is the one the canvas has a real
          answer for, so a follow-up here demonstrates rather than apologises. ── */
    const refund = byId('article-refund');
    if (refund && !refund.arch) {
      seed('s-seed-2', 'Can EU customers get a refund after activating?', 5,
        stateOf({ doc: refund.id }),
        said('Can EU customers get a refund after activating?',
             'Not under this article — the window is conditional on the item not having '
             + 'been activated. The Returns FAQ agrees on that much and then disagrees about '
             + 'what happens next, so treat the post-activation clause as contested rather '
             + 'than settled until the policy owner rules on it.'));
    }

    /* ── A view and the edge it walks ── */
    seed('s-seed-3', 'Where is the corpus thinnest by client?', 9,
      stateOf({ view: 'tree', by: 'client' }),
      said('Where is the corpus thinnest by client?',
           'Grouped by client, most of what we hold is not about a client at all — it is '
           + 'policy and product material that applies to everyone. The named clients each '
           + 'have a handful of tickets and little else, so anything you want to say about '
           + 'one of them comes from the general material rather than from their own.'), 'qa');

    /* ── A query and a date window ── */
    const residency = byId('article-residency');
    if (residency && !residency.arch) {
      seed('s-seed-4', 'What does the corpus say about data residency?', 14,
        stateOf({ q: 'residency', updated: '90d' }),
        said('What does the corpus say about data residency?',
             'The article is the answer and it is the one carrying a recommendation: it '
             + 'covers EU and APAC across all tiers. The marketing post says the same thing '
             + 'in looser words and is read forty times as often, which is the risk — the '
             + 'version most people see is not the version that is maintained.'));
    }

    /* ── TWO THREADS FROM OTHER CONSOLES ──
          The conversation list spans the ecosystem: only AiMY has a gate, but
          every console carries the canvas, and a thread held in one of them
          arrives here under its own label. Without these the subtitle is a
          column that says the same word on every row. */
    seed('s-seed-6', 'Which accounts renew this quarter?', 4,
      stateOf({}),
      said('Which accounts renew this quarter?',
           'Six, and two of them are the ones to watch: Upland renews across fourteen products '
           + 'on a single date, and Asteris renews forty days later on a contract that was '
           + 'amended twice. The rest are single-product and roll automatically.'), 'sales');

    seed('s-seed-7', 'What does onboarding cover in week one?', 11,
      stateOf({}),
      said('What does onboarding cover in week one?',
           'Access, the handbook, and one shadowed call per day. The written plan stops at day '
           + 'three — everything after that is described as "with your lead", which is why two '
           + 'people this quarter reported week one as the part that felt improvised.'), 'talent');

    /* ── A flag, and what it is for ── */
    const mine = one((o) => responsible(o) === USER.owner && o.status !== 'current');
    if (mine) {
      seed('s-seed-5', 'What of mine still needs a decision?', 21,
        stateOf({ mine: true }),
        said('What of mine still needs a decision?',
             'Everything filed to you that is not simply current. Some of it is waiting on '
             + 'an upstream that moved and some on a judgement only you can make, and the '
             + 'surface does not distinguish them — the status says what is true of the '
             + 'document, not what is being asked of you.'), 'qa');
    }
  }

  /* ═══════════════════════════════════════════════
     THE CANVAS

     Kept, and narrowed. It opens for open-ended questions and generative work.
     It does not open to filter, to open a known document, or to write —
     those three now complete in place, which is what the doctrine asks for and
     what the previous build failed.
  ═══════════════════════════════════════════════ */
  const canvas = {
    overlay: null, thread: null, input: null, floatBar: null, open: false,

    init() {
      this.overlay = $('#aimyOverlay');
      /* ══ THE GATE HAS NO OVERLAY ═══════════════════════════════════════
         On the gate the thread IS the page: there is nothing to open, nothing
         to close, and no backdrop to click off. That is the only difference,
         and it is why `ask`, `push`, `paintThread` and `paintChats` are the
         same code on both surfaces — they were always addressing elements by
         id, never reaching through a container. Binding from `document` when
         the overlay is absent is the whole of the port.

         `open: true` from the start, because the one thing `open` gates is the
         rebuild-on-open transition, and a surface that is always up has
         already had it. */
      this.inline = !this.overlay;
      this.thread = $('#overlayThread', this.overlay || document);
      this.input  = $('#overlayInput', this.overlay || document);
      /* Before the inline early-return below, or the gate — the surface with
         the composer people actually use — is the one that does not get it. */
      this.mountClip();
      if (this.inline) {
        this.open = true;
        if (this.thread) {
          this.thread.addEventListener('scroll', () => this.queueEdge(), { passive: true });
          this.syncEdge();
        }
        return;
      }
      this.floatBar = $('#aimyFloatBar');

      const opener = $('#canvasOpen');
      if (opener) opener.addEventListener('click', () => this.show());

      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        /* Topmost first. A modal over the rail is the deepest thing on the
           page and the only one holding an unsaved edit, so it goes before
           anything underneath it can take the key. */
        if (($('#commitHost') || {}).innerHTML && $('[data-xm-save]')) { closeXModal(); return; }
        /* The bell panel is a dropdown off the chrome, so it is
           always the shallowest thing open and always the first to go. The
           account menu is the same kind of thing on the same row, so it sits
           here rather than owning a listener of its own. */
        if (bell.open) { bell.close(true); return; }
        if (userMenu.open) { userMenu.close(true); return; }
        /* And the product menu is the third of the same kind of thing on the
           same row — a dropdown off the masthead. It joins its two neighbours
           here rather than growing a listener of its own. */
        if (prodMenu.open) { prodMenu.close(true); return; }
        if (peekStack.length) { closePeek(); return; }
        if (calOpen) { calOpen = null; calPick = null; renderFilters(readURL()); return; }
        if (facetOpen) {
          const key = facetOpen;
          facetOpen = null; facetQuery = '';
          renderFilters(readURL());
          const btn = $(`[data-facet-key="${key}"] .k-facet-btn`);
          if (btn) btn.focus();
          return;
        }
        if (openMulti) { openMulti = null; renderDoc(readURL()); return; }
        if (proto.open) { proto.toggle(false); return; }
        if (this.open) this.close();
      });
      /* Click-off to close. The overlay used to BE the backdrop; the column
         and the thread now cover it entirely, so the empty space either side
         of the thread belongs to `.overlay-main` and the identity check alone
         would never match again. Both count as the backdrop. */
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay || e.target.classList.contains('overlay-main')) this.close();
      });
      if (this.thread) {
        this.thread.addEventListener('scroll', () => this.queueEdge(), { passive: true });
        this.syncEdge();
      }
    },

    /* ══ ATTACHMENTS ═══════════════════════════════════════════════════
       Injected into the composer rather than written into two shells, because
       the bar is identical on both and a second copy is a second thing to keep
       in step.

       WHAT IT DOES AND DOES NOT DO: it accepts a file, names it, and lets you
       take it back off. It does not upload — there is nowhere to upload to —
       and it says so on the chip rather than failing later or, worse, quietly
       pretending. The seam is exactly where a real upload would go. */
    mountClip() {
      const bar = $('.overlay-input-bar', this.overlay || document);
      const send = $('.overlay-send', this.overlay || document);
      if (!bar || !send || $('#clipBtn')) return;
      send.insertAdjacentHTML('beforebegin',
        `<button class="clip-btn" id="clipBtn" type="button" aria-label="Attach a file" title="Attach a file">
           ${ICO.clip.replace('<svg', '<svg width="15" height="15"')}
         </button>
         <input class="clip-in" id="clipIn" type="file" hidden />`);
    },

    show(basis) {
      if (!this.inline && !this.open) {
        /* Opening the canvas is reading it, so the count goes. */
        bumpCanvasBadge(0);
        this.overlay.classList.add('open');
        if (this.floatBar) this.floatBar.classList.add('hidden');
        this.open = true;
        /* The thread is built from the conversation the URL names, not left
           as whatever was last appended — reopening on `?chat=` has to land
           in that conversation and not in the previous one. Only on the open
           transition: an `ask()` mid-conversation appends. */
        paintThread();
        setTimeout(() => { if (this.input) this.input.focus(); }, 220);
      }
      const tags = $('#overlayContextTags');
      if (tags && basis && basis.length) {
        tags.innerHTML = basis.map((b) => `<span class="overlay-context-tag">${esc(b)}</span>`).join('');
      }
    },

    close(opts) {
      /* Nothing to close. Escape on the gate must not dismiss the surface the
         page is made of. */
      if (this.inline) return;
      this.overlay.classList.remove('open');
      if (this.floatBar) this.floatBar.classList.remove('hidden');
      this.open = false;
      /* Quiet when something else is taking over the screen, so the focus does
         not get pulled back out of it. */
      if (opts && opts.quiet) return;
      const fb = $('#floatInput');
      setTimeout(() => { if (fb) fb.focus(); }, 160);
    },

    syncEdge() {
      const th = this.thread;
      if (!th) return;
      th.classList.toggle('is-at-end', th.scrollHeight - th.clientHeight - th.scrollTop < 4);
      /* ══ AND THE CHROME STEPS ASIDE ONCE YOU ARE READING ═══════════════
         The badge and the basis bar are `position: absolute` over the thread —
         which is right at the top of a conversation, where they say what this
         surface is and what it answered from, and wrong four messages down,
         where they are two labels parked on top of somebody's reading.

         So they belong to the TOP of the thread rather than to the canvas: at
         rest they are there, and the first scroll takes them away.

         THE CLASS GOES ON THE OVERLAY, not on the thread. Both elements come
         BEFORE `.overlay-thread` in the markup and a sibling combinator only
         reaches forward, so a class on the thread cannot address them. The
         overlay is the nearest ancestor that can.

         8px rather than 0, so a rubber-band or a one-pixel settle after a
         repaint does not flicker them. Measured here rather than stored: this
         function is already three layout reads and a class write, and this
         adds neither. */
      if (this.overlay) this.overlay.classList.toggle('is-scrolled', th.scrollTop > 8);
    },

    /* The scroll path goes through here instead. syncEdge is three layout reads
       followed by a class write, and the write invalidates style, so the next
       event's read forced a fresh layout - once per event, on the most scrolled
       surface in the product. Coalesced, a scroll burst measures once a frame.

       Callers that need the answer now still call syncEdge directly; this only
       fronts the listener. */
    queueEdge() {
      if (this._edgeQ) return;
      this._edgeQ = requestAnimationFrame(() => { this._edgeQ = 0; this.syncEdge(); });
    },

    reveal(el) {
      const th = this.thread;
      if (!th || !el) { this.syncEdge(); return; }
      const msg = (el.closest && el.closest('.chat-msg')) || el;
      /* Every read first, then the write. `msg` was measured twice for one
         value, and the second measurement sat on the right-hand side of a `+=`
         that writes scrollTop - so it forced a layout in the middle of its own
         statement, on every message appended during a stream. */
      const sh = th.scrollHeight, ch = th.clientHeight;
      if (sh <= ch) return;
      const m = msg.getBoundingClientRect();
      const t = th.getBoundingClientRect();
      if (m.height > ch * 0.7) th.scrollTop += m.top - t.top - 12;
      else th.scrollTop = sh;
      this.syncEdge();
    },

    memory(cue) {
      /* Once per THREAD, not once per page load. One flag on the canvas meant
         the panel fired for the first conversation and never again for any
         other — and vanished from the first the moment you came back to it. */
      const key = threadKey();
      if (!cue || THREAD_MEM[key] || !this.thread) return;
      THREAD_MEM[key] = true;
      const turn = { who: 'memory', cue: cue };
      thread$().push(turn);
      const el = turnEl(turn, true);
      this.thread.appendChild(el);
      this.reveal(el);
      paintChats();
    },

    stage(text, basis) {
      this.show(basis);
      if (!this.input) return;
      this.input.value = text;
      this.input.focus();
      this.input.select();
      const bar = $('.overlay-input-bar', this.overlay);
      if (bar) bar.classList.add('is-staged');
    },

    /* opt.autoSurface — put the answer's sources on the workbench as the answer
       resolves, so closing the canvas lands on where the conversation got to.
       Reversal is explicit rather than promotion: the toast's Undo restores the
       filter state exactly, because that state is only ever a URL. */
    /* `answer` may be a string or a FUNCTION returning one. A function makes the
       answer LIVE: the message keeps it, and canvas.repaint() re-runs it after
       anything changes the model. That is what stopped the settings from being
       dead — Sync now, Reconnect, schedule, retention and grounding all wrote
       correctly and left the conversation showing the old numbers. */
    ask(text, basis, answer, opt) {
      /* ══ EVERY QUESTION BELONGS TO A CONVERSATION ════════════════════
         Asked outside one, a question starts one, titled with itself — the
         same rule every thread list uses and the only one that does not ask
         a person to name things before they have said anything.

         `replace`, not push: starting a conversation is not a place in the
         history to go Back to, it is the same place with a thread attached.

         Here rather than in `submit`, because `submit` is one of six ways a
         question reaches the canvas — a citation's "what supports this", a
         comparison, a keep-or-drop and the bell's "what should I do first"
         all arrive straight here, and each of them names a thread perfectly
         well. */
      const open = SESSIONS[threadKey()];
      let started = false;
      if (!open) {
        const key = startSession(text);
        restoring = true;
        patch({ chat: key }, { replace: true });
        restoring = false;
        started = true;
      } else if (open.blank) {
        /* The blank one the column started. It has been waiting for
           something to name it. */
        open.title = sessTitle(text);
        open.blank = false;
        open.state = snapshot();
      }
      this.show(basis);
      /* `show` only rebuilds on the OPEN transition, so a conversation begun
         while the canvas was already up would otherwise append its first turn
         underneath the previous conversation's thread. */
      if (started) paintThread();
      const bar = $('.overlay-input-bar', this.overlay);
      if (bar) bar.classList.remove('is-staged');
      if (/refund|activat|contradict/i.test(text)) {
        this.memory({ age: 'Yesterday, 16:40', lines: [
          ['You', 'asked which refund source support should follow'],
          ['AiMY', 'flagged the two verified objects as contradictory'],
          ['You', 'left it open pending the policy owner']
        ]});
      }
      this.push('user', esc(text));
      const id = 'a' + Date.now();
      const turn = this.push('aimy',
        '<span class="ai-thinking"><canvas class="think-mark" width="26" height="26" aria-hidden="true"></canvas>' +
        '<span class="ai-thinking-label">Searching the corpus…</span></span>', id);
      /* Both, and both are needed. The FLAG is what a rebuild reads, so a
         thread repainted mid-think comes back bare rather than framed. The
         CLASS is what this render needs, because `push` built the element
         before this line could set the flag — the same ordering that catches
         `turn.q` a few lines below. */
      if (turn) turn.thinking = true;
      const ph = document.getElementById(id);
      const phMsg = ph && ph.closest('.chat-msg');
      if (phMsg) phMsg.classList.add('is-thinking');
      startThinking();
      /* ══ THE TURN REMEMBERS ITS QUESTION ═══════════════════════════════
         `answerFor` returns an opaque HTML string, so nothing downstream can
         ask a finished answer which documents it stood on. `answerIds(q)`
         recomputes that from the QUESTION, and until now the question was
         only on the user turn one position earlier — recoverable by index,
         which is a way of saying not recoverable.

         One field, and it is what lets an answer show its sources, be
         retried, and hand its documents to the Console. */
      if (turn) turn.q = text;
      const land = () => {
        /* THE TURN IS UPDATED BEFORE THE ELEMENT, and whether or not the
           element is still there. Switching conversations mid-answer removes
           the bubble from the DOM, and returning to that conversation rebuilds
           it from the turn — so an early return here would leave the thread
           holding the thinking dots for the rest of the session. */
        /* Assembled BEFORE the element is looked for, so a conversation you
           switched away from still gets the disclosure and the trace. Built
           once and assigned once: two assignments, with the element check
           between them, is how a thread ends up holding a different answer
           from the one on screen. */
        const shaped = armedSkill;
        armedSkill = null;
        const finalHtml = (shaped
          ? `<div class="sk-used">${ICO.skill.replace('<svg', '<svg width="11" height="11"')}Shaped by <b>${esc(shaped.name)}</b></div>`
          : '') + (typeof answer === 'function' ? answer() : answer) + activityLog(text, readURL());
        if (turn) turn.html = finalHtml;

        stopThinking();
        if (turn) turn.thinking = false;
        const el = document.getElementById(id);
        /* The run is over either way. Switching conversations mid-answer takes
           the bubble out of the DOM, and returning early without saying so left
           the beam travelling and the send button stuck on Stop for the rest of
           the session. */
        if (!el) { generating.finish(run); return; }
        /* The bubble and the avatar arrive here, with the first words. */
        const msg = el.closest('.chat-msg');
        if (msg) msg.classList.remove('is-thinking');
        /* A live answer keeps its closure, but the closure alone would drop
           the disclosure and the trace on the next repaint — so it is wrapped
           to rebuild the whole thing rather than just the prose. */
        if (typeof answer === 'function') {
          const wrapLive = () => (shaped
            ? `<div class="sk-used">${ICO.skill.replace('<svg', '<svg width="11" height="11"')}Shaped by <b>${esc(shaped.name)}</b></div>`
            : '') + answer() + activityLog(text, readURL());
          el._live = wrapLive; el.dataset.live = '1';
          if (turn) turn.html = wrapLive;
        }
        typeIn(el, finalHtml, () => generating.finish(run));
        /* After the answer, not with it: the chips are about where to go
           next, and offering them beside a paragraph nobody has read yet is
           asking the question for them. Appended to the MESSAGE, so a rebuild
           of the thread reproduces them from `turn.q` rather than losing them. */
        const wrap = el.closest('.chat-msg');
        if (wrap) {
          /* THE ACTION ROW IS REBUILT HERE, and it has to be. turnEl renders
             it when the turn is first pushed — which is while the turn still
             holds the thinking dots and has not been told its question — so
             the first render has no Retry and no source count. The bubble swap
             above replaces the answer only; this replaces the controls that
             describe it. */
          wrap.dataset.q = text;
          const acts = wrap.querySelector('.msg-acts');
          if (acts) acts.outerHTML = msgActs(turn);
          if (!wrap.querySelector('.msg-follow')) wrap.insertAdjacentHTML('beforeend', followUpsHtml(text));
        }
        this.reveal(el);
        if (opt && opt.autoSurface) {
          const ids = answerIds(text);
          if (ids.length) surfaceIds(ids, 'while you were asking');
        }
        /* ══ SAVE AGAIN, NOW THAT THE TURN IS FINISHED ═══════════════════
           `push` saves, and push happens while this turn still holds the
           thinking dots and has not yet been told its question. Saving only
           there persisted every last answer as "Searching the corpus…" and
           dropped the `q` that the sources panel and retry depend on. The
           turn is only complete here. */
        saveChats();
      };

      /* ══ THE WAIT IS A SEQUENCE, NOT A HOLD ═══════════════════════
         Still three seconds, and for the original reason: the mark's cycle is
         2.56s, so under a second shows a fragment of a gesture and cuts it
         off. It is a fixed wait either way — there is no backend to be slow —
         so the number is a reading decision rather than a measurement.

         What changed is that the three seconds now have three moments in them.
         One unchanging caption for that long is a spinner with a word on it:
         it says the machine is busy, says nothing else, and says it for long
         enough that a reader starts wondering whether it is stuck.

         EVERY BEAT IS TRUE OF THIS QUESTION. `answerIds` is the same function
         the sources panel and Retry read, so the count is the real one rather
         than a number picked to look busy — and when nothing matched, the
         caption says that instead of pretending otherwise.

         AIMY_LATENCY owns the pace, so `?latency=instant` collapses all three
         beats and the answer lands synchronously. That is the shape this has
         to take the day a model is actually behind it, and it is better to be
         in that shape now than to discover the branch later. */
      const M = window.AIMY_MOTION;
      /* A HOLDER, FILLED IN AT THE BOTTOM OF THIS FUNCTION.
         The beats cannot be armed here. At `latency=instant` every wait
         collapses to nothing and latency.steps runs all three beats AND `land`
         synchronously, inside the arming call - which would put the entire
         answer, and its call to generating.finish, above the `const run` that
         finish is given. That is a temporal dead zone on a const; and without
         the throw it would be worse, because finishing a run before starting
         it leaves the beam lit with nothing left to turn it off.

         So the run is created first and the beats are armed under it. Nothing
         can cancel in between: cancelling takes a click, and a click cannot
         arrive in the middle of this function. */
      let timer = () => {};

      /* ══ AND IT CAN BE CALLED OFF ═════════════════════════════════
         Three seconds of thinking and then a stream is long enough to change
         your mind in, and until now there was nothing to change it with.

         BOTH PHASES STOP, AND THEY STOP DIFFERENTLY. Before the answer exists
         there is nothing to keep, so the thinking mark is what gets replaced.
         Once it is streaming there IS something — half an answer is still an
         answer, and deleting what somebody has already read is the product
         taking it back — so the note goes underneath it instead.

         The TURN is written and not just the element, because a conversation
         is its turns: an element left ahead of them comes back whole on the
         next repaint, which is the answer you stopped returning by itself. */
      const run = generating.start(() => {
        timer();
        stopStream();
        stopThinking();
        const el = document.getElementById(id);
        const msg = el && el.closest('.chat-msg');
        const kept = (turn && turn.thinking) ? '' : (el ? el.innerHTML : '');
        const html = kept + stoppedNote();
        if (turn) { turn.html = html; turn.thinking = false; }
        if (el) {
          el.innerHTML = html;
          /* A live answer re-runs its closure on every repaint. Stopped, it
             must not: the closure would put back the answer that was called
             off, the first time anything touched the model. */
          el._live = null;
          delete el.dataset.live;
        }
        if (msg) {
          msg.classList.remove('is-thinking');
          /* The acts row was rendered while the turn still held the dots and
             had not been told its question, so it carries no Retry. A stopped
             answer is the one that most needs one. */
          msg.dataset.q = text;
          const acts = msg.querySelector('.msg-acts');
          if (acts) acts.outerHTML = msgActs(turn);
        }
        saveChats();
      });

      /* ══ AND NOW THE WAIT CAN START ════════════════════════════
         Still three seconds, and for the original reason: the mark's cycle is
         2.56s, so under a second shows a fragment of a gesture and cuts it
         off. It is a fixed wait either way — there is no backend to be slow —
         so the number is a reading decision rather than a measurement.

         What changed is that the three seconds now have three moments in them.
         One unchanging caption for that long is a spinner with a word on it:
         it says the machine is busy, says nothing else, and says it for long
         enough that a reader starts wondering whether it is stuck.

         EVERY BEAT IS TRUE OF THIS QUESTION. `answerIds` is the same function
         the sources panel and Retry read, so the count is the real one rather
         than a number picked to look busy — and when nothing matched, the
         caption says that instead of pretending otherwise. */
      if (M) {
        const found = answerIds(text).length;
        const beats = [
          { label: 'Searching the corpus', ms: 1000 },
          { label: found === 1 ? 'Reading 1 document'
                 : found ? 'Reading ' + found + ' documents'
                 : 'Nothing matched yet — widening', ms: 1000 },
          { label: found > 1 ? 'Checking them against each other'
                 : 'Composing the answer', ms: 1000 }
        ];
        timer = M.latency.steps(beats, (label) => {
          /* The bubble is gone when the reader switched conversations
             mid-answer. The beats keep running and `land` still fires, because
             the TURN is what holds the answer — only the caption is missing. */
          const host = document.getElementById(id);
          if (host) swapLabel(host.querySelector('.ai-thinking-label'), label);
        }, land);
      } else {
        const t = setTimeout(land, 3000);
        timer = () => clearTimeout(t);
      }
    },

    /* Appends, and RECORDS. The turn is what a conversation is made of — the
       element is only how it looks right now — so the array is written first
       and the DOM follows from it, through the same `turnEl` a rebuild uses.

       Returns the turn, so `ask` can write its answer back when it resolves. */
    push(who, html, id) {
      if (!this.thread) return null;
      const turns = thread$();
      touchThread();
      /* The openers were the whole content of an empty thread; the first turn
         replaces them rather than landing underneath. */
      if (!turns.length) this.thread.innerHTML = '';
      const turn = { who: who, html: html, id: id };
      turns.push(turn);
      /* THE SESSION FOLLOWS YOU: the surface is re-snapshotted on every turn,
         so coming back lands where the conversation ended rather than where it
         started. */
      stampSession();
      const wrap = turnEl(turn);
      this.thread.appendChild(wrap);
      this.thread.scrollTop = this.thread.scrollHeight;
      this.syncEdge();
      /* The column carries a turn count and an order, and both just moved. */
      paintChats();
      /* The single write path. Every turn on both surfaces arrives here. */
      saveChats();
      return turn;
    },

    /* Re-run every live answer in the thread. Called from render(), so a
       conversation you are looking at is never behind the model it describes.
       What changed inside it is marked, so the eye is taken to the number that
       moved rather than left to find it. */
    repaint() {
      if (!this.thread) return;
      $$('.msg-bubble[data-live]', this.thread).forEach((el) => {
        if (typeof el._live !== 'function') return;
        const before = el.innerHTML;
        const after = el._live();
        if (after === before) return;
        el.innerHTML = after;
        markChanged(el);
      });
    }
  };

  /* ═══════════════════════════════════════════════
     ANSWERS

     Grounded in objects, with inline citations, a source list and a trust
     disclosure — and one new action. `Show these on the surface` writes the
     cited ids into the URL, so the conversation and the page stop being two
     products. That is the mind map's "filter by document ids" node.
  ═══════════════════════════════════════════════ */
  /* ── A citation says what it is citing ──

     Both renderings carried title, source and status and neither said whether
     the thing behind the number was a policy article or one customer's ticket
     — which is exactly the distinction that decides how much weight an answer
     deserves. A resolved ticket records what was decided once, for one
     customer; an article is the policy. Cited side by side they were byte
     identical.

     Same idiom as the card's meta line: icon AND label, never colour. */
  const typeMark = (o) => `<span class="tc-kind">${TYPES[o.t].ico}${esc(TYPES[o.t].label)}</span>`;

  function citeChip(n, id, passage) {
    const o = byId(id);
    return `<span class="cite-wrap"><span class="cite" tabindex="0" role="button" aria-describedby="kcp${n}">${n}</span>` +
      `<span class="cite-preview" id="kcp${n}" role="tooltip">` +
      `<span class="cp-head"><span class="cp-title">${esc(o.title)}</span>${statusBadge(o.status)}</span>` +
      `<span class="cp-passage">“${esc(passage)}”</span>` +
      `<span class="cp-foot"><span class="cp-src">${typeMark(o)} · ${esc(SRC[o.src].label)} · ${esc(COLLECTIONS[o.col])}</span>` +
      `<button class="cite-action is-flag" data-flag="${o.id}">${ICO.flag}Flag</button></span></span></span>`;
  }

  /* The type goes in FRONT of the title, where it reads as a label on the row
     rather than as another field beside the connector. The connector keeps its
     slot: which system a claim came from is provenance, and the type does not
     replace it.

     `data-open-doc` because the row has had `cursor: pointer` and no handler
     for as long as it has existed — a row that says it is clickable and is
     not. The router already knows the attribute; it was only ever missing. */
  function sourceRow(n, id) {
    const o = byId(id);
    return `<div class="source-item" data-open-doc="${o.id}"><span class="cite">${n}</span>` +
      `${typeMark(o)}<span class="source-title">${esc(o.title)}</span>` +
      `<span class="source-domain">${esc(SRC[o.src].label)}</span>${statusBadge(o.status)}</div>`;
  }

  /* Every answer keeps this button even though a fresh question surfaces its
     sources automatically: scrolling back to an older message and re-applying
     it is the one case automation cannot serve. */
  /* ══ THE SAME BUTTON, TWO TRUE SENTENCES ═══════════════════════════════
     This control was hidden on the gate, because its own copy promised a grid
     that is not there — "the grid becomes exactly these documents" is a lie on
     a page with no grid, and a lie in an answer costs more than a missing
     button.

     It is back, saying what it will really do. On the Console it filters the
     surface, as it always has. On the gate it carries the documents ACROSS:
     one click from an answer to the workbench, already narrowed to exactly
     what the answer stood on. `ids` is a real filter key, so the destination
     is an ordinary addressable URL and not a special case. */
  const applyBtn = (ids, label) =>
    `<div class="answer-apply">${entryAction('direct',
      label || (canvas.inline ? `Open these ${ids.length} in the Console`
                              : `Show these ${ids.length} on the surface`),
      `data-apply-ids="${ids.join(',')}"`)}
    </div>`;

  const ANSWERS = [
    { match: /refund|activat|return/i, weight: 1, ids: ['article-refund', 'article-returns-faq', 'article-warranty'],
      build: () => `<div class="answer-surface">
        <div class="answer-body">
          <p>Customers who bought through the EU storefront may request a full refund within <strong>30 days</strong>
          of purchase${citeChip(1, 'article-refund', 'may request a full refund within 30 days of purchase, provided the item has not been activated.')},
          provided the item has not been activated${citeChip(2, 'article-returns-faq', 'Activation ends refund eligibility. Faults are handled under warranty instead.')}.</p>
          <p>The two sources disagree on what happens after activation, so treat that clause as contested rather than settled.</p>
        </div>
        <div class="source-list">${sourceRow(1, 'article-refund')}${sourceRow(2, 'article-returns-faq')}</div>
        <div class="trust-disclosure has-exclusion">
          <div class="td-row is-err">${ICO.refresh}<span class="td-text"><strong>One cited source is behind
          Confluence</strong> — the source changed after our copy. It is still answering, and this is what that
          looks like.</span></div>
          <div class="td-row is-warn">${ICO.warn}<span class="td-text">The second source is unscoped: it does not say
          which storefront it applies to. That is the actual defect.</span></div>
        </div>
        ${applyBtn(['article-refund', 'article-returns-faq', 'article-warranty'])}
      </div>` },

    { match: /residency|gdpr|data (is )?stored|apac/i, weight: 1, ids: ['article-residency', 'blog-residency', 'article-gdpr-dsr'],
      build: () => `<div class="answer-surface">
        <div class="answer-body">
          <p>EU customer data stays in the EU region${citeChip(1, 'article-residency', 'Where customer data is stored per region, and what changes on an enterprise contract.')}.
          For APAC the corpus is thinner: the article covers the region but is <strong>due for review</strong>, and the
          public explainer restates it rather than adding anything${citeChip(2, 'blog-residency', 'Public-facing explainer. Points at the residency article, which is due.')}.</p>
          <p>A customer asked exactly this nine days ago and the ticket is still open with legal.</p>
        </div>
        <div class="source-list">${sourceRow(1, 'article-residency')}${sourceRow(2, 'blog-residency')}</div>
        <div class="trust-disclosure">
          <div class="td-row is-warn">${ICO.clock}<span class="td-text"><strong>One source has not been cited in
          four months.</strong> Nothing was withheld from this answer — every document in scope was available.</span></div>
        </div>
        ${applyBtn(['article-residency', 'blog-residency', 'article-gdpr-dsr'])}
      </div>` },

    /* Weightier than the topic answers: "which articles contradict each other
       on refunds?" names refunds and asks about the contradiction, and taking
       the first pattern that matched answered the wrong half of it. */
    { match: /contradict|conflict|disagree/i, weight: 2, ids: ['article-refund', 'article-returns-faq'],
      build: () => `<div class="answer-surface">
        <div class="answer-body">
          <p>One live contradiction, on refunds after activation.</p>
          <p><strong>Refund eligibility — EU customers</strong> states a 30-day window with no exception for activated
          items. <strong>Returns FAQ — activated items</strong> states that activation ends eligibility outright.</p>
          <p>They are not describing the same thing: the first is scoped to the EU storefront, the second is not scoped
          at all. The unscoped one is the problem.</p>
        </div>
        <div class="trust-disclosure">
          <div class="td-row is-warn">${ICO.warn}<span class="td-text">Status cannot separate these — both are
          answerable, and the one in better condition is the one that is wrong. This needs a human ruling.</span></div>
        </div>
        ${applyBtn(['article-refund', 'article-returns-faq'], 'Put both on the surface')}
      </div>` }
  ];

  /* A comparison is not a conclusion, so it ends in the choice rather than in
     prose about the choice. Both buttons are the same commit surface with the
     winner swapped. */
  function conflictAnswer(a, b) {
    const row = (o, other) => `<div class="conflict-side">
      <div class="conflict-head">${statusBadge(o.status)}<span class="conflict-title">${esc(o.title)}</span></div>
      <p class="conflict-body">${esc(o.sum)}</p>
      <div class="conflict-meta">${esc(SRC[o.src].label)} · ${esc(responsible(o))} · ${neverCited(o) ? 'never used' : 'used ' + esc(usedLabel(o).toLowerCase())},
        ${o.uses} times in 90 days</div>
      ${entryAction('review', 'Make this the one', `data-resolve="${o.id}"`)}
    </div>`;
    return `<div class="answer-surface">
      <div class="answer-body">
        <p>These two disagree, and both are answering. Whichever you keep supersedes the other.</p>
      </div>
      <div class="conflict-pair">${row(a, b)}${row(b, a)}</div>
      <div class="trust-disclosure">
        <div class="td-row is-warn">${ICO.warn}<span class="td-text">Usage is the only thing separating them, and it
        is not evidence of which is correct.</span></div>
      </div>
    </div>`;
  }

  /* The terminal state of a knowledge base is a question it cannot answer, and
     until now that was where the surface stopped. */
  const handoffBtn = () => `<button class="hand-off" type="button" data-handoff>${ICO.person.replace('<svg', '<svg width="13" height="13"')}Ask a person instead</button>`;

  function noGroundingAnswer(q, scope, st) {
    /* Where it looked, so the claim is checkable. "Nothing grounds that" is a
       strong thing to say and it should say what it searched. */
    const where = scope && scope.axis ? 'the ' + scope.docs.length + ' documents in scope'
      : scope && !scope.broad ? 'the corpus' : 'the corpus';
    return `<div class="answer-surface">
      <div class="answer-body">
        <p>Nothing in ${esc(where)} grounds an answer to that.</p>
        <p>I would rather say so than assemble something plausible from adjacent content — a confident answer with no
        source behind it is the failure this product exists to remove.</p>
      </div>
      <div class="trust-disclosure has-exclusion">
        <div class="td-row is-err">${ICO.slash}<span class="td-text"><strong>0 sources matched.</strong> This is a
        genuine coverage gap, not a retrieval or a permission problem.</span></div>
        <button class="td-action" data-raise-gap="${esc(q).slice(0, 80)}">Raise it as a coverage gap →</button>
        ${handoffBtn()}
      </div>
    </div>`;
  }

  /* Scope is set before the query runs and stays visible throughout the
     answer. Here the scope IS the filter state, which is the whole point: what
     you can see and what AiMY may answer from are the same set. */
  function scopeBasis(st) {
    /* An open document is the basis. Saying "the whole corpus" while someone is
       reading one article is the canvas failing to show what it is standing on. */
    if (st.doc && byId(st.doc)) {
      const o = byId(st.doc);
      return [o.title, TYPES[o.t].label, COLLECTIONS[o.col], STATUS[o.status].label];
    }
    const chips = activeChips(st);
    if (!chips.length) return ['Your collections', LIVE.length + ' objects'];
    const labels = [];
    if (st.ids.length) labels.push(st.ids.length + ' documents');
    LIST_KEYS.concat(DATE_KEYS).forEach((k) => {
      if (k === 'ids') return;
      const v = st[k];
      (Array.isArray(v) ? v : v ? [v] : []).forEach((x) => labels.push(valueLabel(k, x)));
    });
    if (st.mine) labels.push('Owned by you');
    if (st.q) labels.push('“' + st.q + '”');
    return labels.slice(0, 4);
  }

  /* What AiMY may ground on. Exclusion is now a fact about replacement, not
     about age: a superseded document has a successor and an archived one is out
     of the corpus, so quoting either is quoting something that has been
     withdrawn. Everything else answers, and the answer discloses its condition —
     nothing is silently withheld because a clock ran out. */
  const answerable = (o) => o && !o.arch && !STATUS[o.status].excluded;

  /* What the answer stands on, resolved the same way the answer is — otherwise
     the grid fills with one set while the prose cites another. */
  const answerIds = (q) => {
    const topic = topicFor(q);
    if (topic && !questionShape(q)) return topic.ids.filter((id) => answerable(byId(id)));
    const scope = questionScope(q, readURL(), questionShape(q));
    return scope.broad ? [] : scope.docs.slice(0, 4).map((o) => o.id);
  };

  /* Put a set of documents on the surface and offer the way back. Used both by
     the automatic surfacing above and by the explicit button on every answer,
     so the two cannot drift apart. */
  function surfaceIds(ids, when) {
    const before = location.search;
    const next = readURL0();
    next.ids = ids;
    rememberFilter();
    writeURL(next);
    undoStack = () => { location.href = location.pathname + before; };
    toast('The surface now holds the ' + ids.length + ' documents this answer stands on',
      'Undo', when ? 'Applied ' + when + ' — Undo restores your filters' : 'Undo restores your filters');
  }

  /* ── Answering the question that was asked ──

     Three hand-written topics used to be the whole of it, matched on a noun.
     "Can EU customers get a refund after activating?" and "What changed in the
     refund policy?" both contain *refund* and are not the same question;
     returning the same paragraph for both is keyword matching wearing
     comprehension as a costume. And everything outside those three nouns fell
     to "nothing in the corpus grounds an answer to that" — which is a strong
     claim to make about a question the corpus can plainly answer.

     So: what the question ASKS decides the shape of the answer, and what its
     words NAME decides the documents it is answered from. Both are computed
     from the live corpus, which is what keeps them related to the question. */
  const STOP = ('what which whats who whom whose does did do done is are was were the a an and or of in on at to for '
    + 'about that this these those there here have has had been being will would should could can cannot may might '
    + 'me my our your their it its from with when where why how any some all still need needs want get got say says '
    + 'tell show find look into out over under document documents doc docs article articles thing things corpus '
    + 'knowledge base please').split(' ');

  const QUESTION_SHAPE = [
    ['owner',   /\bwho\b.{0,20}\b(owns?|maintains?|responsible|looks after)\b|\bowner(ship)?\b|\bunowned\b/i],
    ['changed', /\bwhat.{0,15}\b(changed|new|updated?)\b|\brecently\b|\bsince\b|\blatest\b|\bmost recent\b/i],
    ['stale',   /\bout of date\b|\boutdated\b|\bstale\b|\bbehind\b|\bre-?sync/i],
    ['unused',  /\bunused\b|\bnobody\b.{0,18}\b(use|uses|read|reads|cite|cites|open|opens|need|needs)\b|\bno ?one\b.{0,18}\b(use|uses|read|reads)\b|\bnot been (used|cited|opened)\b|\bworth keeping\b|\bstopped being used\b/i],
    ['count',   /\bhow many\b|\bhow much\b|\bcount\b|\bhow big\b/i],
    ['source',  /\bwhere\b.{0,20}\bcome from\b|\bwhich source\b|\bsyncing\b|\bnot syncing\b|\bsources?\b.{0,12}\b(broken|down|failing|stopped)\b/i]
  ];

  const questionShape = (q) => (QUESTION_SHAPE.find(([, re]) => re.test(q)) || [null])[0];

  /* The words that carry the QUESTION are not words to search for. "Which
     documents does nobody use?" was scoping itself to the one document whose
     summary happens to contain the word *nobody*, and then answering about that
     document — the asking words were being read as the subject. */
  const SHAPE_WORDS = {
    owner:   ['owns', 'owner', 'owners', 'ownership', 'unowned', 'maintains', 'responsible', 'assigned', 'unassigned'],
    changed: ['changed', 'change', 'changes', 'updated', 'update', 'updates', 'recent', 'recently', 'latest', 'newest'],
    stale:   ['outdated', 'stale', 'behind', 'resync', 'date', 'dates'],
    unused:  ['unused', 'nobody', 'uses', 'used', 'using', 'reads', 'reading', 'cites', 'cited', 'keeping'],
    count:   ['many', 'much', 'count', 'total', 'number'],
    source:  ['source', 'sources', 'syncing', 'synced', 'connected', 'broken', 'failing', 'stopped']
  };

  /* The documents a question is about: a plain term match over what each
     document says about itself, inside whatever the surface is already showing.
     This is the retrieval step, and having one is what makes "nothing grounds
     that" a true statement on the occasions it appears rather than the default
     for everything unrecognised. */
  function questionScope(q, st, shape) {
    const onSurface = applyFilters(st).filter(answerable);
    let pool = onSurface.length ? onSurface : ENTITLED.filter(answerable);
    let axisScoped = false;

    /* A word that names a real axis — a collection, a source, a service, a
       region — is never a coincidence, so it scopes the answer whatever its
       frequency. The lexicon already knows the whole taxonomy; asking it again
       here is reuse, not a second vocabulary that can drift from the first. */
    const axes = parseFilters(q).set;
    const axisKeys = Object.keys(axes).filter((k) => k !== 'q' && LIST_KEYS.indexOf(k) > -1 && axes[k].length);
    if (axisKeys.length) {
      const scoped = pool.filter((o) => axisKeys.every((k) => {
        const v = axes[k];
        return k === 'tag' ? v.some((x) => o.tags.indexOf(x) > -1)
          : k === 'service' ? v.some((x) => o.services.indexOf(x) > -1)
          : k === 'group' ? v.some((x) => o.groups.indexOf(x) > -1)
          : k === 'type' ? v.indexOf(o.t) > -1
          : k === 'collection' ? v.indexOf(o.col) > -1
          : k === 'source' ? v.indexOf(o.src) > -1
          : v.indexOf(o[k]) > -1;
      }));
      /* An axis narrows WHERE to look. It is not evidence that the answer is in
         there — "what is our policy on office dogs?" names the Policies
         collection and the collection says nothing about dogs. So the terms are
         still scored, inside the narrowed pool. */
      if (scoped.length) { pool = scoped; axisScoped = true; }
    }

    const drop = (SHAPE_WORDS[shape] || []).concat(STOP);
    const words = String(q).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
      .filter((w) => w.length > 3 && drop.indexOf(w) < 0);
    if (!words.length) return { docs: pool, terms: [], broad: true, axis: axisScoped };
    /* A term that hits a quarter of the corpus is not evidence that the corpus
       covers the question — "what is our policy on office dogs?" matches every
       document with the word *policy* in it, and answering from those would be
       claiming coverage that does not exist. Only distinctive terms count. */
    const hay = (o) => (o.title + ' ' + o.sum + ' ' + o.tags.join(' ') + ' ' + COLLECTIONS[o.col]).toLowerCase();
    const generic = words.filter((w) => pool.filter((o) => hay(o).indexOf(w) > -1).length > pool.length * 0.25);
    const sharp = words.filter((w) => generic.indexOf(w) < 0);
    const scored = pool.map((o) => {
      const h = hay(o);
      return { o: o, n: sharp.filter((w) => h.indexOf(w) > -1).length };
    }).filter((x) => x.n > 0).sort((a, b) => b.n - a.n || a.o.upd - b.o.upd);
    /* Which type the question narrowed to, where it named one. "Expired ICPs,
       why did they lapse?" really does scope the pool by type and the answer
       said only "across the 4 in scope" — a number over an axis it applied and
       did not mention. Carried out so the scope line can name it. */
    const typeAxis = axisScoped && axes.type && axes.type.length
      ? axes.type.map((t) => (TYPES[t] || {}).label).filter(Boolean) : null;

    /* Naming nothing the corpus recognises does not make the question empty:
       "what is out of date?" is about the whole surface. Only a question whose
       words match no document AND asks nothing computable is a coverage gap. */
    return { docs: scored.length ? scored.map((x) => x.o) : pool, terms: words,
             broad: !scored.length, axis: axisScoped,
             types: typeAxis && typeAxis.length ? typeAxis : null };
  }

  /* An acronym keeps its case — "icps" is not a word — and a -y pluralises
     properly, so Success Story does not come out as Success Storys. */
  const typeWord = (label) => label === label.toUpperCase() ? label : label.toLowerCase();
  const plural = (s) => /y$/.test(s) ? s.slice(0, -1) + 'ies' : s + 's';
  const typeScope = (scope) => scope.types
    ? ' ' + scope.types.map((l) => plural(typeWord(l))).join(' and ') : '';

  const scopeLine = (scope, st) => scope.axis
    ? 'across the ' + scope.docs.length + typeScope(scope) + ' in scope'
    : scope.broad
      ? (activeChips(st).length ? 'across what is on your surface' : 'across your four collections')
      : scope.docs.length === 1 ? 'in the one document that mentions it'
        : 'across the ' + scope.docs.length + ' documents that mention it';

  /* Every computed answer cites what it counted. A number with no way to see
     what is behind it is the same unsourced confidence this product exists to
     remove — it just looks more objective. */
  const citedList = (docs, note) => docs.length
    ? `<div class="source-list">${docs.slice(0, 4).map((o, i) => sourceRow(i + 1, o.id)).join('')}</div>`
      + (note ? `<div class="trust-disclosure"><div class="td-row is-warn">${ICO.warn}
          <span class="td-text">${note}</span></div></div>` : '')
    : '';

  const COMPUTED = {
    owner(scope, st, q) {
      const docs = scope.docs;
      /* "Who owns this" means "who do I ask", which is why this goes through
         `responsible` and not the raw field: some documents carry an ingestion
         marker there rather than a person, and answering with
         "Ingested · Freshdesk" names something you cannot send a message to.
         An ingested document with an assignee now has somebody to ask, and
         `hasOwner` is the same test every other surface applies. */
      const by = {};
      docs.filter(hasOwner).forEach((o) => { by[responsible(o)] = (by[responsible(o)] || 0) + 1; });
      const top = Object.keys(by).sort((a, b) => by[b] - by[a]).slice(0, 3);
      const nobody = docs.filter((o) => !hasOwner(o));
      const unassigned = nobody.filter((o) => responsible(o) === 'Unassigned');
      const ingested = nobody.length - unassigned.length;
      return `<div class="answer-surface">
        <div class="answer-body">
          <p>${top.length
            ? top.map((n) => `<strong>${esc(n)}</strong> owns ${by[n]}`).join(', ') +
              ' ' + scopeLine(scope, st) + '.'
            : 'Nobody has their name on any of it ' + scopeLine(scope, st) + '.'}</p>
          ${nobody.length
            ? `<p><strong>${nobody.length}</strong> ${nobody.length === 1 ? 'has' : 'have'} nobody to ask${
                unassigned.length && ingested
                  ? ` — ${unassigned.length} unassigned, and ${ingested} that arrived from a source with no person attached`
                  : ingested ? ' — they arrived from a source with no person attached' : ''}.
               That is the part worth acting on.</p>`
            : '<p>Every one of them has a named owner.</p>'}
        </div>
        ${citedList(docs)}
        ${nobody.length
          ? applyBtn(nobody.map((o) => o.id), 'Show the ' + nobody.length + ' with nobody to ask')
          : applyBtn(docs.slice(0, 8).map((o) => o.id))}
      </div>`;
    },

    changed(scope, st, q) {
      const docs = scope.docs.slice().sort((a, b) => a.upd - b.upd);
      const recent = docs.filter((o) => o.upd <= 30).slice(0, 5);
      const list = recent.length ? recent : docs.slice(0, 3);
      return `<div class="answer-surface">
        <div class="answer-body">
          <p>${recent.length
            ? `<strong>${recent.length}</strong> changed in the last month ${scopeLine(scope, st)}.`
            : `Nothing changed in the last month ${scopeLine(scope, st)}. The most recent ${list.length === 1 ? 'is' : 'are'} below.`}</p>
          ${list.map((o) => `<p>${citeChip(list.indexOf(o) + 1, o.id, o.sum.slice(0, 120))}
            <strong>${esc(o.title)}</strong> — ${esc(fmtDate(o.upd))}${o.versions && o.versions[0]
              ? ', ' + esc(String(o.versions[0].label).toLowerCase()) : ''}.</p>`).join('')}
        </div>
        ${citedList(list, 'A change to the stored copy is not the same as a change at the source. Where the two differ, the document says so.')}
        ${applyBtn(list.map((o) => o.id))}
      </div>`;
    },

    stale(scope, st, q) {
      const docs = scope.docs.filter((o) => o.status === 'outdated');
      if (!docs.length) return `<div class="answer-surface">
        <div class="answer-body">
          <p>Nothing is behind its source ${scopeLine(scope, st)}. Every stored copy matches what the source last said.</p>
        </div>
        ${applyBtn(scope.docs.slice(0, 8).map((o) => o.id), 'Show what is in scope')}
      </div>`;
      const bySrc = {};
      docs.forEach((o) => { bySrc[o.src] = (bySrc[o.src] || 0) + 1; });
      const dead = Object.keys(bySrc).filter((k) => SRC[k].health !== 'ok');
      return `<div class="answer-surface">
        <div class="answer-body">
          <p><strong>${docs.length}</strong> ${docs.length === 1 ? 'document is' : 'documents are'} behind ${
            Object.keys(bySrc).map((k) => `${esc(SRC[k].label)} (${bySrc[k]})`).join(', ')}.</p>
          <p>${dead.length
            ? `${dead.map((k) => `<strong>${esc(SRC[k].label)}</strong>`).join(' and ')} ${dead.length === 1 ? 'is' : 'are'}
               not connected, so re-syncing those would queue rather than run — the connection is the thing to fix first.`
            : 'All of those sources are connected, so each one can be pulled again now.'}</p>
        </div>
        ${citedList(docs, 'Out of date is a condition, not an exclusion. These still answer, and every answer citing them says so.')}
        <div class="answer-apply">
          ${dead.length ? entryAction('review', 'Settings for ' + SRC[dead[0]].label, `data-settings="source:${dead[0]}"`) : ''}
          ${entryAction('direct', 'Show these ' + docs.length, `data-apply-ids="${docs.map((o) => o.id).join(',')}"`)}
        </div>
      </div>`;
    },

    unused(scope, st, q) {
      const docs = scope.docs.filter((o) => o.status === 'unused' || o.used > 120)
        .sort((a, b) => b.used - a.used).slice(0, 6);
      if (!docs.length) return `<div class="answer-surface">
        <div class="answer-body"><p>Everything ${scopeLine(scope, st)} has been cited in the last four months.</p></div>
        ${applyBtn(scope.docs.slice(0, 8).map((o) => o.id), 'Show what is in scope')}
      </div>`;
      return `<div class="answer-surface">
        <div class="answer-body">
          <p><strong>${docs.length}</strong> ${docs.length === 1 ? 'has' : 'have'} not been cited in months
          ${scopeLine(scope, st)}.</p>
          ${docs.slice(0, 4).map((o, i) => `<p>${citeChip(i + 1, o.id, o.sum.slice(0, 120))}
            <strong>${esc(o.title)}</strong> — ${esc(citedPhrase(o).toLowerCase())}.</p>`).join('')}
        </div>
        ${citedList(docs, 'Low usage is not evidence that a document is wrong. It may be that something else is found first.')}
        <div class="answer-apply">
          ${entryAction('investigate', 'Is the first one worth keeping?', `data-act="triage" data-obj="${docs[0].id}"`)}
          ${entryAction('direct', 'Show these ' + docs.length, `data-apply-ids="${docs.map((o) => o.id).join(',')}"`)}
        </div>
      </div>`;
    },

    count(scope, st, q) {
      const docs = scope.docs;
      const byStatus = {};
      docs.forEach((o) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
      const rows = Object.keys(byStatus).sort((a, b) => byStatus[b] - byStatus[a]);
      return `<div class="answer-surface">
        <div class="answer-body">
          <p><strong>${docs.length}</strong> ${docs.length === 1 ? 'document' : 'documents'} ${scopeLine(scope, st)}.</p>
        </div>
        ${factRow(rows.map((s) => [byStatus[s], STATUS[s].label.toLowerCase()]))}
        ${applyBtn(docs.slice(0, 12).map((o) => o.id))}
      </div>`;
    },

    source(scope, st, q) {
      const keys = Object.keys(SRC).filter((k) => k !== 'upload');
      const named = keys.filter((k) => q.toLowerCase().indexOf(SRC[k].label.toLowerCase()) > -1);
      /* NOT-OK IS NOT THE SAME AS NOT SYNCING. `health` has three values and
         this read it as two: a warned source is running and dropping rows,
         which is a different thing from one that has stopped. Counting it as
         stopped made the headline contradict the note printed directly under
         it — "3 of 4 sources are not syncing", above "TeamSupport — 3 records
         skipped", which only happens if TeamSupport ran. */
      const stopped = keys.filter((k) => SRC[k].health === 'failed');
      const degraded = keys.filter((k) => SRC[k].health === 'warn');
      const list = named.length ? named : stopped.concat(degraded);
      const shown = list.length ? list : keys;
      return `<div class="answer-surface">
        <div class="answer-body">
          <p>${list.length && !named.length
            ? `<strong>${stopped.length}</strong> of ${keys.length} sources ${stopped.length === 1 ? 'has' : 'have'} stopped syncing`
              + (degraded.length ? `, and ${degraded.length === 1 ? 'another is' : degraded.length + ' more are'} running but dropping rows` : '')
              + '.'
            : shown.map((k) => `<strong>${esc(SRC[k].label)}</strong> ${
                SRC[k].health === 'ok' ? 'is syncing'
                : SRC[k].health === 'warn' ? 'is syncing but dropping rows'
                : 'has stopped syncing'}`).join('; ') + '.'}</p>
          ${shown.map((k) => `<p>${esc(SRC[k].label)} — ${esc(SRC[k].note)}.
            ${LIVE.filter((o) => o.src === k).length} documents come from it.</p>`).join('')}
        </div>
        <div class="answer-apply">
          ${shown.slice(0, 2).map((k) => entryAction('review', 'Settings for ' + SRC[k].label,
            `data-settings="source:${k}"`)).join('')}
        </div>
      </div>`;
    }
  };

  /* When the question names something the corpus holds but asks nothing this
     product computes, the honest answer is what those documents say — with the
     citations that let you check. It beats "nothing grounds that", which was
     being said about questions the corpus could plainly answer. */
  function corpusAnswer(scope, st, q) {
    const docs = scope.docs.slice(0, 3);
    return `<div class="answer-surface">
      <div class="answer-body">
        <p>${docs.length} document${docs.length === 1 ? '' : 's'} in scope ${docs.length === 1 ? 'covers' : 'cover'} that.</p>
        ${docs.map((o, i) => `<p>${citeChip(i + 1, o.id, o.sum.slice(0, 140))}
          <strong>${esc(o.title)}</strong> — ${esc(o.sum.slice(0, 160))}${o.sum.length > 160 ? '…' : ''}</p>`).join('')}
      </div>
      ${citedList(docs, 'This is what those documents say, not a synthesis of them. Where they disagree, comparing them is one click from either one.')}
      ${applyBtn(docs.map((o) => o.id))}
    </div>`;
  }

  /* The most specific topic that matches, not the first one declared. */
  const topicFor = (q) => ANSWERS.filter((a) => a.match.test(q))
    .sort((a, b) => (b.weight || 1) - (a.weight || 1))[0] || null;

  /* ══ SAYING HELLO ══════════════════════════════════════════════════════
     "hi" is not a question about the corpus. Put through the grounding path it
     produced the right answer to the wrong question — *nothing in the corpus
     grounds an answer to that* — which is true, and is not what a person
     saying hello has asked. So it is handled before the shape and topic
     matchers, because it is not a retrieval problem at all.

     ── The greeting is the whole message ──
     `hi` is greeted; `hi, which documents are out of date?` is ANSWERED. A
     greeting used as a preamble is not a request to be greeted, and matching
     on a prefix would swallow the question riding behind it.

     ── What makes this more than a greeting ──
     The suggestions are not a fixed list. They are chosen from what is
     actually sitting with this person, ranked by `needScore` — the product's
     own definition of what needs someone, already behind the landing set and
     the Needs-attention sort. A second definition of "your work" is how the
     two start disagreeing about it.

     ── Why these questions always resolve ──
     Each suggestion is a bare SHAPE question: every word in it is a stop word
     or a shape word, so `questionScope` drops them all, returns the full pool
     with `broad: true`, and `COMPUTED[shape]` always has something to answer
     from. Suggestion chips that resolved to "nothing grounds an answer" have
     shipped here before — these cannot, by construction rather than by
     having been checked once. */
  const GREETING = /^\s*(hi|hey|hello|hiya|howdy|yo|greetings|good\s+(morning|afternoon|evening)|morning|evening|salam|salaam|marhaba|hala)\s*(there|aimy|again|all)?\s*[!.,?]*\s*$/i;

  /* Read off the real clock, not `TODAY`. The corpus date is fixed at
     2026-07-30 so the fixtures hold still; which part of the day it is for the
     person reading is the one thing that fixed date cannot know. */
  function dayPart() {
    const h = new Date().getHours();
    if (h < 5) return 'Still up';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /* Sentence-cased so a title can open a sentence without shouting. */
  const docPhrase = (o) => `<strong>${esc(o.title)}</strong>`;

  function greetAnswer() {
    const first = String(USER.name || '').trim().split(/\s+/)[0] || 'there';

    /* Ranked by the product's own measure. The +2 in `needScore` for being
       yours is why this list is about this person and not about the corpus. */
    const mine = LIVE.filter((o) => responsible(o) === USER.owner)
      .sort((a, b) => needScore(b) - needScore(a));
    /* Above 2 means something is wrong with it beyond merely being yours. */
    const needs = mine.filter((o) => needScore(o) > 2);

    /* A broken source only matters here if it actually feeds documents this
       person can see. Naming a failure with nothing behind it is noise.

       DOWN AND DEGRADED ARE DIFFERENT NEWS. A failed source is not syncing at
       all, so everything from it is a copy of an unknown age. A warned one is
       syncing and skipping rows. Reporting them in one sentence said the
       stronger thing about both, which overstated TeamSupport and buried Freshdesk
       in a list. */
    const feeds = (k) => ENTITLED.some((o) => o.src === k);
    const down = Object.keys(SRC).filter((k) => SRC[k].health === 'failed' && feeds(k)).map((k) => SRC[k]);
    const partial = Object.keys(SRC).filter((k) => SRC[k].health === 'warn' && feeds(k)).map((k) => SRC[k]);

    const lines = [];
    lines.push(`<p>${dayPart()}, ${esc(first)} — how are you doing?</p>`);

    if (needs.length) {
      const top = needs.slice(0, 2);
      const rest = needs.length - top.length;
      lines.push(`<p>${mine.length} document${mine.length === 1 ? '' : 's'} in the corpus
        ${mine.length === 1 ? 'is' : 'are'} yours, and ${needs.length === 1 ? 'one of them is' : needs.length + ' of them are'}
        asking for something. ${top.map((o) => `${docPhrase(o)} is
        ${esc(String((STATUS[o.status] || {}).label || 'open').toLowerCase())}${o.upd ? `, ${o.upd} days since it last changed` : ''}`).join('; and ')}${rest > 0 ? `, with ${rest} more behind ${rest === 1 ? 'it' : 'them'}` : ''}.</p>`);
    } else if (mine.length) {
      lines.push(`<p>Nothing on your ${mine.length} document${mine.length === 1 ? '' : 's'} needs you
        right now — they are all current.</p>`);
    }

    /* The notes are written prose and carry proper nouns — OAuth, Jul, the
       source names. Lower-casing them to fit inside a sentence produced
       "oauth token rejected since 26 jul", so they are joined as clauses
       instead and left exactly as they are written. */
    const list = (xs) => xs.map((x) => `<strong>${esc(x.label)}</strong> (${esc(x.note)})`)
      .join(xs.length > 2 ? ', ' : ' and ')
      .replace(/, ([^,]*)$/, xs.length > 2 ? ', and $1' : ' and $1');

    if (down.length) {
      lines.push(`<p>${down.length === 1 ? 'One source is' : down.length + ' sources are'} not syncing —
        ${list(down)}. Anything answered from ${down.length === 1 ? 'it' : 'them'} is standing on the copy
        we already had.</p>`);
    }
    if (partial.length) {
      lines.push(`<p>${list(partial)} ${partial.length === 1 ? 'is' : 'are'} still syncing but dropping rows
        on the way in.</p>`);
    }

    /* Each suggestion is offered because something in the corpus makes it
       worth asking. An unconditional list would be a menu; this is a reading
       of the state. */
    /* Each of these asks a DIFFERENT question. "Which documents are out of
       date?" and "What is out of date or contradicted?" both shipped in the
       first cut, and offering a person the same question twice out of three
       is worse than offering two. */
    const asks = [];
    if (needs.some((o) => o.status === 'conflicting')) asks.push('What contradicts what?');
    if (needs.some((o) => o.status === 'outdated') || mine.some((o) => o.upd > 60)) {
      asks.push('Which documents are out of date?');
    }
    if (down.length || partial.length) asks.push('Which sources have stopped syncing?');
    if (LIVE.some((o) => o.status === 'unowned')) asks.push('What here is unowned?');
    if (LIVE.some((o) => o.status === 'unused')) asks.push('What is nobody using?');
    asks.push('What changed recently?');

    const chips = asks.slice(0, 3)
      .map((q, i) => `<button class="overlay-sugg-chip" type="button" style="--i:${i}">${esc(q)}</button>`)
      .join('');

    return `<div class="answer-body">${lines.join('')}</div>
      <div class="greet-next"><span class="greet-next-label">Worth asking</span>${chips}</div>`;
  }

  function answerFor(q, st) {
    /* Order matters, and it is the whole fix. What the question ASKS comes
       first: "what changed in the refund policy" and "can EU customers get a
       refund after activating" share a noun and are different questions, and
       the topic match cannot tell them apart. Only once the question asks
       nothing computable does the noun get to choose the answer. */
    /* Before everything, because a greeting is not a question about the
       corpus and every matcher below assumes it is looking at one. */
    if (GREETING.test(q)) return greetAnswer();

    const shape = questionShape(q);
    const scope = questionScope(q, st, shape);
    if (shape && COMPUTED[shape] && (scope.docs.length || shape === 'source')) {
      return COMPUTED[shape](scope, st, q);
    }

    const topic = topicFor(q);
    /* Nothing recognised, but the corpus holds documents about it: say what
       they say. "Nothing grounds an answer to that" is a strong claim and it
       was being made about questions the corpus could plainly answer. */
    if (!topic) return scope.docs.length && !scope.broad ? corpusAnswer(scope, st, q) : noGroundingAnswer(q, scope, st);
    /* Results first: the matching objects arrive before the prose resolves, so
       latency is filled with something useful rather than a spinner. */
    const results = applyFilters(st).filter((o) => topic.ids.indexOf(o.id) > -1).slice(0, 2);
    const body = topic.build();
    if (!results.length) return body;
    const head = `<div class="rs-head"><span class="rs-label">Matches</span>
      <span class="rs-note">already on your surface</span></div>
      <div class="rs-list">${results.map((o) => typeCard(o, true)).join('')}</div>`;
    return body.replace('<div class="answer-surface">', `<div class="answer-surface">${head}`);
  }

  /* ═══════════════════════════════════════════════
     TOAST + COMMIT SURFACES
  ═══════════════════════════════════════════════ */
  let undoStack = null;

  function toast(msg, undoLabel, sub) {
    const host = $('#toastHost');
    if (!host) return;
    host.innerHTML =
      `<div class="aimy-toast" role="status" aria-live="polite">
        <div class="aimy-toast-icon">${AIMY_MARK(13, 15)}</div>
        <div class="aimy-toast-body">
          <div class="aimy-toast-title">${esc(msg)}</div>
          ${sub ? `<div class="aimy-toast-sub">${esc(sub)}</div>` : ''}
        </div>
        ${undoLabel ? `<div class="aimy-toast-divider"></div>
        <button class="aimy-toast-undo" data-toast-undo>${esc(undoLabel)}</button>` : ''}
        <div class="aimy-toast-progress"><div class="aimy-toast-progress-fill"></div></div>
      </div>`;
    const el = $('.aimy-toast', host);
    if (el) { void el.offsetWidth; el.classList.add('visible'); }
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { host.innerHTML = ''; }, 5000);
  }

  let pendingCommit = null;
  /* Carried beside the runner rather than read off the surface, for the same
     reason `pendingCommit` is: the commit element is torn down before the
     receipt is built, so anything the receipt needs has to outlive it. */
  let pendingAgent = null;

  /* One structured commit surface, used by every consequential write. Free
     text never performs one — it only ever stages one. */
  function commit(o) {
    const host = $('#commitHost');
    if (!host) return;
    pendingCommit = o.onRun || null;
    pendingAgent = o.agent || null;
    const effects = (o.effects || []).concat([['rev', o.reversible || 'Reversible for 24h · logged to the audit trail']]);
    const effIco = (k) => k === 'ok' ? ICO.check : k === 'warn' ? ICO.warn : k === 'rev' ? ICO.shield : ICO.slash;

    /* ── Two shells, one surface ──

       A centred box is right when the decision was made before it opened and
       all that is left is to confirm it. Connecting is the other case: the
       surface IS the decision, the list is as long as the library, and a box
       that grows with its content had to be capped, which put the confirm
       button behind a scroll. The sheet takes the full height of the window
       instead, so the list has somewhere to go and the foot never moves. */
    host.innerHTML = `
      <div class="modal-backdrop${o.sheet ? ' is-sheet' : ''}" style="display:flex" data-hide-on-backdrop>
        <div class="modal${o.sheet ? ' modal-sheet' : ''}" role="dialog" aria-modal="true" aria-label="${esc(o.title)}" style="width:${o.width || 560}px;max-width:100%">
          <div class="modal-header">
            <div class="modal-title">${esc(o.title)}</div>
            <button class="modal-close" data-commit-close aria-label="Close">${ICO.x.replace('<svg', '<svg width="14" height="14"')}</button>
          </div>
          <div class="modal-body">
            ${o.current ? `<div class="gov-cr-diff">
              <div class="gov-cr-current"><span class="gov-cr-label">Now</span><div class="gov-cr-val">${esc(o.current)}</div></div>
              <span class="gov-cr-arrow">${ICO.arrow.replace('<svg', '<svg width="16" height="16"')}</span>
              <div class="gov-cr-proposed"><span class="gov-cr-label">After</span><div class="gov-cr-val">${esc(o.proposed)}</div></div>
            </div>` : ''}
            <p class="gov-cr-rationale">${o.rationale}</p>
            <!-- A commit body that is a CHOICE, not a warning. The library's
                 surface assumes the decision was made before it opened and it
                 only has to be confirmed; connecting is the case where the
                 surface is where you decide. See GAPS.md. -->
            ${o.body || ''}
            <div class="ss-preview">
              <div class="ss-preview-head">What this will do</div>
              ${effects.map(([k, t]) => `<div class="ss-effect is-${k === 'rev' ? 'ok' : k}">${effIco(k)}<span>${t}</span></div>`).join('')}
            </div>
            ${o.typed ? `<div class="ds-field" style="max-width:none;margin-top:16px">
              <label class="field-label" for="commitTyped">Type <strong style="color:var(--d50)">${esc(o.typed)}</strong> to confirm</label>
              <input class="field-input" type="text" id="commitTyped" autocomplete="off" spellcheck="false"
                     placeholder="${esc(o.typed)}" data-typed="${esc(o.typed)}">
            </div>` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" data-commit-close>${esc(o.cancel || 'Cancel')}</button>
            ${o.extra || ''}
            <button class="btn ${o.danger ? 'btn-err' : 'btn-brand'}" id="commitRun"
                    ${o.typed ? 'disabled style="opacity:.45;cursor:not-allowed"' : ''}
                    data-commit-run="${esc(o.done || o.confirm)}">${esc(o.confirm)}</button>
          </div>
        </div>
      </div>`;
  }

  function closeCommit() { const h = $('#commitHost'); if (h) h.innerHTML = ''; pendingCommit = null; pendingAgent = null; }

  /* ═══════════════════════════════════════════════
     THE WRITE ROUTE

     A write typed into the input never runs. It resolves to a scope and stages
     the commit surface for it. Routing a consequential write through free text
     is the inversion the doctrine bans, and the fact that the sentence parsed
     cleanly is not evidence that the user meant every object it selected.
  ═══════════════════════════════════════════════ */
  const WRITE_SPEC = {
    archive:  { title: 'Archive documents', confirm: 'Archive', danger: true, typed: 'archive',
                verb: 'archived', rung: 'Destructive — typed confirmation and an audit entry' },
    delete:   { title: 'Delete permanently', confirm: 'Delete for good', danger: true, typed: 'delete',
                verb: 'deleted for good', rung: 'Not reversible — typed confirmation and an audit entry' },
    remove:   { title: 'Delete permanently', confirm: 'Delete for good', danger: true, typed: 'delete',
                verb: 'deleted for good', rung: 'Not reversible — typed confirmation and an audit entry' },
    verify:   { title: 'Re-sync from source', confirm: 'Re-sync', verb: 're-synced' },
    publish:  { title: 'Publish documents', confirm: 'Publish', danger: true, typed: 'publish', verb: 'published' },
    expire:   { title: 'Expire documents', confirm: 'Expire', danger: true, typed: 'expire', verb: 'expired' },
    restore:  { title: 'Restore a version', confirm: 'Restore', verb: 'restored' },
    approve:  { title: 'Approve for external use', confirm: 'Approve', verb: 'approved' },
    reassign: { title: 'Reassign ownership', confirm: 'Reassign', verb: 'reassigned' },
    tag:      { title: 'Tag documents', confirm: 'Apply tag', verb: 'tagged' }
  };

  function runWrite(intent, st) {
    const key = intent.verb.replace(/^re-?verify$/, 'verify').replace(/^review$/, 'verify');

    /* Creating is not a bulk operation over the surface, so it does not go
       through the scope machinery below — it goes to the same commit surface
       the New document button uses. */
    if (['add', 'create', 'new', 'draft'].indexOf(key) > -1) {
      /* ── Which kind, said in words ──

         `intent.set` was the fallback here and it is never populated on this
         route: parseIntent returns at WRITE_VERB, several lines before
         parseFilters ever runs. So the only thing that worked was a literal
         SLUG in the sentence — "create an article" and "create a ticket", and
         nothing else. "Create a success story", "a web page", "a marketing
         asset" and now "a deck" all silently made an Article, which is the one
         type whose slug is also the word people reach for when they mean
         "a document".

         The lexicon already knows every word for every type. Running it here
         is what the dead fallback was reaching for. Slug first, because a slug
         is unambiguous; then the lexicon, which is where "deck" and "case
         study" live. */
      const spoken = parseFilters(intent.text).set.type;
      const named = Object.keys(TYPES).find((k) => new RegExp('\\b' + k + '\\b', 'i').test(intent.text)) ||
                    (spoken && spoken[0]) || '';
      newDocument(named || 'article');
      return;
    }

    const spec = WRITE_SPEC[key] || WRITE_SPEC.verify;

    const scope = isComposed(st) ? composedSet() : applyFilters(st);
    const from = 'everything on the surface';

    const excluded = scope.filter((o) => STATUS[o.status].excluded);
    const unowned  = scope.filter((o) => responsible(o) === 'Unassigned');
    const willAct  = scope.length - (key === 'verify' ? unowned.length : 0);

    commit({
      title: spec.title,
      rationale: `You typed <strong>“${esc(intent.text)}”</strong>. AiMY resolved that to ${esc(from)} —
        <strong>${scope.length} document${scope.length === 1 ? '' : 's'}</strong> — and staged it rather than running
        it. Writes with consequence do not go through free text.`,
      current: scope.length + ' document' + (scope.length === 1 ? '' : 's') + ' on the surface',
      proposed: willAct + ' ' + spec.verb,
      danger: spec.danger, typed: spec.typed, confirm: spec.confirm,
      done: spec.title,
      effects: [
        ['ok', `<strong>${willAct}</strong> document${willAct === 1 ? '' : 's'} will be ${esc(spec.verb)}.`],
        unowned.length ? ['warn', `<strong>${unowned.length}</strong> ${unowned.length === 1 ? 'has' : 'have'} no owner —
          ${key === 'verify' ? 'routed to the collection lead instead' : 'the action still applies, but nobody is accountable for the result'}.`] : null,
        excluded.length ? ['skip', `<strong>${excluded.length}</strong> ${excluded.length === 1 ? 'is' : 'are'} already
          excluded from retrieval, so answers do not change until this is confirmed.`] : null,
        spec.rung ? ['warn', esc(spec.rung)] : null
      ].filter(Boolean),

      /* ── The run, and the receipt ──

         Only for a write that touches MORE THAN ONE document. On a single one
         the act is over before a phase could finish, and a cycle of three
         labels would be theatre in front of something already done — the
         toast is the honest report there.

         Undeclared when the patterns are absent, which costs nothing: the
         handler falls through to the toast it always used. */
      agent: willAct > 1 ? {
        phases: [
          { label: 'Reaching the sources', orb: 'orbit' },
          { label: willAct + ' document' + (willAct === 1 ? '' : 's') + ' · ' + spec.verb, orb: 'sweep' },
          { label: 'Checking what changed', orb: 'globe' }
        ],
        phaseMs: 850,
        context: 'AiMY',
        doneLabel: willAct + ' ' + spec.verb,
        receipt: {
          /* {label, value}, not pairs. The kit reads these as objects and an
             array silently renders nothing — the three rows were absent and
             the receipt looked like it simply had no detail to give. */
          meta: [
            { label: 'What',  value: willAct + ' document' + (willAct === 1 ? '' : 's') + ' ' + spec.verb },
            { label: 'Where', value: from },
            /* Named from the ladder the commit just applied, so the receipt
               reports the rung the act actually went through rather than a
               flat "you did this". */
            { label: 'Authority', value: spec.typed ? 'Typed confirmation' : 'Your confirmation' }
          ],
          before: 0,
          after: willAct,
          unit: 'docs',
          stripLabel: spec.verb.charAt(0).toUpperCase() + spec.verb.slice(1),
          /* Reversible writes get a real window. The two that are not get none
             — offering Undo on a permanent delete is the worst kind of lie a
             receipt can tell. */
          undoSeconds: spec.typed === 'delete' ? 0 : 10,
          onUndo: () => toast('Undone', null, 'Nothing was changed')
        }
      } : null
    });
  }

  /* ═══════════════════════════════════════════════
     GOVERNANCE AND SOURCES, AS CONVERSATIONS

     These used to be a panel above the grid: a slab of facts and controls
     sitting there permanently whether or not anyone had asked. They are not a
     surface — they are the answer to a question about a collection or a source,
     and the canvas is where questions are answered.

     Each one ends in the same structured commit surface it always did.
     Conversation for the judgement, commit for the consequence.
  ═══════════════════════════════════════════════ */
  /* A number stacked over its noun is the same label/value shape as everywhere
     else, and reads as two things. "5 documents" is one. */
  const factRow = (pairs) => `<div class="conv-facts">${pairs.filter(Boolean).map(([v, l]) =>
    `<span class="conv-fact"><strong>${v}</strong> ${esc(l)}</span>`).join('')}</div>`;



  /* ── The settings sheet's contents ──

     Real controls that write as you use them. Every change here is a rung-2
     change — reversible, scoped, and stated on the row it belongs to — so it
     applies on selection with an Undo, and the dialog each one used to open was
     ceremony. The two that are NOT rung 2 keep their confirmation: turning a
     customer-facing agent on, and deleting. */
  const setDropdown = (key, arg, label, rows, cur) => `
    <div class="v2-dropdown k-prop" data-set-key="${esc(key)}" data-set-arg="${esc(arg)}">
      <button class="v2-dropdown-btn" type="button" aria-haspopup="listbox" aria-expanded="false"
              aria-label="${esc(label)}">
        <span class="dd-label-text">${esc(rows.reduce((a, r) => (String(r[0]) === String(cur) ? r[1] : a), '—'))}</span>
        ${ICO.chevron}
      </button>
      <div class="v2-dropdown-panel" role="listbox">
        ${rows.map(([v, l]) => `<div class="v2-dropdown-option${String(v) === String(cur) ? ' selected' : ''}"
          role="option" aria-selected="${String(v) === String(cur)}" data-value="${esc(l)}" data-slug="${esc(v)}">${esc(l)}</div>`).join('')}
      </div>
    </div>`;

  const setRow = (label, control, note) => `
    <div class="set-row">
      <span class="set-label">${esc(label)}</span>
      <div class="set-control">${control}${note ? `<span class="set-note">${note}</span>` : ''}</div>
    </div>`;

  const setChrome = (title, sub) => `
    <div class="doc-bar">
      <span class="doc-bar-crumb">Settings<span class="doc-bar-sep">/</span>${esc(title)}</span>
      <span class="doc-bar-end">
        ${sub ? `<span class="set-sub">${esc(sub)}</span>` : ''}
        <button class="doc-close" data-set-close aria-label="Close settings">
          ${ICO.x.replace('<svg', '<svg width="15" height="15"')}</button>
      </span>
    </div>`;

  function sourceSettings(key) {
    const src = SRC[key];
    const mine = LIVE.filter((o) => o.src === key);
    const behind = mine.filter((o) => o.status === 'outdated');
    const blocked = mine.filter((o) => o.work === 'failed');
    const ok = src.health === 'ok';
    return setChrome(src.label, ok ? 'Connected' : 'Not connected') + `
      <div class="doc-scroll">
        <div class="set-panel">
          <p class="set-lead">${esc(src.note)}.
            ${behind.length ? `${behind.length} document${behind.length === 1 ? ' is' : 's are'} behind what the source now says.`
                            : 'Nothing here is behind its source.'}</p>

          ${factRow([
            [mine.length, 'documents from it'],
            [src.queued ? 'queued' : src.last === 0 ? 'Today' : src.last + 'd ago', 'last successful sync'],
            blocked.length ? [blocked.length, 'ingestion blocked'] : null,
            src.code ? [`<span class="conv-code">${esc(src.code)}</span>`, 'error'] : null
          ])}

          <div class="set-group">
            ${setRow('Sync every', setDropdown('cadence', key, 'Sync schedule',
              SYNC_SCHEDULES.map((x) => [x, x]), src.cadence),
              'How often this source is checked for changes. Between runs a document can be behind what the source says, and it says so when it is.')}
            ${setRow(ok ? 'Run now' : 'Connection',
              ok ? `<button class="btn btn-ghost btn-sm" data-sync-source="${key}">Sync now</button>`
                 : `<button class="btn btn-brand btn-sm" data-reconnect="${key}">Reconnect</button>`,
              ok ? 'Runs once, outside the schedule.' : 'Nothing ingests from here until it is connected.')}
          </div>

          <div class="set-group">
            <span class="conv-label">Recent runs</span>
            <div class="conv-log">
              ${src.history.slice(0, 4).map(([d, st2, note]) => `<div class="conv-log-row">
                <span class="status-dot ${st2 === 'ok' ? 'sd-ok' : st2 === 'warn' ? 'sd-warn' : 'sd-err'}"></span>
                <span class="conv-log-when">${esc(d === 0 ? 'Today' : d + 'd ago')}</span>
                <span class="conv-log-note">${esc(note)}</span></div>`).join('')}
            </div>
          </div>

          <div class="set-foot">
            ${entryAction('direct', 'Show its ' + mine.length + ' documents', `data-open-axis="source:${key}"`)}
          </div>
        </div>
      </div>`;
  }

  function collectionSettings(col) {
    const m = COLLECTION_META[col];
    const live = LIVE.filter((o) => o.col === col);
    const stale = live.filter((o) => o.status === 'outdated' || o.status === 'unused');
    const unowned = live.filter((o) => responsible(o) === 'Unassigned');
    const external = AGENTS.filter((a) => a.external && m.grounding[a.id]);
    return setChrome(COLLECTIONS[col], 'Owned by ' + m.owner) + `
      <div class="doc-scroll">
        <div class="set-panel">
          <p class="set-lead">${stale.length
            ? `${stale.length} of its ${live.length} documents are out of date or unused.`
            : `All ${live.length} are in use and match their sources.`}</p>

          ${factRow([
            [live.length, 'documents'],
            [stale.length, 'out of date or unused'],
            [unowned.length, 'unowned']
          ])}

          <div class="set-group">
            <span class="conv-label">Which agents may answer from this</span>
            <div class="set-checks">
              ${AGENTS.map((a) => `<label class="ds-choice set-check">
                <input type="checkbox" data-set-ground="${a.id}" data-set-col="${col}"
                       ${m.grounding[a.id] ? 'checked' : ''}><span></span>
                <span class="commit-choice-label">${esc(a.name)}${a.external
                  ? '<span class="gov-ext">Customer-facing</span>' : ''}</span>
              </label>`).join('')}
            </div>
            <span class="set-note">Human access and agent grounding are separate permissions. Content a colleague can
            read with judgement is not automatically content an autonomous agent should paraphrase to a customer.</span>
            ${external.length ? `<div class="trust-disclosure">
              <div class="td-row is-warn">${ICO.warn}<span class="td-text"><strong>${external.map((a) => esc(a.name)).join(', ')}
              is customer-facing</strong> and may paraphrase anything here to a customer.</span></div>
            </div>` : ''}
          </div>

          <div class="set-group">
            ${setRow('Auto-archive', setDropdown('retain', col, 'Retention', RETAIN_OPTIONS, m.retain),
              `Counted from a document's last update. Archiving takes it out of answers; it does not delete it, and it
               can be restored. Archived documents are kept <strong>${Math.round(m.purge / 30)} months</strong>
               before they can be deleted for good.`)}
          </div>

          <div class="set-foot">
            ${entryAction('direct', 'Show its ' + live.length + ' documents', `data-open-axis="collection:${col}"`)}
          </div>
        </div>
      </div>`;
  }

  function dataSettings() {
    const cols = USER.collections;
    const auto = cols.filter((c) => COLLECTION_META[c].retain > 0);
    const archived = CORPUS.filter((o) => o.arch);
    return setChrome('Archiving & deleting', archived.length + ' archived') + `
      <div class="doc-scroll">
        <div class="set-panel">
          <p class="set-lead">${auto.length
            ? `<strong>${auto.length} of ${cols.length}</strong> collections archive on their own.`
            : 'No collection archives on its own.'}
            Nothing is ever deleted automatically — retention archives, and archiving is reversible.</p>

          <div class="set-group">
            <span class="conv-label">Auto-archive, per collection</span>
            ${cols.map((c) => setRow(COLLECTIONS[c],
              setDropdown('retain', c, 'Retention for ' + COLLECTIONS[c], RETAIN_OPTIONS, COLLECTION_META[c].retain),
              `Kept ${Math.round(COLLECTION_META[c].purge / 30)} months after archiving.`)).join('')}
          </div>

          <div class="set-group">
            <span class="conv-label">The archive</span>
            <span class="set-note">Delete for good is reachable only from an archived document — you have to have
            archived something and come back for it.</span>
            ${archived.length
              ? `<div class="rs-list">${archived.map((o) => typeCard(o, true)).join('')}</div>`
              : '<p class="set-lead">Nothing is archived.</p>'}
          </div>
        </div>
      </div>`;
  }

  /* A change the input asked for, not yet made. It is shown as a proposal above
     the control it would move, because "I typed it and it happened" and "I typed
     it and I can see what it would do" are different products — and the second
     is the one the rest of this surface is. */
  let stagedSetting = null;

  function stagedBanner() {
    if (!stagedSetting) return '';
    const label = stagedSetting.key === 'cadence'
      ? 'Sync every ' + stagedSetting.value.replace(/^Every /, '').toLowerCase()
      : 'Auto-archive ' + ((RETAIN_OPTIONS.find(([v]) => String(v) === stagedSetting.value) || [0, ''])[1]).toLowerCase();
    return `<div class="set-staged">
      ${AIMY_MARK(13, 15)}
      <span class="set-staged-text">From what you typed: <strong>${esc(label)}</strong>. Nothing has changed yet.</span>
      <span class="set-staged-end">
        <button class="btn btn-ghost btn-sm" data-stage-drop>Discard</button>
        <button class="btn btn-brand btn-sm" data-stage-run>Apply it</button>
      </span>
    </div>`;
  }

  /* One entry point, so the rail, the URL and the input all land in the same
     place holding the same state. */
  function renderSettings(st) {
    const parts = String(st.settings).split(':');
    const kind = parts[0], value = parts[1];
    const html = kind === 'source' && SRC[value] ? sourceSettings(value)
      : kind === 'collection' && COLLECTIONS[value] ? collectionSettings(value)
      : kind === 'data' ? dataSettings()
      : '';
    if (!html) { patch({ settings: '' }, { replace: true }); stagedSetting = null; return; }
    /* The banner sits at the top of the panel, above the control it would move. */
    setModal.show(html.replace('<div class="set-panel">', '<div class="set-panel">' + stagedBanner()), st.settings);
  }

  /* "Find a source for this" is a question about grounding, not a rewrite. It
     asks whether anything in the corpus supports what the document says — which
     is answered with evidence and a set, so it belongs in the canvas. */
  function groundingAnswer(o, passage) {
    const near = LIVE.filter((x) => x.id !== o.id &&
      x.tags.some((tg) => o.tags.indexOf(tg) > -1)).slice(0, 3);
    canvas.close();
    canvas.ask(passage ? 'What supports "' + passage.slice(0, 60) + '"?' : 'What supports ' + o.title + '?',
      [o.title, COLLECTIONS[o.col]].concat(passage ? ['selection'] : []),
      () => `<div class="answer-surface">
        <div class="answer-body">
          <p>${near.length
            ? `${near.length} document${near.length === 1 ? '' : 's'} in the corpus cover${near.length === 1 ? 's' : ''} the same ground. ` +
              `Nothing in ${esc(SRC[o.src].label)} contradicts what this says.`
            : `Nothing else in the corpus covers this. It stands on its own source, and an answer that cites it cites only it.`}</p>
        </div>
        ${near.length ? `<div class="rs-list">${near.map((x) => typeCard(x, true)).join('')}</div>` : ''}
        <div class="trust-disclosure">
          <div class="td-row is-warn">${ICO.warn}<span class="td-text">Overlap is not corroboration. These share tags with it;
          whether they agree is a reading, and the comparison is one click away.</span></div>
        </div>
        <div class="answer-apply">
          ${near.length ? entryAction('investigate', 'Compare with ' + near[0].title,
            `data-set-conflict="${o.id}:${near[0].id}"`) : ''}
          ${entryAction('direct', 'Back to the document', `data-open-doc="${o.id}"`)}
        </div>
      </div>`);
  }

  /* Retention, archiving and deletion, across every collection at once. The
     per-collection conversation can say what one of them does; this is the only
     place that says what the rules add up to — and the only route to the
     archive, which is the only place Delete exists. */

  /* One entry point for both, so the chip, the briefing and a typed question
     all arrive at the same conversation. */



  /* ── The consequential changes the panel offers ── */
  /* The typed confirmation is owed to one specific change — turning a
     customer-facing agent ON — not to opening the form. Gating it on the state
     the collection happens to be in meant you had to type the collection name
     to allow an internal agent, which is a rung-4 ceremony for a rung-3 change
     and teaches people to type past it. It appears when you make the change
     that earns it. */

  /* The sync trigger. This was wired to a function that was never written, so
     "Change schedule" has been throwing since the day it appeared — the button
     was there, the handler was there, and the thing it called was not. */






  /* ═══════════════════════════════════════════════
     NON-HAPPY STATES

     Designed, not discovered. AI-unavailable is the interesting one here: the
     filters, the grid, the viewer and the editor are all plain state reads and
     keep working. Only the parse and the canvas degrade, and the input says so
     rather than silently doing nothing.
  ═══════════════════════════════════════════════ */
  const forcedState = new URLSearchParams(location.search).get('state') || '';

  function renderState(kind) {
    const stage = $('#wbStage');
    if (kind === 'loading') {
      stage.innerHTML = `<div class="ws-grid">${Array.from({ length: 6 }).map(() =>
        `<div class="skeleton-card"><div class="skeleton skeleton-line" style="width:38%"></div>
          <div class="skeleton skeleton-line" style="width:80%;height:15px"></div>
          <div class="skeleton skeleton-line" style="width:64%"></div>
          <div class="skeleton skeleton-line" style="width:52%"></div></div>`).join('')}</div>`;
      return true;
    }
    if (kind === 'error') {
      stage.innerHTML = `<div class="error-state">
        <div class="error-state-icon">${ICO.warn.replace('<svg', '<svg width="20" height="20"')}</div>
        <div class="error-state-title">Could not load</div>
        <div class="error-state-desc">Your filters are intact. Nothing changed — retrying is safe.</div>
        <button class="btn btn-brand btn-sm" data-retry>Retry</button>
      </div>`;
      return true;
    }
    return false;
  }

  function renderAiState() {
    const bar = $('#aimyFloatBar');
    const input = $('#floatInput');
    if (forcedState !== 'ai-down') return;
    if (bar) bar.classList.add('is-degraded');
    if (input) {
      input.placeholder = 'AiMY is unavailable — the filters still work';
      input.disabled = true;
    }
    const tray = $('#floatFilterTray');
    if (tray) tray.classList.add('is-forced');
  }

  /* ═══════════════════════════════════════════════
     RENDER — one entry point, driven by the URL
  ═══════════════════════════════════════════════ */
  /* ══ THE TAB TITLE IS STATE TOO ════════════════════════════════════
     `document.title` was assigned in exactly one place in the whole product
     — the settings page — so on a product whose entire premise is that the
     URL is the state, the one piece of chrome that reports where you are
     never moved. Opening a document, switching conversation, filtering: the
     tab read a static string throughout.

     It names the surface, then what is open on it. Nothing else, because a
     title that carries the filter set is a title nobody can read in a tab
     strip eight tabs wide. */
  function syncTitle() {
    const base = canvas.inline ? 'AiMY' : 'AiMY Console';
    const st = readURL();
    let sub = '';
    const SET = window.AIMY_SETTINGS;
    if (st.m && SET && SET.has(st.m)) {
      const mod = SET.modules.filter((m) => m.id === st.m)[0];
      sub = mod ? mod.name : '';
    }
    else if (!canvas.inline && st.doc && byId(st.doc)) sub = byId(st.doc).title;
    else { const k = threadKey(); if (SESSIONS[k] && !SESSIONS[k].blank) sub = SESSIONS[k].title; }
    document.title = sub ? base + ' \u2014 ' + sub : base;
  }

  /* ══ IS THIS A NEW PLACE, OR THE SAME PLACE ASKED A NARROWER QUESTION? ══
     The whole difference between motion and a strobe is this one answer.

     ALL_KEYS are FILTERS, and `f` is the same thing for a settings module:
     changing one narrows the set you are already looking at, once per 260ms of
     debounce. Dissolving the screen on each of those would be the blink, not
     the cure. Everything else - a module, a document, a tab, a view mode, a
     sort - is a PLACE, and moving between places is exactly what a transition
     is for.

     Built by deleting the filter keys out of the URL the existing serializer
     writes, rather than by listing the place keys here. A second list would
     have to be remembered every time a key is added, and the one that is
     forgotten is the one that silently stops animating. */
  /* ══ SELECTING IS NOT TRAVELLING ═════════════════════════════
     `node`, `role`, `vs` and `who` all name WHICH ONE is chosen on a surface
     that stays exactly where it is: the map, the roles list, the directory.
     Treating them as places meant choosing a node cross-dissolved the entire
     stage in order to move one highlight - a repaint dressed as a transition,
     and disproportionate enough that it reads as the page reloading.

     The test that separates the two is whether the thing you are choosing FROM
     survives the change. It does here. It does not when a skill replaces the
     list with a document, or when the module or the scope changes and the page
     is composed again from different material - those stay places. */
  const QUIET_KEYS = ALL_KEYS.concat(['f', 'node', 'role', 'vs', 'who']);
  let LAST_PLACE = null;
  function placeOf(st) {
    const p = new URLSearchParams(serialize(st));
    QUIET_KEYS.forEach((k) => p.delete(k));
    return p.toString();
  }

  /* ══ ARRIVING SOMEWHERE IS NOT THE SAME AS BEING THERE ═════════════
     There is no network here, so a loading state cannot be observed - it has
     to be DESIGNED, and the two decisions that make it honest rather than
     decorative are both about when NOT to show one.

     Not on a narrowing. A filter change is the set you are already holding,
     asked a smaller question; a skeleton there would claim to be fetching
     something that is already in the room, once per keystroke.

     Not on a return. A place you have been to is a place whose data you have,
     and it is the repeat visits rather than the first that turn a loading
     state into a tax. SEEN is the cache this product would have if it had a
     network to cache against.

     The doctrine this answers to is already written down, in
     AiMY_Knowledge_v2_Design_Direction.md:429 - "Block skeletons render in
     priority order. Blocks appear as they resolve rather than waiting for the
     slowest." The content still arrives in one write, so the ORDER is what
     carries it: each top-level block resolves a beat after the one above,
     which is the priority order the page was already composed in. */
  const SEEN = new Set();
  const LOAD_MS = 420;
  let loadHold = null;

  function skRow(h) { return '<div class="skeleton sk-row" style="--h:' + h + '"></div>'; }

  /* Shaped like the page that is coming, not like a generic box. The chrome -
     a title, a scope line - is identical on every settings module, so that
     half lands exactly where the real one will and does not move when it
     arrives. The rows below it are an approximation, which is what the
     cross-blur on the reveal is for. */
  function stageSkeleton(inSet, isDoc) {
    if (isDoc) {
      return '<div class="sk-doc" aria-hidden="true">'
        + '<div class="skeleton sk-title"></div>'
        + '<div class="skeleton sk-bar"></div>'
        + skRow(7) + skRow(7) + skRow(7) + skRow(4) + '</div>';
    }
    if (inSet) {
      return '<div class="set2-col" aria-hidden="true">'
        + '<div class="skeleton sk-title"></div>'
        + '<div class="skeleton sk-bar"></div>'
        + '<div class="sk-rows">'
        + skRow(3) + skRow(3) + skRow(3) + skRow(3) + skRow(3) + '</div></div>';
    }
    /* The grid already had a skeleton, built at card proportions so the layout
       does not reflow when the real cards land. It has only ever been
       reachable by typing ?state=loading into the address bar. */
    return '<div class="ws-grid" aria-hidden="true">'
      + Array.from({ length: 6 }).map(() =>
        '<div class="skeleton-card"><div class="skeleton skeleton-line" style="width:38%"></div>'
        + '<div class="skeleton skeleton-line" style="width:80%;height:15px"></div>'
        + '<div class="skeleton skeleton-line" style="width:64%"></div>'
        + '<div class="skeleton skeleton-line" style="width:52%"></div></div>').join('')
      + '</div>';
  }

  /* One beat per block, top down. Capped at nine because past that a cascade
     stops being an order and becomes a queue. */
  function resolveBlocks(stage) {
    const col = stage.firstElementChild;
    const list = (col && col.children.length > 1)
      ? Array.prototype.slice.call(col.children)
      : Array.prototype.slice.call(stage.children);
    list.forEach((b, i) => {
      if (i > 8) return;
      b.style.setProperty('--i', String(i));
      b.classList.add('k-resolve');
    });
    /* Second defence, the same one the map keeps. `backwards` already means a
       cancelled or never-started animation leaves the block alone - but a
       clock that FREEZES mid-delay holds it at the first keyframe, six pixels
       low and invisible, for as long as the page is open. setTimeout is
       throttled in a background tab and still fires, so the class comes off
       either way. */
    const M = window.AIMY_MOTION;
    const off = () => list.forEach((b) => b.classList.remove('k-resolve'));
    const ms = (M ? M.ms('--t-base', 250) + 8 * M.ms('--t-stagger', 40) : 570) + 120;
    if (M) M.after(stage, off, { ms: ms }); else setTimeout(off, ms);
  }

  function stageIn(st, inSet, isDoc, paint) {
    const M = window.AIMY_MOTION;
    const stage = $('#wbStage');
    /* A navigation made while one of these is still resolving abandons it.
       Waiting the rest of a fabricated delay for a page nobody is on any more
       is the only thing worse than the delay itself. */
    if (loadHold) { loadHold(); loadHold = null; }
    if (!stage) { paint(); return; }

    const where = placeOf(st);
    const fresh = !SEEN.has(where);
    SEEN.add(where);

    if (!M || !fresh || M.reduced() || M.latency.profile === 'instant') { paint(); return; }

    stage.removeAttribute('data-doc');
    stage.innerHTML = stageSkeleton(inSet, isDoc);
    stage.setAttribute('aria-busy', 'true');
    loadHold = M.latency.hold(LOAD_MS, () => {
      loadHold = null;
      paint();
      stage.removeAttribute('aria-busy');
      resolveBlocks(stage);
    });
  }

  function render() {
    const st = readURL();
    syncTitle();
    /* Every mutation on this surface ends in a paint — that is the design, and
       it is why this is the one hook a store needs rather than a call beside
       each of the fifty things that can change a document. Debounced, and a
       no-op when nothing a person made has changed. */
    scheduleDocSave();

    /* ══ THE GATE HAS NO SURFACE TO RENDER ═════════════════════════════
       No grid, no filter row, no briefing, no document, no settings sheet.
       Everything above the last two statements of this function addresses an
       element that does not exist on that page, and `$('#wbStage')` is the
       one that does not merely no-op — it returns null and throws.

       That mattered more than it looks: `patch()` calls `render()`, and
       `canvas.ask` calls `patch()` to attach a new conversation to the URL.
       So the throw landed BETWEEN starting a session and pushing the first
       turn — the address bar gained a `?chat=` and the question itself was
       never appended. A conversation that exists and is empty.

       What still has to run is the pair at the bottom: a live answer re-runs
       so it never trails the model it describes, and the conversation list
       follows the URL. */
    if (canvas.inline) { canvas.repaint(); paintChats(); return; }

    const place = placeOf(st);
    /* The first paint of a session is an arrival, not a move. Dissolving into
       it would mean dissolving out of a blank page. */
    const moved = LAST_PLACE !== null && LAST_PLACE !== place;
    LAST_PLACE = place;

    /* The mutation runs INSIDE the callback, asynchronously, which is the one
       thing a caller of render() has to know: anything that must read the DOM
       afterwards belongs in paintStage, not after this line. There is nothing
       after this line for exactly that reason. */
    const M = window.AIMY_MOTION;
    if (M && moved) M.swap(() => paintStage(st));
    else paintStage(st);
  }

  function paintStage(st) {
    /* Before anything reads them. The corpus cannot move during a paint, so the
       findings are computed once and every card, the rail and the bell read the
       same answer. */
    dropInsights();
    renderBrief(st);
    /* The bell is derived state like the rail, so it repaints with it rather
       than being told by whoever happened to change the corpus. */
    bell.sync();
    renderFilters(st);
    renderChips(st);

    if (forcedState === 'loading' || forcedState === 'error') { renderState(forcedState); return; }

    /* One stage. A document is a page now, so it renders INSTEAD of the grid
       rather than over it — a modal has no room for a rail, and a document
       with its facts, its connections, its history and its comments needs one.
       The filter state is untouched in the URL, so closing returns to exactly
       the surface you left. */
    /* A document is a page, so it gets the window. The briefing rail is about
       what changed on the workbench since your last visit; while you are
       reading one document it is 268px of something else, and the measure the
       body needs is worth more than it. */
    /* ══ THREE STAGES, ONE AT A TIME ═══════════════════════════════════
       Grid, document, settings. Settings arrived last and takes the same deal
       the document already had: it renders INSTEAD of the grid, in the stage
       the grid was using, so the chrome never moves and the filter state sits
       untouched in the URL waiting for you to come back to it.

       `inSet` is false when AIMY_SETTINGS has not loaded — a module id in the
       address bar with no script to render it should fall through to the grid
       rather than paint an empty column. */
    const SET = window.AIMY_SETTINGS;
    /* The document wins. Both want the stage; the one you opened LAST is the
       one you are looking at, and a module is a place you can still be
       standing in behind it. */
    const isDocNow = !!(st.doc && byId(st.doc));
    const inSet = !isDocNow && !!(st.m && SET && SET.has(st.m));
    document.body.classList.toggle('is-settings', inSet);
    /* Settings hides the filter bar because a module has no working set to
       describe. Archive is the exception that proves it: it IS a working set,
       drawn with the same cards and narrowed by the same controls. */
    document.body.classList.toggle('is-archive', inSet && st.m === 'archive');

    const isDoc = isDocNow;
    document.body.classList.toggle('is-doc', isDoc);
    /* Opening a document hides the rail at every width, so a drawer still open
       over it would be presenting a surface the layout has withdrawn — and its
       toggle goes with it, leaving nothing on screen to close it with. */
    if (isDoc && drawers.rail) drawers.rail.close();
    /* The three stages, unchanged - and behind stageIn, which decides whether
       this paint is an arrival worth showing a skeleton for or a surface you
       are already standing on. */
    const paintNow = () => {
      if (inSet) {
        $('#wbStage').removeAttribute('data-doc');
        $('#wbStage').innerHTML = SET.body(st);
        SET.painted();
      }
      else if (isDoc) { renderDoc(st); }
      else { $('#wbStage').removeAttribute('data-doc'); renderGrid(st); }
    };
    stageIn(st, inSet, isDoc, paintNow);

    if (st.settings) renderSettings(st);
    else if (setModal.open) setModal.close();



    /* The thread is part of the surface, not a transcript beside it. */
    canvas.repaint();
    /* And so is the list of them: which conversation is current, and how many
       turns it holds, both move with the URL. */
    paintChats();
  }

  /* ═══════════════════════════════════════════════
     THE INPUT HANDLER — where the four routes actually diverge
  ═══════════════════════════════════════════════ */
  function submit(text) {
    const st = readURL();

    /* ══ THE GATE ANSWERS, AND ONLY ANSWERS ════════════════════════════
       The four routes below exist because the Console has a surface to steer:
       filters to set, a document to open in place, a write to stage. The gate
       has none of those, so classifying a sentence by its shape there would
       send half of what people type into a route with nowhere to land — a
       typed title would try to open a document on a page with no grid.

       One route, no `parseIntent`. This is what "answers in place, no surface
       manipulation" means in code. */
    if (canvas.inline) {
      if (!String(text || '').trim()) return;
      /* `answerFor` always returns — `noGroundingAnswer` is its floor — so this
         catches a genuine fault rather than an unrecognised question. The
         Console can afford to let one throw: it has a grid, a rail and a
         document still on screen behind the canvas. The gate is the
         conversation, so a thrown answer here would leave the thinking dots
         spinning forever with nothing else to look at. */
      let answer;
      try {
        answer = answerFor(text, st);
      } catch (err) {
        answer = '<div class="gate-error">That answer could not be assembled. '
               + 'The question reached the corpus — something went wrong turning the result into prose. '
               + 'Asking it a different way usually clears it.</div>';
      }
      canvas.ask(text, null, answer);
      return;
    }

    /* ══ A GREETING IS NOT ONE OF THE FOUR ROUTES ══════════════════════
       The gate branch above answers everything, so `hi` was already greeted
       there. Here it went to `parseIntent`, which had nowhere to put it: not
       a write, not a settings phrase, not a document title, and carrying no
       filter tokens and no question shape. It fell past all four routes, the
       composer cleared itself, and nothing appeared — the input swallowed the
       word and gave no sign it had.

       Routed before the classifier rather than added as a fifth route,
       because the four routes are all about steering a surface and this one
       is not about the surface at all. */
    if (GREETING.test(text)) { canvas.ask(text, null, greetAnswer()); return; }

    const intent = parseIntent(text);
    if (intent.route === 'empty') return;

    /* ── Reviewed: a write is staged, never run ── */
    if (intent.route === 'write') { runWrite(intent, st); return; }

    /* ── Settings: the sheet, with the change staged, never applied ── */
    if (intent.route === 'settings') {
      stagedSetting = intent.stage;
      patch({ settings: intent.target });
      return;
    }

    /* ── Direct: a known title opens its document. No generation, no canvas ── */
    if (intent.route === 'object') {
      patch({ doc: intent.id });
      toast('Opened “' + byId(intent.id).title + '”', null, 'Named exactly — nothing was generated');
      return;
    }

    /* ── Filters always apply, and a question always answers ──

       The two are not alternatives. A sentence carrying both — "expired ICPs,
       why did they lapse?" — narrows the surface AND answers within what it
       narrowed to. A sentence carrying only filter tokens narrows and stops. A
       sentence carrying only a question answers, and the surface becomes the
       sources that answer stands on. */
    const set = intent.set || {};
    let hasFilters = Object.keys(set).some((k) => k !== 'q') || (set.q && intent.route === 'filter');

    /* One exception, and it is the Notion-AI case: while a document is open, a
       question is about THAT document. The words it happens to share with the
       lexicon are not a request to re-filter — acting on them would close what
       you are reading and pull the ground out from under the question. An
       explicit filter phrase still filters; a question does not. */
    const reading = st.doc && intent.route === 'question';
    if (reading) hasFilters = false;

    if (hasFilters) applyTyped(set, text);

    if (intent.route === 'question') {
      /* The scope the answer is judged against is the scope that was just set,
         not the one that was there a moment ago. */
      const scoped = hasFilters ? readURL() : st;
      canvas.ask(text, scopeBasis(scoped), answerFor(text, scoped), { autoSurface: !hasFilters && !reading });
    }
  }

  /* Writes a parsed filter set into the URL. What AiMY understood shows up in
     the filter controls lighting up — there is nothing to restate underneath
     them.

     A typed phrase REPLACES the filter state; it does not add to it. A sentence
     is a statement of what you want to see, and merging it into whatever was
     there before produces a view nobody asked for and cannot read back. The
     controls and the chips are the incremental way in. */
  function applyTyped(set, text) {
    const next = readURL0();
    let matched = 0;
    Object.keys(set).forEach((k) => {
      const v = set[k];
      if (LIST_KEYS.indexOf(k) > -1)        { next[k] = v.slice(); matched++; }
      else if (k === 'q')                   { next.q = v; }
      else if (FLAG_KEYS.indexOf(k) > -1)   { next[k] = true; matched++; }
      else                                  { next[k] = v; matched++; }
    });
    /* Nothing recognised: keep it as a search rather than clearing the surface
       and calling that a result. */
    if (!matched && !set.q) next.q = text;
    next.doc = ''; next.mode = 'view';
    rememberFilter();
    writeURL(next);
  }

  /* ═══════════════════════════════════════════════
     WIRING — delegated, no inline handlers
  ═══════════════════════════════════════════════ */
  const DEMO = {
    filter:   'expired ICPs updated this year',
    object:   'Refund eligibility — EU customers',
    question: 'Can EU customers get a refund after activating?',
    write:    'archive all of these',
    settings: 'sync confluence hourly'
  };

  /* ── The prototype panel ──

     Built from the live corpus, not hard-coded. Every condition this product
     designs for — a document nothing has cited in a year, one whose source is
     down, one marked superseded with no replacement recorded — is real in the
     fixtures but tedious to reach by clicking, and those are exactly the
     screens worth looking at in a review. A link that cannot resolve is not
     rendered, so nothing here leads nowhere either. */
  function protoFirst(fn) {
    const o = (ENTITLED.filter(fn) || [])[0];
    return o ? o.id : '';
  }

  /* ── Filtering, now that the row is three ──

     Eleven axes left the filter row on the argument that the input already
     speaks them. That argument is invisible until somebody types one, and the
     people reviewing this prototype are exactly the people who do not know the
     vocabulary yet — so the examples are here, where the rest of the
     hard-to-reach conditions are.

     Each one is a phrase that reaches axes with NO control left: status,
     source, region, service, audience. Two of them name Client and Product as
     well, which have controls again — they stay because the lesson is that the
     control and the sentence are one vocabulary, not two. Running one fills the
     input; pressing Enter narrows the set and puts the axes on the chip bar,
     which is the whole route in one move. Run two or three and the rail starts
     listing them under Recent filters.

     Self-checking, because the panel's rule is that a link which cannot resolve
     is not rendered. A phrase is offered only if it still PARSES and still
     MATCHES something: three of the eight I first wrote parsed perfectly and
     returned an empty grid, which demonstrates the parser and teaches nothing.
     If a fixture changes underneath one, it stops being offered rather than
     becoming a demo of the empty state — there is already one of those. */
  const FILTER_DEMOS = [
    'unowned documents from freshdesk',
    'quality assurance in emea',
    'stakeholder success stories in apac',
    'blogs updated last month',
    'client-facing articles for nordwind',
    'conflicting tickets from freshdesk',
    'copilot presentations',
    'archived'
  ];

  function protoFilters() {
    return FILTER_DEMOS.filter((phrase) => {
      const f = parseFilters(phrase);
      if (!f.matched) return false;
      /* Applied against a state built the way readURL builds one, so what is
         counted here is exactly what pressing Enter would show. */
      const st = parseParams(new URLSearchParams(''));
      Object.keys(f.set).forEach((k) => { st[k] = f.set[k]; });
      return applyFilters(st).length > 0;
    }).slice(0, 5).map((phrase) => [phrase, 'fill:' + phrase]);
  }

  /* ── One button per filter the model declares ──

     The five phrases above teach the input. These are the other question a
     review asks: does every axis in the data model actually FILTER, and can I
     see it doing it? Nine of them have no control on the surface any more,
     and two of the ones that did turned out never to have worked at all —
     `work` and `trust` moved a URL parameter nothing consumed, for as long as
     anybody had been clicking them.

     So each of these goes straight to a URL rather than through the input: the
     phrase route is demonstrated above, and what is being demonstrated here is
     the KEY. Every one carries a live value taken from the corpus, so a button
     cannot outlive the fixture it was written against.

     `ids` is the one nothing else can reach. It is how an answer puts its own
     sources on the surface — AiMY retrieves, then the set becomes what it
     retrieved — and it is exclusive by design, so it is worth being able to
     look at without asking a question first. */
  function protoAxes() {
    const first = (list) => (list && list.length ? list[0] : '');
    const someTag = first((ENTITLED.find((o) => !o.arch && o.tags.length) || {}).tags);
    const someSvc = first((ENTITLED.find((o) => !o.arch && o.services.length) || {}).services);
    const anIcp   = ENTITLED.find((o) => !o.arch && o.t === 'icp');
    const aStory  = ENTITLED.find((o) => !o.arch && o.t === 'story' && o.client);
    const answer  = ENTITLED.filter((o) => !o.arch).slice(0, 3).map((o) => o.id);

    return [
      ['type', 'url:?type=icp'],
      ['tags', someTag ? 'url:?tag=' + encodeURIComponent(someTag) : ''],
      ['source', 'url:?source=freshdesk'],
      ['client', aStory ? 'url:?client=' + aStory.client : ''],
      ['product', 'url:?product=copilot'],
      ['region', anIcp ? 'url:?region=' + anIcp.region : ''],
      ['service', someSvc ? 'url:?service=' + encodeURIComponent(someSvc) : ''],
      ['updated at', 'url:?updated=30d'],
      ['ingested at', 'url:?ingested=90d'],
      ['external updated at', 'url:?extUpdated=90d'],
      ['external created at', 'url:?extCreated=1y'],
      /* Title and content, one word each, so the two halves of the research's
         Search node are visibly separate things. */
      ['search — a title', 'url:?q=' + encodeURIComponent('proration')],
      ['search — inside the content', 'url:?q=' + encodeURIComponent('goodwill credit')],
      ['by document ids', answer.length ? 'url:?ids=' + answer.join(',') : '']
    ];
  }

  function protoGroups() {
    const deadSrc = Object.keys(SRC).find((k) => k !== 'upload' && SRC[k].health !== 'ok');
    const superseded = protoFirst((o) => !o.arch && o.status === 'superseded' && !(RELATED[o.id] || {}).supersededBy);
    const anySuperseded = protoFirst((o) => !o.arch && o.status === 'superseded');

    return [
      ['Input routes', 'Fills the input. Press Enter to run it.', [
        ['filter', 'demo:filter'], ['a document', 'demo:object'],
        ['a question', 'demo:question'], ['a write', 'demo:write'],
        ['settings', 'demo:settings']
      ]],
      ['Filtering without the controls', 'Fills the input. Press Enter. Two or three of these and the rail starts listing them.',
        protoFilters()],
      ['Every filter the model has', 'Goes straight there. One per axis, on a value taken from the corpus.',
        protoAxes()],
      ['A document in each state', 'Opens one that really is in that state.', [
        ['out of date', 'doc:' + protoFirst((o) => !o.arch && o.status === 'outdated')],
        ['conflicting', 'doc:' + protoFirst((o) => !o.arch && o.status === 'conflicting')],
        ['superseded, unlinked', 'doc:' + superseded],
        ['superseded', superseded ? '' : 'doc:' + anySuperseded],
        ['unused', 'doc:' + protoFirst((o) => !o.arch && o.status === 'unused')],
        ['unowned', 'doc:' + protoFirst((o) => !o.arch && o.status === 'unowned')],
        ['a draft', 'doc:' + protoFirst((o) => !o.arch && o.status === 'draft')],
        ['archived', 'arch:' + protoFirst((o) => o.arch)]
      ]],
      ['Surfaces', '', [
        /* No "editor" any more: a document is one surface, so opening one IS
           opening the editor. */
        ['a document', 'doc:' + protoFirst((o) => !o.arch && responsible(o) === USER.owner)],
        ['new document', 'new:1'],
        ['settings — a source', 'set:source:' + (deadSrc || 'confluence')],
        ['settings — a collection', 'set:collection:' + USER.collections[0]],
        ['settings — archiving', 'set:data'],
        ['the canvas', 'canvas:1'],
        ['a peek', 'peek:client:nordwind']
      ]],
      /* Two states you cannot reach by clicking, because they only exist once
         somebody overrules the computation — and they are the ones with the
         most design in them: both open a picker rather than a destination. */
      ['Make a condition', 'Sets the status by hand, as a person would.', [
        ['superseded, nothing linked', 'mk:superseded'],
        ['conflicting, nothing linked', 'mk:conflicting']
      ]],
      /* ── Every surface that can be empty, reachable ──

         An empty state is the hardest thing in a prototype to look at, because
         the fixtures are built to be full and nothing in the product will take
         you there. Each of these forces the REAL condition — mutating the
         corpus where it has to — rather than faking the markup, so what you see
         is what a person would see. "Reload the fixtures" undoes all of it. */
      ['Empty states', 'Forces the real condition. Reload the fixtures to undo.', [
        ['no results', 'url:?q=zzzzzz'],
        ['no folders', 'url:?q=zzzzzz&view=tree'],
        ['nothing archived', 'mt:archive'],
        ['nothing needs a person', 'mt:brief'],
        ['nothing left to connect', 'mt:connected'],
        ['no connections', 'mt:noedges'],
        ['no comments', 'mt:nocomments'],
        ['a blank document', 'new:1'],
        ['an empty library', 'mt:library']
      ]],
      ['Non-happy states', '', [
        ['loading', 'url:?state=loading'],
        ['error', 'url:?state=error'],
        ['AI down', 'url:?state=ai-down']
      ]],
      ['This URL is the whole state', '', [
        ['copy it', 'copy:1'],
        ['clear filters', 'url:?'],
        ['reload the fixtures', 'reload:1']
      ]]
    ];
  }

  function renderProto() {
    const host = $('#protoPanel');
    if (!host) return;
    host.innerHTML = protoGroups().map(([label, note, items]) => {
      /* A row whose target did not resolve is dropped rather than rendered
         dead — the same rule the product holds itself to. */
      const live = items.filter(([, go]) => go && !/:$/.test(go));
      if (!live.length) return '';
      return `<div class="proto-group">
        <span class="proto-group-label">${esc(label)}</span>
        ${note ? `<span class="proto-group-note">${esc(note)}</span>` : ''}
        <div class="proto-links">
          ${live.map(([text, go]) => `<button class="proto-link" data-proto="${esc(go)}">${esc(text)}</button>`).join('')}
        </div>
      </div>`;
    }).join('');
  }

  function protoRun(go) {
    const i = go.indexOf(':');
    const kind = go.slice(0, i), arg = go.slice(i + 1);
    const fb = $('#floatInput');

    if (kind === 'demo') { if (fb) { fb.value = DEMO[arg]; fb.focus(); } return; }
    /* Same as `demo:`, minus the lookup: a filter example IS its phrase, so
       keeping it in a DEMO table would mean maintaining the same string twice
       and letting the two drift. */
    if (kind === 'fill') { if (fb) { fb.value = arg; fb.focus(); } return; }
    if (kind === 'doc')  { patch({ doc: arg }); return; }
    if (kind === 'edit') { patch({ doc: arg }); return; }
    if (kind === 'arch') { patch({ archived: true, doc: arg }); return; }
    if (kind === 'set')  { patch({ settings: arg }); return; }
    /* A deep link can name the kind now that the button can. Unknown or absent
       still lands on an article, which is what newDocument would do anyway. */
    if (kind === 'new')  { newDocument(TYPES[arg] ? arg : 'article'); return; }
    if (kind === 'canvas') { canvas.show(['Prototype']); return; }
    if (kind === 'peek') {
      const [k, v] = arg.split(':');
      openPeek(k, v, $('#protoToggle'));
      return;
    }
    if (kind === 'url')  { location.search = arg.replace(/^\?/, ''); return; }
    if (kind === 'reload') { location.href = location.pathname; return; }
    if (kind === 'mk') {
      /* A plain document with nothing recorded either way, so the picker really
         does have nothing to go on — which is the case being demonstrated. */
      const o = ENTITLED.filter((x) => !x.arch && x.status === 'current' &&
        !(RELATED[x.id] || {}).supersededBy && !((RELATED[x.id] || {}).contradicts || []).length)[0];
      if (!o) { toast('Nothing plain enough left', null, 'Reload the fixtures and try again'); return; }
      o.statusSet = arg;
      o.statusBy = USER.owner;
      recompute();
      patch({ doc: o.id });
      markCard(o.id);
      toast('Set to ' + STATUS[arg].label, 'Undo', esc(o.title) + ' · nothing is linked to it');
      undoStack = () => { delete o.statusSet; delete o.statusBy; recompute(); render(); };
      return;
    }
    /* ── Emptying something, for real ──

       Each of these changes the data the surface reads, so the surface is
       genuinely in the state rather than being told to look like it. */
    if (kind === 'mt') {
      /* `location.href` would reload, and a reload re-runs the fixtures — which
         would put back the very thing these triggers just took away. Every one
         of them has to stay inside the session. */
      if (arg === 'archive') {
        CORPUS.forEach((o) => { o.arch = false; });
        recompute();
        patch({ archived: true, doc: '' });
        return;
      }
      if (arg === 'library') {
        /* Everything gone. The one state a corpus of 42 fixtures can never
           reach on its own, and the first thing a new customer sees. */
        [CORPUS, LIVE, ENTITLED].forEach((a) => { a.length = 0; });
        EDGES.length = 0;
        ASKED.length = 0;
        USER.recent = [];
        recompute();
        patch({ archived: false, doc: '' });
        render();
        return;
      }
      if (arg === 'brief') {
        /* needsYou() reports failing sources, out-of-date and unused documents,
           AiMY's drafts, conflicts and unanswered questions. All of them have to
           be false at once for the band and the bell to have nothing to say,
           which is a rare morning and a perfectly ordinary one. */
        CORPUS.forEach((o) => { o.statusSet = 'current'; o.statusBy = USER.owner; });
        Object.keys(SRC).forEach((k) => { SRC[k].health = 'ok'; });
        USER.recent = [];
        ASKED.length = 0;
        lastFilter = null;
        recompute();
        render();
        toast('Nothing needs a person', null, 'Everything current, every source healthy');
        return;
      }
      const o = byId(readURL().doc) || ENTITLED.filter((x) => !x.arch && responsible(x) === USER.owner)[0];
      if (!o) { toast('Nothing to work with', null, 'Reload the fixtures'); return; }
      if (arg === 'connected') {
        /* Connected to everything, so there is nothing left to pick. */
        LIVE.forEach((x) => { if (x.id !== o.id) assertEdge(o.id, x.id, 'related'); });
        recompute();
        patch({ doc: o.id });
        toast('Connected to everything', null, 'Open Connect it to documents');
        return;
      }
      if (arg === 'noedges') {
        for (let i = EDGES.length - 1; i >= 0; i--) {
          if (EDGES[i].from === o.id || EDGES[i].to === o.id) EDGES.splice(i, 1);
        }
        recompute();
        patch({ doc: o.id });
        return;
      }
      if (arg === 'nocomments') {
        o.comments = [];
        patch({ doc: o.id });
        return;
      }
      return;
    }
    if (kind === 'copy') {
      const url = location.href;
      const done = () => toast('URL copied', null, 'Paste it anywhere — it rebuilds this exact surface');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, () => toast('Copy it from the address bar', null, url));
      } else {
        toast('Copy it from the address bar', null, url);
      }
    }
  }

  const proto = {
    open: false,
    toggle(next) {
      const panel = $('#protoPanel'), btn = $('#protoToggle');
      if (!panel || !btn) return;
      this.open = next === undefined ? !this.open : next;
      if (this.open) renderProto();
      panel.hidden = !this.open;
      btn.setAttribute('aria-expanded', String(this.open));
      $('#proto').classList.toggle('is-open', this.open);
    }
  };

  /* ══════════════════════════════════════════════════════════════
     THE DRAWERS

     Two surfaces used to be deleted on a narrow screen: the briefing rail
     below 1040px, and the canvas's conversation column below 900px, both by
     `display: none`. Neither is decoration — the rail IS this product's
     information architecture, and the column is the only way to reach a
     different conversation. A layout that cannot change size can only change
     what it drops, and dropping those two is dropping the product's two
     entry points.

     They are drawers now. The CSS does the showing; this does the state, and
     the four things a drawer owes you beyond opening:

       · Escape closes it, and only it — the guard checks `open` first, so this
         does not eat the Escape that closes the canvas or the block menu.
       · Focus goes in on open and comes back to the button on close. A drawer
         you can open from the keyboard and not read from it is worse than no
         drawer.
       · Acting on a row closes it. Every item in the briefing is a FILTER
         LINK — it sets the surface's state rather than navigating — so leaving
         the drawer covering the result you just asked for hides the answer.
       · Widening past the breakpoint closes it. Otherwise `is-open` survives
         into a layout where the rail is a column again and the scrim is still
         over the page, with nothing left on screen to dismiss it.
  ══════════════════════════════════════════════════════════════ */
  function makeDrawer(cfg) {
    const btn = $(cfg.btn);
    const panel = $(cfg.panel);
    if (!btn || !panel) return null;

    /* Declared before `d` so `set()` can consult it on every open. */
    const mq = window.matchMedia(cfg.media);

    const d = {
      open: false,
      /* What had focus before the drawer took it. */
      returnTo: null,
      set(next) {
        const want = next === undefined ? !this.open : !!next;
        if (want === this.open) return;
        /* A drawer cannot be opened at a width where it is not a drawer. The
           listener below closes it on the way up, and this refuses to open it
           on the way down — two guards, because the listener depends on the
           browser firing a media-query change and this one does not. */
        if (want && !mq.matches) return;
        this.open = want;
        cfg.apply(want);
        btn.setAttribute('aria-expanded', String(want));
        btn.setAttribute('aria-label', want ? cfg.labelClose : cfg.labelOpen);
        if (want) {
          /* Where focus goes back to. `document.activeElement` is <body> when
             the drawer was opened by anything other than a real click on the
             button — a keyboard shortcut, a programmatic open — and returning
             focus to <body> is the same as dropping it. The button is always a
             correct answer, so it is the fallback. */
          const prev = document.activeElement;
          this.returnTo = (prev && prev !== document.body) ? prev : btn;
          /* A closed drawer is `visibility: hidden`, and a hidden element does
             not take focus. The class has landed but the style has not been
             recomputed yet, so force it — the same `void el.offsetWidth` this
             file already uses to make a class change take effect immediately.
             rAF would also work in a live tab and does NOT work in one that is
             not compositing frames, which is a real state (a background tab)
             and not only a test rig. */
          void panel.offsetWidth;
          const first = panel.querySelector('button, a[href], input, [tabindex]:not([tabindex="-1"])');
          (first || panel).focus({ preventScroll: true });
        } else if (this.returnTo && document.contains(this.returnTo)) {
          this.returnTo.focus({ preventScroll: true });
          this.returnTo = null;
        }
      },
      /* `returnFocus: false` for the one caller that must not take focus back
         — an outside click, where the browser is already moving focus to
         whatever was pressed and pulling it to the toggle would fight it. */
      close(returnFocus) {
        if (returnFocus === false) this.returnTo = null;
        this.set(false);
      }
    };

    btn.addEventListener('click', (e) => { e.stopPropagation(); d.set(); });

    /* Acting on a row is the end of the drawer's job — but only ACTING.

       A control carrying `aria-expanded` is a DISCLOSURE: it reveals more of
       this panel rather than doing something to the page behind it. The rule
       used to be "any button closes it", and the settings rail's module
       headers are precisely the counter-example — `data-rail-x` opens a group
       and changes no page — so on a phone the drawer shut in the same frame
       the group expanded. You tapped People, its pages appeared, and the panel
       slid away over them before you could reach one. Reopening showed the
       group correctly open, which is why it read as the drawer closing *too
       early* rather than as a broken toggle.

       Stated on `aria-expanded` and not on `[data-rail-x]`, because it is the
       general fact: a disclosure inside a drawer is never a reason to leave
       it, and the next one somebody adds gets this for free. It also covers a
       menu button, where closing the drawer would shut the menu the tap just
       opened. */
    panel.addEventListener('click', (e) => {
      const hit = e.target.closest('button, a[href]');
      if (!hit) return;
      if (hit.hasAttribute('aria-expanded')) return;
      d.close();
    });

    /* ── Pressing the page closes it ──

       The scrim answered this for the area it covers, and it deliberately does
       NOT cover the topbar — the toggle lives up there and has to stay live.
       So the top 60px of a phone screen was the one place you could press with
       the drawer open and have nothing happen, and it is the strip a thumb
       reaches for first.

       CAPTURE phase, and that is the whole of the rule. In the bubble phase the
       surface's own handler has already run, and several of them re-render the
       panel — the settings rail replaces its innerHTML on every click — so
       `e.target` is detached by the time this sees it, `panel.contains` says
       false, and the drawer would close on exactly the taps it must survive.
       Capture runs before any of that, while the DOM still says where the
       click landed.

       The toggle is exempt explicitly rather than by its `stopPropagation`,
       which is a bubble-phase fact and has not happened yet down here. */
    document.addEventListener('click', (e) => {
      if (!d.open) return;
      if (panel.contains(e.target) || btn.contains(e.target)) return;
      /* If the press landed on something focusable the browser has already put
         focus there, so the drawer leaves it alone. A scrim is not focusable,
         and there the toggle is still the right place to come back to. */
      const onControl = e.target.closest &&
        e.target.closest('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      d.close(!onControl);
    }, true);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && d.open) { e.stopPropagation(); d.close(); }
    });

    /* A drawer is a narrow-screen shape. Above the breakpoint it is a column
       again, and an `is-open` left behind would leave the scrim over a page
       with nothing on it to dismiss.

       Above the breakpoint the CSS is already neutral — `.app-sidebar.is-open`
       says nothing there and `.rail-scrim` is `display: none` — so a stale
       class cannot leak visually even if this never runs. It runs to keep the
       STATE honest: aria-expanded, and what the drawer does on the way back
       down. */
    const onChange = () => { if (!mq.matches) d.close(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);

    return d;
  }

  const drawers = {
    rail: null,
    chats: null,
    init() {
      const scrim = $('#railScrim');
      this.rail = makeDrawer({
        btn: '#railToggle',
        panel: '#appSidebar',
        media: '(max-width: 1040px)',
        labelOpen: 'Open the briefing',
        labelClose: 'Close the briefing',
        apply(on) {
          $('#appSidebar').classList.toggle('is-open', on);
          if (scrim) scrim.classList.toggle('is-open', on);
        }
      });
      if (scrim && this.rail) scrim.addEventListener('click', () => drawers.rail.close());

      this.chats = makeDrawer({
        btn: '#ovChatsToggle',
        panel: '#overlayChats',
        media: '(max-width: 900px)',
        labelOpen: 'Show conversations',
        labelClose: 'Hide conversations',
        /* One class on the overlay still drives both the column and its scrim
           — `.aimy-overlay.chats-open` is what the CSS keys off for each — so
           this stays a single toggle rather than growing a second handle the
           way the rail needed. */
        apply(on) { $('#aimyOverlay').classList.toggle('chats-open', on); }
      });
      /* And pressing the dimmed thread shuts it, which is the gesture the rail
         drawer's scrim already answers. */
      const ovScrim = $('#ovChatsScrim');
      if (ovScrim && this.chats) ovScrim.addEventListener('click', () => drawers.chats.close());
    },
    /* Opening a document hides the rail at every width, so a drawer left open
       over it would be showing a surface the layout has already withdrawn. */
    closeAll() {
      if (this.rail) this.rail.close();
      if (this.chats) this.chats.close();
    }
  };

  function wire() {
    /* The beams are hung now, at rest. Made on the first answer instead, the
       element and the class would arrive in the same frame, no style would ever
       have been computed for opacity 0, and the first beam of the session would
       snap on where every one after it faded. */
    generating.paint();

    /* Submit */
    const fb = $('#floatInput');
    if (fb) fb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); const v = fb.value.trim(); fb.value = ''; submit(v); }
    });
    const fs = $('#floatSend');
    if (fs) fs.addEventListener('click', () => {
      if (generating.on) { generating.cancel(); return; }
      const v = fb.value.trim(); fb.value = ''; submit(v);
    });

    /* The canvas input runs the same router as the float bar. Typing a filter
       phrase here narrows the surface behind the glass rather than being read
       as a question about nothing — one input contract, two places to reach it. */
    const oi = $('#overlayInput');
    if (oi) oi.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const v = oi.value.trim();
        if (!v) return;
        oi.value = '';
        submit(v);
      }
    });
    const os = $('#overlaySend');
    if (os) os.addEventListener('click', () => {
      if (generating.on) { generating.cancel(); return; }
      const v = oi.value.trim();
      if (!v) return;
      oi.value = '';
      submit(v);
    });

    /* The browser's own back button is a way out of a document too, and it is
       the one the guard cannot intercept before the fact: the address has
       already changed by the time we hear about it. So it is put back, the
       question is asked over the document still on screen, and the answer
       replays the navigation. */
    window.addEventListener('popstate', () => {
      const target = location.pathname + location.search;
      const o = dirtyDoc();
      if (o && readURL().doc !== o.id) {
        history.pushState(null, '', hereURL);
        guardLeave(() => { hereURL = target; history.pushState(null, '', target); render(); });
        return;
      }
      hereURL = target;
      render();
    });

    /* Closing the tab is the one exit this page does not own. The browser's
       own prompt is all there is, and it is worth having: the alternative is
       a round of edits that vanishes without ever having been offered. */
    window.addEventListener('beforeunload', (e) => {
      if (!dirtyDoc()) return;
      e.preventDefault();
      e.returnValue = '';
    });

    /* Property dropdowns in the editor write straight to the object. `dd:change`
       reports the label, so the machine value is read off the option the
       component marked selected. These are the last `.v2-dropdown`s that write
       anything — the filter row's went when its axes learned to take a set. */
    document.addEventListener('dd:change', (e) => {
      const dd = e.target.closest('.v2-dropdown[data-prop-key]');
      if (!dd) return;
      const o = byId(readURL().doc);
      if (!o) return;
      const key = dd.getAttribute('data-prop-key');
      const opt = dd.querySelector('.v2-dropdown-option[aria-selected="true"]');
      const val = opt ? (opt.dataset.slug || '') : '';
      /* The override is the one property that is not just a field: clearing it
         hands the document back to the computation, and setting it records who
         did so. Same path chat uses. */
      if (key === 'statusSet') {
        if (val) { o.statusSet = val; o.statusBy = USER.owner; }
        else { delete o.statusSet; delete o.statusBy; }
        repaintEditor();
        return;
      }
      /* Taken before the write, because `o[key] = val` is what makes o.t the
         NEW type and the swap needs to know which record it is putting away. */
      const wasType = o.t;
      /* Owner goes through the same accessor the byline reads, so an ingested
         document's row writes the assignee rather than an `owner` field the
         display would then ignore. */
      if (key === 'owner') setResponsible(o, val);
      /* The type's own bag, addressed by the same `x.` prefix the trigger
         was built with. */
      else if (key.slice(0, 2) === 'x.') { o.x = o.x || {}; o.x[key.slice(2)] = val; }
      else o[key] = val;
      /* Changing the type changes which record the document draws, so the bag
         is SWAPPED for the new type's rather than merged under it. switchType
         repaints and reports; there is nothing to do after it. */
      if (key === 't' && o.t !== wasType) { switchType(o, wasType); return; }
      repaintEditor();
    });

    /* ── The settings sheet's controls ──

       These write on selection. Every one of them is reversible, scoped and
       stated on the row it belongs to, which is rung 2 — a dialog per field was
       ceremony standing in for feedback, and the feedback is now the control
       itself changing plus an Undo. */
    /* Which edge the tree walks. Same shape as every other state change here:
       it goes in the URL, so a grouped tree is a link somebody can send. */
    document.addEventListener('dd:change', (e) => {
      const dd = e.target.closest('.v2-dropdown[data-axis-key]');
      if (!dd) return;
      const opt = dd.querySelector('.v2-dropdown-option[aria-selected="true"]');
      const val = opt ? (opt.dataset.slug || 'col') : 'col';
      if (val !== readURL().by) patch({ by: val });
    });

    document.addEventListener('dd:change', (e) => {
      const dd = e.target.closest('.v2-dropdown[data-set-key]');
      if (!dd) return;
      const key = dd.getAttribute('data-set-key');
      const arg = dd.getAttribute('data-set-arg');
      const opt = dd.querySelector('.v2-dropdown-option[aria-selected="true"]');
      const val = opt ? (opt.dataset.slug || '') : '';

      if (key === 'cadence') {
        const src = SRC[arg];
        if (!src || val === src.cadence) return;
        const was = src.cadence;
        src.cadence = val;
        src.history.unshift([0, 'ok', 'Schedule changed to ' + val.toLowerCase() + ' by ' + USER.owner]);
        undoStack = () => { src.cadence = was; src.history.shift(); render(); };
        render();
        markAfter('.set-group', $('#setSheet'));
        toast('Sync schedule saved', 'Undo', src.label + ' · ' + val.toLowerCase());
        return;
      }

      if (key === 'retain') {
        const m = COLLECTION_META[arg];
        if (!m || +val === m.retain) return;
        const was = m.retain;
        m.retain = +val;
        undoStack = () => { m.retain = was; render(); };
        render();
        markAfter('.set-group', $('#setSheet'));
        toast('Auto-archive saved', 'Undo', COLLECTIONS[arg] + ' · ' +
          (m.retain ? 'archives after ' + Math.round(m.retain / 30) + ' months' : 'never archives on its own'));
      }
    });

    /* Grounding is the one setting where the rung depends on WHICH way it
       moves. Letting an internal agent read a collection is reversible and
       nobody outside sees it. Letting a customer-facing one read it puts this
       content in front of customers, and that earns the typed confirmation —
       which is why the checkbox reverts until the confirmation is completed. */
    document.addEventListener('change', (e) => {
      const cb = e.target.closest && e.target.closest('[data-set-ground]');
      if (!cb) return;
      const id = cb.getAttribute('data-set-ground');
      const col = cb.getAttribute('data-set-col');
      const m = COLLECTION_META[col];
      const agent = AGENTS.find((a) => a.id === id);
      if (!m || !agent) return;

      if (cb.checked && agent.external) {
        cb.checked = false;                       // not until it is confirmed
        commit({
          title: agent.name + ' may answer from ' + COLLECTIONS[col],
          danger: true, typed: COLLECTIONS[col], confirm: 'Allow it',
          current: 'Internal only', proposed: agent.name + ' may cite it to customers',
          rationale: `<strong>${esc(agent.name)}</strong> is customer-facing. Allowing it means anything in
            <strong>${esc(COLLECTIONS[col])}</strong> can be paraphrased to a customer without a person reading
            it first.`,
          effects: [
            ['warn', `All <strong>${LIVE.filter((o) => o.col === col).length}</strong> live documents here become
              answerable to customers.`],
            ['ok', 'Reversible — unticking it stops new answers immediately.'],
            ['ok', 'Logged to the audit trail with your name and the time.']
          ],
          onRun: () => {
            m.grounding[id] = true;
            render();
            markAfter('.set-checks', $('#setSheet'));
            toast(agent.name + ' allowed', 'Undo', 'It may now cite ' + COLLECTIONS[col]);
            undoStack = () => { m.grounding[id] = false; render(); };
            return true;
          }
        });
        return;
      }

      const was = m.grounding[id];
      m.grounding[id] = cb.checked;
      undoStack = () => { m.grounding[id] = was; render(); };
      render();
      markAfter('.set-checks', $('#setSheet'));
      toast(cb.checked ? agent.name + ' may answer from ' + COLLECTIONS[col]
                       : agent.name + ' no longer answers from ' + COLLECTIONS[col],
        'Undo', cb.checked ? 'Internal only — not customer-facing' : 'Existing answers are unaffected');
    });

    const gateRun = (locked) => {
      const btn = $('#commitRun');
      if (!btn) return;
      btn.disabled = locked;
      btn.style.opacity = locked ? '.45' : '';
      btn.style.cursor = locked ? 'not-allowed' : '';
    };

    document.addEventListener('input', (e) => {
      /* Finding a conversation. Delegated at the document, which is what lets
         the repaint destroy `#chatFind` on every keystroke without taking the
         listener with it. */
      if (e.target && e.target.id === 'chatFind') { CHAT_Q = e.target.value; paintChats(); return; }
      const t = e.target;
      if (t.hasAttribute && t.hasAttribute('data-typed')) {
        gateRun(t.value.trim().toLowerCase() !== t.getAttribute('data-typed').toLowerCase());
      }
    });

    /* Editor: audience checkboxes and the custom-property fields. */
    document.addEventListener('change', (e) => {
      const t = e.target;
      const o = byId(readURL().doc);
      if (!o || !t.hasAttribute) return;
      /* One writer for every set-valued field — the field names itself on the
         container, so Groups and Audience do not need a branch each, and the
         next one will not need a third. A set-valued field writes the whole
         set, which is why it has no add and no remove. */
      if (t.hasAttribute('data-multi-opt')) {
        const box = t.closest('[data-multi-key]');
        const key = box && box.getAttribute('data-multi-key');
        const v = t.getAttribute('data-multi-opt');
        if (!key || !o[key]) return;
        o[key] = t.checked ? o[key].concat([v]).filter((x, i, arr) => arr.indexOf(x) === i)
                           : o[key].filter((x) => x !== v);
        repaintEditor();
      }
    });

  /* The list is there when you open it, and searching narrows it. The field is
     a way through a long list, not a gate in front of it.

     Non-matching options are DETACHED rather than hidden. The library's
     keyboard model reads `.v2-dropdown-option` straight from the DOM and does
     not check `hidden`, so arrow keys would walk through rows nobody can see.
     Removing them keeps that model honest without touching the library, and the
     full ordered set is held here so reattaching restores the order exactly. */
  /* ── Searching a multi-select, without losing the caret ──

     Narrowed in place rather than by re-rendering. A repaint on every keystroke
     would take the field the keystroke came from with it, and putting the caret
     back afterwards is a worse trade than filtering the rows that are already
     standing there. The query lives in `facetQuery` so the repaint that a
     TOGGLE causes can put it back.

     `hidden` is safe here in a way it is not for `.v2-dropdown-option`: this
     control's keyboard model is the one below, and it skips hidden rows. */
  function facetNarrow(panel) {
    if (!panel) return;
    const q = facetQuery.trim().toLowerCase();
    let hits = 0;
    $$('.k-facet-group', panel).forEach((g) => {
      let shown = 0;
      $$('.k-facet-opt', g).forEach((o) => {
        const on = !q || $('.k-facet-text', o).textContent.toLowerCase().indexOf(q) > -1;
        o.hidden = !on;
        if (on) shown++;
      });
      /* A heading with nothing under it names a group that is not there. */
      g.hidden = !shown;
      hits += shown;
    });
    const none = $('.dd-none', panel);
    if (none) none.hidden = hits > 0;

    /* *Select all* means "all of what I can see", so its label has to follow
       the search rather than the full list. */
    const all = $('[data-facet-all]', panel);
    if (all) {
      const rows = $$('.k-facet-opt', panel).filter((o) => !o.hidden);
      all.textContent = rows.length && rows.every((o) => o.classList.contains('is-on'))
        ? 'Clear all' : 'Select all';
    }
  }

  document.addEventListener('input', (e) => {
    const box = e.target.closest && e.target.closest('[data-facet-search]');
    if (!box) return;
    facetQuery = box.value;
    facetNarrow(box.closest('.k-facet-panel'));
  });

  /* ── The corpus search ──
     Debounced, because `patch` pushes history and a keystroke per entry makes
     the back button useless. And it puts the caret back: `renderFilters`
     reassigns `innerHTML`, so the field being typed into is destroyed and
     replaced on every commit — without this the cursor jumps to the end, or
     off the element entirely, mid-word. */
  document.addEventListener('input', (e) => {
    const box = e.target.closest && e.target.closest('[data-q]');
    if (!box) return;
    const v = box.value;
    clearTimeout(Q_T);
    Q_T = setTimeout(() => {
      const at = (($('[data-q]') || {}).selectionStart);
      patch({ q: v.trim() });
      const back = $('[data-q]');
      if (back) { back.focus(); if (at != null) back.setSelectionRange(at, at); }
    }, 260);
  });

  /* Escape clears rather than blurring. A search box you cannot empty without
     selecting the text first is one people leave filtered by accident. */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const box = e.target.closest && e.target.closest('[data-q]');
    if (!box || !box.value) return;
    e.preventDefault(); e.stopPropagation();
    clearTimeout(Q_T); box.value = '';
    patch({ q: '' });
    const back = $('[data-q]'); if (back) back.focus();
  });

  /* The keyboard half of the control. The library's model belongs to
     `.v2-dropdown` and never sees these rows, so arrowing, activating and
     getting back out are all wired here — hidden rows skipped, because the
     search is usually what is standing between you and the value you want. */
  document.addEventListener('keydown', (e) => {
    const wrap = e.target.closest && e.target.closest('.k-facet.is-open');
    if (!wrap) return;
    const panel = $('.k-facet-panel', wrap);
    if (!panel) return;
    const rows = $$('.k-facet-opt', panel).filter((o) => !o.hidden);
    if (!rows.length) return;
    const here = rows.indexOf(e.target.closest('.k-facet-opt'));

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      /* From the search field, down enters the list at the top and up enters it
         at the bottom — the field is above the rows, so both read as stepping
         into them from where you are. */
      const next = here === -1 ? (step === 1 ? 0 : rows.length - 1)
                               : (here + step + rows.length) % rows.length;
      rows[next].focus();
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && here > -1) {
      e.preventDefault();
      rows[here].click();
      return;
    }
    /* Typing goes to the search box wherever you are in the list, which is what
       a list this long is usually being arrowed through to reach anyway. */
    if (e.key.length === 1 && here > -1) {
      const box = $('[data-facet-search]', panel);
      if (box) { box.focus(); }
    }
  });

  const ddAll = new WeakMap();

  function ddFilter(panel) {
    if (!panel) return;
    const box = $('[data-dd-search]', panel);
    if (!box) return;
    let all = ddAll.get(panel);
    if (!all) { all = $$('.v2-dropdown-option', panel); ddAll.set(panel, all); }

    const q = box.value.trim().toLowerCase();
    const none = $('.dd-none', panel);

    /* No query, no narrowing. The axis's "All" row survives either way:
       clearing a filter must never be something you have to spell your way
       back to. */
    const show = all.filter((o) => !q || !o.dataset.slug ||
      (o.dataset.value || o.textContent).toLowerCase().indexOf(q) > -1);

    all.forEach((o) => { if (o.parentNode) o.remove(); });
    show.forEach((o) => panel.insertBefore(o, none));

    const hits = show.filter((o) => o.dataset.slug).length;
    if (none) none.hidden = !q || hits > 0;

    /* The library points aria-activedescendant at the selected option when it
       opens the panel — which is a moment before this runs, so it can be left
       naming a node that is no longer in the document. A screen reader would be
       told the active item is something it cannot find. */
    const active = panel.getAttribute('aria-activedescendant');
    if (active && !document.getElementById(active)) {
      panel.removeAttribute('aria-activedescendant');
      $$('.v2-dropdown-option.is-active', panel).forEach((o) => o.classList.remove('is-active'));
    }
  }

    /* Search inside a filter. The library's dropdown has letter typeahead — one
       key, 500ms buffer, jump to the first match — which is a different thing:
       it finds a value you can already spell. With a list of clients you cannot,
       so this narrows instead of jumping. Recorded in GAPS.md. */
    document.addEventListener('input', (e) => {
      const box = e.target.closest && e.target.closest('[data-dd-search]');
      if (!box) return;
      ddFilter(box.closest('.v2-dropdown-panel'));
    });

    /* Cull on open too, so the list is closed before the first keystroke rather
       than blinking shut after it. Next tick: the library opens the panel from
       its own click listener and this has to land after that. */
    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('.v2-dropdown-btn');
      if (!btn) return;
      const panel = $('.v2-dropdown-panel', btn.closest('.v2-dropdown') || document.body);
      const box = panel && $('[data-dd-search]', panel);
      if (!box) return;
      /* Reopening starts from the whole list. A search you cannot see the end
         of, still applied from last time, is a filter hiding inside a filter. */
      setTimeout(() => { box.value = ''; ddFilter(panel); }, 0);
    });

    /* The search field sits INSIDE the panel, and the library's dropdown closes
       on any click that is not an option or the trigger — so clicking into the
       search box shut the thing you were about to search. Both events are held
       at the document's capture phase, before the library's own document-level
       listeners run. Focus and the caret are default actions, not listeners, so
       they still happen. */
    ['click', 'mousedown'].forEach((type) => {
      document.addEventListener(type, (e) => {
        if (e.target.closest && e.target.closest('[data-dd-search]')) e.stopPropagation();
      }, true);
    });

    /* Typing in the search must not reach the listbox's keyboard model, or the
       first letter jumps the selection somewhere behind the panel. */
    document.addEventListener('keydown', (e) => {
      if (!e.target.closest || !e.target.closest('[data-dd-search]')) return;
      if (e.key === 'Escape') return;                 // Escape still closes it
      e.stopPropagation();
    }, true);

    /* A toolbar button steals focus on mousedown and collapses the selection
       before execCommand ever runs, which is why none of these appeared to do
       anything. Cancelling the default keeps the caret where it was. */
    /* ── Nothing in the writing chrome may take focus ──

       A button that takes focus on mousedown blurs the body, which disarms it,
       which repaints the document, which detaches the button — so the click
       that was travelling to it never lands. It looked like "the menu just
       closes and nothing happens".

       The toolbar and the assistant were guarded; the assistant's own MENU was
       not, so every draft action was dead. The rule is the surface, not the
       individual control: anything inside the writing chrome cancels its
       mousedown. */
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest) return;
      if (e.target.closest('.blk-tools') || e.target.closest('.ai-menu') ||
          e.target.closest('.blk-menu') || e.target.closest('[data-fmt]') ||
          e.target.closest('[data-pick-image]') ||
          /* The record is a run of editable rows in the same column as the
             body. A button in it that takes focus on mousedown blurs the body,
             which repaints the page, which detaches the button the click was
             travelling to — the same defect, in a place it could not reach
             while these rows lived in the rail.

             `.prop-kv-read` only: it re-focuses its input programmatically
             after the repaint, exactly as the toolbar does. The design
             system's dropdown trigger is deliberately NOT here — it opens on
             click through its own controller, and cancelling mousedown under
             it is a change to a component this file does not own. */
          e.target.closest('.prop-kv-read') ||
          /* A stepper button that takes focus blurs the input beside it, which
             commits and folds the row out from under the second click. */
          e.target.closest('[data-step]') ||
          /* A blank document's starting moves — Draft with AiMY, Start from a
             file, Connect it to documents — sit under a body, and a blank
             document opens with its title armed. Every one of them therefore
             blurred the title on mousedown, which committed it, which
             repainted, which detached the button the click was still
             travelling to: three dead controls on the one screen that has
             nothing else on it. Same defect as the toolbar's, same fix. */
          e.target.closest('.doc-start') ||
          /* Accept, Edit and Reject on an AiMY proposal, for the same reason:
             they sit under the body of a document whose title or body is
             armed, so taking focus commits it, repaints, and detaches the
             button mid-click. The foot only — the proposal's own <ins> is
             editable while you are working on it, and that needs the caret
             the default puts there. */
          e.target.closest('.ai-suggestion-foot') ||
          e.target.closest('.dv-subject .entry-action') ||
          /* Save and Discard are clicked FROM a field — that is the whole
             point of them — and a button there that takes focus blurs the
             field, which commits, which repaints, which detaches the button
             the click was travelling to. Same defect, same fix; `commitLive`
             is what then writes the field down instead of the blur. */
          e.target.closest('.doc-topbar')) { e.preventDefault(); return; }
      /* Touching anything else puts the block list away. Choosing a block and
         pressing + again already close it; this is the third way out, which is
         the one you reach for without thinking. */
      if ($('#blkMenu')) closeBlockMenu();
    });

    /* Keep the toolbar honest about where the caret is. */
    document.addEventListener('selectionchange', () => {
      if ($('.doc-page [data-fmt]')) syncToolbar();
      /* The mark follows the caret from block to block, and leaves the moment
         there is a selection or nothing is armed. One listener, because the
         caret moving IS the only thing that can change which block it belongs
         to. */
      if ($('#editBody')) placeBlockMark();
    });

    /* The body writes through on every keystroke so the Publish gate is honest
       the instant there is something to publish. No repaint — that would take
       the caret with it — just the one button that depends on it, and the top
       bar, which is where the two ways out of the round now live. */
    document.addEventListener('input', (e) => {
      if (!e.target.id || e.target.id !== 'editBody') return;
      const o = byId(readURL().doc);
      if (!o) return;
      writeBody(e.target);
      markDirty(o);
      /* A slash alone on a block asks for the block list — the shortcut every
         document tool has. Anything else typed closes it again. */
      const blk = caretBlock();
      if (blk && blk.textContent.trim() === '/') openBlockMenu(blk.getBoundingClientRect(), true);
      else if ($('#blkMenu')) closeBlockMenu();
    }, true);

    /* ── Anything typed into the document is a change to the document ──

       The editor had exactly two funnels, and they were the two the autosave
       used: the body, which writes through on every keystroke, and
       repaintEditor, which every other field reaches on BLUR. That is enough
       to record a save after the fact. It is not enough to offer one — a
       title is being changed while it is being typed, and a bar that only
       admits it once you click somewhere else is a bar saying "nothing to
       save" over a document you are visibly changing.

       So the signal is the keystroke, wherever it lands, and the commit stays
       exactly where it was. The title writes through as it goes, the way the
       body does: there is no repaint on this path, so there is no caret to
       lose. Everything else is still written by the blur that already wrote
       it, and `settle` is what takes the claim back if the blur turns out to
       have committed nothing. */
    document.addEventListener('input', (e) => {
      const t = e.target;
      if (!t || !t.closest || !t.hasAttribute) return;
      if (!t.closest('.doc-page') || t.closest('.modal')) return;
      /* The body has its own writer, which knows whether anything moved. */
      if (t.id === 'editBody') return;
      /* Not the document: a comment is a note ABOUT it, and a picker's filter
         box is not content at all. */
      if (t.hasAttribute('data-comment-input') || t.hasAttribute('data-pick-q')) return;
      const o = byId(readURL().doc);
      if (!o) return;
      if (t.hasAttribute('data-edit-title')) { const v = t.textContent.trim(); if (v) o.title = v; }
      markDirty(o);
    });

    /* Property key/value edits are committed on blur rather than on every
       keystroke — repainting mid-word would take the caret with it. */
    document.addEventListener('focusout', (e) => {
      const t = e.target;
      const o = byId(readURL().doc);
      if (!o || !t.hasAttribute) return;
      /* ── A repaint is not somebody leaving the field ──

         Replacing the stage detaches whatever the caret was in, and the
         browser reports that as a `focusout` on the detached element — one
         frame later, indistinguishable at this listener from a click
         somewhere else. So every paint was followed by a phantom commit of
         the field it had just torn out, and that commit called the paint
         again.

         On a blank document that was the whole bug: clicking the body armed
         it, which blurred the title, which repainted, which detached the body
         and fired this handler on the corpse — disarming what had just been
         armed and repainting once more, this time with nothing armed, so the
         blank branch put the caret back in the title. The body could never be
         typed into.

         An element that is no longer in the document was not left by a
         person. It was removed by us, and we have already written down
         everything it held. */
      if (!document.contains(t)) return;
      if (t.hasAttribute('data-x-val')) {
        commitXField(t);
        /* Every branch here ends in one of the two: a repaint, which settles
           on the way through, or a settle of its own. A field that raised the
           Save by being typed into has to be able to take it back by being
           typed back — and the branch that commits without repainting was
           leaving the claim standing over a document nothing had changed. */
        if (openXField !== null) { openXField = null; repaintEditor(); }
        else settle(byId(readURL().doc));
        return;
      }
      if (t.hasAttribute('data-prop-k')) {
        if (commitProp(t)) repaintEditor();
        else settle(byId(readURL().doc));
      } else if (t.hasAttribute('data-prop-v')) {
        commitProp(t);
        settle(byId(readURL().doc));
        /* Leaving the pair folds it back to the phrase — but only if focus
           actually left the pair, not if it moved from the name to the value. */
        const pair = t.closest('.prop-kv');
        setTimeout(() => {
          if (pair && pair.contains(document.activeElement)) return;
          if (openProp !== null) { openProp = null; repaintEditor(); }
        }, 0);
      } else if (t.id === 'editBody') {
        /* Leaving the body is when the derived status can safely catch up —
           mid-word it would repaint under the caret. */
        disarmEditable(t);
        writeBody(t);
        recompute();
        repaintEditor();
      } else if (t.hasAttribute('data-edit-title')) {
        disarmEditable(t);
        /* The keystroke already wrote it — see the input handler above — so
           this is the repaint, not the write. It runs either way rather than
           on a difference that can no longer be detected here, and settle is
           what decides whether anything actually moved. */
        const v = t.textContent.trim();
        if (v) o.title = v;
        repaintEditor();
      }
    }, true);

    /* The connect picker filters in place. No repaint — a repaint would take
       the field and everything typed into it. */
    document.addEventListener('input', (e) => {
      if (!e.target.hasAttribute || !e.target.hasAttribute('data-pick-q')) return;
      const q = e.target.value.trim().toLowerCase();
      const body = e.target.parentNode;
      let n = 0;
      $$('[data-pick-row]', body).forEach((r) => {
        const on = !q || r.getAttribute('data-pick-row').indexOf(q) > -1;
        r.hidden = !on;
        if (on) n++;
      });
      const none = $('.cx-none', body) || $('.nb-none', body);
      if (none) none.hidden = n > 0;
    });

    document.addEventListener('change', (e) => {
      if (e.target.hasAttribute && e.target.hasAttribute('data-cx-pick')) syncPickCount();
    });

    document.addEventListener('input', (e) => {
      if (e.target.hasAttribute && e.target.hasAttribute('data-report-what')) gateReport();
    });

    /* Opening or shutting a rail block is remembered by name, so the next
       repaint draws it the way you left it. `toggle` does not bubble, hence
       the capture — and it never fires for the state an element is PARSED
       with, so a repaint drawing the stored state cannot re-enter this. */
    document.addEventListener('toggle', (e) => {
      const d = e.target;
      if (!d.matches || !d.matches('.rail-block[data-rail-block]')) return;
      const k = d.getAttribute('data-rail-block');
      if (d.open) delete railShut[k]; else railShut[k] = true;
    }, true);

    /* ══ THE VERSION LIST IS A MENU, NOT A DISCLOSURE ═══════════════
       It floats over the document and is dismissed by looking away, which is
       what makes it a layer - unlike the rail block above it, or the answer's
       trace, which sit in the flow and must keep their state when a menu opens
       somewhere else.

       Being a <details>, pressing its own summary again already closes it.
       What it never did was take part: it would sit open behind the bell, or
       stay open while an account menu opened over the top of it. Registered
       here rather than at its render site because the element is rebuilt on
       every repaint and the registration must outlive it - so the layer is
       described by a SELECTOR, not by a node. */
    const verLayer = (window.AIMY_LAYERS || { add: (x) => x, closeAll: () => {} }).add({
      name: 'versions',
      isOpen: () => !!$('details.doc-versions[open]'),
      close: () => { const d = $('details.doc-versions[open]'); if (d) d.open = false; }
    });
    document.addEventListener('toggle', (e) => {
      const d = e.target;
      if (!d.matches || !d.matches('details.doc-versions') || !d.open) return;
      (window.AIMY_LAYERS || { add: (x) => x, closeAll: () => {} }).closeAll(verLayer);
    }, true);

    /* Put the pointer in the text and the text becomes writable, at the point
       you touched. Nothing else on the page arms anything. */
    document.addEventListener('mousedown', (e) => {
      const el = e.target.closest && e.target.closest('[data-edit-title], #editBody');
      if (!el) return;
      const was = el.getAttribute('contenteditable') === 'true';
      /* ── The browser's own focus arrives too late to be right ──

         Its default for a mousedown is to focus the element the pointer went
         down on, and it runs after this listener. If the caret is coming FROM
         another field on this page, that is a blur, and every field here
         commits on blur by repainting — so by the time the default runs, the
         node it means to focus has been replaced. Focus lands on <body>
         instead, blurring the block we just armed one frame after arming it,
         and that blur commits and repaints AGAIN with nothing armed. The
         second paint put the caret back in the title, which is why a new
         document's body could never be typed into: it opens with the title
         armed, so every first click into the body came from a field.

         There is nothing for the default to do on that path. armEditable has
         already focused the block and placed the caret at the point — it has
         to, because the element was not editable when the pointer went down.

         Only on that path. Arriving from outside the document repaints
         nothing, so the default is left alone and a click-drag into unarmed
         text selects, the way it does everywhere else. */
      const from = document.activeElement;
      const leaving = from && from !== el && from.closest && from.closest('.doc-page');
      armEditable(el, e.clientX, e.clientY);
      if (leaving && !was && el.getAttribute('contenteditable') === 'true') e.preventDefault();
    }, true);

    /* The keyboard cannot put a pointer anywhere, so the two blocks are
       focusable and Enter arms them with the caret at the start. */
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target;
      if (!isEditable(el) || el.getAttribute('contenteditable') === 'true') return;
      e.preventDefault();
      armEditable(el);
    });

    /* ── A title is one line, so Enter ends it ──

       The body is prose and Enter belongs to it: it makes the next paragraph.
       A title is a single value, and in a contenteditable <h1> the same key
       was putting a line break inside the heading — a title with a newline in
       it, committed on some later blur, from a keystroke that in every other
       field on this page now means "done".

       Blur commits through the focusout writer, which is the same path
       clicking away already used. */
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      const el = e.target;
      if (!el || !el.hasAttribute || !el.hasAttribute('data-edit-title')) return;
      if (el.getAttribute('contenteditable') !== 'true') return;
      e.preventDefault();
      el.blur();
    });

    /* Escape leaves the text — and only the text. Without the capture guard it
       would also reach the handler that closes the document, so one key would
       both commit the edit and throw away the page it was made on. */
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      /* One Escape, one thing: the block list closes before the writing does. */
      if ($('#blkMenu')) { e.stopPropagation(); closeBlockMenu(); return; }
      const el = document.activeElement;
      if (!isEditable(el) || el.getAttribute('contenteditable') !== 'true') return;
      e.stopPropagation();
      el.blur();
    }, true);

    /* Enter is the same action as the button. A compose field that only submits
       from a button is a field that has to be explained. */
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !e.target.hasAttribute || !e.target.hasAttribute('data-comment-input')) return;
      e.preventDefault();
      const btn = $('[data-comment-add]');
      if (btn) btn.click();
    });

    /* ── A field commits on Enter and cancels on Escape ──

       Every single-value field on this product committed on focusout and on
       nothing else: you clicked the row, typed, pressed the one key everybody
       presses to mean "done", and nothing happened. The only way to keep what
       you had written was to click somewhere else — which nobody does, because
       the field has not told them it worked yet.

       That was survivable while these rows lived in a 320px rail behind a
       closed <details>. They are the document's own content now: a Web Page IS
       its source URL, a Presentation IS its deck and slide count. A control
       whose commit you can only reach by clicking away from it reads as a
       control that does not work, which is exactly how it was reported.

       Both keys route through the SAME focusout writer rather than each
       writing its own copy of the value. Enter blurs, and blur commits.
       Escape puts the stored value back FIRST, so the commit its blur triggers
       is a no-op and the field returns to the state it opened in. One writer,
       three ways in, and no chance of the three drifting apart.

       Escape is capture-phase and stops there. Without the guard the same
       keystroke travels on to the handler that closes whatever is open behind
       the field — the same reason the body's own Escape is guarded. */
    const FIELD_ATTR = ['data-x-val', 'data-prop-v', 'data-prop-k'];
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (!t || !t.hasAttribute) return;
      const attr = FIELD_ATTR.filter((a) => t.hasAttribute(a))[0];
      if (!attr) return;
      if (e.key !== 'Enter' && e.key !== 'Escape') return;
      e.preventDefault();
      /* Escape must not travel on to the handler that closes whatever is open
         behind the field — the same reason the body's own Escape is guarded. */
      if (e.key === 'Escape') e.stopPropagation();

      /* Escape restores the stored value before committing, so the commit is a
         no-op and the field returns to the state it opened in. Enter commits
         what was typed. Either way the row folds, which is the feedback that
         was missing: a field that stays open after you press Enter has told
         you nothing about whether it heard you. */
      if (e.key === 'Escape') {
        const o = byId(readURL().doc);
        const k = t.getAttribute(attr);
        /* A custom property's KEY is its own stored value — the attribute
           holds the name the row was opened under. */
        const v = !o ? '' : attr === 'data-x-val' ? xVal(o, k)
          : attr === 'data-prop-v' ? o.props[k] : k;
        t.value = v === undefined || v === '—' ? '' : String(v);
      }
      if (attr === 'data-x-val') commitXField(t); else commitProp(t);
      openXField = null;
      openProp = null;
      /* Blur too, so the browser's own focus ring does not survive on an
         element the repaint is about to replace. */
      t.blur();
      repaintEditor();
    }, true);

    /* The same two moves for a prose list, minus the slug. A tag is a machine
       value and gets lowercased and hyphenated; a fit criterion is a sentence
       somebody wrote and gets stored as typed. */
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (!t.hasAttribute || !t.hasAttribute('data-x-add')) return;
      const o = byId(readURL().doc);
      if (!o) return;
      const k = t.getAttribute('data-x-add');
      o.x = o.x || {};
      const list = o.x[k] || [];
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = t.value.trim();
        if (!v) return;
        if (list.indexOf(v) === -1) o.x[k] = list.concat([v]);
        t.value = '';
        repaintEditor();
      } else if (e.key === 'Backspace' && !t.value && list.length) {
        e.preventDefault();
        o.x[k] = list.slice(0, -1);
        repaintEditor();
      }
    });

    /* The keyboard half of `role="button"`. A span does not activate on Enter
       or Space, so the two keys are handed to the click router the element is
       already wired to — one route in, whichever way you arrive at it. */
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target.closest && e.target.closest('.ins-clause[role="button"]');
      if (!el) return;
      e.preventDefault();
      el.click();
    });

    /* Click-off closes an open set panel. Its own listener rather than a line
       in the router above: the router re-renders and returns from most of its
       branches, so a close placed inside it would either be unreachable or be
       reached with the page already replaced underneath it. Registered after
       the router, so a press on the trigger is handled as a toggle first and
       read as an outside click never. */
    document.addEventListener('click', (e) => {
      if (!openMulti) return;
      if (e.target.closest && e.target.closest('.k-multi')) return;
      openMulti = null;
      renderDoc(readURL());
    });

    /* Tag entry. Enter commits a token, Backspace on an empty field removes the
       last one — the two things every tag field is expected to do. */
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (!t.hasAttribute || !t.hasAttribute('data-tag-add')) return;
      const o = byId(readURL().doc);
      if (!o) return;
      const key = t.getAttribute('data-tag-add');
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = t.value.trim().toLowerCase().replace(/\s+/g, '-');
        if (!v) return;
        if (o[key].indexOf(v) === -1) o[key] = o[key].concat([v]);
        t.value = '';
        repaintEditor();
      } else if (e.key === 'Backspace' && !t.value && o[key].length) {
        e.preventDefault();
        o[key] = o[key].slice(0, -1);
        repaintEditor();
      }
    });

    document.addEventListener('click', (e) => {
      const t = e.target;
      let el;

      /* ── the date range controls ── */
      if ((el = t.closest('[data-cal-nav]'))) {
        const step = +el.getAttribute('data-cal-nav');
        const base = calMonth || new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), 1));
        calMonth = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + step, 1));
        renderFilters(readURL());
        return;
      }
      if ((el = t.closest('[data-cal-day]'))) {
        const key = el.closest('[data-date-key]').getAttribute('data-date-key');
        const off = offsetOf(el.getAttribute('data-cal-day'));
        if (calPick === null) {
          /* First end picked. Nothing is written yet — half a range is not a
             filter, and writing one would empty the grid mid-gesture. */
          calPick = off;
          renderFilters(readURL());
          return;
        }
        const older = Math.max(calPick, off), newer = Math.min(calPick, off);
        calPick = null;
        calOpen = null;
        patch({ [key]: iso(dateOf(older)) + '..' + iso(dateOf(newer)) });
        return;
      }
      if ((el = t.closest('[data-date-field]'))) {
        const to = el.getAttribute('data-date-field');
        const st = readURL();
        const from = dateField || activeDateKey(st);
        dateField = to;
        calPick = null;
        /* Moving, not adding. Asking "when" twice about two different fields is
           a query nobody types and a row nobody can read back. */
        if (from !== to && st[from]) patch({ [from]: '', [to]: st[from] });
        else renderFilters(readURL());
        return;
      }
      if ((el = t.closest('[data-date-set]'))) {
        const key = el.closest('[data-date-key]').getAttribute('data-date-key');
        calPick = null;
        calOpen = null;
        patch({ [key]: el.getAttribute('data-date-set') });
        return;
      }
      if ((el = t.closest('.k-date-btn'))) {
        const key = el.closest('[data-date-key]').getAttribute('data-date-key');
        const cur = readURL()[key];
        calOpen = calOpen === 'date' ? null : 'date';
        calPick = null;
        /* Open on the month the range already names, not on today — otherwise
           changing a June range starts you in July every time. */
        const m = RANGE_RE.exec(cur || '');
        const on = m ? new Date(m[2] + 'T00:00:00Z') : TODAY;
        calMonth = calOpen ? new Date(Date.UTC(on.getUTCFullYear(), on.getUTCMonth(), 1)) : null;
        renderFilters(readURL());
        return;
      }
      if (calOpen && !t.closest('.k-date')) { calOpen = null; calPick = null; renderFilters(readURL()); }

      /* ── multi-select filters ──

         Every branch re-renders and returns, and the panel comes back open
         because `facetOpen` is module state rather than a class on a node the
         repaint just replaced. */
      if ((el = t.closest('.k-facet-btn'))) {
        const key = el.closest('[data-facet-key]').getAttribute('data-facet-key');
        facetOpen = facetOpen === key ? null : key;
        facetQuery = '';
        renderFilters(readURL());
        /* The list can be long and the search is the way through it, so the
           caret starts there rather than making you reach for it. */
        const into = facetRefocus(key, null);
        if (into) into.focus();
        return;
      }
      if ((el = t.closest('.k-facet-opt'))) {
        const key = el.closest('[data-facet-key]').getAttribute('data-facet-key');
        const val = el.getAttribute('data-facet-val');
        const st = readURL();
        const cur = st[key] || [];
        const adding = cur.indexOf(val) === -1;
        st[key] = adding ? cur.concat([val]) : cur.filter((v) => v !== val);
        reconcileScope(st, key === 'client' && !adding ? val : null);
        st.doc = '';
        rememberFilter();
        writeURL(st);
        /* Focus follows the row you just pressed, so a second press lands
           without going back to the mouse. It can legitimately be gone —
           clearing a client takes its products off the list — in which case
           the search field is the nearest thing that still exists. */
        const back = facetRefocus(key, val);
        if (back) back.focus();
        return;
      }
      if ((el = t.closest('[data-facet-all]'))) {
        const c = FACET_FILTERS.find((f) => f.key === facetOpen);
        if (!c) return;
        const st = readURL();
        const visible = facetVisible(c, st);
        const sel = st[c.key] || [];
        const allOn = visible.length > 0 && visible.every((v) => sel.indexOf(v) > -1);
        /* Only what is on screen is added or removed. A selection made under a
           different client or a different search survives either way — the
           button says "all of these", not "all of everything". */
        st[c.key] = allOn ? sel.filter((v) => visible.indexOf(v) === -1)
                          : sel.concat(visible.filter((v) => sel.indexOf(v) === -1));
        /* Only the owner half applies: *Select all* never drops a client, and
           *Clear all* on the client panel empties it — which removes the
           contradiction rather than making one, so the products stay put. */
        reconcileScope(st, null);
        st.doc = '';
        rememberFilter();
        writeURL(st);
        const into = facetRefocus(c.key, null);
        if (into) into.focus();
        return;
      }
      if (facetOpen && !t.closest('.k-facet')) { facetOpen = null; facetQuery = ''; renderFilters(readURL()); }

      /* ── prototype panel ── */
      if (t.closest('#protoToggle')) { proto.toggle(); return; }
      if ((el = t.closest('[data-proto]'))) {
        protoRun(el.getAttribute('data-proto'));
        /* It closes behind you: it is scaffolding for getting somewhere, not
           somewhere to be. Copy is the one that leaves it open, because you may
           well want the next link too. */
        if (el.getAttribute('data-proto').indexOf('copy') !== 0) proto.toggle(false);
        return;
      }
      if (proto.open && !t.closest('#proto')) proto.toggle(false);

      /* ── chips and filters ── */
      if ((el = t.closest('[data-chip-drop]'))) {
        const c = el.closest('[data-chip]') || el;
        dropChip(c.getAttribute('data-chip'), c.getAttribute('data-chip-val'));
        return;
      }
      if (t.closest('[data-clear-all]')) { writeURL(readURL0()); return; }
      if (t.closest('[data-q-clear]')) {
        clearTimeout(Q_T);
        patch({ q: '' });
        const back = $('[data-q]'); if (back) back.focus();
        return;
      }
      /* Click-to-focus, which the `label` used to give for free. Anywhere in
         the field except the clear button, which has its own job. */
      if (t.closest('.k-search') && !t.closest('[data-q-clear]')) {
        const box = $('[data-q]'); if (box) box.focus();
        return;
      }
      if ((el = t.closest('[data-quick]'))) {
        const [k, v] = el.getAttribute('data-quick').split('=');
        addFilter(k, v);
        return;
      }
      /* Every labelled value on a card or a document is a filter link. Clicking
         a tag, a region, a service, an audience or a custom property narrows
         the surface to it — which is how the modal stays a reading surface and
         still gets you back to the set. */
      if ((el = t.closest('[data-add-tag]')))      { addFilter('tag', el.getAttribute('data-add-tag')); return; }
      if ((el = t.closest('[data-add-client]')))   { addFilter('client', el.getAttribute('data-add-client')); return; }
      if ((el = t.closest('[data-add-region]')))   { addFilter('region', el.getAttribute('data-add-region')); return; }
      if ((el = t.closest('[data-add-service]')))  { addFilter('service', el.getAttribute('data-add-service')); return; }
      if ((el = t.closest('[data-add-audience]'))) { addFilter('audience', el.getAttribute('data-add-audience')); return; }
      if ((el = t.closest('[data-prop]')))         { addFilter('prop', el.getAttribute('data-prop')); return; }
      if (t.closest('[data-show-archive]')) { canvas.close(); patch({ archived: true }); return; }
      if ((el = t.closest('[data-open-axis]'))) {
        const [k, v] = el.getAttribute('data-open-axis').split(':');
        const next = readURL0();
        next[k] = [v];
        rememberFilter();
        writeURL(next);
        return;
      }
      /* The relationship the whole batch is being asserted as. A segmented
         control, so exactly one is chosen and it is chosen once. */
      if ((el = t.closest('[data-cx-as]'))) {
        $$('.cx-seg .seg-btn').forEach((b) => {
          const on = b === el;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        return;
      }
      /* The settings rail, and the way out of it. `data-m=""` is not a special
         case — an empty module IS the console, so leaving settings is state
         removal exactly like closing a document, and the back button unwinds
         it for free.

         ── AND IT CARRIES THE PAGE ──
         A module is a group of pages now and a rail row names both. This read
         only the module, and settings.js had grown a second handler that read
         both — so every click on a page row was patched twice, once correctly
         and then once by this, which cleared `sec` because it did not know the
         key existed. The result was a rail where the module rows worked and
         every page row silently did nothing.

         There is one router for a rail row, and it is this one: the rail lives
         in this file's DOM and this file owns the URL. `data-sec` is read here
         so the two facts on the row travel together. */
      if ((el = t.closest('[data-m]'))) {
        patch({ m: el.getAttribute('data-m'), sec: el.getAttribute('data-sec') || '' });
        return;
      }
      if ((el = t.closest('[data-view]'))) { patch({ view: el.getAttribute('data-view') }); return; }
      /* An insight's action belongs to the insight. needsYou() attaches a go()
         to every finding it returns, and each one already terminates in one of
         the four places §1.2 allows — a filter, a document, a canvas question,
         or a staged write. Re-deciding that here would be a second opinion
         about a thing that has one. Scope matters: the row was computed over
         the filtered list, so it must be looked up in that same list or the
         action will act on a finding the row is not showing. */
      /* The figure shows you the set it counted. Recomputed over the same
         scope the row was written from, so what you land on is what you read. */
      if ((el = t.closest('[data-ins-n]'))) {
        const id = el.getAttribute('data-ins-n');
        const st0 = readURL();
        const comp0 = isComposed(st0);
        const set0 = comp0 ? composedSet(orderOf(st0, comp0))
                           : sortSet(applyFilters(st0), orderOf(st0, comp0));
        const hit = needsYou(set0).filter((x) => x.id === id)[0];
        if (hit && hit.ids.length) patch({ ids: hit.ids });
        return;
      }
      if ((el = t.closest('[data-ins]'))) {
        const id = el.getAttribute('data-ins');
        const st0 = readURL();
        const comp = isComposed(st0);
        const set = comp ? composedSet(orderOf(st0, comp))
                         : sortSet(applyFilters(st0), orderOf(st0, comp));
        const found = needsYou(el.closest('.doc-rail') ? undefined : set)
          .filter((x) => x.id === id)[0];
        if (found) found.go();
        return;
      }
      if ((el = t.closest('[data-sort-attention]'))) {
        /* Write the state you are turning ON, not the absence of the other —
           an absent key means "this surface's default", and on the composed
           set that default is already attention, so clearing it would leave
           the button pressed and nothing changed. */
        const st0 = readURL();
        patch({ sort: orderOf(st0, isComposed(st0)) === 'attention' ? 'recent' : 'attention' });
        return;
      }
      if (t.closest('[data-toggle-mine]')) { const s = readURL(); s.mine = !s.mine; s.doc = ''; rememberFilter(); writeURL(s); return; }
      /* The same restore path the one-slot version used: a recent is a URL, so
         going back to it is a navigation and not a state assignment. */
      if ((el = t.closest('[data-recent]'))) { location.search = el.getAttribute('data-recent'); return; }
      if (t.closest('[data-retry]'))  { location.href = location.pathname; return; }

      /* ── documents ── */
      if ((el = t.closest('[data-open-doc]'))) {
        /* A document reference opens the document. If the reference was inside
           the panel, the panel has done its job and goes — it closes only on
           an outside click otherwise, which would leave it hanging over the
           page it just sent you to. */
        if (peekStack.length) closePeek();
        /* The gate answers with citations and has nowhere to put a document.
           `patch` would write `?doc=` into a URL whose render is a no-op — a
           source row that says it is clickable and is not, which is the exact
           bug the `data-open-doc` attribute was added to fix in the first
           place. It leaves for the Console instead: same key, same document,
           one page over. Reading a cited source is not surface manipulation. */
        if (canvas.inline) { location.href = 'console.html?doc=' + encodeURIComponent(el.getAttribute('data-open-doc')); return; }
        patch({ doc: el.getAttribute('data-open-doc') });
        return;
      }
      if ((el = t.closest('[data-keep]'))) { canvas.close(); docAct('keep', el.getAttribute('data-keep')); return; }
      if ((el = t.closest('[data-compare-with]'))) { docAct('compare', el.getAttribute('data-compare-with')); return; }
      if ((el = t.closest('[data-resolve]'))) { canvas.close(); docAct('resolve', el.getAttribute('data-resolve')); return; }
      if (t.closest('[data-doc-close]')) { previewVer = null; patch({ doc: '' }); return; }

      /* ── editor: tabs, versions, properties ── */
      /* renderDoc replaces the stage's innerHTML, which destroys this very
         <details> — so picking v2 closed the picker, and picking v3 meant
         opening it again. The markup re-opens it whenever previewVer is set,
         which is exactly the case where you are still choosing. Every OTHER
         repaint still closes it, because you did not ask for it then.

         knowledge.css's "an open <details> survives a repaint with no state of
         ours" is true of the rail's blocks and was never true of this one. */
      if ((el = t.closest('[data-open-ver]'))) { previewVer = +el.getAttribute('data-open-ver'); renderDoc(readURL()); return; }
      if (t.closest('[data-close-ver]')) { previewVer = null; renderDoc(readURL()); return; }
      /* The panel opens under its own row and shuts on the second press — the
         library's dropdowns behave this way and this one has to match, because
         it is sitting in the same column pretending to be one of them. */
      if ((el = t.closest('.k-multi-btn'))) {
        const key = el.closest('[data-multi-key]').getAttribute('data-multi-key');
        openMulti = openMulti === key ? null : key;
        renderDoc(readURL());
        return;
      }
      if ((el = t.closest('[data-tag-drop]'))) {
        const o = byId(readURL().doc);
        const key = el.closest('[data-tag-field]').getAttribute('data-tag-field');
        o[key] = o[key].filter((x) => x !== el.getAttribute('data-tag-drop'));
        repaintEditor();
        return;
      }
      /* The long-text surface. Save writes and repaints; Cancel and the
         backdrop leave the value alone, which is the whole reason a field
         that opens a surface gets a Cancel and an inline one does not. */
      if ((el = t.closest('[data-xm-save]'))) {
        const o = byId(readURL().doc);
        const k = el.getAttribute('data-xm-save');
        const ta = $('[data-xm-val="' + k.replace(/"/g, '\\"') + '"]');
        if (o && ta) { o.x = o.x || {}; o.x[k] = ta.value.trim(); }
        closeXModal();
        repaintEditor();
        return;
      }
      if (t.closest('[data-xm-close]') || t.hasAttribute('data-xm-backdrop')) {
        closeXModal();
        return;
      }
      if ((el = t.closest('[data-x-modal]'))) {
        const o = byId(readURL().doc);
        if (o) xModal(o, el.getAttribute('data-x-modal'), el.getAttribute('data-x-lead'));
        return;
      }
      /* The type-switch note is read once. It also clears itself when you leave
         the document — see patch() — because it is about one switch on one
         object, not a standing fact about it. */
      if (t.closest('[data-note-clear]')) { switchNoted = null; repaintEditor(); return; }
      /* ── The stepper's buttons, minus the part the library already does ──

         `[data-step]` belongs to the design system and it steps the input
         itself. Stepping it here as well is how one press moved a fit score by
         two — the product re-implementing a library behaviour it had only read
         the CSS for.

         What the library cannot know is this field's ceiling and where the
         value is stored, so that is all that is left to do: clamp what it
         wrote, and commit it through the same writer typing uses, so a nudge
         and a keystroke cannot store different things. */
      if ((el = t.closest('[data-step]'))) {
        const inp = el.parentNode.querySelector('[data-x-val]');
        if (!inp) return;
        inp.value = String(clampToField(inp, String(inp.value).trim()));
        commitXField(inp);
        repaintEditor();
        return;
      }
      /* A type field unfolds the same way a custom fact does, and closes the
         other one on the way — two open inputs in a 320px rail is two carets
         and no way to tell which one Enter belongs to. */
      if ((el = t.closest('[data-x-open]'))) {
        openXField = el.getAttribute('data-x-open');
        openProp = null;
        /* renderDoc focuses the row it just unfolded — see the focus chain at
           the end of it. Doing it here on a timer meant holding a reference to
           an element a later repaint could replace, and racing a delay nobody
           could tune. */
        repaintEditor();
        return;
      }
      if ((el = t.closest('[data-x-drop]'))) {
        const o = byId(readURL().doc);
        const k = el.closest('[data-x-list]').getAttribute('data-x-list');
        const i = +el.getAttribute('data-x-drop');
        o.x[k] = (o.x[k] || []).filter((_, n) => n !== i);
        repaintEditor();
        return;
      }
      if ((el = t.closest('[data-prop-open]'))) {
        openProp = el.getAttribute('data-prop-open');
        openXField = null;
        /* Focused by renderDoc's chain, same as a type field. */
        repaintEditor();
        return;
      }
      if ((el = t.closest('[data-prop-del]'))) {
        const o = byId(readURL().doc);
        const k = el.getAttribute('data-prop-del');
        delete o.props[k];
        if (openProp === k) openProp = null;
        repaintEditor();
        return;
      }
      /* No `[data-prop-add]` branch: the control that reached it is gone, and
         a handler minting `property-1` for a button nothing renders is the
         kind of thing that reads as load-bearing three rewrites later. */
      if ((el = t.closest('[data-discard]'))) {
        const o = byId(el.getAttribute('data-discard'));
        [CORPUS, LIVE, ENTITLED].forEach((arr) => { const i = arr.indexOf(o); if (i > -1) arr.splice(i, 1); });
        /* The document is gone, so there is nothing left to save it to and
           nothing left to put back. Asking would be asking about a document
           that no longer exists. */
        clearEdits();
        patch({ doc: '' });
        markAfter('.rm-main');
        toast('Discarded', null, 'Nothing was saved');
        return;
      }
      if ((el = t.closest('[data-versions]'))) {
        /* In the editor the version panel is already beside the body, so the
           chrome control only has work to do while reading. */
        const det = $('#docVersions');
        if (det) { det.open = true; det.scrollIntoView({ block: 'nearest' }); $('.ver-item', det).focus(); }
        else { const p = $('.ver-list'); if (p) p.scrollIntoView({ block: 'nearest' }); }
        return;
      }
      if ((el = t.closest('[data-card-act]'))) {
        cardActRun(el.getAttribute('data-card-act'));
        return;
      }
      /* Recording what a document conflicts with is a statement about both, so
         it is written on both — a one-sided contradiction would leave the other
         document claiming to be current while this one disagrees with it. */
      if ((el = t.closest('[data-set-conflict]'))) {
        const [a, b] = el.getAttribute('data-set-conflict').split(':');
        const A = byId(a), B = byId(b);
        if (!A || !B) return;
        assertEdge(a, b, 'contradicts');
        recompute();
        render();
        markCard(a); markCard(b);
        docAct('compare', a);
        return;
      }
      if ((el = t.closest('[data-set-successor]'))) {
        const [a, b] = el.getAttribute('data-set-successor').split(':');
        if (!byId(a) || !byId(b)) return;
        assertEdge(a, b, 'supersededBy');
        recompute();
        canvas.close();
        patch({ doc: b });
        markCard(a); markCard(b);
        toast('Recorded', 'Undo', esc(byId(b).title) + ' replaces ' + esc(byId(a).title));
        undoStack = () => { dropEdge(a, b); recompute(); render(); };
        return;
      }
      /* Promoting a neighbour to a connection is a claim about two documents,
         so it goes through the commit surface and comes out with a name and a
         date on it — which is the whole difference between the two lists. */
      if ((el = t.closest('[data-connect]'))) {
        const [a, b] = el.getAttribute('data-connect').split('|');
        const A = byId(a), B = byId(b);
        if (!A || !B) return;
        commit({
          title: 'Connect two documents',
          current: A.title, proposed: B.title,
          rationale: 'AiMY noticed these share fields. Connecting them is <strong>your</strong> claim, '
            + 'and it will carry your name and today\'s date wherever it is read.',
          effects: [['ok', 'Both documents show <strong>Related to</strong> the other'],
                    ['ok', 'Recorded as asserted by ' + esc(USER.owner)]],
          confirm: 'Connect them', done: 'Connected',
          onRun: () => {
            assertEdge(a, b, 'related');
            recompute(); render(); markCard(a); markCard(b);
            toast('Connected', 'Undo', esc(A.title) + ' and ' + esc(B.title));
            undoStack = () => { dropEdge(a, b); recompute(); render(); };
          }
        });
        return;
      }
      if ((el = t.closest('[data-act]'))) {
        docAct(el.getAttribute('data-act'), el.getAttribute('data-obj'), el.getAttribute('data-arg'));
        return;
      }
      /* The trigger only opens the panel. `aria-expanded` is kept honest here
         rather than left to the design system's outside-click closer, which
         removes the class and knows nothing about the button that owns it. */
      if ((el = t.closest('[data-new-menu]'))) {
        const anchor = el.closest('.menu-anchor');
        if (anchor) {
          const open = anchor.classList.toggle('open');
          el.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        return;
      }
      if ((el = t.closest('[data-new-type]'))) { newDocument(el.getAttribute('data-new-type')); return; }
      if ((el = t.closest('[data-apply-ids]'))) {
        const ids = el.getAttribute('data-apply-ids').split(',');
        /* The gate has no surface to narrow, so the documents leave with you.
           A cross-page navigation rather than a patch, because the destination
           is a different document \u2014 and `ids` means the same thing on both
           sides, so nothing has to be translated. */
        if (canvas.inline) { location.href = 'console.html?ids=' + encodeURIComponent(ids.join(',')); return; }
        canvas.close();
        surfaceIds(ids);
        return;
      }

      /* ── set scope ── */
      /* ── unsaved changes ── */
      if (t.closest('[data-changes-save]')) { saveChanges(); return; }
      if (t.closest('[data-changes-discard]')) { discardChanges(); return; }
      /* The guard's second answer. It is a button in the commit footer rather
         than a second commit surface, because "save or discard" is one
         decision and splitting it over two dialogs would make the second one
         look like a change of mind about the first. */
      if (t.closest('[data-guard-discard]')) {
        closeCommit();
        discardChanges(true);
        runGuardNext();
        return;
      }
      /* ── commit surfaces ── */
      if (t.closest('[data-commit-close]') || (t.hasAttribute && t.hasAttribute('data-hide-on-backdrop') && t === e.target && t.classList.contains('modal-backdrop'))) {
        /* Cancelling the guard is staying on the document, so the navigation
           it was holding is dropped rather than kept for later. */
        guardNext = null;
        closeCommit(); return;
      }
      if ((el = t.closest('[data-commit-run]'))) {
        const label = el.getAttribute('data-commit-run');
        const run = pendingCommit;
        /* Run BEFORE tearing the surface down. Several commits carry a form —
           the schedule radios, the grounding checkboxes, the retention rule —
           and closing first left onRun reading a form that no longer existed,
           so the change silently did nothing. */
        /* And if it throws, say so. A commit that dies mid-run used to leave
           this surface open with the button still sitting there, which reads
           as "it refuses and will not tell me why". */
        /* Read before the teardown clears it, the same ordering `run` needs. */
        const agent = pendingAgent;
        let handled = false, failed = false;
        try { handled = run ? run() === true : false; }
        catch (err) { failed = true; console.error('commit failed:', err); }
        closeCommit();
        /* The second funnel. `writeURL` closes the canvas for anything that
           changes the URL, but a commit can change the page without touching
           it — connecting two documents rewrites the rail and leaves the
           address alone — and the result is behind the overlay either way. A
           commit that ran, changed something. */
        if (!failed && canvas.open) canvas.close();
        if (failed) { toast("That didn't go through", null, 'Nothing was changed'); return; }
        /* ── A run you can watch, and a receipt ──

           A commit may declare `agent`, and when it does the confirmation it
           already asked for runs through a visible cycle and lands on a
           receipt instead of a toast. OPT-IN PER WRITE: there are fifty-three
           toasts in this file and almost all of them report something small
           and instant, where a receipt would be ceremony. The ones that earn
           it are the writes that touch several documents at once.

           `handled` still wins. A commit that wrote its own toast has already
           said something more specific than either of these could. */
        if (!handled && agent && window.AIMY_AGENT && window.AIMY_AGENT.available()) {
          const host = $('#agentHost');
          window.AIMY_AGENT.open(host);
          window.AIMY_AGENT.run(host, agent, () => {
            window.AIMY_AGENT.receipt(host, Object.assign({ title: label }, agent.receipt || {}));
          });
          return;
        }
        /* An onRun that says something specific returns true and keeps its own
           toast. Without this the generic one lands on top of it, and the user
           reads a restatement of the button they just pressed. */
        if (!handled) toast(label, 'Undo', 'Logged to the audit trail');
        return;
      }

      /* ── the axis panel: governance and sources, in place ── */

      if (t.closest('[data-stage-drop]')) { stagedSetting = null; render(); return; }
      if (t.closest('[data-stage-run]')) {
        const stage = stagedSetting;
        stagedSetting = null;
        if (!stage) { render(); return; }
        /* Drive the control rather than the model, so the staged path and the
           clicked path cannot drift apart. */
        const dd = $(`#setSheet .v2-dropdown[data-set-key="${stage.key}"]`);
        const opt = dd && $$('.v2-dropdown-option', dd).find((o) => o.dataset.slug === stage.value);
        if (!opt) { render(); return; }
        $$('.v2-dropdown-option', dd).forEach((o) => o.setAttribute('aria-selected', String(o === opt)));
        dd.dispatchEvent(new CustomEvent('dd:change', { bubbles: true }));
        return;
      }
      /* Folding the rail is view state, not document state — it is about this
         screen, not about this document, so it does not belong in the URL. */
      if (t.closest('[data-rail-toggle]')) { railOpen = !railOpen; renderDoc(readURL()); return; }

      /* ── the peek ── */
      if (t.closest('[data-peek-close]')) { closePeek(); return; }
      if (t.closest('[data-peek-back]')) { peekStack.pop(); peekRender(); return; }
      if ((el = t.closest('[data-peek-show]'))) {
        const [k, v] = el.getAttribute('data-peek-show').split(':');
        const f = (ENTITY[k] || {}).filter;
        closePeek();
        /* An axis the URL knows becomes that filter; anything else becomes the
           explicit set of ids, which is the same bridge an answer uses. */
        if (f && f !== 'ids' && LIST_KEYS.indexOf(f) > -1) patch({ [f]: [v] });
        else patch({ ids: docsOf(k, v).map((o) => o.id) });
        return;
      }
      if ((el = t.closest('[data-peek]'))) {
        const [k, v] = el.getAttribute('data-peek').split(':');
        /* Inside the panel it stacks; from the page it starts fresh. */
        openPeek(k, v, el, !!t.closest('#peek'));
        return;
      }
      if (peekStack.length && !t.closest('#peek')) closePeek();

      if (t.closest('[data-set-close]')) { setModal.close(); return; }
      if ((el = t.closest('[data-settings]'))) { patch({ settings: el.getAttribute('data-settings') }); return; }



      if ((el = t.closest('[data-reconnect]'))) {
        const k = el.getAttribute('data-reconnect');
        const was = { health: SRC[k].health, note: SRC[k].note, code: SRC[k].code };
        SRC[k].health = 'ok';
        SRC[k].note = 'Reconnected just now · first sync queued';
        delete SRC[k].code;
        SRC[k].history.unshift([0, 'ok', 'Reconnected by ' + USER.owner + ' · sync queued']);
        SRC[k].queued = true;
        undoStack = () => { Object.assign(SRC[k], was); SRC[k].history.shift(); render(); };
        render();
        markAfter('.rail-set');
        toast(SRC[k].label + ' reconnected', 'Undo', 'Sync queued · ingestion resumes on the next cycle');
        return;
      }
      if ((el = t.closest('[data-sync-source]'))) {
        const k = el.getAttribute('data-sync-source');
        SRC[k].history.unshift([0, 'ok', 'Manual sync by ' + USER.owner + ' · no changes found']);
        SRC[k].last = 0;
        delete SRC[k].queued;
        render();
        toast(SRC[k].label + ' synced', null, 'Triggered by hand — the schedule is unchanged');
        return;
      }

      /* ── editor ── */
      if ((el = t.closest('[data-fmt]'))) {
        const [cmd, val] = el.getAttribute('data-fmt').split(':');
        /* formatBlock wants a tag name in angle brackets in several engines and
           silently does nothing without them. */
        document.execCommand(cmd, false, cmd === 'formatBlock' ? '<' + val + '>' : (val || null));
        const body = $('#editBody');
        if (body) {
          body.focus();
          writeBody(body);
          syncToolbar();
        }
        return;
      }
      if ((el = t.closest('[data-suggest]'))) {
        const verdict = el.getAttribute('data-suggest');
        const ins = $('#aiSuggest ins');
        const o = byId(readURL().doc);
        if (!aiDraft || !o) return;

        /* Edit means edit THIS — the proposal, in place. It lives in state now,
           so it survives the repaint that used to wipe it. */
        if (verdict === 'edit') {
          aiDraft.editing = true;
          renderDoc(readURL());
          const box = $('#aiSuggest ins');
          if (box) {
            box.focus();
            const r = document.createRange();
            r.selectNodeContents(box);
            const sel = window.getSelection();
            sel.removeAllRanges(); sel.addRange(r);
          }
          return;
        }

        /* Accepting applies what is on screen — which, after an edit, is yours
           rather than what was proposed. */
        const html = ins ? ins.innerHTML.trim() : aiDraft.proposed;
        const text = ins ? ins.innerText.trim() : stripTags(aiDraft.proposed);
        const edited = html !== aiDraft.proposed;
        const msg = aiDraft.msg;

        if (verdict === 'accept') {
          /* Same split the writing tools use: o.html is what the document says,
             o.sum is the plain-text projection everything else reads. */
          o.sum = text;
          o.html = html;
          o.upd = 0;
          /* Accepting an edit is not publishing. A draft stays a draft until
             someone presses Publish — otherwise taking AiMY's wording would
             quietly make a brand-new document live. */
          /* An AiMY edit is an ordinary version with an AiMY author — not a
             separate history, so reviewing the human history never hides it. */
          addVersion(o, aiDraft.label, 'AiMY',
            edited ? 'edited and accepted by ' + USER.owner : 'accepted by ' + USER.owner, text, true);
          o.versions[0].html = html;
          recompute();
        }

        /* Either verdict ends the proposal. It stopped being a block that
           lingers with a note inside it: the record of what happened belongs to
           the canvas message, and the editor goes back to being the document. */
        aiDraft = null;
        aiOutcome(msg, verdict);
        repaintEditor();
        if (verdict === 'accept') {
          markAfter('#editBody', $('#docCanvas'));
          markCard(o.id);
          toast('Applied', 'Undo', 'Filed as a version with AiMY as the author');
        } else {
          toast('Rejected', null, 'Kept in the trail, not applied');
        }
        return;
      }
      if ((el = t.closest('[data-restore]'))) {
        const o = byId(el.getAttribute('data-restore'));
        const agents = AGENTS.filter((a) => COLLECTION_META[o.col].grounding[a.id]).length;
        /* Restoring what you are previewing, not a fixed version — the button
           lives beside the preview, so it has to mean the one on screen. */
        const idx = previewVer === null ? 1 : previewVer;
        const from = VERSIONS(o)[idx] || VERSIONS(o)[VERSIONS(o).length - 1];
        commit({
          title: 'Restore ' + from.v,
          current: (VERSIONS(o)[0] || {}).v + ' · current', proposed: from.v + ' restored as the newest version',
          rationale: `Restore is additive: it creates a new version rather than deleting the ones it supersedes,
            so the audit trail does not acquire a hole exactly where someone will later need to look.`,
          confirm: 'Restore this version',
          effects: [
            agents ? ['warn', `Changes what <strong>${agents} consuming agent(s)</strong> answer from.`]
                   : ['skip', 'No agent grounds on this collection, so no answer changes.'],
            ['ok', 'History preserved — every superseded version stays readable.']],
          onRun: () => {
            o.sum = from.body;
            o.html = from.html || '';
            o.upd = 0;
            addVersion(o, 'Restored ' + from.v, USER.owner, 'restored from ' + fmtShort(from.at), from.body);
            o.versions[0].html = from.html || '';
            recompute();
            repaintEditor();
            markAfter('#editBody', $('#docCanvas'));
            markCard(o.id);
            toast('Restored ' + from.v, null, 'Added as the newest version — nothing was deleted');
            return true;
          }
        });
        return;
      }
      /* The figure's own file field. Its mousedown is cancelled with the rest
         of the writing chrome, so the body is never blurred and never
         repainted — which is what keeps this element attached long enough for
         the picked file to land in it. */
      if ((el = t.closest('[data-pick-image]'))) {
        const name = el.getAttribute('data-pick-image');
        pickFiles('image/*', false, (files) => {
          const f = files[0];
          /* Re-found, not remembered. The dialog blurred the page and the
             editor repainted while it was open, so `el` and the figure it was
             in are both detached by now. */
          const fig = $(`.doc-figure[data-fig="${name}"]`);
          const ph = fig && $('.doc-figure-ph', fig);
          if (!fig) return;
          const img = document.createElement('img');
          img.className = 'doc-figure-img';
          img.src = URL.createObjectURL(f);
          img.alt = '';
          if (ph) ph.replaceWith(img); else fig.insertBefore(img, fig.firstChild);
          const cap = $('figcaption', fig);
          if (cap && !cap.textContent.trim()) cap.textContent = f.name.replace(/\.[^.]+$/, '');
          const body = $('#editBody');
          if (body) writeBody(body);
        });
        return;
      }
      /* The attribute's VALUE narrows the picker, for a control that is about
         one particular file rather than about adding to Knowledge. A bare
         `data-pick-files` reads as '' and keeps the old behaviour exactly:
         everything, many at a time. A narrowed one takes a single file,
         because "Replace the deck" is not a bulk action. */
      if ((el = t.closest('[data-pick-files]'))) {
        const only = el.getAttribute('data-pick-files');
        pickFiles(only || FILE_ACCEPT, !only, ingestFiles);
        return;
      }
      if ((el = t.closest('[data-blocks]'))) {
        const open = el.getAttribute('aria-expanded') === 'true';
        if (open) { closeBlockMenu(); return; }
        el.setAttribute('aria-expanded', 'true');
        openBlockMenu(el.getBoundingClientRect(), false);
        return;
      }
      if ((el = t.closest('[data-block]'))) {
        const spec = BLOCKS[Number(el.getAttribute('data-block'))];
        closeBlockMenu();
        if (!spec) return;
        const body = $('#editBody');
        if (body) {
          body.focus({ preventScroll: true });
          /* Clear the "/" that summoned the menu before the block is made. */
          if (slashed && slashed.textContent.trim() === '/') {
            const r = document.createRange();
            r.selectNodeContents(slashed);
            putCaret(r);
            document.execCommand('delete');
          }
          slashed = null;
          spec[2]();
          writeBody(body);
          setTimeout(placeBlockMark, 0);
        }
        return;
      }
      /* The toolbar's AiMY button: document scope. */
      if ((el = t.closest('[data-ai-doc]'))) {
        const o = byId(readURL().doc);
        const isBlank = o && !String(o.sum || '').trim();
        /* The draft-from-connections action is offered only when there is
           something to draft from, so the menu never names a source that does
           not exist. */
        /* The view's list, so a ticket is not offered "Expand" and a profile
           is rewritten for sellers rather than for support agents. DOC_AI
           stays as the fallback for anything without a view. */
        const ai = o ? viewFor(o).ai : null;
        const items = ((ai ? ai[isBlank ? 'blank' : 'filled'] : null) ||
                       (isBlank ? DOC_AI.blank : DOC_AI.filled))
          .concat(o && claimsOf(o).length ? [DOC_AI.fromConnections] : []);
        aiMenu(el, items, 'data-ai-doc-run');
        return;
      }
      if ((el = t.closest('[data-ai-doc-run]'))) {
        const label = el.getAttribute('data-ai-doc-run');
        const m = el.closest('.ai-menu');
        if (m) m.remove();
        const o = byId(readURL().doc);
        if (!o) return;
        /* Not every AiMY action is a rewrite. "Find a source for this" asks
           whether the corpus supports what the document says, which is a
           question about grounding — proposing it as body text was answering a
           different question in the wrong place. */
        aiPropose(label, aiCopy(label, o));
        return;
      }
      if ((el = t.closest('[data-ai-sel]'))) {
        const m = el.closest('.ai-menu');
        if (m) m.remove();
        const o = byId(readURL().doc);
        const label = el.getAttribute('data-ai-sel');
        /* The selected words, which the selection actions never received. */
        const picked = el.closest('.ai-menu').dataset.sel || '';
        if (!o) return;
        if (label === 'Find a source') { groundingAnswer(o, picked); return; }
        aiPropose(label, aiCopy(label, o, picked));
        return;
      }
      if ((el = t.closest('[data-resolve-problem]'))) {
        const o = byId(readURL().doc);
        const i = Number(el.getAttribute('data-resolve-problem'));
        const c = o && (o.comments || [])[i];
        if (!c) return;
        c.done = true;
        c.resolvedBy = USER.owner;
        recompute();
        render();
        markAfter('.comment.is-done', $('#docCanvas'));
        markCard(o.id);
        toast('Marked resolved', 'Undo', 'The report stays on the document, closed');
        undoStack = () => { delete c.done; delete c.resolvedBy; recompute(); render(); };
        return;
      }
      if (t.closest('[data-comment-add]')) {
        const input = $('[data-comment-input]');
        const o = byId(readURL().doc);
        if (!input || !input.value.trim() || !o) return;
        addComment(o, input.value.trim());
        render();
        markAfter('.comment:last-of-type', $('#docCanvas'));
        toast('Comment added', 'Undo', 'On ' + o.title);
        undoStack = () => { o.comments.pop(); render(); };
        return;
      }

      /* ── answers ── */
      if ((el = t.closest('[data-raise-gap]'))) {
        /* A gap is the absence of a document, so the only honest destination is
           the document. Raising it creates the draft and opens it. */
        const q = el.getAttribute('data-raise-gap');
        canvas.close();
        newDocument('article', { title: q.replace(/\?$/, '') });
        toast('Draft started', null, 'From the question nothing could answer');
        return;
      }
      if ((el = t.closest('[data-flag]'))) {
        const id = el.getAttribute('data-flag');
        /* Same reasoning as the source row above, and the toast goes with it:
           the message it would show describes the document it just opened, and
           on the gate that document is on the next page. */
        if (canvas.inline) { location.href = 'console.html?doc=' + encodeURIComponent(id); return; }
        canvas.close();
        patch({ doc: id });
        toast('Flagged — opened the source so it can be corrected', null, 'Feedback is captured per citation, not per answer');
        return;
      }

      /* ── canvas ── */
      if (t.closest('[data-overlay-close]')) { canvas.close(); return; }
      if (t.closest('[data-mem-drop]')) {
        /* Dropped from the thread as well as from the screen: a panel that
           comes back when you return to the conversation was not dismissed. */
        const m = t.closest('.memory-panel');
        if (m) m.remove();
        const turns = thread$();
        const i = turns.findIndex((x) => x.who === 'memory');
        if (i > -1) turns.splice(i, 1);
        return;
      }
      /* ── Skills, from the composer ── */
      if ((el = t.closest('[data-skill-use]'))) {
        const k = CHAT_SKILLS.find((x) => x.id === el.getAttribute('data-skill-use'));
        skillPickOpen = false;
        paintSkillPicker();
        if (!k) return;
        armedSkill = k;
        const box = $('#overlayInput') || $('#floatInput');
        if (box) {
          /* The slash comes back out. It was a way of opening the picker, not
             part of the question, and leaving it in the box means it arrives
             in the question text and in the conversation title. */
          box.value = String(box.value || '').replace(/^\s*\/\S*\s?/, '');
          box.focus();
        }
        toast('Using ' + k.name, null, 'Applies to your next question, then clears');
        return;
      }
      if (skillPickOpen && !t.closest('#skPick') && !t.closest('.overlay-input-bar')) {
        skillPickOpen = false; paintSkillPicker();
      }

      if (t.closest('[data-kp-close]')) { palette.close(); return; }
      if ((el = t.closest('[data-kp]'))) { palette.run(Number(el.getAttribute('data-kp'))); return; }

      /* ══ AN ANSWER'S OWN CONTROLS ══════════════════════════════════════
         All four read the question off the message rather than off an index
         into the turns array, because a rebuild replaces every element and an
         index would be pointing at the wrong turn by the time it was used. */
      if (t.closest('#clipBtn')) { const f = $('#clipIn'); if (f) f.click(); return; }
      if ((el = t.closest('[data-clip-drop]'))) {
        const bar = el.closest('.overlay-input-wrap') || document;
        const chip = $('.clip-chip', bar);
        if (chip) chip.remove();
        const f = $('#clipIn'); if (f) f.value = '';
        return;
      }

      if ((el = t.closest('[data-handoff]'))) {
        /* STAGED, NOT SENT. There is no routing table and no queue, so this
           writes the request where one would be picked up and says exactly
           that. The repo already treats writes it cannot execute this way. */
        toast('Request staged for a person', null,
              'Nothing was sent \u2014 there is no routing yet. The question and its scope are recorded.');
        el.setAttribute('disabled', '');
        el.textContent = 'Staged';
        return;
      }

      if ((el = t.closest('[data-msg-copy]'))) {
        const msg = el.closest('.chat-msg');
        const bubble = msg && msg.querySelector('.msg-bubble');
        if (!bubble) return;
        /* The TEXT, not the markup. Pasting an answer into a ticket should
           give prose, not a div carrying citation tooltips. */
        const text = (bubble.innerText || bubble.textContent || '').trim();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(
            () => toast('Answer copied', null, text.length + ' characters, as plain text'),
            () => toast('Could not copy', null, 'The browser refused clipboard access')
          );
        }
        return;
      }

      if ((el = t.closest('[data-msg-retry]'))) {
        const msg = el.closest('.chat-msg');
        const q = msg && msg.dataset.q;
        if (!q) return;
        /* Asked again, as a new turn rather than in place. An answer that
           quietly rewrote itself would destroy the thing you wanted to compare
           it against, which is the only reason to press Retry. */
        submit(q);
        return;
      }

      if ((el = t.closest('[data-msg-rate]'))) {
        const on = el.getAttribute('aria-pressed') === 'true';
        const row = el.closest('.msg-acts');
        /* One opinion per answer: rating it useful clears "not useful". */
        if (row) $$('[data-msg-rate]', row).forEach((b) => b.setAttribute('aria-pressed', 'false'));
        el.setAttribute('aria-pressed', on ? 'false' : 'true');
        if (!on) {
          toast(el.getAttribute('data-msg-rate') === 'up' ? 'Marked useful' : 'Marked not useful',
                null, 'Recorded against this answer, not the conversation');
        }
        return;
      }

      if ((el = t.closest('[data-msg-src]'))) {
        const msg = el.closest('.chat-msg');
        const q = msg && msg.dataset.q;
        if (!msg || !q) return;
        const open = msg.querySelector('.msg-sources');
        if (open) { open.remove(); el.setAttribute('aria-expanded', 'false'); return; }
        const ids = answerIds(q);
        if (!ids.length) return;
        /* `sourceRow` is the Console's own template, so a source listed here
           and a source listed inside an answer are the same row with the same
           behaviour — including opening the document. */
        const rows = ids.map((id, i) => sourceRow(i + 1, id)).join('');
        const acts = msg.querySelector('.msg-acts');
        const html = `<div class="msg-sources"><div class="msg-sources-cap">What this answer stands on</div>${rows}</div>`;
        if (acts) acts.insertAdjacentHTML('afterend', html);
        else msg.insertAdjacentHTML('beforeend', html);
        el.setAttribute('aria-expanded', 'true');
        return;
      }

      if ((el = t.closest('.overlay-sugg-chip'))) { submit(el.textContent.trim()); return; }

      /* ══ STARTING A CONVERSATION ══════════════════════════════════════
         The column listed conversations and switched between them, and there
         was no way to START one: a session was created only as a side effect
         of asking a question, so once you were inside a thread everything you
         typed went into that thread. The one thing a list of conversations
         has to offer was the one thing missing.

         A BLANK SESSION, NAMED WHEN IT HAS SOMETHING TO NAME IT. `submit`
         renames it on the first question. The surface stays exactly where it
         is — a new conversation is a new subject, not a new place. */
      if (t.closest('[data-newchat]')) {
        const key = 'sess-' + (++sessSeq);
        SESSIONS[key] = { title: 'New conversation', at: iso(TODAY), state: snapshot(),
                          agent: PAGE_AGENT, blank: true };
        THREADS[key] = [];
        /* Stamped on creation, or a brand-new conversation would sort below
           every one you had already spoken in — including at the moment it is
           the one you are standing in. */
        touchThread(key);
        restoring = true;
        patch({ chat: key });
        restoring = false;
        canvas.show();
        paintThread();
        if (canvas.input) canvas.input.focus();
        return;
      }

      /* ══ THE CONVERSATION'S OWN CONTROLS ═══════════════════════════════
         BEFORE the `data-chat` branch below, and that ordering is the whole
         reason these work. Every one of these lives inside `.ov-chat-row`, and
         the switch handler matches on `[data-chat]` anywhere in the row — so
         placed after it, a click on Rename would open the conversation
         instead. It is the same failure the card branch documents at the
         bottom of this router. */

      /* Click-off. Deliberately does NOT return: the click that closes a menu
         is usually also a click on something else, and swallowing it would
         make every first click after opening a menu do nothing. */
      if (CHAT_MENU && !t.closest('.ov-chat-row')) { CHAT_MENU = ''; paintChats(); }

      if ((el = t.closest('[data-chat-menu]'))) {
        const k = el.getAttribute('data-chat-menu');
        CHAT_MENU = (!k || CHAT_MENU === k) ? '' : k;
        paintChats();
        return;
      }

      if ((el = t.closest('[data-chat-rename]'))) {
        CHAT_EDIT = el.getAttribute('data-chat-rename');
        CHAT_MENU = '';
        paintChats();
        const box = $('#chatRename');
        /* Select rather than place a caret: the title is a whole question, and
           renaming almost always means replacing it, not editing a word. */
        if (box) { box.focus(); box.select(); }
        return;
      }

      if ((el = t.closest('[data-chat-share]'))) {
        const k = el.getAttribute('data-chat-share');
        const url = location.origin + location.pathname + '?chat=' + encodeURIComponent(k);
        CHAT_MENU = '';
        paintChats();
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => {}, () => {});
        /* SAID PLAINLY. The link is real and it works — for you. Conversations
           live in this browser, so it opens empty for anybody else, and a
           share control that did not say so would be the one place this build
           lied about what it is. */
        toast('Link copied', null, 'Opens this conversation in your browser. Nobody else can read it yet.');
        return;
      }

      if ((el = t.closest('[data-chat-pin]'))) {
        const k = el.getAttribute('data-chat-pin');
        if (SESSIONS[k]) SESSIONS[k].pinned = !SESSIONS[k].pinned;
        CHAT_MENU = '';
        saveChats();
        paintChats();
        return;
      }

      /* Two rungs, and the first one is not destructive. A conversation is not
         corpus data, so it does not deserve the typed confirmation a document
         deletion gets — but it does deserve more than a single click on a
         menu item sitting where "Rename" was a moment ago. */
      if ((el = t.closest('[data-chat-del]'))) {
        CHAT_MENU = '!' + el.getAttribute('data-chat-del');
        paintChats();
        return;
      }

      if ((el = t.closest('[data-chat-del-ok]'))) {
        const k = el.getAttribute('data-chat-del-ok');
        const wasHere = threadKey() === k;
        /* Recorded, not just removed. `seedSessions()` runs on every boot and
           would otherwise put a deleted fixture straight back, which reads as
           the delete having silently failed. */
        DELETED.add(k);
        delete SESSIONS[k]; delete THREADS[k]; delete THREAD_AT[k];
        CHAT_MENU = '';
        saveChats();
        if (wasHere) { restoring = true; patch({ chat: '' }); restoring = false; }
        paintThread();
        toast('Conversation deleted', null, 'Removed from this browser');
        return;
      }

      /* ══ SWITCHING TO ONE ═════════════════════════════════════════════
         BOTH, FROM ONE CLICK: the thread, and the surface it was had on.
         Restoring one without the other is the half that was already there —
         the conversation, without the thing it was about.

         The stored state is laid over the URL through `writeURL` rather than
         `patch`, because `patch` drops the open document whenever a filter
         changes — which is right for a filter click and exactly wrong here,
         where the filters and the document are being restored together. And
         `parseParams` fills every key, so this is a reset rather than a merge:
         filters that were set a moment ago do not survive underneath. */
      if ((el = t.closest('[data-chat]'))) {
        const ck = el.getAttribute('data-chat');
        const sess = SESSIONS[ck];
        restoring = true;
        /* The gate has no surface to restore, so restoring one would write
           filter keys into a URL nothing on the page reads — state that then
           travels with you into the Console. The thread alone is the whole of
           what switching means here. */
        if (canvas.inline) {
          patch({ chat: ck === 'surface' ? '' : ck });
          restoring = false;
          paintThread();
          return;
        }
        if (sess && sess.state) {
          const st = parseParams(new URLSearchParams(String(sess.state).replace(/^\?/, '')));
          st.chat = ck;
          writeURL(st);
        } else {
          /* A thread with no stored surface — `surface` itself — keeps the
             one you are on. There is nothing of its own to go back to. */
          patch({ chat: ck === 'surface' ? '' : ck });
        }
        restoring = false;
        canvas.show();
        paintThread();
        return;
      }

      /* The whole card opens the document. LAST in the delegate on purpose:
         the title, the action, the tags and everything else interactive inside
         a card have already claimed the click and returned by here. Placing it
         any earlier makes the card swallow its own action button. */
      if ((el = t.closest('[data-card-open]'))) {
        patch({ doc: el.getAttribute('data-card-open') });
        return;
      }

      if (t.closest('[data-toast-undo]')) {
        const h = $('#toastHost');
        if (h) h.innerHTML = '';
        if (undoStack) { undoStack(); undoStack = null; } else history.back();
        return;
      }
    });
  }

  /* A blank state object with the same shape readURL produces, so callers can
     build a URL from scratch without hand-writing every key. */
  function readURL0() {
    const cur = readURL();
    /* WHAT SURVIVES A CLEAR. The view, the grouping and the ordering do,
       because they are how you are looking rather than what you are looking
       at — and so does the open conversation, for the same reason.

       It did not, and every path through here dropped it: typing a sentence
       that carried both a filter and a question applied the filter, lost the
       thread, and answered in a NEW one — so the follow-up and the question
       it followed ended up in two conversations. `Show these on the surface`
       had the same fault, and that one is a button INSIDE the thread it was
       ending. A conversation is not a filter and clearing the filters is not
       a way to end it. */
    const st = { doc: '', settings: '', chat: cur.chat,
                 view: cur.view, by: cur.by, sort: cur.sort, q: '', prop: '' };
    LIST_KEYS.forEach((k) => { st[k] = []; });
    DATE_KEYS.forEach((k) => { st[k] = ''; });
    FLAG_KEYS.forEach((k) => { st[k] = false; });
    return st;
  }

  function addFilter(key, value) {
    const st = readURL();
    if (FLAG_KEYS.indexOf(key) > -1) st[key] = true;
    else if (LIST_KEYS.indexOf(key) > -1) { st[key] = st[key] || []; if (st[key].indexOf(value) === -1) st[key].push(value); }
    else st[key] = value;
    st.doc = '';
    rememberFilter();
    writeURL(st);
  }

  function dropChip(key, value) {
    const st = readURL();
    if (FLAG_KEYS.indexOf(key) > -1) st[key] = false;
    else if (key === 'q' || key === 'prop') st[key] = '';
    else if (LIST_KEYS.indexOf(key) > -1) st[key] = st[key].filter((v) => v !== value);
    else st[key] = '';
    writeURL(st);
  }

  /* Actions available on a document, from the card or from inside the modal.
     One implementation, so a verify request means the same thing wherever it
     is started from. */
  function docAct(kind, id, arg) {
    const o = byId(id);
    if (!o) return;

    /* Out of date has one honest remedy: pull the source again. There is no
       "confirm it is still correct" here, because nobody performs that ritual
       and a button that claims they did is the badge lying in a new place. */
    if (kind === 'resync') {
      /* Nothing to pull from. The rail no longer offers this on a document with
         no upstream, but an old link or a proto entry still could, and running
         it would replace a body with an empty source. */
      if (noUpstream(o)) {
        toast('Nothing to re-sync from', null,
          bornHere(o) ? 'You wrote this here — it has no source' : 'A dropped file is not a live source');
        return;
      }
      const src = SRC[o.src];
      /* Same rule as the card: there is no point confirming a pull from a
         source that cannot answer. */
      if (src.health !== 'ok') return docAct('reconnect', o.id);
      commit({
        title: 'Re-sync from source',
        current: 'Our copy — ' + fmtDate(o.upd),
        proposed: src.label + ' — ' + fmtDate(o.xu),
        rationale: `<strong>${esc(src.label)}</strong> changed after our copy. Pulling it again replaces the body
          with what the source says now.`,
        confirm: 'Pull it now',
        effects: [
          ['ok', 'Runs immediately, outside the schedule.'],
          ['skip', 'Local edits to this document are replaced by the source.']
        ],
        onRun: () => {
          const before = { upd: o.upd, used: o.used, work: o.work, versions: VERSIONS(o).slice() };
          o.upd = o.xu;
          if (o.work === 'failed') o.work = 'completed';
          addVersion(o, 'Re-synced from ' + src.label, src.label, 'pulled from the source');
          recompute();
          undoStack = () => { Object.assign(o, before); recompute(); render(); };
          render();
          markAfter('.rail-facts', $('#docCanvas'));
          markAfter('.doc-head .dv-notice, .doc-byline .trust-state', $('#docCanvas'));
          markCard(o.id);
          toast('Re-synced from ' + src.label, 'Undo', 'Our copy now matches the source');
          return true;
        }
      });
      return;
    }

    if (kind === 'archive') {
      const agents = AGENTS.filter((a) => COLLECTION_META[o.col].grounding[a.id]).length;
      commit({
        title: 'Archive this document', danger: true, typed: 'archive', confirm: 'Archive',
        current: 'Live in ' + COLLECTIONS[o.col], proposed: 'Archived',
        rationale: `Archiving takes <strong>${esc(o.title)}</strong> out of the live corpus and out of answers.
          It is not deletion: the document stays whole, stays addressable at <code>?archived=1</code>, and can be
          restored.`,
        effects: [
          agents ? ['warn', `<strong>${agents} agent(s)</strong> ground on ${esc(COLLECTIONS[o.col])} and will stop citing it.`] : null,
          ['ok', 'Restorable from the archive with its history intact.']
        ].filter(Boolean),
        /* Archiving is a decision about the whole document, already confirmed
           here. It keeps whatever was typed and closes the round rather than
           stacking a second question on top of this one. */
        onRun: () => { o.arch = true; clearEdits(); patch({ doc: '' }); markAfter('.rm-main'); }
      });
      return;
    }

    /* Delete is not archive with a harsher word. It is the only action in the
       product that cannot be undone, so it is reachable only from the archive
       — you have to have archived something and then come back for it. */
    if (kind === 'delete') {
      const m = COLLECTION_META[o.col];
      commit({
        title: 'Delete permanently', danger: true, typed: 'delete', confirm: 'Delete for good',
        current: 'Archived · recoverable', proposed: 'Gone',
        rationale: `<strong>${esc(o.title)}</strong> and its ${VERSIONS(o).length} versions are removed. This cannot
          be undone and there is no restore afterwards.`,
        reversible: 'Not reversible. The audit trail keeps a record that it existed and who deleted it.',
        effects: [
          ['skip', 'Every version goes with it. Citations pointing here will break.'],
          ['warn', `${esc(COLLECTIONS[o.col])} keeps archived documents for ${Math.round(m.purge / 30)} months —
            this is ${o.upd < m.purge ? 'inside' : 'past'} that window.`]
        ],
        onRun: () => {
          [CORPUS, LIVE, ENTITLED].forEach((arr) => { const i = arr.indexOf(o); if (i > -1) arr.splice(i, 1); });
          clearEdits();
          patch({ doc: '' });
          markAfter('.rm-main');
          toast('Deleted', null, 'Permanent · logged to the audit trail');
          return true;
        }
      });
      return;
    }

    if (kind === 'restore') {
      commit({
        title: 'Restore from the archive', confirm: 'Restore',
        current: 'Archived', proposed: 'Live in ' + COLLECTIONS[o.col],
        rationale: `<strong>${esc(o.title)}</strong> returns to the live corpus with its trust state as it was —
          ${esc(STATUS[o.status].label.toLowerCase())}. Restoring does not change its condition.`,
        effects: [
          STATUS[o.status].excluded
            ? ['skip', 'It is ' + STATUS[o.status].label.toLowerCase() + ', so it still will not be used in answers.']
            : ['ok', 'It becomes available to answers again immediately.']
        ],
        onRun: () => { o.arch = false; clearEdits(); patch({ doc: '' }); markCard(o.id); }
      });
      return;
    }

    if (kind === 'successor') {
      const r = RELATED[o.id];
      if (r && r.supersededBy) patch({ doc: r.supersededBy });
      else pickRelated(o, 'successor');
      return;
    }
    if (kind === 'findsuccessor') { pickRelated(o, 'successor'); return; }

    /* Reconnecting is a change to a shared source, not to this document, so it
       is confirmed like one — and the re-sync it was standing in for runs
       straight after, because that is what you were trying to do. */
    if (kind === 'reconnect') {
      const src = SRC[o.src];
      const behind = LIVE.filter((x) => x.src === o.src && x.status === 'outdated');
      commit({
        title: 'Reconnect ' + src.label,
        current: src.note, proposed: 'Connected · syncing resumes',
        rationale: `<strong>${esc(src.label)}</strong> is not connected, so re-syncing <strong>${esc(o.title)}</strong>
          would queue and wait. Reconnecting is the thing that actually moves it.`,
        confirm: 'Reconnect it',
        effects: [
          ['ok', `<strong>${behind.length}</strong> document(s) from this source are behind it.`],
          ['ok', 'This document is pulled again as soon as the connection is back.'],
          ['skip', 'Nothing else is re-ingested now — the schedule handles the rest.']
        ],
        onRun: () => {
          const was = { health: src.health, note: src.note, code: src.code };
          src.health = 'ok';
          src.note = 'Reconnected just now · first sync queued';
          delete src.code;
          src.history.unshift([0, 'ok', 'Reconnected by ' + USER.owner + ' · ' + esc(o.title) + ' pulled']);
          src.last = 0;
          delete src.queued;
          const before = { upd: o.upd, work: o.work, versions: VERSIONS(o).slice() };
          o.upd = o.xu;
          if (o.work === 'failed') o.work = 'completed';
          addVersion(o, 'Re-synced from ' + src.label, src.label, 'pulled once the source reconnected');
          recompute();
          undoStack = () => { Object.assign(src, was); src.history.shift(); Object.assign(o, before); recompute(); render(); };
          render();
          markCard(o.id);
          markAfter('.rail-set');
          toast(src.label + ' reconnected', 'Undo', esc(o.title) + ' is up to date with it');
          return true;
        }
      });
      return;
    }

    /* ── The exits. Each one changes the fact the status is computed from, so
       the badge moves because the world moved, not because someone relabelled
       it. ── */

    if (kind === 'publish') {
      const agents = AGENTS.filter((a) => COLLECTION_META[o.col].grounding[a.id]);
      commit({
        title: 'Publish', confirm: 'Publish it',
        current: 'Draft', proposed: 'Live in ' + COLLECTIONS[o.col],
        rationale: `<strong>${esc(o.title)}</strong> becomes part of the collection and available to whatever is
          allowed to ground on it.`,
        effects: [
          agents.length
            ? ['warn', `<strong>${agents.map((a) => esc(a.name)).join(', ')}</strong> may start citing it immediately.`]
            : ['skip', 'No agent grounds on this collection, so nothing starts citing it.'],
          responsible(o) === 'Unassigned' ? ['warn', 'It has no owner. Publishing does not give it one.'] : null
        ].filter(Boolean),
        onRun: () => {
          const before = { work: o.work, upd: o.upd, versions: VERSIONS(o).slice() };
          o.work = 'completed';
          o.upd = 0;
          addVersion(o, 'Published', USER.owner, 'made live in ' + COLLECTIONS[o.col]);
          recompute();
          undoStack = () => { Object.assign(o, before); recompute(); render(); };
          /* Publishing leaves the editor. Staying in it meant the only feedback
             was a toast over an unchanged screen, which reads as nothing having
             happened — the card on the grid is where the result actually shows. */
          patch({ doc: '' });
          markCard(o.id);
          toast('Published', 'Undo', 'Live in ' + COLLECTIONS[o.col]);
          return true;
        }
      });
      return;
    }

    /* A contradiction is two documents, so resolving it is a choice between
       them rather than an edit to one. The loser is superseded by the winner —
       which is exactly what supersession means and why it already exists. */
    /* A search over the whole corpus, so it opens where searches open. Same
       rows and same `+` as before — only the container changed, from a 320px
       rail block to something wide enough to read. */
    if (kind === 'ground') { groundingAnswer(o); return; }
    if (kind === 'connect') { connectPicker(o); return; }
    /* `arg` is the document at the other end, off the row that was clicked. */
    if (kind === 'disconnect') { disconnectClaim(o, arg); return; }
    if (kind === 'compare' || kind === 'resolve') {
      const other = byId((RELATED[o.id] || { contradicts: [] }).contradicts[0]);
      /* Setting the status by hand says two documents disagree without saying
         which two. Falling back to opening this one answered a different
         question — the card said Compare and behaved like Open. Ask instead. */
      if (!other) { pickRelated(o, 'conflict'); return; }
      if (kind === 'compare') {
        canvas.close();
        canvas.ask('Compare ' + o.title + ' and ' + other.title,
          [o.title, other.title, 'Conflicting'],
          () => conflictAnswer(o, byId(RELATED[o.id].contradicts[0]) || other));
        return;
      }
      const winner = byId(o.id), loser = other;
      commit({
        title: 'Resolve the conflict', confirm: 'Make this the one',
        current: 'Both answering', proposed: esc(winner.title) + ' wins',
        rationale: `<strong>${esc(loser.title)}</strong> becomes superseded by <strong>${esc(winner.title)}</strong>.
          It stays readable and stops being used in answers.`,
        effects: [
          ['ok', 'Anyone following a link to the superseded one is told where the current one is.'],
          ['skip', esc(loser.title) + ' leaves answers. Nothing else changes.']
        ],
        onRun: () => {
          /* The contradiction is settled, so it stops being a contradiction and
             becomes a supersession — one edge replacing another, both authored. */
          assertEdge(loser.id, winner.id, 'supersededBy');
          recompute();
          render();
          markCard(winner.id);
          markCard(loser.id);
          toast('Resolved', null, esc(loser.title) + ' is superseded');
          return true;
        }
      });
      return;
    }

    return docActRest(kind, o, arg);
  }

  /* Which document does this one disagree with? The corpus knows what overlaps;
     it cannot know what contradicts, so this asks rather than guesses. Choosing
     records the contradiction on both sides and runs the real comparison. */
  /* Two questions, one shape: what does this disagree with, and what replaced
     this. Both are a relationship the corpus cannot infer — overlap is not
     disagreement and newer is not a replacement — so both ask, and choosing
     writes the relationship on BOTH documents. A one-sided link would leave the
     other one claiming to be unrelated. */
  const PICK = {
    conflict: {
      ask: (o) => 'What does ' + o.title + ' conflict with?',
      basis: (o) => [o.title, 'Conflicting', COLLECTIONS[o.col]],
      lead: 'Its status says it disagrees with something, but nothing records what.',
      none: 'Nothing else is in this collection, so there is nothing here it could contradict.',
      caveat: 'Overlap is not disagreement. Picking one records the contradiction on both documents, which is a statement about them — not a guess AiMY made.',
      verb: 'Compare with ',
      attr: (o, x) => `data-set-conflict="${o.id}:${x.id}"`,
      /* Anything in the collection that shares a tag. */
      pool: (o) => LIVE.filter((x) => x.id !== o.id && x.col === o.col)
    },
    successor: {
      ask: (o) => 'What replaced ' + o.title + '?',
      basis: (o) => [o.title, 'Superseded', COLLECTIONS[o.col]],
      lead: 'It is marked as replaced, but nothing records what replaced it.',
      none: 'Nothing in this collection is newer than it, so the replacement is not here.',
      caveat: 'Newer is not the same as replacing. Picking one records the supersession on both, so anyone following a link to this one is told where to go.',
      verb: 'This replaced it: ',
      attr: (o, x) => `data-set-successor="${o.id}:${x.id}"`,
      /* Only something newer can have replaced it. */
      pool: (o) => LIVE.filter((x) => x.id !== o.id && x.col === o.col && x.upd < o.upd)
    }
  };

  function pickRelated(o, kind) {
    const cfg = PICK[kind];
    const pool = cfg.pool(o);
    const near = pool.filter((x) => x.tags.some((tg) => o.tags.indexOf(tg) > -1)).slice(0, 4);
    const list = near.length ? near : pool.slice(0, 4);
    canvas.close();
    canvas.ask(cfg.ask(o), cfg.basis(o),
      `<div class="answer-surface">
        <div class="answer-body">
          <p>${cfg.lead}
          ${list.length
            ? (near.length
                ? 'These share its collection and its tags, so they are the ones most likely to cover the same ground:'
                : 'Nothing shares its tags. These are the rest of its collection:')
            : cfg.none}</p>
        </div>
        ${list.length ? `<div class="rs-list">${list.map((x) => typeCard(x, true)).join('')}</div>` : ''}
        <div class="trust-disclosure">
          <div class="td-row is-warn">${ICO.warn}<span class="td-text">${cfg.caveat}</span></div>
        </div>
        <div class="answer-apply">
          ${list.length
            ? list.map((x) => entryAction('investigate', cfg.verb + x.title, cfg.attr(o, x))).join('')
            : entryAction('review', 'Set the status back to automatic',
                `data-act="setstatus" data-obj="${o.id}" data-arg="auto"`)}
        </div>
      </div>`);
  }

  function docActRest(kind, o, arg) {
    /* Unused is a question, not a defect, so its exit is the two answers to it.
       "Keep" is a real outcome: it records the decision so the surface stops
       asking, which is what stops a briefing item becoming wallpaper. */
    /* "Is this worth keeping" cannot be answered by a yes/no box. It needs what
       else covers the same ground, who owns it and how it compares to the rest
       of its collection — so it is a conversation that ends in the choice. */
    if (kind === 'triage') {
      const overlap = LIVE.filter((x) => x.id !== o.id && x.col === o.col &&
        x.tags.some((tg) => o.tags.indexOf(tg) > -1)).slice(0, 3);
      const colAvg = (() => {
        const peers = LIVE.filter((x) => x.col === o.col);
        return Math.round(peers.reduce((n, x) => n + x.uses, 0) / Math.max(1, peers.length));
      })();
      canvas.ask('Is ' + o.title + ' still worth keeping?',
        [o.title, 'Unused', COLLECTIONS[o.col]],
        `<div class="answer-surface">
          <div class="answer-body">
            <p>Nothing has cited it in <strong>${Math.round(o.used / 30)} months</strong>. It was used
            ${o.uses} times in the last ninety days, against an average of ${colAvg} across
            ${esc(COLLECTIONS[o.col])}.</p>
            <p>${overlap.length
              ? 'These cover some of the same ground, which may be why nobody reaches for it:'
              : 'Nothing else in the collection covers the same tags, so this is the only thing on the subject.'}</p>
          </div>
          ${overlap.length ? `<div class="rs-list">${overlap.map((x) => typeCard(x, true)).join('')}</div>` : ''}
          <div class="trust-disclosure">
            <div class="td-row is-warn">${ICO.warn}<span class="td-text">Low usage is not evidence that it is wrong.
            ${overlap.length ? 'It may just be that the others are found first.' : 'It may be a subject nobody asks about yet.'}</span></div>
          </div>
          <div class="answer-apply">
            ${entryAction('review', 'Archive it', `data-act="archive" data-obj="${o.id}"`)}
            ${entryAction('direct', 'Keep it', `data-keep="${o.id}"`)}
            ${entryAction('direct', 'Open it', `data-open-doc="${o.id}"`)}
          </div>
        </div>`);
      return;
    }

    if (kind === 'keep') {
      o.statusSet = 'current';
      o.statusBy = USER.owner;
      recompute();
      render();
      undoStack = () => { delete o.statusSet; delete o.statusBy; recompute(); render(); };
      markCard(o.id);
      toast('Kept', 'Undo', 'Marked current by you — the flag is cleared');
      return;
    }

    /* Taking someone to the field beats telling them where it is. */
    if (kind === 'assign') {
      editorTab = 'props';
      patch({ doc: o.id });
      setTimeout(() => {
        const dd = $('.v2-dropdown[data-prop-key="owner"] .v2-dropdown-btn');
        if (dd) { dd.scrollIntoView({ block: 'center' }); dd.focus(); }
      }, 120);
      return;
    }
    if (kind === 'source') { addFilter('source', o.src); return; }
    if (kind === 'open')   { patch({ doc: o.id }); return; }

    /* Set or clear the manual override. Same path from the editor and from
       chat, so the two cannot drift. */
    if (kind === 'setstatus') {
      const to = arg;
      if (!to || to === 'auto') {
        delete o.statusSet; delete o.statusBy;
      } else {
        o.statusSet = to; o.statusBy = USER.owner;
      }
      recompute();
      render();
      markCard(o.id);
      markAfter('.doc-head .dv-notice, .doc-byline .trust-state', $('#docCanvas'));
      toast(to && to !== 'auto' ? 'Status set to ' + STATUS[to].label : 'Status back to automatic',
        'Undo', to && to !== 'auto' ? 'Set by you, and marked as such' : 'Computed from the facts again');
      return;
    }

    /* ── A report has to carry what is wrong ──

       This wrote one canned sentence — "Reported a problem with this document."
       — and told you it was done. Three faults. It never asked **what** the
       problem was, so the owner got a flag with no information and no way to
       act on it. On a draft it lied: a draft renders no comment thread, so the
       toast said "Added to the comments" over a thread that does not exist and
       nothing appeared. And nothing carried the report anywhere the owner would
       look — it sat in a thread nobody had a reason to open.

       So: it asks, in the surface every consequential write already uses; it is
       gated until there is something to send; it lands in the thread marked as
       a problem rather than as a remark; and it shows up in the owner's
       briefing, which is the page whose whole job is what needs a person. */
    if (kind === 'report') {
      commit({
        title: 'Report a problem with this document',
        width: 520,
        rationale: `This goes to <strong>${esc(responsible(o))}</strong>, who owns
          <strong>${esc(o.title)}</strong>, with your name and today's date on it.
          It does not change the document.`,
        confirm: 'Send it', done: 'Reported',
        effects: [['ok', 'Shows on the document as a reported problem'],
                  ['ok', 'Appears in ' + esc(responsible(o)) + '&rsquo;s briefing until it is resolved'],
                  ['warn', 'Anyone who can read this document can read the report']],
        body: `<div class="rp-form">
          <label class="field-label" for="rpWhat">What is wrong with it?</label>
          <textarea class="field-input rp-what" id="rpWhat" rows="3" data-report-what
            placeholder="The 14-day window contradicts the warranty article, which says 30."></textarea>
          <p class="rp-hint">One sentence is enough. Say what you expected and what it says.</p>
        </div>`,
        onRun: () => {
          const box = $('[data-report-what]');
          const what = box ? box.value.trim() : '';
          if (!what) return true;
          addComment(o, what, true);
          recompute();
          render();
          markAfter('.comment:last-of-type', $('#docCanvas'));
          markCard(o.id);
          toast('Reported', 'Undo', 'On ' + o.title + ' — ' + responsible(o) + ' will see it');
          undoStack = () => { o.comments.pop(); render(); };
          return true;
        }
      });
      /* Same gating as the typed confirmation: the button cannot be pressed
         until it would send something. An empty report is the defect this is
         fixing, so it must not be reachable by pressing straight through. */
      gateReport();
      return;
    }
  }

  /* New document — the mind map's manual Add.

     No confirmation. An empty draft commits nothing, changes nothing anyone
     else can see and is one click to discard, so a gate in front of it was
     ceremony around an action with no consequence. Every field it needs is in
     the editor's Properties panel, which is where you were going anyway. */
  /* `quiet` makes one without going to it — ingestion needs that, because five
     dropped files cannot all be opened and only the last one would win. */
  let newSeq = 0;
  function newDocument(type, seed, quiet) {
    const t = TYPES[type] ? type : 'article';
    /* Past anything restored from a previous session. `newSeq` starts at zero
       every load, so without this the first document you make after a reload
       would be born holding the id of one you made yesterday. */
    let id;
    do { id = 'new-' + (++newSeq); } while (byId(id));
    const doc = Object.assign({
      id: id, work: 'drafted', owner: USER.owner, t: t, made: 1,
      /* The label's own case. Lowercasing reads fine on Article and Ticket and
         produces "Untitled icp" — which nobody saw while the only way to make
         one was to filter to ICP first, and which the kind menu now puts one
         click from the landing set. */
      title: 'Untitled ' + TYPES[t].label, col: USER.collections[0],
      src: 'upload', prod: 'copilot', client: '', tags: [], services: [], props: {},
      aud: ['admins', 'stakeholders'], region: 'global', arch: false,
      upd: 0, ing: 0, xc: 0, xu: 0, used: 0, uses: 0, sum: '', comments: [], versions: [],
      x: Object.assign({}, BLANK_X[t] || BLANK_X.article)
    }, seed || {});
    CORPUS.push(doc);
    LIVE.push(doc);
    ENTITLED.push(doc);
    recompute();
    editorTab = 'props';
    previewVer = null;
    if (!quiet) patch({ doc: id });
    return doc;
  }

  /* ── Files ──

     Text arrives as text; anything else records what was dropped and leaves the
     body for AiMY to draft into. Guessing a type from an extension is a guess,
     and the Properties panel is one click away to correct it. */
  /* `.ppt`/`.pptx` filed as `asset` here until a Presentation existed to file
     them as. A deck arriving as a Marketing Asset was the guess this table
     admits to making, and it is the one guess the extension actually settles. */
  const EXT_TYPE = { md: 'article', txt: 'article', doc: 'article', docx: 'article', pdf: 'asset',
                     ppt: 'pptx', pptx: 'pptx', key: 'pptx', odp: 'pptx',
                     png: 'asset', jpg: 'asset', jpeg: 'asset',
                     csv: 'icp', xlsx: 'icp', html: 'webpage', htm: 'webpage' };
  /* What the deck's own upload control will take. Narrower than FILE_ACCEPT on
     purpose: that control says "the deck", so it should not open a picker
     offering to make one out of a spreadsheet. */
  const DECK_ACCEPT = '.ppt,.pptx,.key,.odp';
  const TEXTY = /\.(md|txt|csv|html?|json)$/i;
  /* Ingestion has worked since the fifth pass and nothing on the page said so.
     A capability you only discover by already dragging a file at it is a
     capability for people who guessed. This string is what it takes, said in
     the places somebody is looking for a way in. */
  const FILE_KINDS = 'Word, PDF, PowerPoint, Excel, Markdown, text, CSV, HTML or an image.';
  const FILE_ACCEPT = '.md,.txt,.doc,.docx,.pdf,.ppt,.pptx,.key,.odp,.csv,.xlsx,.html,.htm,.png,.jpg,.jpeg';

  /* One input, reused. Dropping is a gesture you have to know about; choosing is
     one every file field has taught. Both end in the same function. */
  let filePicker = null;
  function pickFiles(accept, multiple, onPick) {
    if (!filePicker) {
      filePicker = document.createElement('input');
      filePicker.type = 'file';
      filePicker.hidden = true;
      document.body.appendChild(filePicker);
    }
    filePicker.value = '';
    filePicker.accept = accept || '';
    filePicker.multiple = !!multiple;
    filePicker.onchange = () => { if (filePicker.files && filePicker.files.length) onPick(filePicker.files); };
    filePicker.click();
  }

  const isBlankDoc = (o) => o && !String(o.sum || '').trim() && !String(o.html || '').trim();

  /* The one line Sales shows for an offering. `BLANK_X` seeds `pitch` with an
     em dash, which is the right thing to show in a FIELD that is empty and the
     wrong thing to print as a description, so it is treated as absent. The
     summary's first sentence is the fallback because a product somebody has
     described but not pitched should still say something in the picker. */
  function pitchOf(o) {
    const p = String((o.x && o.x.pitch) || '').trim();
    if (p && p !== '—' && p !== '-') return p;
    const sum = String(o.sum || '').trim();
    if (!sum) return '';
    const stop = sum.indexOf('. ');
    return stop > 0 ? sum.slice(0, stop + 1) : sum;
  }

  /* ── What a drop means depends on where you drop it ──

     One sentence covered every case and was wrong in two of them. Dropping a
     file while a document you had just created was open made a SECOND document
     and navigated to it, leaving the blank one behind — and dropping while
     editing a written document threw you off the page you were writing. */
  function dropIntent() {
    const o = byId(readURL().doc);
    if (isBlankDoc(o)) {
      return { title: 'Drop to fill this document',
               sub: 'The file becomes “' + o.title + '”. Nothing else is created.' };
    }
    if (o) {
      return { title: 'Drop to add to the corpus',
               sub: 'A draft per file. This document stays open.' };
    }
    return { title: 'Drop to add to the corpus',
             sub: 'A draft per file, owned by you. Nothing goes live until you say so.' };
  }

  /* ── A file arrives as blocks, not as one paragraph of its own source ──

     Ingestion used to put the raw text into `o.sum`, which the document renders
     as a single `<p>`. A Markdown file therefore arrived with its headings,
     lists and quotes visible as `#` and `-` in the middle of a sentence, and a
     document with structure came in with none. `o.html` is what the body reads
     when it has one, so that is what a file should produce. */
  const mdInline = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  function mdToHTML(src) {
    const out = [];
    let list = null, code = null;
    const closeList = () => { if (list) { out.push('</' + list + '>'); list = null; } };
    src.split(/\r?\n/).forEach((raw) => {
      const line = raw.replace(/\s+$/, '');
      if (/^\s*```/.test(line)) {
        if (code) { out.push('<pre class="doc-code"><code>' + esc(code.join('\n')) + '</code></pre>'); code = null; }
        else { closeList(); code = []; }
        return;
      }
      if (code) { code.push(raw); return; }
      if (!line.trim()) { closeList(); return; }
      let m;
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        closeList();
        /* The document's own scale is h3 / h4 — the title is the h1 and there
           is no h2 in it, so an imported heading tree flattens into those two
           rather than introducing a third size nothing else uses. */
        const lvl = Math.min(m[1].length + 2, 4);
        out.push('<h' + lvl + '>' + mdInline(m[2]) + '</h' + lvl + '>');
        return;
      }
      if (/^\s*[-*+]\s+/.test(line)) {
        if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
        out.push('<li>' + mdInline(line.replace(/^\s*[-*+]\s+/, '')) + '</li>');
        return;
      }
      if (/^\s*\d+[.)]\s+/.test(line)) {
        if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
        out.push('<li>' + mdInline(line.replace(/^\s*\d+[.)]\s+/, '')) + '</li>');
        return;
      }
      if (/^\s*>\s?/.test(line)) {
        closeList();
        out.push('<blockquote>' + mdInline(line.replace(/^\s*>\s?/, '')) + '</blockquote>');
        return;
      }
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { closeList(); out.push('<hr class="doc-hr">'); return; }
      closeList();
      out.push('<p>' + mdInline(line) + '</p>');
    });
    if (code) out.push('<pre class="doc-code"><code>' + esc(code.join('\n')) + '</code></pre>');
    closeList();
    return out.join('');
  }

  const plainToHTML = (src) => src.split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim()).filter(Boolean)
    .map((b) => '<p>' + esc(b).replace(/\r?\n/g, '<br>') + '</p>')
    .join('') || '<p><br></p>';

  const textOf = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  };

  function readInto(doc, f) {
    const done = () => {
      recompute();
      if (readURL().doc === doc.id) renderDoc(readURL());
    };
    if (!TEXTY.test(f.name)) {
      /* Nothing to read without an extraction service. The body stays EMPTY —
         writing the explanation into it would fill the document with a sentence
         about itself, and a document with a body loses the starting moves that
         are the whole answer to "so what do I do with this". The fact is
         recorded on the document and stated above those moves instead. */
      doc.pendingText = f.name;
      done();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      let text = String(reader.result);
      if (/\.html?$/i.test(f.name)) text = text.replace(/<[^>]*>/g, ' ');
      const md = /\.(md|markdown)$/i.test(f.name);
      /* A Markdown file's first `# Heading` IS the document's title, and
         repeating it as the first block of its own body is the thing every
         importer gets wrong once. */
      if (md) {
        const m = text.match(/^\s*#\s+(.+?)\s*(\r?\n|$)/);
        if (m) { doc.title = m[1]; text = text.slice(m[0].length); }
      }
      doc.html = md ? mdToHTML(text) : plainToHTML(text);
      doc.sum = textOf(doc.html).slice(0, 400);
      done();
    };
    reader.readAsText(f);
  }

  function ingestFiles(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const open = byId(readURL().doc);

    /* A blank document is a document waiting for content. Filling it is what
       you meant; making a second one beside it never was.

       And so is a document whose subject IS a file, blank or not. "Replace the
       deck" on a Presentation that had presenter notes in it used to fall
       through to the branch below and create a SECOND Presentation beside the
       one you were looking at — a button labelled Replace that added. What is
       being replaced is the file, and on these types the prose is a note about
       it rather than the thing itself. */
    const owns = open && viewFor(open).ownsFile;
    if (list.length === 1 && (isBlankDoc(open) || owns)) {
      const f = list[0];
      const had = owns ? subjectFile(open) : '';
      /* A title you chose survives the file you attach under it. Only a title
         nobody has set yet takes the filename. */
      if (!had || /^Untitled\s/i.test(open.title) || !String(open.title || '').trim()) {
        open.title = f.name.replace(/\.[^.]+$/, '');
      }
      open.props = Object.assign({}, open.props,
        { 'source-file': f.name, size: Math.max(1, Math.round(f.size / 1024)) + ' KB' });
      readInto(open, f);
      recompute();
      renderDoc(readURL());
      toast(had ? 'Replaced with “' + f.name + '”' : 'Filled from “' + f.name + '”',
        null, had ? 'The notes and the record are unchanged' : 'Still a draft, still yours');
      return;
    }

    const made = list.map((f) => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const doc = newDocument(EXT_TYPE[ext] || 'article', {
        title: f.name.replace(/\.[^.]+$/, ''),
        props: { 'source-file': f.name, size: Math.max(1, Math.round(f.size / 1024)) + ' KB' }
      }, true);
      readInto(doc, f);
      return doc;
    });

    const one = made.length === 1;
    /* Opening the new draft is right when you were browsing and made one thing.
       It is wrong when you were reading something else, and wrong when there
       are five of them and only the last would win. */
    if (one && !open) { patch({ doc: made[0].id }); return; }
    recompute();
    render();
    made.forEach((d) => markCard(d.id));
    toast(one ? 'Added “' + list[0].name + '”' : 'Added ' + list.length + ' files',
      one ? 'Open it' : null, open ? 'Draft, owned by you. ' + open.title + ' stays open.'
                                   : 'Draft, owned by you. Nothing is live until you say so.');
    /* The toast has one action slot and it runs `undoStack`. This is the one
       case where that action is not an undo: staying put is the right default,
       so the way to the thing you just made has to be offered rather than
       taken. */
    if (one) undoStack = () => patch({ doc: made[0].id });
  }

  /* The drop layer covers the whole workbench. dragenter/dragleave fire on every
     child, so the depth counter is what stops it flickering as the pointer
     crosses a card. */
  function wireDrop() {
    const layer = $('#dropLayer');
    if (!layer) return;
    let depth = 0;
    /* Not while a commit surface is up. A sheet or a modal is a question the
       page is waiting on an answer to, and quietly making four documents
       behind it is not an answer to any of them. */
    const hasFiles = (e) => e.dataTransfer &&
      Array.from(e.dataTransfer.types || []).indexOf('Files') > -1 &&
      !($('#commitHost') || {}).innerHTML;
    const title = $('.drop-title', layer), sub = $('.drop-sub', layer);
    document.addEventListener('dragenter', (e) => {
      if (!hasFiles(e)) return;
      depth++;
      /* Written at the moment it appears, because what a drop does here is a
         function of what is open, and the answer changes while the page is
         alive. */
      const say = dropIntent();
      if (title) title.textContent = say.title;
      if (sub) sub.textContent = say.sub;
      layer.hidden = false;
      /* Reflow, not rAF — same as the document sheet. rAF does not run in a
         throttled tab, and this is the one layer whose whole job is to appear. */
      void layer.offsetWidth;
      layer.classList.add('open');
    });
    document.addEventListener('dragleave', (e) => {
      if (!hasFiles(e)) return;
      if (--depth > 0) return;
      depth = 0;
      layer.classList.remove('open');
      setTimeout(() => { if (!layer.classList.contains('open')) layer.hidden = true; }, 180);
    });
    document.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
    document.addEventListener('drop', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      layer.classList.remove('open');
      setTimeout(() => { layer.hidden = true; }, 180);
      ingestFiles(e.dataTransfer.files);
    });
  }

  /* Enough of each type's shape for the card and the viewer to render it before
     anyone has filled anything in. */
  const BLANK_X = {
    article:  { applies: '—' },
    ticket:   { requester: '—', assignee: 'Unassigned', status: 'Open', resolution: '—' },
    icp:      { segment: '—', score: 0, fit: [], dis: [] },
    campaign: { goal: '—', sells: '—', persona: '—', sector: '—', size: '—',
                window: '—', pitch: '' },
    asset:    { format: '—', usage: 'Internal only', approval: 'pending' },
    /* `slides: 0` rather than '—': it is a count, the number input writes a
       number, and 0 is what "no deck yet" honestly is. TYPE_BODY tests it as
       falsy so a deck with no file states no slide count at all. */
    pptx:     { slides: 0, presented: '—', usage: 'Internal only', approval: 'pending' },
    story:    { size: '—', outcome: '—', quote: '', approval: 'pending' },
    blog:     { pub: 'Draft', canonical: '—', author: USER.owner },
    /* No crawl or change: both are derived from `upd` and `xu` now. */
    webpage:  { url: '—' },
    /* `pitch` is not a summary with a different name. The summary is what the
       document says; the pitch is the ONE LINE AiMY Sales prints beside this
       offering in its picker, which is a different job with a different length
       and a different reader. Slicing the summary to fit would have been the
       version of this that nobody can edit. */
    product:  { pitch: '—' },
    service:  { pitch: '—' }
  };

  /* The card's one classified action. Each terminates in a completed action, a
     staged one, or a structured destination — never in "open". */
  function cardActRun(id) {
    const o = byId(id);
    if (!o) return;
    docAct(cardAction(o)[2], id);
  }


  /* Rename commits on Enter and abandons on Escape, and commits on blur
     because a half-typed title left behind by clicking elsewhere is a title
     somebody meant to set. Empty input keeps the old name rather than leaving
     a row with nothing to read. */
  function commitRename(box, keep) {
    const k = box.getAttribute('data-chat-rename-in');
    const v = String(box.value || '').trim();
    if (keep && v && SESSIONS[k]) { SESSIONS[k].title = sessTitle(v); SESSIONS[k].blank = false; saveChats(); }
    CHAT_EDIT = '';
    paintChats();
    syncTitle();
  }

  document.addEventListener('keydown', (e) => {
    const box = e.target;
    if (!box || box.id !== 'chatRename') return;
    if (e.key === 'Enter') { e.preventDefault(); commitRename(box, true); }
    else if (e.key === 'Escape') { e.preventDefault(); commitRename(box, false); }
  });
  document.addEventListener('focusout', (e) => {
    const box = e.target;
    if (box && box.id === 'chatRename' && CHAT_EDIT) commitRename(box, true);
  });
  /* ═══════════════════════════════════════════════
     SKILLS, FROM THE CHAT SIDE

     The definitions live in the settings console; what the composer needs is
     the short form — what it is called, when it fires, and one line saying
     what it does. Copied rather than imported, and that is a KNOWN DEBT, not
     an oversight: settings.js already carries a hand-copy of this file's
     fixtures with a header saying it will drift and naming the fix (lift both
     into a shared `assets/data.js`). This is the same seam, and it will drift
     the same way until that is done.

     `manual` skills are what `/` offers. `auto` skills are chosen by the agent
     from the description, and are listed here so the picker can say which
     ones you cannot invoke and why.
  ═══════════════════════════════════════════════ */
  const CHAT_SKILLS = [
    { id: 'refund-response', name: 'Draft a refund response', trigger: 'auto', on: true,
      desc: 'Cites the policy and flags the contested clause' },
    { id: 'stale-sweep', name: 'Weekly staleness sweep', trigger: 'manual', on: true,
      desc: 'Documents behind their source, grouped by connector' },
    { id: 'ticket-triage', name: 'Triage an inbound ticket', trigger: 'auto', on: false,
      desc: 'Classify, cite, and say when nothing settles it' }
  ];
  /* The skill the NEXT question will be sent through, if any. Cleared once it
     has been used: a skill is applied to a question, not switched on for a
     conversation. */
  let armedSkill = null;
  let skillPickOpen = false;

  const skillPicker = () => {
    const usable = CHAT_SKILLS.filter((k) => k.on);
    return `<div class="sk-pick" id="skPick" role="listbox" aria-label="Skills">
      ${usable.length ? usable.map((k, i) => `<button class="sk-opt" type="button" role="option"
          aria-selected="false" data-skill-use="${esc(k.id)}" style="--i:${i}"
          ${k.trigger === 'auto' ? 'disabled title="Chosen by AiMY when the question matches. Not invoked by hand."' : ''}>
          <span class="sk-opt-n">${ICO.skill.replace('<svg', '<svg width="12" height="12"')}${esc(k.name)}</span>
          <span class="sk-opt-d">${esc(k.desc)}</span>
          ${k.trigger === 'auto' ? '<span class="sk-opt-t">automatic</span>' : ''}
        </button>`).join('')
        : '<div class="sk-none">No skills are switched on.</div>'}
      <a class="sk-manage" href="settings.html?module=skills">Manage skills</a>
    </div>`;
  };

  function paintSkillPicker() {
    const bar = $('.overlay-input-bar');
    if (!bar) return;
    const open = $('#skPick');
    if (!skillPickOpen) { if (open) open.remove(); return; }
    if (open) return;
    bar.insertAdjacentHTML('beforebegin', skillPicker());
  }

  /* What the agent did, in the order it did it. Derived from the same three
     functions the answer itself is built from, so the trace cannot claim a
     step the answer did not take. Collapsed by default: it is evidence, not
     narration. */
  function activityLog(q, st) {
    /* No shape was read and no corpus was scoped, so every step this would
       print is a description of work that did not happen. An audit trail that
       narrates a search nobody ran is worse than no audit trail. */
    if (GREETING.test(q)) return '';
    const shape = questionShape(q);
    const scope = questionScope(q, st, shape);
    const topic = topicFor(q);
    const steps = [];
    steps.push(['Read the question', shape ? 'Recognised as a ' + shape + ' question' : 'No computed shape — matched on subject']);
    if (topic && !shape) steps.push(['Matched a known subject', topic.ids.length + ' documents are hand-linked to it']);
    steps.push(['Scoped the corpus', scope.broad ? 'Nothing narrowed it — the whole corpus was in scope'
      : scope.docs.length + ' document' + (scope.docs.length === 1 ? '' : 's') + ' in scope']);
    if (armedSkill) steps.push(['Applied a skill', armedSkill.name]);
    steps.push(['Wrote the answer', scope.docs.length ? 'Cited what it stood on' : 'Said what it could not ground']);
    return `<details class="act-log"><summary class="act-sum">${ICO.clock.replace('<svg', '<svg width="11" height="11"')}How this was answered</summary>
      <ol class="act-steps">${steps.map(([a, b]) =>
        `<li class="act-step"><span class="act-what">${esc(a)}</span><span class="act-why">${esc(b)}</span></li>`).join('')}</ol>
    </details>`;
  }

  /* ══ THE TYPEWRITER ══════════════════════════════════════════════════════
     A reveal, not a stream. There is no backend, so the whole answer exists
     before the first character is shown — and saying otherwise in the UI would
     be the kind of theatre this repo avoids elsewhere.

     Three constraints the surrounding code imposes, all of them load-bearing:

     1. `turn.html` is written in full BEFORE this runs. A rebuild renders from
        the turn, so a half-typed string must never be written back or
        switching away and back would freeze the answer mid-word.
     2. The element can leave the DOM mid-reveal — switching conversation
        removes it — so every tick re-checks that it is still connected.
     3. It mutates INSIDE the bubble. chat.js observes the thread with
        `childList` only, deliberately, so that the answer swap does not fire
        it per character; writing to the bubble keeps that guarantee.

     Character-by-character on HTML would tear tags open, so it reveals by
     BLOCK — the answer's own top-level children, which is also how a person
     reads it. */
  /* ══ THE STREAM ════════════════════════════════════════════════════════
     The first version appended whole blocks every 90ms, which is not a stream
     — it is a slideshow, and a 90ms step is visible as a step. This advances
     on the frame clock and reveals CHARACTERS, so the rate is continuous and
     the motion is whatever the display can draw.

     ── Why not simply type the HTML ──
     The answer is markup, not prose: cutting a string of it at an arbitrary
     index tears tags open. So the markup is inserted intact and the TEXT NODES
     are emptied and refilled. The structure is always valid; only how much of
     it has been said changes.

     ── Prose streams, structure arrives ──
     Typing out a status badge or a source row character by character reads as
     a machine filling in a form. Those blocks are revealed whole, with a short
     fade; only prose is streamed. Both are on the same clock, so the answer
     still assembles at one pace.

     ── 1100 characters a second ──
     Fast enough not to be a wait, slow enough to read as arriving. Measured
     against the answers this corpus actually produces: the refund answer runs
     about 1.4s, which is close to how long it takes to read the first line. */
  const STREAM_CPS = 1100;
  let streamRAF = 0;

  /* ══ A BLOCK IS A BEAT ════════════════════════════════════
     A block with no prose in it - a source list, a card, the trust disclosure,
     the trace - used to advance on the very NEXT FRAME. Three of them
     therefore landed inside about 50ms, which is to say simultaneously, which
     is to say the answer arrived as a slab with an entrance animation on it
     rather than as an answer being assembled.

     140ms is roughly the gap that reads as one thing following another rather
     than as a stall. Four blocks is half a second of assembly, under the
     stream that is already running beside it.

     Held through AIMY_LATENCY like every other fabricated wait in the product,
     so `?latency=instant` drops the beat and the answer lands whole. */
  const BLOCK_BEAT = 140;
  let streamHold = null;

  /* ══ WHAT MAY BE TYPED OUT, AND WHAT MUST SIMPLY LAND ══════════════
     Structure lands; sentences arrive. A card, a source list, a table or a
     disclosure typed character by character reads as a rendering bug.

     THE SELF TEST IS THE FIX. This only ever looked at a block's DESCENDANTS,
     and a trace contains no trace - so `.act-log`, the "How this was answered"
     disclosure, passed as prose and was the one thing in the whole answer that
     streamed. Meanwhile the answer itself did not: see the wrapper note in
     typeIn. The two faults were each other's mirror image.

     `.rs-head` joins the list on the same principle: it is a heading, and a
     heading that types itself out is a heading nobody can read yet. */
  const NOT_PROSE = '.type-card, .source-item, .trust-disclosure, .answer-apply,'
    + ' .rs-list, .rs-head, .act-log, .greet-next, table';
  const isProse = (b) =>
    !b.matches(NOT_PROSE) && !b.querySelector(NOT_PROSE)
    && !b.classList.contains('greet-next');

  function stopStream() {
    if (streamRAF) cancelAnimationFrame(streamRAF);
    streamRAF = 0;
    /* The beat between blocks is a timer, not a frame, so cancelling frames
       alone would leave a stopped answer still assembling itself. */
    if (streamHold) { streamHold(); streamHold = null; }
  }

  function typeIn(el, html, done) {
    stopStream();
    /* Two reasons to put the answer down whole.

       Reduced motion is the reader's own setting and always was.

        is the second, and it belongs here for the same reason
       it governs the thinking beats and the gap between blocks: a typewriter
       IS fabricated time. A profile that means "no invented waiting" and then
       spends a second and a half spelling the answer out is not honouring its
       own name - and that profile is the shape this product takes the day a
       real model is behind it, where the words arrive when they arrive. */
    const M = window.AIMY_MOTION;
    const still = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      || !!(M && M.latency.profile === 'instant');
    const src = document.createElement('div');
    src.innerHTML = html;

    /* ══ A WRAPPER IS NOT A BLOCK ══════════════════════════════
       `.answer-surface` holds the ENTIRE answer - the results row, the prose,
       the sources, the disclosure and the apply bar. Taken as one block it
       arrived as one object, and the prose inside it never streamed at all:
       the surface contains `.source-item`, so isProse rejected the whole thing
       and revealed it whole.

       So the surface is put down EMPTY and its children become the blocks. It
       is a flex column with a gap and nothing else - no background, no border,
       no padding - so an empty one is invisible and costs nothing to place
       first. The wrapper stays in the DOM because the gap and the margin
       reset it owns are what keep the answer's parts evenly spaced.

       One level, deliberately. Flattening further would start reaching into
       components that own their own internal layout. */
    const plan = [];
    Array.from(src.children).forEach((b) => {
      if (b.classList.contains('answer-surface')) {
        /* Shallow clone: same tag, same classes, no children. */
        plan.push({ node: b.cloneNode(false), shell: true });
        const shell = plan[plan.length - 1].node;
        Array.from(b.children).forEach((c) => plan.push({ node: c, into: shell }));
      } else {
        plan.push({ node: b });
      }
    });
    if (still || plan.length < 2) { el.innerHTML = html; if (done) done(); return; }

    el.innerHTML = '';
    let bi = 0;

    /* ══ THE ANSWER IS NEVER LEFT HALF-SAID ═══════════════════════
       requestAnimationFrame does not run in a backgrounded tab, so switching
       away mid-stream would freeze the text where it stood and leave it there
       on return — a truncated answer that reads as the product having stopped
       mid-sentence. It also does not run at all in this repo's review pane.

       So the frame clock is an optimisation, not the contract: a timer sized
       to twice the expected duration finishes the answer outright if the
       frames never came. setTimeout is throttled in a background tab but it
       still fires, which is the property being relied on. */
    const expected = (src.textContent || '').length / STREAM_CPS * 1000;
    let bail = setTimeout(() => {
      stopStream();
      if (el.isConnected) el.innerHTML = html;
      if (done) done();
    }, Math.max(2200, expected * 2 + 1200));
    const finish = (fn) => { clearTimeout(bail); bail = 0; if (fn) fn(); };

    const nextBlock = () => {
      /* `done` fires here too. This is the one exit that cancels the bail
         timer, so returning without it left the caller waiting on a completion
         nothing would ever send. */
      if (!el.isConnected) { stopStream(); clearTimeout(bail); if (done) done(); return; }
      if (bi >= plan.length) { stopStream(); finish(done); return; }
      const item = plan[bi++];
      const b = item.node;
      (item.into || el).appendChild(b);
      /* The shell is an empty, invisible container. Animating it would fade the
         answer twice - once as the box and again as everything in it - and
         holding a beat for it would be a beat with nothing to see. */
      /* Straight on, with no frame and no beat. The shell is empty and
         invisible, so there is nothing to wait for and nothing to look at -
         and waiting on a FRAME here is worse than pointless: requestAnimationFrame
         does not fire in a backgrounded tab or in a pane that never composites,
         so a frame spent on an invisible box was enough to stall the chain
         until the bail timer gave up and dumped the whole answer at once. */
      if (item.shell) { nextBlock(); return; }
      b.classList.add('stream-in');

      if (!isProse(b)) {
        const M = window.AIMY_MOTION;
        if (M) streamHold = M.latency.hold(BLOCK_BEAT, nextBlock);
        else streamRAF = requestAnimationFrame(nextBlock);
        return;
      }

      /* Emptied here and refilled below. Whitespace-only nodes are left alone:
         blanking them collapses the spacing between words and the line reflows
         on every frame. */
      const walk = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
      const parts = [];
      let total = 0, node;
      while ((node = walk.nextNode())) {
        const v = node.nodeValue;
        if (!v || !v.trim()) continue;
        parts.push({ node: node, full: v });
        total += v.length;
        node.nodeValue = '';
      }
      if (!total) { streamRAF = requestAnimationFrame(nextBlock); return; }

      /* ══ THE EDGE OF WHAT HAS ARRIVED ═════════════════════════
         `.stream-cursor` has been in the design system since it was written and
         has never once been rendered by this product. It belongs here: it is
         the difference between text that is still arriving and text that has
         stopped short.

         Appended AFTER the tree walker has collected its nodes, so the walker
         never sees it - and it is empty in any case, so even if it did it
         would contribute nothing to the character count.

         One small element with a stepped blink, rather than the alternative
         that was considered and rejected: wrapping the last few words in
         blurred spans. At 1100 characters a second that is span surgery on
         every frame, it tears the markup the refill loop is careful not to
         tear, and it is a per-frame repaint on text that is already
         reflowing - all three of which are the lag this pass exists to
         remove. */
      const caret = document.createElement('span');
      caret.className = 'stream-cursor';
      caret.setAttribute('aria-hidden', 'true');
      b.appendChild(caret);

      let t0 = 0, cut = 0;
      const step = (ts) => {
        if (!el.isConnected) { stopStream(); return; }
        if (!t0) t0 = ts;
        const want = Math.min(total, Math.floor(((ts - t0) / 1000) * STREAM_CPS));
        /* `cut` is where the last frame finished, so each frame touches only
           the nodes that actually changed rather than rewriting the block. */
        let seen = 0;
        for (let i = 0; i < parts.length; i++) {
          const pt = parts[i];
          const start = seen, end = seen + pt.full.length;
          seen = end;
          if (end <= cut) continue;
          if (start >= want) break;
          pt.node.nodeValue = pt.full.slice(0, Math.max(0, Math.min(pt.full.length, want - start)));
        }
        cut = want;
        if (want < total) { streamRAF = requestAnimationFrame(step); return; }
        /* The block is complete, so the edge is no longer an edge. */
        if (caret.parentNode) caret.parentNode.removeChild(caret);
        streamRAF = requestAnimationFrame(nextBlock);
      };
      streamRAF = requestAnimationFrame(step);
    };

    nextBlock();
  }


  /* ═══════════════════════════════════════════════
     THE COMMAND PALETTE

     Every destination in this product is already a URL, so the palette is not
     a new navigation model — it is a view over the routes that exist. That is
     why it can be written in one place and work identically on the gate and
     the Console: it never does anything but go where you could already go.

     It builds its host lazily rather than asking three shells to carry an
     empty div each. Nothing is rendered until the first time it opens.
  ═══════════════════════════════════════════════ */
  const palette = {
    open: false, sel: 0, q: '', host: null,

    items() {
      const q = this.q.trim().toLowerCase();
      const out = [];
      const push = (group, label, sub, run) => out.push({ group, label, sub, run });

      /* Conversations first: it is the thing there are most of, and the thing
         a palette is usually opened to find. */
      Object.keys(SESSIONS)
        .sort((a, b) => (THREAD_AT[b] || 0) - (THREAD_AT[a] || 0))
        .forEach((k) => {
          const t = SESSIONS[k].title;
          if (q && t.toLowerCase().indexOf(q) < 0) return;
          push('Conversations', t, CHAT_AGENTS[agentOf(k)].label, () => {
            restoring = true; patch({ chat: k }); restoring = false;
            paintThread();
          });
        });

      push('Do', 'New conversation', 'Start a fresh thread', () => {
        const b = $('[data-newchat]'); if (b) b.click();
      });

      if (canvas.inline) push('Go', 'Console', 'Filters, documents, the corpus', () => { location.href = 'console.html'; });
      else push('Go', 'Chat', 'Ask across everything AiMY knows', () => { location.href = 'index.html'; });
      /* Settings re-cut its IA: the key is `m`, not `module`, and instructions
         folded into skills because an instruction is a skill that always
         applies. These four entries pointed at three ids that no longer exist
         and one key that is no longer read, so all four landed on the default
         module while looking like they had worked. Kept in the palette rather
         than deleted -- this is the search that replaced the profile pill's
         deep links, so it is the only route left to a named module. */
      push('Go', 'Skills', 'Skills and instructions, and which level governs', () => { location.href = 'settings.html?m=skills'; });
      push('Go', 'Connectors and sync', 'Connectors and their health', () => { location.href = 'settings.html?m=sync'; });
      push('Go', 'People', 'Who exists, and what they reach', () => { location.href = 'settings.html?m=people'; });
      push('Go', 'Roles and permissions', 'What each role may do', () => { location.href = 'settings.html?m=roles'; });
      push('Go', 'Hierarchy', 'Clients, units, products, teams and users', () => { location.href = 'settings.html?m=hierarchy'; });

      return q
        ? out.filter((i) => (i.label + ' ' + i.group).toLowerCase().indexOf(q) > -1
                            || i.group === 'Conversations')
        : out;
    },

    show() {
      if (!this.host) {
        this.host = document.createElement('div');
        this.host.className = 'kp';
        this.host.id = 'kPalette';
        document.body.appendChild(this.host);
      }
      this.open = true; this.sel = 0; this.q = '';
      this.paint();
      const box = $('#kpInput'); if (box) box.focus();
    },

    close() {
      this.open = false;
      if (this.host) this.host.innerHTML = '';
      this.host = this.host;
    },

    paint() {
      if (!this.host || !this.open) return;
      const items = this.items();
      if (this.sel >= items.length) this.sel = Math.max(0, items.length - 1);
      let last = '';
      const rows = items.map((it, i) => {
        const cap = it.group !== last ? `<div class="kp-cap">${esc(it.group)}</div>` : '';
        last = it.group;
        return cap + `<button class="kp-row${i === this.sel ? ' is-sel' : ''}" type="button" data-kp="${i}">
          <span class="kp-label">${esc(it.label)}</span>
          <span class="kp-sub">${esc(it.sub)}</span>
        </button>`;
      }).join('');
      this.host.innerHTML = `<div class="kp-scrim" data-kp-close></div>
        <div class="kp-panel" role="dialog" aria-modal="true" aria-label="Command palette">
          <input class="kp-input" id="kpInput" placeholder="Find a conversation, or go somewhere…"
                 spellcheck="false" autocomplete="off" value="${esc(this.q)}" aria-label="Search" />
          <div class="kp-list">${rows || '<div class="kp-none">Nothing matches that.</div>'}</div>
          <div class="kp-foot"><span class="kp-key">↑↓</span> move <span class="kp-key">↵</span> open <span class="kp-key">esc</span> close</div>
        </div>`;
      const sel = $('.kp-row.is-sel', this.host);
      if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
    },

    run(i) {
      const items = this.items();
      const it = items[i];
      this.close();
      if (it) it.run();
    },

    move(d) {
      const n = this.items().length;
      if (!n) return;
      this.sel = (this.sel + d + n) % n;
      this.paint();
    }
  };

  /* ═══════════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════════ */
  /* ══ WHAT THE GATE IS ALLOWED TO REACH ═════════════════════════════════
     A narrow, deliberate surface rather than a namespace of everything. The
     gate drives a conversation and nothing else, so it gets the verbs for
     exactly that — and notably not `patch`, `writeURL` or `applyFilters`,
     because "no surface manipulation" is a property worth making structural
     instead of merely intended. */
  const GATE_API = {
    submit: submit,
    paintThread: paintThread,
    paintChats: paintChats,
    threadKey: threadKey,
    hasTurns: () => (THREADS[threadKey()] || []).length > 0,
    user: USER,
    esc: esc
  };

  /* Cmd/Ctrl+K was unclaimed. Registered on the document rather than inside
     either surface's Escape ladder, because the palette belongs to the product
     and not to a page. */
  document.addEventListener('keydown', (e) => {
    if (CHROME_ONLY) return;
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      palette.open ? palette.close() : palette.show();
      return;
    }
    if (e.key === 'Escape' && skillPickOpen) { skillPickOpen = false; paintSkillPicker(); return; }
    if (!palette.open) return;
    if (e.key === 'Escape') { e.preventDefault(); palette.close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); palette.move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palette.move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); palette.run(palette.sel); }
  });

  document.addEventListener('change', (e) => {
    if (!e.target || e.target.id !== 'clipIn') return;
    const file = e.target.files && e.target.files[0];
    const wrap = $('.overlay-input-wrap');
    if (!file || !wrap) return;
    const old = $('.clip-chip', wrap);
    if (old) old.remove();
    const kb = Math.max(1, Math.round(file.size / 1024));
    wrap.insertAdjacentHTML('afterbegin',
      `<div class="clip-chip">${ICO.doc.replace('<svg', '<svg width="12" height="12"')}
         <span class="clip-name">${esc(file.name)}</span>
         <span class="clip-note">${kb} KB \u00b7 not uploaded</span>
         <button class="clip-x" type="button" data-clip-drop aria-label="Remove">${ICO.x.replace('<svg', '<svg width="11" height="11"')}</button>
       </div>`);
  });

  /* `/` opens the picker, and only from an empty box. A slash mid-sentence is
     a slash; a slash on its own is somebody reaching for a command — the same
     rule every editor with a slash menu uses, and the reason it can coexist
     with typing normally. */
  document.addEventListener('input', (e) => {
    const box = e.target;
    if (!box || (box.id !== 'overlayInput' && box.id !== 'floatInput')) return;
    const v = String(box.value || '');
    const want = /^\s*\/\S*$/.test(v);
    if (want !== skillPickOpen) { skillPickOpen = want; paintSkillPicker(); }
  });

  document.addEventListener('input', (e) => {
    if (!palette.open || !e.target || e.target.id !== 'kpInput') return;
    palette.q = e.target.value;
    palette.sel = 0;
    palette.paint();
    const box = $('#kpInput');
    /* The list is rebuilt on every keystroke, so the caret has to be put back
       — the same repair the conversation search needs for the same reason. */
    if (box) { box.focus(); box.setSelectionRange(palette.q.length, palette.q.length); }
  });
  /* ══ THE CITATION HOVERCARD LEAVES THE THREAD ══════════════════════════
     `.cite-preview` is written as a child of its `.cite-wrap`, and every way
     that card has broken traces back to that one fact:

       · the thread scrolls, so `overflow-x` computes to `auto` and the card is
         CLIPPED whenever a citation sits within half a card-width of an edge;
       · a `transform` or `filter` anywhere above it makes that ancestor the
         containing block, so `position: fixed` stops meaning the viewport and
         the card lands offset by however far that ancestor is from the corner;
       · the stylesheet anchors it with `bottom`, so adding a `top` leaves the
         box over-constrained and the height resolves from the offsets instead
         of the content.

     Positioning it in place fixes those one at a time and leaves the next one
     waiting. Moving it out fixes the category: on open the card is reparented
     to `<body>`, where nothing clips and nothing can be a containing block but
     the viewport, and on close it goes home. `document.body` is the only
     element in the page guaranteed to be neither.

     This file already recorded the diagnosis — "it is `position: absolute`
     against a `.cite-wrap` parent … needs fixed positioning", filed in
     GAPS.md. This is the whole of that fix.

     THE TRANSFORM IS LEFT ALONE. The stylesheet centres the card with
     `translateX(-50%)` and TRANSITIONS transform, so writing `none` starts an
     animation rather than setting a value — for its duration the card sits
     half its width to the left. The offset is added back into `left` instead,
     so the untouched -50% lands the edge exactly where it was asked to go. */
  const CITE_GAP = 8;
  let citeOut = null;

  function closeCite() {
    if (!citeOut) return;
    const tip = citeOut.tip, home = citeOut.home;
    citeOut = null;
    tip.classList.remove('is-open');
    tip.removeAttribute('style');
    /* Home is where the markup says it lives. Returning it means a rebuild of
       the thread disposes of it with everything else, and nothing is left
       parented to the body after the answer it belonged to is gone. */
    if (home && home.isConnected) home.appendChild(tip);
    else if (tip.parentNode) tip.parentNode.removeChild(tip);
  }

  function openCite(wrap) {
    if (citeOut && citeOut.home === wrap) return;
    closeCite();
    const tip = wrap.querySelector('.cite-preview');
    if (!tip) return;

    citeOut = { tip: tip, home: wrap };
    document.body.appendChild(tip);
    /* ── THE ORDER HERE IS THE ANIMATION ──
       The card is `display: none` until it opens, so it has to be given a box
       BEFORE it can be measured — `offsetWidth` on an undisplayed element is
       0, and this function measures to decide where to put it.

       So: display it while it is still transparent, force the reflow, measure
       and place it, and only then add `is-open`. Setting `is-open` first — as
       this did — meant the browser had never rendered a frame at opacity 0,
       so there was no start value to animate from and the card appeared fully
       formed. Same two declarations, opposite result, purely from which side
       of the reflow they fall on.

       Out here the CSS `:hover` on the wrap no longer reaches the card, so
       the open state has to be stated. The stylesheet already supports it. */
    tip.style.display = 'block';
    tip.style.position = 'fixed';
    tip.style.bottom = 'auto';
    tip.style.right = 'auto';
    tip.style.left = '0px';
    tip.style.top = '0px';
    void tip.offsetWidth;

    const w = tip.offsetWidth, h = tip.offsetHeight;
    if (!w || !h) { closeCite(); return; }
    const c = wrap.getBoundingClientRect();

    let left = c.left + c.width / 2 - w / 2;
    left = Math.max(CITE_GAP, Math.min(left, window.innerWidth - w - CITE_GAP));
    let top = c.top - h - CITE_GAP;
    if (top < CITE_GAP) top = c.bottom + CITE_GAP;

    tip.style.left = Math.round(left + w / 2) + 'px';
    tip.style.top = Math.round(top) + 'px';
    /* Placed, still transparent. This reflow is what gives the transition a
       frame to start from, so the card fades in where it belongs rather than
       fading in on its way there from the top-left corner. */
    void tip.offsetWidth;
    tip.classList.add('is-open');
  }

  /* Delegated, because citations are rendered into answers that did not exist
     when this ran. The card counts as part of its own hover target now that it
     is elsewhere in the DOM — without that, moving the pointer from the chip
     onto the card would read as leaving, and Flag would be unclickable. */
  const citeFrom = (t) => (t && t.closest)
    ? (t.closest('.cite-wrap') || (t.closest('.cite-preview') && citeOut ? citeOut.home : null))
    : null;

  document.addEventListener('mouseover', (e) => {
    if (CHROME_ONLY) return;
    const w = citeFrom(e.target);
    if (w) openCite(w); else if (citeOut) closeCite();
  });
  document.addEventListener('focusin', (e) => {
    if (CHROME_ONLY) return;
    const w = citeFrom(e.target);
    if (w) openCite(w); else if (citeOut) closeCite();
  });
  /* A fixed card does not travel with the text it is anchored to, so a scroll
     under an open one would leave it floating beside nothing. */
  document.addEventListener('scroll', closeCite, true);
  window.addEventListener('resize', closeCite);


  /* ══ WHICH BUILD IS THIS ══════════════════════════════════════════════
     One line, once, at boot. Not decoration: this prototype is iterated by
     reloading a file:// URL, where a stale cache is completely invisible and
     has already cost several rounds of "that is fixed" answered by a
     screenshot of the old build. Read from the script tag rather than written
     here, so it can never drift from the number the shell actually asked for. */  /* ═══════════════════════════════════════════════
     THINKING — the mark, dispersed and reformed

     Three dots said "something is happening" and nothing else. This says who
     is doing it: the AiMY mark scatters into an orbit, holds there while the
     corpus is searched, and gathers back into itself.

     ── Sampled, not hand-plotted ──
     The mark is one <path>. Rather than rasterise it to a canvas and read
     pixels back — which needs an image load, and taints the canvas on some
     configurations, `file://` among them — the path is handed to `Path2D` and
     candidate points are tested with `isPointInPath`. Pure geometry: no image,
     no decode, no taint, and it works from a local file.

     ── Cheap on purpose ──
     Sampling runs ONCE, lazily, on the first answer. The loop runs only while
     a placeholder is on screen and stops the moment its canvas leaves the DOM,
     so nothing is burning frames between questions. About 90 points at 26px —
     the reference uses 300 at 64px, and past a point more dots at this size is
     just grey.
  ═══════════════════════════════════════════════ */
  /* ══ THE MARK'S OWN COLOURS ════════════════════════════════════════════
     The logo is not one colour: it is a radial gradient running violet at the
     centre out to blue at the rim. A single flat fill throws that away, and
     the scatter is the one moment the gradient is legible as a gradient —
     ninety dots each holding their own stop, spread out where the artwork
     usually packs them into a 26px mark.

     READ FROM THE <radialGradient> IN THE PAGE, not copied here. The stops,
     the centre and the radius all come off the element the logo itself paints
     with, so a rebrand moves this with it and cannot leave the two disagreeing.

     A dot keeps the colour of the petal it CAME FROM, rather than taking one
     from wherever it currently floats. The alternative reads as a colour wheel
     the dots pass through; this reads as the mark coming apart and back
     together, which is the thing being said. */
  const hexRGB = (h) => {
    h = String(h || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return h.length === 6 && !isNaN(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : null;
  };

  function markGradient() {
    const fallback = { cx: 75.72, cy: 73.83, r: 70.54,
                       stops: [{ o: 0.26, c: [140, 79, 244] }, { o: 0.95, c: [0, 102, 255] }] };
    try {
      const g = $('#aimy-rg');
      if (!g) return fallback;
      const stops = $$('stop', g)
        .map((st) => ({ o: parseFloat(st.getAttribute('offset')), c: hexRGB(st.getAttribute('stop-color')) }))
        .filter((st) => st.c && !isNaN(st.o))
        .sort((a, b) => a.o - b.o);
      if (!stops.length) return fallback;
      return {
        cx: parseFloat(g.getAttribute('cx')) || fallback.cx,
        cy: parseFloat(g.getAttribute('cy')) || fallback.cy,
        r: parseFloat(g.getAttribute('r')) || fallback.r,
        stops: stops
      };
    } catch (e) { return fallback; }
  }

  /* SVG's own rule at the ends: before the first stop and after the last, the
     gradient holds that stop's colour rather than fading out. */
  function stopColour(stops, o) {
    if (o <= stops[0].o) return stops[0].c;
    const last = stops[stops.length - 1];
    if (o >= last.o) return last.c;
    for (let i = 1; i < stops.length; i++) {
      if (o <= stops[i].o) {
        const a = stops[i - 1], b = stops[i];
        const t = (o - a.o) / (b.o - a.o || 1);
        return [Math.round(a.c[0] + (b.c[0] - a.c[0]) * t),
                Math.round(a.c[1] + (b.c[1] - a.c[1]) * t),
                Math.round(a.c[2] + (b.c[2] - a.c[2]) * t)];
      }
    }
    return last.c;
  }

  const THINK_N = 90;
  let THINK_PTS = null;   /* null = not tried yet, [] = tried and failed */

  function sampleMark() {
    if (THINK_PTS) return THINK_PTS;
    THINK_PTS = [];
    try {
      const path = $('#aimy-logo-small path');
      const d = path && path.getAttribute('d');
      if (!d || typeof Path2D === 'undefined') return THINK_PTS;
      const cv = document.createElement('canvas');
      const ctx = cv.getContext('2d');
      if (!ctx) return THINK_PTS;
      const p2 = new Path2D(d);
      const grad = markGradient();
      /* The symbol's own viewBox. Sampling in its coordinate space and
         normalising afterwards keeps this correct if the artwork is replaced. */
      const VW = 151.43, VH = 147.66;
      cv.width = Math.ceil(VW); cv.height = Math.ceil(VH);
      const pts = [];
      /* A jittered grid rather than pure random: an even spread reads as the
         shape, where clustering reads as noise. The step is tuned to overshoot
         the target so the filter below still has enough to choose from. */
      const step = Math.sqrt((VW * VH) / (THINK_N * 2.2));
      for (let y = step / 2; y < VH; y += step) {
        for (let x = step / 2; x < VW; x += step) {
          const jx = x + (((x * 7 + y * 13) % 10) / 10 - 0.5) * step * 0.8;
          const jy = y + (((x * 11 + y * 5) % 10) / 10 - 0.5) * step * 0.8;
          if (ctx.isPointInPath(p2, jx, jy)) {
            /* The gradient is defined in the artwork's own user space, so the
               offset is measured there — before these coordinates are
               normalised for the canvas. */
            const off = Math.sqrt((jx - grad.cx) * (jx - grad.cx) + (jy - grad.cy) * (jy - grad.cy)) / grad.r;
            const c = stopColour(grad.stops, off);
            pts.push({ x: jx / VW - 0.5, y: jy / VH - 0.5, c: 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' });
          }
        }
      }
      /* Each point gets a fixed orbit seat derived from where it sits in the
         mark, so a point always leaves for the same place and comes back to
         the same petal. Random seats every cycle would read as static. */
      pts.forEach((pt, i) => {
        const a = Math.atan2(pt.y, pt.x) + (i % 5) * 0.21;
        const r = 0.34 + ((i * 37) % 11) / 55;
        pt.ox = Math.cos(a) * r;
        pt.oy = Math.sin(a) * r;
        pt.sp = 0.6 + ((i * 17) % 7) / 10;
        pt.sz = 0.7 + ((i * 23) % 5) / 8;
      });
      THINK_PTS = pts;
    } catch (e) { THINK_PTS = []; }
    return THINK_PTS;
  }

  /* dwell in the orbit, then gather, then hold the mark, then scatter again.
     Shorter than the reference's 5.5s because this state lasts about a second
     — a cycle nobody sees complete is a cycle nobody reads. */
  const T_SCATTER = 620, T_ORBIT = 900, T_GATHER = 620, T_HOLD = 420;
  const T_CYCLE = T_SCATTER + T_ORBIT + T_GATHER + T_HOLD;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let thinkRAF = 0;

  function thinkFrame(cv, ms) {
    if (!cv.isConnected) return false;
    const ctx = cv.getContext('2d');
    const pts = sampleMark();
    if (!ctx || !pts.length) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    /* Cached on the element. This is a layout read at the top of a 60fps loop
       that runs for the whole of every answer, for a value that can only change
       on a resize - and startThinking re-reads it each time the loop starts,
       which is the only moment the mark can have been laid out differently. */
    const css = cv._thinkCSS || (cv._thinkCSS = cv.clientWidth || 26);
    if (cv.width !== Math.round(css * dpr)) {
      cv.width = Math.round(css * dpr); cv.height = Math.round(css * dpr);
    }
    const S = cv.width;
    ctx.clearRect(0, 0, S, S);

    const phase = ms % T_CYCLE;
    /* `mix` is 0 in the mark and 1 in the orbit. */
    let mix;
    if (phase < T_SCATTER) mix = easeInOut(phase / T_SCATTER);
    else if (phase < T_SCATTER + T_ORBIT) mix = 1;
    else if (phase < T_SCATTER + T_ORBIT + T_GATHER) mix = 1 - easeInOut((phase - T_SCATTER - T_ORBIT) / T_GATHER);
    else mix = 0;

    const spin = (ms / 2600) * Math.PI * 2;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      /* In orbit the seats rotate; in the mark they do not, so the logo
         arrives upright rather than at whatever angle the spin had reached. */
      const a = spin * p.sp;
      const ox = p.ox * Math.cos(a) - p.oy * Math.sin(a);
      const oy = p.ox * Math.sin(a) + p.oy * Math.cos(a);
      const x = (p.x + (ox - p.x) * mix) * S * 0.92 + S / 2;
      const y = (p.y + (oy - p.y) * mix) * S * 0.92 + S / 2;
      const r = Math.max(0.6, p.sz * (S / 26) * (1 - mix * 0.25));
      ctx.globalAlpha = 0.45 + (1 - mix) * 0.55;
      /* Per dot rather than per frame. Ninety fill changes at 60fps is
         nothing, and batching by colour would mean sorting a set that is
         already in the order the eye reads it. */
      if (p.c) ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    return true;
  }

  /* ══ ONE ANSWER IN FLIGHT, AND ONE PLACE THAT KNOWS ABOUT IT ═══════════
     Two things had no owner until this. The BEAM, which belongs on every
     composer on the page rather than on the one that happened to be typed
     into — the gate's bar, the canvas's bar and the workbench's float bar are
     one control in three shells, and the answer is being produced for
     whichever of them is on screen. And the WAY OUT: `ask` scheduled its own
     resolution on an anonymous timer, so nothing could reach it, which is why
     the send button had nothing it could turn into.

     `abort` is the whole contract — a run hands over the one function that
     ends it, and that function is what the stop button calls. It doubles as
     the run's identity, so a question asked over the top of another cannot
     have its completion switch off a beam it does not own. */
  const generating = {
    abort: null,

    get on() { return !!this.abort; },

    /* The beam element is made here rather than written into the two shells,
       for the same reason the stop square is drawn in CSS: a state no markup
       has to know about is a state no markup can ship without. */
    paint() {
      const on = this.on;
      $$('.overlay-input-bar, .aimy-float-bar').forEach((bar) => {
        if (!$('.beam', bar)) {
          const b = document.createElement('span');
          b.className = 'beam';
          b.setAttribute('aria-hidden', 'true');
          /* The bloom is a real element because the beam has three layers and a
             pseudo-element only gives two. It carries no content and no class:
             it is the third box, and `.beam > i` is the whole of what the
             stylesheet needs to know about it. */
          b.appendChild(document.createElement('i'));
          bar.insertBefore(b, bar.firstChild);
        }
        bar.classList.toggle('is-generating', on);
      });
      /* AND IT STAYS ON THE BAR. This briefly also wrote the class onto
         <body>, so the ground behind the composer could answer to a run in
         progress. That was wrong, for a reason worth keeping written down:
         `.is-generating .overlay-send` and `.is-generating .aimy-float-send`
         are DESCENDANT selectors, so a copy of the class on the body matched
         EVERY send button on the page rather than the one belonging to the
         bar that is actually generating.

         A state class that descendant selectors read belongs on the element
         it is a state OF, and nowhere above it. */
      /* The one part of the swap that is not CSS, and the part a screen reader
         is actually given. A button that has become Stop while still
         announcing Send is worse than one that never changed. */
      $$('.overlay-send, .aimy-float-send').forEach((b) => {
        b.setAttribute('aria-label', on ? 'Stop generating' : 'Send');
        b.title = on ? 'Stop generating' : '';
      });
      /* And the empty bar says what it is doing. The three composers ask three
         different questions — the gate's, the canvas's and the workbench's are
         not the same sentence — so the original is parked on the element the
         first time it is replaced rather than written out here in a table that
         would go stale the day one of them is reworded. */
      $$('.overlay-input, .aimy-float-input').forEach((el) => {
        if (el.dataset.ph === undefined) el.dataset.ph = el.placeholder || '';
        el.placeholder = on ? 'Generating…' : el.dataset.ph;
      });
    },

    start(abort) { this.abort = abort; this.paint(); return abort; },

    /* Both take the run's own handle and ignore every other, so a superseded
       run finishing late cannot turn the beam off over the live one. */
    finish(h) { if (h && this.abort !== h) return; this.abort = null; this.paint(); },

    cancel() {
      const h = this.abort;
      if (!h) return;
      /* Cleared BEFORE the handler runs: the handler writes a turn and saves,
         and a re-entrant cancel in the middle of that is a second stop note. */
      this.abort = null;
      this.paint();
      h();
    }
  };

  function stoppedNote() {
    return '<div class="msg-stopped">' + ICO.slash.replace('<svg', '<svg width="12" height="12"') +
           'Stopped</div>';
  }

  function startThinking() {
    stopThinking();
    const cv = $('.think-mark');
    if (!cv) return;
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* The one layout read, here rather than in the frame loop. */
    cv._thinkCSS = cv.clientWidth || 26;
    const ctx = cv.getContext && cv.getContext('2d');
    /* Only a floor. Every dot sets its own fill from the mark's gradient; this
       is what paints them if that could not be read. */
    if (ctx) ctx.fillStyle = getComputedStyle(cv).color || '#61adf1';
    /* Reduced motion still gets the mark, drawn once, at rest. The state is
       information; only the movement is decoration. */
    if (still) { thinkFrame(cv, T_SCATTER + T_ORBIT + T_GATHER + 1); return; }
    const t0 = performance.now();
    const step = () => {
      if (!thinkFrame(cv, performance.now() - t0)) { thinkRAF = 0; return; }
      thinkRAF = requestAnimationFrame(step);
    };
    step();
  }

  function stopThinking() {
    if (thinkRAF) cancelAnimationFrame(thinkRAF);
    thinkRAF = 0;
  }


  function announceBuild() {
    try {
      const me = [].slice.call(document.scripts).filter((x) => /knowledge\.js/.test(x.src || ''))[0];
      const v = me && (me.src.match(/[?&]v=(\d+)/) || [])[1];
      console.log('AiMY' + (v ? ' · build ' + v : ' · build unversioned') +
                  ' · ' + (document.body.getAttribute('data-page') || 'page'));
    } catch (e) {}
  }

  function init() {
    announceBuild();
    /* `data-page` was declared on both existing pages and read by nothing.
       It is the seam now: the gate boots a conversation and a shell, and none
       of the grid, filters, briefing, bell, drop layer or document machinery,
       because none of that has anywhere to render on it. */
    const page = document.body.getAttribute('data-page');
    const gate = page === 'gate';

    /* ══ SETTINGS TAKES THE CHROME AND NOTHING ELSE ═════════════════════
       The topnav is shared markup, and settings shipped it without the script
       behind it: the account pill was focusable, announced `aria-haspopup` and
       did nothing when pressed — the same inert control this build removed
       from the other two shells, still sitting on the third. It gets the bell
       for the same reason, and both are wired here rather than copied into
       settings.js, because a second implementation of one dropdown is the way
       the two drift.

       Nothing else boots. There is no grid to render, no overlay to open and
       no conversation to restore, so every line below this point would be
       machinery addressing elements that are not on the page. */
    if (page === 'settings') {
      const nm = $('#userName'), rl = $('#userRole'), av = $('#userAvatar');
      if (nm) nm.textContent = USER.name;
      if (rl) rl.textContent = USER.role;
      if (av) av.textContent = USER.initials;
      userMenu.init();
      prodMenu.init();
      bell.init();
      /* The other two shells order Escape once, inside the canvas's chain of
         dismissable layers. There is no canvas here, so the three layers that
         do exist order themselves — shallowest first, same as there. */
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (bell.open) { bell.close(true); return; }
        if (userMenu.open) { userMenu.close(true); return; }
        if (prodMenu.open) { prodMenu.close(true); return; }
      });
      return;
    }

    canvas.init();
    /* Before the first render, so the column has something in it the moment the
       canvas can be opened. */
    seedSessions();
    /* AFTER the seeds, deliberately. The fixtures give a first-time visitor a
       history to look at; anything real then lands on top of them, keyed by
       the same ids, so a renamed or deleted seed stays renamed or deleted. */
    loadChats();
    userMenu.init();
    prodMenu.init();
    wire();

    /* ══ THE FOUR PATTERNS ══════════════════════════════════════
       Before the gate branch, because the thinking trace is wanted on both
       shells and the gate returns early. Same contract as AIMY_GATE and
       AIMY_SETTINGS: hand over the few functions it cannot compute for
       itself, and guard the call, because the file is optional. */
    if (window.AIMY_AGENT) {
      window.AIMY_AGENT.init({
        flagForHuman: (o) => {
          toast('Asked a person to look', null,
                o && o.title ? 'About ' + o.title : 'The report is now waiting on a human');
        }
      });
    }

    const u = $('#userName'), r = $('#userRole'), a = $('#userAvatar');
    if (u) u.textContent = USER.name;
    if (r) r.textContent = USER.role;
    if (a) a.textContent = USER.initials;

    if (gate) {
      if (window.AIMY_GATE) window.AIMY_GATE.init(GATE_API);
      /* The gate has the canvas but not the grid, so the bell's answering rows
         land in place and its filtering rows leave for the Console. `needs` is
         what tells the two apart. */
      bell.init();
      paintThread();
      return;
    }

    bell.init();
    setModal.init();
    drawers.init();
    wireDrop();
    renderAiState();

    /* ══ THE SETTINGS VIEWS ═════════════════════════════════════════════
       settings.js renders the modules; this file owns the URL, the rail and
       the stage they land in. Handing over `patch` and `readURL` is the whole
       contract: two scripts, one writer, so a module click and a filter chip
       are the same kind of event and the back button unwinds both.

       Same shape as the gate's `AIMY_GATE.init(GATE_API)` above. Guarded
       because the file is optional — the console still renders its grid on a
       page that does not load it. */
    if (window.AIMY_SETTINGS) {
      /* ══ THE CATALOGUE IS DOCUMENTS ══════════════════════════════════

         Settings' sell picker had eight offerings hardcoded, under a comment
         saying nothing there is typed into existence "because every entry is a
         node the knowledge graph points at and a free-written 'QA stuff' would
         be an edge to nowhere". That rule is kept, not broken — a Product
         document IS such a node. Writing one is how you add to the catalogue,
         and there is still no way to type a name straight into the picker.

         A FUNCTION, not an array. Settings calls it on every repaint, so a
         product written a moment ago is in the next painting of the picker
         with nothing to invalidate and no copy to keep in step.

         Direction of the dependency is the existing one: knowledge.js knows
         settings.js exists and hands it what it cannot compute; settings.js
         knows only what it was handed. */
      window.AIMY_SETTINGS.init({
        patch: patch, readURL: readURL, render: render,
        offerings: () => ENTITLED
          /* Archived is the one exclusion. NOT drafts: you write the product,
             it is a draft for as long as it takes you to describe it, and a
             catalogue that withholds it until publication would make the
             obvious next step — go and tick it in Sales — silently impossible. */
          .filter((o) => SELLABLE[o.t] && !o.arch)
          .map((o) => ({
            /* Namespaced, because these ids share a picker with the eight
               static ones and a document called `qa` must not shadow AiMY QA. */
            id: 'doc:' + o.id,
            name: o.title,
            kind: SELLABLE[o.t],
            /* The pitch if it has been written, the summary's first sentence if
               not, and nothing rather than a literal em dash — which is what
               `BLANK_X` puts there and would read as a description that says
               "—". */
            d: pitchOf(o),
            doc: o.id
          })),

        /* ── WHAT IS IN THE ARCHIVE, AND THE TWO VERBS ON IT ──

           Settings owns the page; this file owns the documents, so it answers
           the list and performs the actions. `docAct` is handed over whole
           rather than a pair of restore/delete wrappers, because the dialogs,
           the typed confirmation and the audit copy all live behind it and a
           wrapper would be a second place for them to be described. */
        archived: () => ENTITLED
          .filter((o) => o.arch)
          .map((o) => ({
            id: o.id,
            title: o.title,
            kind: TYPES[o.t] ? TYPES[o.t].label : 'Document',
            collection: COLLECTIONS[o.col] || o.col,
            /* The date the copy last changed, which for an archived document is
               when it was put away — archiving writes a version and stamps it. */
            when: fmtDate(o.upd)
          })),
        /* The archive holds DOCUMENTS, so it draws them the way every other
           surface in this console draws them — `typeCard`, the same component
           as the grid, the search results and the briefing. Settings is handed
           the finished markup rather than the data, because the card is this
           file's component and a settings-side reimplementation of it would be
           a second card to keep in step with the first.

           The click handlers need no bridge: they are delegated on `document`
           here, so a card works wherever its markup lands. */
        /* Filtered by the SAME bar the grid uses. `applyFilters` already reads
           `st.archived` and flips which half of the corpus it draws from, so
           forcing that one key on gives Client, Product, Source, Type, date and
           the search box over the archive for free — and means the archive
           cannot disagree with the grid about what a filter means. */
        archiveCards: () => {
          const st = Object.assign(readURL(), { archived: 1 });
          const list = sortSet(applyFilters(st), orderOf(st, false));
          if (!list.length) return '<p class="rail-empty">Nothing archived matches those filters.</p>';
          return '<div class="ws-grid">'
            + list.map((o) => typeCard(o, false, { arch: 1 })).join('')
            + '</div>';
        },
        docAct: docAct,

        /* ── THE WAY BACK, FROM THE PICKER TO THE THING THE PICKER LACKS ──

           Settings can say "create one" but cannot do it: the library, the
           menu and the URL all live here. So it asks, and this performs the
           whole errand — leave settings, open the menu, bring the two rows
           that matter into view, and say which they are.

           The flag is the point. The menu is eleven rows in a 17rem box, so
           Product and Service are BELOW THE FOLD and arriving with them merely
           scrolled into view looks identical to arriving at a menu that
           happened to be scrolled. A second of tint is the difference between
           "here is a menu" and "here are the two rows you were sent for". */
        newOffering: () => {
          flagNewTypes = true;
          /* Out of settings AND out of any open document, in one patch: two
             would render an intermediate state nobody asked to see. `patch`
             renders synchronously, so the menu exists by the time this
             returns — already open, because the flag was set first. */
          patch({ m: '', sec: '', doc: '' });

          /* Scroll position is the one thing the flag cannot carry: the markup
             is regenerated on every repaint, and a fresh element scrolls to its
             top. So it is re-applied for as long as the flag is up — the same
             repaint that made poking classes fail is why a single scroll would
             not hold either. Cheap, idempotent, and it stops itself. */
          let armed = false;
          const reveal = () => {
            const keys = Object.keys(SELLABLE);
            const last = $('[data-new-type="' + keys[keys.length - 1] + '"]');
            /* The LAST of the two, so both land in view: they are adjacent and
               at the end of the list, and scrolling to the first would leave
               the second under the fold it was meant to clear. */
            if (!last) return;
            last.scrollIntoView({ block: 'nearest' });
            if (armed) return;
            armed = true;
            /* Focus once, not on every repaint: moving focus repeatedly would
               fight a reader who has already pressed an arrow key. */
            const first = $('[data-new-type="' + keys[0] + '"]');
            if (first) first.focus({ preventScroll: true });
            /* ── THE SECOND STARTS WHEN THE MENU IS ON SCREEN ──
               Measured from the click it was mostly spent before there was
               anything to look at: leaving settings and drawing the library
               takes about 400ms, so a 1000ms flag showed for 600. The clock
               starts at the first paint that actually contains the rows. */
            setTimeout(() => {
              flagNewTypes = false;
              /* ── AND IT DOES NOT RE-RENDER ──

                 One flag was doing two jobs — drawing the menu open and tinting
                 the two rows — so ending the tint re-drew the menu from state
                 that no longer said "open" and shut it in the reader's face,
                 one second after sending them there to look at it. Only ONE of
                 the two jobs is over.

                 So the class comes off the live DOM instead. The tint
                 transitions away, `.open` is left exactly where the last render
                 put it, and the menu goes back to being an ordinary open menu
                 — dismissed by clicking away or pressing Escape, like every
                 other menu here. */
              $$('.new-menu .menu-item.is-flagged')
                .forEach((r) => r.classList.remove('is-flagged'));
            }, 1000);
          };
          requestAnimationFrame(reveal);
          /* One mechanism for both jobs: waiting for the menu to exist, and
             re-scrolling it after each repaint while it does. It ends with the
             flag, so nothing here outlives the second it belongs to. */
          const poll = setInterval(() => {
            if (!flagNewTypes) { clearInterval(poll); return; }
            reveal();
          }, 100);
        }
      });
    }

    /* ── What another shell sent here ──

       A bell row on the gate or in settings cannot steer a grid that is not on
       the page, so it arrives as a URL instead. `ask` is a question to answer,
       `stage` a write to prepare — neither is a filter, so both are read and
       STRIPPED before the first render: left in the address bar they would
       re-fire on reload and on every Back, and they would sit in a filter URL
       that is meant to be legible and pasteable. */
    const inbound = new URLSearchParams(location.search);
    const asked = inbound.get('ask'), staged = inbound.get('stage');
    if (asked || staged) {
      inbound.delete('ask'); inbound.delete('stage');
      const rest = inbound.toString().replace(/%2C/g, ',').replace(/%3A/g, ':');
      history.replaceState(null, '', location.pathname + (rest ? '?' + rest : ''));
      /* The back-button guard compares against this. Rewriting the address bar
         without it leaves the guard defending a URL that no longer exists. */
      hereURL = location.pathname + location.search;
    }

    render();

    /* After the render, so the answer opens over a surface that is already
       drawn rather than over an empty one. */
    if (asked) submit(asked);
    else if (staged) canvas.stage(staged, ['Coverage gap', 'Sent from another shell', 'Nothing to filter to']);

    /* The loading state resolves into the real surface, so the skeleton is a
       stage rather than a dead end. */
    if (forcedState === 'loading') setTimeout(() => { location.href = location.pathname; }, 2200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
