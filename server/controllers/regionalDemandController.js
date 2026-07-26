const RegionalDemand = require("../models/RegionalDemand");
const { generateRegionalNarrative } = require("../services/gemini/demandAI");
const { localizeForSeller } = require("../services/gemini/localizationAI");

// GET /api/regional-demand?category=&zone=
// Public-ish data (protected by seller auth in the route since it's a seller
// growth tool) used to render the full board. Kept as one flat list — the
// frontend does the bucketing into a bubble board by zone/city.
const getRegionalDemand = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.zone) filter.zone = req.query.zone;

    const rows = await RegionalDemand.find(filter).sort({ demandScore: -1 }).lean();
    const categories = await RegionalDemand.distinct("category");
    res.json({ rows, categories: categories.sort() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/regional-demand/mine — signals scoped to the logged-in seller's
// own city/zone/category so the dashboard can lead with "demand near you"
// before the seller ever opens the full board.
const getMyRegionalDemand = async (req, res) => {
  try {
    const seller = req.seller;
    const [inMyCity, inMyZone, topOverall] = await Promise.all([
      seller.city ? RegionalDemand.find({ city: seller.city, category: seller.category }).lean() : [],
      seller.zone
        ? RegionalDemand.find({ zone: seller.zone, category: seller.category }).sort({ demandScore: -1 }).limit(6).lean()
        : [],
      RegionalDemand.find({ category: seller.category }).sort({ demandScore: -1 }).limit(5).lean(),
    ]);
    res.json({ inMyCity, inMyZone, topOverall });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/regional-demand/:id/narrative — one-off AI sentence for a single
// row, generated (and cached onto the row) only when a seller drills in,
// not for all ~300 rows up front.
const getNarrativeForSignal = async (req, res) => {
  try {
    const row = await RegionalDemand.findById(req.params.id);
    if (!row) return res.status(404).json({ message: "Signal not found" });

    let narrative = row.signalNote;
    if (!narrative) {
      narrative = await generateRegionalNarrative(row);
      row.signalNote = narrative;
      await row.save();
    }

    const localized = await localizeForSeller(narrative, req.seller.preferredLanguage);
    res.json({ narrative: localized });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRegionalDemand, getMyRegionalDemand, getNarrativeForSignal };
