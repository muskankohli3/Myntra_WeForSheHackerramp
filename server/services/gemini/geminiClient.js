const { GoogleGenAI } = require("@google/genai");

// Single shared Gemini client setup — every AI touchpoint file in this folder
// imports `generateText` from here rather than creating its own client.
//
// If GEMINI_API_KEY is not set, `generateText` resolves to a clearly-labeled
// fallback string instead of throwing, so the rest of the app (routes, UI)
// keeps working with zero errors even before a key is configured.

const apiKey = process.env.GEMINI_API_KEY;
const client = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL = "gemini-3.1-flash-lite";

function isConfigured() {
  return Boolean(client);
}

/**
 * @param {string} prompt - full prompt text
 * @param {string} fallback - what to return if no API key is configured, or the call fails
 */
async function generateText(prompt, fallback) {
  if (!client) {
    return `${fallback} (Add GEMINI_API_KEY in server/.env to see a live AI-generated response here.)`;
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    const text = response?.text ?? response?.candidates?.[0]?.content?.parts?.[0]?.text;
    return (text || fallback).trim();
  } catch (err) {
    console.error("⚠️  Gemini call failed, using fallback text:", err.message);
    return `${fallback} (AI call failed: ${err.message})`;
  }
}

module.exports = { generateText, isConfigured, MODEL };
