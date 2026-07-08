
BATAMARKET
The Trusted Marketplace for Nigerian Students

TECHNICAL IMPLEMENTATION PLAN
Version 1.0  —  Stack, Architecture, Design System, Build Roadmap

Prepared by Bluestark
Isaac Testimony — Founder & Product Lead
June 2026

1. Purpose and Scope
This document translates the BataMarket PRD into an executable technical plan: the exact stack, why each piece was chosen or changed, the animation/motion system that gives the marketplace its lively feel, how Google Stitch fits into the design workflow, the database and folder architecture, and a phase-by-phase build order. It assumes the PRD's MVP scope (Products, Services, Accommodation, Trust & Safety, Featured Listings) as the target for Phase 1.
Stack philosophy
Every choice below optimizes for one founder shipping fast on a real budget, on a stack that carries forward cleanly into a native mobile app later — not for resume-building or chasing the newest framework.
2. Technology Stack
The core of the existing Bluestark stack is kept as-is. Two changes are recommended below, both low-risk and both already pointing the same direction the stack was heading.
2.1 Core Stack (unchanged)
Layer
Technology
Why it stays
Frontend framework
Next.js 15 (App Router) + React 19 + TypeScript
Already Isaac's daily driver; App Router gives file-based routing, server components, and image optimization out of the box — all useful for a media-heavy marketplace
Styling
Tailwind CSS
Fast to write, plays directly with Google Stitch exports (see Section 4), no separate CSS files to maintain
Backend & Data
Supabase (Postgres, Auth, Storage, Realtime, Edge Functions)
Auth, relational data, image storage, and realtime chat in one service — and the same backend a future Expo mobile app can call without rework
Hosting
Vercel
Already in use; zero-config CI/CD from Git, fast edge delivery to Nigerian users via its CDN
Payments
Paystack
Naira-native, supports card / bank transfer / USSD — the payment methods Nigerian students actually have
2.2 Recommended Additions / Changes
Change
From → To
Reason
Animation library rename
framer-motion → motion
Framer Motion was renamed Motion in 2025 and now ships under the motion package with the import path motion/react. Same API, same team, just a new name — install motion, not the deprecated framer-motion package, on day one of this build.
State / data fetching
Add TanStack Query
Listings, chat, and trust scores all need caching, refetching, and optimistic updates (e.g. an offer sent before server confirmation). Plain useEffect fetching gets unmanageable past a few screens; TanStack Query is the standard fix and pairs cleanly with Supabase.
Form handling
Add React Hook Form + Zod
Listing creation, verification upload, and accommodation posts all involve multi-field forms with validation (price formats, required photos, matric number patterns). This combo is the lightest, most battle-tested option and avoids reinventing validation per form.
Image handling
Add Sharp (server-side) via Next.js Image, plus client-side compression before upload
Student phone cameras produce large files; compressing in-browser before upload to Supabase Storage saves bandwidth cost and load time on slow connections — directly serves the low-bandwidth requirement in the PRD.

