# BataMarket — Master Build Prompt for Google Antigravity

**Attached source-of-truth documents (read fully before starting):**
- `BataMarket_PRD.docx` — product requirements, MVP scope, monetization, verification model
- `BataMarket_Implementation_Plan.docx` — stack, animation system, folder structure, database schema, build roadmap

Do not re-derive product decisions, feature scope, or monetization logic from this prompt alone. Where this prompt and the attached documents differ in detail, the attached documents are the source of truth; this prompt only sequences the work and adds engineering specifics the documents don't cover.

**MCPs currently connected:** Google Stitch MCP, Supabase MCP. Other MCPs (payments, deployment, etc.) will be added in later sessions — do not assume any MCP beyond these two is available, and do not hard-code against a future MCP that isn't connected yet.

---

## How to work through this prompt

Execute the phases below **in order**. Do not start a phase until the previous one is functionally working, not just code-complete. At the end of each phase, stop and summarize what was built, what was deferred, and anything that needs my decision before continuing — then wait for confirmation before moving to the next phase.

Do not invent product features, copy, or pricing not specified in the PRD. If something is genuinely ambiguous after reading both attached documents, stop and ask rather than guessing.

---

## Phase 0 — Design Foundation (Google Stitch MCP)

**Goal:** establish the visual design system before any component is built against it.

