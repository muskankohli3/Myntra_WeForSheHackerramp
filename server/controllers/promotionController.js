const Promotion = require("../models/Promotion");

// GET /api/promotions/live-session/:liveSessionId
// Backfills active/recent coupons & flash deals for a viewer who joins
// mid-stream — the live path is the socket "promotion-start"/"promotion-end"
// pair in server/socket/socketHandler.js.
const getPromotionsForSession = async (req, res) => {
  try {
    const promotions = await Promotion.find({ liveSessionId: req.params.liveSessionId }).sort({ createdAt: 1 });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPromotionsForSession };
