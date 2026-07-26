import { useState } from "react";
import { Ticket, Check, Copy } from "lucide-react";

// A coupon Promotion (type === "coupon") rendered as a claim-and-copy card.
// Claiming records the customer in Promotion.claimedBy (see
// socketHandler's "promotion-claim") so a seller can see redemption counts
// even though anyone in the room can see the code.
export default function CouponPopup({ promotion, onClaim, claimed }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard?.writeText(promotion.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-3 text-center shadow-lg">
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-600">
        <Ticket className="h-4 w-4" />
        Coupon unlocked!
      </div>
      <p className="mt-1 text-sm font-medium text-gray-700">{promotion.title}</p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="rounded-lg border border-brand-300 bg-white px-3 py-1 font-mono text-sm font-bold tracking-wide text-brand-600">
          {promotion.code}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="rounded-lg bg-white p-1.5 text-brand-500 shadow-sm hover:bg-brand-50"
          aria-label="Copy coupon code"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <button
        type="button"
        onClick={() => onClaim(promotion._id)}
        disabled={claimed}
        className="mt-2 w-full rounded-full bg-brand-500 py-1.5 text-xs font-semibold text-white disabled:bg-gray-300"
      >
        {claimed ? "Claimed ✓" : "Claim now"}
      </button>
    </div>
  );
}
