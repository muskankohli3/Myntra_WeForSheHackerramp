import { useMemo, useState } from "react";
import { Flame, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { regionalDemandService } from "../../services/regionalDemandService";

// Bharat idea #3 — a seller-facing "where is demand hot right now" board.
// Deliberately NOT a traced India coastline (that needs real GIS data we
// don't have here and would risk looking subtly wrong) — instead an honest,
// clearly-labelled geo-scatter: each city is plotted at its real relative
// lat/lng position within a bounding box, sized by demand score, colored by
// intensity, so the *layout* is genuinely geographic even though the
// background is an abstract card, not a map graphic.
const LAT_RANGE = [8, 35];
const LNG_RANGE = [68, 97];
const VIEW_W = 360;
const VIEW_H = 400;

function project(lat, lng) {
  const x = ((lng - LNG_RANGE[0]) / (LNG_RANGE[1] - LNG_RANGE[0])) * VIEW_W;
  const y = VIEW_H - ((lat - LAT_RANGE[0]) / (LAT_RANGE[1] - LAT_RANGE[0])) * VIEW_H;
  return { x, y };
}

function colorForScore(score) {
  if (score >= 75) return "#e11d48"; // hot — brand-500
  if (score >= 55) return "#f97316"; // warm — orange-500
  if (score >= 35) return "#f59e0b"; // mild — amber-500
  return "#94a3b8"; // cool — slate-400
}

const TREND_ICON = { rising: TrendingUp, falling: TrendingDown, steady: Minus };

export default function RegionalDemandMap({ rows, categories, myCity, onSelectCategory, selectedCategory }) {
  const [selectedId, setSelectedId] = useState(null);
  const [narrative, setNarrative] = useState("");
  const [loadingNarrative, setLoadingNarrative] = useState(false);

  const selected = rows.find((r) => r._id === selectedId);
  const topFive = useMemo(() => [...rows].sort((a, b) => b.demandScore - a.demandScore).slice(0, 5), [rows]);

  async function selectRow(row) {
    setSelectedId(row._id);
    setNarrative(row.signalNote || "");
    if (!row.signalNote) {
      setLoadingNarrative(true);
      try {
        const { narrative: text } = await regionalDemandService.getNarrative(row._id);
        setNarrative(text);
      } catch {
        setNarrative("");
      } finally {
        setLoadingNarrative(false);
      }
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-2xl border border-gray-100 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500">
            Bubble size &amp; color = demand intensity · position = real city location (stylized, not to map scale)
          </p>
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none"
          >
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full rounded-xl bg-gradient-to-b from-brand-50/40 to-white">
          {/* Faint directional grid — reads as "map-like" without claiming to be a traced coastline */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={`h${f}`} x1="0" y1={VIEW_H * f} x2={VIEW_W} y2={VIEW_H * f} stroke="#f1f5f9" strokeWidth="1" />
          ))}
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={`v${f}`} x1={VIEW_W * f} y1="0" x2={VIEW_W * f} y2={VIEW_H} stroke="#f1f5f9" strokeWidth="1" />
          ))}
          <text x="6" y="14" fontSize="9" fill="#cbd5e1" fontWeight="600">N</text>
          <text x="6" y={VIEW_H - 6} fontSize="9" fill="#cbd5e1" fontWeight="600">S</text>

          {rows.map((row) => {
            const { x, y } = project(row.lat, row.lng);
            const radius = 3 + (row.demandScore / 100) * 7;
            const isMine = myCity && row.city === myCity;
            return (
              <g key={row._id} onClick={() => selectRow(row)} className="cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={colorForScore(row.demandScore)}
                  opacity={selectedId === row._id ? 1 : 0.75}
                  stroke={isMine ? "#111827" : selectedId === row._id ? "#111827" : "none"}
                  strokeWidth={isMine ? 1.5 : 1}
                />
                {row.festivalTag ? <circle cx={x} cy={y} r={radius + 2.5} fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="1.5,1.5" /> : null}
              </g>
            );
          })}
        </svg>

        <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#e11d48]" /> Hot (75+)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f97316]" /> Warm</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Mild</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#94a3b8]" /> Cool</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-dashed border-amber-500" /> Festival</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          {selected ? (
            <>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">{selected.city}, {selected.state}</p>
                {(() => {
                  const Icon = TREND_ICON[selected.trend] || Minus;
                  return <Icon className={`h-4 w-4 ${selected.trend === "rising" ? "text-green-500" : selected.trend === "falling" ? "text-red-400" : "text-gray-400"}`} />;
                })()}
              </div>
              <p className="mb-2 text-xs text-gray-500">{selected.category} · demand score {selected.demandScore}/100 · {selected.trend}</p>
              {selected.festivalTag ? (
                <p className="mb-2 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Flame className="h-3.5 w-3.5" /> {selected.festivalTag} is driving a surge here
                </p>
              ) : null}
              <div className="rounded-xl bg-brand-50 p-3 text-xs text-gray-700">
                <p className="mb-1 flex items-center gap-1 font-semibold text-brand-600">
                  <Sparkles className="h-3.5 w-3.5" /> Growth engine says
                </p>
                {loadingNarrative ? "Thinking..." : narrative}
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-xs text-gray-400">Tap a bubble to see what's driving demand there.</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="mb-2 text-xs font-semibold text-gray-500">Top 5 signals right now</p>
          <div className="space-y-1.5">
            {topFive.map((row) => (
              <button
                key={row._id}
                onClick={() => selectRow(row)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs hover:bg-gray-50"
              >
                <span className="text-gray-700">{row.city} · {row.category}</span>
                <span className="font-semibold" style={{ color: colorForScore(row.demandScore) }}>
                  {row.demandScore}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
