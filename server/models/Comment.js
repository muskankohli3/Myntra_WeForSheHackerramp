const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    liveSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveSession", required: true },
    author: { type: String, required: true },
    authorRole: { type: String, enum: ["customer", "seller"], default: "customer" },
    message: { type: String, required: true },
    isQuestion: { type: Boolean, default: false },
    isAISuggested: { type: Boolean, default: false },

    // ---- Q&A panel + moderation ----
    upvotes: { type: Number, default: 0 },
    isAnswered: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ liveSessionId: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
