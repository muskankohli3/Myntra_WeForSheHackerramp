import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Radio, Users, Clock, PlayCircle } from "lucide-react";
import { liveSessionService } from "../../services/liveSessionService";
import { Spinner, EmptyState, Badge } from "../../components/ui/Primitives";

export default function LiveDiscovery() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get("sellerId") || undefined;

  useEffect(() => {
    setLoading(true);
    liveSessionService
      .list(sellerId ? { sellerId } : {})
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const live = sessions.filter((s) => s.status === "live");
  const scheduled = sessions.filter((s) => s.status === "scheduled");
  const ended = sessions.filter((s) => s.status === "ended");

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <h1 className="mb-4 text-xl font-bold text-gray-900">Live Shopping</h1>

      {sessions.length === 0 ? (
        <EmptyState icon={Radio} title="No sessions yet" subtitle="Check back soon — sellers haven't scheduled anything yet." />
      ) : (
        <div className="space-y-8">
          {live.length > 0 && <SessionSection title="Live now" icon={Radio} sessions={live} tone="red" />}
          {scheduled.length > 0 && <SessionSection title="Upcoming" icon={Clock} sessions={scheduled} tone="amber" />}
          {ended.length > 0 && <SessionSection title="Watch replay" icon={PlayCircle} sessions={ended} tone="gray" replay />}
        </div>
      )}
    </div>
  );
}

function SessionSection({ title, icon: Icon, sessions, tone, replay }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Icon className="h-4 w-4" /> {title}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {sessions.map((s) => (
          <Link
            key={s._id}
            to={replay ? `/app/live/${s._id}/replay` : `/app/live/${s._id}`}
            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
              <img src={s.coverImage} alt={s.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              {s.status === "live" ? (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  <span className="live-pulse h-1.5 w-1.5 rounded-full bg-white" /> LIVE
                </span>
              ) : (
                <span className="absolute left-2 top-2">
                  <Badge tone={tone === "amber" ? "amber" : "gray"}>{replay ? "Replay" : "Upcoming"}</Badge>
                </span>
              )}
              {s.status === "live" ? (
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  <Users className="h-2.5 w-2.5" /> {s.viewerCount || 0}
                </span>
              ) : null}
            </div>
            <div className="p-2.5">
              <p className="truncate text-sm font-semibold text-gray-800">{s.title}</p>
              <p className="truncate text-xs text-gray-400">{s.sellerId?.brandName}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
