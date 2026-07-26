const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  submitReview,
  getReviewsForProduct,
  getReviewsForSeller,
  getMyReviews,
} = require("../controllers/reviewController");

router.post("/", protect("customer"), submitReview);
router.get("/mine", protect("customer"), getMyReviews);
router.get("/product/:productId", getReviewsForProduct);
router.get("/seller/:sellerId", getReviewsForSeller);

module.exports = router;
