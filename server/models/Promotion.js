const mongoose = require("mongoose");

// Covers all three "Promotions" idea-starters from the spec (coupon, flash
// sale, bundle/BOGO) as one model with a `type` discriminator field rather
// than three near-identical collections — they all share the same lifecycle
// (seller starts it live, customers claim/benefit, it expires).
const promotionSchema = new mongoose.Schema(
  {
    liveSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveSession", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    type: { type: String, enum: ["coupon", "flash_sale", "bundle", "bogo"], required: true },

    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },

    title: { type: String, required: true }, // e.g. "20% off with LIVE20" / "Buy 2 Get 1 free"
    code: { type: String, default: "" }, // coupon code, if type === "coupon"
    discountPercent: { type: Number, default: 0 },
    flashPrice: { type: Number, default: null }, // discounted price, if type === "flash_sale"

    startedAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ["active", "ended"], default: "active" },

    claimedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Customer" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Promotion", promotionSchema);
