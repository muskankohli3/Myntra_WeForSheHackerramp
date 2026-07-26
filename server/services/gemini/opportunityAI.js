const { generateText } = require("./geminiClient");

// AI touchpoint 1: plain-language "Why?" explanation behind an Opportunity Feed card.
async function explainOpportunity(opportunity) {
  const product = opportunity.productId;

  const prompt = `You are an AI growth assistant inside a Myntra seller dashboard.
Explain in 2-3 short, plain-language sentences WHY this opportunity card is being shown to the seller.
Be concrete, reference the numbers given, and keep it conversational — no headings, no markdown, no bullet points.

Opportunity type: ${opportunity.type}
Title: ${opportunity.title}
Subtitle: ${opportunity.subtitle}
Region: ${opportunity.region || "N/A"}
Estimated viewers: ${opportunity.estimatedViewers || "N/A"}
Confidence score: ${opportunity.confidence}/100
Impact score: ${opportunity.impactScore}/100
Reasoning seed data: ${opportunity.reasoningSeed}
${product ? `Linked product: ${product.name} — category ${product.category}, price ₹${product.price}, impressions ${product.impressions}, clicks ${product.clicks}, conversions ${product.conversions}` : ""}`;

  const fallback = `This card is scored ${opportunity.impactScore}/100 based on ${opportunity.reasoningSeed || "recent demand and product signals"}.`;

  return generateText(prompt, fallback);
}

module.exports = { explainOpportunity };
