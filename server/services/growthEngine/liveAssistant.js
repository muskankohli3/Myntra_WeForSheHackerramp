// AI Live Assistant — deliberately NOT a Gemini call. This runs every ~20s
// while a seller is live and needs to be instant, free, and 100% reliable —
// a network round-trip to an LLM would add latency and cost for what is
// fundamentally a small set of threshold rules. This is the "impactful, not
// just AI-labeled" feature the spec asked for: the seller sees a genuinely
// useful nudge, generated deterministically from real session signals.
// (Gemini is reserved for the touchpoints that actually need generation —
// naming, rewriting, translation, summarization, explanation.)
//
// One tip per tick at most (nothing to show returns null), and each rule
// tracks its own "already suggested this reason recently" cooldown via the
// `cooldowns` map passed in from socket room state, so the seller isn't
// spammed with the same nudge every 20 seconds.

const COOLDOWN_MS = 90 * 1000;

function shouldFire(cooldowns, key, now) {
  const last = cooldowns.get(key) || 0;
  if (now - last < COOLDOWN_MS) return false;
  cooldowns.set(key, now);
  return true;
}

const GENERIC_TIPS = [
  { text: "Mention free/fast delivery to Tier-2 & Tier-3 cities now — it's a top reason Bharat shoppers hesitate.", icon: "truck" },
  { text: "Show a quick size comparison on camera — sizing doubt is the #1 cause of live-stream cart abandonment.", icon: "ruler" },
  { text: "Remind viewers your return window is easy and free — trust sells as much as the product does.", icon: "shield" },
  { text: "Call out the fabric/material close-up — it answers a question before it's even asked.", icon: "sparkles" },
];

/**
 * @param {object} stats
 * @param {number} stats.viewerCount - current viewers
 * @param {number} stats.peakViewerCount - peak viewers so far this session
 * @param {number} stats.secondsSinceLastComment - time since any chat activity
 * @param {number} stats.cartAddsLast2Min - add-to-carts in the last 2 minutes
 * @param {number} stats.pinnedStockRemaining - total remaining stock of the pinned product (null if none pinned)
 * @param {Map} cooldowns - per-room Map<ruleKey, lastFiredTimestamp>, owned by the socket room state
 */
function computeLiveAssistantTip(stats, cooldowns) {
  const now = Date.now();
  const {
    viewerCount = 0,
    peakViewerCount = 0,
    secondsSinceLastComment = 0,
    cartAddsLast2Min = 0,
    pinnedStockRemaining = null,
  } = stats;

  if (viewerCount >= 3 && secondsSinceLastComment >= 60 && shouldFire(cooldowns, "engagement_drop", now)) {
    return { type: "engagement_drop", icon: "message-circle", text: "Engagement dropped — ask viewers a question or launch a quick poll to re-engage them." };
  }

  if (peakViewerCount >= 8 && viewerCount <= peakViewerCount * 0.6 && shouldFire(cooldowns, "viewers_dropping", now)) {
    return { type: "viewers_dropping", icon: "trending-down", text: "Viewers are dropping off — a flash deal or coupon right now usually brings them back." };
  }

  if (pinnedStockRemaining !== null && pinnedStockRemaining <= 5 && shouldFire(cooldowns, "low_stock", now)) {
    return { type: "low_stock", icon: "package", text: `Only ${pinnedStockRemaining} left of the pinned product — mention the limited quantity to create urgency.` };
  }

  if (viewerCount >= 5 && cartAddsLast2Min === 0 && shouldFire(cooldowns, "no_cart_adds", now)) {
    return { type: "no_cart_adds", icon: "shopping-cart", text: "No add-to-carts in the last couple of minutes — try showing a different color or highlighting the price drop." };
  }

  if (shouldFire(cooldowns, "generic", now)) {
    const tip = GENERIC_TIPS[Math.floor(Math.random() * GENERIC_TIPS.length)];
    return { type: "generic", icon: tip.icon, text: tip.text };
  }

  return null;
}

module.exports = { computeLiveAssistantTip };
