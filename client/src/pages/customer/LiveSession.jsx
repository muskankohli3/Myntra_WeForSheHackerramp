import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Send,
  HelpCircle,
  ShoppingBag,
  VideoOff,
  Share2,
  PauseCircle,
  ArrowUp,
  MessageCircle,
  LogOut,
  Radio,
  Captions,
} from "lucide-react";
import { liveSessionService } from "../../services/liveSessionService";
import { aiService } from "../../services/aiService";
import { useAuth } from "../../context/AuthContext";
import { useViewer } from "../../hooks/useViewer";
import { useLiveRoom } from "../../hooks/useLiveRoom";
import { Spinner } from "../../components/ui/Primitives";
import AddToCartSheet from "../../components/customer/AddToCartSheet";
import FollowButton from "../../components/customer/FollowButton";
import StockBadge from "../../components/shared/StockBadge";
import NameToggle from "../../components/shared/NameToggle";
import { FloatingReactions, ReactionBar } from "../../components/customer/ReactionLayer";
import PollWidget from "../../components/customer/PollWidget";
import FlashDealBanner from "../../components/customer/FlashDealBanner";
import CouponPopup from "../../components/customer/CouponPopup";
import QuickQuestionChips from "../../components/customer/QuickQuestionChips";
import { defaultNamingMode, resolveProductNaming } from "../../utils/productDisplay";
import { LANGUAGES } from "../../data/languages";

