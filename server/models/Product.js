const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    mrp: { type: Number },
    images: { type: [String], default: [] },
    sizes: { type: [String], default: ["S", "M", "L", "XL"] },
    stock: { type: Number, default: 50 },
    // Per-size stock, shown live in the Live Studio inventory panel and on the
    // customer-facing "Only N left" badge. Falls back to an even split of
    // `stock` across `sizes` when not explicitly set (see productController).
    sizeStock: [{ size: String, quantity: Number, _id: false }],
    category: { type: String, required: true, trim: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },

    // ---- Bharat naming: local vs. global presentation (Bharat idea #1) ----
    // `name`/`description` above stay the "primary" listing shown by default.
    // These extra fields let a shopper toggle to the other presentation —
    // e.g. a seller lists it locally as "Bandhani Odhna" but a shopper from a
    // metro sees "Tie-Dye Dupatta" with more universal fashion terms.
    localName: { type: String, default: "" },
    localDescription: { type: String, default: "" },
    globalName: { type: String, default: "" },
    globalDescription: { type: String, default: "" },

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // Growth-engine signals (seeded/derived) used by the Opportunity Feed + AI touchpoints.
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    isDeadStock: { type: Boolean, default: false },
    regionDemandTag: { type: String, default: "" },
    festivalTags: { type: [String], default: [] },
  },
  { timestamps: true }
);

productSchema.virtual("ctr").get(function () {
  if (!this.impressions) return 0;
  return Number(((this.clicks / this.impressions) * 100).toFixed(1));
});

productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
