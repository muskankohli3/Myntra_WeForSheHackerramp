import { Languages } from "lucide-react";
import { hasBothNamings } from "../../utils/productDisplay";

// Small pill shown next to a product's name wherever both a local and a
// global presentation exist — lets a shopper flip between "Bandhani Odhna
// Kurti" and "Tie-Dye Kurta" without losing the default the app already
// picked for them based on their own city (see productDisplay.js).
export default function NameToggle({ product, mode, onToggle, className = "" }) {
  if (!hasBothNamings(product)) return null;
  const otherLabel = mode === "local" ? "Global name" : "Local name";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(mode === "local" ? "global" : "local");
      }}
      className={`inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-200 ${className}`}
      title="Toggle between the seller's local name and the global name for this product"
    >
      <Languages className="h-3 w-3" />
      {otherLabel}
    </button>
  );
}
