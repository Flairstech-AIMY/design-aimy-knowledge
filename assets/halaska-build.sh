#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Build Halaska Kit for a no-bundler, classic-script page.
#
#  Knowledge has no package.json and no node_modules, deliberately.
#  So the build runs in a temp dir and only the OUTPUT lands in the
#  repo: assets/halaska-kit.jsx (vendored source, as shipped) and
#  assets/halaska-kit.bundle.js (what the pages actually load).
#
#  The kit is React. This bundles React + ReactDOM in, so the pages
#  stay dependency-free at runtime and there is no CDN to trust.
#
#  EDIT THE `EXPORTS` LIST to change what ships. esbuild tree-shakes,
#  and it is worth doing: React alone is ~46KB gzipped, the whole kit
#  on top of it is ~146KB, and three AI patterns on top of it is ~59KB.
#  Paying for patterns you do not render is the only avoidable part.
#
#  Usage:  bash assets/halaska-build.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KIT="$REPO/assets/halaska-kit.jsx"
OUT="$REPO/assets/halaska-kit.bundle.js"

# What to expose on window.Halaska. Keep this list tight.
# StreamingAnswerPattern and StreamingText are deliberately NOT here: AiMY
# streams its own answers (.stream-in / .stream-cursor) and that treatment is
# protected. Exposing the kit's would make replacing it a one-line accident.
# ThinkingTracePattern is out too: the answer's own `How this was answered`
# is already a step trace, and reports what retrieval actually did rather than
# generic steps. Shipping both would have been the same information twice,
# the worse one first.
EXPORTS="ActionReceiptPattern, ErrorRepairPattern, AgentStatusPattern,
         Orb, AgentGlyph,
         ThemeProvider, AccentContext, useAccent, usePal, tokens, motion,
         setKitFont, setKitMotion"

[ -f "$KIT" ] || { echo "missing $KIT — re-download:"; echo "  curl -o assets/halaska-kit.jsx https://ui.halaska.com/halaska-kit.jsx"; exit 1; }

BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT
cp "$KIT" "$BUILD/halaska-kit.jsx"
cd "$BUILD"

# ── LOCAL PATCHES ──────────────────────────────────────────────
# House changes to the kit, applied to the BUILD COPY on every run so that
# re-downloading halaska-kit.jsx and rebuilding keeps them. Patching the
# vendored file instead would lose them the first time the kit is updated,
# silently — which is the failure worth engineering against.
#
# Each patch asserts its match and stops the build if the kit has moved
# underneath it. A patch that quietly stops applying is worse than one that
# fails loudly, because the thing it was removing comes back unannounced.
python - <<'PATCH'
import sys
src = open("halaska-kit.jsx", encoding="utf-8").read()

# ErrorRepairPattern: drop the warning-tinted left rail, and with it the
# paddingLeft that existed only to clear it. AiMY says a state in words and
# colour; the card already opens with "got this one wrong" over a warning
# glyph, so the rail was a third marker for something already said twice.
rail = '''        {/* Warning-tinted rail: the only raised voice in the card */}
        <span style={{
          position: "absolute", left: 0, top: 18, bottom: 18, width: 3,
          borderRadius: 2, background: pal.warning,
          transition: `background ${motion.smooth} ${motion.easeInOut}`,
        }} />
        <Stack gap={16} style={{ paddingLeft: 10 }}>'''
if rail not in src:
    sys.exit("PATCH FAILED: ErrorRepairPattern rail not found — the kit changed. "
             "Re-check the source and update this patch before shipping.")
src = src.replace(rail, '        <Stack gap={16}>', 1)

# HandoffPattern: same device, same removal. The tinted fill stays — it is
# what marks the handoff moment — but the 2px accent border on its left goes.
#
# The borderRadius goes with it, and has to: it was written `0 sm sm 0`,
# square down the left edge PRECISELY because the rail was sitting there.
# Dropping the border alone would leave a tinted block with two square
# corners and no reason for them, which reads as a rendering fault rather
# than a decision. All four corners now.
hrail = '''                borderLeft: `2px solid ${pal.accent}`, background: pal.accentBg,
                borderRadius: `0 ${tokens.radius.sm}px ${tokens.radius.sm}px 0`,'''
if hrail not in src:
    sys.exit("PATCH FAILED: HandoffPattern left border not found — the kit changed. "
             "Re-check the source and update this patch before shipping.")
src = src.replace(hrail, '''                background: pal.accentBg,
                borderRadius: `${tokens.radius.sm}px`,''', 1)

open("halaska-kit.jsx", "w", encoding="utf-8").write(src)
print("patched: ErrorRepairPattern left rail removed")
print("patched: HandoffPattern left border removed, corners squared off fixed")
PATCH

echo '{"name":"halaska-build","private":true,"version":"1.0.0"}' > package.json
npm install --silent --no-audit --no-fund react@18 react-dom@18 esbuild

cat > entry.jsx <<ENTRY
import * as React from "react";
import { createRoot } from "react-dom/client";
import { $EXPORTS } from "./halaska-kit.jsx";

const Kit = { $EXPORTS };
const roots = new WeakMap();

/* Render a kit component into an existing vanilla node, reusing the React
   root across calls so an update patches instead of remounting. */
function mount(el, Component, props = {}, children = null) {
  if (typeof el === "string") el = document.querySelector(el);
  if (!el) throw new Error("Halaska.mount: target not found");
  let root = roots.get(el);
  if (!root) { root = createRoot(el); roots.set(el, root); }
  root.render(React.createElement(Component, props, children));
  return root;
}
function unmount(el) {
  if (typeof el === "string") el = document.querySelector(el);
  const root = el && roots.get(el);
  if (root) { root.unmount(); roots.delete(el); }
}
/* Mount inside a ThemeProvider so a subtree follows one theme without every
   call site restating it. */
function mountThemed(el, Component, props = {}, theme = "dark") {
  return mount(el, Kit.ThemeProvider, { theme }, React.createElement(Component, props));
}

window.Halaska = { ...Kit, React, h: React.createElement, createRoot, mount, mountThemed, unmount };
ENTRY

npx esbuild entry.jsx --bundle --format=iife --jsx=automatic --loader:.jsx=jsx \
  --minify --target=es2019 --define:process.env.NODE_ENV='"production"' \
  --outfile=bundle.js --log-level=warning

cp bundle.js "$OUT"
RAW=$(stat -c%s "$OUT"); GZ=$(gzip -c "$OUT" | wc -c)
echo "built assets/halaska-kit.bundle.js — ${RAW} bytes raw, ${GZ} gzipped"
echo "remember to bump the ?v= on the <script> tag in any page that loads it"
