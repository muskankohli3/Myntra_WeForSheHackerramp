const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

router.post("/", protect("customer"), createOrder);
router.get("/mine", protect("customer"), getMyOrders);
router.get("/seller/mine", protect("seller"), getSellerOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", protect("seller"), updateOrderStatus);

module.exports = router;
