import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Star } from "lucide-react";
import { orderService } from "../../services/orderService";
import { reviewService } from "../../services/reviewService";
import { Spinner, EmptyState, Badge } from "../../components/ui/Primitives";
import ReviewForm from "../../components/customer/ReviewForm";

const STATUS_TONE = {
  placed: "amber",
  confirmed: "brand",
  shipped: "brand",
  delivered: "green",
  cancelled: "red",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null); // { order, item }

  useEffect(() => {
    Promise.all([orderService.getMine(), reviewService.getMine().catch(() => [])])
      .then(([orderList, reviews]) => {
        setOrders(orderList);
        setMyReviews(reviews);
      })
      .finally(() => setLoading(false));
  }, []);

  const reviewFor = (productId) => myReviews.find((r) => String(r.productId) === String(productId));

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <h1 className="mb-4 text-xl font-bold text-gray-900">Your Orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          subtitle="Orders you place will show up here."
          action={
            <Link to="/app" className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white">
              Start shopping
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  #{order._id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <Badge tone={STATUS_TONE[order.status] || "gray"}>{order.status}</Badge>
              </div>
              {order.items.map((item, idx) => {
                const existingReview = reviewFor(item.productId);
                return (
                  <div key={idx} className="flex items-center gap-3 py-1.5">
                    <img src={item.image} alt={item.name} className="h-12 w-10 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        Size {item.size} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                    {order.status === "delivered" ? (
                      <button
                        type="button"
                        onClick={() => setReviewTarget({ order, item })}
                        className="ml-2 flex flex-shrink-0 items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:border-brand-300"
                      >
                        <Star className={`h-3 w-3 ${existingReview ? "fill-amber-400 text-amber-400" : ""}`} />
                        {existingReview ? "Edit review" : "Rate"}
                      </button>
                    ) : null}
                  </div>
                );
              })}
              <div className="mt-2 flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-sm font-bold text-gray-900">
                <span>Total</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewTarget ? (
        <ReviewForm
          order={reviewTarget.order}
          item={reviewTarget.item}
          existingReview={reviewFor(reviewTarget.item.productId)}
          onClose={() => setReviewTarget(null)}
          onSubmitted={(review) =>
            setMyReviews((prev) => [review, ...prev.filter((r) => String(r.productId) !== String(review.productId))])
          }
        />
      ) : null}
    </div>
  );
}
