import { useState } from "react";
import { HelpCircle, CheckCircle2, ArrowUp, Send } from "lucide-react";

// Seller's Q&A panel — deliberately separate from the general chat feed
// (per the spec's "Questions appear separately from chat" ask), sorted by
// upvotes so the seller answers what most people actually want to know
// first. Answering auto-resolves near-duplicate questions from other
// viewers server-side (see socketHandler's "answer-question" handler).
export default function QnAPanel({ comments, onAnswer, duplicateAnsweredNotice, onDismissNotice }) {
  const [replyDrafts, setReplyDrafts] = useState({});
  const [openId, setOpenId] = useState(null);

  const questions = comments
    .filter((c) => c.isQuestion)
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0) || new Date(b.createdAt) - new Date(a.createdAt));

  function submitReply(commentId) {
    const text = replyDrafts[commentId];
    if (!text?.trim()) return;
    onAnswer(commentId, text);
    setReplyDrafts((d) => ({ ...d, [commentId]: "" }));
    setOpenId(null);
  }

  return (
    <div className="flex h-full flex-col">
      {duplicateAnsweredNotice ? (
        <div className="m-2 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
          <span>
            Also auto-answered {duplicateAnsweredNotice.answeredCount} similar question
            {duplicateAnsweredNotice.answeredCount === 1 ? "" : "s"}.
          </span>
          <button onClick={onDismissNotice} className="font-semibold underline">
            OK
          </button>
        </div>
      ) : null}

      <div className="flex-1 space-y-2 overflow-y-auto thin-scrollbar p-3">
        {questions.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-400">No questions yet.</p>
        ) : (
          questions.map((q) => (
            <div key={q._id} className={`rounded-xl border p-2.5 ${q.isAnswered ? "border-green-100 bg-green-50/40" : "border-gray-100"}`}>
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                  <HelpCircle className="h-3 w-3" /> {q.author}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <ArrowUp className="h-3 w-3" /> {q.upvotes || 0}
                </span>
              </div>
              <p className="text-sm text-gray-800">{q.message}</p>
              {q.isAnswered ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> Answered
                </p>
              ) : openId === q._id ? (
                <div className="mt-2 flex gap-1.5">
                  <input
                    autoFocus
                    value={replyDrafts[q._id] || ""}
                    onChange={(e) => setReplyDrafts((d) => ({ ...d, [q._id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && submitReply(q._id)}
                    placeholder="Type your answer..."
                    className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
                  />
                  <button
                    onClick={() => submitReply(q._id)}
                    className="rounded-lg bg-brand-500 px-2.5 text-white"
                    aria-label="Send answer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setOpenId(q._id)}
                  className="mt-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-200"
                >
                  Reply
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
