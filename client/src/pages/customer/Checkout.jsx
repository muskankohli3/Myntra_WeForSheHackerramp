import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { orderService } from "../../services/orderService";
import Button from "../../components/ui/Button";

export default function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-gray-50 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link to="/app" className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white">
          Back to shopping
        </Link>
      </div>
    );
  }

  async function handlePlaceOrder() {
    setError("");
    setPlacing(true);
    try {
      // Group cart items by seller — each seller gets its own order, exactly
      // like a real multi-seller marketplace checkout would.
      const bySeller = new Map();
      for (const item of items) {
        const key = item.sellerId || "unknown";
        if (!bySeller.has(key)) bySeller.set(key, []);
        bySeller.get(key).push(item);
      }

      const orders = [];
      for (const [, groupItems] of bySeller) {
        const order = await orderService.create({
          items: groupItems.map((i) => ({ productId: i.productId, quantity: i.quantity, size: i.size })),
          liveSessionId: groupItems.find((i) => i.liveSessionId)?.liveSessionId || null,
          shippingAddress: address.trim() || "Default Address, India",
        });
        orders.push(order);
      }

      clearCart();
      navigate(`/app/order-success/${orders[0]._id}`, { state: { orders } });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-gray-900">Checkout</h1>
      </div>

      <div className="mx-auto max-w-xl px-4 py-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <MapPin className="h-3.5 w-3.5" /> Delivery address
          </p>
          <p className="mb-2 text-sm text-gray-500">Deliver to {customer?.name}</p>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House no, street, city, state, PIN code"
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Order summary</p>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="h-14 w-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    Size {item.size} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-base font-bold text-gray-900">
            <span>Total</span>
            <span>₹{totalAmount}</span>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <Button className="mt-5 w-full" onClick={handlePlaceOrder} loading={placing}>
          Place Order — ₹{totalAmount}
        </Button>
      </div>
    </div>
  );
}
