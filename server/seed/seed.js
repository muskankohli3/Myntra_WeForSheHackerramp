// Populates the database with enough real demo data to exercise the entire
// app end to end immediately after a fresh clone — including every Bharat
// feature added on top of the original build: nearby recommendations, the
// Regional Demand board, local/global product naming, follows/notifications,
// reviews, and a much larger live-commerce catalog spread across T2/T3 India.
//
// The three original demo accounts (seller@demo.com, seller2@demo.com,
// customer@demo.com — password demo1234 for all) are preserved exactly as
// before, just enriched with city/language/etc, so any existing walkthrough
// still works. Everything else here is procedurally generated so the volume
// of data is "enough to make every feature feel real" without hand-authoring
// hundreds of literal records.
//
// Run with: npm run seed   (from inside server/)

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Seller = require("../models/Seller");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const LiveSession = require("../models/LiveSession");
const Opportunity = require("../models/Opportunity");
const BusinessHealth = require("../models/BusinessHealth");
const Analytics = require("../models/Analytics");
const Comment = require("../models/Comment");
const Order = require("../models/Order");
const Poll = require("../models/Poll");
const Promotion = require("../models/Promotion");
const Review = require("../models/Review");
const RegionalDemand = require("../models/RegionalDemand");
const Notification = require("../models/Notification");

const { CITIES, FESTIVALS, findCity } = require("../data/geoIndia");

