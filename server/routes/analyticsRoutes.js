const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { getMyAnalytics, getSessionAnalytics, generateInsight } = require("../controllers/analyticsController");

router.get("/mine", protect("seller"), getMyAnalytics);
router.get("/session/:liveSessionId", protect("seller"), getSessionAnalytics);
router.post("/session/:liveSessionId/insight", protect("seller"), generateInsight);

module.exports = router;