export default function LiveSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customer } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isQuestion, setIsQuestion] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState("chat"); // chat | qna
  const [votedPollIds, setVotedPollIds] = useState(new Set());
  const [nameMode, setNameMode] = useState("primary");
  // Bharat "speed & trust" caption improvement: each customer picks their OWN
  // caption language — the seller just speaks (in whatever language they're
  // comfortable in), and translation happens per-viewer. See the effect below
  // and server/socket/socketHandler.js's "caption-chunk" handler.
  const [captionLanguage, setCaptionLanguage] = useState(customer?.preferredLanguage || "English");
  const [translatedCaption, setTranslatedCaption] = useState("");
  const [showEndedOverlay, setShowEndedOverlay] = useState(false);
  const captionRequestIdRef = useRef(0);
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    liveSessionService
      .getById(id)
      .then((data) => {
        setSession(data);
        if (data.status === "ended") navigate(`/app/live/${id}/replay`, { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const {
    comments,
    viewerCount,
    pinnedProduct,
    sessionStatus,
    isPaused,
    captions,
    reactions,
    polls,
    promotions,
    mutedAuthors,
    duplicateAnsweredNotice,
    dismissDuplicateNotice,
    notifyCartAdd,
    sendComment,
    sendReaction,
    upvoteQuestion,
    votePoll,
    claimPromotion,
  } = useLiveRoom(id, {
    role: "customer",
    username: customer?.name || "Guest",
    userId: customer?._id,
    initialPinnedProduct: session?.pinnedProductId || null,
  });

  useEffect(() => {
    setNameMode(defaultNamingMode(pinnedProduct, customer));
  }, [pinnedProduct, customer]);

  // Translate the latest raw caption into whichever language THIS customer
  // picked — independent of every other viewer. Re-runs when a new caption
  // chunk arrives OR when the customer changes their language mid-stream.
  // The requestId guard ignores a stale response if a newer one already came back.
  useEffect(() => {
    if (!captions.length) return;
    const original = captions[captions.length - 1].original;
    const requestId = ++captionRequestIdRef.current;
    aiService
      .translateCaption(original, captionLanguage)
      .then(({ translated }) => {
        if (captionRequestIdRef.current === requestId) setTranslatedCaption(translated);
      })
      .catch(() => {
        if (captionRequestIdRef.current === requestId) setTranslatedCaption(original);
      });
  }, [captions, captionLanguage]);

  const effectiveStatus = sessionStatus || session?.status;
  const { remoteStream, connectionState } = useViewer(effectiveStatus === "live" ? id : null);

  useEffect(() => {
    if (sessionStatus !== "ended") return undefined;
    setShowEndedOverlay(true);
    const timeout = setTimeout(() => navigate(`/app/live/${id}/replay`, { replace: true }), 2200);
    return () => clearTimeout(timeout);
  }, [sessionStatus, id, navigate]);

  useEffect(() => {
    if (videoRef.current && remoteStream) videoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments, tab]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Spinner className="h-8 w-8 border-white" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-black text-white">
        <p>Session not found.</p>
        <Link to="/app/live" className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold">
          Back to Live
        </Link>
      </div>
    );
  }

  if (session.status === "scheduled" && effectiveStatus !== "live") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <img src={session.coverImage} alt={session.title} className="h-40 w-32 rounded-2xl object-cover" />
        <p className="text-lg font-bold">{session.title}</p>
        <p className="text-sm text-white/60">
          {session.sellerId?.brandName} hasn't started this stream yet. This page will switch to live automatically
          the moment they go live — no need to refresh.
        </p>
        <button
          onClick={() => navigate("/app/live")}
          className="mt-2 flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Live
        </button>
      </div>
    );
  }

  const isMuted = mutedAuthors.has(customer?.name || "Guest");

  function handleSend(e) {
    e.preventDefault();
    if (!message.trim() || isMuted) return;
    sendComment(message, tab === "qna" || isQuestion);
    setMessage("");
    setIsQuestion(false);
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: session.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  }

  function handleVote(pollId, optionIndex) {
    votePoll(pollId, optionIndex);
    setVotedPollIds((prev) => new Set(prev).add(pollId));
  }

  const activePolls = polls.filter((p) => p.status === "active");
  const flashDeal = promotions.find((p) => p.type === "flash_sale");
  const coupon = promotions.find((p) => p.type === "coupon");
  const questions = comments.filter((c) => c.isQuestion).sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  const { name: pinnedName } = resolveProductNaming(pinnedProduct, nameMode);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-black text-white">
      {/* Video layer */}
      <div className="absolute inset-0">
        {remoteStream ? (
          <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-900">
            <VideoOff className="h-10 w-10 text-white/30" />
            <p className="text-sm text-white/50">
              {connectionState === "error" ? "Couldn't connect to the stream." : "Connecting to the seller's stream..."}
            </p>
            <Spinner className="h-6 w-6 border-white/40" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
      </div>

      <FloatingReactions reactions={reactions} />

      {isPaused ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/70">
          <PauseCircle className="h-10 w-10 text-white/70" />
          <p className="text-sm font-semibold text-white/80">The seller paused the stream — hang tight.</p>
        </div>
      ) : null}

      {showEndedOverlay ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center">
          <Radio className="h-10 w-10 text-white/50" />
          <p className="text-lg font-bold">Live has ended</p>
          <p className="text-sm text-white/60">Taking you to the recap — products, poll results &amp; more...</p>
          <Spinner className="h-6 w-6 border-white/40" />
          <button
            onClick={() => navigate(`/app/live/${id}/replay`, { replace: true })}
            className="mt-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold"
          >
            View recap now
          </button>
        </div>
      ) : null}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => navigate("/app/live")}
          className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 text-xs font-semibold"
        >
          <LogOut className="h-4 w-4" /> Leave
        </button>
        <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5">
          <img src={session.sellerId?.avatarUrl} alt="" className="h-6 w-6 rounded-full border border-white/40 object-cover" />
          <span className="text-xs font-bold">{session.sellerId?.brandName}</span>
          <span className="live-pulse h-1.5 w-1.5 rounded-full bg-red-500" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold">
            <Users className="h-3.5 w-3.5" /> {viewerCount}
          </div>
        </div>
      </div>

      {session.sellerId?._id ? (
        <div className="relative z-10 mx-4 mt-2 flex justify-end">
          <FollowButton sellerId={session.sellerId._id} />
        </div>
      ) : null}

      {/* Captions — each customer picks their own output language */}
      <div className="relative z-10 mx-4 mt-3 flex items-center justify-end">
        <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1.5">
          <Captions className="h-3.5 w-3.5 text-white/70" />
          <select
            value={captionLanguage}
            onChange={(e) => setCaptionLanguage(e.target.value)}
            className="bg-transparent text-xs font-medium text-white outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l} className="text-gray-900">
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      {captions.length > 0 ? (
        <div className="relative z-10 mx-4 mt-2 rounded-xl bg-black/50 px-3 py-2 text-xs">
          {translatedCaption || captions[captions.length - 1].original}
        </div>
      ) : null}

      {/* Spacer pushes chat/pin to bottom */}
      <div className="relative z-10 flex-1" />

      {/* Widgets: polls / flash deal / coupon */}
      <div className="relative z-10 mx-4 mb-3 flex flex-col gap-2">
        {duplicateAnsweredNotice ? (
          <div className="rounded-xl bg-green-500/90 px-3 py-2 text-xs font-medium">
            The seller just answered a question like yours above ⬆️
            <button onClick={dismissDuplicateNotice} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        ) : null}
        {flashDeal ? <FlashDealBanner promotion={flashDeal} product={pinnedProduct} /> : null}
        {coupon ? (
          <CouponPopup
            promotion={coupon}
            onClaim={claimPromotion}
            claimed={(coupon.claimedBy || []).some((cid) => String(cid) === String(customer?._id))}
          />
        ) : null}
        {activePolls.map((poll) => (
          <PollWidget key={poll._id} poll={poll} hasVoted={votedPollIds.has(poll._id)} onVote={(i) => handleVote(poll._id, i)} />
        ))}
      </div>

      {/* Pinned product */}
      {pinnedProduct ? (
        <div className="relative z-10 mx-4 mb-3 flex items-center gap-2 rounded-2xl bg-white p-2.5 text-gray-900 shadow-lg">
          <button onClick={() => setSheetOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <img src={pinnedProduct.images?.[0]} alt={pinnedName} className="h-14 w-11 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{pinnedName}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-brand-600">₹{pinnedProduct.price}</p>
                <StockBadge product={pinnedProduct} />
              </div>
              <NameToggle product={pinnedProduct} mode={nameMode} onToggle={setNameMode} />
            </div>
          </button>
          <button onClick={handleShare} className="flex-shrink-0 rounded-full bg-gray-100 p-2 text-gray-500" aria-label="Share product">
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex flex-shrink-0 items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Shop
          </button>
        </div>
      ) : null}

      {/* Chat / Q&A tabs */}
      <div className="relative z-10 mx-4 mb-1 flex gap-1 rounded-full bg-white/10 p-1 text-xs font-semibold">
        <button
          onClick={() => setTab("chat")}
          className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 ${tab === "chat" ? "bg-white/20" : "text-white/50"}`}
        >
          <MessageCircle className="h-3 w-3" /> Chat
        </button>
        <button
          onClick={() => setTab("qna")}
          className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 ${tab === "qna" ? "bg-white/20" : "text-white/50"}`}
        >
          <HelpCircle className="h-3 w-3" /> Q&amp;A {questions.length ? `(${questions.length})` : ""}
        </button>
      </div>

      <div className="relative z-10 max-h-48 overflow-y-auto px-4 thin-scrollbar">
        {tab === "chat"
          ? comments.slice(-30).map((c) => (
              <div key={c._id || `${c.author}-${c.createdAt}`} className="mb-1.5 flex items-start gap-1.5 text-xs">
                <span className={`font-bold ${c.authorRole === "seller" ? "text-brand-400" : "text-white/90"}`}>
                  {c.author}
                  {c.isQuestion ? <HelpCircle className="ml-1 inline h-3 w-3 text-amber-400" /> : null}:
                </span>
                <span className="text-white/80">{c.message}</span>
              </div>
            ))
          : questions.map((q) => (
              <div key={q._id} className="mb-1.5 flex items-start justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-white/90">{q.author}:</span>{" "}
                  <span className="text-white/80">{q.message}</span>
                  {q.isAnswered ? <span className="ml-1.5 text-[10px] font-semibold text-green-400">Answered</span> : null}
                </div>
                <button onClick={() => upvoteQuestion(q._id)} className="flex flex-shrink-0 items-center gap-0.5 text-white/50 hover:text-white">
                  <ArrowUp className="h-3 w-3" /> {q.upvotes || 0}
                </button>
              </div>
            ))}
        <div ref={chatEndRef} />
      </div>

      {isMuted ? (
        <p className="relative z-10 px-4 pb-1 text-center text-[11px] text-red-300">
          You've been muted by the host in this stream.
        </p>
      ) : (
        <div className="relative z-10 px-4">
          <QuickQuestionChips product={pinnedProduct} onAsk={(q) => sendComment(q, true)} />
        </div>
      )}

      <form onSubmit={handleSend} className="relative z-10 flex items-center gap-2 px-4 py-3">
        <ReactionBar onReact={sendReaction} />
        <button
          type="button"
          onClick={() => setIsQuestion((v) => !v)}
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
            isQuestion ? "bg-amber-500 text-white" : "bg-white/10 text-white/60"
          }`}
          title="Mark as a question"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isMuted}
          placeholder={isMuted ? "You're muted in this stream" : isQuestion ? "Ask a question..." : "Say something..."}
          className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isMuted}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <AddToCartSheet
        product={pinnedProduct}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        liveSessionId={id}
        onAdded={notifyCartAdd}
      />
    </div>
  );
}