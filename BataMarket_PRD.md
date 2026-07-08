
BATAMARKET
The Trusted Marketplace for Nigerian Students

PRODUCT REQUIREMENTS DOCUMENT
Version 1.0

Prepared by Bluestark
Isaac Testimony — Founder & Product Lead
June 2026

1. Product Overview
1.1 Product Name
BataMarket
1.2 Product Vision
BataMarket is a student-focused digital marketplace that enables university students to buy, sell, discover services, find opportunities, and connect with trusted peers within their campus ecosystem. The platform's goal is to become the primary commerce and opportunity hub for students across Nigerian tertiary institutions — starting with a single, deeply-served campus before expanding.
1.3 Positioning
BataMarket is a marketplace, not a barter exchange. Cash transactions (Naira) are the default and primary mode of exchange. Swapping is offered as a secondary, optional feature for users who want it — it is never a requirement to use the platform, and no part of the core experience depends on it. This distinction matters: a swap-first design adds friction (matching constraints, valuation disputes, multi-party coordination) that most students don't need most of the time. A cash-first marketplace with swapping as an option captures both the convenience-seeking majority and the asset-rich, cash-poor minority.
Design Principle
If a feature only serves swap transactions, it ships after the core marketplace is proven — not before. Cash listings, search, chat, and trust/safety come first.

2. Problem Statement
Students face recurring friction accessing affordable products, services, and opportunities. Today's alternatives — WhatsApp groups, departmental forums, Facebook groups, and word of mouth — are fragmented, unsearchable, unverified, and prone to fraud. A listing posted in a WhatsApp group at midnight is seen by a fraction of its intended audience, most of whom are asleep, and is gone from view within hours.
Specifically, students struggle to:
Buy affordable textbooks and academic materials
Sell items they no longer need
Find trusted, vetted service providers (tutors, designers, developers)
Access student jobs and gigs
Locate accommodation and find compatible roommates
Exchange or swap products when cash is tight
Verify that a seller or buyer is a real, accountable student
There is no centralized platform built specifically around these needs for the Nigerian student context.
3. Product Goals
3.1 Primary Goals
Build a trusted, verified student marketplace
Enable safe peer-to-peer commerce
Reduce fraud and bad-actor activity among student transactions
Improve student access to affordable goods and services
3.2 Secondary Goals
Enable optional product swapping for cash-constrained students
Support student entrepreneurship and side-income generation
Increase reuse of textbooks, electronics, and academic resources
Create a discovery layer for student jobs and gigs
4. Target Users
4.1 Primary Users
University students — buyers and sellers across all faculties and levels.
4.2 Secondary Users
Student entrepreneurs running small campus businesses
Tutors, designers, developers, and other student service providers
Hostel/accommodation owners
Campus vendors (provisions, food, printing, etc.)
Student organizations and unions (event promotion, bulk requests)
Recruiters posting internships or part-time roles

5. Core Marketplace Features
Features below are tagged by build phase: 
MVP — ships in v1, required to launch
V2 — ships once MVP has active users and proven retention
V3 — expansion features, only after multi-campus traction

Scope Update
Services Marketplace and Accommodation are now included in MVP. This increases build time over a listings-only launch, but both are high-frequency student needs that justify being available from day one rather than bolted on later. Accommodation ships in a deliberately reduced form for MVP — see Section 5.7 for what's in and what's held back.

