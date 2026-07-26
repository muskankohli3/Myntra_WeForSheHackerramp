import { TrendingUp } from "lucide-react";

export default function WelcomeBanner({ seller }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white sm:flex-row sm:items-center">
      <div>
        <p className="text-sm text-white/60">Welcome back,</p>
        <h1 className="text-2xl font-bold">{seller?.brandName}</h1>
        <p className="mt-1 text-sm text-white/50">{seller?.tier}</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3">
        <TrendingUp className="h-6 w-6 text-brand-400" />
        <div>
          <p className="text-xs text-white/50">Growth Score</p>
          <p className="text-2xl font-bold">{seller?.growthScore}<span className="text-sm text-white/40">/100</span></p>
        </div>
      </div>
    </div>
  );
}
