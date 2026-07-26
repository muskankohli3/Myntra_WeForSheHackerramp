import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import Button from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/Primitives";

export default function Cart() {
  const { items, removeItem, updateQuantity, totalAmount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          subtitle="Add products from a live session or the home feed to see them here."
          action={
            <Link to="/app" className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white">
              Start shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <h1 className="mb-4 text-xl font-bold text-gray-900">Your Cart ({items.length})</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3">
            <img src={item.image} alt={item.name} className="h-20 w-16 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-400">Size: {item.size}</p>
              <p className="mt-1 text-sm font-bold text-brand-600">₹{item.price}</p>
              {item.liveSessionId ? (
                <p className="mt-0.5 text-[10px] font-medium text-amber-600">Added during a live session</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.key, item.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.key, item.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button onClick={() => removeItem(item.key)} className="ml-1 text-gray-300 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>₹{totalAmount}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Delivery</span>
          <span className="font-medium text-green-600">Free</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-base font-bold text-gray-900">
          <span>Total</span>
          <span>₹{totalAmount}</span>
        </div>
        <Button className="mt-4 w-full" onClick={() => navigate("/app/checkout")}>
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