1. Before generating anything, ground the Stitch brief in BataMarket's actual positioning from the PRD: a trusted, mobile-first student marketplace (not a generic e-commerce site) for Nigerian university students, launching at EKSU. The tone is lively and approachable, not corporate — but Trust & Safety, verification, and pricing are core to the product, so the visual language needs to read as credible and safe, not just playful. The existing Bluestark business documents use a navy/gold palette; treat that as one reasonable starting direction for Stitch to riff on, not a mandate — BataMarket can have its own distinct brand identity from the Bluestark proposal materials if Stitch produces something stronger.
2. Use the Google Stitch MCP to generate **at least 3 distinct directions** (not just one output to accept by default) covering: color palette, typography pairing, spacing scale, and key-screen mood concepts for homepage, listing card, listing detail, chat screen, the account-type choice screen (Student vs. University Seller, see Phase 1), and both verification upload flows.
3. Present all generated directions side by side with a short tradeoff note on each (e.g. "Direction A: warm and energetic, best for social/discovery screens, slightly lower contrast for body text" / "Direction B: higher-contrast, reads more trustworthy for verification and payment screens"). Stop and let me pick a direction, or explicitly ask me to combine elements from more than one, before locking anything in.
4. Treat Stitch's output as a design reference, not final UI — per the Implementation Plan, Section 4. Stitch owns color, type, and visual mood. It does not own component structure, accessibility, responsive behavior, or animation, which are engineering decisions made in later phases.
5. **Conflict rule:** if a Stitch layout concept implies behavior that fights the animation system locked in for this build (e.g. a layout that assumes native browser scroll snapping instead of Lenis-driven smooth scroll, or static carousels where Embla's swipe physics are specified), keep Stitch's color/type/mood direction but flag the layout conflict explicitly rather than silently building the version that breaks the animation spec.
6. Once a direction is chosen, extract concrete design tokens and write them into `tailwind.config.ts` as named semantic colors (e.g. `brand-navy`, `brand-gold`, `surface`, `muted`) — never reference raw hex codes directly in components.
7. Write a design-tokens summary to `docs/design-tokens.md` (palette with hex values, font pairing with web font source, spacing scale) — every later phase should reference this file rather than re-deriving tokens from screenshots.

Stop here and show me the three directions, the chosen one, and the contents of `docs/design-tokens.md` before continuing to Phase 1.

---

## Phase 1 — Project Scaffold and Backend Foundation (Supabase MCP)

**Goal:** a working, empty skeleton with auth and schema in place — no UI polish yet.

1. Scaffold a Next.js 15 project (App Router, TypeScript, Tailwind CSS) using the exact folder structure in the Implementation Plan, Section 5.1. Do not deviate from this structure without flagging why.
2. Install the full stack specified in the Implementation Plan, Section 2: `motion` (not the deprecated `framer-motion` package — confirm you are importing from `motion/react`), TanStack Query, React Hook Form + Zod, Lenis, Embla Carousel, React Spring, `tailwindcss-animate` (or `tw-animate-css`), `canvas-confetti`, and Sharp for server-side image handling.
3. Using the Supabase MCP, create the project schema exactly as defined in the Implementation Plan, Section 5.2: `profiles` (including the `account_type` column distinguishing `student` and `vendor`, per PRD Section 5.5), `listings`, `accommodation_details`, `messages`, `trust_events`, `reports`, `transactions`. Write Row Level Security policies for every table before any UI is built against it — no table should be queryable from the client without an RLS policy in place first.
4. Implement auth and onboarding: sign up, login, session persistence, using Supabase Auth. Onboarding forks immediately on account type per the PRD's Onboarding Experience guidance (Section 5.5) — the first screen asks "Are you a student or a university seller?" and the rest of the flow adapts to that choice. Build this as a real multi-step flow with visible progress, not a single long form: one field group per step, a plain-language reason shown at the point each piece of information is requested, and a "Pending" screen that frames the wait as forward progress (what the user can already do while waiting, and an expected review timeframe) rather than a dead end.
5. Set up the Trust Score recalculation as a Postgres function triggered on `trust_events` inserts, per Implementation Plan Section 5.3. Set up the verification-submission Edge Function trigger (notifies the internal reviewer; full review UI comes in Phase 3).

Stop here and confirm the schema, RLS policies, and auth flow are working before continuing.

---

## Phase 2 — Core Listings Experience

**Goal:** Products, Services, and Accommodation listings are fully usable end-to-end.

1. Build listing creation (all three types — Products, Services, Accommodation — as defined in the PRD, Section 5) with photo upload, client-side image compression before upload, category selection, price, condition (Products), and the Accommodation-specific fields (room type, location, available-from) from `accommodation_details`.
2. Build listing discovery: category browsing, search, and filters (price, category, campus, department, condition, distance) per the PRD.
3. Build the listing detail screen.
4. Build seller profiles showing the relevant identity fields per account type (student: name, department, level; vendor: business name, business address), plus verification status/badge, Trust Score, and rating for both.
5. Apply the animation system from the Implementation Plan, Section 3, throughout this phase — not retrofitted afterward:
   - `motion` for card hover/tap states, layout transitions, and modal open/close on listing detail
   - Lenis for smooth scroll across listing feeds and category browse
   - Embla Carousel for listing image galleries and homepage "Featured"/"Trending" rows
   - React Spring for small physics-based details (e.g. price or count animations)
   - `tailwindcss-animate` for loading skeleton shimmer while images load, and button/press states
   - Respect `prefers-reduced-motion` via `useReducedMotion` on every nontrivial animation
6. Confirm everything is fully responsive and tested on a throttled connection profile (Chrome DevTools "Slow 3G") before moving on — this is a real product requirement, not a nice-to-have, given the target users' connectivity.

Stop here and show me the listing creation and browse flow working on both desktop and mobile viewport before continuing.

---

## Phase 3 — Trust, Safety, and Verification

**Goal:** both verification paths from the PRD, Section 5.5, fully working — student document-plus-selfie, and University Seller (Vendor) business-info review.

1. Build the **student** verification flow: full name, department, level, and phone number capture; student ID or course-slip photo upload; live in-app selfie capture (no gallery upload); "Pending" status shown immediately while browsing remains open but listing/messaging/Featured stays locked until approved.
2. Build the **University Seller (Vendor)** verification flow: business name, business email, business address, and phone number capture; same immediate "Pending" state, with browsing and draft-listing creation allowed while pending, per the PRD.
3. Build a single internal review dashboard (not public-facing) where the reviewer sees pending submissions from both account types — student ID-plus-selfie pairs shown side by side for visual comparison, vendor submissions shown with the reported phone/address for manual confirmation — and approves or rejects either type.
4. On approval, show the distinct badge for each account type: "Verified" for students, "Vendor" for University Sellers, per the PRD — these should be visually distinguishable on profiles and listings so buyers know which kind of seller they're dealing with.
5. Build reporting (scam, fake listing, abuse) feeding into `trust_events`, usable against either account type.
6. Build Safe-Swap Zone suggestions (known public campus locations) shown on listing detail and accommodation viewings, per the PRD.
7. Use `canvas-confetti` for the verification-approved moment (either account type) and first-listing-posted moment, per the Implementation Plan's animation guidance and the PRD's Onboarding Experience section — sparingly, only at genuine milestones.

Stop here and confirm both verification flows end-to-end (submission → pending → review dashboard → approval) before continuing.

---

## Phase 4 — Messaging and Transactions

**Goal:** buyers and sellers can communicate and complete the loop that generates revenue.

1. Build realtime chat using Supabase Realtime's Postgres changes subscription on the `messages` table — no separate WebSocket server.
2. Phone numbers stay hidden in chat until both sides choose to share them.
3. Build the Featured Listing payment flow (boost a listing to top of search/category for 48 hours) writing to `transactions`. Note: no payment MCP is connected yet — implement this behind a clean payment-provider interface so a Paystack (or other) integration can be dropped in without restructuring the checkout flow once that MCP/credentials are available. Do not block other Phase 4 work on this being fully wired to a live payment provider.

Stop here and confirm chat works in realtime between two test accounts before continuing.

---

## Phase 5 — Polish Pass

**Goal:** the full animation and responsiveness bar from the Implementation Plan is met everywhere, not just in Phase 2's listings flow.

1. Audit every screen built so far against the Implementation Plan, Section 3.3 (mobile-first and performance rules): animations target `transform`/`opacity` only, nothing blocks interaction, reduced-motion is respected everywhere, bundle is code-split per route.
2. Fill in animation gaps on screens that were functionally finished in earlier phases but didn't get the full motion treatment (e.g. profile screen, verification flow, chat).
3. Full responsive pass across common breakpoints, with explicit testing on a throttled connection profile.

Stop here and walk me through the polished app before we discuss next steps (manual listing seeding, additional MCPs for payments/deployment, and Phase 2+ features from the PRD such as Wishlist, Student Requests, and Swapping).

---

## Standing rules for every phase

- Do not implement Wishlist, Student Requests, Swapping, Sponsored Listings, or the Jobs Board — these are explicitly post-MVP in the PRD and come after this build, not during it.
- **Important distinction:** University Seller (Vendor) signup, onboarding, and verification (PRD Section 5.5) ARE in MVP scope per Phases 1 and 3 of this prompt — every vendor in the PRD's account-type sense gets a working account from this build. What stays post-MVP is the *Vendor Accounts monetization feature* specifically (PRD Section 6.2: paid monthly subscription for a vendor to list a full catalog) — that paid-tier upsell is not built in this pass, only the underlying account type and basic listing ability.
- Do not invent monetization mechanics beyond Featured Listings in this build — Verified Badge and Services Commission logic can be scaffolded but should not block earlier phases.
- Every new table must have RLS policies written in the same step it's created, not deferred.
- If a decision genuinely isn't covered by the PRD or Implementation Plan, stop and ask rather than assuming.
- Keep commits/changes scoped to the current phase — don't reach ahead into later phases' work even if it seems convenient in the moment.
