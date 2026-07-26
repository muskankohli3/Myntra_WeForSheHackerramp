import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Languages,
  ArrowLeft,
  RefreshCw,
  Pause,
  Play,
  MessageCircle,
  HelpCircle,
  Tag,
  BarChart3,
  Sparkles,
  Package,
} from "lucide-react";
import { liveSessionService } from "../../services/liveSessionService";
import { useAuth } from "../../context/AuthContext";
import { useBroadcaster } from "../../hooks/useBroadcaster";
import { useLiveRoom } from "../../hooks/useLiveRoom";
import { useCaptions } from "../../hooks/useCaptions";
import { Spinner } from "../../components/ui/Primitives";
import LiveComments from "../../components/seller/LiveComments";
import LiveMetrics from "../../components/seller/LiveMetrics";
import ProductPicker from "../../components/seller/ProductPicker";
import QnAPanel from "../../components/seller/QnAPanel";
import PromotionsPanel from "../../components/seller/PromotionsPanel";
import PollCreatorPanel from "../../components/seller/PollCreatorPanel";
import LiveAssistantPanel from "../../components/seller/LiveAssistantPanel";
import InventoryPanel from "../../components/seller/InventoryPanel";
import { LANGUAGES } from "../../data/languages";

const TABS = [
  { key: "chat", label: "Chat", icon: MessageCircle },
  { key: "qna", label: "Q&A", icon: HelpCircle },
  { key: "promotions", label: "Promos", icon: Tag },
  { key: "polls", label: "Polls", icon: BarChart3 },
  { key: "assistant", label: "Assistant", icon: Sparkles },
  { key: "inventory", label: "Stock", icon: Package },
];

