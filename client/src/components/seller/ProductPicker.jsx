export default function ProductPicker({ products, pinnedProductId, onPin }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3">
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-gray-500">Pin a product</p>
      <div className="flex gap-2 overflow-x-auto pb-1 thin-scrollbar">
        {products.map((p) => {
          const isPinned = pinnedProductId === p._id;
          return (
            <button
              key={p._id}
              onClick={() => onPin(isPinned ? null : p._id)}
              className={`flex-shrink-0 overflow-hidden rounded-xl border-2 text-left transition-colors ${
                isPinned ? "border-brand-500" : "border-transparent"
              }`}
              style={{ width: 90 }}
            >
              <img src={p.images?.[0]} alt={p.name} className="h-24 w-full object-cover" />
              <div className="bg-gray-50 px-1.5 py-1">
                <p className="truncate text-[10px] font-semibold text-gray-700">{p.name}</p>
                <p className="text-[10px] font-bold text-brand-600">₹{p.price}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
