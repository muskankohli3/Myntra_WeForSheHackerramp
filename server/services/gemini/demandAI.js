const { generateText } = require("./geminiClient");

// AI touchpoint 2: turns seeded regional sales/demand data into the natural-language
// signal shown on "Go Live Now" opportunity cards (e.g. "Cotton Kurtas trending in Jaipur").
async function generateDemandNarrative(opportunity) {
  const product = opportunity.productId;

  const prompt = `You are an AI demand-signal assistant for a live-commerce seller dashboard.
Write ONE short, punchy sentence (max 18 words) describing a regional demand spike, in the
style of: "Cotton Kurtas are trending in Jaipur right now — 3x more searches this week."
No markdown, no quotes around the output, just the sentence.

Product: ${product ? product.name : "N/A"}
Category: ${product ? product.category : "N/A"}
Region: ${opportunity.region || "your region"}
Estimated live viewers if seller goes live now: ${opportunity.estimatedViewers}
Seed signal data: ${opportunity.reasoningSeed}`;

  const fallback = `${product ? product.name : "This category"} is trending in ${opportunity.region || "your region"} right now.`;

  return generateText(prompt, fallback);
}

// Used by the Regional Demand board (Bharat idea #3) — turns one seeded
// RegionalDemand row into a short sentence a seller can act on. Called only
// for the city/category the seller drills into (not all ~55 cities at once),
// so this stays a handful of calls per dashboard visit, not hundreds.
async function generateRegionalNarrative(demand) {
  const prompt = `You are a regional-demand assistant for a live-commerce seller dashboard. Write ONE short,
punchy sentence (max 20 words) telling a seller why demand for this category is notable in this city
right now. No markdown, no quotes.

City: ${demand.city}, ${demand.state}
Category: ${demand.category}
Demand score: ${demand.demandScore}/100 (trend: ${demand.trend})
${demand.festivalTag ? `Upcoming festival driving demand: ${demand.festivalTag}` : ""}`;

  const fallback = demand.festivalTag
    ? `${demand.category} demand is ${demand.trend} in ${demand.city} ahead of ${demand.festivalTag}.`
    : `${demand.category} demand is ${demand.trend} in ${demand.city} — score ${demand.demandScore}/100.`;

  return generateText(prompt, fallback);
}

module.exports = { generateDemandNarrative, generateRegionalNarrative };
