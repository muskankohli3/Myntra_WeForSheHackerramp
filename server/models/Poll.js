const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema(
  {
    liveSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveSession", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    question: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        votes: { type: Number, default: 0 },
        _id: false,
      },
    ],
    status: { type: String, enum: ["active", "closed"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poll", pollSchema);