const img = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/500/625`;

// ---------------------------------------------------------------------------
// Small generation helpers
// ---------------------------------------------------------------------------
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(rand(0, copy.length - 1), 1)[0]);
  return out;
};
const chance = (p) => Math.random() < p;

function evenSizeStock(sizes, total) {
  const per = Math.floor(total / sizes.length);
  const rem = total - per * sizes.length;
  return sizes.map((size, i) => ({ size, quantity: per + (i === 0 ? rem : 0) }));
}

const LANGUAGES_BY_ZONE = {
  North: ["Hindi", "Punjabi", "English"],
  South: ["Tamil", "Telugu", "Kannada", "Malayalam", "English"],
  East: ["Bengali", "Odia", "Hindi", "English"],
  West: ["Marathi", "Gujarati", "Hindi", "English"],
  Central: ["Hindi", "English"],
  Northeast: ["Assamese", "Bengali", "English"],
};
const languageForZone = (zone) => pick(LANGUAGES_BY_ZONE[zone] || ["English"]);

const CATEGORIES = ["T-Shirts", "Shirts", "Kurtas", "Bottoms", "Dresses", "Jackets", "Hoodies", "Footwear"];

const CATEGORY_TEMPLATES = {
  "T-Shirts": { price: [499, 999], names: ["Oversized Cotton Tee", "Graphic Print Tee", "Polo Tee", "Henley Tee", "Striped Crew Tee", "Solid Round Neck Tee"] },
  Shirts: { price: [899, 1499], names: ["Formal Slim Shirt", "Checked Casual Shirt", "Linen Shirt", "Denim Shirt", "Printed Resort Shirt"] },
  Kurtas: { price: [799, 1699], names: ["Cotton Kurta", "Printed Linen Kurta", "Ikkat Kurta", "Bandhani Kurta", "Chikankari Kurta", "Block Print Kurta"] },
  Bottoms: { price: [799, 1699], names: ["Slim Fit Cargo Pants", "Relaxed Joggers", "Wide Leg Palazzo", "Straight Fit Trousers", "Denim Jeans"] },
  Dresses: { price: [999, 2199], names: ["Wrap Dress", "A-Line Dress", "Maxi Dress", "Shirt Dress", "Festive Anarkali Dress"] },
  Jackets: { price: [1499, 2999], names: ["Denim Jacket", "Bomber Jacket", "Windcheater", "Quilted Jacket"] },
  Hoodies: { price: [1199, 2199], names: ["Graphic Hoodie", "Solid Fleece Hoodie", "Zip-Up Hoodie"] },
  Footwear: { price: [1299, 2999], names: ["Canvas Sneakers", "Running Shoes", "Classic White Sneakers", "Loafers", "Sports Sandals"] },
};

const COLOR_VARIANTS = ["Black", "Navy Blue", "Olive", "Maroon", "Mustard", "Indigo", "White", "Rust"];

// Bharat idea #1 demo data — a Kurta seller often knows a piece only by its
// local craft name. These pairs get attached to a slice of generated Kurta
// products so the local/global toggle has real variety across the catalog,
// not just the two hand-authored demo items below.
const KURTA_LOCAL_GLOBAL = [
  { local: "Bandhani Odhna Kurti", global: "Tie-Dye Print Kurta" },
  { local: "Ajrakh Chhapai Kurta", global: "Block-Print Kurta" },
  { local: "Ilkal Butti Kurta", global: "Handloom Woven Kurta" },
  { local: "Kota Doria Kurti", global: "Sheer Cotton Kurta" },
  { local: "Chikankari Kaam Kurta", global: "White-Work Embroidered Kurta" },
];

const BRAND_PREFIXES = ["Desi", "Mitti", "Rooted", "Bharat", "Saanjh", "Rangrez", "Taana Baana", "Gaon", "Kargha", "Aapno"];
const BRAND_SUFFIXES = ["Weaves", "Threads", "Studio", "Collective", "Textiles", "Loom House", "Atelier", "Bazaar", "Wardrobe", "Co."];

function generateBrandName(city) {
  if (chance(0.4)) return `${city} ${pick(BRAND_SUFFIXES)}`;
  return `${pick(BRAND_PREFIXES)} ${pick(BRAND_SUFFIXES)}`;
}

const FIRST_NAMES = ["Aarav", "Priya", "Rohan", "Ishita", "Kabir", "Ananya", "Vikram", "Sneha", "Arjun", "Meera", "Dev", "Kavya", "Rahul", "Pooja", "Nikhil", "Divya", "Amit", "Neha", "Rajesh", "Simran"];
const LAST_NAMES = ["Sharma", "Verma", "Iyer", "Nair", "Reddy", "Patel", "Singh", "Gupta", "Das", "Menon", "Rao", "Chatterjee", "Kulkarni", "Bose", "Malhotra"];
const fullName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

const REVIEW_TEXT = {
  5: ["Loved it, fits perfectly!", "Exactly as shown on the live stream.", "Great quality for the price, ordering more.", "Super comfortable, will buy again."],
  4: ["Good quality, sizing runs slightly large.", "Nice fabric, delivery was quick.", "Happy with the purchase overall."],
  3: ["Decent, but color was a shade different from photos.", "Okay quality, expected a bit better finish."],
  2: ["Fit was off for me, had to exchange.", "Fabric felt thinner than expected."],
};

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not set. Copy server/.env.example to server/.env first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB for seeding:", mongoose.connection.name);

  console.log("🧹 Clearing existing demo collections...");
  await Promise.all([
    Seller.deleteMany({}),
    Customer.deleteMany({}),
    Product.deleteMany({}),
    LiveSession.deleteMany({}),
    Opportunity.deleteMany({}),
    BusinessHealth.deleteMany({}),
    Analytics.deleteMany({}),
    Comment.deleteMany({}),
    Order.deleteMany({}),
    Poll.deleteMany({}),
    Promotion.deleteMany({}),
    Review.deleteMany({}),
    RegionalDemand.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const demoPassword = await bcrypt.hash("demo1234", 10);

  // ==========================================================================
  // 1) THE THREE ORIGINAL DEMO ACCOUNTS — preserved, now with Bharat fields
  // ==========================================================================
  const jaipur = findCity("Jaipur");
  const kochi = findCity("Kochi");

  const seller = await Seller.create({
    name: "Aarav Mehta",
    brandName: "Urban Threads",
    email: "seller@demo.com",
    password: demoPassword,
    phone: "9876500001",
    category: "Fashion",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Urban%20Threads",
    growthScore: 74,
    tier: "Growing Seller",
    city: jaipur.city,
    state: jaipur.state,
    zone: jaipur.zone,
    lat: jaipur.lat,
    lng: jaipur.lng,
    cityTier: jaipur.tier,
    preferredLanguage: "Hindi",
  });

  const seller2 = await Seller.create({
    name: "Priya Nair",
    brandName: "Coastal Cotton Co.",
    email: "seller2@demo.com",
    password: demoPassword,
    phone: "9876500002",
    category: "Fashion",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Coastal%20Cotton",
    growthScore: 58,
    tier: "Rising Seller",
    city: kochi.city,
    state: kochi.state,
    zone: kochi.zone,
    lat: kochi.lat,
    lng: kochi.lng,
    cityTier: kochi.tier,
    preferredLanguage: "Malayalam",
  });

  console.log("✅ Seeded sellers:", seller.email, "/", seller2.email, "(password for both: demo1234)");

  const customer = await Customer.create({
    name: "Ishaan Kapoor",
    email: "customer@demo.com",
    password: demoPassword,
    phone: "9876511111",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Ishaan",
    wishlistCategories: ["Kurtas", "Footwear"],
    city: jaipur.city,
    state: jaipur.state,
    zone: jaipur.zone,
    lat: jaipur.lat,
    lng: jaipur.lng,
    cityTier: jaipur.tier,
    preferredLanguage: "Hindi",
    followedSellers: [seller2._id],
  });
  console.log("✅ Seeded customer:", customer.email, "(password: demo1234) — based in", customer.city);

  // ---- Products for Urban Threads (original 11, now with per-size stock,
  // festival tags, and local/global naming on the two Kurta items) ----
  const productDefs = [
    { name: "Oversized Cotton T-Shirt", category: "T-Shirts", price: 799, mrp: 1299, impressions: 1200, clicks: 340, conversions: 58 },
    { name: "Slim Fit Cargo Pants", category: "Bottoms", price: 1499, mrp: 2199, impressions: 900, clicks: 210, conversions: 30 },
    { name: "Classic White Sneakers", category: "Footwear", price: 2199, mrp: 2999, impressions: 1800, clicks: 520, conversions: 90 },
    {
      name: "Cotton Kurta - Indigo", category: "Kurtas", price: 1099, mrp: 1599, impressions: 2100, clicks: 95, conversions: 4, isDeadStock: true, regionDemandTag: "Jaipur",
      localName: "Neeli Kurti", localDescription: "Neeli rang ki aaramdayak sooti kurti, rozana pehnne ke liye perfect.",
      globalName: "Indigo Cotton Kurta", globalDescription: "A breathable indigo cotton kurta with a relaxed fit, easy to dress up or down.",
      festivalTags: ["Diwali", "Navratri"],
    },
    {
      name: "Printed Linen Kurta", category: "Kurtas", price: 1299, mrp: 1899, impressions: 1600, clicks: 80, conversions: 3, isDeadStock: true, regionDemandTag: "Jaipur",
      localName: "Chhapai Kurti", localDescription: "Haathon se chhapi hui linen kurti, garmi ke mausam ke liye behtareen.",
      globalName: "Block-Print Linen Kurta", globalDescription: "A hand block-printed linen kurta, breathable and perfect for warm-weather styling.",
      festivalTags: ["Navratri"],
    },
    { name: "Denim Jacket - Washed Blue", category: "Jackets", price: 1999, mrp: 2799, impressions: 700, clicks: 180, conversions: 22 },
    { name: "Relaxed Fit Joggers", category: "Bottoms", price: 999, mrp: 1499, impressions: 1100, clicks: 260, conversions: 40 },
    { name: "Graphic Print Hoodie", category: "Hoodies", price: 1699, mrp: 2399, impressions: 950, clicks: 240, conversions: 35 },
    { name: "Formal Slim Shirt - Sky Blue", category: "Shirts", price: 1199, mrp: 1799, impressions: 1300, clicks: 60, conversions: 5, isDeadStock: true, regionDemandTag: "Pune" },
    { name: "Canvas High-Top Sneakers", category: "Footwear", price: 1899, mrp: 2599, impressions: 1400, clicks: 410, conversions: 70 },
    { name: "Striped Polo T-Shirt", category: "T-Shirts", price: 899, mrp: 1399, impressions: 1000, clicks: 300, conversions: 55 },
    { name: "Wide Leg Palazzo Pants", category: "Bottoms", price: 1099, mrp: 1699, impressions: 800, clicks: 150, conversions: 18 },
  ];

  const products = [];
  for (const p of productDefs) {
    const sizes = p.category === "Footwear" ? ["7", "8", "9", "10", "11"] : ["S", "M", "L", "XL"];
    const stock = p.isDeadStock ? rand(20, 35) : rand(45, 90);
    const product = await Product.create({
      ...p,
      brand: "Urban Threads",
      description: p.description || `${p.name} by Urban Threads. Breathable fabric, true-to-size fit, easy to style.`,
      images: [img(p.name)],
      sizes,
      stock,
      sizeStock: evenSizeStock(sizes, stock),
      sellerId: seller._id,
    });
    products.push(product);
  }
  console.log(`✅ Seeded ${products.length} products for Urban Threads (with local/global naming on 2 kurtas)`);

  const [tshirt, cargo, sneakers, indigoKurta, linenKurta, jacket, joggers, hoodie, shirt, canvasSneakers] = products;

  // ---- Opportunities (top 3 by impactScore ever shown on the feed) ----
  await Opportunity.create([
    {
      sellerId: seller._id, type: "go_live_now", title: "Go Live Now: Cotton Kurtas", subtitle: "Regional demand spike detected in Jaipur",
      productId: indigoKurta._id, region: "Jaipur", estimatedViewers: 240, confidence: 82, impactScore: 91,
      reasoningSeed: "3.2x more searches for 'cotton kurta' in Jaipur this week vs last week; you have 2 dead-stock kurta SKUs.",
    },
    {
      sellerId: seller._id, type: "regional_demand_alert", title: "High Demand Alert: Kurtas in Jaipur", subtitle: "Sourced from the Regional Demand board",
      productId: indigoKurta._id, region: "Jaipur", estimatedViewers: 0, confidence: 80, impactScore: 88,
      reasoningSeed: "Kurta demand in your own city, Jaipur, is trending 'rising' ahead of the Navratri season — see the Regional Insights page.",
    },
    {
      sellerId: seller._id, type: "revive_sleeping_product", title: "Revive: Formal Slim Shirt - Sky Blue", subtitle: "High impressions, very low conversion",
      productId: shirt._id, region: "Pune", estimatedViewers: 0, confidence: 76, impactScore: 84,
      reasoningSeed: "1300 impressions but only 60 clicks (4.6% CTR, below category average of 15%) and 5 conversions — likely missing size/fit keywords in the title.",
    },
    {
      sellerId: seller._id, type: "restock_alert", title: "Restock Alert: XL Sneakers", subtitle: "Repeated size questions in past sessions",
      productId: sneakers._id, region: "", estimatedViewers: 0, confidence: 71, impactScore: 75,
      reasoningSeed: "Customers asked about size 10/11 availability 5 times across your last sessions — consider restocking before your next live.",
    },
    {
      sellerId: seller._id, type: "customer_doubt_detected", title: "Customer Doubt Detected: Stretch Fabric", subtitle: "Recurring question pattern from past sessions",
      productId: joggers._id, region: "", estimatedViewers: 0, confidence: 68, impactScore: 70,
      reasoningSeed: "Customers asked about stretch fabric 12 times across your last 3 live sessions on jogger-style products.",
    },
    {
      sellerId: seller._id, type: "revive_sleeping_product", title: "Revive: Printed Linen Kurta", subtitle: "Dead stock, low CTR",
      productId: linenKurta._id, region: "Jaipur", estimatedViewers: 0, confidence: 65, impactScore: 58,
      reasoningSeed: "1600 impressions, 80 clicks (5% CTR), 3 conversions — description doesn't mention fabric or care instructions.",
    },
  ]);
  console.log("✅ Seeded opportunities (including new regional_demand_alert & restock_alert types)");

  await BusinessHealth.create({
    sellerId: seller._id, ordersThisWeek: 47, revenueThisWeek: 68230, returnRate: 4.2, ratingAverage: 4.4, fillRate: 96, tier: "Growing Seller", tierProgress: 68,
  });
  await BusinessHealth.create({ sellerId: seller2._id });
  console.log("✅ Seeded business health");

  // ---- Live sessions (original 3, unchanged in spirit) ----
  const scheduledSession = await LiveSession.create({
    sellerId: seller._id, title: "Monsoon Kurta Edit — Live Styling", description: "Styling this season's cotton & linen kurtas live, with real-time size help.",
    coverImage: img("monsoon-kurta-live"), status: "scheduled", scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000),
    productIds: [indigoKurta._id, linenKurta._id, tshirt._id], pinnedProductId: indigoKurta._id,
  });

  await LiveSession.create({
    sellerId: seller2._id, title: "Coastal Cotton — New Arrivals", description: "First look at our new breathable cotton essentials.",
    coverImage: img("coastal-cotton-live"), status: "scheduled", scheduledFor: new Date(Date.now() + 5 * 60 * 60 * 1000), productIds: [],
  });

  const endedSession = await LiveSession.create({
    sellerId: seller._id, title: "Sneaker Drop — Live Unboxing", description: "Unboxing and styling our newest sneaker drop.",
    coverImage: img("sneaker-drop-live"), status: "ended",
    startedAt: new Date(Date.now() - 26 * 60 * 60 * 1000), endedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    productIds: [sneakers._id, canvasSneakers._id], pinnedProductId: sneakers._id,
    viewerCount: 0, peakViewerCount: 186, totalViews: 186, totalQuestions: 9, totalAddToCarts: 34, totalOrders: 12, totalLikes: 214,
    aiInsight: "Viewers asked about true-to-size fit 6 times — add a size comparison note to the pinned product next time.",
  });

  const demoComments = [
    { author: "Riya", message: "Does this run true to size?", isQuestion: true },
    { author: "Aman", message: "Loved the styling!", isQuestion: false },
    { author: "Ishaan Kapoor", message: "Is this available in size 9?", isQuestion: true },
    { author: "Seller", message: "Yes! True to size for most, size up if you have wide feet.", isQuestion: false, authorRole: "seller", isAnswered: true },
    { author: "Neha", message: "Can you show the sole grip closer?", isQuestion: true },
    { author: "Karan", message: "Adding to cart right now 🔥", isQuestion: false },
    { author: "Ishaan Kapoor", message: "Does it come with extra laces?", isQuestion: true },
    { author: "Seller", message: "Yes, one extra pair of white laces included.", isQuestion: false, authorRole: "seller", isAnswered: true },
    { author: "Divya", message: "Perfect for college, ordering now!", isQuestion: false },
  ];

  let t = endedSession.startedAt.getTime();
  for (const c of demoComments) {
    t += 45000;
    await Comment.create({
      liveSessionId: endedSession._id, author: c.author, authorRole: c.authorRole || "customer",
      message: c.message, isQuestion: c.isQuestion, isAnswered: !!c.isAnswered, createdAt: new Date(t),
    });
  }

  // One poll + one flash-sale promotion tied to the ended session, so Replay has something to show.
  await Poll.create({
    liveSessionId: endedSession._id, sellerId: seller._id, question: "Which sneaker colourway next?",
    options: [{ text: "Classic White", votes: 34 }, { text: "All Black", votes: 21 }, { text: "Olive Green", votes: 12 }], status: "closed",
  });
  await Promotion.create({
    liveSessionId: endedSession._id, sellerId: seller._id, type: "flash_sale", title: "Flash Sale — Sneakers", productId: sneakers._id,
    discountPercent: 15, flashPrice: Math.round(sneakers.price * 0.85), startedAt: endedSession.startedAt,
    endsAt: new Date(endedSession.startedAt.getTime() + 10 * 60 * 1000), status: "ended", claimedBy: [customer._id],
  });

  console.log("✅ Seeded live sessions (1 scheduled + 1 other-seller scheduled + 1 ended/replayable) with comments, a poll & a flash sale");

  await Analytics.create({
    sellerId: seller._id, liveSessionId: endedSession._id, views: endedSession.totalViews, questionsAsked: endedSession.totalQuestions,
    addToCarts: endedSession.totalAddToCarts, purchases: endedSession.totalOrders, revenue: 26340, avgWatchTimeSeconds: 410, aiInsight: endedSession.aiInsight,
  });

  const demoOrder = await Order.create({
    customerId: customer._id, sellerId: seller._id, liveSessionId: endedSession._id,
    items: [{ productId: sneakers._id, name: sneakers.name, image: sneakers.images[0], size: "9", quantity: 1, price: sneakers.price }],
    totalAmount: sneakers.price, customerName: customer.name, shippingAddress: "221B, Green Park, Jaipur, Rajasthan, India", status: "delivered",
  });
  await Review.create({
    productId: sneakers._id, sellerId: seller._id, customerId: customer._id, orderId: demoOrder._id,
    rating: 5, comment: "Exactly as shown on the live stream, true to size!", customerName: customer.name,
  });
  console.log("✅ Seeded analytics + one delivered order with a review for the demo customer");

  // Notifications waiting for the demo customer immediately (from the seller they follow).
  await Notification.create([
    { recipientId: customer._id, recipientRole: "customer", sellerId: seller2._id, type: "stream_started", title: "Coastal Cotton Co. is planning to go live soon!", body: "Coastal Cotton — New Arrivals", read: false },
    { recipientId: seller._id, recipientRole: "seller", type: "order_update", title: "New order placed", body: `${customer.name} placed an order worth ₹${sneakers.price}.`, read: true },
  ]);

  // ==========================================================================
  // 2) PROCEDURALLY GENERATED SELLERS + CATALOG ACROSS BHARAT
  // ==========================================================================
  const t2t3Cities = CITIES.filter((c) => c.tier !== "T1");
  const NUM_GENERATED_SELLERS = 30;
  const generatedSellers = [];
  const allProducts = [...products];

  for (let i = 0; i < NUM_GENERATED_SELLERS; i++) {
    const cityMeta = chance(0.8) ? pick(t2t3Cities) : pick(CITIES);
    const brandName = generateBrandName(cityMeta.city);
    const ownerName = fullName();
    const email = `bharatseller${i + 1}@demo.com`;

    const genSeller = await Seller.create({
      name: ownerName,
      brandName,
      email,
      password: demoPassword,
      phone: `98765${String(20000 + i).padStart(5, "0")}`,
      category: "Fashion",
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(brandName)}`,
      growthScore: rand(30, 95),
      tier: pick(["Rising Seller", "Growing Seller", "Established Seller"]),
      city: cityMeta.city,
      state: cityMeta.state,
      zone: cityMeta.zone,
      lat: cityMeta.lat,
      lng: cityMeta.lng,
      cityTier: cityMeta.tier,
      preferredLanguage: languageForZone(cityMeta.zone),
    });
    generatedSellers.push(genSeller);
    await BusinessHealth.create({
      sellerId: genSeller._id,
      ordersThisWeek: rand(0, 60),
      revenueThisWeek: rand(0, 90000),
      returnRate: Math.round(rand(15, 90) / 10),
      ratingAverage: 0,
      fillRate: rand(80, 99),
      tier: genSeller.tier,
      tierProgress: rand(20, 95),
    });

    // Each seller specializes in 2 categories, 6-12 products total.
    const focusCategories = pickN(CATEGORIES, 2);
    const productCount = rand(6, 12);
    for (let j = 0; j < productCount; j++) {
      const category = focusCategories[j % focusCategories.length];
      const template = CATEGORY_TEMPLATES[category];
      const baseName = pick(template.names);
      const withColor = chance(0.4) ? `${baseName} - ${pick(COLOR_VARIANTS)}` : baseName;
      const price = rand(template.price[0], template.price[1]);
      const mrp = Math.round(price * (1.3 + Math.random() * 0.3));
      const isDeadStock = chance(0.12);
      const sizes = category === "Footwear" ? ["7", "8", "9", "10", "11"] : ["S", "M", "L", "XL"];
      const stock = isDeadStock ? rand(15, 30) : rand(40, 100);
      const sizeStock = evenSizeStock(sizes, stock);
      // Occasionally simulate a near-sold-out size, to give the Live
      // Inventory panel + "Only N left" badge + low-stock assistant tip
      // something real to react to.
      if (chance(0.15)) sizeStock[rand(0, sizeStock.length - 1)].quantity = rand(0, 4);

      let naming = {};
      if (category === "Kurtas" && chance(0.45)) {
        const pair = pick(KURTA_LOCAL_GLOBAL);
        naming = {
          localName: pair.local,
          localDescription: `${pair.local} — handcrafted with a technique rooted in ${cityMeta.state}'s textile tradition.`,
          globalName: pair.global,
          globalDescription: `A ${pair.global.toLowerCase()} with a versatile, everyday-wearable silhouette.`,
        };
      }

      const impressions = rand(100, 2200);
      const clicks = Math.round(impressions * (isDeadStock ? rand(2, 6) / 100 : rand(10, 35) / 100));
      const conversions = Math.round(clicks * (isDeadStock ? rand(2, 5) / 100 : rand(8, 20) / 100));

      const product = await Product.create({
        name: withColor,
        brand: brandName,
        description: `${withColor} by ${brandName}. Breathable fabric, true-to-size fit, easy to style.`,
        price,
        mrp,
        images: [img(`${brandName}-${withColor}-${j}`)],
        sizes,
        stock: sizeStock.reduce((s, x) => s + x.quantity, 0),
        sizeStock,
        category,
        sellerId: genSeller._id,
        impressions,
        clicks,
        conversions,
        isDeadStock,
        regionDemandTag: isDeadStock ? cityMeta.city : "",
        festivalTags: category === "Kurtas" || category === "Dresses" ? pickN(["Diwali", "Navratri", "Eid", "Durga Puja"], rand(0, 2)) : [],
        ...naming,
      });
      allProducts.push(product);
    }
  }
  console.log(`✅ Seeded ${generatedSellers.length} generated Bharat sellers with ${allProducts.length - products.length} products`);

  // ==========================================================================
  // 3) PROCEDURALLY GENERATED CUSTOMERS ACROSS BHARAT (needs allProducts first)
  // ==========================================================================
  const allSellers = [seller, seller2, ...generatedSellers];
  const NUM_GENERATED_CUSTOMERS = 90;
  const generatedCustomers = [];

  for (let i = 0; i < NUM_GENERATED_CUSTOMERS; i++) {
    const cityMeta = chance(0.85) ? pick(t2t3Cities) : pick(CITIES);
    const name = fullName();
    const email = `bharatbuyer${i + 1}@demo.com`;
    const wishlist = pickN(CATEGORIES, rand(1, 3));
    const browsingHistory = pickN(allProducts, rand(2, 8)).map((p) => ({
      productId: p._id,
      category: p.category,
      viewedAt: new Date(Date.now() - rand(0, 20) * 24 * 60 * 60 * 1000),
    }));
    const follows = pickN(allSellers, rand(0, 3))
      .filter((s) => String(s._id) !== "")
      .map((s) => s._id);

    const genCustomer = await Customer.create({
      name,
      email,
      password: demoPassword,
      phone: `98766${String(30000 + i).padStart(5, "0")}`,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      wishlistCategories: wishlist,
      city: cityMeta.city,
      state: cityMeta.state,
      zone: cityMeta.zone,
      lat: cityMeta.lat,
      lng: cityMeta.lng,
      cityTier: cityMeta.tier,
      preferredLanguage: languageForZone(cityMeta.zone),
      followedSellers: follows,
      browsingHistory,
    });
    generatedCustomers.push(genCustomer);
  }
  console.log(`✅ Seeded ${generatedCustomers.length} generated Bharat customers with browsing history & follows`);

  // ==========================================================================
  // 4) EXTRA LIVE SESSIONS ACROSS GENERATED SELLERS
  // ==========================================================================
  const allCustomers = [customer, ...generatedCustomers];
  const SAMPLE_CHAT = [
    "Does this run true to size?", "Loved the styling!", "Is Cash on Delivery available?", "Can you show the fabric closer?",
    "Adding to cart right now 🔥", "What's the return window?", "Perfect for the festival season, ordering!", "Is this good for daily wear?",
    "Ships to my city?", "Any other colours available?",
  ];

  let extraEndedCount = 0;
  for (const genSeller of pickN(generatedSellers, 16)) {
    const sellerProducts = allProducts.filter((p) => String(p.sellerId) === String(genSeller._id));
    if (!sellerProducts.length) continue;
    const pinned = pick(sellerProducts);
    const startedAt = new Date(Date.now() - rand(1, 20) * 24 * 60 * 60 * 1000);
    const durationMin = rand(20, 60);
    const endedAt = new Date(startedAt.getTime() + durationMin * 60 * 1000);
    const peakViewers = rand(15, 400);
    const totalOrders = rand(0, Math.round(peakViewers * 0.08));

    const session = await LiveSession.create({
      sellerId: genSeller._id,
      title: `${genSeller.brandName} — Live Styling Session`,
      description: `Styling our latest ${pinned.category.toLowerCase()} collection live from ${genSeller.city}.`,
      coverImage: img(`${genSeller.brandName}-live-${extraEndedCount}`),
      status: "ended",
      startedAt,
      endedAt,
      productIds: pickN(sellerProducts, Math.min(3, sellerProducts.length)).map((p) => p._id),
      pinnedProductId: pinned._id,
      viewerCount: 0,
      peakViewerCount: peakViewers,
      totalViews: peakViewers,
      totalQuestions: rand(2, 12),
      totalAddToCarts: rand(5, 60),
      totalOrders,
      totalLikes: rand(peakViewers, peakViewers * 6),
    });

    let ct = startedAt.getTime();
    const chatCount = rand(6, 14);
    for (let k = 0; k < chatCount; k++) {
      ct += rand(20, 90) * 1000;
      const isQuestion = chance(0.35);
      await Comment.create({
        liveSessionId: session._id,
        author: isQuestion ? pick(allCustomers).name : fullName(),
        authorRole: "customer",
        message: pick(SAMPLE_CHAT),
        isQuestion,
        isAnswered: isQuestion ? chance(0.6) : false,
        createdAt: new Date(ct),
      });
    }

    await Analytics.create({
      sellerId: genSeller._id,
      liveSessionId: session._id,
      views: peakViewers,
      questionsAsked: session.totalQuestions,
      addToCarts: session.totalAddToCarts,
      purchases: totalOrders,
      revenue: totalOrders * pinned.price,
      avgWatchTimeSeconds: rand(90, 900),
    });
    extraEndedCount++;
  }
  console.log(`✅ Seeded ${extraEndedCount} additional ended live sessions with chat + analytics across generated sellers`);

  // A handful of scheduled sessions too, for Discovery variety.
  for (const genSeller of pickN(generatedSellers, 5)) {
    const sellerProducts = allProducts.filter((p) => String(p.sellerId) === String(genSeller._id));
    if (!sellerProducts.length) continue;
    await LiveSession.create({
      sellerId: genSeller._id,
      title: `${genSeller.brandName} — Upcoming Live`,
      description: `Get ready for new arrivals from ${genSeller.city}.`,
      coverImage: img(`${genSeller.brandName}-scheduled`),
      status: "scheduled",
      scheduledFor: new Date(Date.now() + rand(1, 48) * 60 * 60 * 1000),
      productIds: pickN(sellerProducts, Math.min(2, sellerProducts.length)).map((p) => p._id),
    });
  }
  console.log("✅ Seeded 5 additional scheduled live sessions");

  // ==========================================================================
  // 5) ORDERS + REVIEWS (drives analytics, top products, ratings, regional nudges)
  // ==========================================================================
  const ORDER_STATUS_WEIGHTS = [
    ["delivered", 0.55], ["shipped", 0.15], ["confirmed", 0.1], ["placed", 0.1], ["cancelled", 0.1],
  ];
  function weightedStatus() {
    const r = Math.random();
    let acc = 0;
    for (const [status, weight] of ORDER_STATUS_WEIGHTS) {
      acc += weight;
      if (r <= acc) return status;
    }
    return "placed";
  }

  const NUM_ORDERS = 220;
  let reviewCount = 0;
  for (let i = 0; i < NUM_ORDERS; i++) {
    const buyer = pick(allCustomers);
    const product = pick(allProducts);
    const quantity = chance(0.15) ? 2 : 1;
    const size = product.sizes?.length ? pick(product.sizes) : "M";
    const status = weightedStatus();
    const createdAt = new Date(Date.now() - rand(0, 60) * 24 * 60 * 60 * 1000);

    const order = await Order.create({
      customerId: buyer._id,
      sellerId: product.sellerId,
      items: [{ productId: product._id, name: product.name, image: product.images[0], size, quantity, price: product.price }],
      totalAmount: product.price * quantity,
      customerName: buyer.name,
      shippingAddress: `${buyer.city || "India"}, India`,
      status,
      createdAt,
    });

    if (status === "delivered" && chance(0.6)) {
      const rating = chance(0.7) ? pick([4, 5]) : chance(0.7) ? 3 : pick([1, 2]);
      try {
        await Review.create({
          productId: product._id,
          sellerId: product.sellerId,
          customerId: buyer._id,
          orderId: order._id,
          rating,
          comment: pick(REVIEW_TEXT[rating] || REVIEW_TEXT[4]),
          customerName: buyer.name,
        });
        reviewCount++;
      } catch {
        // duplicate (productId, customerId) pair from the random draw — skip, not worth retrying for seed data.
      }
    }
  }
  console.log(`✅ Seeded ${NUM_ORDERS} orders and ${reviewCount} reviews`);

  // Recompute rating aggregates now that reviews exist.
  const productIdsWithReviews = await Review.distinct("productId");
  for (const productId of productIdsWithReviews) {
    const reviews = await Review.find({ productId });
    const ratingAverage = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
    await Product.findByIdAndUpdate(productId, { ratingAverage, ratingCount: reviews.length });
  }
  const sellerIdsWithReviews = await Review.distinct("sellerId");
  for (const sellerId of sellerIdsWithReviews) {
    const reviews = await Review.find({ sellerId });
    const ratingAverage = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
    await Seller.findByIdAndUpdate(sellerId, { ratingAverage, ratingCount: reviews.length });
  }
  console.log("✅ Recomputed product & seller rating aggregates from seeded reviews");

  // ==========================================================================
  // 6) REGIONAL DEMAND BOARD — every Bharat city x category (Bharat idea #3)
  // ==========================================================================
  const regionalRows = [];
  for (const cityMeta of CITIES) {
    for (const category of CATEGORIES) {
      const base = cityMeta.tier === "T1" ? rand(35, 75) : rand(30, 95);
      const relevantFestival = FESTIVALS.find((f) => f.zones.includes(cityMeta.zone) && f.categories.includes(category) && chance(0.35));
      const demandScore = Math.min(100, base + (relevantFestival ? rand(5, 20) : 0));
      const trend = relevantFestival ? "rising" : pick(["rising", "steady", "steady", "falling"]);
      regionalRows.push({
        city: cityMeta.city,
        state: cityMeta.state,
        zone: cityMeta.zone,
        lat: cityMeta.lat,
        lng: cityMeta.lng,
        category,
        demandScore,
        trend,
        festivalTag: relevantFestival ? relevantFestival.name : "",
      });
    }
  }
  await RegionalDemand.insertMany(regionalRows);
  console.log(`✅ Seeded ${regionalRows.length} Regional Demand signals across ${CITIES.length} cities x ${CATEGORIES.length} categories`);

  console.log("\n🎉 Seed complete. Demo logins:");
  console.log("   Seller:   seller@demo.com   / demo1234   (Urban Threads, Jaipur — also seller2@demo.com, Coastal Cotton Co., Kochi)");
  console.log("   Customer: customer@demo.com / demo1234   (Jaipur — follows Coastal Cotton Co.)");
  console.log(`   + ${generatedSellers.length} generated sellers (bharatseller1..${NUM_GENERATED_SELLERS}@demo.com) and ${generatedCustomers.length} generated customers (bharatbuyer1..${NUM_GENERATED_CUSTOMERS}@demo.com), all password demo1234`);
  console.log(`   Scheduled live session ready to start: "${scheduledSession.title}" (${scheduledSession._id})`);
  console.log(`   Replayable ended session: "${endedSession.title}" (${endedSession._id})`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
