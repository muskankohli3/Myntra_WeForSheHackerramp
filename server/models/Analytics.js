const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    liveSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveSession", default: null },
    views: { type: Number, default: 0 },
    questionsAsked: { type: Number, default: 0 },
    addToCarts: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    avgWatchTimeSeconds: { type: Number, default: 0 },
    aiInsight: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analytics", analyticsSchema);
