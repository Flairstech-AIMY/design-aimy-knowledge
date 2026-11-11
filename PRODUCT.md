# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
FlairsTech's internal staff who own and use support knowledge (support, knowledge ops, team leads, engineers), workspace admins, and client organisations that log in (Upland, CXS and others) under an MSP/BPO model. The Console is where they configure what AiMY does for each client and product.

For the After-Hours Config (AIMY-2974): many people edit configs, often: team leads and engineers adjust hours, on-call people and urgency rules weekly or daily. They work mostly at a desk, and a quick check or change from a phone has to be comfortable.

## Product Purpose
AiMY Knowledge is a clickable, fixture-driven design prototype of FlairsTech's AiMY Knowledge product and of the admin Console the AiMY products share. It is the design reference the developers build the real React app from.

The After-Hours Config tells AiMY how to handle one product's tickets outside working hours: where tickets arrive, when the team works (AiMY covers the rest), which customers are covered, what counts as urgent, what to do with a ticket that can wait, and who to call, in what order, when it is urgent. Success: anyone opening a config understands in seconds what AiMY does with a ticket at 2 am, and can change the part that is wrong.

## Capabilities and Constraints
- Plain HTML, CSS and JS, no build step. Every CSS/JS change bumps its `?v=` stamp in both `index.html` and `console.html`.
- The After-Hours Config's fields are the developers' schema (after-hours-config-fields-for-design.json, 11 Nov 2026): every field, label, kind, required flag, default and condition is product truth. The representation is open.
- A config made with New document is filled in by hand; uploading a YAML, JSON or XML file stays possible as the secondary path. No templates on the manual path.
- Edits land on the document and raise the page's own Save / Discard bar; removals undo through the house toast.
- The Console renders byte-identical at 1536px except where the owner asks for a change there.

## Brand Commitments
- Plain English in copy. Say "call", never "ring".
- No muted text: a state is said in words and colour, never by making text harder to read.
- No modals, pickers, choice lists or drag as the only way to do something; one-click inline controls with toast undo.
- Every number earns its place: say what it means compared with something real, with the action that uses it beside it.
- Icons are Lucide, verbatim path data on the 24 grid.
- When space runs out, change the component's form; never hide it or shrink it past use.
- Visual alignment is checked by eye on every element.

## Evidence on Hand
- The developers' field file and their screenshots of a plain long form (the anti-reference).
- The real Objectif Lune configuration values from that file (phone numbers replaced with stand-ins; the prototype is public).
- The 24/7 Schedule and Configuration pages in the Console (settings.js), which read uploaded config files.

## Product Principles
- Show what will happen, not a list of settings.
- The common change is one click away; the rare one is still on the page.
- A phone gets the same answers in a different shape, never fewer.
