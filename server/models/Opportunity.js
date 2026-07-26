const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    type: {
      type: String,
      enum: [
        "go_live_now",
        "revive_sleeping_product",
        "customer_doubt_detected",
        "regional_demand_alert", // "High demand in Delhi" — sourced from RegionalDemand
        "restock_alert", // "Customers asking about XL. Restock soon."
      ],
      required: true,
    },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    region: { type: String, default: "" },
    estimatedViewers: { type: Number, default: 0 },
    confidence: { type: Number, default: 70 }, // 0-100
    impactScore: { type: Number, default: 50 }, // 0-100, drives sort order + Top Pick badge
    reasoningSeed: { type: String, default: "" }, // structured seed data fed to Gemini for the "Why?" explanation
    status: { type: String, enum: ["active", "dismissed", "actioned"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);
