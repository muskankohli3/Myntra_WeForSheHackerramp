const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { followSeller, unfollowSeller, getFollowedSellers } = require("../controllers/customerController");

router.get("/followed-sellers", protect("customer"), getFollowedSellers);
router.post("/follow/:sellerId", protect("customer"), followSeller);
router.post("/unfollow/:sellerId", protect("customer"), unfollowSeller);

module.exports = router;
