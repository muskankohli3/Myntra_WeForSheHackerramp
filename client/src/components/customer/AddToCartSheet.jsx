import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { orderService } from "../../services/orderService";
import Button from "../ui/Button";

export default function AddToCartSheet({ product, isOpen, onClose, liveSessionId, onAdded }) {
  const [size, setSize] = useState(product?.sizes?.[0] || "M");
  const [added, setAdded] = useState(false);
  const [step, setStep] = useState("select"); // select -> confirm -> success (quick-checkout path only)
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const { addItem } = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();

  // Live-session shopping shouldn't ever pull the customer away from the
  // stream (per the "Speed & Trust" theme's "without leaving the livestream"
  // requirement) — so Buy Now becomes a one-click inline checkout instead of
  // a navigation to /app/checkout whenever we're inside a live room.
  const isQuickCheckout = Boolean(liveSessionId);

  useEffect(() => {
    if (isOpen) {
      setSize(product?.sizes?.[0] || "M");
      setAdded(false);
      setStep("select");
      setError("");
      setAddress(customer?.city ? `Home address, ${customer.city}` : "Default Address, India");
    }
  }, [isOpen, product, customer]);

  if (!isOpen || !product) return null;

  function handleAdd() {
    addItem(product, size, liveSessionId);
    setAdded(true);
    onAdded?.();
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    if (isQuickCheckout) {
      setStep("confirm");
      return;
    }
    addItem(product, size, liveSessionId);
    onAdded?.();
    navigate("/app/checkout");
  }

  async function placeQuickOrder() {
    setPlacing(true);
    setError("");
    try {
      await orderService.create({
        items: [{ productId: product._id, size, quantity: 1 }],
        liveSessionId,
        shippingAddress: address,
      });
      setStep("success");
      onAdded?.();
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err.message || "Could not place the order.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md animate-fade-in rounded-t-3xl bg-white p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex gap-3">
            <img src={product.images?.[0]} alt={product.name} className="h-20 w-16 rounded-xl object-cover" />
            <div>
              <p className="text-xs font-semibold text-gray-400">{product.brand}</p>
              <p className="text-sm font-bold text-gray-900">{product.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm font-bold text-gray-900">₹{product.price}</p>
                {product.mrp ? <p className="text-xs text-gray-400 line-through">₹{product.mrp}</p> : null}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "success" ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Order placed!</p>
            <p className="text-xs text-gray-400">You never left the stream — check Orders for details.</p>
          </div>
        ) : step === "confirm" ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Delivering to</p>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="mb-4 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-400"
            />
            <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-500">
                Size {size} · Qty 1
              </span>
              <span className="font-bold text-gray-900">₹{product.price}</span>
            </div>
            {error ? <p className="mb-2 text-xs text-red-500">{error}</p> : null}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button className="flex-1" onClick={placeQuickOrder} disabled={placing}>
                <ShoppingBag className="h-4 w-4" /> {placing ? "Placing..." : "Place Order"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Select size</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {(product.sizes || ["S", "M", "L", "XL"]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`h-10 w-12 rounded-xl border text-sm font-semibold transition-colors ${
                    size === s ? "border-brand-500 bg-brand-500 text-white" : "border-gray-200 text-gray-600 hover:border-brand-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleAdd}>
                {added ? (
                  <>
                    <Check className="h-4 w-4" /> Added
                  </>
                ) : (
                  "Add to Cart"
                )}
              </Button>
              <Button className="flex-1" onClick={handleBuyNow}>
                Buy Now
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
