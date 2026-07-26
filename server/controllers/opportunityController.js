const Opportunity = require("../models/Opportunity");
const { explainOpportunity } = require("../services/gemini/opportunityAI");
const { generateDemandNarrative } = require("../services/gemini/demandAI");
const { reviveProductCopy } = require("../services/gemini/reviveAI");
const { localizeForSeller } = require("../services/gemini/localizationAI");

// GET /api/opportunities/mine  (seller only — top 3 by impact score, per locked feature list)
const getMyOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ sellerId: req.seller._id, status: "active" })
      .populate("productId")
      .sort({ impactScore: -1 })
      .limit(3);

    const withBadge = opportunities.map((o, i) => ({
      ...o.toObject(),
      isTopPick: i === 0,
    }));

    res.json(withBadge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/opportunities/:id
const getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id).populate("productId");
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/opportunities/:id/why  (AI touchpoint 1 — plain-language "Why?" explanation)
// Improvement: translated into the seller's preferred language, since a plain
// English explanation isn't much use to a seller more comfortable elsewhere.
const whyExplanation = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id).populate("productId");
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });

    const explanation = await explainOpportunity(opportunity);
    const localized = await localizeForSeller(explanation, req.seller.preferredLanguage);
    res.json({ explanation: localized });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/opportunities/:id/demand-narrative  (AI touchpoint 2 — "Go Live Now" regional demand signal)
const demandNarrative = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id).populate("productId");
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
    if (opportunity.type !== "go_live_now") {
      return res.status(400).json({ message: "Demand narrative only applies to Go Live Now opportunities" });
    }

    const narrative = await generateDemandNarrative(opportunity);
    const localized = await localizeForSeller(narrative, req.seller.preferredLanguage);
    res.json({ narrative: localized });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/opportunities/:id/revive-rewrite  (AI touchpoint 3 — Revive Sleeping Products rewrite)
// Not localized — unlike the seller-facing explanations above, this rewrite
// IS the customer-facing listing copy, so it stays in the storefront's
// language rather than the seller's preferred internal language.
const reviveRewrite = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id).populate("productId");
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
    if (opportunity.type !== "revive_sleeping_product") {
      return res.status(400).json({ message: "Revive rewrite only applies to Revive Sleeping Products opportunities" });
    }
    if (!opportunity.productId) return res.status(400).json({ message: "This opportunity has no linked product" });

    const rewrite = await reviveProductCopy(opportunity.productId);
    res.json({ rewrite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/opportunities/:id/dismiss
const dismissOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.seller._id },
      { status: "dismissed" },
      { new: true }
    );
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyOpportunities,
  getOpportunityById,
  whyExplanation,
  demandNarrative,
  reviveRewrite,
  dismissOpportunity,
};
