const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { getMyBusinessHealth } = require("../controllers/businessHealthController");

router.get("/mine", protect("seller"), getMyBusinessHealth);

module.exports = router;
