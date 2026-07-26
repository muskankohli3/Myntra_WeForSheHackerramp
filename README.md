# Myntra Growth Engine — "Build What's Next: Myntra for Bharat"

A full-stack, end-to-end live-commerce prototype built around two of the
hackathon's idea-starters: **making it easy for Tier-2/Tier-3 sellers to sell
on Myntra**, and **building trust with Tier-2/Tier-3 buyers** — with live
shopping streams as the primary mechanic and a set of deliberately-scoped AI
and rule-based features supporting it on both sides.

This is **one person's complete build** of the project (not split by feature
owner) — every screen, route, and socket event described below is wired to a
real backend. There is nothing here that is UI-only or mocked in place of a
real feature; see [§9 "What's real vs. what's approximated"](#9-whats-real-vs-whats-approximated)
for the handful of honest, deliberate exceptions.

This folder has no `.git` history and is not connected to any GitHub remote —
it's a plain folder of source code, ready for you to `git init` yourself if
you want version control.

---

## Table of contents

1. [What's in this build](#1-whats-in-this-build)
2. [Prerequisites](#2-prerequisites)
3. [Setup](#3-setup)
4. [Demo logins](#4-demo-logins)
5. [Where the data lives (and how there's so much of it)](#5-where-the-data-lives-and-how-theres-so-much-of-it)
6. [Verifying it end to end](#6-verifying-it-end-to-end)
7. [Project structure](#7-project-structure)
8. [The AI &amp; growth-engine touchpoints](#8-the-ai--growth-engine-touchpoints)
9. [What's real vs. what's approximated](#9-whats-real-vs-whats-approximated)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What's in this build

### The core mechanic: live shopping
Sellers broadcast real video (WebRTC) to shoppers, who chat, ask questions,
react, vote in polls, claim coupons, watch flash-sale countdowns, and buy —
all without leaving the stream.

### Bharat idea #1 — Local name ⇄ global name for every product
A Tier-2/3 seller often knows a product only by its local/regional name
(a *Bandhani Odhna*, an *Ikkat Kurti*). In **Add Product**, a seller can
upload a photo, type their own local name + a rough description, and hit
**Generate names** — Gemini's vision model returns *both* a polished local
presentation and a globally-recognizable one (e.g. "Tie-Dye Kurta"). Both are
saved. On the storefront, the **name shown by default depends on the
shopper**: someone in the same region/Tier-2/3 city sees the local name
first, a metro shopper sees the global one — and everyone gets a small
toggle pill to flip it manually (see `client/src/utils/productDisplay.js`).

### Bharat idea #2 — Nearby recommendations
The customer home screen has a **"Near You"** section: nearby sellers (real
distance, computed from lat/lng — see `haversineKm`), and a "Trending near
you" product grid whose ranking blends **location** (same city/zone as the
customer) with the **customer's own browsing history and wishlist
categories** — every product shown carries a plain-language `reason` (e.g.
*"Because you viewed Kurtas recently"*), so it's explainable, not a black box.

### Bharat idea #3 — Regional Demand board
A seller-facing page (**Regional Insights**) showing, across ~55 Tier-2/3 +
metro cities, which cities are hottest for their category right now, why
(festival season, trend), and how that compares to their own city. Rendered
as a geo-scatter — bubbles are plotted at each city's real relative lat/lng
position — deliberately **not** a traced India coastline (see
[§9](#9-whats-real-vs-whats-approximated) for why), so the layout is honestly
geographic without pretending to be a precision map graphic.

### Live shopping features (customer side)
Pinned "now showing" product card with live stock ("Only 4 left"), Add to
Cart / **one-click Buy Now that never leaves the stream** / Wishlist /
Share, tap-to-react (❤️🔥😍👏👍, floating animation), live polls, flash-sale
countdown banners, coupon claim popups, Follow-seller (→ notifications),
a separate **Q&A tab** with upvoting and instant tap-to-ask quick questions,
and live translated captions.

### Live studio features (seller side)
Front/back camera switch, mic toggle, **pause/resume without ending the
stream**, pin-a-product, a live Inventory panel (per-size stock, updates the
instant an order comes in), chat moderation (pin/mute/delete), a Q&A panel
separate from chat where answering one question **auto-resolves near-duplicate
questions from other viewers**, a Promotions panel (coupon / flash sale /
bundle / BOGO — each auto-expires and notifies followers), a Poll creator,
on-demand AI chat summarization, "N orders just placed" toasts, and a
**Live Assistant** feed of real-time growth nudges (see [§8](#8-the-ai--growth-engine-touchpoints)
for why this one is deliberately *not* an LLM call).

### Trust & post-purchase
Order-status tracking (placed → confirmed → shipped → delivered), and once
delivered, a **ratings & reviews** flow that recomputes the product's and
seller's aggregate rating.

### Search
One overlay searching products, sellers, and live streams in parallel.

---

## 2. Prerequisites

- **Node.js 18+** (Node 20+ recommended) — check with `node -v`
- **npm** (comes with Node) — check with `npm -v`
- **MongoDB** — either:
  - a local MongoDB server running on `mongodb://127.0.0.1:27017`, **or**
  - a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (get a connection string)
- **Google Chrome or Microsoft Edge** is recommended — live captions
  (speech-to-text) only work in Chromium-based browsers. Every other feature
  works in any modern browser.
- *(Optional but recommended)* A free **Gemini API key** from
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — without
  it, every Gemini-backed feature still works and returns a clearly-labeled
  fallback response instead of a live model response. Nothing errors out
  either way (see [§8](#8-the-ai--growth-engine-touchpoints)).

---

## 3. Setup

### 3.1 Backend (`server/`)

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and set:
- `MONGO_URI` — your local or Atlas connection string
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — optional, paste your key here for live AI responses

Then seed the database (this is the important one — see
[§5](#5-where-the-data-lives-and-how-theres-so-much-of-it) for what it creates):

```bash
npm run seed
```

You should see a long stream of `✅` lines ending in a `🎉 Seed complete`
summary with demo login credentials. Then start the backend:

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected: ...
🚀 Server running on http://localhost:5000
🔌 Socket.io ready, accepting connections from any origin (local prototype)
```

Leave this running.

### 3.2 Frontend (`client/`)

In a **second terminal**:

```bash
cd client
npm install
npm run dev
```

Open the printed URL (**http://localhost:5173**).

No new npm packages were introduced beyond what the original project already
used (React 19, Vite, Tailwind v4, `lucide-react`, `socket.io-client`) — every
new feature (image upload, the regional map, etc.) is built on those, so
there's nothing extra to configure.

---

## 4. Demo logins

Seeded by `npm run seed`. Every password is `demo1234`.

| Role | Email | Notes |
|---|---|---|
| Customer | `customer@demo.com` | Based in Jaipur; already follows Coastal Cotton Co. |
| Seller | `seller@demo.com` | "Urban Threads", Jaipur — has 2 products with local/global naming pre-generated |
| Seller | `seller2@demo.com` | "Coastal Cotton Co.", Kochi |
| Sellers | `bharatseller1@demo.com` … `bharatseller30@demo.com` | 30 generated Bharat-wide sellers, for browsing/search/nearby-recs variety |
| Customers | `bharatbuyer1@demo.com` … `bharatbuyer90@demo.com` | 90 generated customers spread across Bharat |

You can also sign up fresh accounts from the landing page (now with a city +
preferred-language picker) — signup/login are fully functional for both
roles.

---

## 5. Where the data lives (and how there's so much of it)

**There is no external data host.** Everything — every seller, product,
customer, order, review, and regional-demand row — lives in **your own
MongoDB** (local or Atlas), the same database your backend already connects
to via `MONGO_URI`. `npm run seed` is what populates it; nothing is fetched
from a remote API at runtime for demo data.

To make every feature feel real rather than "3 products in an empty demo,"
`server/seed/seed.js` procedurally generates a large, realistic dataset on
top of the three original hand-authored demo accounts:

- **~67 Bharat cities** (`server/data/geoIndia.js`) with real coordinates —
  Tier-2/3 cities named in the theme brief (Patna, Belagavi, Visakhapatnam,
  Coimbatore) plus ~60 more, each tagged with zone/state/tier.
- **32 sellers** total, spread across those cities, **~290 products** across
  8 categories (with per-size stock, some pre-tagged local/global naming
  pairs on Kurtas).
- **91 customers**, each with a city, browsing history, wishlist categories,
  and some following 0–3 sellers.
- **~20 ended live sessions** (with chat, a poll, a flash sale) plus a
  handful of scheduled ones, so Discovery/Replay/Analytics have real history
  to show immediately.
- **~220 orders** with realistic status distribution and **~80 reviews**,
  so ratings, top-products, and the review flow all have real numbers on
  first load.
- **536 Regional Demand rows** (67 cities × 8 categories) — enough for the
  Regional Insights board to look like a real signal feed, not 3 dots.

If you ever want *more* — more sellers, more cities, a different product mix
— it's all in one file: open `server/seed/seed.js`, bump `NUM_GENERATED_SELLERS`
/ `NUM_GENERATED_CUSTOMERS` / `NUM_ORDERS`, or extend `CATEGORIES` /
`CITIES`, and re-run `npm run seed` (it clears and re-seeds every collection,
so it's always safe to re-run).

If you'd rather this data live somewhere shareable with teammates instead of
your own laptop's MongoDB, the only change needed is pointing `MONGO_URI` at
a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster
instead of `mongodb://127.0.0.1:27017` — the code doesn't know or care which
one it's talking to.

---

## 6. Verifying it end to end

**Open two browser windows side by side** (e.g. one normal window + one
incognito/private window, so you can be a seller in one and a customer in
the other at the same time).

### 6.1 Core live loop
1. **Window A — Seller.** Log in with `seller@demo.com` / `demo1234`.
2. **Dashboard** — real Business Health numbers + Opportunity Feed cards,
   now with an impact-score ring and two new card types (Regional Demand
   Alert, Restock Alert). Click **Why?** — calls Gemini (or the labeled
   fallback) and explains the card, **translated into Hindi** (this
   seller's preferred language — try `seller2@demo.com`/Malayalam too).
3. Click **Regional Insights** in the sidebar — a bubble board of all ~67
   cities for this seller's category; click any bubble for an AI one-liner
   on why demand looks the way it does there.
4. Go to **Live Studio → Prep & Go Live** on the pre-seeded session, allow
   camera/mic, click **Start Going Live**.
5. **Window B — Customer.** Log in with `customer@demo.com` / `demo1234`.
   Home screen shows a **"Near You in Jaipur"** section (nearby sellers +
   trending products with a reason each). Go to **Live**, tap the live
   session — the seller's real camera feed should appear within a couple of
   seconds (genuine WebRTC, not a placeholder).
6. **Two-way live sync, in both directions:**
   - Viewer count in Window A ticks up when Window B joins.
   - Chat messages sync instantly both ways.
   - Tap a reaction emoji in Window B — it floats up the screen in Window B
     (ephemeral, and the seller's Likes counter in Window A ticks up).
   - In Window A's **Polls** tab, launch a poll — it appears instantly in
     Window B; vote, and the live percentages update in Window A too.
   - In Window A's **Promotions** tab, start a coupon — it pops up in
     Window B with a copy-able code and a live claim counter.
   - In Window B, tap the pinned product → **Buy Now** — this opens an
     inline one-click checkout **without navigating away from the stream**;
     placing it fires an order-placed toast in Window A, decrements the
     live per-size stock (visible in Window A's **Stock** tab), and (since
     the demo customer follows Coastal Cotton Co.) queues a notification.
   - Ask the same question twice from Window B in slightly different words
     — an AI-suggested reply appears in Window A's chat; send it, and watch
     both original questions get marked "Answered" via the auto-duplicate
     match.
   - Try the seller's chat moderation (pin/mute/delete a message) and watch
     it update instantly in Window B; try muting yourself in B and confirm
     the input disables with an explanatory message.
   - Watch Window A's **Assistant** tab for a real-time nudge (e.g. "ask a
     question — engagement dropped") within ~20–60 seconds of quiet chat.
7. **End the stream** in Window A — Window B auto-redirects to Replay.
   In Window A's **Analytics**, see conversion rate, avg watch time, and a
   **Top Products** leaderboard sourced from real orders.

### 6.2 The three Bharat-specific features
8. In **My Products → Add Product**, upload any photo, type a local name
   like *"Neeli Kurti"*, and click **Generate names** — you'll get a local +
   global name/description pair (Gemini vision, or a labeled fallback).
9. On the **customer** side, open any product with both namings (e.g. Urban
   Threads' "Cotton Kurta - Indigo") and tap the **Local name / Global name**
   pill to toggle the display.
10. Sign up a **new customer** and pick a Tier-2/3 city (e.g. Patna) at
    signup — the Home screen's "Near You" section should surface sellers
    based in/near that city.

### 6.3 Trust loop
11. As the customer, go to **Orders** — any `delivered` order (several are
    pre-seeded) shows a **Rate** button; submit a review and watch the
    product's star rating update.

### 6.4 Optional: verify across two physical devices
Find your computer's LAN IP (`ifconfig` / `ipconfig`), make sure both
devices share a WiFi network, and open `http://<your-lan-ip>:5173` on the
second device. No config changes are needed — CORS reflects whatever origin
the request came from, and the socket/WebRTC layer works identically over
LAN as it does on one machine.

---

## 7. Project structure

```
myntra-growth-engine/
├── server/
│   ├── data/geoIndia.js         # ~67-city Bharat geo dataset (zone/tier/lat/lng) + festival calendar
│   ├── models/                  # Seller, Customer, Product, LiveSession, Order, Comment, Opportunity,
│   │                             # BusinessHealth, Analytics, Poll, Promotion, Review, RegionalDemand, Notification
│   ├── controllers/, routes/    # REST API, grouped by resource
│   ├── socket/socketHandler.js  # Real-time core: chat, Q&A, moderation, reactions, polls, promotions,
│   │                             # pin sync, viewer counts, live-assistant tick loop, WebRTC signaling relay
│   ├── services/gemini/         # Every LLM-backed touchpoint, each with a graceful no-key fallback
│   ├── services/growthEngine/   # Deliberately NON-LLM logic: live-assistant tips, recommendation scoring
│   ├── middleware/auth.js       # JWT auth (+ protectOptional for logged-out-friendly endpoints)
│   └── seed/seed.js             # Demo + procedurally-generated Bharat-wide dataset (see §5)
└── client/
    ├── src/pages/customer/      # Home, Live Discovery, Live Session, Cart, Checkout, Orders, Replay, Profile
    ├── src/pages/seller/        # Dashboard, Products, Live (list/create/schedule), Prep/Coach, Live Studio,
    │                             # Analytics, Regional Insights
    ├── src/components/customer/ # ProductCard, SearchOverlay, NearbyRecommendations, ReactionLayer, PollWidget,
    │                             # FlashDealBanner, CouponPopup, FollowButton, QuickQuestionChips, ReviewForm...
    ├── src/components/seller/   # RegionalDemandMap, PromotionsPanel, QnAPanel, PollCreatorPanel,
    │                             # LiveAssistantPanel, InventoryPanel, ImageUploadField, SellerProductNamingTool...
    ├── src/hooks/                # useBroadcaster (+ camera switch), useViewer (WebRTC), useLiveRoom (all
    │                             # real-time state), useCaptions, useNotifications
    ├── src/utils/                 # imageCompress (photo → base64), productDisplay (local/global resolver),
    │                             # quickQuestions (rule-based tap-to-ask chips)
    ├── src/context/              # Auth (dual seller/customer sessions), Cart
    └── src/services/             # One file per REST resource, plus the socket.io client singleton
```

---

## 8. The AI & growth-engine touchpoints

Not everything smart in this app is a Gemini call — on purpose. Where a
rule-based, deterministic approach is just as useful and meaningfully faster
and cheaper, that's what's used; Gemini is reserved for genuinely generative
work (naming, rewriting, translation, summarization, explanation).

### Gemini-backed (each has a labeled fallback if `GEMINI_API_KEY` is unset)

| Where | What it does |
|---|---|
| Opportunity Feed → "Why?" | Plain-language explanation of why a card was surfaced — translated into the seller's preferred language |
| "Go Live Now" card → "Demand Signal" | One-line regional demand narrative |
| "Revive" card → "AI Rewrite" | Rewrites a low-conversion product's title/description |
| Prep/Coach screen | Talking-point prompts from the session's product list |
| Analytics → "Generate AI Insight" | Post-live recap sentence from real Q&A data |
| Live Studio → captions toggle | Speech → browser speech-to-text → Gemini translation → broadcast captions |
| Live Studio chat (automatic) | Detects near-duplicate questions, suggests one reply to cover them all |
| Add Product → "Generate names" | **Bharat idea #1** — photo + local name → local *and* global name/description (vision model) |
| Live Studio → "Summarize" | On-demand chat summary for the seller |
| Regional Insights → tap a bubble | One-line reason a city/category is trending (generated once, then cached on that row) |

### Deliberately rule-based (no LLM call — instant, free, always available)

| Where | Why not an LLM |
|---|---|
| Live Assistant tips (Live Studio) | Needs to fire every ~20s with zero latency/cost; a fixed set of threshold rules (viewer drop, no cart-adds, low stock, quiet chat) covers this well and is fully explainable |
| Nearby / "trending near you" recommendations | A transparent, explainable scoring formula (location + browsing history + regional demand) beats a black-box ranking for a *"why am I seeing this"* feature |
| Quick-question chips | Needs to render instantly for every viewer the moment a product is pinned |
| Duplicate-question auto-answer matching | Simple text-similarity check, not generation |

---

## 9. What's real vs. what's approximated

Everything is wired to a real backend — nothing is mock data standing in for
a feature. A few things are honestly approximated rather than fully
real-world-accurate, called out here so they aren't mistaken for bugs:

- **The Regional Demand map is a stylized geo-scatter, not a traced India
  map.** City bubbles are positioned at their real relative lat/lng within a
  bounding box, but the background is an abstract grid, not a coastline
  graphic — tracing an accurate India silhouette needs real GIS boundary
  data this build doesn't have, and getting it subtly wrong would be worse
  than being explicit that it's a scaled scatter plot.
- **Average watch time** isn't from per-viewer telemetry (this prototype
  doesn't track individual watch duration) — it's approximated from session
  duration and viewer count. Everything else in Analytics (views, questions,
  carts, orders, revenue, top products) is computed from real stored data.
- **Product photos** are stored as compressed base64 strings directly in
  MongoDB (`client/src/utils/imageCompress.js` resizes/compresses client-side
  first), not as files on a disk/S3 bucket — deliberately, so there's zero
  file-storage infrastructure to set up for a photo-upload feature to work.
- **Live captions** depend on the browser's built-in speech recognition
  (Chrome/Edge only) — the button simply doesn't render elsewhere
  (feature-detected), rather than showing something broken.
- **Regional demand scores** are seeded once, then nudged slightly by real
  orders as they happen (see `nudgeRegionalDemand` in `orderController.js`)
  — not recomputed from a live analytics pipeline every time.

Everything else — video, chat, Q&A, moderation, reactions, polls,
promotions, pinning, viewer counts, stock, cart-to-checkout, orders, reviews,
follows, notifications, auth, replay, search — is fully live against your
MongoDB, no mocks.

---

## 10. Troubleshooting

- **"MongoDB connection failed"** — check `MONGO_URI` in `server/.env`. If
  using Atlas, make sure your current IP is allow-listed in the Atlas
  dashboard.
- **Camera/mic permission blocked** — check your browser's site settings
  for `localhost:5173` (or your LAN IP), allow camera/microphone, reload,
  and click "Retry camera" in Live Studio.
- **Viewer count stuck at 0 / chat not syncing** — confirm the backend
  terminal still shows `🔌 Socket.io ready...`. The frontend connects to the
  backend directly on port 5000, so it must stay running.
- **Port already in use** — change `PORT` in `server/.env` (and the proxy
  target in `client/vite.config.js` to match) if 5000 is taken.
- **Product photo upload seems slow/fails on a huge image** — it's being
  resized/compressed entirely in your browser before upload; very large
  originals (e.g. 20MB+ RAW-ish phone photos) may take a moment longer, but
  should still complete. Try a smaller photo if it seems stuck.
- **`npm install` fails on a package version** — re-run it; a transient
  registry hiccup is the most common cause. No new/exotic dependencies were
  introduced by this build — everything added uses packages already in the
  original `package.json` files.
