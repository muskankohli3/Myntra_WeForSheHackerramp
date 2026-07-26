const Seller = require("../models/Seller");

// GET /api/sellers/:id  (public profile — used on customer-facing screens)
const getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id).select("-password");
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/sellers  (?search=&city=&zone=&category=)
// Public directory — powers the search overlay's "Sellers" tab and the
// "near you" browsing on the customer side.
const getSellers = async (req, res) => {
  try {
    const { search, city, zone, category } = req.query;
    const filter = {};
    if (search) filter.brandName = { $regex: search, $options: "i" };
    if (city) filter.city = city;
    if (zone) filter.zone = zone;
    if (category && category !== "All") filter.category = category;

    const sellers = await Seller.find(filter).select("-password").sort({ growthScore: -1 }).limit(60);
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSellerById, getSellers };
