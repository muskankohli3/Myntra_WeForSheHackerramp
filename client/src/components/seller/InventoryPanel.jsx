import { Package } from "lucide-react";

// Live Inventory panel — shows per-size stock for every product in this
// session, refreshed in real time as orders come in (see the "stock-update"
// socket event wired up in useLiveRoom / orderController).
export default function InventoryPanel({ products, stockByProductId }) {
  if (!products?.length) {
    return <p className="p-4 text-center text-xs text-gray-400">No products added to this session yet.</p>;
  }

  return (
    <div className="space-y-3 p-3">
      {products.map((product) => {
        const live = stockByProductId?.[product._id];
        const sizeStock = live?.sizeStock || product.sizeStock || [];
        return (
          <div key={product._id} className="rounded-xl border border-gray-100 p-2.5">
            <div className="mb-1.5 flex items-center gap-2">
              <img src={product.images?.[0]} alt={product.name} className="h-8 w-7 rounded object-cover" />
              <p className="truncate text-xs font-semibold text-gray-800">{product.name}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sizeStock.map((s) => (
                <span
                  key={s.size}
                  className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                    s.quantity <= 3 ? "bg-red-50 text-red-500" : s.quantity <= 8 ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <Package className="h-2.5 w-2.5" />
                  {s.size}: {s.quantity}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
