const Order = require("../models/Order");
const Product = require("../models/Product");
const LiveSession = require("../models/LiveSession");
const RegionalDemand = require("../models/RegionalDemand");
const Notification = require("../models/Notification");

// Nudges the seeded regional-demand score for (customer city, product
// category) up slightly on a real purchase — a small, honest touch that ties
// the Regional Demand board to actual activity instead of being 100% static
// seed data. Silently no-ops if there's no matching row (we don't invent new
// cities/categories on the fly).
async function nudgeRegionalDemand(city, category) {
  if (!city || !category) return;
  const row = await RegionalDemand.findOne({ city, category });
  if (!row) return;
  row.demandScore = Math.min(100, row.demandScore + 2);
  row.trend = "rising";
  await row.save();
}

// Applies a purchase against per-size stock, clamping at 0, and keeps the
// aggregate `stock` field in sync — powers the "Only N left" badge and the
// seller's live Inventory panel updating in real time.
async function decrementStock(product, size, quantity) {
  const sizeStock = product.sizeStock && product.sizeStock.length ? product.sizeStock : null;
  if (sizeStock) {
    const entry = sizeStock.find((s) => s.size === size) || sizeStock[0];
    if (entry) entry.quantity = Math.max(0, entry.quantity - quantity);
    product.stock = sizeStock.reduce((sum, s) => sum + s.quantity, 0);
  } else {
    product.stock = Math.max(0, (product.stock || 0) - quantity);
  }
  await product.save();
}

// POST /api/orders  (customer only)
const createOrder = async (req, res) => {
  try {
    const { items, liveSessionId, shippingAddress } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: "items array is required" });
    }

    // Resolve products for authoritative price/name/seller (never trust client-sent price).
    const resolvedItems = [];
    let sellerId = null;
    let totalAmount = 0;
    const stockUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` });
      sellerId = sellerId || product.sellerId;

      const quantity = item.quantity || 1;
      const size = item.size || product.sizes?.[0] || "M";
      resolvedItems.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        size,
        quantity,
        price: product.price,
      });
      totalAmount += product.price * quantity;

      product.conversions = (product.conversions || 0) + 1;
      await decrementStock(product, size, quantity);
      stockUpdates.push({ productId: product._id, stock: product.stock, sizeStock: product.sizeStock });

      await nudgeRegionalDemand(req.customer.city, product.category);
    }

    const order = await Order.create({
      customerId: req.customer._id,
      sellerId,
      liveSessionId: liveSessionId || null,
      items: resolvedItems,
      totalAmount,
      customerName: req.customer.name,
      shippingAddress: shippingAddress || "Default Address, India",
      status: "placed",
    });

    if (liveSessionId) {
      await LiveSession.findByIdAndUpdate(liveSessionId, { $inc: { totalOrders: 1 } });
    }

    // Seller gets an in-app notification for every order regardless of
    // whether they're currently live (bell icon), AND — if this purchase
    // happened during a live session — an instant "N orders just placed"
    // popup inside the studio via socket (see socketHandler's use of this event).
    await Notification.create({
      recipientId: sellerId,
      recipientRole: "seller",
      type: "order_update",
      title: "New order placed",
      body: `${req.customer.name} placed an order worth ₹${totalAmount}.`,
    });

    const io = req.app.get("io");
    if (io) {
      if (liveSessionId) {
        io.to(`live:${liveSessionId}`).emit("order-placed", {
          liveSessionId,
          customerName: req.customer.name,
          totalAmount,
          itemCount: resolvedItems.length,
        });
        stockUpdates.forEach((update) => {
          io.to(`live:${liveSessionId}`).emit("stock-update", update);
        });
      }
      io.to(`user:seller:${sellerId}`).emit("notification", {
        type: "order_update",
        title: "New order placed",
        body: `${req.customer.name} placed an order worth ₹${totalAmount}.`,
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/mine  (customer's own orders)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.customer._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/seller/mine  (seller's incoming orders)
const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.seller._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/orders/:id/status  (seller only, must own it) — lets a seller
// move an order through placed -> confirmed -> shipped -> delivered (or
// cancelled). Reaching "delivered" is what unlocks the review flow for the
// customer (see reviewController).
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["placed", "confirmed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const order = await Order.findOne({ _id: req.params.id, sellerId: req.seller._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    await Notification.create({
      recipientId: order.customerId,
      recipientRole: "customer",
      type: "order_update",
      title: `Order ${status}`,
      body: `Your order of ${order.items.length} item(s) is now "${status}".`,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:customer:${order.customerId}`).emit("notification", {
        type: "order_update",
        title: `Order ${status}`,
        body: `Your order of ${order.items.length} item(s) is now "${status}".`,
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, getSellerOrders, updateOrderStatus };