5.1 Product Listings  [MVP]
Sellers can:
Create a listing with title, price, and category
Upload multiple images
Add a description
Set item condition (New, Like New, Good, Fair, Used)
Categories: Textbooks, Electronics, Fashion, Academic Materials, Engineering Tools, Computer Accessories, Hostel Essentials, Food & Provisions, Others.
5.2 Product Discovery  [MVP]
Buyers can browse by category, search by keyword, filter, and sort results.
Filters: Price range, Category, Campus, Department, Condition, Distance/Location.
5.3 Seller Profiles  [MVP]
Each profile displays: Name, Department, Institution, Verification status, Rating, Number of successful transactions, and Response rate.
5.4 Messaging System  [MVP]
Real-time chat, image sharing within chat, offer negotiation, and transaction-specific discussion threads. Phone numbers and room numbers stay hidden until both sides agree to proceed.
5.5 Trust and Safety  [MVP]
Account Types
Signup forks into two account types, chosen at the start of onboarding rather than inferred later. This matters because the PRD already names campus vendors as a target user (Section 4.2) and Vendor Accounts as a revenue stream (Section 6.2) — formalizing the account type at signup means vendor listings exist from MVP, rather than being retrofitted once the subscription feature ships.
Account Type
Who
Verification at signup
Student
Enrolled EKSU students buying/selling/trading
Full name, department, level, phone number, student ID or course-slip photo, live selfie — full flow below
University Seller (Vendor)
Campus businesses without enrollment status: provision stores, food vendors, printing, off-campus landlords, and similar
Business name, business email, business address, phone number — lighter check, reviewed manually, no ID/selfie required since vendors aren't claiming student status
Both account types land in the same “Pending” state until reviewed — see Section 5.5.1 and 5.5.2. Vendor information is self-reported with no document backing it, which is weaker evidence than the student ID-plus-selfie check; holding vendors to the same review gate keeps the trust bar consistent rather than letting the weaker-verified path skip the queue.
5.5.1 Student Verification — Simple, Document-Based Model
Full university SSO/OAuth integration is not realistic without EKSU's institutional cooperation, which an independent app will not get at launch (see Section 10). The verification model below is the standard fallback used by student-discount platforms worldwide when SSO access isn't available, and it is simple enough to build and use from day one.
Sign up with full name, department, level, and a personal phone number.
Upload a photo of student ID card, or a current course registration/exam slip showing matric number, name, and session — whichever the student has on hand.
Take a live selfie inside the app (no gallery upload) so the face can be visually compared to the ID photo.
Status shows as “Pending” immediately — the student can browse right away, but cannot list, message, or be Featured until approved.
A human reviewer (Isaac, at launch) checks the ID photo against the selfie and approves or rejects within a target of 24 hours. This is manual and unscalable on purpose at low volume — it builds trust fastest, and the bottleneck only becomes worth solving once volume justifies a reviewer queue or paid verification API.
Optional, not required: a school/department email if the student has one, added as a secondary trust signal but never the only check — many students won't have one, and free email-domain checks are easy to fake.
5.5.2 University Seller (Vendor) Verification
Sign up with business name, business email, business address, and phone number.
Status shows as “Pending” immediately, same as students — the vendor can browse and prepare listings as drafts, but cannot publish, message, or be Featured until approved.
A human reviewer confirms the phone number is reachable and the business address is plausible (an ambassador can do a physical check where the business is on or near campus). This is intentionally lighter than the student flow since there's no ID-equivalent document for a business at this stage — see Section 10 for the open risk this carries.
Approved vendors get a distinct “Vendor” badge on their profile and listings, separate from the student Verified badge, so buyers can see which kind of seller they're dealing with.
Why this, not OAuth
Document-plus-selfie review is exactly what student-verification services (ID.me, SheerID, Student Beans) fall back to whenever a school doesn't support direct SSO integration. It needs no institutional partnership, costs nothing but reviewer time at launch, and is simple enough for a single founder to run by hand for the first few hundred users.
Onboarding Experience
Verification (5.5.1, 5.5.2) covers what information is collected and how it's checked. Onboarding is the experience around that collection — and it's treated as a product surface in its own right, not just a form to get through, because a clumsy first five minutes is the easiest way to lose a student or vendor before they ever see a listing.
The very first screen asks one question — “Are you a student or a university seller?” — before anything else, and the rest of onboarding adapts to that choice rather than showing irrelevant fields to either group.
Each step asks for one thing at a time (not a long form), with visible progress (e.g. “Step 2 of 4”) so the process feels short even when it has several steps.
The reason for each ask is stated in plain language at the point of asking — e.g. “We check this so other students know you're really enrolled here” — rather than presenting verification as bureaucratic friction with no explanation.
Once submitted, the Pending state is framed as forward progress, not a dead end: show what the student or vendor can already do (browse, prepare draft listings) while waiting, and roughly how long review usually takes, so the wait doesn't feel like rejection.
On approval, a small celebratory moment marks the transition into full access (see the Implementation Plan's animation guidance on canvas-confetti for genuine milestones) — this is the first moment BataMarket actively trusts the user, and it should feel like one.
Trust Score
Calculated from: verification level, transaction history, user ratings, reports filed against the account, and account age.
Reporting
Users can report scams, fake listings, and abusive behavior. Reports feed directly into Trust Score and a moderation queue.
Safe Meet-Up Spots
The app suggests known, publicly visible on-campus locations (library entrance, student union building, departmental common rooms) for physical exchanges.
5.6 Services Marketplace  [MVP]
Students offer services: Graphic Design, Web Development, Tutoring, Typing, CV Writing, Video Editing, Photography. Each service listing includes pricing, a portfolio, reviews, and availability. Pulled into MVP because service demand (tutoring, typing, design) is constant and high-frequency on campus — it's effectively the same listing infrastructure as products, with a booking step added, so the marginal build cost over product listings is low.
5.7 Accommodation  [MVP — reduced scope]
Students list rooms/hostel space for rent or sublet, and post roommate-wanted requests. Included in MVP because accommodation search is one of the most painful, highest-stakes recurring student need — but scoped down deliberately for v1:
In: listing creation (photos, price, location, room type), search/filter by location and price, in-app chat with the lister, and the same Trust Score / reporting system used everywhere else.
Out for v1: no in-app rent payment or escrow, no lease contracts. Landlords who are not enrolled students sign up as University Seller (Vendor) accounts (Section 5.5.2) rather than going through the student ID flow — the same account type used by other campus businesses.
Safety note carried over from physical-meetup guidance: accommodation viewings should follow the same Safe-Swap Zone logic where possible — recommend viewing in daylight, with a friend, and meeting first in a public campus location before going to the property.
5.8 Wishlist  [V2]
Save products, follow listings, and receive price-drop alerts.
5.9 Student Requests (Demand Posts)  [V2]
Students post what they need (e.g. “Need CIV 401 Textbook,” “Need Calculator,” “Looking for Tutor”). Matching sellers receive a notification automatically.
5.10 Swapping (“Trade By Bata”)  [V2 — optional, secondary]
Users may optionally exchange products directly, or products plus a cash top-up, instead of a straight sale. The system surfaces likely matches based on listing and request data. This sits alongside the cash marketplace — it is never the default flow, and a user can ignore it entirely and still get full value from the app.
5.11 Jobs Board  [V3]
Student jobs/gigs board for recruiters and businesses to post part-time and internship opportunities. Held for V3 because it requires a denser, multi-campus user base and a recruiter-acquisition motion that isn't worth building before the core marketplace has traction.
6. Monetization Strategy
The original plan listed revenue categories (subscriptions, advertising, featured listings) without committing to specific mechanics. Below is a concrete model, ordered by what should be switched on first.
6.1 Phase 1 Revenue (turn on at launch)
Stream
Mechanic
Why it works at launch
Featured/Boosted Listings
NGN 200–500 to pin a listing to top of category/search for 48 hours
Zero trust required from buyer side; seller pays for visibility on demand
Verified Seller Badge
One-time fee for ID-verified status (matric number + photo match)
Low cost to user, directly increases their conversion rate — sells itself
Services Commission
5–10% commission on bookings made through the Services Marketplace only
Justifiable because BataMarket is the discovery and trust layer for the booking
Table 6.1: Phase 1 monetization — live from MVP launch.
6.2 Phase 2 Revenue (once 1,000+ MAU on one campus)
Stream
Mechanic
Notes
Vendor/Business Accounts
Monthly subscription for campus businesses (provision stores, printing, food vendors) to list a full catalog
Recurring revenue, but only credible once buyer volume exists
Sponsored Listings
Local businesses pay to promote products to students in a specific campus/area
Needs an ad-sales motion; don't build this until there's traffic worth selling
Job Post Fees
Recruiters/businesses pay per job post to reach verified students
Pairs with the V3 Jobs Board
Table 6.2: Phase 2 monetization — introduce after the core marketplace has proven engagement.
6.3 What was deliberately left out
No commission on product sales (textbooks, electronics, etc.) — students will simply move the deal to WhatsApp to avoid a cut on a one-off cash sale. Commission only works where BataMarket is providing ongoing discovery/trust value, as with Services.
No general student subscription tier at launch — students will not pay a recurring fee for an unproven app with no network effect yet.
No cryptocurrency or platform-internal “coin” currency — adds regulatory and trust complexity with no benefit over Naira and the optional swap feature.
7. Growth Strategy
7.1 Single-Campus Focus
Launch and dominate one institution (EKSU) before expanding. A marketplace's value is networked — a half-populated multi-campus app is worse than a fully-populated single-campus app. Expansion to a second institution should only happen once EKSU shows real week-over-week retention.
7.2 Manual Seeding
Pre-launch, seed 100–200 real listings by hand (Isaac and early ambassadors posting genuine items) so day-one users see a populated marketplace instead of an empty shell. An empty marketplace is the single most common reason new campus apps die before anyone gives them a fair try.
8. Advertising and Publicity Plan
BataMarket has no advertising budget at launch, so every channel below is chosen because it costs time and relationships rather than cash, and because it reaches students where they already are — not because it's the most “marketing”-sounding option.
8.1 Campus Ambassador Program  — primary channel
Recruit 3–5 student reps per hall/department who post and talk about BataMarket within their own social circles. Ambassadors earn a percentage of Featured Listing revenue generated by users they referred, paid out monthly. This aligns incentive with the metric that matters (paying, active users), costs nothing until it produces revenue, and uses the existing social structure of campus life rather than fighting it.
8.2 Channel Plan
Channel
Use
Cost
WhatsApp status & groups
Daily posting of new listings and “deal of the day” highlights directly into the existing WhatsApp groups BataMarket is replacing — meet students where they already trade
Free
Instagram & TikTok (campus pages)
Short videos: “found this for NGN 3,000 on BataMarket,” unboxing-style listing highlights, and student testimonials; tag and collaborate with existing EKSU meme/gossip pages that already have an audience
Free – low (occasional paid shoutout on a popular page)
Physical flyers & posters
Hostel notice boards, faculty notice boards, and the Student Union Building — QR code straight to sign-up
Low (printing only)
Department/Faculty reps
Direct pitch to course reps and class WhatsApp admins to allow one approved BataMarket post per week in their group
Free
Orientation/Fresher's Week table
Physical sign-up table at the start of each session when new students are actively looking for textbooks and hostel items
Low (printing, possibly a table fee)
Referral incentive
Existing users get a small Featured Listing credit for every verified friend who signs up and completes a transaction
Cost only on conversion, paid from existing revenue
Table 8.1: Publicity channels, in priority order. Paid advertising (sponsored posts, influencer deals) is deliberately absent until Phase 2 revenue is flowing — see Section 6.2.
8.3 Sequencing
Weeks 1–2 (pre-launch): seed listings, recruit first ambassador cohort, print flyers, prepare launch content for socials.
Launch week: flyer drop + WhatsApp/Instagram push timed together, ambassadors active in their halls, sign-up table if timed near a resumption/orientation period.
Weeks 3‒8: weekly content cadence (deal highlights, testimonials), referral incentive turned on once there's a real user base to refer into.
Month 3+: introduce paid promotion only once Phase 1 revenue (Section 6.1) shows the unit economics work — spend should come from BataMarket's own revenue, not external funding, for as long as possible.
9. Success Metrics
Category
Metric
Target signal
Marketplace
Daily / Monthly Active Users
Steady week-over-week growth, not just launch spike
Marketplace
Listings created per week
Supply-side health — leading indicator before transactions exist
Marketplace
Transactions completed
Listings that convert to an actual exchange, not just views
Trust
Fraud reports per 100 transactions
Should trend down as Trust Score and verification mature
Trust
Dispute rate
Flags listing quality or chat/negotiation friction if elevated
Trust
Average user rating
Should hold above 4.0/5 as volume scales, not just at small N
Revenue
Featured Listing revenue
First real signal of willingness-to-pay
Revenue
Services commission revenue
Validates the Services Marketplace investment
Publicity
Sign-ups per channel
Tracked via referral/QR codes per channel to see which actually convert
Table 9.1: Core metrics tracked from MVP launch onward.
10. Key Risks and Open Questions
Cold start: a marketplace is worthless with no listings and worthless with no buyers. Mitigated by the manual seeding plan in Section 7.2.
Verification ceiling: the document-plus-selfie model in Section 5.5 is a trust signal, not a guarantee — a determined bad actor with a stolen or fake ID could still pass manual review. Accept this as an acceptable launch-stage risk, and revisit with a paid verification API or campus partnership only once volume makes manual review the actual bottleneck.
Reviewer bottleneck: manual verification doesn't scale past a few hundred sign-ups without a second reviewer or a faster tool. Plan to recruit a second trusted reviewer (e.g. an ambassador) once daily sign-ups consistently exceed what one person can review within 24 hours.
Physical safety during meetups (including accommodation viewings) remains a real risk regardless of in-app Safe-Swap suggestions — the app can reduce risk, not eliminate it. This should be stated plainly in the app's safety messaging rather than implied as solved.
Payment handling: decide early whether BataMarket ever touches money directly (escrow) or stays a pure discovery/chat layer with cash exchanged in person. Escrow adds major regulatory, fraud-liability, and engineering overhead — recommend staying off-platform-payment for v1.
Vendor verification ceiling: University Seller accounts (Section 5.5.2) are checked with business name, email, address, and phone — no document-equivalent to the student ID check. A reachable phone number and plausible address are weaker evidence than a photo ID, so this is a deliberately accepted gap at launch volume, not a solved problem. Revisit if vendor-related fraud reports start showing a pattern, especially for off-campus landlords listing Accommodation.

11. Technical Approach
BataMarket will be built on the stack already used for Bluestark client delivery, which keeps build time and hosting cost low and lets Isaac move fast without a new learning curve.
Layer
Technology
Purpose
Frontend
React, Next.js, TypeScript, Tailwind CSS
Responsive, mobile-first UI — most students browse on phones
Backend / Data
Supabase (Postgres, Auth, Storage, Realtime)
Auth, listings database, image storage, and realtime chat in one service
Animation/Polish
Framer Motion
Listing transitions, micro-interactions for a premium feel
Hosting
Vercel
Fast global delivery, simple CI/CD from Git
Payments (Phase 1 fees)
Paystack or Flutterwave
Naira-native, supports card/bank transfer/USSD for boost fees & badges
Table 11.1: Recommended technical stack.
11.1 Build Sequence
Phase 0: Database schema (users, listings, categories, messages, trust scores, verification queue) + auth flow + manual verification review tool (even a simple internal admin view is enough at launch volume)
Phase 1 (MVP): Listings CRUD (Products, Services, Accommodation), search/filter, seller profiles, chat, reporting, Safe-Swap Zone suggestions, Featured Listing payment flow, document-plus-selfie verification flow
Phase 2: Wishlist, Student Requests, optional Swapping feature, Verified Badge upsell flow
Phase 3: Vendor accounts, Sponsored Listings
Phase 4: Jobs board (only with multi-campus demand validated)


End of Product Requirements Document