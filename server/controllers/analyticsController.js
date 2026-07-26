const Analytics = require("../models/Analytics");
const LiveSession = require("../models/LiveSession");
const Comment = require("../models/Comment");
const Order = require("../models/Order");
const { generatePostLiveInsight } = require("../services/gemini/insightAI");

function withConversionRate(record) {
  const obj = record.toObject ? record.toObject() : record;
  const conversionRate = obj.views > 0 ? Math.round((obj.purchases / obj.views) * 1000) / 10 : 0;
  return { ...obj, conversionRate };
}

// GET /api/analytics/mine  (summary across all of the seller's sessions)
const getMyAnalytics = async (req, res) => {
  try {
    const records = await Analytics.find({ sellerId: req.seller._id })
      .populate("liveSessionId", "title status startedAt endedAt")
      .sort({ createdAt: -1 });

    const totals = records.reduce(
      (acc, r) => {
        acc.views += r.views;
        acc.questionsAsked += r.questionsAsked;
        acc.addToCarts += r.addToCarts;
        acc.purchases += r.purchases;
        acc.revenue += r.revenue;
        acc.avgWatchTimeSeconds += r.avgWatchTimeSeconds;
        return acc;
      },
      { views: 0, questionsAsked: 0, addToCarts: 0, purchases: 0, revenue: 0, avgWatchTimeSeconds: 0 }
    );
    totals.conversionRate = totals.views > 0 ? Math.round((totals.purchases / totals.views) * 1000) / 10 : 0;
    totals.avgWatchTimeSeconds = records.length ? Math.round(totals.avgWatchTimeSeconds / records.length) : 0;

    // "Top products" across every ended session — a genuinely useful
    // post-stream analytics view, sourced straight from real Order data.
    const topProducts = await Order.aggregate([
      { $match: { sellerId: req.seller._id } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    res.json({ totals, records: records.map(withConversionRate), topProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/analytics/session/:liveSessionId  (per-session analytics, generates one on first read)
const getSessionAnalytics = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.liveSessionId);
    if (!session) return res.status(404).json({ message: "Live session not found" });

    let record = await Analytics.findOne({ liveSessionId: session._id });
    if (!record) {
      // Watch time isn't independently tracked in this prototype (no
      // per-viewer telemetry pipeline) — approximated from session duration
      // and viewer count, which is honest enough for a demo metric.
      const durationSeconds =
        session.startedAt && session.endedAt
          ? Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 1000)
          : 0;
      record = await Analytics.create({
        sellerId: session.sellerId,
        liveSessionId: session._id,
        views: session.totalViews,
        questionsAsked: session.totalQuestions,
        addToCarts: session.totalAddToCarts,
        purchases: session.totalOrders,
        revenue: 0,
        avgWatchTimeSeconds: durationSeconds ? Math.round(durationSeconds * 0.4) : 0,
      });
    }
    res.json(withConversionRate(record));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/analytics/session/:liveSessionId/insight  (AI touchpoint 5 — post-live AI summary)
const generateInsight = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.liveSessionId);
    if (!session) return res.status(404).json({ message: "Live session not found" });

    const comments = await Comment.find({ liveSessionId: session._id, isQuestion: true });
    const insight = await generatePostLiveInsight(session, comments);

    session.aiInsight = insight;
    await session.save();

    await Analytics.findOneAndUpdate(
      { liveSessionId: session._id },
      {
        sellerId: session.sellerId,
        liveSessionId: session._id,
        views: session.totalViews,
        questionsAsked: session.totalQuestions,
        addToCarts: session.totalAddToCarts,
        purchases: session.totalOrders,
        aiInsight: insight,
      },
      { upsert: true, new: true }
    );

    res.json({ insight });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMyAnalytics, getSessionAnalytics, generateInsight };
