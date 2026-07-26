const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  getAIStatus,
  prepCoach,
  translateCaptionEndpoint,
  productNaming,
  liveAssistantTip,
  chatSummary,
} = require("../controllers/aiController");

router.get("/status", getAIStatus);
router.post("/prep-coach", protect("seller"), prepCoach);
router.post("/translate-caption", translateCaptionEndpoint);
router.post("/product-naming", protect("seller"), productNaming);
router.post("/live-assistant-tip", protect("seller"), liveAssistantTip);
router.post("/chat-summary", protect("seller"), chatSummary);

module.exports = router;
