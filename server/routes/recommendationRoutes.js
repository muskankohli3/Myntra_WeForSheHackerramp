const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { getNearbyRecommendations } = require("../controllers/recommendationController");

router.get("/nearby", protect("customer"), getNearbyRecommendations);

module.exports = router;
