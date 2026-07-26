const mongoose = require("mongoose");

const liveSessionSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled",
    },
    // A "live" session can be paused (seller stepped away) without ending it —
    // viewers stay connected, the video freezes, and it resumes in place.
    isPaused: { type: Boolean, default: false },
    scheduledFor: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    pinnedProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    viewerCount: { type: Number, default: 0 },
    peakViewerCount: { type: Number, default: 0 },
    // Simple derived/aggregate stats, updated as the session progresses (used by Analytics + AI touchpoint 5).
    totalViews: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    totalAddToCarts: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    aiInsight: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveSession", liveSessionSchema);
