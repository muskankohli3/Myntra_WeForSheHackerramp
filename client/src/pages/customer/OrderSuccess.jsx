import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import { orderService } from "../../services/orderService";
import { Spinner } from "../../components/ui/Primitives";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const [orders, setOrders] = useState(location.state?.orders || null);
  const [loading, setLoading] = useState(!location.state?.orders);

  useEffect(() => {
    if (orders) return;
    orderService
      .getById(orderId)
      .then((data) => setOrders([data]))
      .finally(() => setLoading(false));
  }, [orderId, orders]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const totalAmount = (orders || []).reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-gray-900">Order placed!</h1>
      <p className="mt-1 text-sm text-gray-500">
        {orders?.length > 1
          ? `Your ${orders.length} orders (from different sellers) have been confirmed.`
          : "Your order has been confirmed."}
      </p>

      <div className="mt-6 w-full max-w-md space-y-3">
        {(orders || []).map((order) => (
          <div key={order._id} className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
              <span>Order #{order._id.slice(-8).toUpperCase()}</span>
              <span className="font-semibold text-green-600">{order.status}</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-1.5">
                <img src={item.image} alt={item.name} className="h-12 w-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    Size {item.size} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">₹{item.price * item.quantity}</p>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-sm font-bold text-gray-900">
              <span>Total</span>
              <span>₹{order.totalAmount}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm font-semibold text-gray-700">Grand total: ₹{totalAmount}</p>

      <div className="mt-6 flex gap-3">
        <Link to="/app/orders" className="flex items-center gap-1.5 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700">
          <Package className="h-4 w-4" /> View Orders
        </Link>
        <Link to="/app" className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
