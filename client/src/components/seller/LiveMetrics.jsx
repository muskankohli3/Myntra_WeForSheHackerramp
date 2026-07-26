import { Users, HelpCircle, ShoppingCart, Radio, Heart, Package, IndianRupee } from "lucide-react";

export default function LiveMetrics({ viewerCount, questionCount, cartCount, likeCount, orderCount, revenueTotal, status }) {
  const stats = [
    { label: "Viewers", value: viewerCount, icon: Users },
    { label: "Likes", value: likeCount, icon: Heart },
    { label: "Questions", value: questionCount, icon: HelpCircle },
    { label: "Carts", value: cartCount, icon: ShoppingCart },
    { label: "Orders", value: orderCount, icon: Package },
    { label: "Revenue", value: `₹${revenueTotal}`, icon: IndianRupee },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
          status === "live" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-600"
        }`}
      >
        <Radio className="h-3.5 w-3.5" /> {status === "live" ? "LIVE" : "OFFLINE"}
      </span>
      {stats.map(({ label, value, icon: Icon }) => (
        <span key={label} className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
          <Icon className="h-3.5 w-3.5" /> {value} {label}
        </span>
      ))}
    </div>
  );
}
