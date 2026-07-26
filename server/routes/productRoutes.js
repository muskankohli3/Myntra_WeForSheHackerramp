const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { protectOptional } = protect;
const {
  getProducts,
  getProductById,
  getProductsBySeller,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  registerImpression,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/mine", protect("seller"), getMyProducts);
router.get("/seller/:sellerId", getProductsBySeller);
router.get("/:id", getProductById);
router.post("/", protect("seller"), createProduct);
router.patch("/:id/impression", protectOptional, registerImpression);
router.patch("/:id", protect("seller"), updateProduct);
router.delete("/:id", protect("seller"), deleteProduct);

module.exports = router;
