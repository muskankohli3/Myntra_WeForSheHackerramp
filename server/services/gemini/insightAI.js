const { generateText } = require("./geminiClient");

// AI touchpoint 5: one generated insight line for the Analytics screen after a
// live session ends, based on aggregated Q&A/comment data from that session.
async function generatePostLiveInsight(session, questionComments) {
  const questions = questionComments.map((c) => c.message).slice(0, 30);

  const prompt = `You are an AI analyst summarizing a completed live-selling session on a Myntra-style app.
Write ONE short, actionable insight sentence (max 25 words) a seller can act on next time,
in the style of: "Viewers asked about sizing 12 times — add a size guide to the pinned product."
No markdown, no quotes, just the sentence.

Session title: ${session.title}
Total viewers (peak): ${session.peakViewerCount}
Total questions asked: ${session.totalQuestions}
Add-to-carts: ${session.totalAddToCarts}
Orders placed: ${session.totalOrders}
Sample of questions asked during the stream: ${questions.length ? questions.join(" | ") : "(none recorded)"}`;

  const fallback = session.totalQuestions
    ? `Viewers asked ${session.totalQuestions} questions during this session — review the pinned product's size chart and description for gaps.`
    : `This session had ${session.peakViewerCount} peak viewers and ${session.totalOrders} orders — try pinning your top seller earlier next time to drive more add-to-carts.`;

  return generateText(prompt, fallback);
}

module.exports = { generatePostLiveInsight };
