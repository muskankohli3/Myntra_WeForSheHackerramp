const bcrypt = require("bcryptjs");
const Seller = require("../models/Seller");
const Customer = require("../models/Customer");
const BusinessHealth = require("../models/BusinessHealth");
const generateToken = require("../utils/generateToken");
const { findCity } = require("../data/geoIndia");

// Resolves a free-typed/selected city name into { city, state, zone, lat, lng,
// tier } so every signup automatically gets real coordinates without asking
// the person for them — used by both seller and customer signup below.
function resolveCityFields(cityName) {
  const match = findCity(cityName);
  if (!match) return { city: cityName || "", state: "", zone: "", lat: null, lng: null, cityTier: "" };
  return { city: match.city, state: match.state, zone: match.zone, lat: match.lat, lng: match.lng, cityTier: match.tier };
}

function publicSeller(seller) {
  return {
    _id: seller._id,
    name: seller.name,
    brandName: seller.brandName,
    email: seller.email,
    phone: seller.phone,
    category: seller.category,
    avatarUrl: seller.avatarUrl,
    growthScore: seller.growthScore,
    tier: seller.tier,
    city: seller.city,
    state: seller.state,
    zone: seller.zone,
    cityTier: seller.cityTier,
    preferredLanguage: seller.preferredLanguage,
    ratingAverage: seller.ratingAverage,
    ratingCount: seller.ratingCount,
  };
}

function publicCustomer(customer) {
  return {
    _id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    avatarUrl: customer.avatarUrl,
    city: customer.city,
    state: customer.state,
    zone: customer.zone,
    cityTier: customer.cityTier,
    preferredLanguage: customer.preferredLanguage,
    followedSellers: customer.followedSellers || [],
  };
}

// POST /api/auth/seller/signup
const sellerSignup = async (req, res) => {
  try {
    const { name, brandName, email, password, phone, category, city, preferredLanguage } = req.body;
    if (!name || !brandName || !email || !password) {
      return res.status(400).json({ message: "name, brandName, email and password are required" });
    }

    const existing = await Seller.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const geo = resolveCityFields(city);
    const seller = await Seller.create({
      name,
      brandName,
      email: email.toLowerCase(),
      password: hashed,
      phone,
      category: category || "Fashion",
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(brandName)}`,
      preferredLanguage: preferredLanguage || "English",
      ...geo,
    });

    await BusinessHealth.create({ sellerId: seller._id });

    const token = generateToken(seller._id, "seller");
    res.status(201).json({ token, seller: publicSeller(seller) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/seller/login
const sellerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = await Seller.findOne({ email: (email || "").toLowerCase() }).select("+password");
    if (!seller) return res.status(401).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password || "", seller.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(seller._id, "seller");
    res.json({ token, seller: publicSeller(seller) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/seller/me
const sellerMe = async (req, res) => {
  res.json({ seller: publicSeller(req.seller) });
};

// POST /api/auth/customer/signup
const customerSignup = async (req, res) => {
  try {
    const { name, email, password, phone, city, preferredLanguage } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const geo = resolveCityFields(city);
    const customer = await Customer.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      phone,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      preferredLanguage: preferredLanguage || "English",
      ...geo,
    });

    const token = generateToken(customer._id, "customer");
    res.status(201).json({ token, customer: publicCustomer(customer) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/customer/login
const customerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ email: (email || "").toLowerCase() }).select("+password");
    if (!customer) return res.status(401).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password || "", customer.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(customer._id, "customer");
    res.json({ token, customer: publicCustomer(customer) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/customer/me
const customerMe = async (req, res) => {
  res.json({ customer: publicCustomer(req.customer) });
};

module.exports = {
  sellerSignup,
  sellerLogin,
  sellerMe,
  customerSignup,
  customerLogin,
  customerMe,
};
