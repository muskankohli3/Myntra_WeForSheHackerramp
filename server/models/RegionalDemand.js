const mongoose = require("mongoose");

// Backs the seller-facing "Regional Demand" board (Bharat idea #3): for a
// (city, category) pair, how hot is demand right now, is it rising/falling,
// and is a festival driving it. Seeded with a realistic spread across ~55
// Bharat cities x several categories (see seed/seed.js), and nudged slightly
// by real orders as they come in (see orderController) so it isn't 100% static.
const regionalDemandSchema = new mongoose.Schema(
  {
    city: { type: String, required: true },
    state: { type: String, default: "" },
    zone: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    category: { type: String, required: true },
    demandScore: { type: Number, default: 50, min: 0, max: 100 },
    trend: { type: String, enum: ["rising", "steady", "falling"], default: "steady" },
    festivalTag: { type: String, default: "" },
    signalNote: { type: String, default: "" }, // short human-readable reason, templated at seed time
  },
  { timestamps: true }
);

regionalDemandSchema.index({ city: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("RegionalDemand", regionalDemandSchema);
