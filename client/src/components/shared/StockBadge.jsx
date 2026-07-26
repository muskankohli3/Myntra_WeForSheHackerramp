// "Only N left" — reads real per-size stock (see Product.sizeStock), updated
// live during a stream via the "stock-update" socket event in useLiveRoom.
export default function StockBadge({ product, size, className = "" }) {
  if (!product) return null;

  let remaining = product.stock;
  if (size && product.sizeStock?.length) {
    const entry = product.sizeStock.find((s) => s.size === size);
    if (entry) remaining = entry.quantity;
  }

  if (remaining === undefined || remaining === null || remaining > 10) return null;

  const isOut = remaining <= 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isOut ? "bg-gray-200 text-gray-500" : "bg-orange-100 text-orange-600"
      } ${className}`}
    >
      {isOut ? "Out of stock" : `Only ${remaining} left`}
    </span>
  );
}
