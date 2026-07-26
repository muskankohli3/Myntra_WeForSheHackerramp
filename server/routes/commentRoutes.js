const express = require("express");
const router = express.Router();
const { getCommentsForSession } = require("../controllers/commentController");

router.get("/live-session/:liveSessionId", getCommentsForSession);

module.exports = router;
