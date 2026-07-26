import { Wallet, ShoppingCart, RotateCcw, Star, Package } from "lucide-react";
import { Card } from "../ui/Primitives";

export default function BusinessHealthCard({ health }) {
  if (!health) return null;

  const stats = [
    { label: "Orders this week", value: health.ordersThisWeek, icon: ShoppingCart },
    { label: "Revenue this week", value: `₹${health.revenueThisWeek.toLocaleString("en-IN")}`, icon: Wallet },
    { label: "Return rate", value: `${health.returnRate}%`, icon: RotateCcw },
    { label: "Rating", value: health.ratingAverage.toFixed(1), icon: Star },
    { label: "Fill rate", value: `${health.fillRate}%`, icon: Package },
  ];

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Business Health</p>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">{health.tier}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-gray-50 p-3">
            <Icon className="mb-1.5 h-4 w-4 text-gray-400" />
            <p className="text-base font-bold text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
          <span>Progress to next tier</span>
          <span>{health.tierProgress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${health.tierProgress}%` }} />
        </div>
      </div>
    </Card>
  );
}
