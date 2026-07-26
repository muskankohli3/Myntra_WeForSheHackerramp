const express = require("express");
const router = express.Router();
const { getPollsForSession } = require("../controllers/pollController");

router.get("/live-session/:liveSessionId", getPollsForSession);

module.exports = router;
