const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  sellerSignup,
  sellerLogin,
  sellerMe,
  customerSignup,
  customerLogin,
  customerMe,
} = require("../controllers/authController");

router.post("/seller/signup", sellerSignup);
router.post("/seller/login", sellerLogin);
router.get("/seller/me", protect("seller"), sellerMe);

router.post("/customer/signup", customerSignup);
router.post("/customer/login", customerLogin);
router.get("/customer/me", protect("customer"), customerMe);

module.exports = router;
