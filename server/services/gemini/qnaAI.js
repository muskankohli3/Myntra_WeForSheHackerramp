const { generateText } = require("./geminiClient");

// Simple word-overlap similarity — enough to detect "repeated/similar questions"
// in a live comment stream without a full NLP pipeline, per the roadmap's own
// scope guard for this touchpoint.
function similarity(a, b) {
  const wordsA = new Set(a.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  if (!wordsA.size || !wordsB.size) return 0;
  let overlap = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) overlap++;
  });
  return overlap / Math.min(wordsA.size, wordsB.size);
}

/**
 * Given the recent question-comments from a live session, find a cluster of
 * near-duplicate questions (similarity >= threshold) and generate one
 * suggested reply for the seller. Returns null if no repeated pattern found.
 */
function findRepeatedQuestionCluster(recentQuestions, threshold = 0.5) {
  for (let i = 0; i < recentQuestions.length; i++) {
    const cluster = [recentQuestions[i]];
    for (let j = i + 1; j < recentQuestions.length; j++) {
      if (similarity(recentQuestions[i].message, recentQuestions[j].message) >= threshold) {
        cluster.push(recentQuestions[j]);
      }
    }
    if (cluster.length >= 2) return cluster;
  }
  return null;
}

// AI touchpoint 7: detects repeated/similar questions and suggests a seller reply.
async function suggestReply(cluster, product) {
  const questions = cluster.map((c) => c.message).join(" | ");

  const prompt = `You are an AI assistant helping a seller answer live-stream shopping questions in real time.
Multiple viewers just asked essentially the same question. Write ONE short, friendly reply
(max 30 words) the seller can send right now to answer it for everyone.
No markdown, no quotes, just the reply text.

Repeated questions: ${questions}
${product ? `Currently pinned product: ${product.name}, price ₹${product.price}, sizes: ${(product.sizes || []).join("/")}, description: ${product.description || "N/A"}` : ""}`;

  const fallback = `Great question, a few of you asked this — ${product ? `for ${product.name}, ` : ""}check the pinned product details, and I'll cover it on camera now too!`;

  return generateText(prompt, fallback);
}

module.exports = { findRepeatedQuestionCluster, suggestReply, similarity };
