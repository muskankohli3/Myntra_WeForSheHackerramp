const { generateText } = require("./geminiClient");

// AI touchpoint 6: live captions/translation. The browser's Web Speech API
// (client/src/hooks/useCaptions.js) does real-time speech-to-text locally in
// the seller's browser (no server audio pipeline needed); this function takes
// that transcript chunk and translates it, which is then broadcast over the
// same Socket.io room as a caption. Built last per the roadmap, on top of the
// same generateText call pattern used by touchpoints 1-3.
async function translateCaption(transcriptChunk, targetLanguage) {
  if (!transcriptChunk || !transcriptChunk.trim()) return "";

  const prompt = `Translate the following live-stream spoken caption into ${targetLanguage}.
Return ONLY the translated text, nothing else — no quotes, no explanation, no original text repeated.

Caption: "${transcriptChunk}"`;

  const fallback = transcriptChunk; // if AI unavailable, show the original transcript untranslated
  return generateText(prompt, fallback);
}

module.exports = { translateCaption };
