import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { productService } from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import { defaultNamingMode, resolveProductNaming } from "../../utils/productDisplay";
import NameToggle from "../shared/NameToggle";
import StockBadge from "../shared/StockBadge";
import AddToCartSheet from "./AddToCartSheet";

export default function ProductCard({ product }) {
  const { customer } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [nameMode, setNameMode] = useState(() => defaultNamingMode(product, customer));

  function openSheet() {
    productService.registerImpression(product._id).catch(() => {});
    setSheetOpen(true);
  }

  const discountPct = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const { name: displayName } = resolveProductNaming(product, nameMode);

  return (
    <>
      <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <button onClick={openSheet} className="block w-full text-left">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
            <img
              src={product.images?.[0]}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {discountPct > 0 ? (
              <span className="absolute left-2 top-2 rounded-md bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {discountPct}% OFF
              </span>
            ) : null}
            <StockBadge product={product} className="absolute right-2 top-2" />
          </div>
          <div className="p-2.5">
            <p className="truncate text-xs font-semibold text-gray-500">{product.brand}</p>
            <p className="truncate text-sm font-medium text-gray-800">{displayName}</p>
            {product.ratingCount > 0 ? (
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {product.ratingAverage} ({product.ratingCount})
              </div>
            ) : null}
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-sm font-bold text-gray-900">₹{product.price}</p>
              {product.mrp ? <p className="text-xs text-gray-400 line-through">₹{product.mrp}</p> : null}
            </div>
            <NameToggle product={product} mode={nameMode} onToggle={setNameMode} className="mt-1" />
          </div>
        </button>
        <button
          onClick={openSheet}
          className="mx-2.5 mb-2.5 flex w-[calc(100%-1.25rem)] items-center justify-center gap-1 rounded-full border border-brand-500 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      <AddToCartSheet product={product} isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