Why no rewrite
None of the above swaps the foundation — React/Next/Supabase/Vercel/Tailwind all stay. Everything added is a focused tool for a specific, recurring problem this app will hit immediately (forms, caching, image weight), not a speculative upgrade.
3. Animation and Polish System
The brief calls for more than five animation/polish frameworks used throughout the site, in a way that feels lively and fits a marketplace theme — while staying mobile-responsive and user-friendly rather than gimmicky. Below are six libraries, each solving a distinct kind of motion, so they layer without overlapping or fighting each other for control of the same element.
3.1 The Six Libraries
#
Library
Role in BataMarket
Where it shows up
1
Motion (motion/react)
Primary UI motion engine — layout transitions, gestures, shared-element animation
Page transitions, card hover/tap states, listing detail — image expand, modal open/close, the chat panel sliding in
2
Lenis
Smooth scroll — replaces the browser's default scroll with an eased, physics-based one
Homepage, category browse, and listing feed — makes scrolling itself feel premium instead of jumpy
3
Embla Carousel
Touch-friendly, lightweight carousels
Listing image galleries, “Featured” and “Trending” horizontal rows on the homepage — built mobile-first with real swipe physics, not desktop arrows bolted onto mobile
4
React Spring
Physics-based micro-interactions distinct from Motion's gesture system
Price-drop number count-ups, the Trust Score badge “filling in,” Featured Listing countdown pulse — small moments that reward attention without needing a full Motion sequence
5
Tailwind CSS Animate (tailwindcss-animate / tw-animate-css)
Lightweight CSS-only keyframe utilities for high-frequency, low-cost effects
Skeleton loading shimmer on listing cards while images load, button press states, toast notifications — anywhere a full JS animation library is overkill for a 200ms effect
6
canvas-confetti
One-shot celebratory burst
Successful trade confirmation, first listing posted, verification approved — small, infrequent moments of delight that mark progress without becoming noise
Table 3.1: Six animation/polish libraries, each with a distinct, non-overlapping job.
3.2 Why These Six, Not More
Six is past the “more than five” bar in the brief, deliberately not stretched further — every additional animation library adds bundle weight, which directly fights the low-bandwidth requirement that runs through the whole PRD. Each library above does a job none of the others do well:
Motion handles anything involving component state, layout change, or gesture — it's the heaviest-duty tool, reserved for where that power is actually needed.
Lenis only touches scroll physics — it doesn't know or care about component state, so it never conflicts with Motion.
Embla is purpose-built for swipeable carousels with real momentum and snapping — reimplementing that in Motion would be slower to build and worse on touch devices.
React Spring is reached for only when a value (a number, a fill percentage) needs to animate on its own physics curve outside of Motion's gesture/layout system — avoids forcing every animation through one library's mental model.
Tailwind's CSS keyframe utilities cost nothing at runtime — used for the dozens of tiny, constant-motion details (loading shimmer, hover lift) that would bloat a JS animation library if hand-coded there.
canvas-confetti is tiny (under 6kb) and used so rarely that its cost is negligible while its payoff (a moment of genuine delight at a real milestone) is high.
3.3 Mobile-First and Performance Rules
Every animation respects prefers-reduced-motion via Motion's useReducedMotion hook — required for accessibility and increasingly expected by users.
No animation blocks interaction: a listing is tappable the instant it's visible, even mid-transition.
Heavy animations (page transitions, modal opens) target transform and opacity only — never animate layout-triggering properties like width/height/top directly, which causes jank on mid-range Android devices common among Nigerian students.
Lenis and Embla are both under 5kb gzipped; Motion and React Spring are code-split per route so a student browsing the homepage never downloads the chat screen's animation code.
Test the full motion system on a throttled connection (Chrome DevTools “Slow 3G”) and a mid-range Android device before shipping — not just on a development machine on fast Wi-Fi.

