const express = require("express");
const cors = require("cors");

const app = express();

// ---- Routes ----
const authRoutes = require("./routes/authRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const productRoutes = require("./routes/productRoutes");
const liveSessionRoutes = require("./routes/liveSessionRoutes");
const orderRoutes = require("./routes/orderRoutes");
const commentRoutes = require("./routes/commentRoutes");
const opportunityRoutes = require("./routes/opportunityRoutes");
const businessHealthRoutes = require("./routes/businessHealthRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const customerRoutes = require("./routes/customerRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const regionalDemandRoutes = require("./routes/regionalDemandRoutes");
const pollRoutes = require("./routes/pollRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const { notFound, errorHandler } = require("./middleware/errorHandler");

// ---- Middleware ----
// This is a local-only prototype (see README for the "two devices on the same
// WiFi" verification step) — origin is reflected rather than locked to a
// single CLIENT_ORIGIN value, so it works whether you open it via localhost,
// 127.0.0.1, or a LAN IP from another device, with zero config.
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
// Raised from the default 100kb — product photos are sent as compressed
// base64 data URLs (see client/src/utils/imageCompress.js), and the AI
// naming-from-photo endpoint also accepts a base64 image.
app.use(express.json({ limit: "10mb" }));

// ---- Health check ----
app.get("/", (req, res) => {
  res.json({ success: true, message: "Myntra Growth Engine backend running 🚀" });
});

// ---- Mounted API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/live-sessions", liveSessionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/business-health", businessHealthRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/regional-demand", regionalDemandRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);

// ---- 404 + error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
