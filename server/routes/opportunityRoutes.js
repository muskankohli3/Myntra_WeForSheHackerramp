const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  getMyOpportunities,
  getOpportunityById,
  whyExplanation,
  demandNarrative,
  reviveRewrite,
  dismissOpportunity,
} = require("../controllers/opportunityController");

router.get("/mine", protect("seller"), getMyOpportunities);
router.get("/:id", protect("seller"), getOpportunityById);
router.post("/:id/why", protect("seller"), whyExplanation);
router.post("/:id/demand-narrative", protect("seller"), demandNarrative);
router.post("/:id/revive-rewrite", protect("seller"), reviveRewrite);
router.patch("/:id/dismiss", protect("seller"), dismissOpportunity);

module.exports = router;