4. Google Stitch in the Design Workflow
Google Stitch produces the visual design — color palette, type pairing, spacing rhythm, imagery direction — for BataMarket. It does not produce the production UI. The distinction matters: Stitch is excellent at generating a cohesive visual language fast, but its raw output isn't accessible, responsive-tested, or wired to real data, so it gets translated rather than copy-pasted.
4.1 Division of Responsibility
Owned by Google Stitch
Owned by the engineering build
Color palette (primary navy/gold or whatever direction is chosen for BataMarket's own brand, distinct from the Bluestark proposal palette)
Component structure, accessibility (focus states, ARIA, contrast validation), and responsive breakpoints
Typography pairing and scale
Actual Tailwind config — tokens translated into tailwind.config.ts, not hand-copied per component
Visual mood/imagery direction (e.g. how a listing card or category icon should feel)
Animation and interaction behavior (Section 3) — Stitch shows a static frame; motion is engineered separately
High-level layout inspiration for key screens (home, listing detail, chat)
Real layout implementation against real data — variable-length titles, empty states, loading states, error states
4.2 Workflow Steps
Generate the BataMarket palette and key-screen concepts in Stitch (homepage, listing card, listing detail, chat) — treat these as mood boards, not final screens.
Extract design tokens from the Stitch output: hex values for primary/secondary/accent/neutral colors, the font pairing, and the spacing scale Stitch settles on.
Translate tokens into tailwind.config.ts as named theme colors (e.g. brand-navy, brand-gold, surface, muted) so every component references semantic names, not raw hex codes.
Build real components against those tokens using the frontend-design conventions in Section 5 — Stitch's layout is a reference, not a template to clone pixel-for-pixel, because Stitch doesn't account for the animation system, real data shapes, or accessibility.
Treat any Stitch-generated screen as done only once it's been rebuilt responsively, tested with real (not placeholder) listing data, and wired into the motion system.
Why not ship Stitch output directly
AI design tools are strong at color/type/mood and weak at responsive edge cases, accessibility, and real data — a listing title that's one word versus three lines, an empty Services category, a failed image upload. Treating Stitch as the palette-and-mood source (not the UI source) gets the visual benefit without inheriting those gaps.

5. Application Architecture
5.1 Folder Structure
bata-market/
├── app/                      # Next.js App Router
│   ├── (marketing)/          # Public landing, no auth required
│   ├── (app)/                # Authenticated app shell
│   │   ├── listings/         # Browse, search, listing detail
│   │   ├── services/         # Services Marketplace
│   │   ├── accommodation/    # Accommodation listings
│   │   ├── chat/             # Realtime messaging
│   │   ├── profile/          # Seller profile, Trust Score
│   │   └── verify/           # Student + Vendor verification flows
│   └── api/                  # Route handlers (Paystack webhooks, etc.)
├── components/
│   ├── ui/                   # Base components (button, card, input)
│   ├── listings/             # Listing-specific components
│   ├── motion/               # Shared Motion variants, transitions
│   └── chat/                 # Chat UI components
├── lib/
│   ├── supabase/             # Client + server Supabase instances
│   ├── validation/           # Zod schemas (shared by forms + API)
│   └── hooks/                # TanStack Query hooks per resource
└── styles/
    └── tailwind.config.ts    # Design tokens translated from Stitch
5.2 Core Database Tables (Supabase / Postgres)
Table
Purpose
Key fields
profiles
Student or University Seller (Vendor) identity and verification state, distinguished by account_type
user_id, account_type, full_name/business_name, department, verification_status, trust_score
listings
Unified table for Products, Services, and Accommodation, distinguished by a type column
id, seller_id, type, title, price, category, condition, images[], status
accommodation_details
Extra fields specific to Accommodation listings, joined to listings
listing_id, room_type, location, available_from
messages
Realtime chat between buyer and seller
id, listing_id, sender_id, recipient_id, body, created_at
trust_events
Append-only log feeding the Trust Score calculation
user_id, event_type, weight, created_at
reports
User-submitted fraud/abuse reports
id, reporter_id, reported_user_id, listing_id, reason, status
transactions
Completed trade records, including Featured Listing payments
id, listing_id, buyer_id, seller_id, amount, payment_ref, type
Table 5.1: Core schema — simplified to essential fields; full column list belongs in the schema migration files, not this document.
5.3 Realtime and Edge Functions
Chat (messages table) uses Supabase Realtime's Postgres changes subscription — no separate WebSocket server needed.
Verification review uses a Supabase Edge Function triggered on new verification submissions, which notifies the admin reviewer (initially Isaac) via a simple internal dashboard rather than a public-facing admin product.
Trust Score recalculation runs as a Postgres function triggered by inserts to trust_events, keeping the score always current without a separate batch job.
6. Path to a Future Mobile App
The brief specifies this web app will move to a native app in future. The architecture above is chosen specifically so that transition is a frontend rebuild, not a backend rewrite.
6.1 What Carries Forward Unchanged
Supabase — Auth, database schema, Storage, and Realtime all work identically from a React Native/Expo app via the same supabase-js client, just with a different storage adapter for session persistence.
All business logic that lives in Postgres functions and Edge Functions (Trust Score calculation, verification triggers) — native and zero duplication required.
Zod validation schemas in lib/validation — reusable as-is if the mobile app is also TypeScript-based.
6.2 What Gets Rebuilt
All UI components — React Native doesn't render HTML/CSS, so Tailwind classes and DOM-based components don't carry over directly. NativeWind (Tailwind for React Native) is the recommended bridge to keep the same design tokens and most of the same mental model.
Motion's web-specific APIs — React Native equivalents (e.g. Moti, which is built on Motion's animation engine for React Native) cover most of the same ground, but this is a deliberate rebuild, not a copy-paste.
Navigation — Next.js App Router has no native equivalent; Expo Router is the natural choice since it mirrors the same file-based routing mental model.
Recommended future path
Expo (React Native) is the recommended framework when that rebuild happens — it shares the same Supabase backend with zero changes, supports the same TypeScript codebase conventions, and lets one mostly-JavaScript codebase target iOS and Android together rather than building twice natively.
7. Build Roadmap
Each phase assumes the previous one is functionally complete and deployed, not just coded.
Phase 0 — Foundation (Week 1)
Next.js project scaffolded with App Router, TypeScript, Tailwind, and the recommended additions from Section 2.2 installed
Supabase project created; core schema (Section 5.2) migrated; Row Level Security policies written for every table before any UI is built against them
Design tokens extracted from Google Stitch output and wired into tailwind.config.ts
Auth flow: sign up, login, session persistence
Phase 1 — MVP Core (Weeks 2–6)
Listings CRUD across all three types (Products, Services, Accommodation) with image upload and client-side compression
Search, filters, category browsing
Account-type signup fork (Student vs. University Seller), each with its own onboarding and verification flow, plus the internal manual-review dashboard handling both
Seller profiles, Trust Score display, reporting flow
Realtime chat
Safe-Swap Zone suggestions
Featured Listing payment flow via Paystack
Full animation system (Section 3) integrated throughout — not bolted on at the end
Phase 2 — Launch Readiness (Weeks 7–8)
Mobile responsiveness and slow-connection testing pass (Section 3.3)
Manual listing seeding (100–200 real listings) per the PRD's growth plan
Ambassador recruitment and publicity channel prep per the PRD
Production deploy, domain, and monitoring
Phase 3 — Post-Launch (Month 2+)
Wishlist, Student Requests, optional Swapping feature
Verified Badge upsell flow
Vendor accounts, Sponsored Listings (once Phase 1 revenue validates demand, per the PRD)


End of Technical Implementation Plan