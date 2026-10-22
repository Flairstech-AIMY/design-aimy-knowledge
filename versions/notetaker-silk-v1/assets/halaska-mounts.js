/* ═══════════════════════════════════════════════════════════════════════
   halaska-mounts.js — the Halaska patterns AiMY does not already have

   Same shape as AIMY_GATE and AIMY_SETTINGS: this file owns the patterns,
   knowledge.js owns the product, and `init(API)` is the whole contract.
   Guarded at every call site, because the file is optional — the console
   renders its grid, answers its questions and runs its commits on a page
   that never loads it.

   THREE, not seven, and not the four this started as. Four of the kit's
   patterns describe something AiMY had already built, usually further:

     PlanPreview ×2, ApprovalCard   `commit()` sits behind fourteen call sites
       with a Now/After diff, an effects list, a reversibility line, and a
       WRITE_SPEC ladder where archive, delete, publish and expire each make
       you type the word. A Proceed button is not an upgrade on that.
     ThinkingTrace                  the answer's own `How this was answered`
       is already a step trace, and a better one — it reports what retrieval
       actually did ("matched on subject", "3 documents are hand-linked to
       it"), which a generic trace cannot know. Built, then removed on that
       finding rather than shipped beside it.

   What is left is what the product genuinely lacked: a place to admit an
   answer was wrong, a run you can watch, and a receipt.

   THE ANSWER FLOW IS NOT TOUCHED — no trace under the mark, no restyling of
   the stream. StreamingAnswerPattern and StreamingText are not in the bundle
   at all, so replacing either cannot happen by accident.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var API = null;
  var K = null;

  function kit() {
    if (K) return K;
    K = (typeof window !== 'undefined' && window.Halaska) || null;
    return K;
  }

  /* Every mount goes through here. If the bundle did not load — a page that
     ships without it, a blocked request — the product keeps working and the
     pattern is simply absent, which is the correct failure for an addition. */
  function mount(host, name, props) {
    var k = kit();
    if (!k || !host || !k[name]) return false;
    try { k.mount(host, k[name], props || {}); return true; }
    catch (e) { console.error('[halaska] ' + name + ' failed to mount:', e); return false; }
  }
  function unmount(host) {
    var k = kit();
    if (k && host) { try { k.unmount(host); } catch (e) {} }
  }

  var theme = function () {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  };

  /* ═══════════════════════════════════════════════
     1 · THE REPAIR, where a person said it was wrong

     `reported` is the one p1 state the product cannot clear on its own — its
     own words: "A person put it there, so nothing but a person will clear
     it." That is true of the RESOLUTION. It was never true of the reply: a
     reader who flags an answer currently gets a state change and silence.

     This is the reply. What was wrong, what was done, and a way to reach a
     human when what was done is not enough.
  ═══════════════════════════════════════════════ */
  function repair(host, doc, report) {
    if (!host || !doc) return;
    var r = report || {};
    return mount(host, 'ErrorRepairPattern', {
      theme: theme(),
      /* Named, not generic. The kit's default blames an agent called Alpha;
         here the subject is the answer, and the document it came from. */
      headline: 'I answered from this, and it was wrong',
      acknowledgment: r.note ||
        ('Someone reported a problem with ' + doc.title + '. It was cited in an answer before the problem was known.'),
      fixesTitle: 'What changed',
      fixes: r.fixes || [
        'Stopped citing it until the report is cleared',
        'Flagged the source so the next sync is checked'
      ],
      /* No invented diff. The pattern hides the Review button when `diff` is
         null, which is the right shape for a report that has no before and
         after to show — most of them. */
      diff: r.diff || null,
      reviewLabel: 'See what changed',
      flagLabel: 'Ask a person',
      /* The kit's default footer promises an audit log. This product does not
         have one — the phrase exists in commit()'s reversibility line and
         nowhere else — so the promise is not made. */
      footer: 'Nothing else was changed.',
      beatMs: 800,
      autoplay: true,
      onFlag: function () { if (API && API.flagForHuman) API.flagForHuman(doc); }
    });
  }

  /* ═══════════════════════════════════════════════
     2 + 3 · THE RUN, AND THE RECEIPT

     commit() already asks. What it has never done is show the work or report
     it: `onRun` is synchronous, so a re-sync across eight documents returns
     instantly and the only evidence is a toast reading the button's own
     label back.

     So a commit may declare `agent`, and when it does the same confirmation
     runs through a visible cycle and lands on a receipt instead. Commits
     that do not declare it keep the toast — this is opt-in per write, not a
     replacement for the fifty-three toasts in the file.
  ═══════════════════════════════════════════════ */
  function run(host, spec, onDone) {
    if (!host) { if (onDone) onDone(); return; }
    var phases = (spec && spec.phases) || ['Working'];
    var done = false;
    var finish = function () {
      if (done) return; done = true;
      if (onDone) onDone();
    };
    var ok = mount(host, 'AgentStatusPattern', {
      theme: theme(),
      phases: phases,
      phaseMs: (spec && spec.phaseMs) || 900,
      /* One cycle and out. The kit's default parks on "Waiting on you" and
         offers a redirect box, which belongs to a long-running agent you
         check on — not to a write you just confirmed and are watching land. */
      waitingLabel: (spec && spec.doneLabel) || 'Done',
      contextLabel: function (step, total) {
        return (spec && spec.context ? spec.context + ' · ' : '') + 'step ' + step + ' of ' + total;
      },
      autoplay: true,
      onWaiting: finish
    });
    if (!ok) { finish(); return; }
    /* A floor under onWaiting. If the pattern cannot advance — a hidden tab,
       a pane that never composites — the run must still resolve, or the
       receipt never arrives and the surface sits on a phase forever. */
    setTimeout(finish, phases.length * ((spec && spec.phaseMs) || 900) + 1200);
  }

  function receipt(host, spec) {
    if (!host) return;
    var s = spec || {};
    return mount(host, 'ActionReceiptPattern', {
      theme: theme(),
      title: s.title || 'Done',
      reversedTitle: 'Undone',
      timestamp: s.timestamp || stamp(),
      reversedTimestamp: stamp(),
      meta: s.meta || [],
      reversedMeta: s.reversedMeta || s.meta || [],
      before: s.before != null ? s.before : 0,
      after: s.after != null ? s.after : 0,
      unit: s.unit || '',
      decimals: 0,
      stripLabel: s.stripLabel || '',
      undoSeconds: s.undoSeconds || 10,
      undoLabel: 'Undo',
      expiredLabel: 'Undo window closed',
      reversedLabel: 'Undone · nothing else was changed',
      /* The audit link is removed rather than relabelled. commit() promises
         "logged to the audit trail" in prose, but there is no audit surface
         in this build to send anyone to, and a link that goes nowhere is a
         worse promise than no link. Restore it the day that page exists. */
      auditLabel: '',
      autoplay: true,
      onUndo:  function () { if (s.onUndo) s.onUndo(); close(host); },
      onExpire: function () { close(host); }
    });
  }

  function stamp() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : String(n); };
    return p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()) + ' UTC';
  }

  function close(host) {
    if (!host) return;
    unmount(host);
    host.innerHTML = '';
    host.hidden = true;
  }

  function open(host) {
    if (!host) return;
    host.hidden = false;
  }

  window.AIMY_AGENT = {
    init: function (api) { API = api || {}; },
    available: function () { return !!kit(); },
    repair: repair,
    run: run,
    receipt: receipt,
    open: open,
    close: close,
    unmount: unmount
  };
})();
