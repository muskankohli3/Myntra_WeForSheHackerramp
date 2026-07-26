import { useEffect, useRef, useState } from "react";
import { Send, HelpCircle, Sparkles, X, Pin, Trash2, VolumeX, FileText, Loader2 } from "lucide-react";
import { aiService } from "../../services/aiService";

export default function LiveComments({
  comments,
  onSend,
  aiSuggestion,
  onAcceptSuggestion,
  onDismissSuggestion,
  onModerate,
  liveSessionId,
}) {
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  function handleSubmit(e) {
    e.preventDefault();
    const value = inputRef.current.value.trim();
    if (!value) return;
    onSend(value);
    inputRef.current.value = "";
  }

  async function requestSummary() {
    setSummaryLoading(true);
    try {
      const { summary: text } = await aiService.chatSummary(liveSessionId);
      setSummary(text);
    } catch {
      setSummary("Could not summarize chat right now.");
    } finally {
      setSummaryLoading(false);
    }
  }

  const pinned = comments.find((c) => c.pinned);
  const feed = comments.filter((c) => !c.pinned);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-bold text-gray-900">Live Chat</span>
        <button
          onClick={requestSummary}
          disabled={summaryLoading}
          className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200"
          title="AI chat summary"
        >
          {summaryLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
          Summarize
        </button>
      </div>

      {pinned ? (
        <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2">
          <Pin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
          <p className="text-xs text-amber-800">
            <span className="font-semibold">{pinned.author}:</span> {pinned.message}
          </p>
          <button onClick={() => onModerate(pinned._id, "unpin")} className="ml-auto text-amber-400 hover:text-amber-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {summary ? (
        <div className="mx-3 mt-2 whitespace-pre-line rounded-xl bg-gray-50 p-3 text-[11px] text-gray-600">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-gray-500">Chat summary</span>
            <button onClick={() => setSummary("")}>
              <X className="h-3 w-3 text-gray-400" />
            </button>
          </div>
          {summary}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 py-2 thin-scrollbar">
        {feed.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-400">No messages yet — comments will appear here live.</p>
        ) : (
          feed.map((c) => (
            <div key={c._id || `${c.author}-${c.createdAt}`} className="group mb-2 flex items-start justify-between gap-2 text-sm">
              <p>
                <span className={`font-semibold ${c.authorRole === "seller" ? "text-brand-600" : "text-gray-800"}`}>
                  {c.author}
                  {c.isQuestion ? <HelpCircle className="ml-1 inline h-3 w-3 text-amber-500" /> : null}:
                </span>{" "}
                <span className="text-gray-600">{c.message}</span>
              </p>
              {c.authorRole !== "seller" ? (
                <div className="hidden flex-shrink-0 gap-1 group-hover:flex">
                  <button onClick={() => onModerate(c._id, "pin")} className="text-gray-300 hover:text-amber-500" title="Pin">
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onModerate(c._id, "mute", c.author)} className="text-gray-300 hover:text-orange-500" title="Mute author">
                    <VolumeX className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onModerate(c._id, "delete")} className="text-gray-300 hover:text-red-500" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {aiSuggestion ? (
        <div className="mx-3 mb-2 rounded-xl border border-brand-100 bg-brand-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-brand-600">
            <Sparkles className="h-3.5 w-3.5" /> AI noticed repeated questions
          </div>
          <p className="text-xs text-brand-800">{aiSuggestion.reply}</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onAcceptSuggestion(aiSuggestion.reply)}
              className="rounded-full bg-brand-500 px-3 py-1 text-[11px] font-semibold text-white"
            >
              Send this reply
            </button>
            <button onClick={onDismissSuggestion} className="flex items-center gap-1 text-[11px] text-gray-400">
              <X className="h-3 w-3" /> Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-100 p-3">
        <input
          ref={inputRef}
          placeholder="Reply to your viewers..."
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand-400"
        />
        <button type="submit" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
