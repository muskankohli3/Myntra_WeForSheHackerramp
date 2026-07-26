const Customer = require("../models/Customer");
const Seller = require("../models/Seller");

// POST /api/customers/follow/:sellerId
const followSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    await Customer.updateOne({ _id: req.customer._id }, { $addToSet: { followedSellers: sellerId } });
    const customer = await Customer.findById(req.customer._id);
    res.json({ followedSellers: customer.followedSellers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/customers/unfollow/:sellerId
const unfollowSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    await Customer.updateOne({ _id: req.customer._id }, { $pull: { followedSellers: sellerId } });
    const customer = await Customer.findById(req.customer._id);
    res.json({ followedSellers: customer.followedSellers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/customers/followed-sellers
const getFollowedSellers = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id).populate(
      "followedSellers",
      "brandName avatarUrl city zone growthScore ratingAverage ratingCount"
    );
    res.json({ sellers: customer.followedSellers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { followSeller, unfollowSeller, getFollowedSellers };
