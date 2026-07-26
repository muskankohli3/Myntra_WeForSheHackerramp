const mongoose = require("mongoose");

const businessHealthSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    ordersThisWeek: { type: Number, default: 0 },
    revenueThisWeek: { type: Number, default: 0 },
    returnRate: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 4.2 },
    fillRate: { type: Number, default: 90 },
    tier: { type: String, default: "Rising Seller" },
    tierProgress: { type: Number, default: 55 }, // 0-100 towards next tier
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusinessHealth", businessHealthSchema);
