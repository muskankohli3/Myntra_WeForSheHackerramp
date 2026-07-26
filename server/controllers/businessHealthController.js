const BusinessHealth = require("../models/BusinessHealth");

// GET /api/business-health/mine
const getMyBusinessHealth = async (req, res) => {
  try {
    let health = await BusinessHealth.findOne({ sellerId: req.seller._id });
    if (!health) {
      health = await BusinessHealth.create({ sellerId: req.seller._id });
    }
    res.json(health);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMyBusinessHealth };
