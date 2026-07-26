const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  getLiveSessions,
  getLiveSessionById,
  getMyLiveSessions,
  createLiveSession,
  startLiveSession,
  endLiveSession,
  pauseLiveSession,
  resumeLiveSession,
  pinProduct,
  getReplay,
} = require("../controllers/liveSessionController");

router.get("/", getLiveSessions);
router.get("/mine", protect("seller"), getMyLiveSessions);
router.get("/:id", getLiveSessionById);
router.get("/:id/replay", getReplay);
router.post("/", protect("seller"), createLiveSession);
router.patch("/:id/start", protect("seller"), startLiveSession);
router.patch("/:id/end", protect("seller"), endLiveSession);
router.patch("/:id/pause", protect("seller"), pauseLiveSession);
router.patch("/:id/resume", protect("seller"), resumeLiveSession);
router.patch("/:id/pin", protect("seller"), pinProduct);

module.exports = router;
