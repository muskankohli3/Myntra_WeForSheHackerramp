const Product = require("../models/Product");
const Comment = require("../models/Comment");
const { generateTalkingPoints } = require("../services/gemini/prepAI");
const { translateCaption } = require("../services/gemini/captionAI");
const { isConfigured } = require("../services/gemini/geminiClient");
const { generateProductNaming } = require("../services/gemini/productNamingAI");
const { summarizeChat } = require("../services/gemini/chatSummaryAI");
const { computeLiveAssistantTip } = require("../services/growthEngine/liveAssistant");

// GET /api/ai/status  — lets the frontend show a small "AI live / AI fallback mode" badge
const getAIStatus = async (req, res) => {
  res.json({ configured: isConfigured() });
};

// POST /api/ai/prep-coach  (AI touchpoint 4 — talking points for the Prep/Coach screen)
// body: { productIds: [ids] }
const prepCoach = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !productIds.length) {
      return res.status(400).json({ message: "productIds array is required" });
    }
    const products = await Product.find({ _id: { $in: productIds } });
    if (!products.length) return res.status(404).json({ message: "No matching products found" });

    const talkingPoints = await generateTalkingPoints(products);
    res.json({ talkingPoints, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/translate-caption  (AI touchpoint 6 — REST fallback; live path is the socket "caption" event)
// body: { text, targetLanguage }
const translateCaptionEndpoint = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text) return res.status(400).json({ message: "text is required" });
    const translated = await translateCaption(text, targetLanguage || "English");
    res.json({ translated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/product-naming  (AI touchpoint 8 — Bharat idea #1: local vs. global naming from a photo)
// body: { localName, description, category, imageBase64, mimeType }
const productNaming = async (req, res) => {
  try {
    const { localName, description, category, imageBase64, mimeType } = req.body;
    if (!localName) return res.status(400).json({ message: "localName is required" });

    const naming = await generateProductNaming({ localName, description, category, imageBase64, mimeType });
    res.json(naming);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/live-assistant-tip  (on-demand fallback for the "Get a tip" button —
// the primary path is the automatic socket tick in socketHandler.js, which has
// per-room cooldown memory this stateless REST call doesn't.)
// body: { viewerCount, peakViewerCount, secondsSinceLastComment, cartAddsLast2Min, pinnedStockRemaining }
const liveAssistantTip = async (req, res) => {
  try {
    const tip = computeLiveAssistantTip(req.body || {}, new Map());
    res.json({ tip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/chat-summary  (AI touchpoint 9 — on-demand seller chat summarization)
// body: { liveSessionId }
const chatSummary = async (req, res) => {
  try {
    const { liveSessionId } = req.body;
    if (!liveSessionId) return res.status(400).json({ message: "liveSessionId is required" });

    const comments = await Comment.find({ liveSessionId, deleted: false }).sort({ createdAt: 1 });
    const summary = await summarizeChat(comments);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAIStatus,
  prepCoach,
  translateCaptionEndpoint,
  productNaming,
  liveAssistantTip,
  chatSummary,
};
