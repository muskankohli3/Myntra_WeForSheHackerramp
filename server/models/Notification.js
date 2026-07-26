const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    recipientRole: { type: String, enum: ["customer", "seller"], required: true },
    type: {
      type: String,
      enum: ["stream_started", "flash_sale", "coupon_available", "product_restocked", "order_update"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    liveSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveSession", default: null },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientRole: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
