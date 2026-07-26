import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Radio, PlayCircle, HelpCircle, ShoppingBag, BarChart3, Compass } from "lucide-react";
import { liveSessionService } from "../../services/liveSessionService";
import { pollService } from "../../services/pollService";
import { Spinner } from "../../components/ui/Primitives";
import AddToCartSheet from "../../components/customer/AddToCartSheet";
import FollowButton from "../../components/customer/FollowButton";
import StockBadge from "../../components/shared/StockBadge";

export default function Replay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState(null);

  useEffect(() => {
    Promise.all([liveSessionService.getReplay(id), pollService.getForSession(id).catch(() => [])]).then(
      ([replayData, pollData]) => {
        setData(replayData);
        setPolls(pollData);
        setLoading(false);
      }
    );
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Spinner className="h-8 w-8 border-white" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-black text-white">
        <p>Replay not found.</p>
        <button onClick={() => navigate("/app/live")} className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold">
          Back to Live
        </button>
      </div>
    );
  }

  const { session, comments } = data;
  const products = session.productIds?.length ? session.productIds : session.pinnedProductId ? [session.pinnedProductId] : [];

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-black text-white">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button onClick={() => navigate("/app/live")} className="rounded-full bg-white/10 p-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{session.title}</p>
          <p className="truncate text-xs text-white/50">{session.sellerId?.brandName}</p>
        </div>
        {session.sellerId?._id ? <FollowButton sellerId={session.sellerId._id} /> : null}
      </div>

      {/* Clear "this is over" framing, per the request that this shouldn't feel like a frozen live screen */}
      <div className="relative mx-4 mt-4 aspect-video overflow-hidden rounded-2xl bg-gray-900">
        <img src={session.coverImage} alt={session.title} className="h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
            <Radio className="h-3.5 w-3.5" /> LIVE ENDED
          </span>
          <PlayCircle className="mt-1 h-10 w-10 text-white/60" />
          <p className="text-xs text-white/40">
            Peak viewers: {session.peakViewerCount} · {session.totalOrders} orders placed live
          </p>
        </div>
      </div>

      {session.aiInsight ? (
        <div className="mx-4 mt-3 rounded-xl bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
          <span className="font-semibold text-brand-300">AI recap: </span>
          {session.aiInsight}
        </div>
      ) : null}

      {/* Everything shown in the stream, still shoppable */}
      {products.length ? (
        <div className="mx-4 mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
            <ShoppingBag className="h-3.5 w-3.5" /> Shown in this stream
          </p>
          <div className="space-y-2">
            {products.map((product) => (
              <button
                key={product._id}
                onClick={() => setActiveProduct(product)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left text-gray-900 shadow-lg"
              >
                <img src={product.images?.[0]} alt={product.name} className="h-14 w-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-brand-600">₹{product.price}</p>
                    <StockBadge product={product} />
                  </div>
                </div>
                <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white">
                  <ShoppingBag className="h-3.5 w-3.5" /> Shop
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Final poll results, if the seller ran any */}
      {polls.length ? (
        <div className="mx-4 mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
            <BarChart3 className="h-3.5 w-3.5" /> Poll results
          </p>
          <div className="space-y-2">
            {polls.map((poll) => {
              const total = poll.options.reduce((sum, o) => sum + o.votes, 0);
              return (
                <div key={poll._id} className="rounded-xl bg-white/5 p-3">
                  <p className="mb-1.5 text-xs font-semibold">{poll.question}</p>
                  {poll.options.map((o) => (
                    <div key={o.text} className="mb-1 flex items-center justify-between text-[11px] text-white/60">
                      <span>{o.text}</span>
                      <span>
                        {total ? Math.round((o.votes / total) * 100) : 0}% ({o.votes})
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex-1 px-4 pb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Chat replay</p>
        {comments.length === 0 ? (
          <p className="text-xs text-white/30">No chat messages during this stream.</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="mb-1.5 flex items-start gap-1.5 text-xs">
              <span className={`font-bold ${c.authorRole === "seller" ? "text-brand-400" : "text-white/90"}`}>
                {c.author}
                {c.isQuestion ? <HelpCircle className="ml-1 inline h-3 w-3 text-amber-400" /> : null}:
              </span>
              <span className="text-white/80">{c.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="sticky bottom-0 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate("/app/live")}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 py-2.5 text-sm font-semibold"
        >
          <Compass className="h-4 w-4" /> Browse more live streams
        </button>
      </div>

      <AddToCartSheet product={activeProduct} isOpen={Boolean(activeProduct)} onClose={() => setActiveProduct(null)} />
    </div>
  );
}