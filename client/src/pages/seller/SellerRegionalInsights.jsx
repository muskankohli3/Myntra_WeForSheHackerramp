import { useEffect, useState } from "react";
import { MapPin, Flame } from "lucide-react";
import { regionalDemandService } from "../../services/regionalDemandService";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../../components/ui/Primitives";
import RegionalDemandMap from "../../components/seller/RegionalDemandMap";

// Bharat idea #3 — full seller-facing Regional Demand board. Leads with
// "demand near you" (your own city/zone in your own category) before the
// seller ever has to explore the full board, since that's the single most
// actionable slice of this data for someone deciding what to stock/promote next.
export default function SellerRegionalInsights() {
  const { seller } = useAuth();
  const [all, setAll] = useState({ rows: [], categories: [] });
  const [mine, setMine] = useState(null);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([regionalDemandService.getAll(), regionalDemandService.getMine()])
      .then(([board, near]) => {
        setAll(board);
        setMine(near);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const filteredRows = category === "All" ? all.rows : all.rows.filter((r) => r.category === category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-1 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-brand-500" />
        <h1 className="text-xl font-bold text-gray-900">Regional Demand</h1>
      </div>
      <p className="mb-5 text-sm text-gray-500">
        Where is demand for your category hottest across Bharat right now — and what's driving it.
      </p>

      {mine?.inMyCity?.length ? (
        <div className="mb-5 rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-brand-600">
            <Flame className="h-3.5 w-3.5" /> Near you in {seller?.city}
          </p>
          <div className="flex flex-wrap gap-3">
            {mine.inMyCity.map((row) => (
              <div key={row._id} className="rounded-xl bg-white px-3 py-2 text-xs shadow-sm">
                <p className="font-semibold text-gray-800">{row.category}</p>
                <p className="text-gray-400">
                  Score {row.demandScore}/100 · {row.trend}
                  {row.festivalTag ? ` · ${row.festivalTag}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <RegionalDemandMap
        rows={filteredRows}
        categories={all.categories}
        myCity={seller?.city}
        selectedCategory={category}
        onSelectCategory={setCategory}
      />
    </div>
  );
}
