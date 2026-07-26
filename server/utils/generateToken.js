const jwt = require("jsonwebtoken");

/**
 * Signs a JWT for either a seller or a customer.
 * @param {string} id - Mongo _id of the user
 * @param {"seller"|"customer"} role
 */
function generateToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

module.exports = generateToken;
