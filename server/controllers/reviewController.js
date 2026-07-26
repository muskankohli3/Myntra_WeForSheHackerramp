const Review = require("../models/Review");
const Product = require("../models/Product");
const Seller = require("../models/Seller");
const Order = require("../models/Order");

async function recomputeProductRating(productId) {
  const reviews = await Review.find({ productId });
  const ratingCount = reviews.length;
  const ratingAverage = ratingCount ? reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount : 0;
  await Product.findByIdAndUpdate(productId, { ratingAverage: Math.round(ratingAverage * 10) / 10, ratingCount });
}

async function recomputeSellerRating(sellerId) {
  const reviews = await Review.find({ sellerId });
  const ratingCount = reviews.length;
  const ratingAverage = ratingCount ? reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount : 0;
  await Seller.findByIdAndUpdate(sellerId, { ratingAverage: Math.round(ratingAverage * 10) / 10, ratingCount });
}

// POST /api/reviews (customer auth)
// Only lets a customer review a product they actually received, tying trust
// signals to a real delivery rather than letting anyone rate anything —
// directly addresses the "earning trust at scale" theme.
const submitReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    if (!productId || !orderId || !rating) {
      return res.status(400).json({ message: "productId, orderId and rating are required" });
    }

    const order = await Order.findOne({ _id: orderId, customerId: req.customer._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "delivered") {
      return res.status(400).json({ message: "You can review a product once your order is delivered" });
    }
    const item = order.items.find((i) => i.productId.toString() === productId);
    if (!item) return res.status(400).json({ message: "This product isn't part of that order" });

    const review = await Review.findOneAndUpdate(
      { productId, customerId: req.customer._id },
      {
        productId,
        sellerId: order.sellerId,
        customerId: req.customer._id,
        orderId,
        rating,
        comment: comment || "",
        customerName: req.customer.name,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Promise.all([recomputeProductRating(productId), recomputeSellerRating(order.sellerId)]);

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/product/:productId
const getReviewsForProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/seller/:sellerId
const getReviewsForSeller = async (req, res) => {
  try {
    const reviews = await Review.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/mine (customer auth) — used by the Orders page to know
// which delivered items still need a review vs. which are already rated.
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customerId: req.customer._id });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitReview, getReviewsForProduct, getReviewsForSeller, getMyReviews };
