const { generateText } = require("./geminiClient");

// AI touchpoint 9: on-demand live chat summarization for the seller (their
// explicit "personal preference" ask) — condenses the last chunk of chat
// into a few bullet-style lines so a seller mid-stream can glance at it
// instead of scrolling. Called on demand (button press), not on a timer, to
// keep it cheap and avoid interrupting the seller's flow.
async function summarizeChat(comments) {
  if (!comments.length) {
    return "No chat activity yet to summarize.";
  }

  const transcript = comments
    .slice(-60)
    .map((c) => `${c.authorRole === "seller" ? "Seller" : c.author}: ${c.message}`)
    .join("\n");

  const prompt = `You are summarizing the last few minutes of live-stream shopping chat for the seller who is
mid-broadcast and can't read every message. Write 3-5 short bullet points (no markdown bullets, just
one short sentence per line) covering: the overall mood, the most-repeated question or concern, any
strong buying signals, and anything that needs the seller's attention. Be concrete and brief.

Chat transcript:
${transcript}`;

  const questionCount = comments.filter((c) => c.isQuestion).length;
  const fallback = [
    `${comments.length} messages so far, including ${questionCount} questions.`,
    "Skim the pinned Q&A tab for anything still unanswered.",
  ].join("\n");

  return generateText(prompt, fallback);
}

module.exports = { summarizeChat };
