import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Radio, Flame } from "lucide-react";
import { productService } from "../../services/productService";
import { liveSessionService } from "../../services/liveSessionService";
import { Spinner, EmptyState } from "../../components/ui/Primitives";
import ProductCard from "../../components/customer/ProductCard";
import LiveNowStrip from "../../components/customer/LiveNowStrip";
import NearbyRecommendations from "../../components/customer/NearbyRecommendations";

const CATEGORIES = ["All", "T-Shirts", "Bottoms", "Footwear", "Kurtas", "Jackets", "Hoodies", "Shirts", "Dresses", "Accessories"];

export default function CustomerHome() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [category, setCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productService.list({ category, search }),
      liveSessionService.list({ status: "live" }),
    ])
      .then(([productData, liveData]) => {
        setProducts(productData);
        setLiveSessions(liveData);
      })
      .finally(() => setLoading(false));
  }, [category, search]);

  const heading = useMemo(() => (search ? `Results for "${search}"` : "Discover"), [search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      {liveSessions.length > 0 && <LiveNowStrip sessions={liveSessions} />}

      {!search ? (
        <div className="mt-4">
          <NearbyRecommendations />
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{heading}</h2>
        <Link to="/app/live" className="flex items-center gap-1 text-sm font-semibold text-brand-600">
          <Radio className="h-4 w-4" /> All live sessions
        </Link>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2 thin-scrollbar">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              category === c
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-brand-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
        <Flame className="h-3.5 w-3.5" /> Trending picks curated from live seller activity
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : products.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No products found" subtitle="Try a different category or search term." />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
