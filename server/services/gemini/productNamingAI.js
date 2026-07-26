const { GoogleGenAI } = require("@google/genai");

// AI touchpoint 8 (Bharat idea #1): a T2/T3 seller often knows a product only
// by its local name (e.g. "Bandhani Odhna", "Ikkat Kurti") and may not know
// how to describe it in the vocabulary a metro/national shopper searches
// with. This takes a photo + the seller's own local name/description and
// returns BOTH a polished local presentation and a globally-recognizable one,
// so the storefront can show whichever fits the shopper (see
// client/src/utils/productDisplay.js) with a manual toggle either way.
//
// Unlike the other Gemini touchpoints (text-only), this one needs a
// multimodal call, so it talks to @google/genai directly rather than going
// through geminiClient's generateText helper.

const apiKey = process.env.GEMINI_API_KEY;
const client = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL = "gemini-3.1-flash-lite";

function heuristicFallback({ localName, description, category }) {
  const base = localName || "Handcrafted Piece";
  return {
    localName: base,
    localDescription:
      description || `${base} — a ${category || "fashion"} piece with authentic regional craftsmanship.`,
    globalName: `${category || "Fashion"} — ${base}`,
    globalDescription:
      (description ? `${description}. ` : "") +
      `A versatile ${category || "fashion"} piece with a distinctive regional design, styled for everyday wear.` +
      (client ? "" : " (Add GEMINI_API_KEY in server/.env to see live AI-generated naming here.)"),
  };
}

/**
 * @param {object} input
 * @param {string} input.localName - seller's own name for the product (required)
 * @param {string} input.description - seller's brief description (optional)
 * @param {string} input.category - product category
 * @param {string} [input.imageBase64] - base64-encoded photo (no data: prefix)
 * @param {string} [input.mimeType] - e.g. "image/jpeg"
 */
async function generateProductNaming({ localName, description, category, imageBase64, mimeType }) {
  const fallback = heuristicFallback({ localName, description, category });
  if (!client) return fallback;

  try {
    const promptText = `You are a fashion-catalog naming assistant for an e-commerce app serving both Tier-2/Tier-3
Indian shoppers and metro/national shoppers. A seller uploaded a photo of a product and gave you their
own local name and a short description. Produce TWO presentations of the same listing:

1. "local" — keep/polish the seller's own regional name and description (respect local textile/craft
   terms like "Bandhani", "Ikkat", "Ajrakh" etc. if applicable or visible in the photo) — this is what a
   shopper from the same region will recognise instantly.
2. "global" — the same product described the way a national/metro shopper searching in English fashion
   vocabulary would recognise it (e.g. "tie-dye", "block print", "wrap dress") — keep it accurate to what
   is actually visible in the photo, don't invent details you can't see.

Respond STRICTLY as JSON with exactly four keys: "localName", "localDescription", "globalName",
"globalDescription" — no markdown fences, no extra commentary, just the raw JSON object. Each
description should be 1-2 sentences.

Category: ${category || "Fashion"}
Seller's local name: ${localName || "(not given)"}
Seller's description: ${description || "(not given)"}`;

    const parts = [{ text: promptText }];
    if (imageBase64 && mimeType) {
      parts.push({ inlineData: { data: imageBase64, mimeType } });
    }

    const response = await client.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
    });

    const text = response?.text ?? response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return fallback;

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.localName || !parsed.globalName) throw new Error("missing keys");
    return {
      localName: parsed.localName,
      localDescription: parsed.localDescription || fallback.localDescription,
      globalName: parsed.globalName,
      globalDescription: parsed.globalDescription || fallback.globalDescription,
    };
  } catch (err) {
    console.error("⚠️  Gemini product-naming call failed, using fallback:", err.message);
    return fallback;
  }
}

module.exports = { generateProductNaming };
