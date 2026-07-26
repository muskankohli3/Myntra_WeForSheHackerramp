import { useEffect, useState } from "react";
import { BarChart3, Eye, HelpCircle, ShoppingCart, Wallet, Sparkles, Percent, Clock, Trophy } from "lucide-react";
import { liveSessionService } from "../../services/liveSessionService";
import { analyticsService } from "../../services/analyticsService";
import { Spinner, EmptyState, Card } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";

export default function SellerAnalytics() {
  const [summary, setSummary] = useState(null); // { totals, records, topProducts }
  const [rows, setRows] = useState([]); // [{ session, analytics }]
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
    Promise.all([
      analyticsService.getMine(),
      liveSessionService.getMine().then(async (sessions) => {
        const ended = sessions.filter((s) => s.status === "ended");
        return Promise.all(
          ended.map(async (session) => {
            try {
              const analytics = await analyticsService.getForSession(session._id);
              return { session, analytics };
            } catch {
              return { session, analytics: null };
            }
          })
        );
      }),
    ]).then(([summaryData, withAnalytics]) => {
      setSummary(summaryData);
      setRows(withAnalytics);
      setLoading(false);
    });
  }, []);

  async function handleGenerateInsight(sessionId) {
    setGenerating(sessionId);
    try {
      const { insight } = await analyticsService.generateInsight(sessionId);
      setRows((prev) =>
        prev.map((r) => (r.session._id === sessionId ? { ...r, analytics: { ...r.analytics, aiInsight: insight } } : r))
      );
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const totals = summary?.totals || { views: 0, questionsAsked: 0, addToCarts: 0, purchases: 0, revenue: 0, conversionRate: 0, avgWatchTimeSeconds: 0 };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-5 flex items-center gap-2 text-xl font-bold text-gray-900">
        <BarChart3 className="h-5 w-5 text-brand-500" /> Analytics
      </h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatBox icon={Eye} label="Total views" value={totals.views} />
        <StatBox icon={HelpCircle} label="Questions" value={totals.questionsAsked} />
        <StatBox icon={ShoppingCart} label="Add to carts" value={totals.addToCarts} />
        <StatBox icon={ShoppingCart} label="Orders" value={totals.purchases} />
        <StatBox icon={Wallet} label="Revenue" value={`₹${totals.revenue.toLocaleString("en-IN")}`} />
        <StatBox icon={Percent} label="Conversion rate" value={`${totals.conversionRate}%`} />
        <StatBox icon={Clock} label="Avg watch time" value={`${Math.round(totals.avgWatchTimeSeconds / 60)}m`} />
      </div>

      {summary?.topProducts?.length ? (
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <Trophy className="h-4 w-4 text-amber-500" /> Top products
          </p>
          <div className="space-y-2">
            {summary.topProducts.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-2">
                <span className="w-4 text-center text-xs font-bold text-gray-400">{i + 1}</span>
                <img src={p.image} alt={p.name} className="h-10 w-8 rounded-lg object-cover" />
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700">{p.name}</p>
                <p className="text-xs text-gray-400">{p.unitsSold} sold</p>
                <p className="text-xs font-bold text-brand-600">₹{p.revenue.toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="No completed sessions yet" subtitle="End a live session to see its performance here." />
      ) : (
        <div className="space-y-3">
          {rows.map(({ session, analytics }) => (
            <Card key={session._id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{session.title}</p>
                  <p className="text-xs text-gray-400">
                    {session.startedAt ? new Date(session.startedAt).toLocaleString() : ""} · Peak{" "}
                    {session.peakViewerCount} viewers
                  </p>
                </div>
                <div className="flex gap-4 text-sm">
                  <Metric label="Views" value={analytics?.views ?? session.totalViews} />
                  <Metric label="Questions" value={analytics?.questionsAsked ?? session.totalQuestions} />
                  <Metric label="Carts" value={analytics?.addToCarts ?? session.totalAddToCarts} />
                  <Metric label="Orders" value={analytics?.purchases ?? session.totalOrders} />
                  <Metric label="Conv." value={`${analytics?.conversionRate ?? 0}%`} />
                </div>
              </div>

              {analytics?.aiInsight ? (
                <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-brand-50 p-3 text-xs text-brand-700">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" /> {analytics.aiInsight}
                </p>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => handleGenerateInsight(session._id)}
                  loading={generating === session._id}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Generate AI Insight
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3">
      <Icon className="mb-1.5 h-4 w-4 text-gray-400" />
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="text-center">
      <p className="font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
