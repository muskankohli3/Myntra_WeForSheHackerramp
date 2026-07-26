import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Radio, RefreshCw, AlertCircle, Check, MapPin, PackageSearch } from "lucide-react";
import { opportunityService } from "../../services/opportunityService";
import { productService } from "../../services/productService";
import { Badge } from "../ui/Primitives";
import Button from "../ui/Button";

const TYPE_META = {
  go_live_now: { icon: Radio, tone: "red", label: "Go Live Opportunity", ring: "#dc2626" },
  revive_sleeping_product: { icon: RefreshCw, tone: "amber", label: "Revive Product", ring: "#d97706" },
  customer_doubt_detected: { icon: AlertCircle, tone: "brand", label: "Customer Doubt", ring: "#e11d48" },
  regional_demand_alert: { icon: MapPin, tone: "green", label: "Regional Demand", ring: "#16a34a" },
  restock_alert: { icon: PackageSearch, tone: "gray", label: "Restock Alert", ring: "#475569" },
};

// Impact-score ring — a quick visual read of "how big is this" before the
// seller reads a single word of AI text, replacing what used to be a plain
// number buried in a badge.
function ImpactRing({ score, color }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-11 w-11 flex-shrink-0">
      <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-700">{score}</span>
    </div>
  );
}

export default function OpportunityCard({ opportunity, onDismiss }) {
  const navigate = useNavigate();
  const meta = TYPE_META[opportunity.type] || TYPE_META.go_live_now;
  const Icon = meta.icon;

  const [why, setWhy] = useState("");
  const [narrative, setNarrative] = useState("");
  const [rewrite, setRewrite] = useState(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(""); // "why" | "narrative" | "rewrite" | "apply" | ""

  async function loadWhy() {
    setLoading("why");
    try {
      const { explanation } = await opportunityService.why(opportunity._id);
      setWhy(explanation);
    } finally {
      setLoading("");
    }
  }

  async function loadNarrative() {
    setLoading("narrative");
    try {
      const { narrative } = await opportunityService.demandNarrative(opportunity._id);
      setNarrative(narrative);
    } finally {
      setLoading("");
    }
  }

  async function loadRewrite() {
    setLoading("rewrite");
    try {
      const { rewrite } = await opportunityService.reviveRewrite(opportunity._id);
      setRewrite(rewrite);
    } finally {
      setLoading("");
    }
  }

  async function applyRewrite() {
    if (!rewrite || !opportunity.productId) return;
    setLoading("apply");
    try {
      await productService.update(opportunity.productId._id, {
        name: rewrite.title,
        description: rewrite.description,
      });
      setApplied(true);
    } finally {
      setLoading("");
    }
  }

  async function handleDismiss() {
    await opportunityService.dismiss(opportunity._id);
    onDismiss?.(opportunity._id);
  }

  function handleGoLive() {
    const params = new URLSearchParams();
    if (opportunity.productId?._id) params.set("productId", opportunity.productId._id);
    params.set("title", opportunity.title.replace("Go Live Now: ", ""));
    navigate(`/seller/live?${params.toString()}`);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4">
      {opportunity.isTopPick ? (
        <span className="absolute right-3 top-3">
          <Badge tone="amber">🏆 Top Pick</Badge>
        </span>
      ) : null}

      <div className="flex items-start gap-3">
        <ImpactRing score={opportunity.impactScore} color={meta.ring} />
        <div className="min-w-0 flex-1">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          <p className="mt-1.5 text-sm font-bold text-gray-900">{opportunity.title}</p>
          <p className="text-xs text-gray-400">{opportunity.subtitle}</p>
        </div>
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl`} style={{ backgroundColor: `${meta.ring}14` }}>
          <Icon className="h-4.5 w-4.5" style={{ color: meta.ring }} />
        </div>
      </div>

      {opportunity.productId ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 p-2">
          <img src={opportunity.productId.images?.[0]} alt="" className="h-10 w-8 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-gray-700">{opportunity.productId.name}</p>
            <p className="text-xs text-gray-400">₹{opportunity.productId.price}</p>
          </div>
        </div>
      ) : null}

      {why ? (
        <div className="mt-3 flex gap-2 rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-700">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <p>{why}</p>
        </div>
      ) : null}
      {narrative ? (
        <div className="mt-3 flex gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium leading-relaxed text-red-700">
          <span>🔥</span>
          <p>{narrative}</p>
        </div>
      ) : null}
      {rewrite ? (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          <p className="font-bold">{rewrite.title}</p>
          <p className="mt-1">{rewrite.description}</p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={loadWhy} loading={loading === "why"}>
          <Sparkles className="h-3.5 w-3.5" /> Why?
        </Button>

        {opportunity.type === "go_live_now" ? (
          <>
            <Button size="sm" variant="ghost" onClick={loadNarrative} loading={loading === "narrative"}>
              <Radio className="h-3.5 w-3.5" /> Demand Signal
            </Button>
            <Button size="sm" onClick={handleGoLive}>
              Go Live Now
            </Button>
          </>
        ) : null}

        {opportunity.type === "revive_sleeping_product" ? (
          <>
            <Button size="sm" variant="ghost" onClick={loadRewrite} loading={loading === "rewrite"}>
              <RefreshCw className="h-3.5 w-3.5" /> AI Rewrite
            </Button>
            {rewrite ? (
              <Button size="sm" onClick={applyRewrite} loading={loading === "apply"} disabled={applied}>
                {applied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Applied
                  </>
                ) : (
                  "Apply to listing"
                )}
              </Button>
            ) : null}
          </>
        ) : null}

        {opportunity.type === "regional_demand_alert" ? (
          <Button size="sm" onClick={() => navigate("/seller/insights")}>
            <MapPin className="h-3.5 w-3.5" /> View Regional Board
          </Button>
        ) : null}

        <button onClick={handleDismiss} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
          <X className="h-3.5 w-3.5" /> Dismiss
        </button>
      </div>
    </div>
  );
}
