const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brandName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    category: { type: String, default: "Fashion" },
    avatarUrl: {
      type: String,
      default: "https://api.dicebear.com/7.x/initials/svg?seed=Seller",
    },
    growthScore: { type: Number, default: 62 },
    tier: { type: String, default: "Rising Seller" },

    // ---- Bharat opportunity fields ----
    // city/state/zone/lat/lng are resolved from `data/geoIndia.js` at signup so
    // every other feature (nearby recommendations, regional demand board,
    // distance display) has real coordinates to work with, not just a string.
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zone: { type: String, default: "" }, // North | South | East | West | Central | Northeast
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    cityTier: { type: String, enum: ["T1", "T2", "T3", ""], default: "" },
    // Language the seller reads their AI growth-engine text in (opportunity
    // explanations, insights, live-assistant tips). Defaults to English.
    preferredLanguage: { type: String, default: "English" },

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seller", sellerSchema);
