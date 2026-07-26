const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    customerName: { type: String, required: true },
  },
  { timestamps: true }
);

// One review per customer per product (they can still edit it — see
// reviewController.upsertReview) rather than letting the same buyer stack
// multiple reviews on one item.
reviewSchema.index({ productId: 1, customerId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
