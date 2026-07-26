import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { recommendationService } from "../../services/recommendationService";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "./ProductCard";
import FollowButton from "./FollowButton";
import { Spinner } from "../ui/Primitives";

// Bharat idea #2 — "This seller near you is selling this" + "People near you
// are buying this", blended with the shopper's own browsing/wishlist history
// rather than a plain city filter (see server/services/growthEngine/recommendationEngine.js
// for the actual scoring — every product here carries a `reason`).
export default function NearbyRecommendations() {
  const { customer } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) {
      setLoading(false);
      return;
    }
    recommendationService
      .getNearby()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [customer]);

  if (!customer || loading) {
    return loading && customer ? (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    ) : null;
  }
  if (!data || (!data.nearbySellers.length && !data.trendingNearYou.length)) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-1.5 px-1">
        <MapPin className="h-4 w-4 text-brand-500" />
        <h2 className="text-sm font-bold text-gray-800">Near You{data.city ? ` in ${data.city}` : ""}</h2>
      </div>

      {data.nearbySellers.length ? (
        <div className="flex gap-3 overflow-x-auto thin-scrollbar px-1 pb-1">
          {data.nearbySellers.map(({ seller, distanceKm, sameCity }) => (
            <div key={seller._id} className="flex w-40 flex-shrink-0 flex-col items-center rounded-2xl border border-gray-100 bg-white p-3 text-center">
              <img src={seller.avatarUrl} alt={seller.brandName} className="mb-2 h-12 w-12 rounded-full" />
              <p className="truncate w-full text-xs font-semibold text-gray-800">{seller.brandName}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {sameCity ? "In your city" : distanceKm !== null ? `${distanceKm} km away` : seller.zone}
              </p>
              <FollowButton sellerId={seller._id} className="mt-2" />
            </div>
          ))}
        </div>
      ) : null}

      {data.trendingNearYou.length ? (
        <div>
          <p className="mb-2 px-1 text-xs font-semibold text-gray-500">Trending near you</p>
          <div className="grid grid-cols-2 gap-3 px-1 sm:grid-cols-3">
            {data.trendingNearYou.map(({ product, reason }) => (
              <div key={product._id}>
                <ProductCard product={product} />
                <p className="mt-1 truncate px-1 text-[11px] text-gray-400">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
