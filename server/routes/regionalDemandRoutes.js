const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  getRegionalDemand,
  getMyRegionalDemand,
  getNarrativeForSignal,
} = require("../controllers/regionalDemandController");

router.get("/", protect("seller"), getRegionalDemand);
router.get("/mine", protect("seller"), getMyRegionalDemand);
router.get("/:id/narrative", protect("seller"), getNarrativeForSignal);

module.exports = router;
