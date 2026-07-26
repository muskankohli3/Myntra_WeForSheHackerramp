const { generateText } = require("./geminiClient");

// Improvement to the existing AI touchpoints (1, 2, 3, 5): the Opportunity
// Feed / post-live insight text was always English-only, which defeats the
// point for a seller who is more comfortable in Hindi/Tamil/Bengali/etc. This
// is a thin, reusable translation pass applied AFTER the English text is
// generated (keeps every existing prompt/fallback untouched — this just
// wraps the result) rather than rewriting every prompt to be multilingual.
async function localizeForSeller(text, language) {
  if (!text || !language || language === "English") return text;

  const prompt = `Translate the following short business-app text into ${language}. Keep numbers, product
names, brand names, and ₹ amounts unchanged. Return ONLY the translated text — no quotes, no
explanation, no English original repeated.

Text: "${text}"`;

  // Fallback is the original English text — never block the UI on translation.
  return generateText(prompt, text);
}

module.exports = { localizeForSeller };
