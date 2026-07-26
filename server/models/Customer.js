const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    avatarUrl: {
      type: String,
      default: "https://api.dicebear.com/7.x/initials/svg?seed=Customer",
    },
    wishlistCategories: { type: [String], default: [] },

    // ---- Bharat opportunity fields ----
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zone: { type: String, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    cityTier: { type: String, enum: ["T1", "T2", "T3", ""], default: "" },
    preferredLanguage: { type: String, default: "English" },

    followedSellers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seller" }],

    // Lightweight signal for "near you" + "for you" recommendations — capped
    // at 40 entries in the controller (most-recent-first), not a full
    // clickstream. Good enough to bias category scoring without a real
    // analytics pipeline.
    browsingHistory: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        category: { type: String },
        viewedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
