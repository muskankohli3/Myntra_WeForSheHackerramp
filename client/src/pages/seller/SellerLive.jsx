import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Radio, Plus, X, PlayCircle, Clock, CheckCircle2, CalendarClock } from "lucide-react";
import { liveSessionService } from "../../services/liveSessionService";
import { productService } from "../../services/productService";
import { Spinner, EmptyState, Badge } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";

function defaultScheduleValue() {
  const d = new Date(Date.now() + 60 * 60 * 1000); // an hour from now, sensible default
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function SellerLive() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(Boolean(searchParams.get("productId")) || false);
  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [description, setDescription] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState(
    searchParams.get("productId") ? [searchParams.get("productId")] : []
  );
  const [scheduleMode, setScheduleMode] = useState("now"); // "now" | "later"
  const [scheduledFor, setScheduledFor] = useState(defaultScheduleValue());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([liveSessionService.getMine(), productService.getMine()])
      .then(([s, p]) => {
        setSessions(s);
        setProducts(p);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleProduct(id) {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const session = await liveSessionService.create({
        title: title.trim(),
        description,
        coverImage: products.find((p) => selectedProductIds.includes(p._id))?.images?.[0] || "",
        productIds: selectedProductIds,
        scheduledFor: scheduleMode === "later" ? new Date(scheduledFor).toISOString() : new Date().toISOString(),
      });
      if (scheduleMode === "now") {
        navigate(`/seller/live/${session._id}/prep`);
      } else {
        setSessions((prev) => [session, ...prev]);
        setFormOpen(false);
        setTitle("");
        setDescription("");
        setSelectedProductIds([]);
      }
    } finally {
      setCreating(false);
    }
  }

  const STATUS_META = {
    scheduled: { icon: Clock, tone: "amber", cta: "Prep & Go Live", to: (id) => `/seller/live/${id}/prep` },
    live: { icon: Radio, tone: "red", cta: "Resume Studio", to: (id) => `/seller/live/${id}/studio` },
    ended: { icon: CheckCircle2, tone: "gray", cta: "View Analytics", to: () => `/seller/analytics` },
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Live Studio</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> New Live Session
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No live sessions yet"
          subtitle="Create your first live session to start selling in real time."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> New Live Session
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {sessions.map((s) => {
            const meta = STATUS_META[s.status];
            const Icon = meta.icon;
            return (
              <div key={s._id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                <div className="relative aspect-video w-full bg-gray-100">
                  {s.coverImage ? <img src={s.coverImage} alt={s.title} className="h-full w-full object-cover" /> : null}
                  <span className="absolute left-2 top-2">
                    <Badge tone={meta.tone}>
                      <Icon className="h-3 w-3" /> {s.status}
                    </Badge>
                  </span>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-gray-800">{s.title}</p>
                  {s.status === "scheduled" && s.scheduledFor ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
                      <CalendarClock className="h-3 w-3" /> {new Date(s.scheduledFor).toLocaleString()}
                    </p>
                  ) : null}
                  <p className="text-xs text-gray-400">{(s.productIds || []).length} products linked</p>
                  <Link to={meta.to(s._id)}>
                    <Button size="sm" className="mt-2 w-full">
                      {meta.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setFormOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Live Session</h2>
              <button onClick={() => setFormOpen(false)} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-500">Session title</span>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-500">Description</span>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-gray-500">When?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleMode("now")}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold ${
                      scheduleMode === "now" ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-200 text-gray-500"
                    }`}
                  >
                    Go live now
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("later")}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold ${
                      scheduleMode === "later" ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-200 text-gray-500"
                    }`}
                  >
                    Schedule for later
                  </button>
                </div>
                {scheduleMode === "later" ? (
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                  />
                ) : null}
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-gray-500">
                  Products to showcase ({selectedProductIds.length} selected)
                </span>
                {products.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    You don't have any products yet.{" "}
                    <Link to="/seller/products" className="font-semibold text-brand-600">
                      Add products first
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto thin-scrollbar">
                    {products.map((p) => {
                      const selected = selectedProductIds.includes(p._id);
                      return (
                        <button
                          type="button"
                          key={p._id}
                          onClick={() => toggleProduct(p._id)}
                          className={`overflow-hidden rounded-xl border-2 text-left ${
                            selected ? "border-brand-500" : "border-transparent"
                          }`}
                        >
                          <img src={p.images?.[0]} alt={p.name} className="aspect-square w-full object-cover" />
                          <p className="truncate bg-gray-50 px-1.5 py-1 text-[10px] font-medium text-gray-600">{p.name}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" loading={creating}>
                {scheduleMode === "now" ? (
                  <>
                    <PlayCircle className="h-4 w-4" /> Create & Prep
                  </>
                ) : (
                  <>
                    <CalendarClock className="h-4 w-4" /> Schedule Session
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
