import { useState } from "react";
import { Tag, Zap, Package2, Gift } from "lucide-react";

const TYPES = [
  { key: "coupon", label: "Coupon", icon: Tag },
  { key: "flash_sale", label: "Flash Sale", icon: Zap },
  { key: "bundle", label: "Bundle", icon: Package2 },
  { key: "bogo", label: "Buy 2 Get 1", icon: Gift },
];

// Covers all three "Promotions" idea-starters (coupon / flash sale /
// bundle-BOGO) with one form whose fields adapt to the selected type — they
// share the same lifecycle server-side (see the Promotion model + the
// "promotion-start" socket handler, which also auto-ends flash sales/coupons
// after `durationSeconds` and notifies the seller's followers).
export default function PromotionsPanel({ products, activePromotions, onStart }) {
  const [type, setType] = useState("coupon");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("LIVE20");
  const [discountPercent, setDiscountPercent] = useState(20);
  const [productId, setProductId] = useState(products?.[0]?._id || "");
  const [durationMin, setDurationMin] = useState(5);

  const selectedProduct = products?.find((p) => p._id === productId);
  const flashPrice = selectedProduct ? Math.round(selectedProduct.price * (1 - discountPercent / 100)) : 0;

  function start() {
    if (!title.trim()) return;
    onStart({
      type,
      title: title.trim(),
      code: type === "coupon" ? code : "",
      discountPercent: Number(discountPercent) || 0,
      productId: type === "flash_sale" || type === "bundle" || type === "bogo" ? productId : undefined,
      flashPrice: type === "flash_sale" ? flashPrice : undefined,
      durationSeconds: Math.max(30, Number(durationMin) * 60),
    });
    setTitle("");
  }

  return (
    <div className="space-y-3 p-3">
      <div className="flex gap-1.5">
        {TYPES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setType(key)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium ${
              type === key ? "bg-brand-500 text-white" : "bg-gray-50 text-gray-500"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={type === "coupon" ? "e.g. 20% off on all kurtas" : "e.g. Flash sale on the pinned product"}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-400"
      />

      {type === "coupon" ? (
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-mono outline-none" />
          <input
            type="number"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none"
          />
          <span className="self-center text-xs text-gray-400">% off</span>
        </div>
      ) : null}

      {(type === "flash_sale" || type === "bundle" || type === "bogo") && products?.length ? (
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none"
        >
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : null}

      {type === "flash_sale" ? (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="number"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 outline-none"
          />
          <span className="text-gray-400">% off → ₹{flashPrice} (was ₹{selectedProduct?.price})</span>
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        Runs for
        <input
          type="number"
          value={durationMin}
          onChange={(e) => setDurationMin(e.target.value)}
          className="w-14 rounded-lg border border-gray-200 px-2 py-1 outline-none"
        />
        minutes
      </div>

      <button onClick={start} className="w-full rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white">
        Start {TYPES.find((t) => t.key === type)?.label}
      </button>

      {activePromotions?.length ? (
        <div className="border-t border-gray-100 pt-2">
          <p className="mb-1.5 text-[11px] font-semibold text-gray-500">Live now</p>
          {activePromotions.map((p) => (
            <div key={p._id} className="mb-1.5 flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs">
              <span className="truncate text-gray-700">{p.title}</span>
              <span className="text-gray-400">{p.claimedBy?.length || 0} claimed</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
