const express = require("express");
const router = express.Router();
const { getPromotionsForSession } = require("../controllers/promotionController");

router.get("/live-session/:liveSessionId", getPromotionsForSession);

module.exports = router;
