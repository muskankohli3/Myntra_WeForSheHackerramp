import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, Radio, Store, ShoppingBag } from "lucide-react";
import { productService } from "../../services/productService";
import { sellerService } from "../../services/sellerService";
import { liveSessionService } from "../../services/liveSessionService";
import { Spinner } from "../ui/Primitives";

const TABS = [
  { key: "products", label: "Products", icon: ShoppingBag },
  { key: "sellers", label: "Sellers", icon: Store },
  { key: "live", label: "Live", icon: Radio },
];

// A single search box that fans out to three endpoints in parallel rather
// than one aggregating backend route — keeps each controller simple (they
// already each accept a `search` query param) and lets the overlay render
// results per-tab as each call resolves instead of waiting on all three.
export default function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("products");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ products: [], sellers: [], live: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults({ products: [], sellers: [], live: [] });
      return undefined;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      Promise.all([
        productService.list({ search: trimmed }).catch(() => []),
        sellerService.list({ search: trimmed }).catch(() => []),
        liveSessionService.list({ search: trimmed }).catch(() => []),
      ]).then(([products, sellers, live]) => {
        setResults({ products: products.slice(0, 12), sellers: sellers.slice(0, 12), live: live.slice(0, 12) });
        setLoading(false);
      });
    }, 300); // debounce
    return () => clearTimeout(timeout);
  }, [query]);

  const activeResults = results[tab];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, sellers, live streams..."
          className="flex-1 border-none text-sm outline-none placeholder:text-gray-400"
        />
        <button type="button" onClick={onClose} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex border-b border-gray-100">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium ${
              tab === key ? "border-b-2 border-brand-500 text-brand-500" : "text-gray-400"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label} {results[key].length ? `(${results[key].length})` : ""}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : query.trim().length < 2 ? (
          <p className="py-10 text-center text-sm text-gray-400">Type at least 2 characters to search.</p>
        ) : activeResults.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No {tab} found for "{query}".</p>
        ) : tab === "products" ? (
          <div className="grid grid-cols-2 gap-3">
            {activeResults.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/app?product=${p._id}`);
                }}
                className="rounded-xl border border-gray-100 p-2 text-left hover:border-brand-200"
              >
                <img src={p.images?.[0]} alt={p.name} className="mb-1.5 h-28 w-full rounded-lg object-cover" />
                <p className="truncate text-xs font-medium text-gray-800">{p.name}</p>
                <p className="text-xs font-semibold text-brand-500">₹{p.price}</p>
              </button>
            ))}
          </div>
        ) : tab === "sellers" ? (
          <div className="space-y-2">
            {activeResults.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/app/live?sellerId=${s._id}`);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left hover:border-brand-200"
              >
                <img src={s.avatarUrl} alt={s.brandName} className="h-10 w-10 rounded-full" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{s.brandName}</p>
                  <p className="text-xs text-gray-400">{s.city ? `${s.city}, ${s.state}` : s.category}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {activeResults.map((session) => (
              <button
                key={session._id}
                type="button"
                onClick={() => {
                  onClose();
                  navigate(session.status === "ended" ? `/app/live/${session._id}/replay` : `/app/live/${session._id}`);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left hover:border-brand-200"
              >
                <img src={session.coverImage} alt={session.title} className="h-12 w-16 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{session.title}</p>
                  <p className="text-xs text-gray-400">{session.sellerId?.brandName} · {session.status}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
