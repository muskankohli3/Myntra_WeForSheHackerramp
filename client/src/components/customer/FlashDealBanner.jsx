import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

function formatCountdown(msRemaining) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

// One flash-sale Promotion doc in, a live-ticking countdown banner out.
// Disappears on its own once the server broadcasts "promotion-ended" (see
// useLiveRoom), which also happens automatically via the server-side timer
// in socketHandler.js even if nobody's watching the clock.
export default function FlashDealBanner({ promotion, product }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const msRemaining = new Date(promotion.endsAt).getTime() - now;
  if (msRemaining <= 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-500 to-orange-500 px-3 py-2 text-white shadow-lg">
      <Flame className="h-5 w-5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{promotion.title}</p>
        {product ? (
          <p className="text-[11px] opacity-90">
            <span className="line-through opacity-70">₹{product.price}</span> → <span className="font-bold">₹{promotion.flashPrice}</span>
          </p>
        ) : null}
      </div>
      <div className="rounded-lg bg-white/20 px-2 py-1 font-mono text-sm font-bold tabular-nums">{formatCountdown(msRemaining)}</div>
    </div>
  );
}
