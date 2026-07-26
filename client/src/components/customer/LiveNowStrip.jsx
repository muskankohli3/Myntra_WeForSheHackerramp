import { Link } from "react-router-dom";
import { Radio, Users } from "lucide-react";

export default function LiveNowStrip({ sessions }) {
  return (
    <div className="mb-2">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-900">
        <span className="live-pulse flex h-2 w-2 rounded-full bg-red-500" />
        Live now
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 thin-scrollbar">
        {sessions.map((s) => (
          <Link
            key={s._id}
            to={`/app/live/${s._id}`}
            className="relative flex-shrink-0 overflow-hidden rounded-2xl"
            style={{ width: 130, height: 170 }}
          >
            <img src={s.coverImage} alt={s.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
              <Radio className="h-2.5 w-2.5" /> LIVE
            </span>
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold text-white">
              <Users className="h-2.5 w-2.5" /> {s.viewerCount || 0}
            </span>
            <div className="absolute bottom-2 left-2 right-2">
              <p className="truncate text-xs font-bold text-white">{s.title}</p>
              <p className="truncate text-[10px] text-white/70">{s.sellerId?.brandName}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
