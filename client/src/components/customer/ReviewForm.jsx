import { useState } from "react";
import { X, Star } from "lucide-react";
import { reviewService } from "../../services/reviewService";

export default function ReviewForm({ order, item, existingReview, onClose, onSubmitted }) {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const review = await reviewService.submit({ productId: item.productId, orderId: order._id, rating, comment });
      onSubmitted(review);
      onClose();
    } catch (err) {
      setError(err.message || "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Rate this product</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <img src={item.image} alt={item.name} className="h-14 w-12 rounded-lg object-cover" />
          <p className="text-sm text-gray-700">{item.name}</p>
        </div>

        <div className="mb-4 flex items-center justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
              <Star className={`h-8 w-8 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was the fit, fabric, and delivery? (optional)"
          rows={3}
          className="mb-3 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-400"
        />

        {error ? <p className="mb-2 text-xs text-red-500">{error}</p> : null}

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="w-full rounded-full bg-brand-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Submitting..." : existingReview ? "Update review" : "Submit review"}
        </button>
      </div>
    </div>
  );
}
