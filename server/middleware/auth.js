const jwt = require("jsonwebtoken");
const Seller = require("../models/Seller");
const Customer = require("../models/Customer");

/**
 * Verifies the Bearer token and attaches req.user = { id, role } plus
 * req.seller / req.customer (the full document, minus password) when relevant.
 * Use `protect()` for "must be logged in as anyone", or `protect("seller")` /
 * `protect("customer")` to also enforce the role.
 */
function protect(requiredRole) {
  return async function (req, res, next) {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;

      if (!token) {
        return res.status(401).json({ message: "Not authorized, no token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ message: `This action requires a ${requiredRole} account` });
      }

      req.user = { id: decoded.id, role: decoded.role };

      if (decoded.role === "seller") {
        const seller = await Seller.findById(decoded.id);
        if (!seller) return res.status(401).json({ message: "Seller account no longer exists" });
        req.seller = seller;
      } else if (decoded.role === "customer") {
        const customer = await Customer.findById(decoded.id);
        if (!customer) return res.status(401).json({ message: "Customer account no longer exists" });
        req.customer = customer;
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized, invalid or expired token" });
    }
  };
}

// Same idea as `protect()`, but never rejects the request — used by endpoints
// like "register product impression" that should log browsing history when we
// know who's looking (for the nearby/for-you recommendations engine) but must
// keep working for logged-out/anonymous browsing too.
function protectOptional(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return next();
    try {
      if (decoded.role === "seller") {
        req.seller = await Seller.findById(decoded.id);
      } else if (decoded.role === "customer") {
        req.customer = await Customer.findById(decoded.id);
      }
    } catch {
      // ignore — proceed unauthenticated
    }
    next();
  });
}

module.exports = protect;
module.exports.protectOptional = protectOptional;
