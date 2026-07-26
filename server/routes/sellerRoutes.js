const express = require("express");
const router = express.Router();
const { getSellerById, getSellers } = require("../controllers/sellerController");

router.get("/", getSellers);
router.get("/:id", getSellerById);

module.exports = router;
