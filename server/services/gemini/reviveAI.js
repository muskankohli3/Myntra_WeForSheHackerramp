const { generateText } = require("./geminiClient");

// AI touchpoint 3: rewritten product title/description fix for a flagged
// low-conversion product. Text/attribute-based only (no vision), reuses the
// same underlying generateText call pattern as touchpoints 1-2.
async function reviveProductCopy(product) {
  const prompt = `You are an AI listing-optimization assistant for a Myntra seller.
This product has high impressions but low clicks/conversions. Rewrite its title and
description to fix likely issues (missing keywords, weak description, no size/fit info).
Respond STRICTLY as JSON with exactly two keys, "title" and "description" — no markdown
fences, no extra commentary, just the raw JSON object.

Current title: ${product.name}
Brand: ${product.brand}
Category: ${product.category}
Current description: ${product.description || "(none)"}
Price: ₹${product.price}
Sizes available: ${(product.sizes || []).join(", ")}
Impressions: ${product.impressions}, Clicks: ${product.clicks}, Conversions: ${product.conversions}`;

  const fallback = JSON.stringify({
    title: `${product.brand} ${product.name} — ${product.category} | True-to-Size Fit`,
    description: `${product.name} by ${product.brand}. Breathable fabric, true-to-size fit, available in ${(product.sizes || []).join(
      ", "
    )}. Perfect for everyday wear.`,
  });

  const raw = await generateText(prompt, fallback);

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.title && parsed.description) return parsed;
    throw new Error("missing keys");
  } catch {
    return JSON.parse(fallback);
  }
}

module.exports = { reviveProductCopy };
