const Seller = require("../models/Seller");
const Product = require("../models/Product");
const RegionalDemand = require("../models/RegionalDemand");
const { nearbySellers, scoreProductForCustomer } = require("../services/growthEngine/recommendationEngine");

// GET /api/recommendations/nearby (customer auth)
// Bharat idea #2: "This seller near you is selling this" + "People near you
// are buying this" — blended with the customer's own browsing/wishlist
// history, not just a city filter. Every product returned carries a `reason`
// so the UI can say exactly why it's shown (see NearbyRecommendations.jsx).
const getNearbyRecommendations = async (req, res) => {
  try {
    const customer = req.customer;

    const sellers = await Seller.find(
      {},
      "brandName avatarUrl city state zone lat lng growthScore category ratingAverage ratingCount"
    ).lean();
    const nearby = nearbySellers(sellers, customer, 8).map((entry) => ({
      seller: entry.seller,
      distanceKm: entry.distanceKm,
      sameCity: entry.sameCity,
    }));

    const demandRows = customer.city ? await RegionalDemand.find({ city: customer.city }).lean() : [];
    const demandByCategory = {};
    demandRows.forEach((row) => {
      demandByCategory[row.category] = row.demandScore;
    });

    const products = await Product.find({ stock: { $gt: 0 } })
      .populate("sellerId", "brandName avatarUrl city zone growthScore")
      .limit(400)
      .lean();

    const scored = products
      .filter((p) => p.sellerId)
      .map((product) => {
        const { score, reason } = scoreProductForCustomer(product, customer, demandByCategory);
        return { product, score, reason };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(({ product, reason }) => ({ product, reason }));

    res.json({
      city: customer.city,
      zone: customer.zone,
      nearbySellers: nearby,
      trendingNearYou: scored,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNearbyRecommendations };
