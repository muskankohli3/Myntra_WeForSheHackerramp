import { useState } from "react";
import { BarChart3, Plus, X } from "lucide-react";

export default function PollCreatorPanel({ polls, onCreate, onClose }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  function updateOption(i, value) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }
  function addOption() {
    if (options.length < 4) setOptions((prev) => [...prev, ""]);
  }
  function create() {
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleanOptions.length < 2) return;
    onCreate(question.trim(), cleanOptions);
    setQuestion("");
    setOptions(["", ""]);
  }

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-xl border border-gray-100 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <BarChart3 className="h-3.5 w-3.5" /> New poll
        </p>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Which color should I try next?"
          className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-400"
        />
        {options.map((opt, i) => (
          <input
            key={i}
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
            className="mb-1.5 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-brand-400"
          />
        ))}
        {options.length < 4 ? (
          <button onClick={addOption} className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-brand-500">
            <Plus className="h-3 w-3" /> Add option
          </button>
        ) : null}
        <button onClick={create} className="w-full rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white">
          Launch poll
        </button>
      </div>

      {polls?.length ? (
        <div className="space-y-2">
          {[...polls].reverse().map((poll) => {
            const total = poll.options.reduce((s, o) => s + o.votes, 0);
            return (
              <div key={poll._id} className="rounded-xl border border-gray-100 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-800">{poll.question}</p>
                  {poll.status === "active" ? (
                    <button onClick={() => onClose(poll._id)} className="text-gray-400 hover:text-red-500" aria-label="Close poll">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-gray-400">Closed</span>
                  )}
                </div>
                {poll.options.map((o) => (
                  <div key={o.text} className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span>{o.text}</span>
                    <span>{total ? Math.round((o.votes / total) * 100) : 0}% ({o.votes})</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
