const { generateText } = require("./geminiClient");

// AI touchpoint 4: pre-live talking-point PROMPTS (not a script) generated from
// a product's attributes, for the seller's Prep/Coach screen before going live.
async function generateTalkingPoints(products) {
  const productList = products
    .map((p) => `- ${p.name} (${p.category}), ₹${p.price}, sizes: ${(p.sizes || []).join("/")}, fabric/description: ${p.description || "N/A"}`)
    .join("\n");

  const prompt = `You are an AI coach preparing a seller for a live-selling stream on a Myntra-style app.
Given these products they'll be showcasing, generate 5 short talking-point PROMPTS (not a
script to read verbatim) — things they should be ready to mention or demonstrate on camera:
fit/fabric callouts, styling ideas, common size questions, a comparison point, a styling tip.
Respond as a plain numbered list, one prompt per line, no markdown headers, no extra text.

Products:
${productList}`;

  const fallback = [
    "1. Show the fabric close-up and mention breathability/stretch.",
    "2. Call out true-to-size fit and suggest sizing up/down if relevant.",
    "3. Style one item two different ways on camera.",
    "4. Mention wash-care in one line so viewers don't have to ask.",
    "5. Compare this piece to your last best-seller in the same category.",
  ].join("\n");

  const raw = await generateText(prompt, fallback);
  return raw
    .split("\n")
    .map((l) => l.replace(/^\d+[).]\s*/, "").trim())
    .filter(Boolean);
}

module.exports = { generateTalkingPoints };
