/* ═══════════════════════════════════════════════════════════════════════════
   settings.js — AiMY Settings

   A page, not a fourth overlay. The corpus already carries the canvas, the
   settings sheet and the peek; settings is somewhere you GO, and giving it a
   URL is what makes it linkable, bookmarkable and drivable by an agent.

   ── The IA ──
   The production console splits at the top by WHO (Personal | Workspace
   Admin). That forces every capability to exist twice and reduces the whole
   override story to a banner sentence plus a padlock. This build splits by
   WHAT, and demotes "whose" to a LENS that sits across every module:

       AI Controls   what AiMY can do        Skills, Agents, Grounding
       Organization  who exists and reaches  People, Roles, Hierarchy, Plan
       Operations    the machinery           Sync, Webhooks, Mapping, ...

       Lens          Yours | Organization | Effective     (default Effective)

   So Skills is ONE destination. Your skills and the organisation's are in one
   list, each saying where it came from and whether it survived.

   ── Instructions are skills ──
   They were a separate object with their own module. They are the same thing:
   an instruction is a skill that ALWAYS applies. `trigger: 'always'` is the
   whole of the merge, and the four old RULES fixtures come across with their
   scope, their reach and their state intact. This reverses the position
   argued in the previous build of this file; it was a deliberate call, not an
   oversight.

   ── State ──
   The query string, same as the corpus. Nothing narrows the view off a
   variable the URL does not also hold, because a filter with neither a control
   nor a chip has silently taken something away.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ═══ ICONS ═══ */
  /* The same symbol knowledge.js uses, from the same sprite. A quick action is
     AiMY's reading of a page, and it has to be recognisable as that from the
     rail without a legend. */
  const AIMY = '<svg class="rail-fix-m" width="11" height="12" viewBox="0 0 18 20" aria-hidden="true"><use href="#aimy-logo-small"/></svg>';
  /* The same mark without the rail's sizing class, for an insight sitting in
     the page body. `knowledge.js` calls its copy `AIMY_MARK`; this is the same
     symbol from the same sprite, so the band, the card, the rail and this read
     as one voice rather than four components that happen to agree. */
  const AIMY_MK = (w, h) =>
    `<svg width="${w || 13}" height="${h || 15}" viewBox="0 0 18 20" aria-hidden="true"><use href="#aimy-logo-small"/></svg>`;
  const I = {
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
    tick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>',
    caret: '<svg class="set2-exp" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    down: '<svg class="set2-lad-ch" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    chev: '<svg class="set2-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    lock: '<svg class="w-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>',
    /* Row glyphs. One family, one stroke, 16px grid. */
    bolt: '<svg class="set2-row-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/></svg>',
    doc:  '<svg class="set2-row-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    hand: '<svg class="set2-row-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>',
    plug: '<svg class="set2-row-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M15 8V2"/><path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M9 8V2"/></svg>',
    user: '<svg class="set2-row-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    tree: '<svg class="set2-row-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>',
    left: '<svg class="set2-lad-ch" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    trash: '<svg class="set2-tr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    cal:  '<svg class="set2-cal-i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>',
    sortUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
    sortDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
    sortNone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>',
    key:  '<svg class="set2-row-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 21 9.6-9.6"/><path d="m7.5 15.5 2.3 2.3a1 1 0 0 1 0 1.4l-2.1 2.1a1 1 0 0 1-1.4 0L4 19"/><circle cx="15.5" cy="7.5" r="5.5"/></svg>'
  };

  /* ═══ WHO ═══ */
  const USER = { name: 'Nour Wael', initials: 'NW', role: 'Product Design' };

  /* ═══ THE SIX-LEVEL TREE ═══
     The console's Access & hierarchy prototype, which is the only screen there
     that knows all six levels exist. CXS reaches all six; Upland five; MedFar
     is a client with nothing under it yet, which is the state most real
     clients are in and the one a picker most often gets wrong. AiMY's own
     agents sit last and are never scoped away. */
  /* ════════════════════════════════════════════════════════════
     THERE IS NO ORGANISATION

     The tenancy used to hang off one - FlairsTech, with every client
     beneath it. It described OUR org chart rather than the customer's, and
     nothing in the product ever granted against it, scoped to it or
     filtered by it. The one thing it did was print its own name on top of
     every page, which is how a level with no behaviour stays in a model.

     Clients are the roots. What is left of the old root is a POSITION and
     not a level - "no client picked" - which People and the Scopes map both
     need somewhere to stand; TENANCY below is that, and it is never drawn,
     never granted against, and carries the empty id so the URL says nothing
     rather than naming something that does not exist.
     ════════════════════════════════════════════════════════════ */
  const TREE = [
    /* FlairsTech is a tenant like any other. It is the vendor — every person in
       PEOPLE carries an @flairstech.com address — and it also runs on the
       product, which is exactly what knowledge.js has always said: ORGS lists
       it first, beside CXS, Upland and MedFar, and ORG_OF_CLIENT hangs Asteris
       and Valsoft under it.

       Its products are the AiMY suite, and they hang directly off the client
       rather than under an invented Business Unit — nothing records one, and a
       department made up to fill a level is worse than a level left out. The
       map places by walk depth rather than by type, so they draw one step in
       from the client exactly as a BU would.

       Note the names that repeat: AiMY Sales and AiMY Voice are PRODUCTS here,
       while Sales and Voice under “AiMY agents” are AGENTS. Those are two
       different things wearing one word, and the agents branch is still the
       stale Copilot/Sales/Voice fixture noted in GAPS. */
    { id: 'flairs', name: 'FlairsTech', type: 'Client', kids: [
      { id: 'aimy-qa',      name: 'AiMY QA',      type: 'Product', kids: [] },
      { id: 'aimy-voice',   name: 'AiMY Voice',   type: 'Product', kids: [] },
      { id: 'aimy-sales',   name: 'AiMY Sales',   type: 'Product', kids: [] },
      { id: 'aimy-connect', name: 'AiMY Connect', type: 'Product', kids: [] }
    ]},
    { id: 'cxs', name: 'CXS', type: 'Client', kids: [
      { id: 'cxs-ops', name: 'Customer Operations', type: 'Business Unit', kids: [
        { id: 'cxs-copilot', name: 'Support Copilot', type: 'Product', kids: [
          { id: 'cxs-kops', name: 'Knowledge Ops', type: 'Team', kids: [
            { id: 'u-mahfouz', name: 'A. Mahfouz', type: 'User' },
            { id: 'u-nour', name: 'Nour Wael', type: 'User' }
          ]},
          { id: 'cxs-senab', name: 'Support Enablement', type: 'Team', kids: [
            { id: 'u-alex', name: 'Alex Smith', type: 'User' },
            { id: 'u-saly', name: 'Saly Tarek', type: 'User' }
          ]}
        ]},
        { id: 'cxs-ksearch', name: 'Knowledge Search', type: 'Product', kids: [
          { id: 'cxs-disc', name: 'Discovery', type: 'Team', kids: [
            { id: 'u-ramy', name: 'Mohamed Ramy', type: 'User' }
          ]}
        ]}
      ]},
      { id: 'cxs-dx', name: 'Digital Experience', type: 'Business Unit', kids: [
        { id: 'cxs-self', name: 'Self-Service', type: 'Product', kids: [] }
      ]}
    ]},
    { id: 'upland', name: 'Upland', type: 'Client', kids: [
      { id: 'upl-sup', name: 'Support Operations', type: 'Business Unit', kids: [
        { id: 'interfax', name: 'InterFAX Support', type: 'Product', kids: [
          { id: 'ifx-t1', name: 'Tier 1', type: 'Team', kids: [
            { id: 'u-tarek', name: 'Tarek Ahmed', type: 'User' }
          ]}
        ]},
        { id: 'kapost', name: 'Kapost Support', type: 'Product', kids: [] },
        { id: 'filebound', name: 'FileBound Support', type: 'Product', kids: [] }
      ]}
    ]},
    { id: 'medfar', name: 'MedFar', type: 'Client', kids: [] },
    { id: 'aimy', name: 'AiMY agents', type: 'Ours', kids: [
      { id: 'copilot', name: 'Copilot', type: 'Agent' },
      { id: 'sales', name: 'Sales', type: 'Agent' },
      { id: 'voice', name: 'Voice', type: 'Agent' }
    ]}
  ];

  function leavesOf(node, out) {
    out = out || [];
    if (!node.kids || !node.kids.length) { out.push(node); return out; }
    node.kids.forEach((k) => leavesOf(k, out));
    return out;
  }
  const ALL_LEAVES = TREE.reduce((a, n) => a.concat(leavesOf(n)), []);
  const LEAF_TOTAL = ALL_LEAVES.length;
  function findNode(id, list) {
    list = list || TREE;
    for (const n of list) {
      if (n.id === id) return n;
      if (n.kids) { const f = findNode(id, n.kids); if (f) return f; }
    }
    return null;
  }

  /* ═══ PRECEDENCE ═══
     THE SIX-LEVEL LADDER IS GONE, AND SO IS THE MACHINERY THAT RESOLVED IT.

     `LEVELS`, `resolve()`, `ladder()`, `chainSpeaks()`, `lensNothing`, the
     three-way lens and every skill's six-entry `chain` stood here. They
     described precedence as a walk down the tenancy — Organisation, Client,
     Business Unit, Product, Team, You — with a lock that could stop the walk
     early.

     Two things killed it. Reach became agents × products, which are not levels
     of that tenancy, so the ladder was resolving a hierarchy nothing else on
     the surface used any more; that contradiction was flagged on screen rather
     than settled. And Nour settled it: the organisation's skills override
     yours when they overlap. That is a rule about WHO OWNS a skill, not about
     how deep in a tree it was set, and it needs two parties rather than six
     stops.

     Also removed on the way out: the Effective / Organization / Yours lens.
     It read and wrote `lens` correctly, but `.set2-lens` and `.set2-lens-b`
     were never written in `settings.css`, so it rendered as three unstyled
     words. Its `lens` key leaves `knowledge.js` with it — a URL parameter no
     screen reads is a promise the address bar cannot keep. */
  const ORG = 'FlairsTech';

  /* ═══ SKILLS ═══
     `trigger: always` is what an instruction was. Nothing else changed: the
     old rules keep their scope, their reach and their state. */
  const TRIGGER = { always: 'Always', auto: 'Automatic', manual: 'On demand' };
  /* What each one COSTS you, not what it is called. `Automatic` and `On demand`
     are indistinguishable from their names alone, and the difference between
     them decides whether a badly written description silently stops a skill
     firing — which is the failure this whole surface exists to make visible. */
  const TRIGGER_WHY = {
    always:  'Every turn.',
    auto:    'When the description matches.',
    manual:  'Only when asked by name.'
  };

  const SKILLS = [
    { id: 'tone', slug: 'professional-tone', name: 'Professional tone', own: 'org', trigger: 'always', on: true,
      desc: 'Neutral register. No emojis or jargon unless the reader asks for something looser.',
      by: 'A. Mahfouz', when: '11 Aug', v: 3, sources: ['policies'],
      agents: ['copilot', 'sales', 'voice'], products: ['General', 'Support', 'Sales'],
      body: 'Keep a professional, neutral tone. Avoid emojis and jargon unless the reader asks '
          + 'for something more creative. Never open with an apology.' },

    /* THE OVERLAP, and the reason two of these share a name. FlairsTech ships
       its own refund skill; Nour wrote one too, before or after, and both are
       real files that exist. The organisation's applies. Nothing is deleted
       and nothing is hidden — the personal one is kept, editable, and marked. */
    { id: 'refund-org', slug: 'draft-refund-response', name: 'Draft a refund response', own: 'org', trigger: 'auto', on: true,
      desc: 'Answer from the EU refund article and name it. Never quote a figure that is not in a source.',
      by: 'A. Mahfouz', when: '11 Aug', v: 2, sources: ['policies', 'support'],
      agents: ['copilot'], products: ['Support'],
      body: 'Answer from the EU refund article first, and name it. Never quote a figure that is '
          + 'not in a cited source. If the customer asks for an exception, say who can grant it '
          + 'rather than guessing whether it will be granted.' },

    { id: 'refund', slug: 'draft-refund-response', name: 'Draft a refund response', own: 'you', trigger: 'auto', on: true,
      desc: 'Cite the policy article and flag the contested clause rather than picking a side.',
      by: USER.name, when: '20m ago', v: 4, sources: ['policies', 'support'],
      agents: ['copilot'], products: ['Support'],
      body: 'Answer from the EU refund article first, and name it. If the Returns FAQ disagrees '
          + 'about what happens after activation, say the clause is contested rather than picking '
          + 'a side. Nobody has ruled on it. Never quote a figure that is not in a cited source.' },

    { id: 'booking', slug: 'booking-reference-guard', name: 'Booking reference guard', own: 'org', trigger: 'always', on: true,
      desc: 'Never quote a fare without a booking reference.',
      by: 'Ahmed Samy', when: '3 Sep', v: 1, sources: ['policies'],
      agents: ['copilot', 'voice'], products: ['Support'],
      body: 'Refer to the traveller in the second person. Never quote a fare without a booking '
          + 'reference in hand.' },

    { id: 'sweep', slug: 'weekly-staleness-sweep', name: 'Weekly staleness sweep', own: 'you', trigger: 'manual', on: true,
      desc: 'Documents behind their source, grouped by connector, with an owner for each.',
      by: USER.name, when: '3 Sep', v: 2, sources: ['policies', 'support', 'marketing'],
      agents: ['copilot'], products: ['General'],
      body: 'Group by connector, not by collection. A stale document is almost always a symptom '
          + 'of the sync that fed it. Name the owner for each. Stop at ten and say how many were '
          + 'left out.' },

    { id: 'triage', slug: 'triage-inbound-ticket', name: 'Triage an inbound ticket', own: 'org', trigger: 'auto', on: false,
      desc: 'Classify, cite the article that settles it, and say plainly when none does.',
      by: 'A. Mahfouz', when: '11 Aug', v: 1, sources: ['support'],
      agents: [], products: [],
      body: 'Classify first, answer second. If no article settles the ticket, say so plainly and '
          + 'route it. A confident answer from adjacent material is the failure this skill exists '
          + 'to prevent.' }
  ];

  /* Per skill, so editing one skill's reach cannot move another's. */
  const OPEN = new Set(['flairs', 'cxs', 'cxs-ops', 'upland', 'aimy']);
  const DIRTY = new Set();

  const skillById = (id) => SKILLS.filter((s) => s.id === id)[0];

  /* ═══ OWNERSHIP, WHICH IS THE WHOLE PRECEDENCE MODEL ═══
     A skill belongs to the organisation or to you. Two skills OVERLAP when
     they share a name, because the name is how a skill is addressed — an
     agent asked for `Draft a refund response` has to be handed exactly one
     file, and something has to decide which. The organisation's wins.

     Matching on NAME rather than on reach is deliberate. Agents × products
     intersect constantly — three of these six skills touch Copilot and
     Support — so an overlap defined that way would shadow nearly every
     personal skill and make owning one pointless. Name collision is the case
     where two files genuinely answer to the same call. */
  const isOrg = (s) => s.own === 'org';

  /* The SLUG is the address — `name:` in the frontmatter, lower case and
     hyphenated, which is what an agent asks for. `id` stays unique because it
     is the URL key; the slug is allowed to collide, and a collision across the
     two owners is precisely the overlap this model is about. Two skills of the
     SAME owner may never share one: that is a mistake, not a precedence. */
  const nameKey = (s) => String(s.slug || s.id).trim().toLowerCase();

  function uniqueId(base) {
    let id = base, n = 2;
    while (skillById(id)) id = base + '-' + (n++);
    return id;
  }

  /* The organisation's skill that beats this one, or null. The rule runs ONE
     WAY: only a skill of yours can be shadowed, and only by an ENABLED org
     skill — a switched-off skill overrides nothing, because it is not there to
     be handed over. */
  function shadowedBy(s) {
    if (!s || isOrg(s)) return null;
    return SKILLS.filter((x) => isOrg(x) && x.on && x.id !== s.id && nameKey(x) === nameKey(s))[0] || null;
  }

  /* The other direction: yours that this org skill is standing on. */
  function shadowing(s) {
    if (!s || !isOrg(s) || !s.on) return null;
    return SKILLS.filter((x) => !isOrg(x) && x.id !== s.id && nameKey(x) === nameKey(s))[0] || null;
  }

  const ownerName = (s) => (isOrg(s) ? ORG : 'You');

  /* ── WHOSE IT IS DECIDES WHETHER YOU MAY SWITCH IT ──

     An org skill is the tenancy’s and not yours: the overview says
     "Everyone on the tenancy has this one" and the editor already warns
     that "Saving changes it for everyone". The switch had no such guard,
     so a list row could turn a skill off for the whole company in one
     click, silently.

     It returns the SENTENCE rather than a boolean, so every caller shows
     the same reason and none of them has to compose one. */
  const lockedReason = (s) =>
    (isOrg(s) ? ORG + '’s skill — only ' + ORG + ' can switch it on or off.' : '');

  /* `standing()` and `reachOf()` stood here, reading `SEL` — the tree-based
     target set. Reach is agents and products now, so the one that survived
     moved into the Skills block as `standing2`, where the fields it reads
     live. Two functions answering "does this skill apply" from two different
     models is how a status column and a filter start disagreeing. */

  /* ═══════════════════════════════════════════════════════════════════════
     CONNECTIONS

     The console models this surface as four unrelated sections stacked on one
     scroll, scoped by two dropdowns that sit in different places and mean
     different things: a product picker in the page chrome ("FileBound") and a
     CRM picker in a section header ("CRM"). A third copy of the product,
     disabled, sits inside the sync form. Nothing on the page says that all
     four sections describe ONE thing.

     They do. A product plus a CRM is a CONNECTION, and everything else here
     is that connection's contract: what its fields mean, how far back to
     read, when to pull, and what to throw away. So the scope stops being two
     dropdowns and becomes a list you pick from, the way Supabase and Railway
     scope a project. You are never in a state where the page is showing you
     one product's mapping and another product's sync.
     ═══════════════════════════════════════════════════════════════════════ */

  /* The connector's own schema. Typeahead has to come from somewhere real or
     the picker is a text box wearing a costume. `o` marks an object, which is
     what makes a path longer than one segment possible.

     NOTE on the console's version: its key picker suggests "Mohamed, Mostafa,
     Mosaab" under a heading that reads SELECT KEY. Those are values, not keys.
     Either the prototype was wired to the wrong fixture or the control means
     something other than its label. Modelled here as keys, which is the only
     reading where the control and its heading agree. */
  const SCHEMA = {
    teamsupport: {
      assignee:  { o: { name: 's', email: 's', id: 'id', phone: 's' } },
      requester: { o: { name: 's', email: 's',
                        organization: { o: { name: 's', domain: 's' } } } },
      ticket:    { o: { id: 'id', subject: 's', status: 'e', priority: 'e', created_at: 'd' } },
      brand:     { o: { name: 's' } }
    },
    freshdesk: {
      agent:    { o: { name: 's', email: 's', id: 'id' } },
      contact:  { o: { name: 's', email: 's', company: { o: { name: 's', domain: 's' } } } },
      ticket:   { o: { id: 'id', subject: 's', status: 'e', priority: 'e' } }
    },
    /* The three that are not helpdesks. A data source does not have to be a
       ticketing system to have a shape, and the mapping page is the same page
       for all five — which is the point of naming the axis Data Source rather
       than CRM. Each is shallower than a helpdesk because each genuinely is:
       a page has an author and a space, and that is most of what it has. */
    confluence: {
      page:   { o: { id: 'id', title: 's', updated: 'd',
                     space: { o: { key: 's', name: 's' } } } },
      author: { o: { name: 's', email: 's' } },
      label:  { o: { name: 's' } }
    },
    web: {
      page: { o: { url: 's', title: 's', crawled: 'd', status: 'e' } },
      meta: { o: { description: 's', canonical: 's' } }
    },
    upload: {
      file:     { o: { name: 's', kind: 'e', size: 's' } },
      uploader: { o: { name: 's', email: 's' } },
      uploaded: 'd'
    }
  };

  /* ── What the path actually returns ──
     The single most important thing on this screen. A path that resolves
     cleanly and returns the WRONG column passes every other check there is:
     the schema accepts it, the syntax is fine, nothing goes red. The only way
     to catch it is to look at the values.

     Attio, HubSpot, folk and Podia all pin a data preview beside the mapping
     for exactly this reason. The production console does too, and mislabels it
     `SELECT KEY` -- those names under the picker are the VALUES coming back,
     not the keys going in. */
  const SAMPLES = {
    teamsupport: {
      'assignee.name': ['Mohamed Ramy', 'Mostafa Adel', 'Mosaab Hany'],
      'assignee.email': ['m.ramy@cxs.com', 'm.adel@cxs.com', 'm.hany@cxs.com'],
      'assignee.id': ['4471', '4472', '4488'],
      'assignee.phone': ['+20 100 442 1180', '+20 100 771 3325', 'null'],
      'requester.name': ['Dana Whitfield', 'Ivo Kraus', 'Priya Raghavan'],
      'requester.email': ['dana@nordwind.de', 'ivo@tavola.it', 'priya@meridian.health'],
      'requester.organization.name': ['Nordwind GmbH', 'Tavola Retail', 'Meridian Health'],
      'requester.organization.domain': ['nordwind.de', 'tavola.it', 'meridian.health'],
      'ticket.id': ['88214', '88215', '88220'],
      'ticket.subject': ['Refund not received', 'Cannot export batch', 'Seat count wrong'],
      'ticket.status': ['solved', 'open', 'pending'],
      'ticket.priority': ['5', '2', '3'],
      'ticket.created_at': ['2026-08-14', '2026-08-14', '2026-08-15'],
      'brand.name': ['FileBound', 'FileBound', 'InterFAX']
    },
    freshdesk: {
      'agent.name': ['Tarek Ahmed', 'Salma Nabil', 'Karim Fouad'],
      'agent.email': ['tarek@upland.com', 'salma@upland.com', 'karim@upland.com'],
      'agent.id': ['9012', '9013', '9020'],
      'contact.name': ['Lena Fischer', 'Marco Rossi', 'Aisha Bello'],
      'contact.email': ['lena@nordwind.de', 'marco@tavola.it', 'aisha@orbit.bpo'],
      'contact.company.name': ['Nordwind GmbH', 'Tavola Retail', 'Orbit BPO'],
      'contact.company.domain': ['nordwind.de', 'tavola.it', 'orbit.bpo'],
      'ticket.id': ['5510', '5511', '5514'],
      'ticket.subject': ['Licence renewal', 'Batch stuck', 'Export failing'],
      'ticket.status': ['open', 'open', 'pending'],
      'ticket.priority': ['1', '3', '2']
    },
    confluence: {
      'page.id': ['118034', '118211', '119002'],
      'page.title': ['Refund policy', 'Data residency', 'SSO rollout runbook'],
      'page.updated': ['2026-08-02', '2026-07-28', '2026-08-11'],
      'page.space.key': ['SUP', 'LEG', 'SUP'],
      'page.space.name': ['Support', 'Legal', 'Support'],
      'author.name': ['Amira Mahfouz', 'Nour Wael', 'Omar Said'],
      'author.email': ['a.mahfouz@upland.com', 'n.wael@upland.com', 'o.said@upland.com'],
      'label.name': ['policy', 'gdpr', 'runbook']
    },
    web: {
      'page.url': ['aimy.app/security', 'aimy.app/pricing', 'aimy.app/blog/residency'],
      'page.title': ['Security', 'Pricing', 'Where your data lives'],
      'page.crawled': ['2026-07-11', '2026-07-11', '2026-07-11'],
      /* The crawl has been blocked since 11 Jul, so what it last returned is
         two thirds 403. A preview that showed three clean 200s would hide the
         connector's actual state on the one screen built to reveal it. */
      'page.status': ['200', '403', '403'],
      'meta.description': ['How AiMY stores and segregates customer data', 'Plans and limits', 'null'],
      'meta.canonical': ['aimy.app/security', 'aimy.app/pricing', 'null']
    },
    upload: {
      'file.name': ['Q3-QBR-Nordwind.pptx', 'DPA-2026-signed.pdf', 'refund-matrix.xlsx'],
      'file.kind': ['pptx', 'pdf', 'xlsx'],
      'file.size': ['4.2 MB', '318 KB', '96 KB'],
      'uploader.name': ['Nour Wael', 'Legal', 'Amira Mahfouz'],
      'uploader.email': ['n.wael@upland.com', 'legal@upland.com', 'a.mahfouz@upland.com'],
      'uploaded': ['2026-09-08', '2026-08-19', '2026-08-04']
    }
  };
  const samplesFor = (crmId, path) => (SAMPLES[crmId] || {})[path.join('.')] || null;

  /* ── Every path the connector exposes, flattened ──
     The console walks the schema one level at a time: pick `requester`, then a
     menu, then pick `organization`, then a menu, then pick `domain`. Three
     decisions to name one thing, and you cannot see what any of them return
     until you have made all three.

     Flattening it means ONE decision. Type "domain" and every path that could
     be a domain is on screen with its values beside it, whichever branch it
     lives on. The tree is still how the connector is shaped; it is just not
     how anybody should have to search it. */
  function allPaths(crmId, node, prefix, out) {
    out = out || []; prefix = prefix || [];
    const o = node ? node.o : SCHEMA[crmId];
    if (!o) return out;
    Object.keys(o).forEach((k) => {
      const next = o[k];
      const path = prefix.concat([k]);
      if (typeof next === 'string') out.push({ path: path, kind: next });
      else { out.push({ path: path, kind: 'o' }); allPaths(crmId, next, path, out); }
    });
    return out;
  }
  /* Leaves only, for the picker: an object is a container, not a value, and
     offering one as a mapping is offering something that answers nothing. */
  const leafPaths = (crmId) => allPaths(crmId).filter((p) => p.kind !== 'o');

  /* ── Derived subfields ──
     A field can carry children whose values come from INSIDE its own — the
     domain of an email, the surname in a name. The console models these as
     separate top-level paths, which loses the fact that the domain you use
     came from the email you already mapped: change the email and the domain
     silently keeps pointing at the old branch.

     Each derivation states when it APPLIES, tested against the parent's real
     sample values. Nothing offers "domain" on a ticket number. */
  const DERIVE = {
    domain: { label: 'Domain', hint: 'after the @',
      when: (s) => s.some((v) => String(v).indexOf('@') > 0),
      of: (v) => String(v).split('@')[1] || '' },
    local: { label: 'Name part', hint: 'before the @',
      when: (s) => s.some((v) => String(v).indexOf('@') > 0),
      of: (v) => String(v).split('@')[0] },
    first: { label: 'First word', hint: 'up to the first space',
      when: (s) => s.some((v) => String(v).trim().indexOf(' ') > 0),
      of: (v) => String(v).trim().split(/\s+/)[0] },
    last: { label: 'Last word', hint: 'after the last space',
      when: (s) => s.some((v) => String(v).trim().indexOf(' ') > 0),
      of: (v) => String(v).trim().split(/\s+/).slice(-1)[0] }
  };

  /* What a node actually returns, parent derivations applied. A derived node
     has no path of its own — it is its parent's value, transformed — so its
     samples are the parent's run through the derivation. */
  function nodeSamples(crmId, node, parentSamples) {
    if (node.derive) {
      const d = DERIVE[node.derive];
      if (!d || !parentSamples) return null;
      const out = parentSamples.map(d.of).filter(Boolean);
      return out.length ? out : null;
    }
    return node.path && node.path.length ? samplesFor(crmId, node.path) : null;
  }

  /* ── WHAT MAY HANG UNDER A FIELD ──
     Two different things, and the surface only ever offered one of them.

     A mapped key that lands on an OBJECT has real children in the connector's
     own schema: map Agent to `assignee` and the connector already knows about
     `name`, `email`, `id`, `phone`. Those are subfields in the plainest sense
     and they were unreachable — `derivesFor` needs sample STRINGS, so an
     object returned nothing and the row offered no way down at all.

     A mapped key that lands on a STRING has no children, but it can still be
     cut: the domain out of an email, the last word of a name. Those are
     derivations, and they were the only thing on offer.

     Both are subfields to the person reading. They are one picker, in two
     named groups, because "fields inside requester" and "pieces of this
     value" are different promises and a merged list makes them look alike. */
  const humanKey = (k) => k.replace(/[._-]+/g, ' ')
    .replace(/^./, (ch) => ch.toUpperCase());

  function childKeysFor(crmId, node) {
    if (!node.path || !node.path.length) return [];
    return keysAt(crmId, node.path).map((k) => ({
      key: k,
      label: humanKey(k),
      path: node.path.concat([k]),
      samples: samplesFor(crmId, node.path.concat([k]))
    }));
  }

  /* THREE LEVELS. The design fixes the depth and the model has to agree with
     it: a field, a subfield, and one below that. Deeper than three and the
     indent alone stops carrying the relationship — by the fourth step the
     reader is counting pixels to work out whose child a row is. */
  const MAX_LEVEL = 3;
  const canNest = (depth) => depth + 1 < MAX_LEVEL;

  function subOptions(c, node, parentSamples) {
    return { keys: childKeysFor(c.crmId, node),
             derives: derivesFor(c.crmId, node, parentSamples) };
  }
  const hasSubs = (o) => o.keys.length > 0 || o.derives.length > 0;

  /* Which derivations make sense for what this node returns. */
  function derivesFor(crmId, node, parentSamples) {
    const s = nodeSamples(crmId, node, parentSamples);
    if (!s) return [];
    return Object.keys(DERIVE).filter((k) => DERIVE[k].when(s));
  }

  /* Walk a path against the schema. Returns the node, or the index of the
     segment that broke. A mapping pointing at a key the connector no longer
     exposes is the failure that actually costs answers, and the console has
     no way to show it. */
  function walkPath(crmId, path) {
    let node = { o: SCHEMA[crmId] || {} };
    for (let i = 0; i < path.length; i++) {
      if (!node || !node.o || !(path[i] in node.o)) return { ok: false, at: i };
      const next = node.o[path[i]];
      node = (typeof next === 'string') ? { leaf: next } : next;
    }
    return { ok: true, node: node };
  }
  /* What may follow the path so far. An empty list means the path is complete. */
  const keysAt = (crmId, path) => {
    let node = { o: SCHEMA[crmId] || {} };
    for (const seg of path) {
      if (!node.o || !(seg in node.o)) return [];
      const next = node.o[seg];
      node = (typeof next === 'string') ? { leaf: next } : next;
    }
    return node.o ? Object.keys(node.o) : [];
  };

  /* The context fields AiMY exposes. Fixed vocabulary: the left side of a
     mapping is ours, the right side is theirs. */

  /* ── Auto-match ──
     Nobody should meet an empty mapping table. The system reads the connector's
     schema, proposes a path for every context field it recognises, and marks
     each proposal as SUGGESTED until a person confirms it.

     What it deliberately does NOT do is hide the rest. A suggestion collapses
     nothing: every context field stays on screen with its own state, whether
     it is confirmed, suggested, unmapped or broken. Filtering the screen down
     to "just the uncertain ones" would make the fast path opaque, and the
     whole point of this surface is that you can see what it will do. */
  const MATCH_HINTS = {
    'Agent name':     [['assignee', 'name'], ['agent', 'name']],
    'Email address':  [['requester', 'email'], ['contact', 'email']],
    'Email domain':   [['requester', 'organization', 'domain'], ['contact', 'company', 'domain']],
    'Ticket number':  [['ticket', 'id']],
    'Priority level': [['ticket', 'priority']],
    'Ticket subject': [['ticket', 'subject']],
    'Company name':   [['requester', 'organization', 'name'], ['contact', 'company', 'name']],
    'Created at':     [['ticket', 'created_at']]
  };
  /* Confidence is honest rather than decorative: a proposal only counts as
     strong when the connector actually returns values for it. A path that
     resolves but comes back empty is exactly the case a person must look at. */
  function propose(crmId, ctx) {
    const tries = MATCH_HINTS[ctx] || [];
    for (const path of tries) {
      if (!walkPath(crmId, path).ok) continue;
      const s = samplesFor(crmId, path);
      return { path: path, confidence: s && s.length ? 'strong' : 'weak' };
    }
    return null;
  }

  const CONNECTIONS = [
    { id: 'fb-teamsupport', product: 'FileBound Support', crm: 'TeamSupport', crmId: 'teamsupport',
      health: ['is-ok', 'Healthy'], last: '14 minutes ago', every: 'Every 15 minutes',
      window: 30, records: 22836,
      /* A mapping is a TREE. `kids` are fields whose value comes from inside
         their parent's: the domain lives in the email, so it is a child of the
         email rather than a second path that happens to look related. */
      /* Every shape the table can draw is in here, because a fixture that
         only exercises the easy row is how a surface ships looking finished
         and reads as broken on real data: a plain string, a two-level nest, a
         three-level nest, an id that resolves, and two coded fields whose
         numbers mean nothing until they are named. */
      maps: [
        { ctx: 'Agent name',     path: ['assignee', 'name'] },
        { ctx: 'Assigned agent', path: ['assignee', 'id'], idres: true },
        { ctx: 'Email address',  path: ['requester', 'email'], kids: [
          { ctx: 'Company',      path: ['requester', 'organization', 'name'], kids: [
            { ctx: 'Email domain', path: ['requester', 'organization', 'domain'] } ] } ] },
        { ctx: 'Ticket number',  path: ['ticket', 'id'], idres: true },
        { ctx: 'Ticket status',  path: ['ticket', 'status'],
          values: [['2', 'Open'], ['3', 'Pending'], ['4', 'Solved'], ['5', 'Closed']] },
        { ctx: 'Priority level', path: ['ticket', 'priority'],
          values: [['1', 'Low'], ['2', 'Normal'], ['3', 'High'], ['4', 'Urgent']] }
      ],
      criteria: [['Status', 'Solved'], ['Form', 'Customer Support']],
      range: ['2026-08-01', '2026-08-31'],
      runs: [
        /* Slot 7 is DONE SO FAR, and only a running run has one. Slot 4 has
           always been the run's total — `matchCount` at the moment it started
           — so the pair is "128 of the 412 this run is for", and a finished
           run needs no second number because done and total are the same. */
        ['31 Oct, 15:41', [['Status', 'Closed'], ['Form', 'Sales']], 'run', 'Running', 412, null, null, 128],
        ['31 Oct, 14:14', [['Status', 'Solved'], ['Form', 'Customer Support']], 'ok', 'Succeeded', 1284],
        /* The 6th slot is only on failures. A parallel FAILURES array would
           drift from the runs it describes the first time either was edited —
           the same trap the `SRC` fixture fell into. */
        ['31 Oct, 13:58', [['Status', 'Open'], ['Form', 'Billing']], 'err', 'Failed', 0,
          { code: 'MAP_422_PATH_GONE', fix: 'mapping', affected: 0, runs: 1,
            why: 'Priority level maps to ticket.priority, which TeamSupport returned as null on every record in the window. Nothing was written.' }],
        ['30 Oct, 22:10', [['Status', 'Solved']], 'err', 'Failed', 806,
          { code: 'RATE_429_THROTTLED', fix: 'retry', affected: 806, runs: 2,
            why: 'TeamSupport throttled the pull at 806 of 2,090 records. The run stopped where it was; the rest were never read.' }]
      ] },

    { id: 'fb-freshdesk', product: 'FileBound Support', crm: 'Freshdesk', crmId: 'freshdesk',
      health: ['is-err', 'Token rejected'], last: '26 Jul', every: 'Every hour',
      window: 90, records: 510,
      /* Deliberately broken: `contact.organization` does not exist in Freshdesk,
         whose equivalent is `contact.company`. This is what a renamed field on
         the connector's side looks like from in here. */
      maps: [
        { ctx: 'Agent name',    path: ['agent', 'name'], kids: [
          { ctx: 'Agent surname', derive: 'last' } ] },
        { ctx: 'Email address', path: ['contact', 'email'] },
        /* Deliberately broken and left at the TOP level, so the broken-path
           case is still on screen: `contact.organization` does not exist in
           Freshdesk, whose equivalent is `contact.company`. */
        { ctx: 'Email domain',  path: ['contact', 'organization', 'domain'] }
      ],
      criteria: [['Status', 'Open']],
      runs: [['26 Jul, 09:02', [['Status', 'Open']], 'err', 'Failed', 0,
        { code: 'AUTH_401_TOKEN_EXPIRED', fix: 'reconnect', affected: 0, runs: 14,
          why: 'The token Freshdesk issued on 4 Mar was revoked. Every run since has failed the same way and nothing has been read.' }]] },

    /* ── THE OTHER THREE DATA SOURCES ──
       FileBound Support has read from five things all along — the console's
       source breakdown counts all five — and this fixture held two, because it
       was written when the axis was called CRM and a CRM is what it could
       imagine. A scope level that offers five values and can only answer for
       two is worse than the two-value picker it replaced.

       They are not helpdesks and are not modelled as though they were: a crawl
       has no criteria a person composes, and a folder somebody drops files into
       has neither criteria nor a schedule. Both say so rather than rendering an
       empty ticket form. */
    { id: 'fb-confluence', product: 'FileBound Support', crm: 'Confluence', crmId: 'confluence',
      health: ['is-ok', 'Healthy'], last: '14 minutes ago', every: 'Every 15 minutes',
      window: 30, records: 1814,
      maps: [
        { ctx: 'Article title', path: ['page', 'title'] },
        { ctx: 'Author name',   path: ['author', 'name'], kids: [
          { ctx: 'Author surname', derive: 'last' } ] },
        { ctx: 'Collection',    path: ['page', 'space', 'name'] },
        { ctx: 'Last updated',  path: ['page', 'updated'] }
      ],
      criteria: [['Space', 'Support']],
      range: ['2026-08-01', '2026-08-31'],
      runs: [
        ['31 Oct, 15:38', [['Space', 'Support']], 'ok', 'Succeeded', 1814],
        ['31 Oct, 15:23', [['Space', 'Support']], 'ok', 'Succeeded', 1812],
        ['31 Oct, 15:08', [['Space', 'Legal']], 'ok', 'Succeeded', 96]
      ] },

    { id: 'fb-web', product: 'FileBound Support', crm: 'Website crawl', crmId: 'web',
      health: ['is-err', 'Blocked by robots.txt'], last: '11 Jul', every: 'Weekly',
      window: 90, records: 2215,
      maps: [
        { ctx: 'Article title', path: ['page', 'title'] },
        { ctx: 'Page address',  path: ['page', 'url'] },
        { ctx: 'Summary',       path: ['meta', 'description'] }
      ],
      criteria: [],
      runs: [
        ['18 Jul, 03:00', [], 'err', 'Failed', 0,
          { code: 'CRAWL_403_ROBOTS', fix: 'reconnect', affected: 0, runs: 11,
            why: 'aimy.app/robots.txt started disallowing our crawler on 11 Jul. Every weekly run since has fetched nothing, and the 2,215 pages we hold are the copy from before that date.' }],
        ['11 Jul, 03:00', [], 'ok', 'Succeeded', 2215]
      ] },

    { id: 'fb-upload', product: 'FileBound Support', crm: 'Manual upload', crmId: 'upload',
      health: ['is-ok', 'No schedule'], last: '1 day ago', every: 'On demand',
      window: 180, records: 1617,
      maps: [
        { ctx: 'Article title', path: ['file', 'name'] },
        { ctx: 'Owner name',    path: ['uploader', 'name'] },
        { ctx: 'Owner email',   path: ['uploader', 'email'], kids: [
          { ctx: 'Email domain', derive: 'domain' } ] }
      ],
      criteria: [],
      runs: [
        ['8 Sep, 11:20', [], 'ok', 'Succeeded', 1],
        ['4 Sep, 16:47', [], 'ok', 'Succeeded', 3]
      ] },

    { id: 'ks-teamsupport', product: 'Knowledge Search', crm: 'TeamSupport', crmId: 'teamsupport',
      health: ['is-warn', '3 records skipped'], last: '2 hours ago', every: 'Every 6 hours',
      window: 30, records: 340,
      maps: [{ ctx: 'Ticket subject', path: ['ticket', 'subject'] }],
      criteria: [], runs: [] }
  ];
  const connById = (id) => CONNECTIONS.filter((c) => c.id === id)[0];

  /* ── The product, and the connectors under it ──
     A product is what the client actually calls the thing — FileBound Support.
     It reads from one or more CRMs, and the only thing that genuinely differs
     per CRM is the field mapping, which is why the CRM picker lives inside
     Config and nowhere else. */
  /* ── WHICH CLIENT, AND WHICH OF THEIR PRODUCTS ──
     The scope bar read `Client CXS > FileBound Support` with the client as
     dead text and only the product pickable. That hid a straight
     contradiction: the hierarchy puts FileBound Support under UPLAND, not CXS.
     A scope nobody can change is a scope nobody checks, and this one had been
     wrong on screen the whole time.

     Both are pickers now, and the product list is derived from the client
     rather than from every connection there is — so the pair on screen is
     always a pair that exists. */
  const CLIENT_LIST = nodesOfType('Client');

  /* Every product under one client, from the tree. The tree is the authority
     on what belongs to whom; CONNECTIONS only says which of them we read. */
  function productsOfClient(client) {
    const out = [];
    (function walk(ns, inside) {
      ns.forEach((n) => {
        const here = inside || (n.type === 'Client' && n.name === client);
        if (here && n.type === 'Product') out.push(n.name);
        if (n.kids) walk(n.kids, here);
      });
    })(TREE, false);
    return out;
  }
  /* Only products we actually have a connection for can be configured. The
     rest exist in the hierarchy and have nothing to say on this page. */
  const connectedOf = (client) => productsOfClient(client)
    .filter((p) => CONNECTIONS.some((c) => c.product === p));
  const clientOfProduct = (prod) =>
    CLIENT_LIST.filter((cl) => productsOfClient(cl).indexOf(prod) > -1)[0] || CLIENT_LIST[0];

  /* Default to a client that has something to show, so nobody lands on an
     empty page because the alphabet put an unconfigured client first. */
  /* -- LAND WHERE THE WORK IS --
     The rail row says "3 failed runs" and opening it used to land on the first
     client that had anything connected -- CXS, whose Knowledge Search
     connector has never run at all. So the rail advertised three failures and
     the page it opened showed none of them: the failures are on Upland, one
     client over, and nothing on screen said so.

     A count on a link is a promise about what the link opens. These two now
     read the same model in the same order -- worst first -- so following the
     warning arrives at the warning. An explicit `?sc=` still wins; this only
     decides where you land when you have not said. */
  const troubleOf = (prod) => {
    const list = connsOf(prod);
    return failures().filter((f) => list.indexOf(f.conn) > -1).length
         + list.reduce((a, c) => a + mapCounts(c).broken, 0);
  };
  function clientOf(st) {
    if (CLIENT_LIST.indexOf(st.sc) > -1) return st.sc;
    const connected = CLIENT_LIST.filter((cl) => connectedOf(cl).length);
    const needy = connected.filter((cl) =>
      connectedOf(cl).some((p) => troubleOf(p)))[0];
    return needy || connected[0] || CLIENT_LIST[0];
  }
  const PRODUCT_LIST = CONNECTIONS.map((c) => c.product).filter((v, i, a) => a.indexOf(v) === i);
  const connsOf = (prod) => CONNECTIONS.filter((c) => c.product === prod);
  /* Always a real product. A settings page that will not render until you have
     answered a question is a page with a gate in front of it. */
  /* Scoped to the chosen client. A product from another client in the address
     bar resolves to this client's first rather than rendering a pair that does
     not exist. */
  function prodOf(st) {
    const list = connectedOf(clientOf(st));
    if (list.indexOf(st.sp) > -1) return st.sp;
    return list.filter((p) => troubleOf(p))[0] || list[0];
  }
  function crmOf(st) {
    const list = connsOf(prodOf(st));
    return list.filter((c) => c.crmId === st.crm)[0] || list[0];
  }
  /* The product's primary connector carries the criteria and the run window:
     a sync is triggered for a PRODUCT, and the design says so by disabling the
     product field inside the trigger form rather than offering it again. */
  const primaryOf = (st) => connsOf(prodOf(st))[0];

  /* ── Failures, DERIVED ──
     Read off the runs they describe rather than authored beside them. A
     failure list that disagrees with the history it came from is worse than no
     failure list, and the only way to guarantee it cannot is to not store it. */
  function failures(connId) {
    const out = [];
    CONNECTIONS.filter((c) => !connId || c.id === connId).forEach((c) => {
      c.runs.forEach((r) => {
        if (r[2] !== 'err' || !r[5]) return;
        out.push({ conn: c, when: r[0], criteria: r[1], count: r[4],
                   code: r[5].code, why: r[5].why, fix: r[5].fix,
                   affected: r[5].affected, runs: r[5].runs });
      });
    });
    return out;
  }
  const failCount = (connId) => failures(connId).length;

  /* ── The endpoints ──
     What the console calls "Knowledge Enablement Webhook Settings" is two
     different things wearing one heading: the WORKFLOW (which sources enrich,
     and when) and the CREDENTIALS it runs on. They are split here — enablement
     is a switch you throw, an endpoint is a secret you rotate, and the
     confirmation each deserves is nothing like the other's.

     `last` reuses the runs table's [state, label] shape so `pill()` takes it
     unchanged, and carries three states on purpose: succeeded, failed, and
     never called — a brand new endpoint is not a healthy one. */
  const ENDPOINTS = {
    'fb-teamsupport': { url: 'https://api.aimy.ai/v1/knowledge/filebound-teamsupport',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6', rotated: ['4 Mar 2026', 'A. Mahfouz'],
      last: ['6 Jun 2026, 14:02', 'is-ok', 'Succeeded', '212ms'], calls: 4180 },
    'fb-freshdesk': { url: 'https://api.aimy.ai/v1/knowledge/filebound-freshdesk',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6', rotated: ['4 Mar 2026', 'A. Mahfouz'],
      last: ['26 Jul 2026, 09:02', 'is-err', '401 Unauthorised', '88ms'], calls: 0 },
    'fb-confluence': { url: 'https://api.aimy.ai/v1/knowledge/filebound-confluence',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6', rotated: ['4 Mar 2026', 'A. Mahfouz'],
      last: ['9 Sep 2026, 09:41', 'is-ok', 'Succeeded', '164ms'], calls: 1814 },
    'fb-web': { url: 'https://api.aimy.ai/v1/knowledge/filebound-web',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6', rotated: ['4 Mar 2026', 'A. Mahfouz'],
      last: ['18 Jul 2026, 03:00', 'is-err', '403 Forbidden', '41ms'], calls: 2215 },
    'fb-upload': { url: 'https://api.aimy.ai/v1/knowledge/filebound-upload',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6', rotated: ['12 May 2026', 'N. Wael'],
      last: ['8 Sep 2026, 11:20', 'is-ok', 'Succeeded', '96ms'], calls: 1617 },
    'ks-teamsupport': { url: 'https://api.aimy.ai/v1/knowledge/knowledge-search',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6', rotated: ['12 May 2026', 'N. Wael'],
      last: [null, 'is-mute', 'Never called', ''], calls: 0 }
  };

  /* Everything already in a fixture was authored by a person, so it is
     confirmed. Every context field NOT yet mapped gets a proposal appended, so
     the table always shows the full vocabulary and never an empty page. */
  /* Every node in one connection's tree, depth-first, each with its address
     (`"2"`, `"2.0"`) and its parent. One walk, used by the renderer, the
     counters and the search index — so none of them can disagree about what
     the tree contains. */
  function mapNodes(c) {
    const out = [];
    (function walk(list, prefix, depth, parent) {
      list.forEach((m, i) => {
        const addr = prefix ? prefix + '.' + i : String(i);
        out.push({ m: m, addr: addr, depth: depth, parent: parent });
        if (m.kids && m.kids.length) walk(m.kids, addr, depth + 1, m);
      });
    })(c.maps, '', 0, null);
    return out;
  }
  /* The node at an address, and the list it lives in — deleting needs both. */
  function nodeAt(c, addr) {
    const parts = String(addr).split('.').map(Number);
    let list = c.maps, node = null, parent = null;
    for (let i = 0; i < parts.length; i++) {
      parent = node; node = list[parts[i]];
      if (!node) return null;
      if (i < parts.length - 1) list = node.kids || (node.kids = []);
    }
    return { node: node, list: list, at: parts[parts.length - 1], parent: parent };
  }

  CONNECTIONS.forEach((c) => {
    c.maps.forEach((m) => { m.state = 'confirmed'; (m.kids || []).forEach((k) => { k.state = 'confirmed'; }); });
    /* -- THE LIST IS WHAT SOMEBODY BUILT --
       There was a fixed vocabulary of eight context fields, and every one a
       connection had not mapped was pushed in as an empty row. Two problems,
       and the second is the worse one.

       It filled a fresh connector with eight rows nobody asked for, each
       reading "Not mapped" -- a page of homework presented as a page of
       settings, and none of it necessarily relevant to this product.

       And it decided what a person is allowed to call things. "Agent name"
       and "Company name" are one team's words. A context field is whatever
       this product needs the CRM to answer, and the only one who knows that
       is the person configuring it.

       So nothing is pushed. What is in the list is what somebody put there,
       and an empty connector says so in one sentence instead of eight rows. */
  });

  /* Counted over the whole tree, because a broken subfield is exactly as
     broken as a broken top-level field and hiding it in the total would be the
     one place this table is allowed to lie. */
  const mapCounts = (c) => {
    const all = mapNodes(c).map((n) => n.m);
    return {
      confirmed: all.filter((m) => m.state === 'confirmed').length,
      suggested: all.filter((m) => m.state === 'suggested').length,
      unmapped:  all.filter((m) => m.state === 'unmapped').length,
      broken:    all.filter((m) => !m.derive && m.path && m.path.length
                                   && !walkPath(c.crmId, m.path).ok).length,
      total:     all.length
    };
  };

  /* Match count. Every criterion narrows, so the number falls as you add one.
     Deterministic from the criteria themselves, because a figure that moved on
     its own would be worse than no figure. */
  /* ANY genuinely selects more than ALL, and the figure has to move or the
     control is decoration. Intersecting filters narrow; a union of the same
     filters widens toward the sum of their individual shares. */
  /* The history's own date format, so a run written now sits in the same
     column as the ones that came with the fixture. */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  function stampNow() {
    const d = new Date();
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ', '
         + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  /* "1 Oct - 31 Oct", or one end of it when only one is set. An ISO pair in a
     chip is a date a person has to decode. */
  function rangeLabel(r) {
    const one = (v) => {
      if (!v) return '';
      const p = String(v).split('-');
      if (p.length !== 3) return v;
      return String(+p[2]) + ' ' + (MONTHS[+p[1] - 1] || p[1]);
    };
    if (r[0] && r[1]) return one(r[0]) + ' \u2013 ' + one(r[1]);
    return r[0] ? 'from ' + one(r[0]) : 'up to ' + one(r[1]);
  }

  /* ══════════════════════════════════════════════════════════════════════
     THE DATE RANGE, IN OUR OWN CALENDAR

     Both ends were `<input type="date">`. The browser draws that control
     itself, in its own colours, at its own size, in the OS's locale — so on a
     dark settings page it opened a white sheet reading `08/01/2026` in
     month-first order, which is the one date format this product uses nowhere
     else. It was also the only control on the surface whose look nobody here
     could change.

     `.cal` is the design system's month calendar and it is used unchanged:
     head with two nav buttons, seven-column grid, `.muted` / `.today` /
     `.selected`. The RANGE states — `in-range`, `range-start`, `range-end` —
     are the product extension knowledge.js already added for the corpus date
     filter and recorded in GAPS.md; this is the second consumer of them, not a
     second copy.

     WHY NOT REUSE knowledge.js's WHOLE CALENDAR. Its model is days-before-
     today: every date it handles is an offset, it refuses the future because
     nothing in the corpus has one, and it writes a filter key. A sync range is
     two absolute dates with neither of those properties. Sharing the CSS is
     sharing what is genuinely the same; sharing the controller would mean
     bending one model around the other.

     ONE COMPONENT, NOT TWO PICKERS. It was two boxes, each opening this same
     panel "for its end" — and the panel drew the whole range regardless, so it
     was neither two date pickers nor one range picker. It was one range picker
     wearing two triggers, which meant the thing on screen could not tell you
     what it was: a range highlighted across a month, opened from a box that
     claimed to own one end of it.

     A range is one value. So it is one trigger, one panel, and two clicks: the
     first sets an end, the second closes the range. And because the component
     owns both ends, it ORDERS them — click the later day first and it is still
     a range that runs forwards. A backwards range is not an error to be caught
     here, it is a state this control can no longer express. */
  let calOpen = false;    /* is the picker showing */
  let calPick = null;     /* an end chosen, waiting for its partner */
  let calMonth = null;    /* the month on show, as a UTC first-of-month */

  const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const CAL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const isoOf = (d) => d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
  const dayOf = (v) => (v ? new Date(v + 'T00:00:00Z') : null);
  /* "1 Aug 2026". The trigger shows a date a person reads, not an ISO string
     and not the platform's `mm/dd/yyyy`. */
  const fmtDay = (v) => {
    const d = dayOf(v);
    return d ? d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear() : '';
  };

  function calPanel(r) {
    /* Open on the range's own month, else today. Landing on today when the
       range is in March is a month of clicking. */
    const anchor = dayOf(calPick) || dayOf(r[0]) || dayOf(r[1]) || new Date();
    const view = calMonth
      || new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
    const y = view.getUTCFullYear(), mo = view.getUTCMonth();
    const lead = new Date(Date.UTC(y, mo, 1)).getUTCDay();
    const days = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    const prev = new Date(Date.UTC(y, mo, 0)).getUTCDate();

    const cells = [];
    for (let i = lead - 1; i >= 0; i--) cells.push({ n: prev - i, muted: true, d: new Date(Date.UTC(y, mo - 1, prev - i)) });
    for (let i = 1; i <= days; i++) cells.push({ n: i, muted: false, d: new Date(Date.UTC(y, mo, i)) });
    while (cells.length % 7) { const i = cells.length - lead - days + 1; cells.push({ n: i, muted: true, d: new Date(Date.UTC(y, mo + 1, i)) }); }

    const today = isoOf(new Date());
    /* Mid-pick the range on show is the one end chosen so far, not the one
       stored — otherwise the panel goes on drawing the range you are in the
       middle of replacing. */
    const a = calPick || r[0], b = calPick ? '' : r[1];
    return `<div class="cal set2-cal" role="dialog" aria-label="Choose a date">
      <div class="cal-head">
        <button class="cal-nav" type="button" data-scal-nav="-1" aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
        <div class="cal-title">${esc(CAL_MONTHS[mo])} ${y}</div>
        <button class="cal-nav" type="button" data-scal-nav="1" aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
      </div>
      <div class="cal-grid">
        ${DOW.map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells.map((c) => {
          const v = isoOf(c.d);
          const isA = !!a && v === a, isB = !!b && v === b;
          const between = !!a && !!b && v > a && v < b;
          const cls = ['cal-day']
            .concat(c.muted ? ['muted'] : [])
            .concat(v === today ? ['today'] : [])
            .concat(isA || isB ? ['selected'] : [])
            .concat(isA && a !== b && b ? ['range-start'] : [])
            .concat(isB && a !== b && a ? ['range-end'] : [])
            .concat(between ? ['in-range'] : []);
          return `<button class="${cls.join(' ')}" type="button"
            data-scal-day="${v}" aria-label="${esc(fmtDay(v))}">${c.n}</button>`;
        }).join('')}
      </div>
      <div class="cal-foot">
        <span class="cal-hint">${calPick
          ? 'Now pick the other end.'
          : 'Pick two dates.'}</span>
        ${r[0] || r[1] || calPick
          ? '<button class="set2-lnk" type="button" data-scal-clear>Clear</button>' : ''}
      </div>
    </div>`;
  }

  function matchCount(c) {
    if (!c.criteria.length) return c.records;
    const share = c.criteria.map((k, i) => (i === 0 ? 0.42 : 0.61));
    if ((c.join || 'all') === 'all') {
      return Math.floor(c.records * share.reduce((a, b) => a * b, 1));
    }
    /* Union by inclusion-exclusion on independent shares: 1 - product of the
       complements. Always at least as large as the intersection. */
    const none = share.reduce((a, s) => a * (1 - s), 1);
    return Math.floor(c.records * (1 - none));
  }

  const CRITERIA_VOCAB = {
    Status: ['Open', 'Pending', 'Solved', 'Closed'],
    Form: ['Customer Support', 'Billing', 'Sales', 'Onboarding'],
    Priority: ['Low', 'Normal', 'High', 'Urgent'],
    Brand: ['FileBound', 'InterFAX', 'Kapost']
  };

  /* ═══ THE OTHER MODULES ═══
     The `SRC` connector fixture that used to live here went with the sync
     module when field mapping and sync folded into one connection contract.
     It survived the merge unreferenced for a while, which is how a fixture
     starts disagreeing with the thing it once described. */

  /* Five, not three. A card grid never shows its wrap at three and the filters
     have nothing to filter, so the surface reads as finished when it is not. */
  const PEOPLE = [
    /* ── A GRANT IS A ROLE AND THE CLIENTS IT APPLIES TO ──
       It carried a scope TYPE as well — Organisation, Business Unit, Product,
       Team — and the picker walked role, then type, then values. Production
       does neither: you choose a role, then multi-select the clients it
       applies to. Two steps, one type.

       So `t` is always 'Client'. The field STAYS rather than being deleted,
       because the tenancy tree still has six levels and skills still target
       all of them — what collapsed is what a GRANT may name, not the
       hierarchy. Keeping the key leaves `covers()` and everything reading it
       untouched, and a second grantable type stays a fixture edit rather than
       a migration.

       The fixture moves with it. The two Product grants become grants on the
       client owning those products, and Mahfouz's organisation-wide Admin
       becomes Admin on every client, which is what it always meant. */
    { id: 'p1', name: 'Alex Smith', mail: 'alex.smith@flairstech.com', title: 'Solution Engineer',
      s: ['is-ok', 'Active'], admin: true,
      grants: [{ r: 'Super Admin', t: 'Client', v: ['Upland'] },
               { r: 'QA Manager', t: 'Client', v: ['CXS'] }] },
    { id: 'p2', name: 'Saly Tarek', mail: 'saly.tarek@flairstech.com', title: 'Support Lead',
      s: ['is-warn', 'Invite pending'], grants: [] },
    { id: 'p3', name: 'A. Mahfouz', mail: 'a.mahfouz@flairstech.com', title: 'Head of Delivery',
      s: ['is-ok', 'Active'], admin: true,
      grants: [{ r: 'Admin', t: 'Client', v: ['CXS', 'Upland', 'MedFar'] }] },
    { id: 'p4', name: 'Nour Wael', mail: 'nour.wael@flairstech.com', title: 'Product Design',
      s: ['is-ok', 'Active'],
      grants: [{ r: 'Contributor', t: 'Client', v: ['Upland'] },
               { r: 'Read Only', t: 'Client', v: ['CXS'] }] },
    { id: 'p5', name: 'Karim Fouad', mail: 'karim.fouad@upland.com', title: 'QA Manager · Upland',
      s: ['is-ok', 'Active'],
      grants: [{ r: 'QA Manager', t: 'Client', v: ['Upland'] }] }
  ];
  /* ── WHO IS SIGNED IN ──
     The header's face says NW, so the console is being read as Nour Wael.
     "What you sell" is this person's list and nobody else's: a seller chooses
     what they sell, and no page here sets it for somebody else. Kept on the
     person, because it is a fact about them the way their grants are. */
  const ME_ID = 'p4';
  const me = () => PEOPLE.filter((p) => p.id === ME_ID)[0];
  const mySells = () => { const p = me(); if (p && !p.sells) p.sells = []; return p ? p.sells : []; };

  /* ══ WHAT WE SELL ══════════════════════════════════════════════════════
     The catalogue a seller chooses from, and the only thing they can choose:
     nothing on the Selling page is typed, because every entry is a node the
     knowledge graph points at and a free-written "QA stuff" would be an edge
     to nowhere. The eight AiMY Sales sells, with its ids (`SELLS` in
     Sales/assets/bdr.js), so a choice made here names the same thing there.
     A demo: nothing carries it across yet. */
  const OFFERINGS = [
    { id: 'voice',   name: 'AiMY Voice',               kind: 'Product',
      d: 'an AI voice agent that answers, qualifies and books' },
    { id: 'qa',      name: 'AiMY QA',                  kind: 'Product',
      d: 'quality scored on every conversation, not on a sample' },
    { id: 'know',    name: 'AiMY Knowledge',           kind: 'Product',
      d: 'one answer surface over documentation nobody can find' },
    { id: 'support', name: 'Managed customer support', kind: 'Service',
      d: 'a support team we run for you, in your tone of voice' },
    { id: 'test',    name: 'QA and test automation',   kind: 'Service',
      d: 'a test suite, and the engineers who keep it green' },
    { id: 'eng',     name: 'Engineering teams',        kind: 'Service',
      d: 'engineers embedded in your team, on EU hours' },
    { id: 'data',    name: 'Data annotation',          kind: 'Service',
      d: 'labelled data at volume, with an accuracy guarantee' },
    { id: 'back',    name: 'Finance and back office',  kind: 'Service',
      d: 'invoicing, reconciliation and reporting, run for you' }
  ];
  const offeringById = (id) => OFFERINGS.filter((o) => o.id === id)[0];
  /* The scope pickers read the SAME tree the targeting picker does, so a grant
     can never name a scope the hierarchy does not have. */
  const SCOPE_TYPES = ['Client', 'Business Unit', 'Product', 'Team'];
  function nodesOfType(t) {
    const out = [];
    (function walk(ns) { ns.forEach((n) => { if (n.type === t) out.push(n.name);
      if (n.kids) walk(n.kids); }); })(TREE);
    return out;
  }
  const initialsOf = (n) => n.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const ROLES = [
    ['Super Admin', 'Everything, on every scope it is granted for'],
    ['Admin', 'Manage skills, sources and people. Cannot change billing'],
    ['Manager', 'Manage skills and sources on their own scope'],
    ['QA Manager', 'Read everything, write reviews'],
    ['Contributor', 'Add and edit their own skills'],
    ['Read Only', 'Read. Nothing else']
  ];

  const AGENTS = [
    { id: 'copilot', name: 'Copilot', d: 'Internal support agent. 4 skills, 2 collections.', on: true },
    { id: 'sales', name: 'Sales', d: 'Internal. 2 skills, 1 collection.', on: true },
    { id: 'voice', name: 'Voice', d: 'Client-facing. 1 skill, 1 collection.', on: false }
  ];

  const COLS = [
    { id: 'policies', name: 'Policies', d: 'Owned by A. Mahfouz · 1,204 documents', on: true },
    { id: 'support', name: 'Support', d: 'Owned by N. Wael · 118 documents', on: true },
    { id: 'sales', name: 'Sales', d: 'Owned by Sales Ops · 340 documents', on: false },
    { id: 'legal', name: 'Legal', d: 'Owned by Legal · not entitled to your plan', on: false, locked: true }
  ];

  /* ═══ MODULES ═══
     `tier` is what the workspace is entitled to. Unowned modules stay in the
     rail and render at full contrast with dead controls, because a module you
     cannot read is a module you will never buy. */
  /* ── Grouped by WHO DOES THE WORK ──
     The previous build split by what a thing IS (AI Controls / Organization /
     Operations) and rejected the console's Personal | Workspace Admin split on
     the grounds that it forces every capability to exist twice. That objection
     still stands and this does not reopen it: Client and Admin is not the same
     capability under two owners — no module appears in both groups. It is the
     same WHAT split, ordered by whose job it is, which is the question someone
     opening settings is actually asking.

     `scope: 'conn'` marks the five facets of one connection. They are separate
     rail items because the brief asks for them separately, but they share one
     scope key (`?conn=`) so moving between them never silently re-points you at
     a different connector — which was the whole of the earlier objection to
     splitting mapping from sync, and it is answered by the scope, not by the
     merge.

     `off` keeps a module routable and in the search index while taking it out
     of the rail. That is what "defer, do not delete" means mechanically. */
  const MODULES = [
    /* ── WHY THIS IS THREE ITEMS AND NOT FIVE ──
       Failures and APIs were rail items of their own and neither earned one.

       A FAILURE IS A SYNC RUN. It is the same row of the same history table,
       read a second time on a second page — and the page that could act on it
       was the one you had just left. Sync now tells the whole story in the
       order it happens: what to pull, over what window, what broke, what
       happened, and what gets pruned afterwards.

       AN ENDPOINT IS WHAT ENABLEMENT RUNS ON. Splitting the switch from the
       secret gave two pages that are meaningless apart: the toggles do nothing
       without a live endpoint, and the endpoint exists only to serve them. The
       design has them under one heading and the design is right.

       Both ids still resolve, through ALIAS. */
    { g: 'Client', id: 'config',    name: 'Connections',          scope: 'prod' },
    /* ── WEBHOOK SETTINGS, PROMOTED ────────────────────────────────────
       "Webhooks", not "Webhook settings": measured in the rail, the longer
       name wanted 125px of a 107px slot and ellipsised at every width — the
       same defect that shortened "Knowledge enablement" to "Enablement" when
       this row was a group. The settings ARE the page, so the noun alone says
       it.

       This was "Enablement", a group holding two pages. One of them was
       Enrichment and it was removed; a heading over a single child is a level
       of tree that answers nothing, so the group is dissolved and its one page
       stands here beside Connections — which is where an endpoint belongs
       anyway, since it is the client's connection to AiMY.

       It carries its own `state`, which a grouped module never needed: the
       parent derived its note from the pages under it. With no pages under it
       the row IS the page, so the state comes with it, and navRow renders its
       quick action the way a page row always has. `?m=enable` still resolves,
       through ALIAS. */
    { g: 'Client', id: 'webhooks',  name: 'Webhooks',             scope: 'prod',
      state: function (st) {
        var list = connsOf(prodOf(st)).filter(function (c) { return !!ENDPOINTS[c.id]; });
        var cls = function (c) { return ENDPOINTS[c.id].last[1]; };
        var bad = list.filter(function (c) { return cls(c) === 'is-err'; }).length;
        var warn = list.filter(function (c) { return cls(c) === 'is-warn'; }).length;
        if (bad) return { note: bad + ' endpoint' + (bad > 1 ? 's' : '') + ' down', s: 'err',
          fix: fixTo('Reconnect ' + bad + ' endpoint' + (bad > 1 ? 's' : ''),
                     '', '.set2-wh-grp.is-err') };
        if (warn) return { note: warn + ' degraded', s: 'warn',
          fix: fixTo('Check ' + warn + ' endpoint' + (warn > 1 ? 's' : ''),
                     '', '.set2-wh-grp.is-warn') };
        return { note: list.length ? list.length + ' live' : 'none set up',
                 s: list.length ? 'ok' : '' };
      } },

    { g: 'Admin',  id: 'access',    name: 'User & access', wide: true },
    /* `wide`, because the library and the document are two columns and the
       46rem measure that suits a settings ROW gives each of them about 20rem —
       a nav that truncates every name and a document set narrower than the
       prose it holds. Same reason User & access carries it. */
    { g: 'Admin',  id: 'skills',    name: 'Skills', wide: true },

    /* Deferred: reachable by URL and findable in the palette, absent from the
       rail. Not deleted — that is the difference between deferring a module and
       dropping it. */
    { g: 'Admin',  id: 'agents',    name: 'Agents and tools', off: true },
    { g: 'Admin',  id: 'grounding', name: 'Grounding', off: true },
    { g: 'Admin',  id: 'plan',      name: 'Entitlements and plan', off: true },
    { g: 'Admin',  id: 'audit',     name: 'Audit trail', tier: 'Enterprise', off: true }
  ];
  const GROUPS = ['Client', 'Admin'];

  /* ── Old ids, carried across rather than 404ed ──
     Every `settings.html?m=…` that has been pasted anywhere comes through here.
     Four of them name things that are now SECTIONS rather than destinations, so
     they resolve to the module that holds the section — `?m=retention` lands on
     Sync, where the threshold sits beside the runs it prunes. Landing on the
     page that contains what you asked for beats landing on a page that no
     longer exists. */
  const ALIAS = { connections: 'config', people: 'access', enable: 'webhooks',
                  apis: 'webhooks', failures: 'config', sync: 'config',
                  retention: 'config', roles: 'access', hierarchy: 'access' };
  /* Several of those name a SECTION, and sections are pages now — so the ones
     that do land on the page holding them rather than on the module's first.
     `?m=retention` used to mean "Sync, scroll to find it"; it means the page
     the threshold is on. */
  /* `webhooks` and `apis` are gone from here: they used to name a SECTION
     inside Enablement and now name the module itself, which has no sections to
     choose between. */
  const ALIAS_SEC = { failures: 'sync',
                      sync: 'sync', retention: 'relevance', people: 'people',
                      roles: 'roles', hierarchy: 'scopes' };
  const aliasOf = (id) => ALIAS[id] || id;
  const moduleById = (id) => MODULES.filter((m) => m.id === aliasOf(id))[0];

  /* ═══ STATE — THE CONSOLE OWNS IT ═══
     This file used to read the address bar and write it back, rebuilding the
     query string from scratch. On a page of its own that was correct. Sharing
     a page with the corpus it is not: the corpus owns twenty-eight keys and
     this rebuild knew four, so every filter you had set survived exactly until
     you opened a module — and the loss was silent, which is the worst way for
     a URL to be wrong.

     So there is one reader and one writer, both in knowledge.js, and this file
     asks. Every `patch({ ... })` call site below is untouched; only where the
     function comes from has moved. The fallback state exists so a render that
     somehow arrives before `init` cannot throw — it renders Skills. */
  /* ── The in-module filter set ──
     `f=role:Admin,status:Active` in, an object out. Values are stored raw and
     read back with `decodeURIComponent`, so a role called "Read Only" survives
     the round trip and a value containing a comma cannot split the set. */
  function readF(st) {
    const out = {};
    (st.f || '').split(',').filter(Boolean).forEach((pair) => {
      const i = pair.indexOf(':');
      if (i > 0) out[pair.slice(0, i)] = pair.slice(i + 1);
    });
    return out;
  }
  /* Values are stored RAW. `serialize` percent-encodes the whole query string
     and then puts commas and colons back as themselves, so encoding here too
     turned every space into `%2520`. The two separators are the only reserved
     characters and no role, status or scope type contains one; a free-text
     search does, which is why `q` strips them rather than escaping them. */
  function withF(st, key, val) {
    const f = readF(st);
    const clean = String(val == null ? '' : val).replace(/[,:]/g, ' ').trim();
    if (!clean || f[key] === clean) delete f[key]; else f[key] = clean;
    return Object.keys(f).map((k) => k + ':' + f[k]).join(',');
  }
  /* One dropdown. `all` is the absence of the key, never a value of it, so a
     filter set with nothing chosen serialises to nothing at all. */
  /* ── THE SYSTEM'S DROPDOWN, NOT A NATIVE SELECT ──
     These were bare `<select>` elements under a chevron drawn on top. A native
     select renders its list with the OS, so it ignored every token this
     surface is built from: the panel came up in the platform's colours, at the
     platform's metrics, in whichever theme the platform was in rather than the
     one the page is in. Three of them sat beside a `.v2-dropdown` that the
     design system calls its only select control, which the day pickers two
     pages over already use.

     Same component here, and the same `set2-dd` marker so it is placed and
     read by the machinery that is already listening — `dd:change`, because a
     listbox has no `value` and fires no `input`. */
  function filterSel(st, key, label, opts) {
    const f = readF(st);
    const cur = f[key] || '';
    return `
      <div class="v2-dropdown set2-dd set2-fsel" data-fdd="${esc(key)}">
        <button class="v2-dropdown-btn${cur ? ' active-filter' : ''}" type="button"
                aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(label)}">
          <span class="dd-label-text">${esc(cur || label)}</span>
          ${I.down}
        </button>
        <div class="v2-dropdown-panel" role="listbox">
          ${/* "Any role" rather than a blank row: an option that clears the
                filter has to say what it leaves you with. */ ''}
          <div class="v2-dropdown-option${cur ? '' : ' selected'}" role="option"
               aria-selected="${!cur}" data-value="">Any ${esc(label.toLowerCase())}</div>
          ${opts.map((o) => `<div class="v2-dropdown-option${o === cur ? ' selected' : ''}"
            role="option" aria-selected="${o === cur}" data-value="${esc(o)}">${esc(o)}</div>`).join('')}
        </div>
      </div>`;
  }

  let FQ_T = 0;
  let API = null;
  const FALLBACK = { m: 'config', skill: '', sp: '', crm: '', f: '' };
  function readURL() { return API ? API.readURL() : FALLBACK; }
  function patch(changes) { if (API) API.patch(changes); }
  /* `then` runs once the repaint has actually landed. Most render() calls here
     change module state rather than the URL, so knowledge.js paints them
     synchronously and `then` is only a tidier way to write the next line - but
     the five call sites that read back an element the repaint just built are
     the ones that would break silently the day any of them starts moving
     through a transition, and they should not have to know which. */
  function render(then) {
    if (API) API.render();
    if (!then) return;
    const M = window.AIMY_MOTION;
    if (M && M.afterPaint) M.afterPaint(then); else setTimeout(then, 0);
  }

  /* ── A SWITCH HAS TO SURVIVE ITS OWN ANIMATION ──

     .toggle-thumb has carried `transition: transform var(--t-fast)` since the
     library shipped it, and it had never once run. render() rewrites the
     markup, so the thumb that would have travelled is destroyed and a new one
     appears already at the far end — a transition from nothing to nothing.
     Measured before this: one frame after the click, the input, the thumb and
     the row are all different nodes.

     The model is written immediately; the PAINT waits for the thumb to
     arrive. transitionend is the real signal and the timeout is the fallback,
     because a paint that never comes is a list that never updates — worse
     than one that updates late. Reduced motion skips the wait outright: there
     is no animation to wait for, and AIMY_MOTION already owns that question
     for the rest of the build. */
  function afterSwitch(input, then) {
    const M = window.AIMY_MOTION;
    const thumb = input.parentElement && input.parentElement.querySelector('.toggle-thumb');
    if (!thumb || (M && M.reduced && M.reduced())) { then(); return; }
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      thumb.removeEventListener('transitionend', go);
      then();
    };
    thumb.addEventListener('transitionend', go);
    setTimeout(go, 320);   /* --t-fast is 150ms; this is it doubled and rounded */
  }

  /* ═══ ATOMS ═══ */
  const pill = (k, t) => `<span class="set2-pill ${k}"><i></i>${esc(t)}</span>`;
  const ck = (st, label) =>
    `<button class="set2-ck" role="checkbox" aria-checked="${st}" aria-label="${esc(label)}" type="button" tabindex="-1">${st === 'mixed' ? I.dash : I.tick}</button>`;
  /* `locked` is a REASON, not a boolean: a control you cannot use has to say
     why, and the sentence becomes the title so it reaches a pointer and a
     screen reader. A disabled input fires no change event, so the handler
     below needs no guard of its own. */
  const toggle = (on, label, data, locked) => `
    <label class="toggle${locked ? ' is-locked' : ''}" title="${esc(locked || label)}">
      <input type="checkbox" ${on ? 'checked' : ''} ${locked ? 'disabled' : ''}
             aria-label="${esc(label)}" ${data || ''}>
      <span class="toggle-track"></span><span class="toggle-thumb"></span>
    </label>`;

  function row(o) {
    const tag = o.go ? 'button' : 'div';
    return `<${tag} class="set2-row${o.off ? ' is-off' : ''}${o.locked ? ' is-locked' : ''}"
      ${o.go ? `type="button" data-go="${esc(o.go)}"` : ''}>
      ${o.ico || ''}
      <span class="set2-row-main">
        <span class="set2-row-n">${esc(o.name)}${o.tagHtml || ''}</span>
        ${o.d ? `<span class="set2-row-d">${esc(o.d)}</span>` : ''}
      </span>
      <span class="set2-row-end">${o.end || ''}${o.locked ? I.lock : ''}${o.go ? I.chev : ''}</span>
    </${tag}>`;
  }

  /* ── THE TREE TARGETING PICKER IS GONE, AND SO IS ITS MACHINERY ──
     `walk()`, `nodeState()`, `picker()`, `productsOf()`, `repaintPicker()`,
     `toggleNode()`, `SEL` and both tree keyboard handlers stood between here
     and there. All of it rendered and drove one control: a six-level
     selectable tree over the tenancy, for choosing what a skill reached.

     Reach is AGENTS and PRODUCTS now, and neither is a level of that tree — so
     the picker could not express what a skill targets, and it offered five
     levels a skill can no longer name. The Overview card edits the two lists
     directly.

     Removed rather than left standing: every one of them referenced something
     the others owned, so the first call into any of them would have thrown. */

  /* ═══ MODULE BODIES ═══ */
  const M = {};

  /* `PRODUCTS()` and `productsOf()` stood here. Both derived a skill's products
     from the tenancy tree; a skill carries its own `products` list now, from
     the domains production actually offers. */

  /* ══ SKILLS ════════════════════════════════════════════════════════════
     THE PRODUCTION TOOLBAR, AND CLAUDE'S DOCUMENT.

     Two references, and they answer different halves.

     PRODUCTION owns the LIST: `All agents` and `All products` beside a name
     search, `Download example` and `New Skill` on the right, and a sortable
     Name / Description / Status table under it. That is what a skill is
     filtered by in the real console, so it is what the list does here.

     CLAUDE owns the DOCUMENT: a back link, the name with its author under it,
     an enable toggle and an overflow at the right, and two tabs — `Overview`
     and `Contents · n`. Overview is the description on the left with a card on
     the right saying how the skill fires; Contents is the file itself with a
     rendered/source toggle in its corner.

     ── WHAT REPLACED WHAT ──
     The build before this was a two-pane library whose left column expanded
     into PARTS: Instructions, Precedence, Reach. Three of those clicks existed
     to reach three facts, and two of the facts are one line each. Claude's
     answer is better and simpler: everything about the skill except its text
     is in Overview, and the text is Contents.

     ── REACH IS AGENTS × PRODUCTS ──
     It was a six-level tree picker over the tenancy — clients, business units,
     products, teams, individual users. Production targets two things: which
     AGENT runs the skill and which PRODUCT it belongs to, and its products are
     knowledge domains (General, Support, Sales, Dev, UI…) rather than the
     tenancy's products. Two multi-selects, and the tree stops being involved.

     ── AND PRECEDENCE IS ON NOTICE ──
     Production has no chain, no lens, no override. The six-level ladder in
     this file was authored here and is the one thing on the surface no
     competitor has, so it survives as a third tab rather than being deleted in
     passing — but it now describes a hierarchy that reach no longer uses, and
     that is a contradiction somebody has to settle rather than inherit.
     ══════════════════════════════════════════════════════════════════════ */

  /* Production's own list, from the console screenshot. These are knowledge
     domains, not the tenancy products the Scopes map draws. */
  const SKILL_PRODUCTS = ['General', 'Support', 'Sales', 'Recruitments',
                          'Dev', 'UI', 'cxs_calls_kpis'];

  /* TWO TABS. Precedence was a third, and on five skills out of six it opened
     on the sentence "there is nothing to resolve" — a destination whose usual
     content is a denial that it has any. What it had to say when a name IS
     contested is worth saying, so it moved into Overview and appears only when
     there is a collision to explain. */
  const TABS = [['overview', 'Overview'], ['contents', 'Contents']];
  const tabOf = (st) => (TABS.some((t) => t[0] === st.part) ? st.part : 'overview');

  const agentName = (id) => ((AGENTS.filter((a) => a.id === id)[0] || {}).name || id);

  function standing2(s) {
    if (!s.on) return ['is-mute', 'Disabled'];
    /* Overridden outranks a broken reach, because it is the reason the skill
       is not running: fixing its agents would change nothing while the
       organisation's version is answering to the same name. */
    if (shadowedBy(s)) return ['is-warn', 'Overridden'];
    if (!(s.agents || []).length) return ['is-err', 'No agent'];
    if (!(s.products || []).length) return ['is-err', 'No product'];
    return ['is-ok', 'Enabled'];
  }

  const SORTS = {
    name:   (a, b) => a.name.localeCompare(b.name),
    desc:   (a, b) => a.desc.localeCompare(b.desc),
    status: (a, b) => standing2(a)[1].localeCompare(standing2(b)[1])
  };

  /* Production marks all three columns sortable, so all three sort. Three
     states — ascending, descending, and back to the authored order, which is
     the one a two-state toggle can never return you to. */
  function sortTh(st, key, label) {
    const f = readF(st);
    const on = f.sort === key || f.sort === key + '!';
    const desc = f.sort === key + '!';
    return `<button class="set2-th" type="button" data-sort="${esc(key)}"
      aria-sort="${on ? (desc ? 'descending' : 'ascending') : 'none'}">
      ${esc(label)}<span class="set2-th-a${on ? ' is-on' : ''}">${
        on ? (desc ? I.sortDown : I.sortUp) : I.sortNone}</span>
    </button>`;
  }

  function skillsMatching(st) {
    const f = readF(st);
    const q = (f.q || '').toLowerCase();
    return SKILLS.filter((s) => {
      if (q && (s.name + ' ' + s.desc).toLowerCase().indexOf(q) < 0) return false;
      if (f.agent && (s.agents || []).map(agentName).indexOf(f.agent) < 0) return false;
      if (f.product && (s.products || []).indexOf(f.product) < 0) return false;
      return true;
    });
  }

  M.skills = function (st) {
    const cur = SKILLS.filter((s) => s.id === st.skill)[0];
    return cur ? skillDoc(cur, st, tabOf(st)) : skillList(st);
  };

  /* ── The list ──
     Production's toolbar exactly: the two filters first because they narrow to
     a set, then the name search which finds one inside it, then the two
     actions.

     Under it the rows are SPLIT BY OWNER rather than left in one run. Whose a
     skill is decides whether it runs when two answer to the same name, so it
     is not a fourth column to be sorted by — it is the shape of the list. Two
     headers is O(2), so the rule that keeps every page off O(records) is
     untouched, and the note stating the override rule finally has a place that
     is next to the skills it applies to. */
  const OWNER_TABS = [
    ['org', 'Organization',
     'Set by ' + ORG + '. Everyone on the tenancy has these, and they override a '
     + 'personal skill that answers to the same name.'],
    ['you', 'Yours',
     'Only you have these. ' + ORG + '’s skills override yours when the two answer to '
     + 'the same name — yours is kept and stays editable, it just does not run.']
  ];
  const ownOf = (st) => (readF(st).own === 'you' ? 'you' : 'org');

  /* ── EXPLANATION MOVED OFF THE PAGE AND ONTO ITS HEADING ──
     The rule about who overrides whom was a paragraph under the tab row and a
     second one inside Precedence. Both were true and neither was news after
     the first read: a sentence you have to scroll past on every visit to a
     screen you use daily is a cost paid forever for a fact learned once.

     It becomes an info glyph beside the heading it explains. The text is still
     there for the reader who wants it, on hover and on keyboard focus, and it
     is `aria-describedby` so it reaches a screen reader without hovering.

     Reuses `.set2-tip-wrap` / `.set2-tip-b` / `.set2-tip`, already carrying
     the same job on the Add user sheet — one help affordance in this file. */
  const tip = (id, about, text) => `
    <span class="set2-tip-wrap">
      <button class="set2-tip-b" type="button" aria-describedby="${esc(id)}"
              aria-label="About ${esc(about)}">${I.info}</button>
      <span class="set2-tip is-below" role="tooltip" id="${esc(id)}">${esc(text)}</span>
    </span>`;

  /* ── THE ROW STOPPED BEING ONE BUTTON ──

     The note in settings.css says this list is "grid rather than <table> so
     the row can be one <button>: the whole row is the destination". That held
     while the row was only a destination. It carries a CONTROL now, and a
     control cannot live inside a button — nested interactive content is
     invalid, and the outer button would take the click and drill down while
     you were trying to flip the switch.

     So the target moves onto the words, which is the alternative that same
     note names. Nothing is lost by eye: .set2-tbl-r:has(.set2-tbl-go:hover)
     lights the whole row, so it still reads as one object.

     ── AND THE PILL SAYS ONLY WHAT THE SWITCH CANNOT ──

     standing2 returns five states and the switch carries two of them.
     Disabled and Enabled ARE the switch, so a pill beside it repeating them
     is the same fact twice. The other three — Overridden, No agent, No
     product — are reasons a skill you switched ON still is not running, and
     no switch can say those. They keep the pill, and it appears only where
     it is the only thing that can speak.

     The chevron goes with the whole-row button that used to justify it. */
  /* ── A ROW, NOT A TABLE ROW ──

     Three columns meant the description was a CELL, capped at two lines and
     sharing its width with a name that had to fit on one. Under the name it
     has the row, and the row is as tall as what is in it.

     THE WHOLE ROW OPENS THE SKILL AGAIN, and the switch is the one thing in
     it that does not. A control cannot be nested inside a button, so the
     target is a stretched link: .set2-sk-go::after covers the row, and the
     end cap sits above it on z-index. That gives a full-row hit area with no
     nested interactive content, and it is the only arrangement that gives
     both. Hover is keyed to :has(.set2-sk-go:hover) rather than to the row,
     so passing over the switch does not promise that pressing opens.

     THE PILL STILL SAYS ONLY WHAT THE SWITCH CANNOT. Disabled and Enabled
     ARE the switch; Overridden, No agent and No product are reasons a skill
     you switched ON is still not running, and no switch can say those. */
  function skillRow(s) {
    const [k, t] = standing2(s);
    const idle = !s.on || !!shadowedBy(s);
    return `
      <div class="set2-sk-r${idle ? ' is-off' : ''}">
        <span class="set2-sk-ico">${s.trigger === 'always' ? I.bolt
          : s.trigger === 'manual' ? I.hand : I.doc}</span>
        <span class="set2-sk-main">
          <!-- The tag belongs WITH the name, not under the description: it
               qualifies what the thing is, and a reader who has gone past the
               description to find it has already decided the row is fine. -->
          <span class="set2-sk-top">
            <button class="set2-sk-go" type="button"
                    data-go="skill:${esc(s.id)}">${esc(s.name)}</button>
            ${s.on && k !== 'is-ok' ? pill(k, t) : ''}
          </span>
          <span class="set2-sk-d">${esc(s.desc)}</span>
        </span>
        <span class="set2-sk-end">
          ${toggle(s.on, (s.on ? 'Disable ' : 'Enable ') + s.name,
                   `data-skill-on="${esc(s.id)}"`, lockedReason(s))}
          ${I.chev}
        </span>
      </div>`;
  }

  function skillList(st) {
    const f = readF(st);
    const own = ownOf(st);
    const all = skillsMatching(st);
    let list = all.filter((s) => s.own === own);
    /* "Narrowed" means the FILTERS narrowed it, not the tab: offering to clear
       filters on a tab that is simply empty would clear nothing and change
       nothing. */
    const narrowed = all.length !== SKILLS.length;
    const skey = (f.sort || '').replace('!', '');
    if (SORTS[skey]) {
      list = list.slice().sort(SORTS[skey]);
      if (f.sort.slice(-1) === '!') list.reverse();
    }

    return `
      <section class="set2-sec is-headless" id="st-skills">
        <!-- NOT a tablist. These do not switch panels of one document, they
             narrow the list and write to the URL — the same job the two
             dropdowns below do, in a different shape. Toggle buttons in a
             group say that; the tab role would promise a tabpanel that is not
             there. The document's own Overview / Contents pair stays a real
             tablist, which is what makes the distinction worth keeping. -->
        <div class="set2-tabs is-bare" role="group" aria-label="Whose skills">
          ${OWNER_TABS.map(([v, label, note]) => {
            /* The count is of the tab's OWN skills after the filters, so the
               number on the tab and the number of rows behind it agree. */
            const n = all.filter((s) => s.own === v).length;
            return `
            <span class="set2-tab-w">
              <button class="set2-tab${own === v ? ' is-on' : ''}" type="button"
                      aria-pressed="${own === v}" data-own="${v}">${esc(label)}<span
                class="set2-tab-n set2-num">${n}</span></button>
              ${tip('ownTip-' + v, v === 'you' ? 'your own skills' : 'the organization’s skills', note)}
            </span>`;
          }).join('')}
          <!-- The two actions live on THIS row, not in the filter bar. They
               make a skill and fetch a template; they narrow nothing, and
               sharing a row with the filters made them read as two more
               controls over the set. -->
          <span class="set2-tabs-end">
            <button class="btn btn-ghost btn-sm" type="button" data-example>Download example</button>
            <button class="btn btn-brand btn-sm" type="button" data-new>New skill</button>
          </span>
        </div>

        <div class="set2-fbar">
          ${filterSel(st, 'agent', 'All agents', AGENTS.map((a) => a.name))}
          ${filterSel(st, 'product', 'All products', SKILL_PRODUCTS)}
          <!-- The corpus search's own class, from knowledge.css, which
               console.html already loads. Nour asked for this field at the
               size of the one in the documents view; copying its metrics into
               a second rule is how two controls meant to match start drifting.
               Reusing the class means they cannot. -->
          <div class="k-search set2-fbar-q${f.q ? ' is-on' : ''}">
            ${I.search.replace('<svg', '<svg width="13" height="13" aria-hidden="true"')}
            <input class="k-search-i" type="search" placeholder="Search by skill name…"
                   value="${esc(f.q || '')}" data-f-q autocomplete="off" spellcheck="false"
                   aria-label="Search by skill name">
            ${f.q ? `<button class="k-search-x" type="button" data-fq-clear
                     aria-label="Clear search">${I.x.replace('<svg', '<svg width="11" height="11"')}</button>` : ''}
          </div>
        </div>

        ${list.length ? `
        <!-- The sortable header went with the columns, and the SORT did not.
             A control removed is a capability removed, and this one still
             has a job at twenty skills even if it has none at six.

             Description is gone from it, though: it was sortable because it
             was a column, and alphabetical order on a sentence nobody wrote
             alphabetically was never an answer to a question. Name and
             status are, and both survive the columns. -->
        <div class="set2-sk-sort">
          <span class="set2-sk-sort-l">Sort</span>
          ${sortTh(st, 'name', 'Name')}
          ${sortTh(st, 'status', 'Status')}
        </div>
        ${list.map(skillRow).join('')}` : `
          <div class="set2-empty">
            <b>${narrowed ? 'No skill matches'
                 : own === 'you' ? 'You have not written one yet' : 'No skills yet'}</b>
            ${narrowed ? 'Nothing here fits that agent, product and name at once.'
              : own === 'you' ? 'Write one, or upload a SKILL.md. It applies to you alone.'
              : 'Create the first one to get started.'}
            <button class="btn ${narrowed ? 'btn-ghost' : 'btn-brand'} btn-sm" type="button"
                    data-${narrowed ? 'f-clear' : 'new'} style="margin-top:0.5rem">${
              narrowed ? 'Clear filters' : 'New skill'}</button>
          </div>`}
      </section>`;
  }

  /* ── The document ──
     Claude's header: back, then the name with the author under it, then the
     enable toggle and the overflow. The owner sits BESIDE the name rather than
     in the byline, because "whose is this" is the fact that decides whether
     the rest of the page describes something that runs. */
  function skillDoc(s, st, tab) {
    const [k, t] = standing2(s);
    return `
      <div class="set2-doc">
        <div class="set2-doc-hd">
          <!-- The way back sits IN the header, against the skill's name. On
               its own line above, it printed the word Skills directly under a
               heading that already says Skills and a scope line that already
               says Org FlairsTech: three lines of chrome, one a duplicate,
               before the thing you opened. As an icon against the title it is
               a control rather than a fourth heading. -->
          <button class="set2-back" type="button" data-back
                  aria-label="Back to all skills" title="All skills">${I.left}</button>
          <span class="set2-doc-id">
            <span class="set2-doc-tr">
              <!-- The name is edited IN PLACE, reached from the overflow menu
                   and from the precedence insight — not by clicking the title.
                   A heading that turns into a field when you click it means
                   every attempt to select the words for copying opens an
                   editor instead; renaming is a deliberate act and belongs
                   behind a deliberate control. It is also editable in the
                   file, as the H1 under the frontmatter — same field, and the
                   address follows it either way. -->
              ${EDIT.has('title:' + s.id) ? `
                <input class="set2-doc-ti" value="${esc(s.name)}" data-title-ed="${esc(s.id)}"
                       aria-label="Name of this skill" autocomplete="off" spellcheck="false">` : `
                <h2 class="set2-doc-t">${esc(s.name)}</h2>`}
              <span class="set2-own ${isOrg(s) ? 'is-org' : 'is-you'}">${isOrg(s) ? esc(ORG) : 'Yours'}</span>
            </span>
            <!-- The slug was printed here, after the author. On almost every
                 skill it is the title again in hyphens, one line under the
                 title. It survives where it is DOING something: in the file's
                 frontmatter, and in the precedence insight, which is about two
                 skills answering to it. -->
            <span class="set2-doc-by">by ${esc(s.by)}</span>
          </span>
          <span class="set2-doc-end">
            ${pill(k, t)}
            <!-- Same lock as the list. Stopping it in one place and allowing
                 it in the other would be worse than either, and this page is
                 exactly where somebody stopped in the list would go looking
                 for the way round. -->
            ${toggle(s.on, (s.on ? 'Disable ' : 'Enable ') + s.name,
                     `data-skill-on="${esc(s.id)}"`, lockedReason(s))}
            <button class="set2-kebab" type="button" data-skill-menu="${esc(s.id)}"
                    aria-haspopup="menu" aria-label="More for ${esc(s.name)}">
              <span></span><span></span><span></span>
            </button>
          </span>
        </div>

        <div class="set2-tabs" role="tablist">
          <!-- No count on Contents. It read "Contents · 1", copied from Claude,
               where a skill is a FOLDER and the number says how many files are
               in it. Here a skill is one file: the number was 1 on every skill
               and would have been 1 forever, which is a counter that cannot
               count. -->
          ${TABS.map(([id, label]) => `
            <button class="set2-tab${tab === id ? ' is-on' : ''}" type="button"
              role="tab" aria-selected="${tab === id}" data-part="${id}" data-sid="${esc(s.id)}">
              ${esc(label)}
            </button>`).join('')}
        </div>

        ${tab === 'contents' ? docContents(s) : docOverview(s)}
      </div>`;
  }

  /* ── Overview ──
     Description left, and on the right the card Claude uses for `Slash
     command` — which is where "how does this fire" belongs, so AiMY's extra
     facts about firing go in it rather than becoming tabs of their own. Owner
     is first in that column: it is the one fact that can make every fact under
     it moot.

     Precedence joins it, under the description, and ONLY when a name is
     contested. As a tab of its own it opened on "there is nothing to resolve"
     for five skills out of six. */
  function docOverview(s) {
    const ag = s.agents || [], pr = s.products || [];
    return `
      <div class="set2-ov" role="tabpanel">
        <div class="set2-ov-main">
          <p class="set2-lbl">Description</p>
          <p class="set2-ov-d">${esc(s.desc)}</p>
          ${precBlock(s)}
        </div>
        <aside class="set2-ov-side">
          <div class="set2-ov-card">
            <p class="set2-ov-k">Owner</p>
            <p class="set2-ov-v">${isOrg(s) ? esc(ORG) : 'You'}</p>
            <p class="set2-ov-s">${isOrg(s) ? 'Everyone on the tenancy has this one.'
                                            : 'Only you have this one.'}</p>
          </div>
          <div class="set2-ov-card">
            <div class="set2-ov-h">
              <p class="set2-ov-k">Trigger</p>
              <button class="btn btn-ghost btn-sm" type="button" data-pick-tr="${esc(s.id)}"
                      aria-label="Edit the trigger for ${esc(s.name)}">Edit</button>
            </div>
            <p class="set2-ov-v">${esc(TRIGGER[s.trigger])}</p>
            <p class="set2-ov-s">${esc(TRIGGER_WHY[s.trigger])}</p>
          </div>
          ${reachCard(s, 'Agents', 'ag', ag.map(agentName), 'is-role',
                      'None — this skill cannot run.')}
          ${reachCard(s, 'Products', 'pr', pr, 'is-scope',
                      'None — this skill belongs nowhere.')}
          <div class="set2-ov-card">
            <p class="set2-ov-k">Last updated</p>
            <p class="set2-ov-v">${esc(s.when)} · v${s.v}</p>
          </div>
        </aside>
      </div>`;
  }

  /* The two editable cards. `Edit` used to sit at the end of the chip flow
     wearing `.set2-grant-add`, a class with NO CSS anywhere in the build — a
     bare <button>, so it rendered as the word "Edit" in body text, in line
     with the chips, reading as one more chip rather than the way to change
     them. It moves to the card's head, opposite the label, where an action on
     a section belongs, and it wears the design system's button. */
  function reachCard(s, label, kind, vals, chip, empty) {
    return `
      <div class="set2-ov-card${vals.length ? '' : ' is-err'}">
        <div class="set2-ov-h">
          <p class="set2-ov-k">${esc(label)}</p>
          <button class="btn btn-ghost btn-sm" type="button"
                  data-pick-${kind}="${esc(s.id)}"
                  aria-label="Edit ${esc(label.toLowerCase())} for ${esc(s.name)}">Edit</button>
        </div>
        <div class="set2-ov-chips">
          ${vals.length ? vals.map((v) => `<span class="set2-chip ${chip}">${esc(v)}</span>`).join('')
            : `<span class="set2-sp-note">${esc(empty)}</span>`}
        </div>
      </div>`;
  }

  /* One panel for both lists. Agents come from `AGENTS`, products from the
     domains production offers, and neither is a tree — so this is the flat
     multi-select the scope menus already established rather than anything new. */
  function paintReachPick(anchor, s, kind) {
    const opts = kind === 'agents'
      ? AGENTS.map((a) => [a.id, a.name])
      : SKILL_PRODUCTS.map((p) => [p, p]);
    const have = s[kind] || [];
    popover(anchor, `
      <div class="set2-pop-hd">${kind === 'agents' ? 'Which agents run it' : 'Which products it belongs to'}</div>
      ${opts.map(([v, n]) => {
        const on = have.indexOf(v) > -1;
        return `
        <button class="set2-pop-i is-val${on ? ' is-on' : ''}" type="button"
                data-reach-val="${esc(s.id)}|${kind}|${esc(v)}" aria-pressed="${on}">
          <span class="set2-pop-n">${esc(n)}</span>
          <span class="set2-pop-k">${I.tick}</span>
        </button>`;
      }).join('')}`);
  }

  /* One of three, so it CLOSES on choosing. The reach menus stay open because
     picking three agents is one decision; picking a trigger is one pick, and a
     menu that stays open after the only choice has been made is asking a
     question that has been answered. */
  function paintTriggerPick(anchor, s) {
    popover(anchor, `
      <div class="set2-pop-hd">When it fires</div>
      ${Object.keys(TRIGGER).map((k) => {
        const on = s.trigger === k;
        return `
        <button class="set2-pop-i is-val${on ? ' is-on' : ''}" type="button"
                data-trig-val="${esc(s.id)}|${esc(k)}" aria-pressed="${on}">
          <span class="set2-pop-tx">
            <span class="set2-pop-n">${esc(TRIGGER[k])}</span>
            <span class="set2-pop-p">${esc(TRIGGER_WHY[k])}</span>
          </span>
          <span class="set2-pop-k">${I.tick}</span>
        </button>`;
      }).join('')}`, 'is-trig');
  }

  /* ── Contents, and editing it ──
     The editor is THE FILE, not a form over its fields. `toMarkdown()` and
     `parseSkillFile()` already round-trip — download, change, upload was the
     only way to edit a skill in this build — so putting a textarea between
     those two functions makes that loop local without inventing a second
     representation of a skill. One control edits the name, the description,
     the trigger, the sources and both reach lists, because every one of them
     lives in the frontmatter.

     Nothing is written until the whole file parses. A half-applied file leaves
     behind a skill nobody authored, and the parser already NAMES the field it
     could not find, which is the half of an error message worth showing. */
  const EDIT = new Set();
  const DRAFT = {};
  const EDERR = {};

  function docContents(s) {
    const raw = RAW.has(s.id);
    if (EDIT.has(s.id)) return `
      <div class="set2-file is-edit" role="tabpanel">
        ${EDERR[s.id] ? `<div class="set2-note is-err">${esc(EDERR[s.id])}</div>` : ''}
        ${isOrg(s) ? `<div class="set2-note is-warn">This is ${esc(ORG)}’s skill.
          Saving changes it for everyone on the tenancy.</div>` : ''}
        <textarea class="set2-ed" spellcheck="false" data-ed="${esc(s.id)}"
                  aria-label="SKILL.md for ${esc(s.name)}">${
          esc(DRAFT[s.id] != null ? DRAFT[s.id] : toMarkdown(s))}</textarea>
        <div class="set2-ed-bar">
          <span class="set2-ed-h"><code class="set2-slug">name</code> is the address another
            skill collides with. Everything under the frontmatter is the instruction.</span>
          <button class="btn btn-ghost btn-sm" type="button" data-ed-cancel="${esc(s.id)}">Cancel</button>
          <button class="btn btn-brand btn-sm" type="button" data-ed-save="${esc(s.id)}">Save</button>
        </div>
      </div>`;
    return `
      <div class="set2-file" role="tabpanel">
        <div class="set2-file-bar">
          <span class="set2-view">
            <button class="set2-view-b${raw ? '' : ' is-on'}" type="button"
                    data-sview="pretty" data-sid="${esc(s.id)}" aria-label="Rendered">${I.eye}</button>
            <button class="set2-view-b${raw ? ' is-on' : ''}" type="button"
                    data-sview="raw" data-sid="${esc(s.id)}" aria-label="Source">${I.code}</button>
          </span>
          <button class="btn btn-ghost btn-sm" type="button" data-ed-open="${esc(s.id)}">Edit</button>
        </div>
        <div class="set2-body${raw ? ' is-raw' : ''}">${raw ? esc(toMarkdown(s)) : esc(s.body)}</div>
      </div>`;
  }

  function openEdit(id) {
    /* The source view and the editor show the same characters, so leaving the
       toggle on `raw` underneath would make Cancel look like it did nothing. */
    RAW.delete(id); EDIT.add(id); delete EDERR[id];
    render();
    const ta = $('[data-ed="' + id + '"]');
    if (ta) { ta.focus(); ta.setSelectionRange(0, 0); }
  }

  function closeEdit(id) {
    EDIT.delete(id); delete DRAFT[id]; delete EDERR[id];
    render();
  }

  function saveEdit(id) {
    const s = skillById(id);
    const ta = $('[data-ed="' + id + '"]');
    if (!s || !ta) return;
    try {
      const p = parseSkillFile(ta.value);
      /* Two skills of the SAME owner sharing an address is a mistake — nothing
         could ever decide between them. Across owners it is the override, and
         it is allowed, which is the whole point of this screen. */
      const clash = SKILLS.filter((x) => x.id !== s.id && x.own === s.own
                    && String(x.slug || '').toLowerCase() === p.slug.toLowerCase())[0];
      if (clash) throw new Error('You already have a skill addressed `' + p.slug
        + '`. Two skills with the same owner cannot share a name.');
      s.slug = p.slug; s.name = p.name; s.desc = p.desc; s.trigger = p.trigger;
      s.sources = p.sources; s.agents = p.agents; s.products = p.products;
      s.body = p.body;
      /* Editing is authorship. The byline follows the edit on a skill of
         yours; the organisation's keeps the admin who owns it. */
      if (!isOrg(s)) s.by = USER.name;
      s.when = 'just now'; s.v = (s.v || 0) + 1;
      DIRTY.add('file:' + s.id);
      closeEdit(id);
    } catch (ex) {
      EDERR[id] = ex.message;
      DRAFT[id] = ta.value;
      render();
    }
  }

  /* `saveSlug` stood here — a second field, in the precedence block, editing
     the address on its own. It is gone with the field: the ADDRESS FOLLOWS THE
     NAME now, so there is one name, one editor, and no pair to keep in step.

     Slugified the way the file's own comment describes an address: lower case,
     hyphens, no spaces. If that lands on one of YOUR other skills a numeral is
     appended rather than an error being raised — an inline rename that stops
     to argue is worse than one that quietly picks the next free address, and
     the result is visible immediately in the frontmatter on Contents. Landing
     on the ORGANISATION's address is not a clash at all: it is the override,
     and re-creating one deliberately has to stay possible. */
  const slugify = (v) => String(v).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'skill';

  function freeSlug(base, s) {
    const taken = (v) => SKILLS.some((x) => x.id !== s.id && x.own === s.own && nameKey(x) === v);
    let v = base, n = 2;
    while (taken(v)) v = base + '-' + (n++);
    return v;
  }

  /* ── Precedence, in place ──
     Two parties, not six levels. The organisation's skill and yours, the one
     that answers marked and the one that does not marked too — and the rule
     written out, because a reader who has just found their own skill switched
     off by something they did not do is owed the reason in a sentence.

     It renders on EVERY skill, contested or not. The uncontested case is one
     card and one line saying the name is unshared — which is the state most
     skills are in, and a reader who cannot see the rule stated on a skill that
     is fine has no way to learn it before the day one is not.

     The editable thing is the ADDRESS. Renaming is not a workaround for the
     override, it IS the mechanism: two files collide because they answer to
     one name, and giving yours another name is the whole of un-colliding them.
     So the rename sits where the collision is explained rather than being
     something you have to already know to go and do in the file. */
  function precCard(s, applies, why) {
    return `
      <div class="set2-pr-c${applies ? ' is-win' : ''}">
        <div class="set2-pr-h">
          <span class="set2-own ${isOrg(s) ? 'is-org' : 'is-you'}">${isOrg(s) ? esc(ORG) : 'Yours'}</span>
          <span class="set2-from">${esc(s.by)} · ${esc(s.when)} · v${s.v}</span>
          <span class="set2-pr-p">${applies ? pill('is-ok', 'Applies') : pill('is-mute', 'Does not apply')}</span>
        </div>
        <p class="set2-pr-b">${esc(s.body)}</p>
        <p class="set2-pr-w">${esc(why)}</p>
      </div>`;
  }

  function precBlock(s) {
    const over = shadowedBy(s), under = shadowing(s);
    const mine = isOrg(s) ? under : s;
    const theirs = isOrg(s) ? s : over;
    const pair = !!(mine && theirs);

    return `
      <section class="set2-prec">
        <span class="set2-lbl-row">
          <p class="set2-lbl">Precedence</p>
          ${tip('precTip', 'precedence', ORG + '’s skills override yours when the two answer to '
            + 'the same name. Yours is kept and stays editable — it just does not run. Nothing '
            + 'overrides a skill whose name no one else uses.')}
        </span>
        ${!pair ? `
          ${precCard(s, s.on, s.on ? 'No other skill answers to this name.'
                                   : 'Switched off, so nothing is handed to an agent.')}` : `
        ${precCard(theirs, true, 'The organization owns this name.')}
        ${precCard(mine, false, 'Kept and editable, and handed to no agent while the name collides.')}
        <div class="set2-pr-act">
          <!-- A COLLISION IS SOMETHING AIMY NOTICED, so it is said in AiMY's
               voice, in AiMY's wash, with AiMY's mark — the same treatment the
               insight band and the type card use, which is what makes three
               surfaces read as one voice rather than three components that
               agree. The line under an UNCONTESTED skill is gone entirely: it
               said the name is unshared, which is not a finding, and dressing
               "nothing happened" as an insight is how an insight stops meaning
               anything. -->
          <p class="set2-ins">
            ${AIMY_MK(13, 15)}
            <span class="set2-ins-t">${isOrg(s) ? `
              Two skills answer to <code class="set2-slug">${esc(nameKey(s))}</code>. This one
              wins, so ${esc(mine.by)}’s copy is kept and never runs.` : `
              Two skills answer to <code class="set2-slug">${esc(nameKey(s))}</code>, so yours
              never runs. Give it another name and it applies again.`}</span>
            ${isOrg(s) ? `
              <button class="set2-ins-a" type="button" data-go="skill:${esc(mine.id)}">Open it</button>` : `
              <!-- Sends you to the name at the top of THIS page rather than
                   opening a field of its own. A second input for the same
                   value is a second answer to "what is this called", and the
                   two would drift the first time somebody used the other one. -->
              <button class="set2-ins-a" type="button" data-slug-open="${esc(mine.id)}">Rename yours…</button>`}
          </p>
        </div>`}
      </section>`;
  }

  M.agents = () => `
    <section class="set2-sec">
      <div class="set2-sec-h"><h2 class="set2-sec-t">Agents</h2></div>
      <div class="set2-rows">${AGENTS.map((a) => row({
        ico: I.bolt, name: a.name, d: a.d, off: !a.on,
        end: toggle(a.on, 'Enable ' + a.name)
      })).join('')}</div>
    </section>`;

  M.grounding = () => `
    <section class="set2-sec">
      <div class="set2-sec-h"><h2 class="set2-sec-t">Collections</h2></div>
      <div class="set2-rows">${COLS.map((c) => row({
        ico: I.doc, name: c.name, d: c.d, off: !c.on, locked: c.locked,
        end: c.locked ? '' : toggle(c.on, 'Ground on ' + c.name)
      })).join('')}</div>
      <div class="set2-note" style="margin-top:0.75rem">Uploading documents moved to the Console. This decides which collections an agent may stand on, not what is in them.</div>
    </section>`;

  /* ══ USER & ACCESS ═════════════════════════════════════════════════════
     Was three rail items — People, Roles, Hierarchy — which split one question
     across three pages: a grant is a ROLE on a SCOPE held by a PERSON, and you
     cannot check whether it is right while looking at only one of the three.

     A card per person, each carrying its grants in full. The role name alone
     ("Super Admin") is the half people read and the scope is the half that
     matters, so the two are never separated: `Super Admin` on `Product
     InterFAX Support` is a different grant from the same role on the
     organisation, and a list that prints only the first is lying by omission.

     NO ROLE / STATUS / ACCESS FILTERS IN THIS PASS. They belong on this
     surface and the screenshot has them, but a filter has to write to the URL
     to be honest here, and a dropdown that narrows nothing is the exact defect
     this file spent a paragraph removing from the old filter row. Five people
     do not need them; fifty will, and they arrive with their query keys. */
  /* Selection is deliberately NOT in the URL: ticking three cards is a gesture
     mid-operation, and restoring it on a fresh load would restore an intention
     the reader no longer has. */
  const PICKED = new Set();

  /* ══ THE ROLE PICKER ═══════════════════════════════════════════════════
     Three steps, one panel, with a way back at each: ROLE, then the KIND of
     scope, then the scopes themselves. They are one popover replacing its own
     contents, so the anchor never moves and the card underneath never reflows.

     Values are multi-select and the panel stays open while you pick, because
     granting Super Admin on four products is one decision and re-opening the
     menu four times would make it read as four.

     `bulk` aims the same picker at everyone ticked. The operation is
     identical; only the target is plural. */
  let RPICK = null;
  const personById = (id) => PEOPLE.filter((p) => p.id === id)[0];

  /* One role on one already-known scope, to one person or to everyone ticked.
     Somebody who already holds this role at this scope TYPE gains the scope
     rather than a second group: two "QA Manager on Product" rows against one
     person is a state nobody asked for and nobody can tell apart. */
  function grantAt(rp) {
    const who = rp.bulk ? PEOPLE.filter((x) => PICKED.has(x.id)) : [personById(rp.pid)];
    who.filter(Boolean).forEach((x) => {
      let g = x.grants.filter((y) => y.r === rp.role && y.t === rp.at.t)[0];
      if (!g) { g = { r: rp.role, t: rp.at.t, v: [] }; x.grants.push(g); }
      if (g.v.indexOf(rp.at.v) < 0) g.v.push(rp.at.v);
      DIRTY.add('grant:' + x.id);
    });
  }

  /* Which role. Each row names it AND everywhere it currently reaches, because
     "Employee" alone does not say whether the next press costs somebody one
     client or six. Shared by edit, revoke, and the way BACK out of the client
     step — same list, same shape, a different verb on the far side of it. */
  function roleListPop(anchor, p, attr) {
    popover(anchor, p.grants.map((g, i) => `
      <button class="set2-pop-i is-role" type="button" ${attr}="${esc(p.id)}:${i}">
        <span class="set2-pop-tx">
          <span class="set2-pop-n">${esc(g.r)}</span>
          <span class="set2-pop-s">${esc(g.v.join(', '))}</span>
        </span>
      </button>`).join(''), 'is-roles');
  }

  function paintRPick(anchor) {
    if (!RPICK) { closePop(); return; }
    /* One ticked person is a selection of one, not "1 people" — and naming
       them beats counting them, because at that point the count is the less
       specific of the two things we know. */
    const ticked = PEOPLE.filter((p) => PICKED.has(p.id));
    const who = RPICK.bulk
      ? (ticked.length === 1 ? ticked[0].name : ticked.length + ' people')
      : ((personById(RPICK.pid) || {}).name || '');
    const back = (label) => `<button class="set2-pop-back" type="button" data-rp-back>${I.left} ${esc(label)}</button>`;
    let html = '';

    if (RPICK.step === 'role') {
      /* ── SIX FIXED ROLES DO NOT NEED A SEARCH ──
         The box sat above every one of them and could only ever narrow a list
         short enough to read in full, while costing the first row its place at
         the top and taking the focus that should have been on the choice. Same
         rule the scope menus use: it appears when the list outgrows the panel,
         and not before.

         ── ORDER IS INFORMATION ──
         ROLES is authored widest-first, so the list descends by power and
         where a row sits says something before you have read it. Nothing
         re-sorts it.

         ── AND WHAT THEY ALREADY HAVE ──
         Granting somebody a role they hold is a no-op that looks like an
         action. Held rows say so — precisely: with a scope already decided it
         means held HERE, because holding QA Manager on CXS tells you nothing
         about whether they hold it on InterFAX. */
      const q = (RPICK.q || '').toLowerCase();
      const hits = ROLES.filter((r) => !q || r[0].toLowerCase().indexOf(q) >= 0);
      const holds = (role) => {
        const of = (x) => x.grants.some((g) => g.r === role
          && (!RPICK.at || (g.t === RPICK.at.t && g.v.indexOf(RPICK.at.v) > -1)));
        if (!RPICK.bulk) { const p = personById(RPICK.pid); return !!p && of(p); }
        return ticked.length > 0 && ticked.every(of);
      };

      html = `<div class="set2-pop-hd">Grant to ${esc(who)}${
        RPICK.at ? ' on <b>' + esc(RPICK.at.v) + '</b>' : ''}</div>
        ${ROLES.length > 7 ? `<input class="set2-pop-f" type="search" placeholder="Search roles…"
               value="${esc(RPICK.q || '')}" data-rp-q autocomplete="off" aria-label="Search roles">` : ''}`
        + (hits.length ? hits.map((r) => {
            const on = holds(r[0]);
            return `
            <button class="set2-pop-i is-role${on ? ' is-on' : ''}" type="button"
                    data-rp-role="${esc(r[0])}" aria-current="${on ? 'true' : 'false'}">
              <span class="set2-pop-tx">
                <span class="set2-pop-n">${esc(r[0])}</span>
                <span class="set2-pop-s">${esc(r[1])}</span>
              </span>
              <span class="set2-pop-k" aria-label="${on ? 'Already held' : ''}">${I.tick}</span>
            </button>`;
          }).join('')
          : `<div class="set2-pal-empty">No role called <b>${esc(RPICK.q)}</b>.</div>`);

    } else {
      /* ── STEP TWO OF TWO: WHICH CLIENTS ──
         The type step is gone. It asked which KIND of scope, and there is only
         one kind a grant can name, so it was a question with a single answer
         standing between the role and the clients every time. */
      const p = RPICK.pid ? personById(RPICK.pid) : null;
      const g = (p && RPICK.gi != null) ? p.grants[RPICK.gi] : null;
      /* In the plural case a scope counts as HELD only when every selected
         person has it — a tick against something half of them have is a lie. */
      const have = g ? g.v : (RPICK.bulk
        ? nodesOfType('Client').filter((v) => {
            const sel = PEOPLE.filter((x) => PICKED.has(x.id));
            return sel.length && sel.every((x) => x.grants.some((gr) =>
              gr.r === RPICK.role && gr.v.indexOf(v) > -1));
          })
        : (RPICK.v || []));
      /* The tick sits ON the name's row and its space is reserved whether or
         not it is showing — it was a second child of a column-flowing row, so
         it dropped UNDER the client name, and appearing only when ticked would
         have shifted every name sideways as you picked. Same treatment the
         scope and role menus use. */
      html = back(RPICK.role) + nodesOfType('Client').map((v) => {
        const on = have.indexOf(v) > -1;
        return `
        <button class="set2-pop-i is-val${on ? ' is-on' : ''}" type="button"
                data-rp-val="${esc(v)}" aria-pressed="${on}">
          <span class="set2-pop-n">${esc(v)}</span>
          <span class="set2-pop-k">${I.tick}</span>
        </button>`;
      }).join('');
    }
    popover(anchor, html, RPICK.step === 'role' ? 'is-roles' : '');
    const f = $('[data-rp-q]');
    if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
  }

  /* ══ WHAT YOU SELL ═════════════════════════════════════════════════════
     Your list, and one way to add to it. Only yours: the page never shows
     or sets what anybody else sells.

     The line at the top says why the page is here at all. It belongs to
     AiMY Sales, and a console reader who does not use that product should
     not have to wonder what it is for. */
  const sellItem = (o) => `
    <div class="set2-sp-row set2-sell-row">
      <span class="set2-sp-lines set2-sell-lines">
        <span class="set2-sp-n2">${esc(o.name)}</span>
        <span class="set2-sell-d">${esc(o.kind)} &middot; ${esc(o.d)}</span>
      </span>
      <span class="set2-sp-act">
        <button class="set2-lnk is-err" type="button" data-sell-rm="${esc(o.id)}">Remove</button>
      </span>
    </div>`;

  /* The list alone, so the menu can repaint it behind itself on every press
     without rebuilding the page and taking its own anchor away. */
  function sellMine() {
    const mine = mySells().map(offeringById).filter(Boolean);
    return group('You sell', mine.length ? 'is-ok' : '', mine.length,
      mine.length ? mine.map(sellItem).join('')
        : `<div class="set2-sell-none">Nothing yet. Add the products and services you sell.</div>`);
  }

  function secSelling() {
    return `
      <section class="set2-sec is-headless" id="st-selling">
        <p class="set2-sell-lede">You see this because you have access to <b>AiMY Sales</b>.
          What you choose here is what AiMY Sales offers you when you build a campaign.</p>
        <div data-sell-mine>${sellMine()}</div>
      </section>`;
  }

  /* ── THE MENU ──
     A search over the catalogue with the catalogue under it, split into
     Products and Services and ticked where you already sell it. It can only
     find what is in the catalogue, which is the point: nothing here is typed
     into existence. Multi-select, and it stays open, the way the role
     picker's client step does — choosing three things you sell is one
     decision. Each row is the NAME alone; the description made every row two
     or three lines tall and turned eight choices into a scroll. It is still
     searched, and it is still on the row's tooltip and on the page. */
  function paintSellPick(anchor) {
    const mine = mySells();
    const rows = (q) => {
      const hits = OFFERINGS.filter((o) => !q ||
        (o.name + ' ' + o.kind + ' ' + o.d).toLowerCase().indexOf(q) >= 0);
      if (!hits.length) return `<div class="set2-pal-empty">Nothing we sell matches <b>${esc(q)}</b>.</div>`;
      return ['Product', 'Service'].map((kind) => {
        const of = hits.filter((o) => o.kind === kind);
        if (!of.length) return '';
        return `<div class="set2-pop-t">${kind}s</div>` + of.map((o) => {
          const on = mine.indexOf(o.id) > -1;
          return `
            <button class="set2-pop-i is-val${on ? ' is-on' : ''}" type="button"
                    data-sell-t="${esc(o.id)}" aria-pressed="${on}" title="${esc(o.d)}">
              <span class="set2-pop-n">${esc(o.name)}</span>
              <span class="set2-pop-k">${I.tick}</span>
            </button>`;
        }).join('');
      }).join('');
    };
    const pop = popover(anchor, `
      <div class="set2-pop-hd">Add what you sell</div>
      <input class="set2-pop-f" type="search" placeholder="Search products and services…"
             data-sell-q autocomplete="off" aria-label="Search products and services">
      <div class="set2-pop-bd" data-sell-list>${rows('')}</div>`, 'is-sell');
    if (!pop) return;
    const f = $('[data-sell-q]', pop); if (f) f.focus();
    pop.addEventListener('input', (e) => {
      if (!e.target.closest('[data-sell-q]')) return;
      $('[data-sell-list]', pop).innerHTML = rows(e.target.value.toLowerCase().trim());
    });
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sell-t]');
      if (!b) return;
      const id = b.getAttribute('data-sell-t');
      const at = mine.indexOf(id);
      if (at > -1) mine.splice(at, 1); else mine.push(id);
      b.classList.toggle('is-on', at < 0);
      b.setAttribute('aria-pressed', String(at < 0));
      const list = $('[data-sell-mine]');
      if (list) list.innerHTML = sellMine();
      DIRTY.add('sell');
      markDirtyStage('selling');
      /* `markDirtyStage` only writes a note that exists, and an emptied list
         has none — so the count would stay at "1 chosen" after the last one
         went. Said here, from the same list. */
      const note = $('.rail-pg[data-sec="selling"] .rail-pg-s');
      if (note) note.textContent = mine.length ? mine.length + ' chosen' : '';
    });
  }

  /* ══ PEOPLE ════════════════════════════════════════════════════════════
     ANCHORED TO A SCOPE, NOT TO THE DIRECTORY.

     This replaces a grid of one card per person. The cards were not the
     problem — a grant really is a nested structure a table row cannot hold —
     but their height was the roster, and this workspace is an MSP with ten
     clients and fourteen products under Upland alone. Five cards is a page;
     five hundred is a scroll with no question at the top of it.

     So the page asks a scope and answers who reaches it. InterFAX Support has
     two people whether the company has fifty staff or five thousand.

     ── THE SPLIT IS THE POINT ──
     Everyone who reaches a node arrives one of two ways, and a flat roster
     prints them identically:

       GRANTED HERE          the grant names this node. Revocable in place.
       INHERITED FROM ABOVE  the grant names an ancestor. NOT revocable here —
                             you have to go up to where it was written.

     Drawing that is the difference between a revocation that works and one
     that silently does nothing, which is the failure a flat list invites: you
     press Revoke on Nour at InterFAX, the grant lives on Upland, and either
     nothing happens or you quietly cut her out of thirteen other products.

     ── THE ROOT IS EVERYONE ──
     Two things have no scope: inviting somebody, and holding nothing. Both
     live at the root, which is not "the organisation" as a place so much as
     the directory. It splits three ways instead of two — organisation-wide,
     scoped below, and no access — which makes the two facts an admin audits
     for into groups rather than a warning in a lede.

     ── WHAT MOVED, NOT WHAT WENT ──
     One person's COMPLETE access no longer has a card of its own. It has two
     homes instead: the root lists every grant they hold as chips you can jump
     through, and search — which is global, and deliberately ignores the scope
     — finds them from anywhere and does the same. Editing a grant happens
     where it applies, which is the whole argument for the shape.
     ══════════════════════════════════════════════════════════════════════ */

  /* Indexed once. `pathTo` runs per person per grant per render, and walking
     the tree from the top each time is how a five-person fixture teaches you
     nothing about a five-hundred-person one. */
  const NODE_AT = (() => {
    const m = {};
    (function walk(ns, parent) {
      ns.forEach((n) => { m[n.id] = { node: n, pid: parent ? parent.id : null };
        if (n.kids) walk(n.kids, n); });
    })(TREE, null);
    return m;
  })();
  /* Not a node, and deliberately not in TREE: nothing may select it, draw it
     or grant against it. It is the answer to "which client" when the answer is
     "none of them yet". The empty id keeps it out of the URL. */
  const TENANCY = { id: '', name: 'All clients', type: 'Tenancy', kids: TREE };
  const ROOT_ID = '';
  const nodeById = (id) => (NODE_AT[id] ? NODE_AT[id].node : TENANCY);
  /* People can only ever stand at the root or on a CLIENT, because that is all
     a grant can name. A `?node=` pointing anywhere else — a stale link from
     when grants carried a scope type, or one copied out of Scopes, which still
     addresses all six levels — resolves to the root rather than to a page that
     would answer "nobody" for a reason it could not explain. */
  const CLIENTS = () => TREE.filter((n) => n.type === 'Client');
  const clientOfSt = (st) => CLIENTS().filter((c) => c.id === st.node)[0] || null;
  /* An id that names nothing has no path. It used to fall back to the root,
     which returned the organisation - a breadcrumb for a place you were not
     standing in. */
  function pathTo(id) {
    const out = [];
    let e = NODE_AT[id];
    while (e) { out.unshift(e.node); e = e.pid ? NODE_AT[e.pid] : null; }
    return out;
  }
  /* A grant covers a node when it names that exact node. Everything else in
     this module is that one predicate, asked about a different node. */
  const covers = (g, n) => g.t === n.type && g.v.indexOf(n.name) > -1;

  /* Which KINDS of scope somebody holds anything on — what the Access filter
     narrows by. It lived beside the person card and went with it; the filter
     that reads it did not, so this is where it lives now. */

  /* Who reaches this node, and by which route. `at` on an inherited grant is
     the DEEPEST ancestor carrying it — the one you would actually have to go
     to. Naming a shallower one would send the reader to a page where the
     grant is not written either. */
  function reachAt(node, list) {
    const anc = pathTo(node.id).slice(0, -1);
    const here = [], up = [];
    list.forEach((p) => {
      const mine = [], from = [];
      p.grants.forEach((g) => {
        if (covers(g, node)) { mine.push({ g: g }); return; }
        for (let i = anc.length - 1; i >= 0; i--) {
          if (covers(g, anc[i])) { from.push({ g: g, at: anc[i] }); break; }
        }
      });
      if (mine.length) here.push({ p: p, gs: mine, from: from });
      else if (from.length) up.push({ p: p, gs: from });
    });
    return { here: here, up: up };
  }

  const passes = (p, f) => {
    if (f.role && !p.grants.some((g) => g.r === f.role)) return false;
    if (f.status && p.s[1] !== f.status) return false;
    return true;
  };

  M.access = function (st) {
    return pageBody(st);
  };

  /* ── People's scope IS the Connections scope ──
     It was crumbs plus one picker: plain text for the ancestors, a control
     only on the node you were standing on. That is a second treatment of the
     idea two modules over already have, and having both means the same
     question looks like two different things depending on which page asked
     it. So this is that component — `.set2-scope-pick`, kind label, bold
     value, caret — one per level, exactly as Dynamic fields draws Client and
     Product.

     The org is static text, again as over there: Connections starts its
     pickers at Client because the organisation is not a choice. Neither is it
     here.

     The trailing picker is how you go DEEPER, and it is the same control in
     its unset state — `Team · All` rather than a second idiom for descending.

     It used to FADE while searching. Search is global here on purpose, so the
     header would otherwise say `InterFAX Support` over results drawn from the
     whole workspace — the scope has not moved, it just is not what you are
     reading from. Fading it said that by making the breadcrumb you need to get
     back the least readable thing on the page at the moment you are lost in
     it. The line below it already says the search is global, in words. */
  function scopePick(kind, name, listFrom) {
    return `<button class="set2-scope-pick" type="button" data-scope-pick="${esc(listFrom)}"
              aria-haspopup="menu" aria-label="Choose a ${esc(kind.toLowerCase())}">
        <span class="set2-scope-k">${esc(kind)}</span><b>${esc(name)}</b>${I.down}
      </button>`;
  }

  function peopleScope(st) {
    const client = clientOfSt(st);
    const searching = !!(readF(st).q || '').trim();
    const sep = '<span class="set2-scope-s">&rsaquo;</span>';
    const n = searching ? 0 : peopleReach(client, st);
    return `
      <div class="set2-scope">
        ${scopePick('Client', client ? client.name : 'All', ROOT_ID)}
        ${sep}
        ${searching
          ? `<span class="set2-scope-i">search ignores it</span>`
          : `<span class="set2-scope-i">${n === 1 ? '1 person has a role'
              : n + ' people have a role'}</span>`}
      </div>`;
  }

  /* The header is painted before the body, so it cannot read the count off a
     rendered group. It asks the model the same question the body will. */
  function peopleReach(client, st) {
    const pool = PEOPLE.filter((p) => passes(p, readF(st)));
    if (!client) return pool.filter((p) => p.grants.length).length;
    return pool.filter((p) => p.grants.some((g) => covers(g, client))).length;
  }

  /* Not URL state. The menu is open for one gesture and the query dies with
     it — restoring it on a fresh load would restore a search nobody is running
     any more, in a panel that is not on screen. */
  let SCOPE_Q = '';

  /* One LEVEL per menu, which is what makes it the same control as the
     Connections one rather than a tree wearing its clothes.

     ── NO HEADING ──
     It said "In FlairsTech" over a list of FlairsTech's clients, which is the
     panel narrating its own contents to somebody who just pressed the button
     that opened it. Neither Connections picker has one. The widen row says the
     parent's name anyway, and it says it as something you can press.

     ── THE ROW HAS TO SAY WHAT YOU WOULD GET ──
     A name and a bare `2` told you a number about something without saying
     what it counted. Every row now carries the two facts this page exists to
     answer — how many people reach it, and whether there is anything under it
     to go on to — which is the same move `data-client-pick` makes with
     "2 connected / nothing connected".

     ── AND WHICH ONE YOU ARE ON ──
     A background tint alone marks the current row the same way hovering does,
     so on the row under the cursor the two are indistinguishable. It takes a
     tick as well. */
  const scopeLine = (n, st) => {
    const ppl = peopleReach(n, st);
    return ppl ? ppl + (ppl === 1 ? ' person' : ' people') : 'nobody yet';
  };

  function scopeItem(n, curId, wide, gap) {
    const on = wide ? !curId : curId === n.id;
    const st = readURL();
    return `
      <button class="set2-pop-i is-scope${on ? ' is-on' : ''}${wide ? ' is-wide' : ''}${
        gap ? ' is-gap' : ''}"
              type="button" data-scope-go="${esc(wide ? '' : n.id)}"
              aria-current="${on ? 'true' : 'false'}">
        <span class="set2-pop-tx">
          <span class="set2-pop-n">${wide ? 'Every client' : esc(n.name)}</span>
          <span class="set2-pop-p">${esc(wide ? scopeLine(null, st) : scopeLine(n, st))}</span>
        </span>
        <span class="set2-pop-k">${I.tick}</span>
      </button>`;
  }

  /* ONE list, because there is one grantable level. It was a level-at-a-time
     walk down six of them, which is the right control for a tenancy tree and
     the wrong one for a choice among six clients. */
  function paintScopePick(anchor, _parentId, q) {
    const st = readURL();
    const cur = (clientOfSt(st) || {}).id || '';
    const k = (q || '').toLowerCase();
    const all = CLIENTS();
    const kids = all.filter((n) => !k || n.name.toLowerCase().indexOf(k) > -1);
    popover(anchor, `
      ${all.length > 7 ? `<input class="set2-pop-f" type="search" placeholder="Search clients…"
             value="${esc(q || '')}" data-scope-q autocomplete="off" aria-label="Search clients">` : ''}
      ${scopeItem(null, cur, true)}
      ${kids.length ? kids.map((n, i) => scopeItem(n, cur, false, i === 0)).join('')
        : `<div class="set2-pal-empty">No client called <b>${esc(q)}</b>.</div>`}`);
  }

  /* ── A person, on this scope ──
     Same row everywhere; only the last cell changes, because what you can DO
     is the only thing that differs between reaching here and reaching through
     here. */
  function personRow(p, opts) {
    const picked = PICKED.has(p.id);
    /* Read off the person, not passed in by the caller. Two facts a quick
       action from the rail needs to LOCATE and not merely count: an invite
       nobody accepted, and somebody who can reach nothing. Both were on the
       old card as classes and both keep their names here, so the fix that
       aims at them did not have to learn a new selector. */
    const state = !p.grants.length ? ' is-none' : p.s[0] === 'is-warn' ? ' is-warn' : '';
    return `
      <div class="set2-sp-row${picked ? ' is-picked' : ''}${state}"
           data-person="${esc(p.id)}">
        <button class="set2-ck2" type="button" role="checkbox" aria-checked="${picked}"
                data-pick-p="${esc(p.id)}" aria-label="Select ${esc(p.name)}">${picked ? I.tick : ''}</button>
        <span class="set2-av">${esc(initialsOf(p.name))}</span>
        <span class="set2-sp-lines">
          <span class="set2-sp-n2">${esc(p.name)}${
            p.s[0] === 'is-warn' ? pill('is-warn', 'Pending') : ''}${
            p.admin ? pill('is-info', 'Admin') : ''}</span>
          <span class="set2-sp-m">${esc(p.mail)} &middot; ${esc(p.title)}</span>
        </span>
        <span class="set2-sp-why">${opts.why}</span>
        <span class="set2-sp-act">${opts.act || ''}</span>
        <button class="set2-kebab" type="button" data-person-menu="${esc(p.id)}"
                aria-haspopup="menu" aria-label="More for ${esc(p.name)}">
          <span></span><span></span><span></span>
        </button>
      </div>`;
  }

  const roleChip = (r) => `<span class="set2-chip is-role">${esc(r)}</span>`;

  /* Which people have their roles open. A gesture mid-read, so not in the URL
     — the same reasoning that keeps the selection out of it. */
  const ROPEN = new Set();

  /* ── ONE LINE PER GRANT ──
     These ran inline: `Super Admin · Upland · QA Manager · CXS · Admin · CXS`,
     one undifferentiated run where the only thing marking where one grant
     ended and the next began was the chips' fill. At three grants you are
     parsing styling to find boundaries. A grant is role × clients, so it gets
     a line, and the role names align into a column you can read down.

     ── AND THE ACCORDION ONLY WHERE IT EARNS ITS CLICK ──
     One grant is already one line; a toggle over it would hide nothing and
     cost a press. Two or more collapse — but the collapsed state still NAMES
     the roles, because "who is a Super Admin" is the question this page is
     opened with and putting that behind a click would be the card grid's old
     defect in a new shape. What the toggle hides is which CLIENTS each one
     reaches, which is the detail you go looking for rather than scan for. */
  function grantBlock(p, client) {
    if (!p.grants.length) {
      return `<span class="set2-sp-note">Can sign in and reach nothing.</span>`;
    }
    const lines = p.grants.map((g) => `
      <span class="set2-sp-grant">
        ${roleChip(g.r)}
        <span class="set2-sp-on">${g.v.map((v) =>
          scopeChip(v, idOfName(v, g.t))).join('')}</span>
      </span>`).join('');

    /* ── SCOPED TO A CLIENT, THE SUMMARY IS THE ROLE THAT APPLIES HERE ──
       The client view printed that and stopped: no breakdown, on the reasoning
       that a person's other clients answer a question about a client you are
       not looking at. Half right. Which role they hold HERE is the summary and
       stays the summary — but "and what else does this person reach" is the
       next question anyone checking a grant asks, and the accordion is where a
       next question belongs. So the breakdown comes back on a client too, and
       still opens on the full picture rather than the scoped one. */
    const here = client ? p.grants.filter((g) => covers(g, client)) : p.grants;
    const sum = here.map((g) => roleChip(g.r)).join('');

    if (p.grants.length === 1) return `<span class="set2-sp-grants">${lines}</span>`;

    const open = ROPEN.has(p.id);
    return `
      ${/* "Show roles" was a lie: the roles are already on the row, named, in
            the summary beside this button. What it opens is the BREAKDOWN —
            which clients each of those roles reaches. The label stays constant
            and the caret carries the state, so the word under the cursor does
            not change as you press it. */ ''}
      <button class="set2-sp-toggle" type="button" data-roles="${esc(p.id)}"
              aria-expanded="${open}">
        ${I.caret}Roles breakdown
      </button>
      ${open ? `<span class="set2-sp-grants">${lines}</span>`
        : `<span class="set2-sp-sum">${sum}</span>`}`;
  }
  /* A chip that goes somewhere. Used where a grant is written on a node other
     than the one you are looking at — the chip names the scope and takes you
     to it, so "not revocable here" is a direction and not just a refusal. */
  const scopeChip = (name, id) => id
    ? `<button class="set2-chip is-scope is-go" type="button" data-scope-go="${esc(id)}">${esc(name)}</button>`
    : `<span class="set2-chip is-scope">${esc(name)}</span>`;

  const idOfName = (name, type) => {
    let hit = null;
    (function walk(ns) { ns.forEach((n) => {
      if (!hit && n.name === name && n.type === type) hit = n.id;
      if (n.kids) walk(n.kids); }); })(TREE);
    return hit;
  };

  function group(label, kind, n, body, end) {
    return `
      <div class="set2-sp-g">
        <div class="set2-sp-gt ${kind}">${esc(label)}<span class="set2-num">${n}</span>
          ${end || ''}</div>
        ${body}
      </div>`;
  }

  function secPeople(st) {
    const f = readF(st);
    const q = (f.q || '').trim();
    const client = clientOfSt(st);
    const atRoot = !client;
    const pool = PEOPLE.filter((p) => passes(p, f));

    /* Selection is scoped to what is on screen, the way it always was — a tick
       that survives a change of scope is a tick against rows you can no longer
       see. */
    const body = q ? searchBody(q, f) : atRoot ? rootBody(pool, st) : clientBody(client, pool);
    const shownIds = [];
    (body.ids || []).forEach((id) => shownIds.push(id));
    [...PICKED].forEach((id) => { if (shownIds.indexOf(id) < 0) PICKED.delete(id); });

    const narrowed = pool.length !== PEOPLE.length;

    return `
      <section class="set2-sec is-headless" id="st-people">

        <div class="set2-fbar">
          ${/* No select-all. It was a bare checkbox at the head of the filter
                row, which is a control that looks like a filter and is not one
                — and the act it offered, ticking every person the filters left,
                is the one bulk act with no undo on this page. Rows still tick
                individually and the bulk bar still appears. */ ''}
          ${/* Role and Status. "Access" offered the five scope TYPES, and a
                grant names a client and nothing else now — so every option in
                it but Client matched zero people, and Client matched all of
                them. A filter that cannot narrow is a control that teaches the
                reader their filters do not work. */ ''}
          ${filterSel(st, 'role', 'Role', ROLES.map((r) => r[0]))}
          ${filterSel(st, 'status', 'Status', ['Active', 'Invite pending'])}
          ${narrowed || q ? `<button class="btn btn-ghost btn-sm" type="button" data-f-clear>Clear</button>` : ''}

          ${/* SAME BAR AS SKILLS. The filters narrow, on the left; the search
                finds one inside what they left, on the right, in the field the
                documents view uses. It was a full-width `.set2-fld` wedged
                between the select-all box and the dropdowns, so the three
                controls in this row read as one run and the search — the widest
                thing on the page — was the least like a search anywhere in the
                product.

                It does NOT respect the scope. Looking somebody up is how you
                find out where they are; narrowing it to the node you happen to
                be on would answer "not here" for everyone you cannot already
                see. The results say so on the way past. */ ''}
          <div class="k-search set2-fbar-q${f.q ? ' is-on' : ''}">
            ${I.search.replace('<svg', '<svg width="13" height="13" aria-hidden="true"')}
            <input class="k-search-i" type="search" placeholder="Search everyone…"
                   value="${esc(f.q || '')}" data-f-q autocomplete="off" spellcheck="false"
                   aria-label="Search everyone">
            ${f.q ? `<button class="k-search-x" type="button" data-fq-clear
                     aria-label="Clear search">${I.x.replace('<svg', '<svg width="11" height="11"')}</button>` : ''}
          </div>

          ${/* Root only, as the invite bar was. Adding somebody is a directory
                act, not a scoped one — offered from inside InterFAX Support it
                would add a person who then does not appear, because they reach
                nothing yet and nothing is where the root keeps them. */ ''}
          ${/* ── ADDING SOMEBODY WORKS WHERE YOU ARE STANDING ──
                Root only, before. The reasoning was sound and the conclusion
                was not: a new user reaches nothing, so one added from inside
                Upland would not appear in the Upland list — which argues for
                the sheet ASKING FOR THE ROLE when it is opened on a client,
                not for hiding the button. Hidden, the answer to "add a person
                to this client" was: go to the root, add them, come back, find
                them, grant a role. Five steps for one act.

                Search is still the exception. It is not a place, so there is
                no client for the grant to name. */ ''}
          ${!q ? `<button class="btn btn-brand btn-sm" type="button"
                    data-add-user="${esc(atRoot ? '' : client.id)}">Add user</button>` : ''}
        </div>

        ${body.html}
      </section>

      ${PICKED.size ? bulkBar(client, atRoot) : ''}`;
  }

  /* ── THE SPLIT WENT WITH THE LEVELS ──
     This had three groups at the root and two at a node: organisation-wide,
     scoped below, no access; then granted-here against inherited-from-above.
     All five described a hierarchy of grants that no longer exists. A grant
     names clients, nothing sits above a client, so nothing is ever inherited
     and no grant is ever wider than another.

     What is left is the only distinction the model still supports, and it is
     the one worth having: who holds something, and who holds nothing. */
  function rootBody(pool, st) {
    const has = pool.filter((p) => p.grants.length);
    const none = pool.filter((p) => !p.grants.length);
    const ids = has.concat(none).map((p) => p.id);

    if (!ids.length) {
      return { ids: ids, html:
        `<div class="set2-empty"><b>Nobody matches</b>No one fits those filters.
          <button class="btn btn-ghost btn-sm" type="button" data-f-clear>Clear filters</button></div>` };
    }

    const html = [
      has.length ? group('Has a role', 'is-ok', has.length,
        has.map((p) => personRow(p, { why: grantBlock(p) })).join('')) : '',

      none.length ? group('No access', 'is-err', none.length,
        none.map((p) => personRow(p, { mute: true,
          why: `<span class="set2-sp-note">Can sign in and reach nothing.</span>`,
          act: `<button class="set2-lnk" type="button" data-role-new="${esc(p.id)}">Grant a role</button>`
        })).join('')) : ''
    ].join('');

    return { ids: ids, html: html };
  }

  /* ── One client ── */
  function clientBody(client, pool) {
    const on = pool.filter((p) => p.grants.some((g) => covers(g, client)));
    const ids = on.map((p) => p.id);

    if (!ids.length) {
      return { ids: ids, html:
        `<div class="set2-empty"><b>Nobody has a role on ${esc(client.name)}</b>
          No grant names this client.
          <button class="btn btn-ghost btn-sm" type="button" data-scope-go="">Back to everyone</button></div>` };
    }

    return { ids: ids, html: group('Has a role on ' + client.name, 'is-ok', on.length,
      on.map((p) => personRow(p, {
        /* The role that applies HERE is the summary; the breakdown behind it
           is every grant the person holds, which is the question that follows. */
        why: grantBlock(p, client),
        act: `<button class="set2-lnk is-err" type="button"
                data-revoke="${esc(p.id)}:${esc(client.id)}">Revoke here</button>`
      })).join('')) };
  }

  /* ── Search: the one view that is not scope-bound ── */
  function searchBody(q, f) {
    const k = q.toLowerCase();
    const hits = PEOPLE.filter((p) => passes(p, f)
      && (p.name + ' ' + p.mail + ' ' + p.title).toLowerCase().indexOf(k) >= 0);
    if (!hits.length) {
      return { ids: [], html:
        `<div class="set2-empty"><b>Nobody matches</b>No one in the workspace answers to
          <b>${esc(q)}</b>.
          <button class="btn btn-ghost btn-sm" type="button" data-f-clear>Clear search</button></div>` };
    }
    return { ids: hits.map((p) => p.id), html:
      group('Everywhere in the workspace', '', hits.length,
        hits.map((p) => personRow(p, {
          why: grantBlock(p),
          act: p.grants.length ? '' :
            `<button class="set2-lnk" type="button" data-role-new="${esc(p.id)}">Grant a role</button>`
        })).join(''),
        `<span class="set2-sp-ge">search ignores the scope</span>`) };
  }

  function bulkBar(client, atRoot) {
    const picked = PEOPLE.filter((p) => PICKED.has(p.id));
    return `
      <div class="set2-bulk" role="region" aria-label="Actions for the selection">
        <span class="set2-bulk-n"><b class="set2-num">${PICKED.size}</b> selected</span>
        <button class="set2-lnk" type="button" data-pick-none>Deselect</button>
        <span class="set2-bulk-end">
          ${/* Pre-scoped to where you are, so the picker asks one question
                instead of three. At the root that means organisation-wide, and
                the panel says so in its heading rather than leaving it to be
                inferred from a breadcrumb behind a popover. */ ''}
          <button class="btn btn-ghost btn-sm" type="button" data-bulk-grant>Grant a role${
            atRoot ? '' : ' here'}</button>
          ${picked.some((p) => p.s[0] === 'is-warn')
            ? `<button class="btn btn-ghost btn-sm" type="button" data-bulk-resend>Resend invite${
                 picked.filter((p) => p.s[0] === 'is-warn').length > 1 ? 's' : ''}</button>` : ''}
          <button class="btn btn-ghost btn-sm is-err" type="button" data-bulk-rm>Remove</button>
        </span>
      </div>`;
  }

  const CAPS = [
    ['AI Controls', [
      ['Write organization skills', ['full', 'full', 'none', 'none', 'none', 'none']],
      ['Write personal skills',     ['full', 'full', 'full', 'full', 'full', 'none']],
      ['Change what a skill reaches', ['full', 'full', 'view', 'none', 'none', 'none']],
      ['Ground an agent on a collection', ['full', 'full', 'view', 'none', 'none', 'none']]
    ]],
    ['Organization', [
      ['Invite and remove people', ['full', 'full', 'none', 'none', 'none', 'none']],
      ['Assign roles',            ['lock', 'full', 'none', 'none', 'none', 'none']],
      ['Edit the hierarchy',      ['full', 'view', 'view', 'view', 'none', 'none']],
      ['Change the plan',         ['lock', 'none', 'none', 'none', 'none', 'none']]
    ]],
    ['Operations', [
      ['Edit a connection mapping', ['full', 'full', 'full', 'view', 'none', 'none']],
      ['Run a sync',                ['full', 'full', 'full', 'full', 'none', 'none']],
      ['Delete synced records',     ['lock', 'full', 'none', 'none', 'none', 'none']],
      ['Read the audit trail',      ['full', 'full', 'view', 'view', 'none', 'none']]
    ]]
  ];
  const CAP_STATE = {
    full: ['is-ok', 'Full'],
    view: ['is-mute', 'View only'],
    none: ['is-off', 'No access'],
    lock: ['is-ok', 'Always']
  };

  /* ══ ROLES ═════════════════════════════════════════════════════════════
     ONE ROLE AT A TIME, AND COMPARISON AS A DELTA.

     This replaces a six-by-twelve matrix. The matrix was honest about being a
     reference and said so under itself, but it was wrong about which axis
     grows. Six roles is a settled number — even a custom-role feature keeps it
     in the low tens. CAPABILITIES are what grow: twelve here, and fifty to two
     hundred in any RBAC surface that has been in production a while. At fifty
     the grid is six hundred cells with a horizontal scrollbar, and the reader
     is counting columns to find out what Admin can do.

     So the matrix is never rendered. A bounded list picks a role; the page
     shows capabilities against THAT ONE, which is `n` rows and not `n × 6`.

     ── COMPARISON IS THE HARD PART, AND A DELTA IS THE ANSWER ──
     Losing the grid loses side-by-side, which was the one thing it was good
     at. Rendering the DIFFERENCE gets it back and survives the growth that
     killed the grid: Admin differs from Super Admin in four capabilities, and
     that sentence is exactly as readable at four of two hundred. The eight
     that match collapse to one line, because "these are the same" is a fact
     that needs stating once rather than eight times.

     ── THE OTHER READING ──
     A role answers "what can Admin do". Nobody asks only that. The other
     question is "who can delete synced records", which the matrix answered by
     making you find a row and read across six columns. Searching a capability
     flips the page to answer it directly — same data, second reading, no
     second page.

     ── AND IT WRITES NOW ──
     This shipped as a reference and said so twice, because the matrix it
     replaced had seventy-two cells a client admin could click and get nothing
     from. That was honest about a table that could not be edited; it was never
     an argument that roles should not be editable, and they are.

     A capability is set on its own row, from the page of the role it belongs
     to — which is the reason the one-role-at-a-time shape came first. The
     compared column stays a label: two editable columns on one row is a
     surface where it is not obvious which role you just changed.

     `lock` is the exception and is the reason the state exists. It marks the
     capabilities that could not be granted BACK from inside the product if
     every admin gave them up, so those rows carry the padlock rather than the
     control — a switch there would be a door that locks behind you.
     ══════════════════════════════════════════════════════════════════════ */

  const roleIx = (name) => {
    for (let i = 0; i < ROLES.length; i++) if (ROLES[i][0] === name) return i;
    return -1;
  };
  /* ROLES is authored in descending power and the list keeps that order, so
     where a role sits is information before you have read a word of it. */
  const roleOf = (st) => (roleIx(st.role) > -1 ? st.role : ROLES[0][0]);
  const vsOf = (st) => (roleIx(st.vs) > -1 && st.vs !== roleOf(st) ? st.vs : '');

  /* Every capability, flattened with its group, so a diff can walk one list
     instead of a nest. */
  const CAP_FLAT = CAPS.reduce((a, [group, caps]) =>
    a.concat(caps.map(([cap, states]) => ({ g: group, cap: cap, s: states }))), []);

  /* Who holds this role, anywhere. Read off the grants, so it cannot disagree
     with People — and it is the number that turns a reference into something
     you can act on. */
  const holdersOf = (name) => PEOPLE.filter((p) => p.grants.some((g) => g.r === name));

  const capLabel = (state) => {
    const [cls, label] = CAP_STATE[state];
    return `<span class="set2-rl-s ${cls}">${state === 'lock' ? I.lock : ''}${esc(label)}</span>`;
  };

  /* ── THE MATRIX IS EDITABLE NOW, AND THE LOCK IS NOT ──
     This module shipped as a reference and said so twice: every cell a static
     `td`, a note under it explaining that nothing could be changed. That was
     honest about what it did and it is what changes here — a capability is set
     from the role's own page, on the row that names it.

     `lock` stays fixed, and that is the whole reason it exists. It marks the
     two capabilities that could not be granted BACK from inside the product if
     every admin gave them up, so a control offering to remove them would be
     offering a door that locks behind you. Those rows say Always and carry the
     padlock instead of the switch.

     Three states, so a segmented control rather than a menu: they are all
     visible, the current one is marked, and changing it is one press instead
     of open-read-choose. */
  const CAP_EDIT = [['full', 'Full'], ['view', 'View'], ['none', 'None']];

  function capControl(c, i) {
    const state = c.s[i];
    if (state === 'lock') {
      return `<span class="set2-rl-s is-ok" title="Cannot be given away">${I.lock}Always</span>`;
    }
    return `
      <span class="seg set2-rl-seg" role="group" aria-label="${esc(c.cap)}">
        ${CAP_EDIT.map(([v, n]) => `
          <button class="seg-btn${state === v ? ' active' : ''}" type="button"
                  data-cap="${esc(c.g)}|${esc(c.cap)}|${i}|${v}"
                  aria-pressed="${state === v}">${n}</button>`).join('')}
      </span>`;
  }

  M.roles = function (st) {
    const f = readF(st);
    const q = (f.cap || '').trim();
    const name = roleOf(st);
    const i = roleIx(name);
    const vs = vsOf(st);

    return `
      <section class="set2-sec is-headless" id="st-roles">
        <div class="set2-rl">
          ${roleNav(name, st, f)}
          ${q ? capSearch(q) : roleDoc(name, i, vs, st)}
        </div>
      </section>`;
  };

  function roleNav(name, st, f) {
    return `
      <aside class="set2-rl-nav" aria-label="Roles">
        <div class="set2-rl-hd">
          ${/* Searching here does not narrow the ROLES — six of them never
                needed a filter. It asks the other question, and the right
                column answers it instead of the role. The placeholder says so,
                because a search box that changes what the page is about
                without warning is a trap. */ ''}
          <input class="set2-fld set2-rl-q" type="search" placeholder="Search capabilities…"
                 value="${esc(f.cap || '')}" data-f-q data-f-key="cap"
                 aria-label="Search capabilities">
        </div>
        <div class="set2-rl-bd">
          ${ROLES.map((r) => {
            const on = r[0] === name && !(f.cap || '').trim();
            const held = holdersOf(r[0]).length;
            return `
              <button class="set2-rl-r${on ? ' is-on' : ''}" type="button"
                      data-role-go="${esc(r[0])}" aria-current="${on ? 'true' : 'false'}">
                <span class="set2-rl-n">${esc(r[0])}</span>
                <span class="set2-rl-held${held ? '' : ' is-zero'}">${
                  held ? held : 'none'}</span>
              </button>`;
          }).join('')}
        </div>
        ${/* The column of numbers needs a name or it is six figures against
              six words. "Held by" went with the line in the detail; this says
              what they COUNT, which is what the reader is asking. */ ''}
        <div class="set2-rl-ft">People holding each role.</div>
      </aside>`;
  }

  function roleDoc(name, i, vs, st) {
    const j = vs ? roleIx(vs) : -1;
    const rows = vs
      ? CAP_FLAT.filter((c) => c.s[i] !== c.s[j])
      : CAP_FLAT;
    const same = vs ? CAP_FLAT.length - rows.length : 0;
    /* Across BOTH columns being drawn, not just the primary one. Comparing
       Admin against Super Admin puts three `Always` cells on screen and Admin
       owns none of them — counting only the primary role left the word
       unexplained in the exact case that raises the question. */
    const locks = rows.filter((c) => c.s[i] === 'lock' || (j > -1 && c.s[j] === 'lock')).length;

    return `
      <div class="set2-rl-doc">
        <h2 class="set2-rl-t">${esc(name)}</h2>
        <p class="set2-rl-d">${esc(ROLES[i][1])}</p>

        <div class="set2-rl-bar">
          <span class="set2-rl-bar-l">${vs
            ? `Differs in <b>${rows.length}</b> of ${CAP_FLAT.length}`
            : `All <b>${CAP_FLAT.length}</b> capabilities`}</span>
          <span class="set2-rl-cmp">
            <span class="set2-rl-cmp-k">Compare with</span>
            ${vsSelect(name, vs)}
          </span>
        </div>

        ${vs ? `<div class="set2-rl-heads">
          <span class="set2-rl-h1">${esc(name)}</span>
          <span class="set2-rl-h2">${esc(vs)}</span>
        </div>` : ''}

        ${rows.length ? capGroups(rows, i, j) : `
          <div class="set2-empty"><b>Identical</b>${esc(name)} and ${esc(vs)} can do exactly
            the same things. One of them is redundant, or the difference is somewhere
            this table does not model.</div>`}

        ${vs && same ? `
          <div class="set2-rl-same">
            <span>${same} identical capabilit${same === 1 ? 'y' : 'ies'} collapsed</span>
            <button class="set2-lnk" type="button" data-role-vs="">Show all ${CAP_FLAT.length}</button>
          </div>` : ''}

        ${locks ? `<div class="set2-note" style="margin-top:1rem">${I.lock} <b>Always</b> is not a
          stronger <b>Full</b>. It marks a capability that cannot be given away: if every admin
          surrendered it, nothing inside the product could grant it back.</div>` : ''}
      </div>`;
  }

  /* Grouped, and the group heading only appears when the group has survived
     the diff — a heading over nothing tells the reader a group differs when
     it does not. */
  function capGroups(rows, i, j) {
    const out = [];
    CAPS.forEach(([group]) => {
      const mine = rows.filter((c) => c.g === group);
      if (!mine.length) return;
      out.push(`
        <div class="set2-rl-g">
          <div class="set2-rl-gt">${esc(group)}</div>
          ${/* The role you are ON is the one you can change. The compared
                column stays a label: two editable columns on one row is a
                surface where it is not obvious which role you just altered,
                and comparison is a thing you READ. */ ''}
          ${mine.map((c) => `
            <div class="set2-rl-cap">
              <span class="set2-rl-cn">${esc(c.cap)}</span>
              ${capControl(c, i)}
              ${j > -1 ? capLabel(c.s[j]) : ''}
            </div>`).join('')}
        </div>`);
    });
    return out.join('');
  }

  /* The same `.v2-dropdown` the People filters use. It was the last native
     `<select>` on the surface, and it was styled by the rules that went with
     them — so converting it is what stops it rendering as a raw browser
     control on a page where nothing else does. */
  function vsSelect(name, vs) {
    const opts = ROLES.map((r) => r[0]).filter((n) => n !== name);
    return `
      <div class="v2-dropdown set2-dd set2-fsel" data-vsdd>
        <button class="v2-dropdown-btn${vs ? ' active-filter' : ''}" type="button"
                aria-haspopup="listbox" aria-expanded="false"
                aria-label="Compare with another role">
          <span class="dd-label-text">${esc(vs || 'Nothing')}</span>
          ${I.down}
        </button>
        <div class="v2-dropdown-panel" role="listbox">
          <div class="v2-dropdown-option${vs ? '' : ' selected'}" role="option"
               aria-selected="${!vs}" data-value="">Nothing</div>
          ${opts.map((n) => `<div class="v2-dropdown-option${n === vs ? ' selected' : ''}"
            role="option" aria-selected="${n === vs}" data-value="${esc(n)}">${esc(n)}</div>`).join('')}
        </div>
      </div>`;
  }

  /* ── The other reading ──
     A capability across every role. This is the question the matrix made you
     read sideways for, and it is one row per hit rather than a grid. */
  function capSearch(q) {
    const k = q.toLowerCase();
    const hits = CAP_FLAT.filter((c) => (c.cap + ' ' + c.g).toLowerCase().indexOf(k) >= 0);
    return `
      <div class="set2-rl-doc">
        <h2 class="set2-rl-t">${hits.length} capabilit${hits.length === 1 ? 'y' : 'ies'}</h2>
        <p class="set2-rl-d">Matching <b>${esc(q)}</b>, across all ${ROLES.length} roles.</p>
        ${hits.length ? hits.map((c) => `
          <div class="set2-rl-g">
            <div class="set2-rl-gt">${esc(c.g)}</div>
            <div class="set2-rl-cap is-wide">
              <span class="set2-rl-cn">${esc(c.cap)}</span>
            </div>
            <div class="set2-rl-across">
              ${ROLES.map((r, n) => `
                <button class="set2-rl-x" type="button" data-role-go="${esc(r[0])}">
                  <span class="set2-rl-xn">${esc(r[0])}</span>
                  ${capLabel(c.s[n])}
                </button>`).join('')}
            </div>
          </div>`).join('')
          : `<div class="set2-empty"><b>No capability matches</b>Nothing in the three groups
              answers to <b>${esc(q)}</b>.
              <button class="btn btn-ghost btn-sm" type="button" data-f-clear>Clear search</button></div>`}
      </div>`;
  }

  /* ══ SCOPES ═════════════════════════════════════════════════════════════
     A MAP, BECAUSE THE TENANCY IS NOT THE SAME SHAPE TWICE.

     This replaces an indented tree. A tree renders every branch as the same
     shape at the same width, and the tenancy is nothing like that: CXS runs
     all six levels, Upland stops at Product on most of what it owns, MedFar is
     a client with nothing under it at all — the state the picker most often
     gets wrong and the state most real clients are in. Indentation flattens
     that unevenness away. A map is made of it.

     And this tree is not a page. It is the spine: grants resolve through it,
     skills target it, connections hang off its products. It showed names and
     one total. Selecting a node now says what depends on it, all of it read
     back out of `PEOPLE.grants`, `SEL` and `CONNECTIONS` — the map is the
     first surface that asks those three the same question.

     ── IT NEVER DRAWS EVERYTHING ──
     The rule the other three modules were rebuilt under applies hardest here,
     because a canvas fails at scale more expensively than a list does. Ten
     clients and thirty products would be a wall of boxes.

       DEPTH   stops at Product. Team and User roll up into a count on the
               node above them, and open per branch when asked.
       BREADTH `SIB_CAP` siblings, then "+n more" — Upland owns fourteen
               products in the console and drawing them is a column of
               fourteen boxes nobody reads.

     That is also the answer to the six-columns-of-boxes problem: drawn to full
     depth this is a tree lying on its side, which is worse than the tree it
     replaced. Four levels wide, the rest in the inspector.

     ── READ-ONLY, STILL ──
     Nothing here edits the hierarchy. Expanding, searching and selecting are
     the whole of it. "Create client" is not back: it left because it had no
     handler, and a canvas does not make that less true.
     ═══════════════════════════════════════════════════════════════════════ */

  /* Geometry. In px at the drawn scale; the layer is transformed as a whole to
     fit, so these are never recomputed for zoom. */
  /* ══ TWO GEOMETRIES, BECAUSE SCALING IS NOT ADAPTING ═════════════════════
     These numbers are the map's LAYOUT, not its zoom: a column is `w + gapX`
     wide, so four levels of the default depth come to 770 units however the
     canvas is scaled afterwards. Shrinking that to fit a phone is what
     `--sc-k` was doing, and at a 390 viewport it resolved to 0.33 — every
     label a third of its size, which is not a small map, it is an unreadable
     one. Flooring the scale at 0.85 fixed the reading and left 399px of
     panning, because a 770-unit map simply does not go into a 271px column.

     So the map is drawn NARROWER instead. The node loses 44 units of width it
     was only spending on names that truncate at both sizes, and the gap loses
     28 it was spending on elbows that read fine at 18 — together that is 122
     units per level, and at the default depth it takes the map from 770 to
     494. Same nodes, same depth, same tree: fewer pixels between them.

     104 rather than smaller, because the node still has to hold a name. Below
     about 96 units "Discovery" and "Self-Service" start truncating too, and a
     map of ellipses shows more of nothing.

     736 IS settings.css's OWN RUNG (46rem), and it is where the wide map stops
     fitting: at 0.85 it needs 655px of canvas, which is about a 780 viewport,
     and 736 is the nearest rung under that. Above it nothing changes — the
     wide geometry is what the 1536 reference draws, to the unit. */
  const SC_WIDE  = { w: 148, h: 30, gapX: 46, gapY: 12, padX: 20, padY: 20 };
  const SC_TIGHT = { w: 104, h: 28, gapX: 18, gapY: 10, padX: 12, padY: 12 };
  const SC = Object.assign({}, SC_WIDE);
  /* ══ AND THEY ARE REM, NOT PIXELS ═════════════════════════════
     The layout above is arithmetic in one unit space, and it does not matter
     what that unit is called as long as everything uses the same one. It
     matters enormously that it is the same unit the rest of the product uses.

     `html { font-size: max(1rem, calc(100vw / 96)) }` is the shipped scaling
     lever - 96 is 1536/16, so the root is the viewport expressed in the units
     this layout was drawn in, and every rem on the page grows with the screen.
     These numbers were written in CSS pixels, so the map alone did not grow
     with it. At a 25% browser zoom, measured: the root computes to 63.67px,
     a node's own label is set at 63.67px, and the node box is still 148px
     wide. Two characters fit. A tenancy of real names renders as "C...",
     "Di...", "S...", and the map reads as broken because it is the one thing
     on the surface not scaling.

     16 is the root these numbers were drawn against, which is the same 16 in
     the lever. Converting here rather than rewriting the arithmetic keeps the
     layout walk in whole units, where it is readable. */
  const SC_U = (n) => (n / 16) + 'rem';
  /* `let`, because the geometry above is chosen per render now. Both readers —
     the layout walk and scNode — run inside one `M.hierarchy` call, so setting
     these once at the top of it is enough for the two to agree. */
  let SC_STEP_X = SC.w + SC.gapX;
  let SC_STEP_Y = SC.h + SC.gapY;
  /* Keyed to the viewport rather than to a container query because the numbers
     it picks are JS, not CSS: this runs before the canvas exists. */
  function scSetGeom() {
    const tight = typeof window !== 'undefined' && window.innerWidth <= 736;
    Object.assign(SC, tight ? SC_TIGHT : SC_WIDE);
    SC_STEP_X = SC.w + SC.gapX;
    SC_STEP_Y = SC.h + SC.gapY;
  }
  const SIB_CAP = 6;
  /* Which branches are open past the depth cap, and which have had their
     siblings revealed. Gestures mid-read, not places — restoring them on a
     fresh load would restore an intention the reader no longer has, the same
     reasoning that keeps the People selection out of the URL. */
  const SC_OPEN = new Set();
  const SC_MORE = new Set();
  let SC_FIT = true;

  const DEPTHS = ['Client', 'Business Unit', 'Product', 'Team', 'User'];
  /* Product is the default floor: it is the deepest level anything else in the
     product addresses — connections hang off it, and it is where a client
     stops caring about our org chart and starts caring about their own. */
  const depthOf = (st) => {
    const want = readF(st).depth;
    const i = DEPTHS.indexOf(want);
    return i > -1 ? i + 1 : 3;
  };

  /* Search REVEALS. A hit and every ancestor of it are drawn at full strength
     and opened whatever the depth cap says; everything else stays on the
     canvas, dimmed. Filtering to the matches would remove the containment that
     is the only reason a match means anything — "Tier 1" alone tells you
     nothing about whose Tier 1 it is.

     IT WAS BRIEFLY REMOVED, and the reason is worth keeping: it rendered at
     ZERO PIXELS WIDE at every width, 1536 included, so what reached the screen
     was an unlabelled dark sliver beside the depth picker and nobody could
     tell it was a search. That was never a defect in this function — it was
     `.set2-fld { width: 100% }` with no flex basis next to a `margin-left:
     auto` cluster, which is fixed in settings.css at §THE SEARCH TAKES THE
     ROOM THE CONTROLS LEAVE. The behaviour below is unchanged. */
  function scKeep(q) {
    if (!q) return null;
    const keep = new Set();
    (function walk(n, path) {
      const here = path.concat([n.id]);
      if (n.name.toLowerCase().indexOf(q) > -1) here.forEach((id) => keep.add(id));
      (n.kids || []).forEach((k) => walk(k, here));
    })({ id: '', name: '', kids: TREE }, []);
    keep.delete('');
    return keep;
  }

  /* One pass: decide what is drawn, then place it. Children are laid out
     first and the parent centres on them, so an edge never crosses a node it
     is not connected to. */
  function scLayout(st) {
    const q = (readF(st).sq || '').trim().toLowerCase();
    const keep = scKeep(q);
    const maxD = depthOf(st);
    const nodes = [], edges = [];
    let slot = 0, maxX = 0;

    function place(n, depth) {
      const dim = !!keep && !keep.has(n.id);
      const kids = n.kids || [];
      /* Open when the depth allows it, when the reader asked, or when a match
         is hiding underneath — a search that leaves its own hit collapsed has
         not revealed anything. */
      const wants = depth < maxD || SC_OPEN.has(n.id)
                 || (keep && kids.some(function deep(k) {
                      return keep.has(k.id) || (k.kids || []).some(deep); }));
      let shown = wants ? kids : [];
      let hidden = 0;
      if (shown.length > SIB_CAP && !SC_MORE.has(n.id)) {
        hidden = shown.length - SIB_CAP;
        shown = shown.slice(0, SIB_CAP);
      }

      const kidYs = shown.map((k) => place(k, depth + 1));
      const y = kidYs.length
        ? (kidYs[0] + kidYs[kidYs.length - 1]) / 2
        : (slot++) * SC_STEP_Y;
      const x = SC.padX + depth * SC_STEP_X;
      if (x + SC.w > maxX) maxX = x + SC.w;

      nodes.push({ n: n, x: x, y: y, depth: depth, dim: dim,
                   rolled: !wants && kids.length ? leavesOf(n).length : 0,
                   open: wants && kids.length > 0, hidden: hidden });
      shown.forEach((k, i) => edges.push({ x1: x + SC.w, y1: y, y2: kidYs[i],
                                           x2: x + SC_STEP_X }));
      if (hidden) {
        const my = (slot++) * SC_STEP_Y;
        nodes.push({ more: n.id, x: x + SC_STEP_X, y: my, depth: depth + 1,
                     hidden: hidden, dim: dim });
        edges.push({ x1: x + SC.w, y1: y, y2: my, x2: x + SC_STEP_X });
      }
      return y;
    }
    /* Every client is a root of its own now. `slot` is shared across the whole
       pass, so each subtree simply continues below the one before it and the
       canvas is exactly as tall as what it drew. */
    TREE.forEach((n) => place(n, 0));
    return { nodes: nodes, edges: edges,
             w: maxX + SC.padX, h: slot * SC_STEP_Y + SC.padY * 2 - SC.gapY };
  }

  /* What a node is worth, all of it derived. Nothing here is a new field. */
  function scFacts(n) {
    const leaves = leavesOf(n);
    const ids = {};
    leaves.forEach((l) => { ids[l.id] = 1; });
    const people = reachAt(n, PEOPLE);
    /* ── SKILLS LAND ON AGENTS, NOT ON TENANCY ──
       This asked whether a skill's targets included any leaf under the node,
       which worked while a skill named tenancy. It names AGENTS now, and the
       only place agents appear in this tree is AiMY's own pinned branch — so
       the count is honest where it means something and zero everywhere else,
       rather than a number derived from a relationship that no longer holds. */
    const agentIds = leaves.filter((l) => l.type === 'Agent').map((l) => l.id);
    const skills = agentIds.length
      ? SKILLS.filter((s) => (s.agents || []).some((a) => agentIds.indexOf(a) > -1))
      : [];
    const prods = [];
    (function walk(x) { if (x.type === 'Product') prods.push(x.name);
      (x.kids || []).forEach(walk); })(n);
    const conns = prods.reduce((a, p) => a.concat(connsOf(p)), []);
    return { leaves: leaves.length, people: people, skills: skills, conns: conns };
  }

  M.hierarchy = function (st) {
    /* Before scLayout, which reads SC on every node it places. */
    scSetGeom();
    const f = readF(st);
    const q = (f.sq || '').trim();
    const map = scLayout(st);
    const here = nodeById(st.node || ROOT_ID);

    return `
      <section class="set2-sec is-headless" id="st-scopes">
        <div class="set2-sc-bar">
          <input class="set2-fld set2-sc-q" type="search" placeholder="Search the tenancy…"
                 value="${esc(q)}" data-f-q data-f-key="sq" aria-label="Search the tenancy">
          <span class="set2-sc-bar-end">
            ${filterSel(st, 'depth', 'To Product', DEPTHS)}
            <button class="btn btn-ghost btn-sm" type="button" data-sc-fit
                    aria-pressed="${SC_FIT}">${SC_FIT ? 'Actual size' : 'Fit'}</button>
          </span>
        </div>

        <div class="set2-sc">
          <div class="set2-sc-canvas${SC_FIT ? ' is-fit' : ''}" data-sc-canvas
               style="--sc-w:${map.w};--sc-h:${map.h}">
            <div class="set2-sc-box"><div class="set2-sc-layer">
              <svg class="set2-sc-wires" viewBox="0 0 ${map.w} ${map.h}" aria-hidden="true">
                ${map.edges.map((e, i) => {
                  const mx = e.x1 + SC.gapX / 2;
                  /* `pathLength="1"` normalises every elbow, however long it
                     actually is, to a length of one. That is what lets the
                     draw-on be written as `stroke-dasharray: 1` in the
                     stylesheet with no JavaScript measuring anything - and it
                     means a short wire and a long one take the same time,
                     which is what makes the tree look like it is growing
                     rather than like the far branches are slower. */
                  return `<path d="M${e.x1} ${e.y1 + SC.h / 2} H${mx} V${e.y2 + SC.h / 2} H${e.x2}"
                            pathLength="1" style="--i:${i}"
                            fill="none" stroke="currentColor" stroke-width="1.25"/>`;
                }).join('')}
              </svg>
              ${map.nodes.map((o) => scNode(o, here)).join('')}
            </div></div>
          </div>
          ${scInspector(here, st)}
        </div>
      </section>`;
  };

  function scNode(o, here) {
    const pos = `left:${SC_U(o.x)};top:${SC_U(o.y)};width:${SC_U(SC.w)};height:${SC_U(SC.h)}`;
    if (o.more) {
      return `
        <button class="set2-sc-n is-more" type="button" style="${pos}"
                data-sc-more="${esc(o.more)}">+${o.hidden} more</button>`;
    }
    const n = o.n;
    const kids = (n.kids || []).length;
    /* Dashed means the tenancy STOPS here — not that it is collapsed. A client
       with no products and a product with no teams are the same fact about the
       world, and the one thing this map is for is making it visible. */
    const aimy = n.type === 'Ours' || n.type === 'Agent';
    /* Dashed says "the tenancy stops here", which is a fact about a client
       with no products. An agent has nothing under it by construction and
       always will, so drawing it as an unfinished branch would report a
       problem that does not exist. */
    const empty = !kids && !aimy;
    return `
      <div class="set2-sc-w" data-sc-w="${esc(n.id)}" style="${pos}">
        <button class="set2-sc-n${here.id === n.id ? ' is-on' : ''}${empty ? ' is-empty' : ''}${
          aimy ? ' is-aimy' : ''}${o.dim ? ' is-dim' : ''}"
                type="button" data-sc-node="${esc(n.id)}"
                aria-current="${here.id === n.id ? 'true' : 'false'}"
                aria-label="${esc(n.name)}, ${esc(n.type)}${
                  empty ? ', nothing under it' : ''}">
          <span class="set2-sc-nn">${esc(n.name)}</span>
        </button>
        ${o.rolled ? `
          <button class="set2-sc-roll" type="button" data-sc-exp="${esc(n.id)}"
                  aria-label="Open ${esc(n.name)}">${o.rolled}${I.caret}</button>` : ''}
        ${o.open && o.depth >= 3 ? `
          <button class="set2-sc-roll is-open" type="button" data-sc-exp="${esc(n.id)}"
                  aria-label="Close ${esc(n.name)}">${I.caret}</button>` : ''}
      </div>`;
  }

  /* ── The inspector ──
     What this node IS, and what depends on it. It does NOT list people: that
     is People's page and it answers the question properly, split by whether a
     grant is revocable here. A count and a way in is the honest amount for a
     map to carry — see the boundary note over there. */
  function scInspector(n, st) {
    const fx = scFacts(n);
    const path = pathTo(n.id);
    const kids = (n.kids || []).length;
    const reach = fx.people.here.length + fx.people.up.length;

    return `
      <aside class="set2-sc-insp" aria-label="About ${esc(n.name)}">
        <p class="set2-sc-path">${path.slice(0, -1).map((a) =>
          `<button class="set2-sc-crumb" type="button" data-sc-node="${esc(a.id)}">${esc(a.name)}</button>`)
          .join('<span class="set2-scope-s">&rsaquo;</span>')}</p>
        <h2 class="set2-sc-t">${esc(n.name)}</h2>
        <p class="set2-sc-type">${esc(n.type)}</p>

        ${kids
          ? `<p class="set2-sc-sub">${kids} direct${
              fx.leaves !== kids ? ` · <b class="set2-num">${fx.leaves}</b> addressable below` : ''}</p>`
          : `<p class="set2-sc-sub is-empty">Nothing under it yet.</p>`}

        <div class="set2-sc-facts">
          <button class="set2-sc-fact" type="button" data-sc-people="${esc(n.id)}">
            <span class="set2-sc-fn">People who reach it</span>
            <span class="set2-sc-fv set2-num">${reach}</span>
            ${I.chev}
          </button>
          <button class="set2-sc-fact" type="button" data-sc-skills="${esc(n.id)}">
            <span class="set2-sc-fn">Skills that land here</span>
            <span class="set2-sc-fv set2-num${fx.skills.length ? '' : ' is-zero'}">${fx.skills.length}</span>
            ${I.chev}
          </button>
          <div class="set2-sc-fact is-flat">
            <span class="set2-sc-fn">Connections</span>
            <span class="set2-sc-fv set2-num${fx.conns.length ? '' : ' is-zero'}">${fx.conns.length}</span>
          </div>
        </div>

        ${fx.people.up.length ? `
          <div class="set2-sc-inh">
            <div class="set2-sc-ih">Inherited from above</div>
            ${fx.people.up.slice(0, 4).map((x) => `
              <div class="set2-sc-ir">
                <span class="set2-sc-in">${esc(x.p.name)}</span>
                <span class="set2-sp-note">${esc(x.gs[0].g.r)} on ${esc(x.gs[0].at.name)}</span>
              </div>`).join('')}
            ${fx.people.up.length > 4
              ? `<div class="set2-sp-note">and ${fx.people.up.length - 4} more</div>` : ''}
          </div>` : ''}

        <p class="set2-sc-ft"><b class="set2-num">${LEAF_TOTAL}</b> addressable units across six
          levels. Nothing on this canvas edits the hierarchy.</p>
      </aside>`;
  }

  M.plan = () => `
    <section class="set2-sec">
      <div class="set2-sec-h"><h2 class="set2-sec-t">On your plan</h2></div>
      <div class="set2-rows">${MODULES.filter((m) => !m.tier).map((m) => row({
        ico: I.doc, name: m.name, end: pill('is-ok', 'Included')
      })).join('')}</div>
    </section>
    <section class="set2-sec">
      <div class="set2-sec-h"><h2 class="set2-sec-t">Available</h2></div>
      <div class="set2-rows">${MODULES.filter((m) => m.tier).map((m) => row({
        ico: I.doc, name: m.name, locked: true, end: pill('is-mute', m.tier)
      })).join('')}</div>
      <div class="set2-tier"><span>Prices pending commercial input.</span>
        <span class="set2-tier-end"><button class="btn btn-brand btn-sm" type="button">Talk to us</button></span></div>
    </section>`;

  /* ── The list ── */
  /* ══ FIVE FACETS OF ONE CONNECTION ═════════════════════════════════════
     A product plus a CRM is a CONNECTION, and Config, Sync, Failures,
     Knowledge enablement and APIs are five things you do to one. The console
     modelled this as unrelated sections scoped by two dropdowns that sat in
     different places and meant different things — a product picker in the page
     chrome and a CRM picker in a section header, with a third disabled copy of
     the product inside the sync form.

     Here the scope is ONE control in the module header, and it is shared state
     (`?conn=`). Moving from Config to Sync cannot silently re-point you at a
     different connector, which was the real objection to separating them.

     With nothing picked you get the list, headed by what you are about to do
     with it. Nobody meets an empty page and nobody meets a page scoped to
     something they did not choose. */

  /* ── The scope, as one control in the chrome ──
     Picked once and carried. It reads as a sentence about where you are, with
     exactly one thing in it you can change — which is the shape the design
     uses and the reason nothing below it has to ask again. */
  /* ── THE CONNECTOR COUNT AND THE HEALTH PILL ARE GONE FROM THE CHROME ──
     "2 connectors · 1 not connected" rode the scope bar on all four pages that
     use it. Removed from Dynamic fields first, then from the rest, on the same
     test applied page by page.

     It could not name the connector. That is the whole case against it: a red
     pill saying one of two is down, on a page whose own connector picker lists
     BOTH BY NAME WITH THEIR HEALTH AS THE CAPTION (see `data-crm-pick`), warns
     you about something the page states better two inches away — and states it
     in the one place you cannot act on it.

     Page by page: on Dynamic fields it sat over a table of fields that were all
     fine and read as a warning about them. On Sync every run in the history is
     tagged with its connector and its outcome, and `Test sync` is right there.
     On Data relevance the rows ARE the connectors, each named, and a retention
     threshold does not care whether a token is live. On Enablement the rail
     already says "1 endpoint down" with a Reconnect beside it, which is the
     same fact carrying the action this pill never had.

     The `No products connected` case stays. That one is not a count, it is the
     reason the page below is empty. */
  /* ── AND THE THIRD LEVEL, WHICH WAS ALREADY THE SCOPE ──
     `?crm=` has been module-wide state since Config and Sync merged: it picks
     which connector's fields the mapping table shows, which connector's
     criteria the trigger form edits, and which one Run sync starts. It was
     spelled out twice in two section headers and nowhere in the chrome, so the
     page had two pickers for one fact and no line saying where you were
     standing — the exact defect the client and product pair was fixed for.

     It is called DATA SOURCE rather than CRM because two of the five are not
     CRMs and never were: a website crawl and a folder of uploaded files answer
     for this product too. The console names the same axis the same way, and an
     axis with two names is two axes to everybody except the person who built
     it.

     The bar reads whose it is, what it answers for, and where that came from —
     Client › Product › Data Source — narrowing left to right, which is the
     order the console's filter row puts the same three in. */
  function prodScope(st) {
    const client = clientOf(st);
    const prod = prodOf(st);
    const src = prod ? crmOf(st) : null;
    const many = prod ? connsOf(prod).length > 1 : false;
    return `
      <div class="set2-scope">
        <button class="set2-scope-pick" type="button" data-client-pick aria-haspopup="menu"
                aria-label="Choose a client">
          <span class="set2-scope-k">Client</span><b>${esc(client)}</b>${I.down}
        </button>
        <span class="set2-scope-s">&rsaquo;</span>
        ${prod
          ? `<button class="set2-scope-pick" type="button" data-prod-pick aria-haspopup="menu"
                     aria-label="Choose a product">
               <span class="set2-scope-k">Product</span><b>${esc(prod)}</b>${I.down}
             </button>`
          : pill('is-mute', 'No products connected')}
        ${/* One data source is stated, not offered. A picker with a single
              option is a control that cannot be used, and the level still has
              to READ — dropping it entirely would make the bar's shape depend
              on how many connectors a product happens to have. */ ''}
        ${src ? `<span class="set2-scope-s">&rsaquo;</span>
          ${many
            ? `<button class="set2-scope-pick" type="button" data-crm-pick aria-haspopup="menu"
                       aria-label="Choose a data source">
                 <span class="set2-scope-k">Data Source</span><b>${esc(src.crm)}</b>${I.down}
               </button>`
            : `<span class="set2-scope-i">Data Source <b>${esc(src.crm)}</b></span>`}` : ''}
      </div>`;
  }

  /* ── THE BAR HAS TO MOVE ──
     A run is Running for 1400ms and then it is not. A bar that renders once
     and sits still for that whole window is a picture of progress, so this
     advances it — from the clock in slot 6, which the live run already
     records, against the same 1400ms the completion timer uses.

     It touches TWO NODES per run rather than calling `render()`: a full repaint
     forty times a second would rebuild the page under whatever the reader is
     doing, and this is the one thing on the surface that changes without
     anybody asking it to. It stops on its own when nothing is running, so
     there is no timer left behind on a page with no live sync. */
  /* Slower than the 1400ms it was. That number was chosen to get a prototype
     out of the way; a progress bar that fills in under a second and a half
     cannot be READ, and this one exists to be looked at. */
  const RUN_MS = 4000;
  let TICK = 0;
  function tickRuns() {
    if (TICK) return;
    TICK = setInterval(() => {
      let live = 0;
      CONNECTIONS.forEach((c) => c.runs.forEach((r, i) => {
        if (r[2] !== 'run' || !r[6]) return;
        live++;
        const at = Math.min(1, (Date.now() - r[6]) / RUN_MS);
        r[7] = Math.round((r[4] || 0) * at);
        const box = $(`[data-prog="${c.id}|${i}"]`);
        if (!box) return;
        const fill = $('.set2-prog-fill', box);
        if (fill) fill.style.width = Math.round(at * 100) + '%';
        box.setAttribute('aria-valuenow', String(r[7]));
        const n = box.parentNode && $('[data-prog-n]', box.parentNode);
        if (n) n.textContent = r[7].toLocaleString();
      }));
      if (!live) { clearInterval(TICK); TICK = 0; }
    }, 60);
  }

  /* ── Config ── Dynamic Context Fields, and how far back to read ── */
  function secMapping(c, st) {
    const k = mapCounts(c);
    return `
      <section class="set2-sec" id="st-fields">
        ${/* ── THE COUNTS SIT AT THE LEFT EDGE, THE ACTION AT THE RIGHT ──
              All of it was in `.set2-sec-end`, which carries `margin-left:
              auto` — and on this page the section's own `h2` is hidden, because
              a page with one section is titled by the page. So the whole group
              was pushed to the right against nothing, floating in the middle of
              a row whose left half was empty. What the section IS goes left;
              what it DOES goes right. */ ''}
        <div class="set2-sec-h is-bare"><h2 class="set2-sec-t">Fields</h2>
          <span class="set2-sec-lead set2-tally">
            ${/* The connector picker that used to sit here is the scope bar's
                  third level now. It was never scoping only this section —
                  `?crm=` is the same state the trigger form and Run sync read —
                  and a second control for module-wide state, in a section
                  header, taught that switching it changed one table. */ ''}
            <span class="set2-num"><b>${k.confirmed}</b> confirmed</span>

            ${k.unmapped ? `<span class="set2-num is-mute"><b>${k.unmapped}</b> not mapped</span>` : ''}
            ${k.broken ? `<span class="set2-num is-err"><b>${k.broken}</b> broken</span>` : ''}
            ${/* The sentence that stood under this row as `.set2-sub` — what an
                  AiMY field reads from, and what a subfield is. Two facts you
                  need once and then never again, taking two lines above the
                  table forever. Same move as the owner tabs and precedence. */ ''}
            ${tip('mapTip', 'these fields', 'What each AiMY field reads from ' + c.crm
              + ' for this product. A subfield takes its value from the field above it.')}
          </span>
          <span class="set2-sec-end">
            <!-- THE PRIMARY ACTION SAT UNDER THE TABLE, which on a mapping of
                 any size means below the fold: eleven fields and their
                 subfields put "Add field mapping" off the bottom of the
                 screen, so the one thing you came to this section to do was
                 the one thing you had to scroll to find. -->
            <button class="btn btn-brand btn-sm" type="button" data-add-field>Add field</button>
          </span></div>
        <div class="set2-map">
          <div class="set2-map-hd"><span>AiMY field</span><span>${esc(c.crm)} key</span><span></span></div>
          ${c.maps.length ? mapBranch(c, c.maps, '', 0, null)
            : `<div class="set2-empty"><b>No fields yet</b>Add the first thing you want ${esc(c.crm)} to answer for this product.</div>`}
        </div>

        ${k.broken ? `<div class="set2-note is-err" style="margin-top:0.5rem">${k.broken} path no longer exists in ${esc(c.crm)}. A mapped field that is gone reads as empty, and an empty field answers as though the data were missing rather than misrouted.</div>` : ''}
      </section>`;
  }

  /* Was an inline sentence with the input embedded in it — "Read records from
     the past [30] days" — which reads beautifully once and cannot be scanned
     at all beside five more of its kind. It is the canonical settings row now:
     what the thing is on the left, what it is set to on the right. */
  /* ── ONE SCOPE PER SECTION, AND IT IS THE PAGE'S UNLESS IT CANNOT BE ──
     This took `crmOf(st)` -- the connector the FIELDS picker happens to be
     pointing at -- and rendered its `window` as a page-level setting. On a
     product with two connectors that meant three wrong things at once: the
     number shown belonged to one of them, editing it reached only that one,
     and changing the Fields picker silently changed what this section said
     without anything on screen moving.

     A product is the page's scope. A CRM is the Fields section's scope, and
     only that section's, because the only thing that genuinely differs
     between two connectors is what their fields are called. How far back to
     read is a question about answering, which the product does once.

     So this reads every connector on the product. Where they agree there is
     one number; where they do not, the disagreement is the news and the
     control says so rather than picking a winner. */
  /* ── DATA RELEVANCE RANGE ──
     Built to the frame: the section's own title and sentence, the label
     "Retrieve data from the past:", and ONE control carrying the number and
     its unit together. It was a bare number box with a "days" suffix beside
     it, which reads as two things to set instead of one thing to pick.

     A select, not free text: the horizons that matter are a short list, and
     typing 1..3650 into a box invites a number nobody meant. The product-level
     scope stays -- this is a question about answering, which the product does
     once, so it reads every connector and says so when they disagree. */
  const RELEVANCE = [7, 14, 30, 60, 90, 180, 365];

  /* ── DAYS, AS THE SYSTEM'S OWN SELECT ──

     Both of this page's sections ask for a number of days and each had reached
     for a different platform control: a native `<select>` on the range and a
     `<input type="number">` on the threshold. Two shapes for one question, and
     neither of them ours — a native select paints its own list in the OS's
     colours and a number spinner puts two 8px arrows inside the field, which
     is the sliver of chrome in the screenshot that started this.

     `.v2-dropdown` is the design system's only select control, and it already
     carries what a custom listbox owes: keyboard navigation, typeahead, focus
     management, and the ARIA that makes it announce as a listbox. Nothing here
     re-implements any of that — this builds the markup its controller expects
     and listens for the `dd:change` it emits.

     A THRESHOLD BECOMES A CHOICE. The retention field took any integer from 1
     to 3650. In practice a retention policy is chosen from a shortlist, not
     dialled in, and the free number was buying arbitrary precision at the cost
     of a control nobody could use with a keyboard without also being able to
     see a spinner. The list is the same one the range uses, because "how long
     do we keep this" and "how far back do we read" are measured on one scale. */
  function daysDD(value, attr, label) {
    const opts = RELEVANCE.indexOf(value) > -1
      ? RELEVANCE : RELEVANCE.concat([value]).sort((x, y) => x - y);
    return `<div class="v2-dropdown set2-dd" ${attr}>
      <button class="v2-dropdown-btn" type="button" aria-haspopup="listbox"
              aria-expanded="false" aria-label="${esc(label)}">
        <span class="dd-label-text">${value}</span>
        ${I.down}
      </button>
      <div class="v2-dropdown-panel" role="listbox">
        ${opts.map((d) => `<div class="v2-dropdown-option${d === value ? ' selected' : ''}"
          role="option" aria-selected="${d === value}" data-value="${d}">${d}</div>`).join('')}
      </div>
    </div>`;
  }

  /* ── ONE CONTROL PER CONNECTOR, LIKE THE SECTION BELOW IT ──

     This was a single select governing every connector at once, on the
     reasoning that "how far back to read" is a question the PRODUCT answers
     once. Two rewrites tried to make that work and both failed on the same
     rock: the connectors in the fixture disagree, so the one control had no
     honest value to show. First it showed `Math.min` and drew a change nobody
     had asked for; then it showed "Mixed", which is a control admitting it
     cannot answer its own question and putting the reader in front of a
     dropdown whose only real option is "overwrite both".

     A range IS per connector — the model has always stored it that way — and
     Trigger delete directly below has had one threshold per CRM from the
     start. So this is that: same card, same row, same control slot, same unit.
     Two sections that ask "how much history" answer it in one shape, and a
     disagreement between connectors stops being an exception the layout has to
     apologise for. It is just two rows with two values.

     The middle column is the consequence, where Retention puts its record
     count: the date the range actually reaches back to. A number of days is a
     setting; the date is what it means. */
  function secWindow(st) {
    const list = connsOf(prodOf(st));
    if (!list.length) return '';
    return `
      <section class="set2-sec" id="st-window">
        <div class="set2-sec-h"><h2 class="set2-sec-t">Data relevance range</h2></div>
        <div class="set2-sub">How far back AiMY reads when it answers from ${esc(prodOf(st))}, per data source.</div>

        <div class="set2-ret-card">
          ${list.map((c) => `
            <div class="set2-ret-row set2-win-row">
              <span class="set2-ret-n">${esc(c.crm)}</span>
              <span class="set2-ret-says">${windowSays(c)}</span>
              <span class="set2-ret-c">
                ${daysDD(c.window, `data-window="${esc(c.id)}"`,
                    'How far back to read from ' + c.crm + ', in days')}
                <span class="set2-set-u">days</span>
              </span>
            </div>`).join('')}
        </div>

        ${/* It deletes nothing. That is Trigger delete, further down this page,
              and the two are the settings most often confused for each other —
              so the reference names the heading it points at. */ ''}
        <p class="set2-fine">Reading only. Nothing is removed here — that is
          <b>Trigger delete</b>, below.</p>
      </section>`;
  }

  /* The one sentence a range gets to say about itself, in the slot Retention
     uses for "2,105 records would go". A count is not available here — nothing
     in the model knows how many records fall inside a window — and the date it
     reaches back to is the honest equivalent: it is what the number MEANS,
     computed rather than restated. */
  function windowSays(c) {
    const d = new Date();
    d.setDate(d.getDate() - c.window);
    return 'reads back to <b>' + esc(d.toLocaleDateString('en-GB',
      { day: 'numeric', month: 'short', year: 'numeric' })) + '</b>';
  }

  /* The single sentence a retention threshold gets to say about itself. Both
     the initial render and every keystroke go through here, so the figure on
     the row is by construction the figure in the dialog. */
  function retentionSays(r) {
    const gone = wouldDelete(r);
    /* One line. At 14px the two-sentence version wrapped mid-clause and made
       the row taller than the control it describes -- and "fewer days deletes
       more" is a rule you watch happen as you type, not one you need told. */
    return gone
      ? '<b class="set2-num is-err">' + gone.toLocaleString() + '</b> record'
        + (gone === 1 ? '' : 's') + ' would go'
      : 'Nothing this old yet';
  }

  const RETENTION = [
    { id: 'freshdesk', name: 'Freshdesk', days: 90, matched: 4210,
      affects: [['Support', 'loses grounding for tickets before the threshold'],
                ['Triage an inbound ticket', 'answers from a shorter history'],
                ['FileBound Support', 'next sync re-reads only what remains']] },
    { id: 'teamsupport', name: 'TeamSupport', days: 90, matched: 1180,
      affects: [['Support', 'loses grounding for tickets before the threshold'],
                ['Draft a refund response', 'loses the older refund precedents it cites']] },
    { id: 'confluence', name: 'Confluence', days: 180, matched: 1814,
      affects: [['Policies', 'loses superseded revisions of the pages it grounds on'],
                ['Answer a policy question', 'can no longer show what a rule used to say']] },
    { id: 'web', name: 'Website crawl', days: 180, matched: 2215,
      affects: [['Marketing', 'loses crawled pages that have since changed'],
                ['FileBound Support', 'the crawl is blocked, so nothing replaces what goes']] },
    { id: 'upload', name: 'Manual upload', days: 180, matched: 1617,
      affects: [['Marketing', 'loses collateral nobody re-uploads'],
                ['Manual upload', 'has no schedule, so a deleted file does not come back']] }
  ];
  /* Fewer days selects MORE records for deletion. Getting this backwards is
     how a retention control becomes an incident. */
  const wouldDelete = (r) => Math.max(0, Math.round(r.matched * (180 - r.days) / 180));

  /* ══ THE MAPPING TREE ══════════════════════════════════════════════════
     A field can carry children whose values come from inside its own. The
     depth is real information — "Email domain" indented under "Email address"
     says the domain comes OUT of that email, and if you re-point the email the
     domain follows. Flattened into two sibling paths, that relationship is
     gone and nothing stops them drifting apart.

     ── THE ONE THING THAT MAKES THIS EASY ──
     One search, not a walk. The console picks a path one level at a time —
     `requester`, menu, `organization`, menu, `domain` — three decisions to
     name one thing, with nothing on screen to tell you whether you chose
     right until all three are made. Here the whole schema is flat and
     searchable, every result carries the values it actually returns, and
     picking is one decision you can check before you commit to it. */

  /* Which Advanced disclosures are open. Not URL state: it is a peek at a
     row, not a place, and restoring six open disclosures on load would be
     restoring somebody else's morning. */
  const ADV = new Set();

  function mapRow(c, m, addr, depth, samples, canSub) {
    const derived = !!m.derive;
    const res = derived ? { ok: true } : walkPath(c.crmId, m.path || []);
    const incomplete = !derived && res.ok
      && (!m.path || !m.path.length || keysAt(c.crmId, m.path).length > 0);

    let flag = '';
    if (!res.ok) flag = pill('is-err', 'Not in ' + c.crm);
    else if (m.state === 'unmapped') flag = pill('is-mute', 'Not mapped');
    else if (incomplete) flag = pill('is-warn', 'Incomplete');


    const cls = [!res.ok ? 'is-broken' : '', incomplete ? 'is-partial' : '',
                 m.state === 'unmapped' ? 'is-unmapped' : '',

                 /* `is-d1` / `is-d2` went with the tinted bands they named.
                    Depth is `--d` — a number the indent and the guide both
                    compute from — so a class per level was a second copy of
                    the same fact, and one that stopped at two. */
                 depth ? 'is-sub' : ''].filter(Boolean).join(' ');

    /* What the field is set to, as one control. Derived rows name the
       derivation instead of a path, because that is what they are. */
    const label = derived
      ? `<span class="set2-key-d">${esc(DERIVE[m.derive] ? DERIVE[m.derive].label : m.derive)}</span>
         <span class="set2-key-h">${esc(DERIVE[m.derive] ? DERIVE[m.derive].hint : '')}</span>`
      : (m.path && m.path.length
          ? m.path.map((s, j) => `<span class="set2-key-s${!res.ok && res.at === j ? ' is-bad' : ''}">${esc(s)}</span>`)
              .join('<span class="set2-key-dot">.</span>')
          : '<span class="set2-key-none">Search a field\u2026</span>');

    /* ── WHAT ADVANCED IS FOR, ON THIS FIELD ──
       It opened on any mapped row and showed both groups every time, so a
       plain text field like `ticket.subject` got a VALUE MAPPING heading over
       a sentence saying there was nothing to map, beside a button offering to
       resolve IDs on a field that has none. Two controls, neither of which
       could do anything, under a heading announcing the absence of news.

       The connector's schema already says which is which: `e` is a coded
       value, `id` is a reference. Advanced appears when one of them applies
       and shows only the half that does. On a string or a date there is
       nothing advanced about the field, so there is no Advanced. */
    /* Any row that resolves to a value has both facts to report. */
    const canAdv = !derived && res.ok && !incomplete;
    return `
      <div class="set2-map-row ${cls}" data-map="${esc(addr)}" style="--d:${depth}">
        ${/* A DRAFT ROW NAMES ITSELF WHERE IT LIVES.
              Adding a field opened a dialog to ask for one word, then closed
              it and drew the row somewhere else. The dialog interrupted
              nothing, protected nothing, and put the naming in a different
              place from the thing being named -- so you typed a name blind and
              found out afterwards where it landed.
              The row appears first, in its place in the list, with the field
              already focused. Enter keeps it, Escape drops it, and leaving it
              empty drops it too. */ ''}
        ${m.draft
          ? `<input class="set2-fld set2-map-name" data-newname="${esc(addr)}"
                    placeholder="Name this field\u2026" autocomplete="off"
                    aria-label="What this product calls this field">`
          : `<span class="set2-map-ctx">${esc(m.ctx)}</span>`}
        <span class="set2-map-mid">
          ${derived
            ? `<span class="set2-key is-derived">${label}</span>`
            : `<button class="set2-key" type="button" data-path="${esc(addr)}"
                       aria-label="Choose the ${esc(c.crm)} field for ${esc(m.ctx)}">${label}</button>`}
          ${/* ONE value, whole, and a count. Two never fit the 222px this
                column has -- "dana@nordwind..." and "ivo@tavol..." were each
                cut mid-address, and a truncated sample proves nothing about
                what the field returns. One that fits does. */ ''}
          ${/* Two raw values with a dot between them said nothing about what
                they were, and the row had no room to explain. They belong in
                the PICKER, where you are choosing between fields and the
                values are the thing that tells them apart. Once the choice is
                made the row does not need to keep proving it. */ ''}
        </span>
        ${/* Advanced moved OUT of the value cell. Stacked under the path and
              the samples it was a third line of near-identical weight, and it
              is not a third fact about the field — it is an action, so it
              belongs with the other actions. */ ''}
        <span class="set2-map-end">
          <!-- ONE WAY TO ADD A SUBFIELD, LABELLED, AND ALWAYS ON SCREEN.
               There were two, and neither read as a control. A bare "+" that
               only appeared on hover, for a field with no children yet — an
               icon with no word, invisible until you happened to be over the
               right row, and unreachable by touch. And a full-width rail after
               the children for a field that had some, which sat below the
               group it belonged to and looked like a line of text.
               Both are this: a word, in the row's own actions, on the field
               the subfield would hang under, whether or not it already has
               any. Adding the first child and the fourth is the same act. -->
          ${canSub ? `<button class="set2-map-plus" type="button" data-add-sub="${esc(addr)}"
                       aria-label="Add a subfield under ${esc(m.ctx)}">${I.plus} Subfield</button>` : ''}
          ${flag}
          ${canAdv ? `<button class="set2-adv${ADV.has(addr) ? ' is-open' : ''}" type="button" data-adv="${esc(addr)}"
             aria-expanded="${ADV.has(addr)}">Advanced${I.caret}</button>` : ''}
          ${false && res.ok && !incomplete
            ? `<button class="btn btn-ghost btn-sm" type="button" data-map-ok="${esc(addr)}">Confirm</button>` : ''}
          <button class="set2-x" type="button" data-map-del="${esc(addr)}"
                  aria-label="Remove ${esc(m.ctx)}">${I.trash}</button>
        </span>
      </div>`;
  }

  /* Value mapping and ID resolution, inline. They were chips opening a
     popover, which put the two things most likely to be WRONG about a mapping
     behind a click — a value map that says 5 means Closed is either right or
     it quietly mislabels every ticket, and you cannot tell without looking. */
  /* `e` enum -> the codes have names. `id` -> it points at a row that has
     one. Anything else -> the value is the answer. A node the person has
     already configured keeps its group even if the schema changes under it,
     or the setting would vanish with no way to turn it off. */
  /* The design shows one Advanced panel with BOTH groups in it, and I split
     them by field kind so that most rows got one group or none. That answered
     a complaint about a useless empty panel by deleting the thing the design
     asked for. The panel is one shape: value mapping, then ID resolution.
     What it will not do is open on a row with no resolved value behind it --
     unmapped, broken, or still pointing at a container -- because there the
     panel would be describing nothing. */


  /* ── ADVANCED IS TWO FACTS ──
     I gated these by the connector's field kind, twice, and both times the
     value mapping disappeared from the row that had one. The gate was me
     answering "this panel is empty on a plain string" by making the panel
     conditional, which is a rule the design does not have and which I could
     not keep correct.

     The design shows one panel with two headings, and under each heading what
     the system resolved. That is all this is. Nothing here is chosen by a
     person and nothing here is hidden by a condition, so there is no state to
     get wrong. */
  function advSection(c, m, addr, depth) {
    const pairs = m.values && m.values.length ? m.values : null;
    const isId = !!m.idres;
    return `
      <div class="set2-adv-bd" data-adv-for="${esc(addr)}" style="--d:${depth}">
        <div class="set2-adv-g">
          <div class="set2-adv-t">Value mapping</div>
          ${pairs
            ? `<div class="set2-adv-pairs">${pairs.map(([k, v]) => `
                <span class="set2-pair"><b class="set2-mono">${esc(k)}</b>&rarr;<span>${esc(v)}</span></span>`).join('')}</div>`
            : `<span class="set2-adv-none">None</span>`}
        </div>
        <div class="set2-adv-g">
          <div class="set2-adv-t">ID resolution</div>
          ${isId
            ? `<div class="set2-adv-pairs"><span class="set2-pair">Resolve ID &rarr; <span>Display name</span></span></div>`
            : `<span class="set2-adv-none">None</span>`}
        </div>
      </div>`;
  }

  /* Adding a subfield is adding a field that happens to sit under another
     one, so it is the same act: a draft row appears at the child's depth with
     its name focused. It was a popover offering four string transforms, which
     was a different interaction, a different vocabulary, and the only way to
     get a second or third child was to find the transform list again. */
  /* Nested groups stack their add rows, so two of these sit one above the
     other 21px apart -- close enough to read as the same button twice. Each
  /* Depth-first, so a child is always drawn directly under the field it comes
     from and the indentation means what it looks like it means. */
  function mapBranch(c, list, prefix, depth, parentSamples) {
    return list.map((m, i) => {
      const addr = prefix ? prefix + '.' + i : String(i);
      const samples = nodeSamples(c.crmId, m, parentSamples);
      /* Offered only where there is something to add AND a level to add it
         at. Both halves matter: an "Add subfield" that opens an empty picker
         is a dead end, and one that opens at level three is a promise the
         model will not keep. */
      /* Any field can hold subfields; only the level decides. The old gate
         asked whether a string transform applied to this value, so a field
         mapped to an object -- the case where subfields matter most -- offered
         none. */
      const canSub = canNest(depth) && !m.draft;
      /* ── NOTHING BETWEEN A GROUP AND THE NEXT FIELD ──
         An "Add subfield to X" rail was drawn after every group's children. It
         sat at the child's indent under the last child, so it read as another
         subfield until you got to the verb; two nested groups stacked two of
         them 21px apart; and it separated a group from the field below it with
         something that was neither. The act it offered now lives on the parent
         row, which is where the reader is looking when they decide a field
         needs breaking down. */
      return mapRow(c, m, addr, depth, samples, canSub)
        + (ADV.has(addr) ? advSection(c, m, addr, depth) : '')
        + mapBranch(c, m.kids || [], addr, depth + 1, samples);
    }).join('');
  }

  /* ── The picker ──
     Every leaf the connector has, ranked so the one you almost certainly want
     is first: an exact word match on the field's own name beats a partial
     match, which beats everything else. Values beside every row, because a
     path that resolves and returns the wrong column passes every other check
     there is. */
  function openPathPicker(anchor, c, addr) {
    const nd = nodeAt(c, addr);
    if (!nd) return;
    const words = nd.node.ctx.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    /* -- CONTAINERS ARE PICKABLE --
       Leaves only, said the old comment: "an object is a container, not a
       value, and offering one as a mapping is offering something that answers
       nothing." True of the mapping, false of the FLOW -- mapping Agent to
       `assignee` is how you then take `name`, `email` and `phone` out of it as
       subfields. With leaves only, nothing could ever hold a subfield that was
       not a string transform, so the third level had no way to exist.
       They are offered, and marked as what they are. */
    const all = allPaths(c.crmId).map((p) => {
      const s = samplesFor(c.crmId, p.path);
      const str = p.path.join('.').toLowerCase();
      const last = p.path[p.path.length - 1].toLowerCase();
      let score = 0;
      words.forEach((w) => { if (last === w) score += 10; else if (last.indexOf(w) >= 0) score += 5;
                             else if (str.indexOf(w) >= 0) score += 2; });
      if (s) score += 1;
      /* A container ranks below a leaf of equal match: most of the time the
         value IS the answer, and drilling in is the deliberate case. */
      if (p.kind === 'o') score -= 3;
      return { p: p, s: s, score: score, str: str };
    }).sort((x, y) => y.score - x.score);

    const rows = (q) => {
      const hits = all.filter((r) => !q || r.str.indexOf(q) >= 0);
      if (!hits.length) return `<div class="set2-pal-empty">No field matches <b>${esc(q)}</b>.</div>`;
      return hits.map((r) => `
        <button class="set2-pop-i is-path" type="button" data-pick-path="${esc(r.p.path.join('.'))}">
          <span class="set2-pop-n set2-mono">${r.p.path.map(esc).join('.')}</span>
          <span class="set2-pop-s">${r.p.kind === 'o'
            ? keysAt(c.crmId, r.p.path).length + ' fields inside'
            : (r.s ? r.s.slice(0, 2).map(esc).join(' \u00b7 ') : 'no values')}</span>
        </button>`).join('');
    };

    const p = popover(anchor, `
      <input class="set2-pop-f" type="search" placeholder="Search ${esc(c.crm)} fields\u2026"
             data-pop-f autocomplete="off" aria-label="Search fields">
      <div class="set2-pop-bd" data-pop-list>${rows('')}</div>`);
    if (!p) return;
    const f = $('[data-pop-f]', p); if (f) f.focus();
    p.addEventListener('input', (e) => {
      $('[data-pop-list]', p).innerHTML = rows(e.target.value.toLowerCase().trim());
    });
    p.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick-path]');
      if (!b) return;
      nd.node.path = b.getAttribute('data-pick-path').split('.');
      nd.node.state = 'confirmed';
      DIRTY.add('maps'); closePop(); render();
    });
  }

  /* Criteria read as a sentence, and every one of them narrows. The console
     shows the same chips with no conjunction stated anywhere, so whether two
     criteria mean AND or OR is left to the reader. */

  function criteriaEditor(c) {
    const join = c.join || 'all';
    return `
      ${/* The conjunction is a CONTROL, not a convention. Two filters meant AND
            by assumption before this, and nothing on screen said so, which is
            how a sync quietly pulls the wrong half of a corpus. */ ''}
      <div class="set2-joinbar">
        <span>Match</span>
        <span class="seg" role="group" aria-label="How filters combine">
          <button class="seg-btn${join === 'all' ? ' active' : ''}" type="button" data-join="all">All</button>
          <button class="seg-btn${join === 'any' ? ' active' : ''}" type="button" data-join="any">Any</button>
        </span>
        <span>of the following</span>
      </div>
      <div class="set2-crit" data-crit>
        ${c.criteria.length
          ? c.criteria.map((k, i) => `
              ${i ? `<span class="set2-crit-and">${join === 'all' ? 'and' : 'or'}</span>` : ''}
              <span class="set2-chip">${esc(k[0])} is <b>${esc(k[1])}</b>
                <button type="button" data-crit-del="${i}" aria-label="Remove ${esc(k[0])} filter">${I.x}</button>
              </span>`).join('')
          : '<span class="set2-crit-all">Every record. Add a filter to narrow it.</span>'}
        <button class="set2-add is-inline" type="button" data-crit-add>+ Filter</button>
      </div>`;
  }

  /* ── Setup checklist ──
     A new connection is a four-step job whose steps live on different parts of
     one page. Externalising the sequence, with an honest estimate per step,
     beats leaving a person to work out the order. It removes itself once done
     rather than becoming permanent furniture. */

  function previewRows(c, n) {
    const cols = c.maps.filter((m) => m.path.length && walkPath(c.crmId, m.path).ok
                                   && keysAt(c.crmId, m.path).length === 0);
    const depth = cols.reduce((d, m) => Math.max(d, (samplesFor(c.crmId, m.path) || []).length), 0);
    const rows = [];
    for (let r = 0; r < Math.min(n, depth || 0); r++) {
      rows.push(cols.map((m) => {
        const s = samplesFor(c.crmId, m.path);
        let v = s ? s[r % s.length] : null;
        /* Transforms are applied here too, or the preview would show the raw
           value while the agent receives the mapped one. */
        if (v && m.values) { const hit = m.values.filter((x) => x[0] === v)[0]; if (hit) v = hit[1]; }
        return v;
      }));
    }
    return { cols: cols, rows: rows };
  }

  /* ── Retention ──
     The console renders the most dangerous control on the whole surface as a
     bare number input beside a trash icon, under a red sentence saying the
     action cannot be undone. It never says how many records the number
     currently selects, so "90" and "9" look equally harmless.

     Here the threshold computes its own consequence, and the confirmation is
     graded by that consequence rather than by which page you are on: typing
     the connector's name is required only because the records are gone. */

  /* ── One connection, end to end ──
     Config and Sync were two doors onto one question: what we read from this
     connector, and when. Splitting them meant the field you just mapped and
     the run that would use it were on different pages, and neither page could
     answer "is this working" on its own.

     The order is the lifecycle: what the fields mean, how far back to read,
     what to pull, what broke, what happened, what gets pruned. */
  /* A client with nothing connected is a real state, not an error. It gets a
     page that says so and offers the one thing worth doing from here. */
  function noProducts(st) {
    const client = clientOf(st);
    const all = productsOfClient(client).length;
    return `
      <section class="set2-sec">
        <div class="set2-empty"><b>${esc(client)} has no connected products</b>${all
          ? all + ' product' + (all === 1 ? '' : 's') + ' exist under this client, and none of them reads from a CRM yet.'
          : 'This client has no products in the hierarchy yet.'}
          <button class="btn btn-brand btn-sm" type="button" style="margin-top:0.75rem">Connect a CRM</button></div>
      </section>`;
  }

  M.config = function (st) {
    if (!prodOf(st)) return noProducts(st);
    return pageBody(st);
  };

  /* ── THE SECTIONS, ADDRESSED BY NAME ──
     A page names the sections it composes and this resolves them. One table,
     so adding a page is a line in SUBPAGES and never a change here, and a page
     naming a section that does not exist fails loudly at the point of the
     typo rather than rendering a shorter page than intended. */
  const SECTION = {
    mapping:    (st) => secMapping(crmOf(st), st),
    window:     (st) => secWindow(st),
    retention:  (st) => secRetention(st),
    /* The CHOSEN connector, not the product's first. Trigger sync scopes to
       one connector now, so the section has to be handed the one its header
       names. */
    criteria:   (st) => secCriteria(crmOf(st), st),
    runs:       (st) => secRuns(st),
    apis:       (st) => M.apis(st),
    people:     (st) => secPeople(st),
    roles:      (st) => M.roles(st),
    scopes:     (st) => M.hierarchy(st),
    selling:    () => secSelling()
  };

  /* ── ONE SECTION, ONE TITLE ──
     Every page built from a single section said its own name twice: once as
     the page title and again, 40px below it, as the section head — "Dynamic
     fields" over "FIELDS". The section head
     earns its place on a page with two of them and is pure repetition on a
     page with one.

     Marked here rather than removed in each renderer, because the sections are
     shared: `retention` is a head worth having on the Data relevance page and
     would be the same repetition if it ever stood alone. What is redundant is
     the pairing, not the head, so the pairing is what carries the class. */
  function pageBody(st) {
    const pg = pageOf(st);
    if (!pg) return '';
    const out = pg.secs.map((k) => {
      const f = SECTION[k];
      if (!f) throw new Error('No section renderer named ' + k);
      return f(st);
    }).join('');
    return pg.secs.length > 1 ? out : `<div class="set2-solo">${out}</div>`;
  }

  /* ── Sync ── which records, when, what happened, and what gets pruned ── */
  /* ── TRIGGER SYNC ──
     Built to the frame: the criteria you are about to run with, the product
     and window they run against, and the two buttons that run them -- one
     block, because they are one act. It was three loose pieces under a heading
     called "Records", which named the noun rather than the job.

     The conjunction went with the frame's shape. Two chips side by side with a
     segmented All/Any control above them made the reader parse a rule before
     reading a filter; the heading states it once instead, and every chip after
     the first is joined by the word it means. */
  /* Every filter the connector can take, as one flat list of "Key: Value" --
     which is how a person thinks of them and how the frame shows them. */
  function critOptions(c) {
    const out = [];
    Object.keys(CRITERIA_VOCAB).forEach((k) =>
      CRITERIA_VOCAB[k].forEach((v) => out.push([k, v])));
    return out.filter((p) => !c.criteria.some((x) => x[0] === p[0] && x[1] === p[1]));
  }

  function critRows(c, q) {
    const hits = critOptions(c).filter((p) =>
      !q || (p[0] + ': ' + p[1]).toLowerCase().indexOf(q) > -1);
    if (!hits.length) return `<div class="set2-ta-none">Nothing matches ${esc(q)}.</div>`;
    return hits.slice(0, 8).map(([k, v]) => `
      <button class="set2-ta-i" type="button" data-crit-pick="${esc(k)}|${esc(v)}">
        <span class="set2-ta-k">${esc(k)}:</span><b>${esc(v)}</b>
      </button>`).join('');
  }

  function secCriteria(c, st) {
    const prod = prodOf(st);
    const r = c.range || ['', ''];
    return `
      <section class="set2-sec" id="st-records">
        ${/* ── ONE DATA SOURCE, AND THE BAR NAMES IT ──
              This section once read "TeamSupport · runs on all 2 connectors",
              and that is what the button did: one press, two syncs from one
              decision. But a sync IS per data source — each has its own
              criteria, its own window and its own credentials, and one can fail
              while the other succeeds.

              So it runs exactly the source the scope bar names, and the picker
              that used to sit in this header is that bar's third level. Sync
              history below stays UNSCOPED: what you want after a run is every
              run, which is why that table carries a source chip on every
              row. */ ''}
        <div class="set2-sec-h"><h2 class="set2-sec-t">Trigger sync</h2></div>
        <div class="set2-sub">Define the criteria a manual run reads with, then start it.
          Scoped to <b>${esc(c.crm)}</b>, the data source named in the bar above.</div>

        <div class="set2-card">
          <div class="set2-card-t">Sync criteria</div>
          ${/* A typeahead, not a menu behind a "+ Filter" button. You know the
                filter you want before you go looking for it, and typing "sol"
                is faster than opening a key list and then a value list. */ ''}
          <div class="set2-ta">
            <input class="set2-fld set2-ta-f" type="search" data-crit-q autocomplete="off"
                   placeholder="Add a filter \u2014 try Status or Form\u2026"
                   aria-label="Search filters to add" aria-expanded="false">
            <div class="set2-ta-list" data-crit-list hidden></div>
          </div>
          <div class="set2-crit" data-crit>
            ${c.criteria.length
              ? c.criteria.map((k, i) => `
                  ${i ? `<span class="set2-crit-and">and</span>` : ''}
                  <span class="set2-chip">${esc(k[0])}: <b>${esc(k[1])}</b>
                    <button type="button" data-crit-del="${i}" aria-label="Remove the ${esc(k[0])} filter">${I.x}</button>
                  </span>`).join('')
              : '<span class="set2-crit-all">No filter yet \u2014 every record matches.</span>'}
          </div>
        </div>

        <div class="set2-up" style="margin-top:0.875rem">
          <div class="set2-field">
            <label class="set2-lbl">Product</label>
            ${/* Fixed, and shown rather than hidden: a run belongs to the
                  product the page is scoped to, and offering it again would
                  be a second place to set the same thing. */ ''}
            <input class="set2-fld is-fixed" value="${esc(prod)}" readonly aria-readonly="true" tabindex="-1">
          </div>
          <div class="set2-field">
            <label class="set2-lbl">Date range</label>
            <div class="set2-range">
              ${/* ONE control for one value. See calPanel: two boxes each
                    opening the same range panel was one component pretending
                    to be two, and neither of them could say what it was. */ ''}
              <button class="set2-fld set2-range-d${r[0] || r[1] ? '' : ' is-empty'}${calOpen ? ' is-open' : ''}"
                      type="button" data-range-open aria-haspopup="dialog"
                      aria-expanded="${calOpen}" aria-label="The date range to sync">
                <span>${r[0] || r[1] ? esc(rangeLabel(r)) : 'Any dates'}</span>
                ${I.cal}
              </button>
              ${r[0] || r[1] ? `<button class="set2-x" type="button" data-range-clear aria-label="Clear the date range">${I.x}</button>` : ''}
              ${calOpen ? calPanel(r) : ''}
            </div>
            ${/* Under the dates, not under the whole row. It was full width at
                  the section's left edge, 288px from the field it describes. */ ''}
            ${/* No backwards-range error. The picker orders its own ends, so
                  the state that note described cannot be reached from here —
                  and a warning that can never fire is a warning nobody trusts
                  when a different one does. */ ''}
            <div class="set2-hint">Leave empty to resume from the last successful sync.</div>
          </div>
        </div>

        ${/* ── NO MATCH COUNT OVER THE BUTTONS ──
              It read "5,057 records match right now, of 17,050" — a figure
              recomputed on every keystroke in the criteria above it, sitting
              at the size of a headline over the two buttons that are the
              actual decision. Nobody presses Run sync BECAUSE the number is
              5,057; they press it because they set the criteria and want it
              run, and the run reports what it read when it is done.

              What is left is the row of actions, which is what the block was
              always for. */ ''}
        <div class="set2-blast">
          <span class="set2-blast-end">
            <button class="btn btn-ghost btn-sm" type="button" data-test>Test sync</button>
            <button class="btn btn-brand btn-sm" type="button" data-run>Run sync</button>
          </span>
        </div>
      </section>`;
  }

  /* The history is the PRODUCT's, because the run is. Every row names the
     connector it hit — two CRMs' runs in one undifferentiated list would make
     a Freshdesk failure look like a FileBound-wide outage. */
  function secRuns(st) {
    const list = connsOf(prodOf(st));
    const rows = [];
    list.forEach((c) => c.runs.forEach((r) => rows.push({ c: c, r: r })));
    /* ── NEWEST FIRST, ACROSS CONNECTORS ──
       It flattened connector by connector, so every TeamSupport run sat above
       every Freshdesk one whatever their times were -- and a run started just
       now on the second connector appeared below fixture rows from October.
       A history that is not in time order is not a history.

       Runs started in this session carry a real clock in slot 6; the fixture
       rows have none and keep the order they were authored in, underneath. */
    rows.sort((a, b) => (b.r[6] || 0) - (a.r[6] || 0));
    const bad = rows.filter((x) => x.r[2] === 'err').length;
    return `
      <section class="set2-sec" id="st-history">
        <div class="set2-sec-h"><h2 class="set2-sec-t">Sync history</h2>
          ${bad ? `<span class="set2-sec-end set2-tally"><span class="set2-num is-err"><b>${bad}</b> failed</span></span>` : ''}</div>
        <div class="set2-sub">Recent sync runs and their outcomes.</div>
        ${rows.length ? `
        <div class="set2-runs" role="table" aria-label="Recent sync runs">
          <div class="set2-run set2-run-hd" role="row">
            <span>Date</span><span>Criteria</span><span>Records</span><span>Status</span>
          </div>
          ${rows.map(({ c, r }) => {
            const state = r[2] === 'ok' ? 'is-ok' : r[2] === 'err' ? 'is-err' : 'is-info';
            return `
            <div class="set2-run${r[2] === 'err' ? ' is-failed' : ''}" role="row">
              <span class="set2-run-when set2-num">${esc(r[0])}</span>
              <span class="set2-run-crit">
                <span class="set2-chip is-type">${esc(c.crm)}</span>
                ${r[1].map((k) => `<span class="set2-chip">${esc(k[0])}: <b>${esc(k[1])}</b></span>`).join('')}
                ${/* ── The reason is no longer ON the row ──

                      It lived here as a code and a two-line clamp, and the
                      clamp is what gave it away: a reason cut mid-word — "on
                      every record in the windo…" — is not an explanation, it
                      is the shape of one. It also doubled the row's height, so
                      a table whose whole job is to be scanned had two rhythms
                      in it, one for runs that worked and one for runs that did
                      not.

                      A failed run IS a run and its row still says so — the
                      pill, and a way in underneath it. What broke, and what to
                      press about it, is one click away in a panel with room
                      for the whole sentence. */ ''}
              </span>
              ${/* EMPTY while running. The column is headed Records and means
                    what the run WROTE, which is not knowable until it stops —
                    a number here mid-run is a figure that will be wrong a
                    second later and never says so. The count that is moving
                    belongs to the bar, and lives beside it. */ ''}
              <span class="set2-run-n set2-num">${
                r[2] === 'run' ? '' : (r[4] ? r[4].toLocaleString() : '')}</span>
              <span class="set2-run-st">
                ${pill(state, r[3])}
                ${/* Not "Retry". That button was a no-op, and on two of the
                      three failures here it also named the wrong move —
                      `FIXES` says retrying a revoked token or a dead mapping
                      path cannot work. The row no longer guesses at the fix;
                      it opens the thing that knows it. */ ''}
                ${r[2] === 'err' && r[5] && r[5].why
                  ? `<button class="set2-why" type="button"
                             data-why="${esc(c.id)}|${c.runs.indexOf(r)}"
                             aria-haspopup="dialog"
                             aria-label="Why the run from ${esc(r[0])} failed">Why it failed</button>` : ''}
              </span>
              ${/* Spans the row rather than sitting in the status cell: the
                    thing in progress is the RUN, not its outcome, and a bar
                    the width of a pill cannot show a proportion. */ ''}
              ${r[2] === 'run' ? `
                <span class="set2-prog-row">
                  <span class="set2-prog" data-prog="${esc(c.id)}|${c.runs.indexOf(r)}"
                        role="progressbar" aria-label="Records read"
                        aria-valuemin="0" aria-valuemax="${r[4] || 0}" aria-valuenow="${r[7] || 0}">
                    <span class="set2-prog-fill" style="width:${
                      r[4] ? Math.min(100, Math.round(((r[7] || 0) / r[4]) * 100)) : 0}%"></span>
                  </span>
                  <span class="set2-prog-c set2-num"><b data-prog-n>${
                    (r[7] || 0).toLocaleString()}</b> / ${(r[4] || 0).toLocaleString()}</span>
                </span>` : ''}
            </div>`;
          }).join('')}
        </div>` : `<div class="set2-empty"><b>No runs yet</b>The first sync will appear here with what it matched.</div>`}
      </section>`;
  }

  /* Retention is a section of Sync rather than a rail item of its own: its
     threshold prunes exactly the records the runs above it pulled, and the two
     read as one decision when they are on one page. */
  /* ── Retention ──
     Per CRM, and EVERY CRM this product syncs — not just the one currently
     scoped. FileBound Support reads from both TeamSupport and Freshdesk, and a
     threshold page that showed you one of them would let you set 90 days on
     the connector you happened to be looking at while the other silently kept
     everything. The design lists both for exactly that reason. */
  /* ── TRIGGER DELETE ──
     Built to the frame: the title, the sentence under it, one irreversible-
     action banner, and a card of one row per CRM -- name, threshold, days,
     and the red trash that starts it.

     The row keeps the figure it would destroy. The frame does not show one,
     but the frame also does not have to survive somebody typing 10 into a box
     labelled days: this section's whole argument is that the number is
     judgeable before it is pressed, and a threshold that cannot state its own
     blast radius is a threshold nobody can judge. It sits in the space the
     frame leaves between the name and the control, and it is the same call to
     `retentionSays` the confirmation reads, so the two cannot disagree. */
  function secRetention(st) {
    const prod = prodOf(st);
    const crms = connsOf(prod).map((x) => x.crmId).filter((v, i, a) => a.indexOf(v) === i);
    const rows = RETENTION.filter((r) => crms.indexOf(r.id) > -1);
    if (!rows.length) return '';
    return `
      <section class="set2-sec" id="st-retention">
        ${/* "\u2014 older than X days" came off the heading. The X was the frame's
              placeholder for a value, and a shipped heading that still says X
              reads as unfinished; the sentence under it says the same thing
              in words and the rows say it in numbers. */ ''}
        <div class="set2-sec-h"><h2 class="set2-sec-t">Trigger delete</h2></div>
        <div class="set2-sub">Remove synced data older than a set threshold, per data source.</div>
        <div class="set2-danger" role="note">
          <span class="set2-danger-i" aria-hidden="true">${I.warn}</span>
          <span>This action is irreversible. Deleted records cannot be recovered.</span>
        </div>
        <div class="set2-ret-card">
          ${rows.map((r) => `
            <div class="set2-ret-row" data-ret-row="${esc(r.id)}">
              <span class="set2-ret-n">${esc(r.name)}</span>
              <span class="set2-ret-says">${retentionSays(r)}</span>
              <span class="set2-ret-c">
                ${daysDD(r.days, `data-ret="${esc(r.id)}"`,
                    r.name + ' retention threshold in days')}
                <span class="set2-set-u">days</span>
              </span>
              <button class="set2-ret-del" type="button" data-ret-go="${esc(r.id)}"
                      aria-label="Delete ${esc(r.name)} records older than ${r.days} days">${I.trash}</button>
            </div>`).join('')}
        </div>
      </section>`;
  }

  /* `M.sync` folded into `M.config` — the two were one question. `?m=sync`
     still resolves, through ALIAS. */

  /* ── Failures ══════════════════════════════════════════════════════════
     Promoted out of the runs table, because a red pill in a history row says
     that something broke and nothing else: not what, not why, not whether it
     is still broken, and not what to press.

     Unscoped by design when no connection is picked. "What is broken right
     now" is a question about the whole workspace, and answering it per
     connector would mean visiting three pages to find the one that is down.

     THE ACTION IS CHOSEN BY THE CAUSE. A retry on a revoked token is theatre,
     and a reconnect on a rate limit is worse than doing nothing. */
  const FIXES = {
    reconnect: ['Reconnect', 'The credential is dead. Retrying cannot help until it is replaced.'],
    retry:     ['Retry run', 'Transient. The same run should succeed now.'],
    mapping:   ['Open Config', 'The mapping points at something the connector no longer returns.']
  };

  /* ── The failure, where the failure is ──

     This was `secFailures`, a section of its own listing every broken run — and
     it had been dead code since the runs table absorbed it. What the absorption
     kept was the sentence; what it dropped was everything that made the
     sentence actionable: which fix the CAUSE calls for, why that one and not
     another, how many records went missing, and how many runs have failed the
     same way in a row. The row inherited half a Failures section and a Retry
     button that did nothing.

     So the card comes back, per run, anchored to the row it is about. Same
     markup it always had — `.set2-fail*` is styled for exactly this — with the
     code as the panel's title, which is the one place somebody would copy it
     from for a support ticket. It renders nothing when nothing is broken by
     construction now: there is no trigger on a run that worked. */
  function openFailPop(anchor, c, r) {
    const f = r[5];
    const [label, note] = FIXES[f.fix] || FIXES.retry;
    const pop = popover(anchor, `
      <div class="set2-fail" role="dialog" aria-label="Why the run failed">
        <div class="set2-fail-hd">
          <span class="set2-fail-w">${esc(c.product)} <span class="set2-scope-s">&rsaquo;</span> ${esc(c.crm)}</span>
          <span class="set2-fail-when set2-from">${esc(r[0])}</span>
        </div>
        ${pill('is-err', f.code || 'FAILED')}
        <p class="set2-fail-why">${esc(f.why)}</p>
        <p class="set2-fail-note">${esc(note)}</p>
        <div class="set2-fail-ft">
          <span class="set2-fail-n set2-num">${f.affected
            ? f.affected.toLocaleString() + ' records read then dropped'
            : 'Nothing was read'}</span>
          ${f.runs > 1 ? `<span class="set2-from">${f.runs} runs in a row</span>` : ''}
          <span class="set2-fail-do">
            <button class="btn btn-brand btn-sm" type="button"
              ${f.fix === 'mapping' ? `data-fail-go="${esc(c.id)}"` : 'data-fail-fix'}>${esc(label)}</button>
          </span>
        </div>
      </div>`);
    pop.classList.add('is-wide');
    const btn = pop.querySelector('.btn');
    if (btn) btn.focus();
    return pop;
  }

  /* ── Knowledge enablement ══════════════════════════════════════════════
     The workflow, not the credential. What the console puts under this
     heading is a URL and a token, which is an ENDPOINT — that is APIs, one
     rail item down.

     THE ENRICHMENT PAGE STOOD HERE and was removed at Nour's request. It was
     the other half of this module: four switches saying what enrichment was
     allowed to read, with what each had produced beside it. Its fixture
     (`ENABLE`), its section, its search entries and its toggle handler went
     with it, so nothing is left addressing a page that no longer renders.
     Enablement now carries one page, Webhook settings. */
  /* `pageBody` walks the current SUB-page's sections and returns '' when the
     module has none — which this one no longer does. It names its one section
     directly, in the same `.set2-solo` wrapper pageBody gives a single-section
     page, so the rendered result is what the sub-page produced. */
  M.webhooks = function (st) {
    if (!prodOf(st)) return noProducts(st);
    return '<div class="set2-solo">' + SECTION.apis(st) + '</div>';
  };

  /* ── APIs ══════════════════════════════════════════════════════════════
     The endpoint and the secret that reaches it. Split out of the console's
     "Knowledge Enablement Webhook Settings" because a switch and a credential
     want different confirmations: one is reversible by pressing it again, the
     other invalidates every caller the moment it is pressed. */
  /* One endpoint per DATA SOURCE, which is what the design says and what the
     grain actually is: enrichment is triggered against a connector, so a
     product with two connectors has two endpoints and two secrets. Stacked on
     one page rather than behind a picker, because the question people arrive
     with is "which of these is live", and a picker answers it one at a time. */
  /* ── KNOWLEDGE ENABLEMENT WEBHOOK SETTINGS ──
     To the frame: the title, the sentence under it, one blue note saying who
     calls these, then a labelled row per credential -- field, a help affordance
     inside it, and its own Save.

     Per-field Save rather than a page-level one. Settings here apply as they
     are made, and these two are the exception that proves it: a URL or a token
     half-typed is not a setting, it is a keystroke, so each field commits when
     you say so and nothing else on the page waits for it.

     Still one section per connector, because a product with two connectors has
     two endpoints and two secrets, and the frame's "per data source" says so. */
  /* ── ONE SECTION, A GROUP PER CONNECTOR ──
     This rendered a full section per connector -- heading, the same sentence,
     the same blue note, then the two rows -- so a product with two connectors
     read the identical paragraph twice, 300px apart, with only the word
     "TeamSupport" or "Freshdesk" changed. The frame has ONE heading over this,
     and the frame is right: what differs between two connectors is two URLs
     and two tokens, and that is all that should repeat. The connector name
     becomes a sub-head over its own pair of rows; the spine still lands on
     each group by id, so nothing it pointed at has moved out of reach.

     THE SAVE SLEEPS. Four brand Save buttons sat on this page at rest, beside
     fields nobody had touched -- more primary actions than the page has
     primary acts, and none of them could say whether anything had changed.
     Each is quiet and inert until its field differs from what is stored,
     lights when it does, and goes back to quiet the moment it has saved. */
  M.apis = function (st) {
    if (!prodOf(st)) return '';
    const list = connsOf(prodOf(st)).filter((c) => !!ENDPOINTS[c.id]);
    if (!list.length) return '';
    const one = list.length === 1;
    const e0 = ENDPOINTS[list[0].id];
    return `
      <section class="set2-sec" id="st-webhooks">
        <div class="set2-sec-h"><h2 class="set2-sec-t">Webhooks</h2>
          ${/* A single connector has no group header, so its test sits beside
                the pill that is already up here for the same reason. */ ''}
          ${one ? `<span class="set2-sec-end">${pill(e0.last[1], e0.last[2])}${
            whTestBtn(list[0])}</span>` : ''}</div>
        <div class="set2-sub">Configure endpoints to activate the knowledge enrichment workflow for ${one ? 'this data source' : 'each data source'}.</div>
        <div class="set2-info" role="note">
          <span class="set2-info-i" aria-hidden="true">${I.info}</span>
          <span>These webhooks are called when knowledge enrichment is triggered from your side.</span>
        </div>
        ${list.map((c, i) => whGroup(c, i, !one)).join('')}
      </section>`;
  };

  /* ── TESTING AN ENDPOINT ──
     The page could say an endpoint was down and offer nothing to do about it
     but retype the token. A test is the one thing you want after editing a URL
     or rotating a secret, and it is the only way a never-called endpoint ever
     stops saying "Never called".

     It reports what is actually true rather than flattering the button: an
     endpoint whose last call was a 401 fails the test the same way, because
     pressing Test does not fix a revoked token. Anything else succeeds and
     stamps a fresh time, which is what turns `ks-teamsupport` from never-called
     into a live endpoint. */
  const WH_TESTING = new Set();

  function whTestBtn(c) {
    const busy = WH_TESTING.has(c.id);
    return `<button class="btn btn-ghost btn-sm set2-wh-test" type="button"
              data-wh-test="${esc(c.id)}"${busy ? ' disabled' : ''}
              aria-label="Test the ${esc(c.crm)} connection">${
              busy ? 'Testing…' : 'Test connection'}</button>`;
  }

  function whGroup(c, i, named) {
    const e = ENDPOINTS[c.id];
    const last = e.last[0]
      ? 'Last call: ' + e.last[0] + ' \u2014 ' + e.last[2]
      : 'Never called \u2014 live, but nothing has reached it yet.';
    /* The health was in the pill and only in the pill, which a selector cannot
       read. A quick action has to be able to find the endpoint that is down,
       so the group carries the same fact as a class. */
    const bad = e.last[1] === 'is-err' ? ' is-err' : e.last[1] === 'is-warn' ? ' is-warn' : '';
    return `
      <div class="set2-wh-grp${bad}" id="st-api-${esc(c.id)}">
        ${named ? `<div class="set2-wh-hd"><h3 class="set2-wh-t">${esc(c.crm)}</h3>${
          pill(e.last[1], e.last[2])}${whTestBtn(c)}</div>` : ''}
        <div class="set2-wh">
          <div class="set2-wh-row">
            <label class="set2-wh-l" for="apUrl${i}">Webhook URL</label>
            <div class="set2-wh-c">
              <span class="set2-wh-f">
                <input class="set2-fld set2-mono" id="apUrl${i}" value="${esc(e.url)}"
                       spellcheck="false" autocomplete="off" data-wh-in="${esc(c.id)}:url">
                <button class="set2-wh-help" type="button"
                        title="Where AiMY posts when enrichment runs for ${esc(c.crm)}"
                        aria-label="What this endpoint is for">${I.info}</button>
              </span>
              <button class="set2-wh-copy" type="button" data-copy="${esc(e.url)}"
                      aria-label="Copy the webhook URL">${I.copy}</button>
              <button class="btn btn-ghost btn-sm set2-wh-save" type="button"
                      data-wh-save="${esc(c.id)}:url" disabled>Save</button>
            </div>
            <div class="set2-wh-note">${esc(last)}</div>
          </div>

          <div class="set2-wh-row">
            <label class="set2-wh-l" for="apTok${i}">Auth token</label>
            <div class="set2-wh-c">
              <span class="set2-wh-f">
                <input class="set2-fld set2-mono" id="apTok${i}" type="password" value="${esc(e.token)}"
                       spellcheck="false" autocomplete="off" data-wh-in="${esc(c.id)}:token">
                <button class="set2-wh-help" type="button" data-reveal="apTok${i}" aria-pressed="false"
                        title="Show the token" aria-label="Show the token">${I.eye}</button>
              </span>
              <button class="set2-wh-copy" type="button" data-copy="${esc(e.token)}"
                      aria-label="Copy the auth token">${I.copy}</button>
              <button class="btn btn-ghost btn-sm set2-wh-save" type="button"
                      data-wh-save="${esc(c.id)}:token" disabled>Save</button>
            </div>
            ${/* Generating a replacement is not saving. It invalidates every
                  caller on their next request, so it keeps its confirmation.
                  The link itself is quiet: the dialog states the cost, and a
                  red link at rest on every connector was spending the alarm
                  colour on a thing nobody had pressed. */ ''}
            <div class="set2-wh-note">Last changed ${esc(e.rotated[0])} by ${esc(e.rotated[1])}.
              <button class="set2-lnk" type="button" data-rotate="${esc(c.id)}">Generate a new token</button></div>
          </div>
        </div>
      </div>`;
  }

  M.audit = () => `
    <section class="set2-sec">
      <div class="set2-sec-h"><h2 class="set2-sec-t">Audit trail</h2></div>
      <div class="set2-rows">${[
        ['Nour Wael', 'Edited skill “Draft a refund response”', '20m ago'],
        ['Ahmed Samy', 'Added exception on Client CXS', '3 Sep'],
        ['A. Mahfouz', 'Locked tone at Product level', '11 Aug']
      ].map((a) => row({ ico: I.user, name: a[0], d: a[1], locked: true,
        end: `<span class="set2-from">${esc(a[2])}</span>` })).join('')}</div>
      <div class="set2-tier">${I.lock}<span>Enterprise plan. You are seeing the last three entries.</span>
        <span class="set2-tier-end"><button class="btn btn-brand btn-sm" type="button">Talk to us</button></span></div>
    </section>`;

  /* ═══ THE SKILL FILE ═══
     A skill IS a file. The write form's three fields are its frontmatter and
     its body, which is what lets the upload route accept the same object the
     write route produces. Serialise and parse have to round-trip or the two
     routes are quietly making different things. */
  /* The file's vocabulary and the code's are not the same word. `manual` reads
     better in a switch; `on-demand` reads better in a file. Serialising the
     internal word made download -> upload -> download emit a DIFFERENT file
     from the one it took in, which is the round trip quietly failing while
     every screen still looked right. */
  const TRIGGER_FILE = { always: 'always', auto: 'automatic', manual: 'on-demand' };

  function toMarkdown(s) {
    return '---\n'
      + 'name: ' + (s.slug || s.id) + '\n'
      + 'description: ' + s.desc + '\n'
      + 'trigger: ' + TRIGGER_FILE[s.trigger] + '\n'
      + 'sources: [' + s.sources.join(', ') + ']\n'
      + 'agents: [' + (s.agents || []).join(', ') + ']\n'
      + 'products: [' + (s.products || []).join(', ') + ']\n'
      + '---\n\n'
      + '# ' + s.name + '\n\n'
      + s.body + '\n';
  }

  /* The other direction. Deliberately forgiving about shape and unforgiving
     about the two fields that decide whether the thing is a skill at all: a
     file with no `name` cannot be addressed and a file with no `description`
     cannot be matched on, so an automatic skill without one silently never
     fires. Both errors NAME the missing field -- "invalid file" tells the
     author nothing they can act on. */
  function parseSkillFile(text) {
    const m = String(text).replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) throw new Error('No YAML frontmatter. The file must open with a line of three dashes.');

    const meta = {};
    let key = null;
    m[1].split('\n').forEach((line) => {
      if (/^\s*#/.test(line) || !line.trim()) return;
      const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (kv) { key = kv[1]; meta[key] = kv[2].trim(); }
      /* A wrapped value: YAML continues a scalar on an indented line, which is
         how any description longer than a breath actually arrives. */
      else if (key && /^\s+\S/.test(line)) meta[key] += ' ' + line.trim();
    });

    ['name', 'description'].forEach((k) => {
      if (!meta[k]) throw new Error('Missing `' + k + '` in the frontmatter.');
    });

    const list = (v) => !v ? [] : v.replace(/^\[|\]$/g, '').split(',')
      .map((x) => x.trim()).filter(Boolean);
    const trig = (meta.trigger || 'automatic').toLowerCase().replace('on-demand', 'manual').replace('automatic', 'auto');

    /* The body is everything under the frontmatter, minus a leading H1 --
       that heading is the display name, not part of the instruction. */
    let body = m[2].replace(/^\s*\n/, '');
    const h1 = body.match(/^#\s+(.+)\n+/);
    let title = meta.name;
    if (h1) { title = h1[1].trim(); body = body.slice(h1[0].length); }

    /* `name:` is the SLUG -- the address an agent asks for, and the field two
       skills may collide on when their owners differ. It was returned as `id`,
       which conflated the address with the record's own key; and `targets` was
       still being returned long after reach became agents and products, so an
       uploaded file's reach went into a field nothing reads and both lists
       arrived empty. */
    return {
      slug: meta.name, name: title, desc: meta.description,
      trigger: TRIGGER[trig] ? trig : 'auto',
      sources: list(meta.sources),
      agents: list(meta.agents), products: list(meta.products),
      body: body.trim()
    };
  }

  /* Accepting an uploaded skill is the same act as creating one, so it lands
     in the same place with the same defaults rather than in a parallel list. */
  function acceptSkill(parsed) {
    /* An upload lands among YOUR skills, so it may only collide with your
       skills. Colliding with the organisation's is not an error -- it is the
       override, and the file arrives marked Overridden with the Precedence tab
       explaining why, which is more use than a refusal. */
    const dup = SKILLS.filter((x) => x.own === 'you' && nameKey(x) === parsed.slug.toLowerCase())[0];
    if (dup) throw new Error('You already have a skill addressed `' + parsed.slug + '`. Rename it, or edit that one.');
    const s = {
      /* The address may repeat across owners; the record's key may not. */
      id: uniqueId(parsed.slug), slug: parsed.slug, name: parsed.name,
      own: 'you', trigger: parsed.trigger, on: true,
      desc: parsed.desc, by: USER.name, when: 'just now', v: 1,
      sources: parsed.sources, body: parsed.body,
      /* A file naming neither arrives reaching nothing and says so in the
         list, which beats inventing a default agent for it. */
      agents: parsed.agents || [], products: parsed.products || []
    };
    SKILLS.push(s);
    return s;
  }

  function readSkillFile(file) {
    const err = $('#upErr');
    if (!/\.(md|markdown)$/i.test(file.name)) {
      if (err) err.textContent = 'Only .md is wired in this build. A .zip needs a server to unpack it.';
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      try {
        const s = acceptSkill(parseSkillFile(r.result));
        closeModal();
        patch({ m: 'skills', skill: s.id });
      } catch (ex) {
        if (err) err.textContent = ex.message;
      }
    };
    r.readAsText(file);
  }

  const EXAMPLE =
    '---\n'
    + '# The name is how the skill is addressed. Lower case, hyphens, no spaces.\n'
    + 'name: draft-refund-response\n'
    + '\n'
    + '# The description is what the agent MATCHES ON when trigger is automatic,\n'
    + '# so a vague one costs accuracy rather than tidiness. Say what the skill\n'
    + '# does and when to reach for it.\n'
    + 'description: Turn a refund question into a reply that cites the policy and\n'
    + '  flags the contested clause.\n'
    + '\n'
    + '# always    - applies to every turn. This is what an instruction is.\n'
    + '# automatic - the agent picks it, by matching the description above.\n'
    + '# on-demand - a person picks it.\n'
    + 'trigger: automatic\n'
    + '\n'
    + '# Which collections this skill may stand on. Leave empty for all of them.\n'
    + 'sources: [policies, support]\n'
    + '\n'
    + '# What it reaches. Any level of the hierarchy: a client, a business unit,\n'
    + '# a product, a team or one person. Empty means it reaches nothing and\n'
    + '# will never fire, which the interface will tell you about.\n'
    + 'targets: [interfax, kapost]\n'
    + '---\n'
    + '\n'
    + '# Draft a refund response\n'
    + '\n'
    + 'Everything below the frontmatter is the instruction itself. Write it the\n'
    + 'way you would brief a new colleague: what to do, in what order, what to\n'
    + 'refuse, and which source settles a disagreement.\n'
    + '\n'
    + 'Answer from the EU refund article first, and name it. If the Returns FAQ\n'
    + 'disagrees about what happens after activation, say the clause is contested\n'
    + 'rather than picking a side. Never quote a figure that is not in a cited\n'
    + 'source.\n';

  /* ═══════════════════════════════════════════════════════════════════════
     POPOVERS

     Anchored to the control they change, not centred over the page. GAPS 25
     records that the library has one dialog shape and it assumes the decision
     was already made before it opened. Picking a CRM key IS the decision, and
     it is a decision about one cell, so it belongs beside that cell.
     ═══════════════════════════════════════════════════════════════════════ */
  /* What opened the panel, so Escape can put focus back on it. */
  let POP_OPENER = null;

  /* ── A CHAINED POPOVER MUST NOT ANCHOR INTO THE ONE IT REPLACES ──
     `closePop()` runs first. So when `anchor` is a button INSIDE the panel
     being torn down — the kebab's "Grant a role", which opens the role picker
     — it is already detached by the time it is measured. `getBoundingClientRect`
     on a detached node is all zeros, both clamps below resolve to 8, and the
     panel lands in the top-left corner of the WINDOW with the row it belongs
     to five hundred pixels away. It is not a positioning bug, it is a
     lifetime one.

     A chain anchors to whatever opened the chain. */
  /* Split out of `popover` so the same maths runs on open AND on every scroll
     that follows — two copies would drift the moment either was tuned. */
  let POP_TRACK = null;
  /* Registered once, for the panel rather than for a particular popover: there
     is only ever one #setPop, so "is it open" is a question about the page. */
  const POP_LAYER = (window.AIMY_LAYERS || { add: function (x) { return x; } }).add({
    name: 'set2-pop',
    isOpen: function () { return !!document.getElementById('setPop'); },
    close: function () { closePop(); }
  });
  /* `rect` is optional and is how the scroll tracker avoids measuring the
     anchor twice per frame - it has already read the rect to decide whether the
     panel should still be open at all. */
  function placePop(p, anchor, rect) {
    const r = rect || anchor.getBoundingClientRect();
    const w = p.offsetWidth, h = p.offsetHeight;
    /* `documentElement.clientWidth/Height` is the layout viewport and is what
       `position: fixed` is measured against. `window.innerWidth` includes the
       scrollbar and, in an embedded or backgrounded frame, can report 0 --
       which made every clamp below evaluate against nothing and pushed the
       panel to the top-left corner. Guarded so a zero reading falls back to
       placing the panel under its anchor rather than somewhere arbitrary. */
    const vw = document.documentElement.clientWidth || w + 16;
    const vh = document.documentElement.clientHeight || r.bottom + h + 16;
    /* Flip up only when there is genuinely no room below AND there is room
       above, so a tall panel in a short viewport does not jump somewhere worse
       than where it started. */
    let top = r.bottom + 6;
    let flipped = false;
    if (top + h > vh - 8 && r.top - h - 6 >= 8) { top = r.top - h - 6; flipped = true; }
    p.style.top = Math.max(8, Math.min(top, vh - h - 8)) + 'px';
    /* ── RIGHT-ALIGN RATHER THAN SLIDE ──
       Left-aligned to the anchor and clamped, a menu opened from a control near
       the right edge slid left until it fit — ending up under the middle of the
       row with nothing connecting it to the button that opened it. A kebab at
       the end of a row gets a panel whose RIGHT edge meets its own, which is
       what makes it read as belonging to that button. The clamps stay as the
       last resort for a panel wider than the space either way. */
    const alignRight = (r.left + w > vw - 8);
    const left = alignRight ? r.right - w : r.left;
    p.style.left = Math.max(8, Math.min(left, vw - w - 8)) + 'px';
    /* ══ THE CORNER IT GROWS OUT OF ═══════════════════════════
       A panel that scales up from its own centre reads as arriving from
       nowhere. One that grows from the corner nearest the control that opened
       it reads as coming OUT of that control - which is the thing the panel is
       about, and the thing the reader is already looking at.

       The two decisions above have already worked out which corner that is;
       this only writes it down where the stylesheet can see it. */
    p.dataset.origin = (flipped ? 'bottom' : 'top') + '-' + (alignRight ? 'right' : 'left');
  }

  function popover(anchor, html, cls) {
    const old = document.getElementById('setPop');
    /* Whether this call comes from INSIDE the open panel decides everything
       below, so it is read once, before the anchor is reassigned. */
    const chained = !!(old && old.contains(anchor));

    /* ══ THE TRIGGER THAT OPENED IT CLOSES IT ══════════════════════
       Pressing a kebab twice used to close the panel and immediately build it
       again, so it never appeared to shut at all - and the button you opened a
       menu with is the first thing anybody presses to dismiss it.

       Only for a trigger OUTSIDE the panel. A control within it is chaining to
       the next step of the same decision, and that must still open. */
    if (!chained && old && POP_OPENER === anchor) { closePop(); return null; }
    if (chained) anchor = POP_OPENER || anchor;
    /* Placing against a node that is no longer in the document puts the panel
       in the corner, silently. Better to not open than to open somewhere that
       points at nothing — every caller reaches here through a control that is
       on screen, so this only fires when a repaint has moved it. */
    if (!anchor || !anchor.isConnected) { closePop(); return null; }
    closePop();
    POP_OPENER = anchor;
    const p = document.createElement('div');
    p.className = 'set2-pop' + (cls ? ' ' + cls : '');
    p.id = 'setPop';
    p.innerHTML = html;
    document.body.appendChild(p);
    placePop(p, anchor);

    /* ── IT STAYS ON THE ROW ──
       `position: fixed` places the panel against the VIEWPORT, so scrolling
       moved the row and left the menu behind — after half a screen it was
       sitting over somebody else's row, still listing the first person's
       roles. It is re-placed on every scroll and resize instead, and it
       listens in the CAPTURE phase because the page scrolls in an inner
       container rather than on the window.

       When the row it belongs to leaves the viewport the panel closes: there
       is nothing left to be attached to, and a menu pinned to the top edge
       pointing at something off-screen is worse than one that got out of the
       way. */
    /* ONE MEASUREMENT PER FRAME, NOT ONE PER EVENT.
       This listens in the capture phase on the window, so it fires for a scroll
       in ANY container on the page, and it ran the whole placement - six layout
       reads and two style writes - on every one of them. Worse, `p.offsetWidth`
       inside placePop read layout that the previous event's `style.top` write
       had just invalidated, forcing a synchronous reflow per event, during the
       one interaction where frames are most visible.

       Coalesced to a single run per frame, and the rect read here to decide
       whether to close is handed to placePop rather than read again. Passive,
       so the handler can never hold up the scroll it is following. */
    let trackQ = 0;
    POP_TRACK = () => {
      if (trackQ) return;
      trackQ = requestAnimationFrame(() => {
        trackQ = 0;
        const a = POP_OPENER;
        if (!a || !a.isConnected) { closePop(); return; }
        const b = a.getBoundingClientRect();
        const vh = document.documentElement.clientHeight || 0;
        if (b.bottom < 0 || b.top > vh) { closePop(); return; }
        placePop(p, a, b);
      });
    };
    /* closePop calls this so a frame already queued cannot run against a panel
       that has been removed. */
    POP_TRACK.cancel = () => { if (trackQ) cancelAnimationFrame(trackQ); trackQ = 0; };
    window.addEventListener('scroll', POP_TRACK, { capture: true, passive: true });
    window.addEventListener('resize', POP_TRACK, { passive: true });
    /* And it stands aside for anything else that opens. */
    if (window.AIMY_LAYERS) window.AIMY_LAYERS.closeAll(POP_LAYER);

    const f = p.querySelector('input');
    if (f) f.focus();
    return p;
  }
  function closePop() {
    const p = document.getElementById('setPop');
    if (p) {
      /* ══ THE ID GOES FIRST ═════════════════════════════════
         A chained popover - the kebab's "Grant a role", say - builds the next
         panel under the same id while this one is still leaving. Two nodes
         answering to one id is how the wrong one gets measured, re-placed, or
         removed. Dropping the id here makes the leaving panel unaddressable
         the instant it stops being the live one.

         Pointer events go with it: a panel on its way out must not be able to
         swallow the click that is opening the next thing. */
      p.removeAttribute('id');
      p.style.pointerEvents = 'none';
      const M = window.AIMY_MOTION;
      if (M && !M.reduced()) {
        p.classList.add('is-closing');
        M.after(p, () => { if (p.parentNode) p.parentNode.removeChild(p); });
      } else p.remove();
    }
    /* Both listeners go with the panel. A tracker left running against a
       removed node is a scroll handler firing on every frame for nothing. */
    if (POP_TRACK) {
      if (POP_TRACK.cancel) POP_TRACK.cancel();
      window.removeEventListener('scroll', POP_TRACK, true);
      window.removeEventListener('resize', POP_TRACK);
      POP_TRACK = null;
    }
    POP_OPENER = null;
  }

  /* `openSegPicker` stood here — the level-by-level walk through the schema.
     `openPathPicker` replaced it: one search over every leaf, with the values
     each one returns, so choosing is one decision you can check. */

  function openCritPicker(anchor, c) {
    const keys = Object.keys(CRITERIA_VOCAB);
    const p = popover(anchor, `
      <div class="set2-pop-bd">
        ${keys.map((k) => `<button class="set2-pop-i" type="button" data-ck="${esc(k)}"><span>${esc(k)}</span></button>`).join('')}
      </div>`);
    if (!p) return;
    p.addEventListener('click', (e) => {
      const k = e.target.closest('[data-ck]');
      if (k) {
        const key = k.dataset.ck;
        p.innerHTML = `<div class="set2-pop-bd">${CRITERIA_VOCAB[key].map((v) =>
          `<button class="set2-pop-i" type="button" data-cv="${esc(v)}"><span>${esc(v)}</span></button>`).join('')}</div>`;
        p.dataset.key = key;
        return;
      }
      const v = e.target.closest('[data-cv]');
      if (v) { c.criteria.push([p.dataset.key, v.dataset.cv]); DIRTY.add('criteria'); closePop(); render(); }
    });
  }

  function confirmDelete(r) {
    const n = wouldDelete(r);
    MODAL = { kind: 'delete', r: r, n: n };
    paintModal();
  }

  /* ═══ MODALS ═══ */
  let MODAL = null;
  /* ══ A DIALOG THAT VANISHES WAS NEVER THERE ═════════════════════
     This emptied the host outright, so a modal - the surface this product uses
     for every consequential write - disappeared between one frame and the
     next, taking its scrim with it. Cancelling a delete looked identical to
     the page breaking.

     Out is faster than in, which is the asymmetry the token block argues for:
     what you are leaving should get out of the way, and the dialog has already
     said everything it had to say. */
  function closeModal() {
    const host = $('#setModal');
    const scrim = host && $('.set2-scrim', host);
    const M = window.AIMY_MOTION;
    if (!scrim || !M || M.reduced()) { MODAL = null; paintModal(); return; }
    scrim.classList.add('is-closing');
    M.after(scrim, () => { MODAL = null; paintModal(); });
  }
  function paintModal() {
    const host = $('#setModal');
    /* Guarded because the host is the shell's, not this file's. It was missing
       from console.html when settings moved here and every modal failed
       silently against a null — a throw would have been better than that, so
       the guard is loud rather than lenient. */
    if (!host) { if (MODAL) console.warn('AiMY settings: no #setModal host on this page'); return; }
    if (!MODAL) { host.innerHTML = ''; return; }
    /* ══ REPAINTING A DIALOG IS NOT OPENING ONE ════════════════════
       Several things repaint an open modal without closing it - a failed
       validation redrawing its own hints is the one that matters. The write
       below builds a NEW scrim and a NEW dialog, so both would play their
       entrance again: the backdrop would flash and the dialog would drop in,
       every time somebody submitted an incomplete form. Marked as seated, they
       simply are where they already were. */
    const wasOpen = !!$('.set2-scrim', host);
    host.innerHTML = MODAL === 'new' ? newSkillModal()
                   : MODAL === 'upload' ? uploadModal()
                   : MODAL.kind === 'preview' ? previewModal(MODAL.c)
                   : MODAL.kind === 'adduser' ? addUserModal()
                   : MODAL.kind === 'rmpeople' ? removePeopleModal(MODAL)
                   : MODAL.kind === 'rotate' ? rotateModal(MODAL)
                   : deleteModal(MODAL);
    if (wasOpen) {
      const sc = $('.set2-scrim', host);
      if (sc) sc.classList.add('is-seated');
    }
    const f = $('.set2-modal input, .set2-modal textarea', host);
    if (f) f.focus();
  }

  function previewModal(c) {
    const p = previewRows(c, 20);
    const n = matchCount(c);
    const k = mapCounts(c);
    return `
      <div class="set2-scrim" data-scrim>
        <div class="set2-modal is-wide" role="dialog" aria-modal="true" aria-labelledby="pvT">
          <div class="set2-modal-hd">
            <h2 class="set2-modal-t" id="pvT">What ${esc(c.crm)} would send</h2>
            <button class="set2-modal-x" type="button" data-close aria-label="Close">${I.x}</button>
          </div>
          <div class="set2-modal-bd">
            ${/* The criteria this dry run used, restated. The point of a test
                  is that it ran the SAME filter the button below it will, and
                  a preview that does not show what it filtered by asks to be
                  taken on trust. */ ''}
            <div class="set2-pv-crit">
              ${c.criteria.length
                ? c.criteria.map((k) => `<span class="set2-chip">${esc(k[0])}: <b>${esc(k[1])}</b></span>`).join('')
                : '<span class="set2-from">No filter — every record</span>'}
              ${(c.range && (c.range[0] || c.range[1]))
                ? `<span class="set2-chip">Range: <b>${esc(rangeLabel(c.range))}</b></span>` : ''}
            </div>
            ${p.cols.length ? `
              <div class="set2-pv-wrap">
                <table class="set2-pv">
                  <thead><tr>${p.cols.map((m) => `<th>${esc(m.ctx)}<span>${esc(m.path.join('.'))}</span></th>`).join('')}</tr></thead>
                  <tbody>
                    ${p.rows.map((r) => `<tr>${r.map((v) =>
                      `<td>${v == null || v === 'null' ? '<i>empty</i>' : esc(v)}</td>`).join('')}</tr>`).join('')}
                  </tbody>
                </table>
              </div>
              ${k.unmapped ? `<div class="set2-note" style="margin-top:0.75rem">${k.unmapped} field${k.unmapped > 1 ? 's are' : ' is'} not mapped and would arrive empty.</div>` : ''}
            ` : `<div class="set2-empty"><b>Nothing to preview</b>No field is mapped to a value yet.</div>`}
          </div>
          <div class="set2-modal-ft">
            <span class="set2-save-n">Showing ${p.rows.length} of <b class="set2-num">${n.toLocaleString()}</b> matching records</span>
            <span class="set2-modal-end">
              <button class="btn btn-ghost btn-sm" type="button" data-close>Close</button>
              <button class="btn btn-brand btn-sm" type="button" data-close>Run sync</button>
            </span>
          </div>
        </div>
      </div>`;
  }

  /* ── Removing people ──
     Graded the same way the record deletion is, because the consequence is
     the same shape: it cannot be undone and the number is the thing that must
     not be skimmed past. It names WHO, because "3 people" and "Alex, Karim and
     the person who owns the Upland grant" are different sentences and only one
     of them can be checked.

     `--- ` Anyone still holding a grant is called out separately: removing a
     person with live access takes the access with them, and that is the part
     nobody reads the count for. */
  /* ── Inviting somebody ──
     EMAIL AND NOTHING ELSE. The form asked for full name and job title as
     well, which is asking a person to type what the directory already knows
     and will overwrite — two fields that can only be entered wrong. The
     address is the one fact the inviter actually has.

     Several at once, because adding a team is the common case and doing it one
     at a time is the same decision six times.

     ── INLINE, NOT A MODAL ──
     It was a button in the section head that opened a dialog: addresses, then
     an optional role, then an optional scope. Three decisions to get one
     address in, and the two optional ones were the very act the card offers a
     moment later with "+ Grant a role" — so the dialog asked for the same
     thing twice, once blind and once in place. The frame puts one field at the
     top of the list with a Send beside it, and the frame is right: the field
     takes addresses, Enter or a comma adds another, Send does the lot, and the
     roles are granted where the person is.

     `bad` is set only when a commit is ATTEMPTED on something that is not an
     address. Flagging the draft as wrong while it is still being typed marks
     every address wrong for its first eight characters. */
  const MAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

  /* ══ ADDING SOMEBODY ════════════════════════════════════════════════════
     THREE FIELDS, IN A SHEET.

     This replaces a tag field that took email addresses and nothing else. It
     was the better shape for what it did — paste twelve addresses, press once
     — but what it did was not enough: an invitation carries a NAME and a JOB
     TITLE as well, and the bar had nowhere to put either.

     What it did instead was guess. `nameFromMail` split the local part on
     dots and title-cased it, so `a.mahfouz@` became "A Mahfouz" and every
     record landed with the literal title "From your directory". A directory
     whose names are inferred from email addresses is one where somebody has
     to correct every row later, and the title was not a guess at all — it was
     a placeholder printed as a fact.

     So: a button and a sheet. Three fields, all required, because a record
     missing any of them is the record the bar was already producing.

     WHAT IS LOST, AND WHY THAT IS ACCEPTABLE: the paste-a-list flow. Twelve
     people is now twelve passes. That is a real cost and it buys a directory
     that does not need correcting afterwards — and bulk import belongs with
     the CSV flow it needs, not bolted onto a field that cannot ask for a
     title. */
  const ADDU = { name: '', mail: '', title: '', role: '', client: '', bad: null };

  /* One reader for the sheet's text fields, because two things now need it:
     submitting, and repainting after a role is chosen. */
  function readAddU() {
    const val = (id) => { const el = $('#' + id); return el ? el.value.trim() : ADDU[id] || ''; };
    ADDU.name = val('auName'); ADDU.mail = val('auMail'); ADDU.title = val('auTitle');
  }

  function addUserModal() {
    const bad = ADDU.bad || {};
    const cl = ADDU.client ? findNode(ADDU.client) : null;
    /* ── THE HELP IS ON THE LABEL, NOT UNDER THE FIELD ──
       Three sentences printed under three fields is a sheet that reads as
       four times longer than the decision in it, and every one of them is
       something you need once — the first time — and never again.

       The ERROR still prints. It is not help, it is the reason the sheet did
       not close, and putting that behind a hover would mean pressing the
       button and watching nothing happen. */
    const fld = (id, key, label, ph, hint) => `
      <div class="set2-field">
        <span class="set2-lbl-row">
          <label class="set2-lbl" for="${id}">${esc(label)}</label>
          <span class="set2-tip-wrap">
            <button class="set2-tip-b" type="button" aria-describedby="${id}Tip"
                    aria-label="About ${esc(label.toLowerCase())}">${I.info}</button>
            <span class="set2-tip" role="tooltip" id="${id}Tip">${esc(hint)}</span>
          </span>
        </span>
        <input class="set2-fld${bad[key] ? ' is-bad' : ''}" id="${id}" autocomplete="off"
               value="${esc(ADDU[key])}" placeholder="${esc(ph)}"${
          key === 'mail' ? ' type="text" inputmode="email" spellcheck="false" autocapitalize="off"' : ''}>
        ${bad[key] ? `<div class="set2-hint is-err">${esc(bad[key])}</div>` : ''}
      </div>`;
    return `
      <div class="set2-scrim" data-scrim>
        <div class="set2-modal" role="dialog" aria-modal="true" aria-labelledby="auT">
          <div class="set2-modal-hd">
            <h2 class="set2-modal-t" id="auT">${cl ? 'Add a user to ' + esc(cl.name) : 'Add a user'}</h2>
            <button class="set2-modal-x" type="button" data-close aria-label="Close">${I.x}</button>
          </div>
          <div class="set2-modal-bd">
            ${fld('auName', 'name', 'Full name', 'Karim Fouad',
                  'As it should appear to everyone else in the workspace.')}
            ${fld('auMail', 'mail', 'Work email', 'karim.fouad@flairstech.com',
                  'Where the invitation goes.')}
            ${fld('auTitle', 'title', 'Job title', 'QA Manager',
                  'Shown beside their name. It does not grant anything.')}
            ${/* ── THE ROLE FIELD EXISTS ONLY WHEN THERE IS A CLIENT TO PUT IT ON ──
                  A grant is a role AND the clients it names. Opened at the
                  root there is no client, so a role picker there would be
                  half a grant with nowhere to land; opened on Upland the
                  client is decided by where you are and only the role is
                  missing. Required, for the same reason: without it the
                  person is created and does not appear in the list you added
                  them to, which reads as the button having failed. */ ''}
            ${cl ? `
              <div class="set2-field">
                <span class="set2-lbl-row">
                  <label class="set2-lbl" for="auRole">Role on ${esc(cl.name)}</label>
                  <span class="set2-tip-wrap">
                    <button class="set2-tip-b" type="button" aria-describedby="auRoleTip"
                            aria-label="About the role">${I.info}</button>
                    <span class="set2-tip" role="tooltip" id="auRoleTip">What they may do on
                      ${esc(cl.name)}. It can be changed or revoked from their row afterwards.</span>
                  </span>
                </span>
                ${/* `roster-dd` is the design system's own full-width variant of
                      this control. The fields above it are full-width inputs, so
                      a role picker that hugs its label reads as a chip somebody
                      dropped into the form rather than as the fourth field. */ ''}
                <div class="v2-dropdown roster-dd set2-dd${bad.role ? ' is-error' : ''}" data-au-role>
                  <button class="v2-dropdown-btn" type="button" aria-haspopup="listbox"
                          aria-expanded="false" aria-label="Role on ${esc(cl.name)}">
                    <span class="dd-label-text">${esc(ADDU.role || 'Choose a role')}</span>
                    ${I.down}
                  </button>
                  <div class="v2-dropdown-panel" role="listbox">
                    ${ROLES.map((r) => `<div class="v2-dropdown-option${r[0] === ADDU.role ? ' selected' : ''}"
                      role="option" aria-selected="${r[0] === ADDU.role}"
                      data-value="${esc(r[0])}">${esc(r[0])}</div>`).join('')}
                  </div>
                </div>
                ${bad.role ? `<div class="set2-hint is-err">${esc(bad.role)}</div>` : ''}
              </div>` : ''}
          </div>
          <div class="set2-modal-ft">
            ${/* Said plainly, here, rather than discovered afterwards on a row
                  that reaches nothing. */ ''}
            <span class="set2-hint">${cl
              ? 'They arrive on ' + esc(cl.name) + ' with the role you pick, and nowhere else.'
              : 'They arrive with no access. Grant a role once they are in.'}</span>
            <span class="set2-modal-end">
              <button class="btn btn-ghost btn-sm" type="button" data-close>Cancel</button>
              <button class="btn btn-brand btn-sm" type="button" data-au-add>Send invitation</button>
            </span>
          </div>
        </div>
      </div>`;
  }


  function removePeopleModal(m) {
    const withGrants = m.people.filter((p) => p.grants.length);
    const n = m.people.length;
    return `
      <div class="set2-scrim" data-scrim>
        <div class="set2-modal" role="dialog" aria-modal="true" aria-labelledby="rmT">
          <div class="set2-modal-hd">
            <h2 class="set2-modal-t" id="rmT">Remove ${n} ${n === 1 ? 'person' : 'people'}</h2>
            <button class="set2-modal-x" type="button" data-close aria-label="Close">${I.x}</button>
          </div>
          <div class="set2-modal-bd">
            <div class="set2-note is-err" style="margin-bottom:1rem">They lose access immediately. An invite sent to them stops working, and a new one has to be issued to bring them back.</div>
            <div class="set2-cascade">
              <div class="set2-cascade-t">Who</div>
              ${m.people.map((p) => `
                <div class="set2-cascade-i">
                  <span class="set2-cascade-k">${esc(p.name)}</span>
                  <span class="set2-cascade-v">${p.grants.length
                    ? p.grants.map((g) => esc(g.r) + ' on ' + g.v.length + ' ' + esc(g.t.toLowerCase()) + (g.v.length === 1 ? '' : 's')).join(' \u00b7 ')
                    : 'no roles to lose'}</span>
                </div>`).join('')}
            </div>
            ${withGrants.length ? `<div class="set2-note is-warn" style="margin-top:0.75rem">${
              withGrants.length} of them ${withGrants.length === 1 ? 'holds a live grant' : 'hold live grants'}. That access goes with them.</div>` : ''}
            <div class="set2-field" style="margin-top:1rem">
              <label class="set2-lbl" for="rmType">Type <b class="set2-num">${n}</b> to confirm</label>
              <input class="set2-fld set2-num" id="rmType" autocomplete="off" inputmode="numeric"
                     data-confirm="${esc(String(n))}" data-confirm-loose="${esc(String(n))}">
            </div>
          </div>
          <div class="set2-modal-ft">
            <button class="btn btn-ghost btn-sm" type="button" data-close>Cancel</button>
            <button class="btn btn-brand btn-sm is-err" type="button" data-confirm-go disabled>Remove ${n === 1 ? 'them' : 'them all'}</button>
          </div>
        </div>
      </div>`;
  }

  function rotateModal(m) {
    return `
      <div class="set2-scrim" data-scrim>
        <div class="set2-modal" role="dialog" aria-modal="true" aria-labelledby="roT">
          <div class="set2-modal-hd">
            <h2 class="set2-modal-t" id="roT">Generate a new ${esc(m.crm)} token</h2>
            <button class="set2-modal-x" type="button" data-close aria-label="Close">${I.x}</button>
          </div>
          <div class="set2-modal-bd">
            <div class="set2-note is-err">The current token stops working the moment the new one exists — every caller starts failing on its next request, not at its next deploy. Have somewhere ready to paste the new one.</div>
          </div>
          <div class="set2-modal-ft">
            <button class="btn btn-ghost btn-sm" type="button" data-close>Cancel</button>
            <button class="btn btn-brand btn-sm is-err" type="button" data-rotate-go>Generate it</button>
          </div>
        </div>
      </div>`;
  }

  function deleteModal(m) {
    return `
      <div class="set2-scrim" data-scrim>
        <div class="set2-modal" role="dialog" aria-modal="true" aria-labelledby="dlT">
          <div class="set2-modal-hd">
            <h2 class="set2-modal-t" id="dlT">Delete ${esc(m.r.name)} records</h2>
            <button class="set2-modal-x" type="button" data-close aria-label="Close">${I.x}</button>
          </div>
          <div class="set2-modal-bd">
            <div class="set2-blast is-err" style="margin:0 0 1rem">
              <span class="set2-blast-n set2-num">${m.n.toLocaleString()}</span>
              <span class="set2-blast-l">records older than ${m.r.days} days will be removed and cannot be recovered</span>
            </div>
            ${/* The cascade. A count says how big the hole is; this says what
                  falls into it. Okta warns about dependent flows, Replit about
                  the deployment that dies with the app -- the pattern is to
                  name the SECOND casualty, which is always the surprising one. */ ''}
            <div class="set2-cascade">
              <div class="set2-cascade-t">What else this affects</div>
              ${m.r.affects.map((a) => `
                <div class="set2-cascade-i">
                  <span class="set2-cascade-k">${esc(a[0])}</span>
                  <span class="set2-cascade-v">${esc(a[1])}</span>
                </div>`).join('')}
            </div>
            <div class="set2-field">
              ${/* Typing the COUNT rather than the name, following HubSpot: the
                    number is the thing that must not be skimmed past, and a
                    name can be typed without ever reading the figure above it. */ ''}
              <label class="set2-lbl" for="dlType">Type <b class="set2-num">${m.n.toLocaleString()}</b> to confirm you have read the number</label>
              <input class="set2-fld set2-num" id="dlType" autocomplete="off" inputmode="numeric"
                     data-confirm="${esc(String(m.n))}" data-confirm-loose="${esc(m.n.toLocaleString())}">
            </div>
          </div>
          <div class="set2-modal-ft">
            <span class="set2-modal-end">
              <button class="btn btn-ghost btn-sm" type="button" data-close>Cancel</button>
              <button class="btn btn-err btn-sm" type="button" data-close disabled data-confirm-go>Delete ${m.n.toLocaleString()} records</button>
            </span>
          </div>
        </div>
      </div>`;
  }

  function newSkillModal() {
    return `
      <div class="set2-scrim" data-scrim>
        <div class="set2-modal" role="dialog" aria-modal="true" aria-labelledby="nsT">
          <div class="set2-modal-hd">
            <h2 class="set2-modal-t" id="nsT">Write a skill</h2>
            <button class="set2-modal-x" type="button" data-close aria-label="Close">${I.x}</button>
          </div>
          <div class="set2-modal-bd">
            <div class="set2-field"><label class="set2-lbl" for="nsName">Name</label>
              <input class="set2-fld set2-mono" id="nsName" placeholder="weekly-status-report" autocomplete="off"></div>
            <div class="set2-field"><label class="set2-lbl" for="nsDesc">Description</label>
              <textarea class="set2-fld" id="nsDesc" style="min-height:4rem" placeholder="Generate weekly status reports from recent work. Use when asked for updates or progress summaries."></textarea>
              <div class="set2-hint">This is what the agent matches on when the trigger is automatic.</div></div>
            <div class="set2-field"><label class="set2-lbl" for="nsBody">Instructions</label>
              <textarea class="set2-fld" id="nsBody" placeholder="Summarize my recent work in three sections: wins, blockers, and next steps…"></textarea></div>
          </div>
          <div class="set2-modal-ft">
            <button class="btn btn-ghost btn-sm" type="button" data-open-upload>Upload a file instead</button>
            <span class="set2-modal-end">
              <button class="btn btn-ghost btn-sm" type="button" data-close>Cancel</button>
              <button class="btn btn-brand btn-sm" type="button" data-close>Create</button>
            </span>
          </div>
        </div>
      </div>`;
  }

  function uploadModal() {
    return `
      <div class="set2-scrim" data-scrim>
        <div class="set2-modal" role="dialog" aria-modal="true" aria-labelledby="upT">
          <div class="set2-modal-hd">
            <h2 class="set2-modal-t" id="upT">Upload a skill</h2>
            <button class="set2-modal-x" type="button" data-close aria-label="Close">${I.x}</button>
          </div>
          <div class="set2-modal-bd">
            <div class="set2-up">
              <div>
                <ul class="set2-up-req" style="padding-left:1rem;margin:0 0 0.875rem">
                  <li><code>.md</code> must carry <code>name</code> and <code>description</code> as YAML frontmatter</li>
                  <li><code>.zip</code> or <code>.skill</code> must contain a <code>SKILL.md</code></li>
                  <li>Everything below the frontmatter is the instruction</li>
                </ul>
                <button class="btn btn-ghost btn-sm" type="button" data-example>Download an example</button>
              </div>
              <label class="set2-drop" data-drop>
                ${I.up}
                <span>Drag a file here, or click to choose</span>
                <input type="file" accept=".md,.markdown,.zip,.skill" hidden data-file>
              </label>
            </div>
            <div class="set2-note is-err" id="upErr" style="margin-top:0.875rem;display:block;min-height:0;background:transparent;padding:0"></div>
          </div>
          <div class="set2-modal-ft">
            <button class="btn btn-ghost btn-sm" type="button" data-open-new>Write one instead</button>
            <span class="set2-modal-end">
              <button class="btn btn-ghost btn-sm" type="button" data-close>Cancel</button>
            </span>
          </div>
        </div>
      </div>`;
  }

  function downloadExample() {
    const blob = new Blob([EXAMPLE], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'aimy-skill-example.md';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SEARCH

     Indexes LEAF SETTINGS, not modules. Typing "retention" should find the
     Freshdesk threshold itself, not the page it sits on -- Devin's palette
     returns "Settings > Review > Per-PR spend limit" and that specificity is
     the whole value. Module-level search would have been a nicer-looking
     version of the profile-pill deep links this replaced.

     Every entry carries its full path, so a result says where it lives as well
     as what it is.
     ═══════════════════════════════════════════════════════════════════════ */
  function searchIndex() {
    const out = [];
    const add = (path, name, go) => out.push({ path: path, name: name, go: go });

    /* A module is a group of pages, so the destinations are the PAGES. The
       module still resolves — someone typing "Connections" means the group and
       gets its first page — but "Webhook settings" is now a result of its own
       rather than something you find by opening Enablement and scrolling. */
    MODULES.forEach((m) => {
      add([m.g], m.name, { m: m.id });
      (pagesOf(m.id) || []).forEach((pg) =>
        add([m.g, m.name], pg.name, { m: m.id, sec: pg.id }));
    });

    SKILLS.forEach((s) => add(['Admin', 'Skills'], s.name, { m: 'skills', skill: s.id }));
    AGENTS.forEach((a) => add(['Admin', 'Agents and tools'], a.name, { m: 'agents' }));
    COLS.forEach((c) => add(['Admin', 'Grounding'], c.name, { m: 'grounding' }));

    PEOPLE.forEach((p) => add(['Admin', 'User & access'], p.name, { m: 'access' }));
    ROLES.forEach((r) => add(['Admin', 'User & access', 'Roles'], r[0], { m: 'access' }));
    CAPS.forEach(([g, caps]) => caps.forEach(([cap]) =>
      add(['Admin', 'User & access', 'Roles', g], cap, { m: 'access' })));

    /* The CRM has to be in the path. One product can hold several connections,
       and without it two results read identically and go to different places,
       which is worse than not finding them at all. */
    CONNECTIONS.forEach((c) => {
      const at = ['Client', c.product, c.crm];
      add(['Client', 'Connections'], c.product + ' and ' + c.crm,
          { m: 'config', sec: 'fields', sp: c.product, crm: c.crmId });
      add(at, 'How far back to read', { m: 'config', sec: 'relevance', sp: c.product, crm: c.crmId });
      add(at, 'Which records to pull', { m: 'config', sec: 'sync', sp: c.product });
      add(at, 'Recent runs', { m: 'config', sec: 'sync', sp: c.product });
      add(at, 'Endpoint URL', { m: 'webhooks', sp: c.product });
      add(at, 'Auth token', { m: 'webhooks', sp: c.product });
      c.maps.filter((m) => m.state !== 'unmapped').forEach((m) =>
        add(at, m.ctx, { m: 'config', sec: 'fields', sp: c.product, crm: c.crmId }));
      failures(c.id).forEach((f) =>
        add(at.concat('Failures'), f.code, { m: 'config', sec: 'sync', sp: c.product }));
    });
    RETENTION.forEach((r) =>
      add(['Client', 'Connections', 'Data relevance'], r.name + ' retention threshold',
          { m: 'config', sec: 'relevance' }));
    return out;
  }

  /* ── The palette left this file ──
     knowledge.js registers Cmd/Ctrl-K on the document and says in as many words
     that the palette "belongs to the product and not to a page". On a shared
     page both bindings fired and both dialogs opened. `searchIndex` is the half
     worth keeping — it indexes LEAF SETTINGS with their full path, not modules —
     so it is exported and the console's palette reads it. */
  /* ═══ RENDER ═══ */
  const RAW = new Set();

  /* ══ THE RAIL SECTION ══════════════════════════════════════════════════
     This replaces "Sources & data" in the briefing rail. Same shape — a
     section label over `.rail-set` rows, a status dot, a name, a note on the
     right — because that shape was already the right one: it is dense enough
     that eleven destinations fit in a rail that also has to carry a briefing.

     What it takes from QA is not the layout but the RULE: every note states
     what AiMY actually found on that surface, with the number in it. A rail
     that reads "3 sources" every day is a rail nobody reads twice. The order
     never moves, so the column can be learned as a place while what it says
     changes underneath — that is the half of QA's reasoning worth keeping.

     Sources & data is not lost, it is one level up: a source that is down now
     reads as "1 source down" on Connections, and the row is the way to the
     screen that fixes it. */

  /* Every figure is read off the fixture it describes. A note that disagrees
     with the module it points at is worse than no note. */
  function moduleNote(id) {
    let n;
    switch (id) {
      case 'skills':
        n = SKILLS.filter((x) => standing2(x)[0] !== 'is-ok').length;
        return n ? [n + ' not applying', 'warn'] : [SKILLS.length + ' applying', 'ok'];
      case 'agents':
        n = AGENTS.filter((a) => !a.on).length;
        return n ? [n + ' off', 'warn'] : [AGENTS.length + ' on', 'ok'];
      case 'grounding':
        return [COLS.filter((c) => c.on).length + ' of ' + COLS.length + ' on', 'ok'];
      case 'access':
        n = PEOPLE.filter((p) => p.s[0] === 'is-warn').length;
        return n ? [n + ' invite pending', 'warn'] : [PEOPLE.length + ' people', 'ok'];
      case 'roles':
        return [ROLES.length + ' roles', ''];
      case 'hierarchy':
        return [LEAF_TOTAL + ' scopes', ''];
      /* The worst true thing about the connection: a failed run outranks a
         broken field, which outranks a healthy count. */
      case 'config': {
        n = failCount();
        if (n) return [n + ' failed run' + (n > 1 ? 's' : ''), 'err'];
        n = CONNECTIONS.reduce((a, c) => a + mapCounts(c).broken, 0);
        return n ? [n + (n > 1 ? ' fields broken' : ' field broken'), 'err']
                 : [CONNECTIONS.length + ' connected', 'ok'];
      }

      /* Unreached while the module's own `state` answers — navRow asks that
         first — but kept as the fallback for a paint with no scope set, where
         `pageState` declines to run and this is what is left. */
      case 'webhooks': {
        const bad = Object.keys(ENDPOINTS).filter((k) => ENDPOINTS[k].last[1] === 'is-err').length;
        if (bad) return [bad + ' endpoint down', 'err'];
        n = Object.keys(ENDPOINTS).length;
        return n ? [n + ' live', 'ok'] : ['none set up', ''];
      }
      case 'retention':
        n = RETENTION.reduce((a, r) => a + wouldDelete(r), 0);
        return n ? [n.toLocaleString() + ' would delete', 'warn'] : ['nothing queued', 'ok'];
      default:
        return null;
    }
  }

  const DOT = { ok: 'sd-ok', warn: 'sd-warn', err: 'sd-err' };

  /* ══════════════════════════════════════════════════════════════════════
     THE RAIL — one tree, muted labels, expandable parents

     Modelled on the Twilio console's left nav and every console that shares
     its shape: a muted group label, a parent row you can expand, one page per
     leaf, and the leaf you are on marked. The reference set is on Mobbin —
     Supabase for the label-over-children contrast step, Remote for the
     expand-to-children behaviour.

     THREE THINGS SEPARATE, and the file already had a rule for two of them:
     the GROUP is a signpost read once, the PAGE NAME is what you came to find,
     and the STATE is what the page is carrying. So the group label is quietest,
     the page name is the loudest thing in the column, and the state sits under
     it in meta. That is the same ladder `.set2-sec-t` follows on the page
     itself, and it should be — the rail is a table of contents for a surface
     that has to read as one surface.

     WHAT IS EXPANDED. Exactly one group, or none. An accordion rather than a
     set of independent drawers, and for the reason accordions exist: the rail
     also carries the briefing and a way back to chat, and three groups open at
     once pushed the last of them past the fold on a 950px window — so the
     structure this exists to show could not be seen all at once, which is the
     one thing it had to do.

     One at a time also makes the closed rows worth reading. A group's dot is
     the worst state under it, and a dot only says something when the thing it
     summarises is folded away.

     It is a preference about the chrome, so it lives here rather than in the
     URL — a link should open a page, not restore somebody else's idea of which
     drawer was pulled out. */
  let RAIL_OPEN = null;
  /* Which module RAIL_OPEN was an answer about. Arriving at a module — by
     click, by quick action, by pasted link or by Back — opens it, because you
     cannot pick a page from a group you cannot see. Toggling after that is
     yours and survives until you go somewhere else, INCLUDING shutting the
     group you are standing in: every group collapses, and the page you are on
     is still named by the title above the column. */
  let RAIL_FOR = null;

  function railSync(st) {
    const here = aliasOf(st.m);
    if (RAIL_FOR !== here) { RAIL_FOR = here; RAIL_OPEN = here; }
  }

  /* ── The quick action ──
     A rail row says what is wrong. This says what to do about it, and doing it
     is one click, and the click lands on the row rather than on the page that
     contains it. It carries the AiMY mark because it is AiMY's reading of the
     page, not a control the page itself offers — the same mark, meaning the
     same thing, as everywhere else in the product. */
  function quickFix(m, f) {
    return `<button class="rail-fix" type="button"
        data-fix-m="${esc(m.id)}"${f.sec ? ` data-fix-sec="${esc(f.sec)}"` : ''}
        ${f.node ? `data-fix-node="${esc(f.node)}"` : ''}
        ${f.find ? `data-fix-find="${esc(f.find)}"` : ''}>
        ${AIMY}<span class="rail-fix-l">${esc(f.label)}</span>
        <svg class="rail-fix-go" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
      </button>`;
  }

  /* A leaf. The page name, what it is carrying, and — only when something is
     wrong — the one action that ends it. */
  function pageRow(m, pg, st, here) {
    const ps = pageState(st, pg, m);
    return `<button class="rail-pg${here ? ' is-on' : ''}" type="button"
        data-m="${esc(m.id)}" data-sec="${esc(pg.id)}"${here ? ' aria-current="page"' : ''}>
        <span class="rail-pg-n">${esc(pg.name)}</span>
        ${ps && ps.note ? `<span class="rail-pg-s${ps.s ? ' ' + DOT[ps.s] : ''}">${esc(ps.note)}</span>` : ''}
      </button>`
      + (ps && ps.fix ? quickFix(m, ps.fix) : '');
  }

  /* A parent. Its own note is the worst thing under it, because that is the
     question someone scanning a collapsed tree is asking — and it is derived
     from the pages rather than computed a second time, so a rail that says
     "1 broken" always has a page under it that says which. */
  function moduleNoteFrom(m, st, pages) {
    if (!pages) {
      /* A leaf that states its own condition is asked first; `moduleNote` is
         the fallback for the leaves that do not, and for the paint where the
         scope is unset and `pageState` returns null. */
      const own = m.state ? pageState(st, m, m) : null;
      return own && own.note ? [own.note, own.s] : moduleNote(m.id);
    }
    const rank = { err: 3, warn: 2, ok: 1 };
    let worst = null;
    pages.forEach((pg) => {
      const ps = pageState(st, pg, m);
      if (ps && ps.s && (!worst || rank[ps.s] > rank[worst.s])) worst = ps;
    });
    return worst ? [worst.note, worst.s] : null;
  }

  function navRow(m, st) {
    const pages = pagesOf(m.id);
    const on = m.id === aliasOf(st.m);
    const note = moduleNoteFrom(m, st, pages);
    const open = pages ? RAIL_OPEN === m.id : false;
    const dot = note && note[1] ? `<span class="status-dot ${DOT[note[1]]}"></span>`
                                : '<span class="rail-cfg-nodot"></span>';

    /* No pages: the row IS the page, and it keeps exactly the shape it had.

       WITH ONE ADDITION, for the module that was promoted out of a group. A
       page row has always been able to offer the one action that ends what is
       wrong with it; a leaf row could not, because no leaf had a `state` to
       offer one from. Webhook settings does — it kept its state when it left
       Enablement — and dropping the fix on the way up would have been a
       working control lost to a change of address. Every other leaf has no
       `state`, so `ps` stays null and this renders what it did before. */
    if (!pages) {
      const ps = m.state ? pageState(st, m, m) : null;
      return `<button class="rail-set-row rail-cfg-row${on ? ' is-on' : ''}" type="button"
        data-m="${esc(m.id)}"${on ? ' aria-current="page"' : ''}>
        ${dot}
        <span class="rail-set-name">${esc(m.name)}</span>
        ${m.tier ? `<span class="rail-set-note">${esc(m.tier)}</span>`
                 : note ? `<span class="rail-set-note">${esc(note[0])}</span>` : ''}
      </button>`
      + (ps && ps.fix ? quickFix(m, ps.fix) : '');
    }

    /* ── THE HEADER IS A DISCLOSURE, NOT A DESTINATION ──
       It was two controls — a chevron that opened the group and a title that
       went to its first page. Two things to press a millimetre apart that do
       different things, and the larger of them navigated: pressing "Connections"
       to see what is under it took you somewhere instead.

       A group has no page of its own. Going "to" it only ever meant going to
       the first thing in it, and that thing is listed directly underneath and
       one click away. So the whole header does the one job the group actually
       has, and the pages are the only destinations in the tree. */

    /* ── WHAT A CLOSED GROUP STILL HAS TO SAY ──
       Folded away, the pages under it are gone and so is every quick action on
       them — and a fix you cannot see is a fix nobody does. The dot says
       something is wrong; this says how many things AiMY can act on, in AiMY's
       own mark, so the reason to open the group is on the closed group. */
    const acts = pages.filter((pg) => {
      const ps = pageState(st, pg, m);
      return ps && ps.fix;
    }).length;

    return `<div class="rail-grp${open ? ' is-open' : ''}">
        <button class="rail-grp-h${on ? ' is-on' : ''}" type="button" data-rail-x="${esc(m.id)}"
                aria-expanded="${open}">
          <span class="rail-grp-x" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </span>
          ${dot}<span class="rail-set-name">${esc(m.name)}</span>
          ${!open && acts ? `<span class="rail-grp-acts"
             title="${acts} thing${acts === 1 ? '' : 's'} AiMY can fix in here">
             ${AIMY}<b>${acts}</b></span>` : ''}
        </button>
        ${open ? `<div class="rail-pgs">${pages.map((pg) =>
            pageRow(m, pg, st, on && pageOf(st) === pg)).join('')}</div>` : ''}
      </div>`;
  }

  /* `off` modules are routable and stay in the search index — they are just
     not in the rail. That is what "defer, do not delete" means mechanically. */
  function nav(st) {
    const back = st.m ? `
      <button class="rail-set-row rail-cfg-back" type="button" data-m="">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="13" height="13">
          <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
        </svg>
        <span class="rail-set-name">All documents</span>
      </button>` : '';
    railSync(st);
    return back + GROUPS.map((g) => {
      const rows = MODULES.filter((m) => m.g === g && !m.off);
      if (!rows.length) return '';
      return `<div class="brief-section-label">${esc(g)}</div>
        <div class="rail-set rail-tree">${rows.map((m) => navRow(m, st)).join('')}</div>`;
    }).join('');
  }

  /* Only where a module has no section head to carry it. Everywhere else the
     count belongs beside the section it counts. */
  const TALLY = {
    /* Nothing when a skill is open. The tally counts the LIST — how many exist
       and how many are idle — and on a skill's own page the reader is not
       looking at the list: the header beside it already says whether THIS one
       applies, in a pill, about the thing they opened. Two counts about
       different subjects on one line is the header answering a question nobody
       asked louder than the one they did. */
    skills: (st) => {
      if (st.skill && skillById(st.skill)) return '';
      const off = SKILLS.filter((x) => standing2(x)[0] !== 'is-ok').length;
      return `<span class="set2-num"><b>${SKILLS.length}</b> configured</span>`
           + (off ? `<span class="set2-num is-warn"><b>${off}</b> not applying</span>` : '');
    }
  };

  /* ── A PAGE'S ONE ACTION, ON ITS TITLE ROW ──
     For a page whose whole job is one verb, the verb sits at the right edge of
     the title rather than under the list it adds to, where it moved down the
     page every time the list grew. Keyed by page id; a page without one keeps
     the bare title. */
  const PAGE_ACT = {
    selling: () => `<button class="btn btn-brand btn-sm" type="button" data-sell-open>Add what you sell</button>`
  };

  function head(st) {
    const m = moduleById(st.m);
    const scoped = m.scope === 'prod';
    /* ── The lens is not a page-level control ──
       `Yours | Organization | Effective` answers "whose value wins", and only
       three functions read it — all of them reachable only from Skills. It sat
       above every module regardless, which meant that on Retention, Webhooks
       and Connections it was a segmented control that changed nothing. It
       lives where it works now. */
    /* ── THE TITLE IS THE PAGE, NOT THE MODULE ──
       "Connections" is a group in the rail with three pages under it. Printing
       it again over one of them named the folder rather than the file, and
       left the page you were on unnamed anywhere except a rail row 500px to
       the left. The module still says where you are — it is the parent row,
       marked, directly above the child. */
    const pg = pageOf(st);
    const act = pg && PAGE_ACT[pg.id] ? PAGE_ACT[pg.id](st) : '';
    return `
      ${act
        ? `<div class="set2-title-row"><h1 class="set2-title">${esc(pg.name)}</h1>${act}</div>`
        : `<h1 class="set2-title">${esc(pg ? pg.name : m.name)}</h1>`}
      <div class="set2-bar">
        ${scopeSlot(st, m, pg)}
        <div class="set2-bar-end set2-tally">${
          TALLY[m.id] ? TALLY[m.id](st) : ''}</div>
      </div>`;
  }

  /* ── ONE SCOPE SLOT, AND THE PAGE OWNS IT ──
     The bar under the title printed `Org FlairsTech › Client CXS` on every
     module that was not a connection, and both halves were literals. On People
     that meant the header said CXS while the page stood on Upland, which is
     the one thing a scope line exists not to do — a breadcrumb that cannot be
     wrong is decoration, and one that can be and is, is worse than absent.

     So the slot works the way Connections always used it: the page that HAS a
     scope renders it here, with the picker in it, and there is exactly one
     scope control on screen. People had built a second bar of its own
     underneath this one, which is how a surface ends up with two answers to
     "where am I" sitting 40px apart.

     A page with no scope now says NOTHING, because there is nothing true left
     for it to say: it used to print the organisation, and there is no
     organisation. An empty bar is better than a bar naming a level that does
     not exist. */
  function scopeSlot(st, m, pg) {
    if (m.scope === 'prod') return prodScope(st);
    if (pg && pg.id === 'people') return peopleScope(st);
    return '';
  }

  /* ── The module column, as a string ──
     The console decides WHERE this goes and WHEN it is painted; this file
     decides what is in it. It used to assign two innerHTMLs and a title, all of
     which belonged to a page that no longer exists. */
  /* ══════════════════════════════════════════════════════════════════════
     PAGES — a module is a group of pages, not one page with a map

     WHAT THIS REPLACES. Connections was 2178px of five sections with a spine
     down the left gutter: a map, a reading position, and a state per section.
     The spine was a good answer to the wrong question. It made a long page
     navigable; it did not make it short. Someone who came to fix a broken
     field mapping still loaded the sync history, the retention thresholds and
     every run of both connectors to get there, and the address bar could not
     tell anyone else where they had been.

     The rail already had a list of destinations in it. The spine was a SECOND
     list of destinations, in a different place, in a different visual
     language, for the sections of whichever destination you had picked from
     the first. Merging them is not a new idea — it is what every console with
     more settings than fit on a page does, Twilio's included: one tree, muted
     group labels, expandable parents, one page per leaf.

     So these are PAGES now. Each is addressable (`?sec=`), each is one screen,
     and the rail says what is on all of them at once.

     WHAT EACH ENTRY IS. `id` addresses it, `name` is the rail row, `secs` are
     the section renderers it composes, and `state` reports what the page is
     carrying — the same computation the spine used, because it was the right
     computation and only its housing was wrong.

     `state` returns `{ note, s, fix }`. `note` and `s` are the line and the
     severity under the rail row. `fix` is what is new: the one thing worth
     doing about a bad state, named as an action rather than as a count. */

  /* ── ONE PROBLEM, NAMED AS THE ACTION THAT ENDS IT ──

     "3 broken" is a diagnosis. It says a page has something wrong on it and
     leaves you to find which row, which is the part that costs the time — and
     the old spine did that from a gutter you could only read once you were
     already on the page carrying the problem.

     A fix carries `sec` (which page) and `find` (which row on it). Arriving
     scrolls to that row and marks it, so the click lands you ON the thing
     rather than at the top of a page that contains it somewhere. */
  /* `node` because People is scoped now: the groups a fix aims at — nobody
     with access, invites nobody accepted — exist at the ROOT and nowhere else.
     A fix that changed the page but left you standing on InterFAX Support
     would scroll to a row that is not on screen. */
  const fixTo = (label, sec, find, node) =>
    ({ label: label, sec: sec, find: find || null, node: node || null });

  const SUBPAGES = {
    /* Three pages, grouped the way the questions group: what the fields MEAN,
       how much data we keep, and what we pull and what happened when we did.
       Relevance and Trigger delete are one page because they are one question
       asked in two directions — how far back to read, and how far back to
       keep. Trigger sync and Sync history are one page because a run and the
       record of it are the same object before and after. */
    config: [
      { id: 'fields', name: 'Dynamic fields', secs: ['mapping'],
        state: function (st) {
          var mc = mapCounts(crmOf(st));
          if (mc.broken) return { note: mc.broken + ' broken', s: 'err',
            fix: fixTo('Repoint ' + mc.broken + ' broken path' + (mc.broken === 1 ? '' : 's'),
                       'fields', '.set2-map-row.is-broken') };
          if (mc.unmapped) return { note: mc.unmapped + ' not mapped', s: 'warn',
            fix: fixTo('Map ' + mc.unmapped + ' field' + (mc.unmapped === 1 ? '' : 's'),
                       'fields', '.set2-map-row.is-unmapped') };
          return { note: mc.confirmed + ' mapped', s: 'ok' };
        } },
      { id: 'relevance', name: 'Data relevance', secs: ['window', 'retention'],
        state: function (st) {
          var list = connsOf(prodOf(st));
          var crms = list.map(function (x) { return x.crmId; })
                         .filter(function (v, i, a) { return a.indexOf(v) === i; });
          var rows = RETENTION.filter(function (r) { return crms.indexOf(r.id) > -1; });
          var gone = rows.reduce(function (a, r) { return a + wouldDelete(r); }, 0);
          /* The queued deletion outranks the window, because one is a number
             you set and the other is records about to stop existing. */
          if (gone) return { note: gone.toLocaleString() + ' queued to delete', s: 'warn',
            fix: fixTo('Review what would go', 'relevance', '#st-retention') };
          var wins = list.map(function (x) { return x.window; })
                         .filter(function (v, i, a) { return a.indexOf(v) === i; });
          if (wins.length > 1) return { note: 'connectors disagree', s: 'warn',
            fix: fixTo('Settle the window', 'relevance', '#st-window') };
          return { note: (wins[0] || 0) + ' days', s: 'ok' };
        } },
      { id: 'sync', name: 'Sync', secs: ['criteria', 'runs'],
        state: function (st) {
          var list = connsOf(prodOf(st));
          var runs = list.reduce(function (a, x) { return a + (x.runs ? x.runs.length : 0); }, 0);
          var fails = failures().filter(function (f) { return list.indexOf(f.conn) > -1; }).length;
          if (fails) return { note: fails + ' failed', s: 'err',
            fix: fixTo('Open ' + fails + ' failed run' + (fails === 1 ? '' : 's'),
                       'sync', '.set2-run.is-failed') };
          if (!runs) return { note: 'never run', s: 'warn',
            fix: fixTo('Run the first sync', 'sync', '#st-records') };
          return { note: runs + ' run' + (runs === 1 ? '' : 's'), s: 'ok' };
        } }
    ],

    /* Access splits the same way, for the same reason. Nothing above asked for
       it, but removing the spine leaves a 2114px page with no way around it,
       and its three sections were already three clean pages. */
    access: [
      { id: 'people', name: 'People', secs: ['people'],
        state: function () {
          var pend = PEOPLE.filter(function (p) { return p.s[0] === 'is-warn'; }).length;
          var none = PEOPLE.filter(function (p) { return !p.grants.length; }).length;
          if (none) return { note: none + ' with no access', s: 'warn',
            fix: fixTo('Give ' + none + ' person' + (none === 1 ? '' : 's') + ' a role',
                       'people', '.set2-sp-row.is-none', ROOT_ID) };
          if (pend) return { note: pend + ' pending', s: 'warn',
            fix: fixTo('Resend ' + pend + ' invite' + (pend === 1 ? '' : 's'),
                       'people', '.set2-sp-row.is-warn', ROOT_ID) };
          return { note: PEOPLE.length + ' people', s: 'ok' };
        } },
      { id: 'roles', name: 'Roles', secs: ['roles'],
        state: function () { return { note: ROLES.length + ' roles', s: '' }; } },
      { id: 'scopes', name: 'Scopes', secs: ['scopes'],
        state: function () { return { note: LEAF_TOTAL + ' scopes', s: '' }; } },
      /* ── WHAT YOU SELL ──
         A fact about you, like your roles, so it lives with the people rather
         than as a module of its own — and only yours: nobody chooses what
         somebody else sells.

         No warning and no quick action when the list is empty. Choosing what
         you sell is a preference, not a fault, and a rail that shouts about it
         in the warning colour ranks it beside a broken connector. The note is
         a plain count, the way Roles and Scopes carry theirs, and it says
         nothing until there is something to count. */
      { id: 'selling', name: 'What you sell', secs: ['selling'],
        state: function () {
          var n = mySells().length;
          return n ? { note: n + ' chosen', s: '' } : null;
        } }
    ]
  };

  /* A module with no page list is one page, and the rail row IS the page.
     Skills and the deferred modules are that. */
  const pagesOf = (id) => SUBPAGES[aliasOf(id)] || null;

  /* Absent, unknown, or belonging to another module all mean the same thing:
     the first page. A `sec` that names nothing here must not render a blank
     column, and it must not sit in the URL pretending to name something. */
  function pageOf(st) {
    const list = pagesOf(st.m);
    if (!list) return null;
    const want = st.sec || ALIAS_SEC[st.m] || '';
    return list.filter((x) => x.id === want)[0] || list[0];
  }

  /* Computed once per paint and read by both the rail row and its quick
     action, so the two can never disagree about what is wrong. A module whose
     scope is unset has no page state at all — the pages exist, but every
     number on them would be about nothing. */
  function pageState(st, pg, m) {
    if (!pg || !pg.state) return null;
    if (m && m.scope === 'prod' && !prodOf(st)) return null;
    try { return pg.state(st); } catch (err) { return null; }
  }

  function body(st) {
    const m = moduleById(st.m) || moduleById('config');
    const inner = (M[m.id] || (() => '<div class="set2-empty"><b>Not built yet</b>This module carries its state only.</div>'))(st);
    /* A detail view brings its own header. Rendering the module header above it
       stacked two titles and two scope lines on one page, and the outer one
       named the list you had just left. */
    /* Only a SKILL detail brings its own header. A connection is a scope, not
       a page you drilled into — Dynamic fields scoped to FileBound is still
       Dynamic fields — so the page keeps its title and the scope shows in the
       bar under it. */
    /* 46rem is the widest a settings ROW stays legible — past it the control
       is a hand's width from the label it belongs to. A card GRID has the
       opposite problem: capped at 46rem it gives two cramped columns, which is
       what made this surface feel condensed. The cap is per-module now. */
    /* ── NO SPINE, AND NOTHING TOOK ITS GUTTER ──
       The map moved into the rail, where the other list of destinations
       already was. What is left is one column, and it stays exactly where it
       was: the 180px + 32px the spine occupied was dead gutter before it
       existed and is dead gutter again, so no measure inside the column moves
       and the left edge is still at 512 on every page. */
    /* ── THE SKILL DETAIL STOPPED BEING A PAGE ──
       This used to suppress the module header whenever a skill was open,
       because the detail was a whole page that brought its own title and a
       back link. It is a COLUMN now, sitting beside the library it was chosen
       from, so there is nothing to go back to and nothing to stack: the page
       is Skills either way, and the tally over it counts the same five skills
       whether one of them is open or not. Suppressing the header now would
       leave the page unnamed the moment you pressed a row. */
    return `<div class="set2-col${m.wide ? ' is-wide' : ''}">`
      + head(st)
      + inner + `</div>`;
  }

  /* Called by the console once the string above is in the DOM. `seatTabindex`
     reads elements, so it cannot run inside a function that only returns
     markup — and a timer would be a guess about when the paint landed. */
  /* ── WHICH PAGE DID I TOUCH ──
     The unsaved block says "1 unsaved" without naming which page it means, and
     the rail is the only thing on screen that lists them. So the rail carries
     it: the page you changed is marked, and its note is refreshed from the
     model in the same call.

     A class flip and a text swap, not a re-render — this is called from an
     `input` handler, and rebuilding would take the caret out of the field
     being typed in. */
  const DIRTY_STAGE = new Set();

  /* The note is RECOMPUTED from the model rather than passed in as a string.
     Two callers passing their own wording is how "30 days" ends up beside an
     input reading 45 — the same drift that let the retention row disagree with
     its own confirmation. One function owns each page's note, and this asks it
     again rather than guessing. */
  function pageNoteOf(secId) {
    const st0 = readURL();
    const m0 = moduleById(st0.m) || moduleById('config');
    const list = pagesOf(m0.id) || [];
    const pg = list.filter((x) => x.id === secId)[0];
    const ps = pg ? pageState(st0, pg, m0) : null;
    return ps ? ps.note : null;
  }

  /* Callers still name the SECTION they touched — `fields`, `records`,
     `retention` — because that is what they know about themselves. This maps a
     section to the page that now carries it, so nothing at a call site had to
     learn the new grouping. */
  const PAGE_OF_SECTION = (() => {
    const out = {};
    Object.keys(SUBPAGES).forEach((mid) => SUBPAGES[mid].forEach((pg) =>
      pg.secs.forEach((k) => { out[k] = pg.id; })));
    /* The ids the call sites use are the section ELEMENT ids (`st-history`),
       which predate the renderer names. Both spellings resolve. */
    out.history = out.runs; out.records = out.criteria;
    out.window = out.window; out.fields = out.mapping;
    return out;
  })();

  function markDirtyStage(id) {
    DIRTY_STAGE.add(id);
    const sec = PAGE_OF_SECTION[id] || id;
    const item = $('.rail-pg[data-sec="' + sec + '"]');
    if (item) {
      item.classList.add('is-dirty');
      const n = $('.rail-pg-s', item);
      const note = pageNoteOf(sec);
      if (n && note) n.textContent = note;
    }
    bumpUnsaved();
  }

  /* One place decides whether the unsaved block is showing and what number it
     shows. It was two: the generic field path updated it and the retention
     path did not, so changing a deletion threshold and a lookback left the
     block saying "1" while the discard dialog listed two. */
  function bumpUnsaved() {
    const bar = $('[data-save]');
    if (!bar) return;
    bar.hidden = !DIRTY.size;
    const n = $('.set2-num', bar);
    if (!n) return;
    const now = String(DIRTY.size);
    /* ══ THE COUNT RE-ENTERS WHEN IT CHANGES, AND ONLY THEN ═══════════
       This runs from an `input` handler, so it is called on every keystroke
       and the number is the same on almost all of them. Animating a digit that
       did not change is a twitch under somebody's hands while they type. */
    if (n.textContent === now) return;
    n.textContent = now;
    const M = window.AIMY_MOTION;
    if (!M || M.reduced()) return;
    n.classList.remove('is-bumped');
    void n.offsetWidth;
    n.classList.add('is-bumped');
  }

  /* The draft row is created by a render, so the caret has to be placed after
     that render rather than by the click that asked for it. */
  function focusDraft() {
    const f = $('[data-newname]');
    if (f) { f.focus(); f.select(); }
  }

  /* Anywhere in the tree, not just the top level -- a draft subfield lives in
     its parent's `kids`. */
  function draftNode(c) {
    return mapNodes(c).filter((n) => n.m.draft)[0] || null;
  }

  /* Keeping and dropping are the same two outcomes however you leave the
     field -- Enter, Escape, or clicking away -- so they live in one place. */
  function settleDraft(keep) {
    const st0 = readURL();
    const c = crmOf(st0);
    const d = draftNode(c);
    if (!d) return false;
    const f = $('[data-newname]');
    const name = keep && f ? f.value.trim() : '';
    const at = nodeAt(c, d.addr);
    if (!name) { if (at) at.list.splice(at.at, 1); render(); return true; }
    d.m.ctx = name;
    delete d.m.draft;
    DIRTY.add('maps'); markDirtyStage('fields');
    render();
    /* Straight on to the only thing left to decide about it. */
    const row = $('.set2-map-row[data-map="' + d.addr + '"] [data-path]');
    if (row) row.click();
    return true;
  }

  /* ══ THE MAP MOVES RATHER THAN REDRAWING ═══════════════════════
     Every gesture on this surface - opening a branch, taking the cap off a
     row of siblings, changing the depth, typing into the tenancy search -
     re-serialises the whole layer. So a node that merely MOVED was destroyed
     at its old coordinates and built again at its new ones, and a tree that
     rearranges itself by blinking is the hardest kind of change to follow:
     the one thing a map is for is knowing where things went.

     FLIP, and without a single layout read. Positions here are inline `left`
     and `top` in the layer's own coordinate space, written by scNode - so the
     delta between two paints is already known in exactly the units a
     `translate()` needs, and reading a rect would be both slower and wrong
     (the layer is scaled by --sc-k, so screen pixels are not these pixels).

     `fill: 'none'` is the safety property. The DOM is already correct before
     the animation starts; if no frame ever arrives - a hidden tab, a pane that
     composites nothing - every node is simply where it belongs.

     WHAT DOES NOT ANIMATE IS AS DELIBERATE AS WHAT DOES. Searching the tenancy
     dims the nodes that do not match, and nothing moves. Twenty nodes fading
     in step on every keystroke of a debounced search is the strobe this whole
     pass exists to remove, so a paint where nothing moved and nothing arrived
     produces no motion at all. */
  let SC_PREV = null;
  function seatMap() {
    const layer = $('.set2-sc-layer');
    /* Leaving the module forgets the layout, so coming back draws the tree
       again rather than silently FLIPping from wherever it was last time. */
    if (!layer) { SC_PREV = null; return; }

    const nodes = $$('.set2-sc-w', layer);
    const now = {};
    nodes.forEach((n) => {
      const b = n.querySelector('.set2-sc-n');
      now[n.getAttribute('data-sc-w')] = {
        x: parseFloat(n.style.left) || 0,
        y: parseFloat(n.style.top) || 0,
        on: !!(b && b.classList.contains('is-on'))
      };
    });
    const prev = SC_PREV;
    SC_PREV = now;

    const M = window.AIMY_MOTION;
    if (!M || M.reduced()) return;
    const wires = $('.set2-sc-wires', layer);

    /* No previous layout means the map is arriving, not changing. The wires
       draw themselves and the nodes land along them. */
    if (!prev) {
      nodes.forEach((n, i) => n.style.setProperty('--i', String(Math.min(i, 8))));
      layer.classList.add('is-arriving');
      if (wires) wires.classList.add('is-drawing');
      clearMapIntro(layer);
      return;
    }

    const dur = M.ms('--t-base', 250);
    const ease = M.token('--ease-out', 'ease-out');
    let arrived = 0, moved = 0;
    nodes.forEach((n) => {
      const id = n.getAttribute('data-sc-w');
      const was = prev[id], is = now[id];
      if (!was) {
        n.style.setProperty('--i', String(Math.min(arrived++, 8)));
        n.classList.add('is-new');
        return;
      }
      /* ══ THE ONE YOU JUST CHOSE ══════════════════════════════
         Selection moves nothing, so there is no FLIP to carry it and the pill
         simply changes colour under the cursor. One soft lift on the node that
         just became current is enough to say which one answered - and it is
         the node, not the map, so nothing around it shifts.

         No overshoot: it settles at its own size rather than past it. */
      const btn = n.querySelector('.set2-sc-n');
      if (btn && btn.animate && is.on && !was.on) {
        btn.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
          { duration: M.ms('--t-base', 250), easing: ease, fill: 'none' });
      }
      const dx = was.x - is.x, dy = was.y - is.y;
      if ((!dx && !dy) || !n.animate) return;
      moved++;
      /* rem, because that is what scNode writes and what parseFloat just read
         back. A px here would be right only at a root of 16 and wrong by the
         zoom factor everywhere else. */
      n.animate(
        [{ transform: 'translate(' + dx + 'rem, ' + dy + 'rem)' }, { transform: 'none' }],
        { duration: dur, easing: ease, fill: 'none' });
    });

    /* The elbows are recreated on every paint, so the class is always absent
       here and adding it always starts a fresh draw - no reflow needed. They
       redraw only when the tree actually changed shape. */
    if (wires && (arrived || moved)) wires.classList.add('is-drawing');
    if (arrived || moved) clearMapIntro(layer);
  }

  /* ══ AND THE CLASSES COME OFF AGAIN ══════════════════════════
     Every entrance above hides its element first and reveals it by animating,
     which is only safe while the animation is certain to run - and it is not.
     A backgrounded tab freezes the clock mid-delay; this repo's review pane
     never starts one. A node or a wire still waiting its turn when that
     happens is invisible for as long as the page is open, and on this surface
     that is the whole map.

     The fill modes are the first defence and this is the second: the classes
     that carry the animations are stripped on a TIMER. setTimeout is throttled
     in a background tab but it still fires, which is the property being relied
     on here and the same floor halaska-mounts keeps under its run and aimy-ds
     keeps under the theme swap.

     The floor covers the slowest thing it is waiting for: the wires, capped at
     twelve steps of stagger plus their own duration. */
  function clearMapIntro(layer) {
    const M = window.AIMY_MOTION;
    const off = () => {
      if (!layer.isConnected) return;
      layer.classList.remove('is-arriving');
      const w = $('.set2-sc-wires', layer);
      if (w) w.classList.remove('is-drawing');
      $$('.set2-sc-w.is-new', layer).forEach((n) => n.classList.remove('is-new'));
    };
    const ms = (M ? M.ms('--t-slow', 400) + 12 * M.ms('--t-stagger', 40) : 900) + 120;
    if (M) M.after(layer, off, { ms: ms }); else setTimeout(off, ms);
  }

  function painted() { seatTabindex(); focusDraft(); landFix(); seatMap(); }

  /* ── ARRIVING AT A FIX ──
     A quick action navigates and then has to finish the job: the page it asked
     for is painted, and the row it named has to be found, brought into view
     and marked. That cannot happen in the click — the page does not exist yet
     — so the click records what it was after and this reads it once the paint
     has landed.

     One shot. The mark is a state of the arrival, not of the row, so it clears
     itself and does not survive the next thing you do. */
  let PENDING_FIX = null;
  function landFix() {
    const want = PENDING_FIX;
    PENDING_FIX = null;
    if (!want) return;
    const el = $(want);
    if (!el) return;
    const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: quiet ? 'auto' : 'smooth', block: 'center' });
    el.classList.add('is-found');
    /* Focus follows the eye, or the next Tab resumes from the rail, which is
       behind you now. */
    const f = el.matches('button, input, a, select') ? el
            : el.querySelector('button, input, a, select');
    if (f) f.focus({ preventScroll: true });
    else { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
    setTimeout(() => el.classList.remove('is-found'), 2400);
  }

  function seatTabindex() {
    $$('[role="tree"]').forEach((t) => {
      const rows = $$('[data-node]', t);
      if (rows.length) rows[0].setAttribute('tabindex', '0');
    });
  }

  /* `repaintPicker` and `toggleNode` stood here. Both served the tree
     targeting picker: one rebuilt it in place, the other flipped a node and
     every leaf under it. Nothing renders that picker any more, and
     `repaintPicker` called `picker()` — which is gone — so it was a function
     that could only ever throw. */


  /* ═══ WIRING ═══ */
  document.addEventListener('click', (e) => {
    const st = readURL();

    /* ── The quick action ──
       Two moves in one click: go to the page, then find the row. The second
       half cannot run here, so it is left for `landFix` to do once the page it
       asked for has actually been painted. */
    const fixBtn = e.target.closest('[data-fix-m]');
    if (fixBtn) {
      PENDING_FIX = fixBtn.getAttribute('data-fix-find') || null;
      patch({ m: fixBtn.getAttribute('data-fix-m'),
              sec: fixBtn.getAttribute('data-fix-sec'), skill: '',
              node: fixBtn.getAttribute('data-fix-node') || '' });
      return;
    }

    /* Opening a parent is not going to it. See navRow: two things you can do
       to a group, so two controls, and this one changes no page.

       Opening one shuts whatever was open, and pressing the open one shuts it
       — so the rail is an accordion with a closed state, and no group is stuck
       open because you happen to be inside it. */
    const railX = e.target.closest('[data-rail-x]');
    if (railX) {
      const id = railX.getAttribute('data-rail-x');
      RAIL_OPEN = RAIL_OPEN === id ? null : id;
      RAIL_FOR = aliasOf(st.m);
      render();
      return;
    }
    /* The header is a `<button>` wrapping the row, so a click inside it lands
       on a child first. The branch above catches it either way through
       `closest`; this note is here so nobody adds a `[data-m]` back to it. */

    /* NO `[data-m]` BRANCH. The console routes rail rows — see knowledge.js,
       which owns both the rail's DOM and the URL. A second handler here read
       the same attribute and patched the same state a moment earlier, and the
       two disagreed about `sec`: this one set it, that one cleared it, and the
       page rows did nothing at all. One router. */

    /* No `[data-lens]` branch. The Effective / Organization / Yours control it
       served went with the ladder — precedence has two parties now, and a
       three-way filter over two of them is a control with a redundant third
       position. */

    /* ── Editing the file ── */
    const edO = e.target.closest('[data-ed-open]');
    if (edO) { openEdit(edO.getAttribute('data-ed-open')); return; }
    const edC = e.target.closest('[data-ed-cancel]');
    if (edC) { closeEdit(edC.getAttribute('data-ed-cancel')); return; }
    const edS = e.target.closest('[data-ed-save]');
    if (edS) { saveEdit(edS.getAttribute('data-ed-save')); return; }

    /* ── Renaming, which is how an override is ended ──
       One name, one editor. This opens the title at the top of the page and
       puts the cursor in it; the address follows the title, so ending the
       collision and renaming the skill are the same act rather than two
       fields that have to be kept in step. */
    const slO = e.target.closest('[data-slug-open]');
    if (slO) {
      EDIT.add('title:' + slO.getAttribute('data-slug-open'));
      render();
      const f = $('[data-title-ed]');
      if (f) { f.scrollIntoView({ block: 'center' }); f.focus(); f.select(); }
      return;
    }

    const go = e.target.closest('[data-go]');
    /* Opening a skill lands on Instructions, always. You pressed the skill,
       not the part you were last reading of a different one — carrying
       `precedence` across would answer a question nobody asked twice. */
    if (go && go.dataset.go.indexOf('skill:') === 0) {
      patch({ skill: go.dataset.go.slice(6), part: '' }); return;
    }

    /* ── Which half of the list you are looking at ──
       In `f` with the other filters rather than in a key of its own, so it
       survives opening a skill and coming back, and clears with them when the
       module changes. `withF` toggles a key off when it is set to what it
       already holds, which is right for a filter and wrong for a tab — a tab
       has no off. So this writes the blob directly. */
    const ownT = e.target.closest('[data-own]');
    if (ownT) {
      const v = ownT.getAttribute('data-own');
      if (v === ownOf(st)) return;
      const f = readF(st);
      f.own = v;
      patch({ f: Object.keys(f).map((k) => k + ':' + f[k]).join(',') });
      return;
    }

    /* Back to the list. The detail is a page now, not a column beside one, so
       there is somewhere to go back TO — and it goes back to the HALF the
       skill lives in. Following "Open theirs" from your own overridden skill
       crosses from one tab to the other, and returning to the tab you happened
       to leave from would put you on a list the skill you just read is not in. */
    if (e.target.closest('[data-back]')) {
      const cur = skillById(st.skill);
      const f = readF(st);
      if (cur) f.own = cur.own;
      patch({ skill: '', part: '',
              f: Object.keys(f).map((k) => k + ':' + f[k]).join(',') });
      return;
    }

    /* ── EDITING WHAT A SKILL REACHES ──
       Two lists, two menus, same control: tick to add, tick again to remove,
       and the panel stays open because choosing three agents is one decision.
       Every tick commits, so the card behind updates as you go. */
    const pAg = e.target.closest('[data-pick-ag]');
    if (pAg) {
      const s0 = skillById(pAg.getAttribute('data-pick-ag'));
      if (s0) paintReachPick(pAg, s0, 'agents');
      return;
    }
    const pPr = e.target.closest('[data-pick-pr]');
    if (pPr) {
      const s0 = skillById(pPr.getAttribute('data-pick-pr'));
      if (s0) paintReachPick(pPr, s0, 'products');
      return;
    }
    /* ── The title, edited in place ──
       Reached from the overflow menu and from the precedence insight. Read the
       id BEFORE anything re-renders: this fires on a button that lives inside
       the popover, and `render()` destroys it. */
    const tO = e.target.closest('[data-title-open]');
    if (tO) {
      const tid = tO.getAttribute('data-title-open');
      closePop();
      EDIT.add('title:' + tid);
      render();
      const f = $('[data-title-ed]');
      if (f) { f.scrollIntoView({ block: 'center' }); f.focus(); f.select(); }
      return;
    }

    const pTr = e.target.closest('[data-pick-tr]');
    if (pTr) {
      const s0 = skillById(pTr.getAttribute('data-pick-tr'));
      if (s0) paintTriggerPick(pTr, s0);
      return;
    }
    const tv = e.target.closest('[data-trig-val]');
    if (tv) {
      const [sid, val] = tv.getAttribute('data-trig-val').split('|');
      const s0 = skillById(sid);
      if (!s0) return;
      s0.trigger = val;
      DIRTY.add('trigger:' + sid);
      closePop();
      render();
      return;
    }

    const rv2 = e.target.closest('[data-reach-val]');
    if (rv2) {
      const [sid, kind, val] = rv2.getAttribute('data-reach-val').split('|');
      const s0 = skillById(sid);
      if (!s0) return;
      const list = s0[kind] || (s0[kind] = []);
      const at = list.indexOf(val);
      if (at > -1) list.splice(at, 1); else list.push(val);
      DIRTY.add('reach:' + sid);
      render();
      const anchor = $('[data-pick-' + (kind === 'agents' ? 'ag' : 'pr') + '="' + sid + '"]');
      if (anchor) paintReachPick(anchor, s0, kind); else closePop();
      return;
    }

    /* The skill's own overflow. `Open the file` was the first item and pointed
       at the Contents tab — which is two inches above it, always visible, and
       already named. A menu item whose whole effect is to press a control the
       reader can see is a longer way to do the same click. */
    const sMenu = e.target.closest('[data-skill-menu]');
    if (sMenu) {
      const s0 = skillById(sMenu.getAttribute('data-skill-menu'));
      if (!s0) return;
      popover(sMenu, `
        <button class="set2-pop-i" type="button" data-title-open="${esc(s0.id)}"><span class="set2-pop-n">Rename</span></button>
        <button class="set2-pop-i" type="button" data-example><span class="set2-pop-n">Download as SKILL.md</span></button>`);
      return;
    }

    /* A part names its own skill so the URL is explicit afterwards. Without
       it, pressing a part of the default-selected skill would write `part`
       against no `skill`, and the next filter change would move the document
       out from under the part you had chosen. */
    const prt = e.target.closest('[data-part]');
    if (prt) { patch({ part: prt.dataset.part, skill: prt.dataset.sid || st.skill }); return; }

    /* ── One search, not a walk ── */
    const pth = e.target.closest('[data-path]');
    if (pth) { openPathPicker(pth, crmOf(st), pth.getAttribute('data-path')); return; }

    const addSub = e.target.closest('[data-add-sub]');
    if (addSub) {
      const c = crmOf(st);
      if (draftNode(c)) { focusDraft(); return; }
      const nd = nodeAt(c, addSub.getAttribute('data-add-sub'));
      if (!nd) return;
      nd.node.kids = nd.node.kids || [];
      nd.node.kids.push({ ctx: '', path: [], state: 'unmapped', draft: true });
      render(); return;
    }

    /* A new mapping starts UNMAPPED and named after nothing, because naming it
       is the first decision and pre-filling one would be guessing. */
    /* It named the field FOR you, walking a fixed list and falling back to
       "New field" — so the first thing you did after adding one was rename
       something you had just been handed. It asks. */
    if (e.target.closest('[data-add-field]')) {
      const c = crmOf(st);
      /* One at a time. A second draft while the first is unnamed would leave
         two rows that are not yet fields. */
      if (c.maps.some((m) => m.draft)) { focusDraft(); return; }
      c.maps.push({ ctx: '', path: [], state: 'unmapped', draft: true });
      render(); return;
    }

    const adv = e.target.closest('[data-adv]');
    if (adv) { const k = adv.getAttribute('data-adv');
      ADV.has(k) ? ADV.delete(k) : ADV.add(k); render(); return; }


    /* ── Removing ──
       A SUBFIELD is removed outright: it exists only because somebody added
       it. A TOP-LEVEL field is not — the context field still exists and still
       needs an answer, so it drops back to "Not mapped" rather than vanishing
       from a list that is meant to be the full vocabulary. Its children go
       with it, because a derivation of nothing derives nothing. */
    const mdel = e.target.closest('[data-map-del]');
    if (mdel) {
      const c = crmOf(st);
      const nd = nodeAt(c, mdel.getAttribute('data-map-del'));
      if (!nd) return;
      if (nd.parent) nd.list.splice(nd.at, 1);
      else { nd.node.path = []; nd.node.state = 'unmapped';
             delete nd.node.values; delete nd.node.idres; delete nd.node.kids; }
      DIRTY.add('maps'); render(); return;
    }
    const mok = e.target.closest('[data-map-ok]');
    if (mok) {
      const nd = nodeAt(crmOf(st), mok.getAttribute('data-map-ok'));
      if (nd) { nd.node.state = 'confirmed'; DIRTY.add('maps'); render(); }
      return;
    }
    if (e.target.closest('[data-map-ok-all]')) {
      const c = crmOf(st);
      mapNodes(c).forEach(({ m }) => {
        if (m.state === 'suggested' && !m.derive && walkPath(c.crmId, m.path).ok) m.state = 'confirmed';
      });
      DIRTY.add('maps'); render(); return;
    }

    /* Criteria join. */
    const join = e.target.closest('[data-join]');
    if (join) { primaryOf(st).join = join.dataset.join; DIRTY.add('criteria'); render(); return; }

    /* ── THE DRY RUN ──
       Same criteria, same window, same connector set as Run sync -- the only
       difference is that nothing is written. A test that read a different
       filter to the one the button beneath it would run is worse than no test,
       because it would be believed. */
    if (e.target.closest('[data-test]')) {
      /* No backwards-range refusal. The range picker orders its ends, so the
         pair this used to reject cannot be built. */
      const c = crmOf(st);
      c.previewed = true;
      /* Repaint the page under the modal too. The checklist's fourth step is
         "run a preview", and it has just been satisfied -- leaving the page
         stale means the step stays open behind the thing that completed it. */
      render();
      MODAL = { kind: 'preview', c: c };
      paintModal(); return;
    }

    /* The setup checklist that `[data-setup-hide]` dismissed is gone — it
       restated the mapping tally one line above the mapping tally. Its handler
       went with it rather than being left listening for a control nothing
       renders. */

    /* ── Criteria ── */
    const cdel = e.target.closest('[data-crit-del]');
    if (cdel) { const c = primaryOf(st); c.criteria.splice(+cdel.dataset.critDel, 1);
                DIRTY.add('criteria'); render(); return; }
    /* Picking from the typeahead adds the filter and clears the box, because
       the next thing you do is almost always add a second one. */
    const critPick = e.target.closest('[data-crit-pick]');
    if (critPick) {
      const [k, v] = critPick.getAttribute('data-crit-pick').split('|');
      const c0 = primaryOf(st);
      if (c0 && !c0.criteria.some((x) => x[0] === k && x[1] === v)) {
        c0.criteria.push([k, v]);
        DIRTY.add('criteria'); markDirtyStage('records');
      }
      render(); return;
    }
    /* A retry is a run, so it goes where runs go. The prototype has no queue
       behind it; what matters here is that the affordance sits on the row that
       failed rather than in a section of its own. */
    /* Each field commits itself. There is no page-level state to flush, so
       this writes the value and says so on the row it belongs to. */
    const whs = e.target.closest('[data-wh-save]');
    if (whs) {
      const key = whs.getAttribute('data-wh-save');
      const [cid, which] = key.split(':');
      const ep = ENDPOINTS[cid];
      const box = $('[data-wh-in="' + key + '"]');
      if (ep && box) {
        const v = box.value.trim();
        if (!v) return;
        if (which === 'url') ep.url = v; else ep.token = v;
        box.value = v;
        /* Back to rest: quiet, inert, and saying what just happened. */
        whs.classList.remove('is-dirty'); whs.disabled = true; whs.textContent = 'Saved';
        setTimeout(() => { const b = $('[data-wh-save="' + key + '"]');
                           if (b && b.disabled) b.textContent = 'Save'; }, 1600);
      }
      return;
    }

    /* Was `[data-retry]`, and its whole body was `return` — a button that
       rendered on every failed row and did nothing when pressed. */
    const why = e.target.closest('[data-why]');
    if (why) {
      const [cid, i] = why.getAttribute('data-why').split('|');
      const c = connById(cid);
      const r = c && c.runs[+i];
      if (r && r[5]) openFailPop(why, c, r);
      return;
    }

    const cadd = e.target.closest('[data-crit-add]');
    if (cadd) { openCritPicker(cadd, primaryOf(st)); return; }

    /* ── The consequential ones ── */
    const retGo = e.target.closest('[data-ret-go]');
    if (retGo) {
      const r = RETENTION.filter((x) => x.id === retGo.dataset.retGo)[0];
      confirmDelete(r); return;
    }
    /* ── Scopes ── */
    /* Selecting a node is a PLACE, so it writes `node` — the same key People
       stands on. That is deliberate and it is the payoff for the two modules
       sharing a tree: pick InterFAX Support on the map, press through to the
       people who reach it, and you are still on InterFAX Support. */
    const scN = e.target.closest('[data-sc-node]');
    if (scN) { patch({ node: scN.getAttribute('data-sc-node') }); return; }

    /* Opening a branch past the depth cap, and revealing capped siblings.
       Neither is a place — they are gestures mid-read — so neither touches the
       URL, and both repaint rather than navigate. */
    const scE = e.target.closest('[data-sc-exp]');
    if (scE) { const k = scE.getAttribute('data-sc-exp');
      SC_OPEN.has(k) ? SC_OPEN.delete(k) : SC_OPEN.add(k); render(); return; }
    const scM = e.target.closest('[data-sc-more]');
    if (scM) { SC_MORE.add(scM.getAttribute('data-sc-more')); render(); return; }
    if (e.target.closest('[data-sc-fit]')) { SC_FIT = !SC_FIT; render(); return; }

    /* The two ways out of the inspector. It carries counts and nothing more,
       because each of these is a question another page already answers
       properly — and answering it twice, differently, is how two surfaces
       start disagreeing about who can reach what. */
    const scP = e.target.closest('[data-sc-people]');
    if (scP) { patch({ sec: 'people', node: scP.getAttribute('data-sc-people'),
                       f: withF(st, 'q', null) }); return; }
    const scS = e.target.closest('[data-sc-skills]');
    if (scS) { patch({ m: 'skills', sec: '', skill: '', part: '' }); return; }

    /* ── Roles ── */
    /* Picking a role clears the capability search: the search is the OTHER
       question, and pressing a role name is somebody going back to the first
       one. Leaving the query up would answer neither. */
    const rlGo = e.target.closest('[data-role-go]');
    if (rlGo) { patch({ role: rlGo.getAttribute('data-role-go'),
                        f: withF(st, 'cap', null) }); return; }

    /* "Show all" is the comparison being switched off, not a separate view. */
    const rlVs = e.target.closest('[data-role-vs]');
    if (rlVs) { patch({ vs: rlVs.getAttribute('data-role-vs') || '' }); return; }

    /* Who holds it is a question about PEOPLE, so it is answered there —
       filtered to the role, and at the root, because the holders of a role are
       spread across every scope and the directory is the only place that shows
       all of them at once. */
    /* No `[data-role-holders]`. "Held by Alex Smith" came off the detail — the
       nav beside it already carries a count against every role, which answers
       the same question for all six at once instead of for the open one. */

    /* ── People ── */
    /* The collapsible grant group, its delete, its per-chip revoke and the
       "+ Add scope" that skipped to step three all addressed the person CARD,
       which is gone. A grant is revoked where it applies now — `data-revoke`
       below — and there is nothing left for these to address. */

    /* Moving the page's scope. Search is cleared on the way, because every
       route into this — a crumb, a scope chip, the tree — is somebody saying
       "take me there", and landing there with a query still filtering the view
       would answer a question they had already stopped asking. */
    const sGo = e.target.closest('[data-scope-go]');
    if (sGo) { closePop(); patch({ node: sGo.getAttribute('data-scope-go'), f: withF(st, 'q', null) }); return; }

    const sPick = e.target.closest('[data-scope-pick]');
    if (sPick) { SCOPE_Q = '';
      paintScopePick(sPick, sPick.getAttribute('data-scope-pick'), ''); return; }

    /* Revoking AT a node: strip this node's name out of every grant of theirs
       that names it, and drop any grant left reaching nothing. Grants written
       on an ancestor are untouched — those are not this page's to remove, and
       the row that carries them says so instead of offering a button. */
    const rv = e.target.closest('[data-revoke]');
    if (rv) {
      const [pid, nid] = rv.getAttribute('data-revoke').split(':');
      const p = personById(pid), n = nodeById(nid);
      if (!p || !n) return;
      p.grants = p.grants.filter((g) => {
        if (!covers(g, n)) return true;
        g.v.splice(g.v.indexOf(n.name), 1);
        return g.v.length > 0;
      });
      DIRTY.add('grant:' + p.id); render(); return;
    }

    const rNew = e.target.closest('[data-role-new]');
    if (rNew) { RPICK = { pid: rNew.getAttribute('data-role-new'), gi: null, step: 'role', q: '', v: [] };
      paintRPick(rNew); return; }

    /* ── THE ANCHOR HAS TO OUTLIVE WHAT OPENED IT ──
       This looked up `[data-role-new]`, which lives INSIDE the kebab popover.
       Chaining from the kebab into the role picker destroys that button, so
       from the second step on the lookup returned null and the panel closed
       itself — which made the client list single-select by accident: pick one
       and the whole thing vanished before you could pick a second.

       `POP_OPENER` is the element the chain is anchored to and is still in the
       row, so it is the fallback. */
    /* ── THE ANCHOR HAS TO BE RE-FOUND, NOT REMEMBERED ──
       Every tick in the client list calls `render()`, which rebuilds the rows
       — so the kebab this panel was opened from is a DETACHED node by the time
       the panel is re-placed against it. A detached element measures as zeros
       and both clamps resolve to 8, which is the panel jumping to the top-left
       corner of the window after you choose a client.

       So the anchor is looked up fresh from the live DOM each time, keyed on
       the person rather than on the element: `[data-person-menu]` is on the
       row and survives the repaint, while `[data-role-new]` lives INSIDE the
       menu and does not. `POP_OPENER` stays as a last resort and is only
       trusted while it is still in the document. */
    const rpAnchor = () => {
      if (RPICK && RPICK.bulk) return $('[data-bulk-grant]') || null;
      const pid = RPICK ? RPICK.pid : '';
      return $('[data-person-menu="' + pid + '"]')
          || $('[data-role-new="' + pid + '"]')
          || (POP_OPENER && POP_OPENER.isConnected ? POP_OPENER : null);
    };

    /* ── BACK GOES WHERE YOU CAME FROM ──
       Two steps, so from the clients you go back to the roles — but WHICH
       roles depends on how you got here. Granting came through the chooser of
       all six; editing came through the list of the ones this person holds.
       Sending an edit back to the chooser offered to extend a different grant
       than the one being edited, from a panel that still said "back". */
    const rpBack = e.target.closest('[data-rp-back]');
    if (rpBack && RPICK) {
      const anchor = rpAnchor() || rpBack;
      if (RPICK.from === 'edit') {
        const p = personById(RPICK.pid);
        RPICK = null;
        if (p) roleListPop(anchor, p, 'data-edit-role-go'); else closePop();
        return;
      }
      RPICK.step = 'role';
      paintRPick(anchor); return; }

    const rpRole = e.target.closest('[data-rp-role]');
    if (rpRole && RPICK) {
      RPICK.role = rpRole.getAttribute('data-rp-role');
      /* ── ONE QUESTION, NOT THREE ──
         The picker asks role, then scope TYPE, then which scopes. Opened from
         a page that is already standing on a scope, two of those are answered
         before it opens — so it asks the one that is not, and commits. The
         three-step walk survives for the paths where the scope genuinely is
         the question: the kebab's "Grant a role", and anyone holding nothing. */
      if (RPICK.at) { grantAt(RPICK); closePop(); RPICK = null; render(); return; }
      RPICK.type = 'Client';
      RPICK.step = 'val';
      paintRPick(rpAnchor() || rpRole); return; }

    /* No `[data-rp-type]` branch. The step it served is gone, and a handler
       waiting on a control nothing renders is the kind of thing that survives
       three rewrites looking load-bearing. */

    /* The grant is created the moment the FIRST value is chosen, not when the
       panel closes. A role with no scope reaches nothing, so there is no state
       worth having between "picked a type" and "picked something". */
    const rpVal = e.target.closest('[data-rp-val]');
    if (rpVal && RPICK && RPICK.bulk) {
      /* Granted to everyone ticked in one move. Someone who already holds this
         role on this scope TYPE gains the scope rather than a duplicate group:
         two "QA Manager on Client" rows on one card is a state nobody asked
         for and nobody can tell apart. */
      const v = rpVal.getAttribute('data-rp-val');
      PEOPLE.filter((x) => PICKED.has(x.id)).forEach((x) => {
        let g = x.grants.filter((y) => y.r === RPICK.role && y.t === RPICK.type)[0];
        if (!g) { g = { r: RPICK.role, t: RPICK.type, v: [] }; x.grants.push(g); }
        if (g.v.indexOf(v) < 0) g.v.push(v);
        DIRTY.add('grant:' + x.id);
      });
      render();
      const anchor = $('[data-bulk-grant]');
      if (anchor) paintRPick(anchor); else closePop();
      return;
    }
    if (rpVal && RPICK) {
      const p = personById(RPICK.pid); if (!p) return;
      const v = rpVal.getAttribute('data-rp-val');
      /* ── ONE GRANT PER ROLE, NOT ONE PER VISIT ──
         This only ever reused a grant when `gi` was already set, so coming in
         fresh from "Grant a role" it pushed a NEW one — and granting Manager
         twice left two "Manager" rows against the same person that nothing
         could tell apart. The bulk path has always deduped on the role; the
         single path now does the same, which is the only thing that makes
         multi-select add clients to a grant rather than grants to a person. */
      let g = RPICK.gi != null ? p.grants[RPICK.gi] : null;
      if (!g) {
        g = p.grants.filter((y) => y.r === RPICK.role && y.t === RPICK.type)[0];
        if (g) RPICK.gi = p.grants.indexOf(g);
      }
      if (!g) { g = { r: RPICK.role, t: RPICK.type, v: [] };
                p.grants.push(g); RPICK.gi = p.grants.length - 1;
                }
      const at = g.v.indexOf(v);
      if (at > -1) g.v.splice(at, 1); else g.v.push(v);
      /* A group emptied of every value is a grant that reaches nothing. */
      if (!g.v.length) { p.grants.splice(RPICK.gi, 1); RPICK.gi = null; }
      DIRTY.add('grant:' + p.id);
      render();
      const anchor = rpAnchor();
      if (anchor) paintRPick(anchor); else closePop();
      return;
    }

    /* ── What you sell ── */
    const sellOpen = e.target.closest('[data-sell-open]');
    if (sellOpen) { paintSellPick(sellOpen); return; }
    const sellRm = e.target.closest('[data-sell-rm]');
    if (sellRm) {
      const list = mySells();
      const at = list.indexOf(sellRm.getAttribute('data-sell-rm'));
      if (at > -1) list.splice(at, 1);
      DIRTY.add('sell');
      render();
      return;
    }

    const pMenu = e.target.closest('[data-person-menu]');
    if (pMenu) {
      const p = personById(pMenu.getAttribute('data-person-menu'));
      if (!p) return;
      /* ── FIVE ITEMS, TWO IDEAS ──
         Three ways to change what somebody can reach, then two that are not
         about access at all. Labelled and ruled, the reader sorts them before
         reading any of them; flat, they were five equal sentences with the
         irreversible one sitting a row under Copy email. */
      popover(pMenu, `
        <div class="set2-pop-t">Access</div>
        <button class="set2-pop-i" type="button" data-role-new="${esc(p.id)}"><span class="set2-pop-n">Grant a role</span></button>
        ${/* Per ROLE, which is the unit somebody actually holds: a person has
              several roles and each one spans several clients, so "Employee,
              everywhere" is one decision and revoking it three times at three
              clients is the same decision typed three times. Per-scope revoke
              stays where it belongs — on the row, at the scope you are
              standing on. */ ''}
        ${/* Edit changes WHICH CLIENTS a role reaches; revoke takes the role
              away entirely. Two different acts on the same object, so they are
              two items rather than one that means both depending on what you
              do inside it. */ ''}
        ${p.grants.length ? `<button class="set2-pop-i" type="button" data-edit-role="${esc(p.id)}">
          <span class="set2-pop-n">Edit a role</span>
          <span class="set2-pop-s">add or remove clients</span></button>` : ''}
        ${p.grants.length ? `<button class="set2-pop-i" type="button" data-rm-role="${esc(p.id)}">
          <span class="set2-pop-n">Revoke a role</span>
          <span class="set2-pop-s">${p.grants.length} held</span></button>` : ''}
        ${p.s[0] === 'is-warn' ? '<button class="set2-pop-i" type="button"><span class="set2-pop-n">Resend invite</span></button>' : ''}
        ${/* Space, not a rule. The heading above already says where the first
              group ends; a line here would be a second mark for one fact, and
              the only rule this panel keeps is the one under its title. */ ''}
        <button class="set2-pop-i is-gap" type="button" data-copy="${esc(p.mail)}"><span class="set2-pop-n">Copy email</span></button>
        <button class="set2-pop-i is-err" type="button" data-rm-one="${esc(p.id)}"><span class="set2-pop-n">Remove from workspace</span></button>`);
      return;
    }

    /* Setting a capability for the open role. `CAPS` is the model both the
       detail and the diff read, so one write updates the row, the "differs in
       N of 12" count and the compared column together. */
    const capB = e.target.closest('[data-cap]');
    if (capB) {
      const [group, cap, ix, val] = capB.getAttribute('data-cap').split('|');
      const grp = CAPS.filter((x) => x[0] === group)[0];
      const row = grp && grp[1].filter((x) => x[0] === cap)[0];
      if (!row || row[1][+ix] === 'lock') return;
      row[1][+ix] = val;
      DIRTY.add('roles'); render(); return;
    }

    /* One person's roles, open or shut. */
    const rTog = e.target.closest('[data-roles]');
    if (rTog) { const k = rTog.getAttribute('data-roles');
      ROPEN.has(k) ? ROPEN.delete(k) : ROPEN.add(k); render(); return; }

    const rmR = e.target.closest('[data-rm-role]');
    if (rmR) {
      const p = personById(rmR.getAttribute('data-rm-role'));
      if (p) roleListPop(rmR, p, 'data-rm-role-go');
      return;
    }

    /* ── EDITING WHICH CLIENTS A ROLE REACHES ──
       Straight to step two with the grant already chosen, so the panel opens
       on the client list with this role's clients ticked. Ticking adds and
       unticking removes, against the grant itself — which is why it reuses the
       picker rather than reimplementing a second multi-select that would drift
       from it. Emptying the last client removes the grant, because a role
       reaching nothing is not a role somebody holds. */
    const edR = e.target.closest('[data-edit-role]');
    if (edR) {
      const p = personById(edR.getAttribute('data-edit-role'));
      if (p) roleListPop(edR, p, 'data-edit-role-go');
      return;
    }

    const edGo = e.target.closest('[data-edit-role-go]');
    if (edGo) {
      const [pid, gi] = edGo.getAttribute('data-edit-role-go').split(':');
      const p = personById(pid);
      const g = p && p.grants[+gi];
      if (!g) return;
      RPICK = { pid: pid, gi: +gi, step: 'val', role: g.r, type: g.t, from: 'edit' };
      paintRPick(edGo);
      return;
    }

    /* Resolved to the OBJECT before splicing. Indices shift as you delete, and
       this file has already been caught removing the wrong grant that way. */
    const rmRGo = e.target.closest('[data-rm-role-go]');
    if (rmRGo) {
      const [pid, gi] = rmRGo.getAttribute('data-rm-role-go').split(':');
      const p = personById(pid);
      const g = p && p.grants[+gi];
      if (!g) return;
      const at = p.grants.indexOf(g);
      if (at > -1) p.grants.splice(at, 1);
      DIRTY.add('grant:' + p.id);
      closePop(); render(); return;
    }

    /* ── Selection ── */
    const pk = e.target.closest('[data-pick-p]');
    if (pk) { const id = pk.getAttribute('data-pick-p');
      PICKED.has(id) ? PICKED.delete(id) : PICKED.add(id); render(); return; }

    if (e.target.closest('[data-pick-none]')) { PICKED.clear(); render(); return; }

    /* One role, granted to everyone ticked. Same picker a single person uses —
       the operation is identical, only the target is plural.

       Standing ON a client pre-answers the second step, so the panel asks the
       role and commits. At the root it does not: "every client" is not a thing
       you should be able to grant by pressing one button that does not say so,
       and the client multi-select is where that decision belongs. */
    const bg = e.target.closest('[data-bulk-grant]');
    if (bg) {
      const c = clientOfSt(st);
      RPICK = { pid: null, bulk: true, gi: null, step: 'role', q: '', v: [],
                at: c ? { t: 'Client', v: c.name } : null };
      paintRPick(bg); return; }

    const brs = e.target.closest('[data-bulk-resend]');
    if (brs) { brs.disabled = true; brs.textContent = 'Sent'; return; }

    if (e.target.closest('[data-bulk-rm]')) {
      MODAL = { kind: 'rmpeople', people: PEOPLE.filter((p) => PICKED.has(p.id)) };
      paintModal(); return;
    }
    const rmOne = e.target.closest('[data-rm-one]');
    if (rmOne) {
      const p = personById(rmOne.getAttribute('data-rm-one'));
      if (p) { MODAL = { kind: 'rmpeople', people: [p] }; paintModal(); }
      return;
    }

    /* ── Adding somebody ── */
    const addU = e.target.closest('[data-add-user]');
    if (addU) {
      ADDU.name = ''; ADDU.mail = ''; ADDU.title = ''; ADDU.role = ''; ADDU.bad = null;
      ADDU.client = addU.getAttribute('data-add-user') || '';
      MODAL = { kind: 'adduser' }; paintModal(); return;
    }

    if (e.target.closest('[data-au-add]')) {
      readAddU();

      /* Every field that is wrong says so, in one pass. Validating to the
         first failure makes somebody fix three things in three rounds. */
      const bad = {};
      if (!ADDU.name) bad.name = 'A name is required.';
      if (!ADDU.mail) bad.mail = 'An email address is required.';
      else if (!MAIL_RE.test(ADDU.mail)) bad.mail = '“' + ADDU.mail + '” is not an email address.';
      else if (PEOPLE.some((x) => x.mail.toLowerCase() === ADDU.mail.toLowerCase()))
        bad.mail = 'Somebody in this workspace already has that address.';
      if (!ADDU.title) bad.title = 'A job title is required.';
      const cl = ADDU.client ? findNode(ADDU.client) : null;
      if (cl && !ADDU.role) bad.role = 'Pick what they may do on ' + cl.name + '.';

      if (Object.keys(bad).length) {
        ADDU.bad = bad;
        paintModal();
        /* ══ THE FORM SAYS NO, AND SAYS WHERE ═════════════════════
           Colouring the bad fields and stopping was the whole of the answer.
           Three of them can be wrong at once, the dialog scrolls, and the
           submit button is at the bottom - so the reader could press Add, have
           nothing happen anywhere they were looking, and press it again.

           The shake is the refusal. The focus is where to fix it. Both are
           needed: one says something went wrong, the other says what.

           `.is-bad` and `.is-shaking` stay ORTHOGONAL, and that is the point
           of two classes rather than one. Rolled together, replaying the shake
           on a second failed submit would have to strip the error treatment
           off every field and put it back, flickering the thing the reader is
           trying to read. */
        const M = window.AIMY_MOTION;
        const host = $('#setModal');
        const box = host && $('.set2-modal', host);
        if (box && M && !M.reduced()) {
          box.classList.remove('is-shaking');
          /* Remove, reflow, re-add. Without the forced recalculation both
             writes land in one style pass and there is nothing to replay. */
          void box.offsetWidth;
          box.classList.add('is-shaking');
          M.after(box, () => box.classList.remove('is-shaking'));
        }
        /* paintModal has already focused the first field in the dialog. The
           first field and the first BAD field are rarely the same one. */
        /* `.set2-fld` is the CONTROL, not a wrapper around one - the input
           itself carries `is-bad`. Both shapes are handled because the hint
           and the field have worn that class in turn, and a selector that
           assumes either one silently focuses nothing. */
        const badEl = host && $('.is-bad', host);
        const first = !badEl ? null
          : (badEl.matches('input, textarea, select, button, [tabindex]')
              ? badEl
              : $('input, textarea, select, button, [tabindex]', badEl));
        if (first) {
          first.scrollIntoView({ block: 'center',
            behavior: (M && M.reduced()) ? 'auto' : 'smooth' });
          first.focus({ preventScroll: true });
        }
        return;
      }

      PEOPLE.push({
        id: 'p' + Date.now().toString(36),
        name: ADDU.name, mail: ADDU.mail, title: ADDU.title,
        s: ['is-warn', 'Invite pending'],
        /* Added on a client, they arrive holding the role you named on it —
           which is what makes the row appear in the list you added them to.
           Added at the root, they arrive reaching nothing, as before. */
        grants: cl ? [{ r: ADDU.role, t: 'Client', v: [cl.name] }] : []
      });
      const stay = ADDU.client;
      ADDU.name = ''; ADDU.mail = ''; ADDU.title = ''; ADDU.role = ''; ADDU.client = ''; ADDU.bad = null;
      closeModal();
      /* The row arriving IS the confirmation — a toast saying the same thing
         over the top of it would be the product telling you what you can
         already see. So the view does not move: added at the root they appear
         under No access, added on a client they appear in that client's list,
         and either way you are looking at them. */
      DIRTY.add('people');
      patch({ node: stay, f: withF(readURL(), 'q', null) });
      return;
    }

    /* ── Filters ── */
    /* Clearing filters keeps `own`. It is stored with them because it lives in
       the same blob, but it is a PLACE you are, not a narrowing you applied —
       emptying the whole blob would answer "clear these filters" by moving you
       to the other half of the list. */
    /* The x inside the field clears the QUERY only. `Clear filters` in the
       empty state clears the dropdowns too, which is a different act — and the
       one that arrives when a search has already emptied the list. */
    const fqx = e.target.closest('[data-fq-clear]');
    if (fqx) {
      const key = fqx.getAttribute('data-fq-key') || 'q';
      patch({ f: withF(st, key, null) });
      const back = $('[data-f-q]');
      if (back) back.focus();
      return;
    }

    if (e.target.closest('[data-f-clear]')) {
      const cur = readF(st).own;
      patch({ f: cur ? 'own:' + cur : '' });
      return;
    }

    /* The three-state column sort went with the skills table. It was the only
       thing writing `f=sort:…`, and nothing left on this surface is ordered by
       a header — so the handler goes rather than sitting here waiting for a
       control that no longer renders. */

    /* ── The date range for one run ── */
    if (e.target.closest('[data-range-clear]') || e.target.closest('[data-scal-clear]')) {
      const c = primaryOf(st);
      if (c) {
        c.range = ['', ''];
        DIRTY.add('range');
        /* Clearing from inside the panel leaves it open — you cleared in order
           to pick again, and closing under you would mean re-opening it. From
           the ✕ beside the field there is nothing open to leave. */
        calOpen = !!e.target.closest('[data-scal-clear]');
        calPick = null; calMonth = null;
        render();
      }
      return;
    }

    /* ── Our calendar ──
       One trigger, toggling. `calMonth` and any half-finished pick are cleared
       on every open, so the panel lands on the range's own month and never
       resumes a selection somebody abandoned. */
    if (e.target.closest('[data-range-open]')) {
      calOpen = !calOpen;
      calPick = null; calMonth = null;
      render();
      return;
    }
    const calNav = e.target.closest('[data-scal-nav]');
    if (calNav) {
      const step = +calNav.getAttribute('data-scal-nav');
      const cur = $('.set2-cal .cal-title');
      /* Read the month off the panel rather than keeping a second copy of it:
         whatever is on screen is what "next" means. */
      const parts = cur ? cur.textContent.trim().split(' ') : null;
      const mi = parts ? CAL_MONTHS.indexOf(parts[0]) : -1;
      const base = mi > -1 ? new Date(Date.UTC(+parts[1], mi, 1)) : new Date();
      calMonth = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + step, 1));
      render();
      return;
    }
    const calDay = e.target.closest('[data-scal-day]');
    if (calDay) {
      const c = primaryOf(st);
      const v = calDay.getAttribute('data-scal-day');
      if (c) {
        if (calPick === null) {
          /* First of two. Nothing is written yet: a range with one end is not
             a range, and writing it would leave the form in a state the picker
             is one click away from replacing. */
          calPick = v;
        } else {
          /* ── THE COMPONENT ORDERS ITS OWN ENDS ──
             Whichever day was pressed first, the earlier one is the start.
             This is the whole reason a range picker beats two date fields: a
             backwards range is not caught, it is impossible. */
          c.range = calPick <= v ? [calPick, v] : [v, calPick];
          DIRTY.add('range');
          calPick = null; calOpen = false; calMonth = null;
        }
        render();
      }
      return;
    }
    /* Anywhere else puts it away — including the rest of the form, which is
       the gesture people use without thinking. A pick left half-made is
       dropped rather than kept: one end is not a range. */
    if (calOpen && !e.target.closest('.set2-cal')) {
      calOpen = false; calPick = null; calMonth = null; render();
    }

    /* ── The connection picker ──
       One control for what the console spread across three: a product picker
       in the page chrome, a CRM picker in a section header, and a disabled
       third copy of the product inside the sync form. */
    const clPick = e.target.closest('[data-client-pick]');
    if (clPick) {
      const cur = clientOf(st);
      popover(clPick, CLIENT_LIST.map((cl) => {
        const n = connectedOf(cl).length;
        return `
        <button class="set2-pop-i${cl === cur ? ' is-on' : ''}" type="button" data-client-go="${esc(cl)}">
          <span class="set2-pop-n">${esc(cl)}</span>
          <span class="set2-pop-s">${n ? n + ' connected' : 'nothing connected'}</span>
        </button>`;
      }).join(''));
      return;
    }
    const cgo2 = e.target.closest('[data-client-go]');
    if (cgo2) { closePop();
      /* The product goes with the client. Carrying it across would leave the
         bar naming a pair that does not exist, which is the bug this replaced. */
      patch({ sc: cgo2.getAttribute('data-client-go'), sp: '', crm: '' }); return; }

    const pick = e.target.closest('[data-prod-pick]');
    if (pick) {
      const cur = prodOf(st);
      popover(pick, connectedOf(clientOf(st)).map((p) => {
        const list = connsOf(p);
        const bad = list.filter((c) => c.health[0] === 'is-err').length;
        return `
        <button class="set2-pop-i${p === cur ? ' is-on' : ''}" type="button" data-prod-go="${esc(p)}">
          <span class="set2-pop-n">${esc(p)}</span>
          <span class="set2-pop-p">${list.map((c) => esc(c.crm)).join(', ')}${bad ? ' \u00b7 ' + bad + ' down' : ''}</span>
        </button>`;
      }).join(''));
      return;
    }
    const pgo = e.target.closest('[data-prod-go]');
    if (pgo) { closePop(); patch({ sp: pgo.getAttribute('data-prod-go'), crm: '' }); return; }

    /* The CRM sub-picker, which exists on Config alone. */
    const cpick = e.target.closest('[data-crm-pick]');
    if (cpick) {
      const cur = crmOf(st);
      popover(cpick, connsOf(prodOf(st)).map((c) => `
        <button class="set2-pop-i${c.id === cur.id ? ' is-on' : ''}" type="button" data-crm-go="${esc(c.crmId)}">
          <span class="set2-pop-n">${esc(c.crm)}</span>
          <span class="set2-pop-p">${esc(c.health[1])}</span>
        </button>`).join(''));
      return;
    }
    const cgo = e.target.closest('[data-crm-go]');
    if (cgo) { closePop(); patch({ crm: cgo.getAttribute('data-crm-go') }); return; }

    /* A URL or a token you have to select by hand is one that gets mis-pasted.
       The button says what happened rather than firing a toast across the
       screen — the thing that changed is under the cursor. */
    const cp = e.target.closest('[data-copy]');
    if (cp) {
      const val = cp.getAttribute('data-copy');
      const was = cp.textContent;
      const done = (ok) => { cp.textContent = ok ? 'Copied' : 'Press Ctrl+C';
                             setTimeout(() => { cp.textContent = was; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(() => done(true), () => done(false));
      } else { done(false); }
      return;
    }

    /* A broken mapping is not fixed here — it is fixed in Config, on the row
       that broke. Sending someone to the screen that can act beats a button
       that reports the same failure again. */
    const fgo = e.target.closest('[data-fail-go]');
    if (fgo) { const c = connById(fgo.getAttribute('data-fail-go'));
      if (c) patch({ m: 'config', sp: c.product, crm: c.crmId }); return; }
    const ffix = e.target.closest('[data-fail-fix]');
    if (ffix) { ffix.disabled = true; ffix.textContent = 'Queued'; return; }

    const rev = e.target.closest('[data-reveal]');
    if (rev) {
      const f = document.getElementById(rev.dataset.reveal);
      const shown = f.type === 'text';
      f.type = shown ? 'password' : 'text';
      /* The glyph stays and the label flips. Writing a word into the button
         replaced the eye with the text "Hide" and widened the control. */
      rev.setAttribute('aria-pressed', String(!shown));
      rev.setAttribute('aria-label', shown ? 'Show the token' : 'Hide the token');
      rev.title = shown ? 'Show the token' : 'Hide the token';
      rev.classList.toggle('is-on', !shown);
      return;
    }
    /* ── RUN SYNC ──
       It returned. The button was the end of the flow rather than the start of
       one, so the criteria you had just assembled went nowhere and the history
       below never learned that a run had been asked for.

       A run is a row in the history, written from exactly what the form said:
       the criteria as they stand, the window if one is set, and the count
       those criteria match. It lands as RUNNING, because that is what it is
       the moment you press it, and settles a beat later -- a real sync is not
       instantaneous and a history that only ever shows finished runs cannot
       show you one in flight. */
    if (e.target.closest('[data-run]')) {
      /* ── ONE PRESS, ONE CONNECTOR, ONE ROW ──
         This ran every connector under the product and wrote a row for each,
         which meant one press produced two syncs. The justification was that
         the button sat under a combined match count, so a single row would
         have recorded a third of what the count promised.

         Both halves of that are gone. The count was removed, and Trigger sync
         now names a connector in its header rather than announcing that it
         reaches all of them — so the run is exactly the one you chose, with
         its own criteria and its own window. Syncing the other is choosing it
         and pressing again, which is also the only way to sync one and not the
         other. */
      const c = crmOf(st);
      if (!c) return;
      const r = c.range || ['', ''];

      /* ── A RANGE HAS TO RUN FORWARDS, AND NOW ALWAYS DOES ──
         There was a check here refusing a pair that ended before it started —
         necessary while both ends were free-text date inputs that knew nothing
         about each other. The range picker sorts the two days it is given, so
         the state is unreachable and the guard went with it. */
      const crit = c.criteria.map((k) => k.slice());
      if (r[0] || r[1]) crit.push(['Range', rangeLabel(r)]);
      /* Slot 6 is the sortable clock. Slot 0 stays the human string the column
         prints -- one is for the reader, the other for the sort, and deriving
         either from the other would mean parsing a display format. */
      const row = [stampNow(), crit, 'run', 'Running', matchCount(c), null, Date.now(), 0];
      c.runs.unshift(row);

      DIRTY.add('runs'); markDirtyStage('history');
      render();
      tickRuns();
      setTimeout(() => {
        if (c.runs.indexOf(row) < 0) return;
        /* A run that finished wrote everything it was for, so done catches up
           with the total rather than being left wherever the last tick
           happened to land. */
        row[2] = 'ok'; row[3] = 'Succeeded'; row[7] = row[4];
        render();
      }, RUN_MS);
      return;
    }

    if (e.target.closest('[data-new]')) { MODAL = 'new'; paintModal(); return; }
    if (e.target.closest('[data-open-upload]')) { MODAL = 'upload'; paintModal(); return; }
    if (e.target.closest('[data-open-new]')) { MODAL = 'new'; paintModal(); return; }
    if (e.target.closest('[data-example]')) { downloadExample(); return; }
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    if (e.target.classList && e.target.hasAttribute && e.target.hasAttribute('data-scrim')) { closeModal(); return; }

    const view = e.target.closest('[data-sview]');
    if (view) {
      if (view.dataset.sview === 'raw') RAW.add(view.dataset.sid); else RAW.delete(view.dataset.sid);
      render(); return;
    }

    /* The result lands on the model the pill and the "Last call" line already
       read, so one write updates the header, the note and the rail's health
       note together — rather than three places each told separately. */
    const wht = e.target.closest('[data-wh-test]');
    if (wht) {
      const cid = wht.getAttribute('data-wh-test');
      const ep = ENDPOINTS[cid];
      if (!ep || WH_TESTING.has(cid)) return;
      WH_TESTING.add(cid);
      render();
      setTimeout(() => {
        WH_TESTING.delete(cid);
        const d = new Date();
        const stamp = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ', '
          + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        const ms = (120 + Math.floor(Math.random() * 180)) + 'ms';
        /* A failing endpoint fails again. Pressing Test does not rotate a
           revoked token, and a green result here would be the page telling you
           the thing it is about to keep failing at is fine. */
        ep.last = ep.last[1] === 'is-err'
          ? [stamp, 'is-err', ep.last[2], ms]
          : [stamp, 'is-ok', 'Succeeded', ms];
        render();
      }, 900);
      return;
    }

    const rot = e.target.closest('[data-rotate]');
    if (rot) {
      /* Named from the row that was pressed, not from the Fields picker --
         with two connectors on the page those are different CRMs. */
      const c0 = connById(rot.getAttribute('data-rotate')) || crmOf(readURL());
      MODAL = { kind: 'rotate', crm: (c0 || {}).crm || 'this' };
      paintModal(); return;
    }
    if (e.target.closest('[data-rotate-go]')) { closeModal(); return; }

    /* The `[data-node]` click and keyboard handlers stood here — expand,
       collapse, toggle a target, arrow between rows. They drove the tree
       targeting picker, which no longer renders: nothing on this surface
       carries `data-node` or `data-pick`, and every branch of them called
       `picker()`, `repaintPicker()` or `SEL`, all three now gone. */
  });

  document.addEventListener('input', (e) => {
    /* Repainted on every keystroke ONLY where the form's shape depends on the
       value — the counters and the scope field, which appears once a role is
       chosen. Everything else just stores. */
    /* A comma commits, the same as Enter — people paste comma-separated lists
       out of a spreadsheet and expect that to work. */
    /* The team search is URL state like every other filter, but it is written
       on a debounce: a `patch` per keystroke would push a history entry per
       letter and make the back button unusable.

       The KEY is named by the field, because two pages search different
       things: People looks up a person and Roles looks up a capability. They
       shared `q` for one build and the query survived the move between them,
       so Roles answered "no capability called Karim Fouad" to somebody who had
       never asked it anything. */
    const fq = e.target.closest('[data-f-q]');
    if (fq) {
      const v = e.target.value;
      const key = fq.getAttribute('data-f-key') || 'q';
      clearTimeout(FQ_T);
      FQ_T = setTimeout(() => {
        const st = readURL();
        const el = $('[data-f-q]');
        const at = el ? el.selectionStart : null;
        patch({ f: withF(st, key, v) });
        const back = $('[data-f-q]');
        if (back) { back.focus(); if (at != null) back.setSelectionRange(at, at); }
      }, 260);
      return;
    }

    /* No `[data-pfilter]` branch: it filtered the tree picker's search, and
       the picker is gone. */
    /* Type-to-confirm. The button stays dead until the name matches, so the
       gate is the typing rather than the clicking. */
    /* The confirmed removal. Bound before the generic confirm handler so the
       people case is not mistaken for a retention delete. */
    const rmGo = e.target.closest('[data-confirm-go]');
    if (rmGo && MODAL && MODAL.kind === 'rmpeople') {
      MODAL.people.forEach((p) => {
        const i = PEOPLE.indexOf(p); if (i > -1) PEOPLE.splice(i, 1);
        PICKED.delete(p.id);
      });
      closeModal(); render(); return;
    }

    const cf = e.target.closest('[data-confirm]');
    if (cf) {
      const ok = $('[data-confirm-go]');
      /* Accepts the number with or without its thousands separators, because
         insisting on the comma tests typing rather than reading. */
      const v = cf.value.trim().toLowerCase().replace(/[\s,]/g, '');
      const want = String(cf.dataset.confirm).toLowerCase().replace(/[\s,]/g, '');
      if (ok) ok.disabled = v !== want;
      return;
    }
    /* ── RETENTION THRESHOLD ──
       The consequence recomputes as you type, because a number whose effect
       you cannot see is a number you cannot judge. That was the intent; it was
       not what shipped.

       IT WAS WRITING INTO A ROW THAT DOES NOT EXIST. The handler reached for
       `.set2-row` / `.set2-row-d` / `.set2-from`; `secRetention` renders
       `.set2-set-row` / `.set2-set-d`. `closest` returned null, `$` falls back
       to `document` when its root is falsy, the document has no `.set2-row-d`
       either, and the assignment threw — AFTER `r.days = v` had already
       changed the model.

       So lowering Freshdesk from 90 days to 10 left the row saying "2,105
       records would go" while the confirmation it feeds said 3,976. The error
       was silent, and it was DIRECTIONAL: it always understated the damage as
       you made the threshold more destructive. On the one control here that
       cannot be undone.

       One call to `wouldDelete(r)`, one sentence, written by the same code
       that renders it — so the row and the dialog cannot drift again. */
    /* A credential field wakes its own Save, and only its own, and only when
       the value actually differs from what is stored. Clearing the field puts
       the button back to sleep: an empty endpoint is not a setting. */
    const whi = e.target.closest('[data-wh-in]');
    if (whi) {
      const key = whi.getAttribute('data-wh-in');
      const [cid, which] = key.split(':');
      const ep = ENDPOINTS[cid];
      const b = $('[data-wh-save="' + key + '"]');
      if (ep && b) {
        const v = whi.value.trim();
        const dirty = !!v && v !== (which === 'url' ? ep.url : ep.token);
        b.disabled = !dirty; b.classList.toggle('is-dirty', dirty); b.textContent = 'Save';
      }
      return;
    }
    /* Filtered in place. Re-rendering on each keystroke would rebuild the box
       being typed into and take the caret with it. */
    const cq = e.target.closest('[data-crit-q]');
    if (cq) {
      const box = $('[data-crit-list]');
      const st0 = readURL();
      const c0 = primaryOf(st0);
      if (box && c0) {
        const q = cq.value.toLowerCase().trim();
        box.innerHTML = critRows(c0, q);
        box.hidden = !q;
        cq.setAttribute('aria-expanded', String(!!q));
      }
      return;
    }
    /* One horizon for the product, written the moment it is chosen. */
    /* `[data-window]` and `[data-ret]` are not here. Both are `.v2-dropdown`
       now, which is a listbox rather than a form field — it has no `value` and
       fires no `input`. They are handled by the `dd:change` listener below. */
    if (e.target.hasAttribute && e.target.hasAttribute('data-dirty')) {
      /* Keyed by `data-dirty`, not by `id`. These inputs carry no id, so this
         was adding "" every time -- one empty string in a Set, which meant the
         count read 1 no matter how many different fields you had touched. */
      DIRTY.add(e.target.getAttribute('data-dirty'));
      /* The field knows which section it sits in; the spine should not have to
         guess at it. */
      const sec = e.target.closest('[id^="st-"]');
      if (sec) markDirtyStage(sec.id.slice(3)); else bumpUnsaved();
    }
  });

  /* ── A PANEL THAT OPENS INTO THE FLOOR ──

     The day picker on the last row of a card opened downward into the chat
     bar and lost its bottom options under it. The bar is `.aimy-float-wrap` at
     z-index 550; the library's panel is 200, and this file's own note on the
     z-index bands says settings surfaces sit BELOW the app-level chat
     surfaces on purpose, because those own the whole window.

     So this does not raise the panel into a band it was deliberately kept out
     of. It moves the panel instead: when there is not room beneath the
     trigger, it opens upward, and either way it is capped to the space it
     actually has. A menu that never reaches the bar cannot be covered by it,
     and the band structure is left as documented.

     THE FLOOR IS MEASURED, NOT ASSUMED. The bar is a fixed element whose
     height depends on what is in it, so the limit is read off the element
     rather than written down as a number that goes stale the first time the
     bar grows a row.

     Run after the library's own handler — aimy-ds.js is loaded first, so its
     document listener has already opened the panel by the time this one is
     called and there is something to measure. */
  const DD_GAP = 8;

  function placeDD(dd) {
    if (!dd) return;
    const btn = dd.querySelector('.v2-dropdown-btn');
    const panel = dd.querySelector('.v2-dropdown-panel');
    if (!btn || !panel) return;
    dd.classList.remove('is-up');
    panel.style.maxHeight = '';
    panel.style.bottom = '';
    if (!panel.classList.contains('open')) return;

    const bar = $('.aimy-float-wrap');
    const floor = bar && bar.getBoundingClientRect().height
      ? bar.getBoundingClientRect().top - DD_GAP
      : window.innerHeight - DD_GAP;

    const r = btn.getBoundingClientRect();
    const room = { below: floor - r.bottom - DD_GAP, above: r.top - DD_GAP };
    /* `scrollHeight` rather than the rendered height: the library caps the
       panel at 260px, and asking how tall it WANTS to be is what decides
       whether it fits. */
    const want = panel.scrollHeight;

    /* Down unless down does not fit and up fits better. A menu that flips for
       a few pixels' gain is a menu that moves for no reason. */
    const up = room.below < want && room.above > room.below;
    if (up) dd.classList.add('is-up');
    const room2 = up ? room.above : room.below;
    if (want > room2) panel.style.maxHeight = Math.max(96, room2) + 'px';

    /* ── AND NEVER INTO THE BAR ──
       Flipped, the panel's bottom edge is the trigger's top, which is the right
       answer whenever the trigger is somewhere you can see. `.page-scroll`
       reserves 96px so that is normally guaranteed — but "normally" is not the
       same as "always", and a trigger that is itself half under the bar would
       otherwise hand its menu the same problem the flip exists to solve. The
       offset is whatever it takes to clear, and zero the rest of the time. */
    panel.style.bottom = '';
    if (up) {
      const over = r.top - DD_GAP - floor;
      if (over > 0) panel.style.bottom = 'calc(100% + ' + (DD_GAP / 2 + over) + 'px)';
    }
  }

  /* Both ways in: the pointer, and Enter, Space or an arrow on the trigger.

     SYNCHRONOUS, not on the next frame. aimy-ds.js is loaded first, so its
     document listener has already run — and finished opening the panel — by
     the time this one is called in the same dispatch. There is nothing to wait
     for, and a `requestAnimationFrame` here bought two problems for nothing:
     one frame in which the panel is painted in the wrong place, and no
     placement at all in a tab the browser has throttled. */
  ['click', 'keydown'].forEach((ev) => document.addEventListener(ev, (e) => {
    const btn = e.target.closest && e.target.closest('.set2-dd .v2-dropdown-btn');
    if (!btn) return;
    placeDD(btn.closest('.set2-dd'));
  }));

  /* ── THE SYSTEM'S DROPDOWN REPORTS BY EVENT ──

     `.v2-dropdown` is a listbox, not a form field: it has no `value`, fires no
     `input`, and announces a choice with a bubbling `dd:change` carrying the
     value in `detail`. So the two day-pickers are read here rather than in the
     `input` handler, and the element the event arrives on is the dropdown
     itself — which is where `data-window` and `data-ret` live.

     Both re-render. The old number input could not: rebuilding the field being
     typed into takes the caret with it, so the retention path patched its own
     row in place and had to remember to refresh the sentence beside it and the
     note in the rail. A choice from a list has no caret to lose, so the paint
     that already knows how to draw every one of those facts draws them. */
  document.addEventListener('dd:change', (e) => {
    const dd = e.target.closest && e.target.closest('.set2-dd');
    if (!dd) return;

    /* A filter dropdown writes to the `f` blob the old `<select>` wrote to, so
       the chips, the Clear button and the URL are unchanged by the swap. It is
       read before the day pickers because its value is a STRING — parsing it as
       an integer below would turn "QA Manager" into NaN and drop it. */
    /* The sheet's role picker writes to the draft, not to the URL: the sheet is
       not a place, and a half-filled invitation restored on a later visit is a
       decision the reader has forgotten making.

       READ THE TEXT FIELDS FIRST. Choosing a role repaints the sheet, and the
       sheet renders its inputs from `ADDU` — which only the submit handler was
       filling. So picking a role after typing a name silently emptied all three
       fields and the invitation then failed validation on everything. Anything
       that repaints a form has to bank what is in it. */
    if (dd.hasAttribute('data-au-role')) {
      readAddU();
      ADDU.role = (e.detail && e.detail.value) || '';
      if (ADDU.bad) delete ADDU.bad.role;
      paintModal();
      return;
    }

    if (dd.hasAttribute('data-vsdd')) {
      patch({ vs: (e.detail && e.detail.value) || '' });
      return;
    }

    const fkey = dd.getAttribute('data-fdd');
    if (fkey) {
      const st0 = readURL();
      patch({ f: withF(st0, fkey, (e.detail && e.detail.value) || null) });
      return;
    }

    const v = parseInt(e.detail && e.detail.value, 10);
    if (!(v > 0)) return;

    const winId = dd.getAttribute('data-window');
    if (winId) {
      /* The connector it belongs to, not all of them — one control per row. */
      const c = connsOf(prodOf(readURL())).filter((x) => x.id === winId)[0];
      if (c) { c.window = v; render(); }
      return;
    }

    const retId = dd.getAttribute('data-ret');
    if (retId) {
      const r = RETENTION.filter((x) => x.id === retId)[0];
      if (r) {
        r.days = v;
        DIRTY.add('retention:' + r.id);
        render();
        /* After the paint, so it marks the row this paint just drew. */
        markDirtyStage('retention');
      }
    }
  });

  /* Clicking away is an answer as much as Enter is: a named draft is kept, an
     empty one is dropped. Deferred a tick so a click on another control lands
     first and is not swallowed by the re-render this causes. */
  document.addEventListener('focusout', (e) => {
    const ti = e.target.closest && e.target.closest('[data-title-ed]');
    if (ti) {
      const id = ti.getAttribute('data-title-ed'), v = ti.value;
      /* Same guard the draft field needed: right after a blur the input is
         still in the DOM, so the check is "is there still a title being
         edited", not "is this element still focused". Enter and Escape
         re-render first, so by this tick there is nothing left to settle. */
      setTimeout(() => { if ($('[data-title-ed]')) settleTitle(id, true, v); }, 0);
      return;
    }
    const f = e.target.closest && e.target.closest('[data-newname]');
    if (!f) return;
    const v = f.value;
    /* The guard is "is there still a draft to settle", NOT "is the field still
       focused". It read `$('[data-newname]') === e.target` and returned — and
       right after a blur the input IS still that element, because nothing has
       re-rendered yet, so clicking away never kept or dropped anything.
       Enter and Escape re-render first, so by this tick the field is gone and
       this correctly does nothing. */
    setTimeout(() => {
      if (!$('[data-newname]')) return;
      settleDraft(!!(v && v.trim()));
    }, 0);
  });

  /* A popover is dismissed by anything that is not itself. */
  document.addEventListener('mousedown', (e) => {
    const p = document.getElementById('setPop');
    if (p && !p.contains(e.target)
        && !e.target.closest('[data-path],[data-add-sub],[data-tf],[data-crit-add],[data-prod-pick],[data-crm-pick],[data-client-pick]')) closePop();
  });

  document.addEventListener('change', (e) => {
    const fs = e.target.closest('[data-f]');
    if (fs) { const st = readURL();
      patch({ f: withF(st, fs.getAttribute('data-f'), fs.value) }); return; }

    /* No `[data-role-vs-sel]`. That control is a `.v2-dropdown` now, and a
       listbox reports through `dd:change` rather than firing `change`. */

    /* No `[data-range]` branch. Both ends were `<input type="date">` and
       reported through `change`; they are buttons opening our own calendar
       now, and the day you press writes the value in the click handler. The
       complaint about a backwards pair is retracted there too, at the moment
       the pair changes. */

    const t = e.target.closest('[data-skill-on]');
    if (t) {
      const s = skillById(t.dataset.skillOn);
      s.on = t.checked;
      /* See afterSwitch: the repaint waits for the thumb, or the transition
         never runs at all. */
      afterSwitch(t, render);
      return;
    }
    const f = e.target.closest('[data-file]');
    if (f && f.files && f.files[0]) readSkillFile(f.files[0]);
  });

  /* Drag and drop on the zone. `dragover` must be cancelled or the browser
     navigates to the file instead of handing it over. */
  document.addEventListener('dragover', (e) => {
    const z = e.target.closest && e.target.closest('[data-drop]');
    if (!z) return;
    e.preventDefault(); z.classList.add('is-over');
  });
  document.addEventListener('dragleave', (e) => {
    const z = e.target.closest && e.target.closest('[data-drop]');
    if (z) z.classList.remove('is-over');
  });
  document.addEventListener('drop', (e) => {
    const z = e.target.closest && e.target.closest('[data-drop]');
    if (!z) return;
    e.preventDefault(); z.classList.remove('is-over');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) readSkillFile(file);
  });

  /* ═══ KEYBOARD ═══
     The ARIA treeview map, which is the spec's. The tri-state cascade under it
     is ours -- the spec defines `mixed` and says nothing about parent-to-child
     propagation -- and it is the same cascade the mouse gets, because two
     selection models on one widget is how a picker disagrees with itself. */
  /* ── Settling an inline title ──
     Enter and blur keep it, Escape drops it. An empty name is a drop, not an
     error: there is nothing to tell the reader that they do not already know
     from looking at the box they just emptied. */
  function settleTitle(id, keep, value) {
    const s = skillById(id);
    EDIT.delete('title:' + id);
    if (s && keep) {
      const v = String(value == null ? '' : value).trim();
      if (v && v !== s.name) {
        s.name = v;
        s.slug = freeSlug(slugify(v), s);
        s.when = 'just now'; s.v = (s.v || 0) + 1;
        if (!isOrg(s)) s.by = USER.name;
        DIRTY.add('file:' + id);
      }
    }
    render();
  }

  document.addEventListener('keydown', (e) => {
    const ti = e.target.closest && e.target.closest('[data-title-ed]');
    if (ti) {
      if (e.key === 'Enter')  { e.preventDefault(); settleTitle(ti.getAttribute('data-title-ed'), true, ti.value); return; }
      if (e.key === 'Escape') { e.preventDefault(); settleTitle(ti.getAttribute('data-title-ed'), false); return; }
    }
    /* The draft field name. Enter keeps it, Escape drops it — the two answers
       to "what is this called", and nothing else needs a key. */
    if (e.target.closest && e.target.closest('[data-newname]')) {
      if (e.key === 'Enter')  { e.preventDefault(); settleDraft(true);  return; }
      if (e.key === 'Escape') { e.preventDefault(); settleDraft(false); return; }
    }
    /* Enter anywhere in the Add-user sheet submits it. Three short fields and
       a primary action is exactly the form where reaching for the mouse to
       finish is the wrong ending. */
    if (e.key === 'Enter' && e.target.closest && e.target.closest('.set2-modal')
        && $('[data-au-add]')) {
      e.preventDefault(); $('[data-au-add]').click(); return;
    }
    /* A credential field commits on Enter and reverts on Escape, so the
       common case never has to leave the keyboard for the Save beside it. */
    const whIn = e.target.closest && e.target.closest('[data-wh-in]');
    if (whIn) {
      const key = whIn.getAttribute('data-wh-in');
      if (e.key === 'Enter') {
        e.preventDefault();
        const b = $('[data-wh-save="' + key + '"]'); if (b && !b.disabled) b.click();
        return;
      }
      if (e.key === 'Escape') {
        const [cid, which] = key.split(':');
        const ep = ENDPOINTS[cid];
        if (ep) { whIn.value = which === 'url' ? ep.url : ep.token;
                  whIn.dispatchEvent(new Event('input', { bubbles: true })); }
        return;
      }
    }

    /* The modal is the only layer this file still owns. It is unambiguously the
       shallowest one on the page: a settings view has no open document and no
       canvas under it, so it does not need a place in the console's ladder —
       it just has to answer first, and registering later achieves that. */
    if (e.key === 'Escape' && MODAL) { closeModal(); return; }
    /* ── A panel you can open with the keyboard, you can leave with it ──

       The popover is dismissed by a mousedown anywhere else, which is the whole
       story for a pointer and none of it for a keyboard. It matters here more
       than for the pickers: this one moves focus to its action button on open,
       so without Escape somebody who pressed "Why it failed" is standing inside
       a panel with no key that gets them out of it.

       Focus goes back to what opened it. Returning it to the body would drop a
       reader at the top of the page they were already halfway down. */
    if (e.key === 'Escape' && document.getElementById('setPop')) {
      const back = POP_OPENER;
      closePop();
      if (back && document.contains(back)) back.focus();
      return;
    }
    const node = e.target.closest && e.target.closest('[data-node]');
    if (!node) return;
    /* The tree keyboard model stood here — space to toggle, arrows to move,
       left and right to collapse and expand. It belonged to the targeting
       picker and every branch of it called something that no longer exists. */
    return;
  });

  /* ═══════════════════════════════════════════════════════════════════════
     THE EXPORT

     This file used to end by rendering itself and listening for `popstate`.
     Both assumed it owned a page. It owns a VIEW now, so the console calls in:
     `body` and `nav` return markup, `painted` runs what needs the DOM, `index`
     feeds the one palette, and `init` hands over the URL functions.

     Registered the way chat.js registers `window.AIMY_GATE` — the house
     pattern for "a second script that the shell drives".
     ═══════════════════════════════════════════════════════════════════════ */
  /* `_pages` is exported for the same reason `_stageAt` was: it is the rule
     that decides what the rail lists and what each row says about it, and a
     browser pane can check it against the model without driving a scroll. */
  window.AIMY_SETTINGS = {
    _pages: function (st) {
      const m = moduleById(st.m) || moduleById('config');
      const list = pagesOf(m.id) || [];
      return list.map(function (pg) {
        return { id: pg.id, name: pg.name, state: pageState(st, pg, m) };
      });
    },
    init: function (api) { API = api; },
    body: body,
    nav: nav,
    painted: painted,
    index: searchIndex,
    has: function (id) { return !!moduleById(id); },
    modules: MODULES
  };
})();
