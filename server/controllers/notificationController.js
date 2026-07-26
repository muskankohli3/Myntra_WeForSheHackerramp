const Notification = require("../models/Notification");

// GET /api/notifications (customer or seller auth — role inferred from whichever is set by protect())
const getMyNotifications = async (req, res) => {
  try {
    const recipientId = req.customer?._id || req.seller?._id;
    const recipientRole = req.customer ? "customer" : "seller";
    const notifications = await Notification.find({ recipientId, recipientRole })
      .sort({ createdAt: -1 })
      .limit(30);
    const unreadCount = await Notification.countDocuments({ recipientId, recipientRole, read: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    const recipientId = req.customer?._id || req.seller?._id;
    const recipientRole = req.customer ? "customer" : "seller";
    await Notification.updateMany({ recipientId, recipientRole, read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMyNotifications, markAllRead };
