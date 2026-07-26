import { useEffect, useState } from "react";
import { Sparkles, Truck, Ruler, Shield, MessageCircle, TrendingDown, Package, ShoppingCart } from "lucide-react";

const ICONS = {
  truck: Truck,
  ruler: Ruler,
  shield: Shield,
  sparkles: Sparkles,
  "message-circle": MessageCircle,
  "trending-down": TrendingDown,
  package: Package,
  "shopping-cart": ShoppingCart,
};

// Displays the deterministic Live Assistant tips computed server-side every
// ~20s (see server/services/growthEngine/liveAssistant.js) — intentionally
// NOT framed as a chatbot; each tip is a short, concrete nudge with a reason
// baked in, and a small running history so the seller can glance back at
// what they've already acted on.
export default function LiveAssistantPanel({ tip, onDismiss }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (tip) setHistory((prev) => [tip, ...prev].slice(0, 8));
  }, [tip]);

  if (!history.length) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center">
        <Sparkles className="h-8 w-8 text-gray-200" />
        <p className="text-xs text-gray-400">Growth tips will appear here once your stream picks up activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {history.map((t, i) => {
        const Icon = ICONS[t.icon] || Sparkles;
        return (
          <div
            key={`${t.type}-${i}`}
            className={`flex gap-2.5 rounded-xl border p-3 ${i === 0 ? "border-brand-200 bg-brand-50" : "border-gray-100 bg-white opacity-70"}`}
          >
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${i === 0 ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-400"}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs leading-snug text-gray-700">{t.text}</p>
            {i === 0 && onDismiss ? (
              <button onClick={onDismiss} className="ml-auto flex-shrink-0 self-start text-[11px] text-gray-400 hover:text-gray-600">
                Got it
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