export default function LiveStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { seller } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [tab, setTab] = useState("chat");
  // The language the SELLER is speaking (for accurate speech-to-text) — not
  // to be confused with a caption OUTPUT language, which each customer now
  // picks independently on their own screen (see LiveSession.jsx).
  const [spokenLanguage, setSpokenLanguage] = useState(seller?.preferredLanguage || "Hindi");
  const videoRef = useRef(null);

  const {
    localStream,
    error: cameraError,
    startCamera,
    stopBroadcast,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMic,
    switchCamera,
    isSwitchingCamera,
  } = useBroadcaster(id);

  const {
    comments,
    viewerCount,
    pinnedProduct,
    cartCount,
    isPaused,
    likeCount,
    orderCount,
    revenueTotal,
    orderPopups,
    stockByProductId,
    duplicateAnsweredNotice,
    dismissDuplicateNotice,
    liveAssistantTip,
    dismissLiveAssistantTip,
    polls,
    promotions,
    sendComment,
    pinProduct,
    sendCaptionChunk,
    aiSuggestion,
    dismissSuggestion,
    answerQuestion,
    moderateComment,
    createPoll,
    closePoll,
    startPromotion,
    pauseLive,
    resumeLive,
    startLive,
    endLive,
    captions,
  } = useLiveRoom(id, {
    role: "seller",
    username: seller?.brandName || "Seller",
    userId: seller?._id,
    initialPinnedProduct: session?.pinnedProductId || null,
  });

  const handleCaptionChunk = useCallback((text) => sendCaptionChunk(text), [sendCaptionChunk]);
  const { isSupported: captionsSupported, isListening: captionsOn, start: startCaptions, stop: stopCaptions } =
    useCaptions(handleCaptionChunk);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const data = await liveSessionService.getById(id);
      if (cancelled) return;
      let liveSession = data;
      if (data.status !== "live") {
        liveSession = await liveSessionService.start(id);
      }
      setSession(liveSession);
      setLoading(false);
      startLive();
      await startCamera();
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (videoRef.current && localStream) videoRef.current.srcObject = localStream;
  }, [localStream]);

  async function handleEndLive() {
    setEnding(true);
    try {
      stopCaptions();
      stopBroadcast();
      endLive();
      await liveSessionService.end(id);
      navigate("/seller/analytics");
    } finally {
      setEnding(false);
    }
  }

  async function handlePauseToggle() {
    if (isPaused) {
      await liveSessionService.resume(id);
      resumeLive();
    } else {
      await liveSessionService.pause(id);
      pauseLive();
    }
  }

  function toggleCaptions() {
    if (captionsOn) stopCaptions();
    else startCaptions(spokenLanguage);
  }

  function handleSpokenLanguageChange(lang) {
    setSpokenLanguage(lang);
    if (captionsOn) {
      stopCaptions();
      startCaptions(lang);
    }
  }

  if (loading || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Spinner className="h-8 w-8 border-white" />
      </div>
    );
  }

  const questionCount = comments.filter((c) => c.isQuestion).length;
  const sessionProducts = session.productIds || [];

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white lg:flex-row">
      {/* Video + controls */}
      <div className="relative flex flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <button onClick={() => navigate("/seller/live")} className="rounded-full bg-white/10 p-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="truncate text-sm font-bold">{session.title}</p>
          <LiveMetrics
            viewerCount={viewerCount}
            questionCount={questionCount}
            cartCount={cartCount}
            likeCount={likeCount}
            orderCount={orderCount}
            revenueTotal={revenueTotal}
            status={isPaused ? "paused" : "live"}
          />
        </div>

        {/* Order-placed toasts */}
        {orderPopups.length ? (
          <div className="absolute right-4 top-16 z-20 flex flex-col gap-2">
            {orderPopups.map((popup) => (
              <div key={popup.id} className="animate-fade-in rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold shadow-lg">
                🎉 {popup.customerName} just ordered — ₹{popup.totalAmount}
              </div>
            ))}
          </div>
        ) : null}

        {duplicateAnsweredNotice ? (
          <div className="mx-4 mb-2 rounded-xl bg-green-500/20 px-3 py-2 text-xs text-green-300">
            Auto-answered {duplicateAnsweredNotice.answeredCount} similar question(s) too.
            <button onClick={dismissDuplicateNotice} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="relative mx-4 mb-4 flex-1 overflow-hidden rounded-2xl bg-black">
          {localStream ? (
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-white/50">
              <VideoOff className="h-10 w-10" />
              <p className="max-w-sm px-6 text-center text-sm">{cameraError || "Waiting for camera access..."}</p>
              {cameraError ? (
                <button onClick={startCamera} className="rounded-full bg-brand-500 px-4 py-1.5 text-xs font-semibold">
                  Retry camera
                </button>
              ) : null}
            </div>
          )}

          {isPaused ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
              <Pause className="h-8 w-8 text-white/70" />
              <p className="text-sm font-semibold text-white/80">Stream paused — viewers are waiting</p>
            </div>
          ) : null}

          {captionsSupported && captionsOn ? (
            <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/60 px-3 py-2 text-center text-sm">
              🔴 Transcribing your {spokenLanguage} speech — each viewer sees it translated into their own chosen language
              {captions.length ? <p className="mt-1 text-xs italic text-white/60">"{captions[captions.length - 1].original}"</p> : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pb-5">
          <ControlButton active={isCameraOn} onClick={toggleCamera} icon={isCameraOn ? Video : VideoOff} />
          <ControlButton active onClick={switchCamera} icon={RefreshCw} disabled={isSwitchingCamera} title="Switch camera" />
          <ControlButton active={isMicOn} onClick={toggleMic} icon={isMicOn ? Mic : MicOff} />
          <ControlButton active={!isPaused} onClick={handlePauseToggle} icon={isPaused ? Play : Pause} title={isPaused ? "Resume" : "Pause"} />
          {captionsSupported ? (
            <div className="flex items-center gap-1.5">
              <ControlButton active={captionsOn} onClick={toggleCaptions} icon={Languages} title="Live captions" />
              <select
                value={spokenLanguage}
                onChange={(e) => handleSpokenLanguageChange(e.target.value)}
                title="Language you're speaking in (for accurate transcription)"
                className="rounded-full bg-white/10 px-2 py-1.5 text-xs text-white outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l} className="text-gray-900">
                    {l}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <button
            onClick={handleEndLive}
            disabled={ending}
            className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold hover:bg-red-700 disabled:opacity-60"
          >
            <PhoneOff className="h-4 w-4" /> {ending ? "Ending..." : "End Live"}
          </button>
        </div>

        <div className="px-4 pb-4">
          <ProductPicker products={sessionProducts} pinnedProductId={pinnedProduct?._id || null} onPin={pinProduct} />
        </div>
      </div>

      {/* Tabbed sidebar */}
      <div className="flex w-full flex-shrink-0 flex-col border-t border-white/10 lg:h-screen lg:w-96 lg:border-l lg:border-t-0">
        <div className="flex overflow-x-auto border-b border-white/10 bg-gray-950 thin-scrollbar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-shrink-0 items-center gap-1 px-3 py-2.5 text-[11px] font-semibold ${
                tab === key ? "border-b-2 border-brand-500 text-white" : "text-white/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-white text-gray-900">
          {tab === "chat" ? (
            <div className="h-full p-3">
              <LiveComments
                comments={comments}
                onSend={(text) => sendComment(text, false)}
                aiSuggestion={aiSuggestion}
                onAcceptSuggestion={(reply) => {
                  sendComment(reply, false);
                  dismissSuggestion();
                }}
                onDismissSuggestion={dismissSuggestion}
                onModerate={moderateComment}
                liveSessionId={id}
              />
            </div>
          ) : tab === "qna" ? (
            <QnAPanel
              comments={comments}
              onAnswer={answerQuestion}
              duplicateAnsweredNotice={duplicateAnsweredNotice}
              onDismissNotice={dismissDuplicateNotice}
            />
          ) : tab === "promotions" ? (
            <PromotionsPanel products={sessionProducts} activePromotions={promotions} onStart={startPromotion} />
          ) : tab === "polls" ? (
            <PollCreatorPanel polls={polls} onCreate={createPoll} onClose={closePoll} />
          ) : tab === "assistant" ? (
            <LiveAssistantPanel tip={liveAssistantTip} onDismiss={dismissLiveAssistantTip} />
          ) : (
            <InventoryPanel products={sessionProducts} stockByProductId={stockByProductId} />
          )}
        </div>
      </div>
    </div>
  );
}

function ControlButton({ active, onClick, icon: Icon, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
        active ? "bg-white/15 text-white" : "bg-red-500/80 text-white"
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}