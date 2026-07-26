import { generateQuickQuestions } from "../../utils/quickQuestions";

// Tap-to-ask chips shown above the chat input while a product is pinned —
// generated instantly from the product itself (see quickQuestions.js), no
// network round-trip needed before a viewer can ask something useful.
export default function QuickQuestionChips({ product, onAsk }) {
  const questions = generateQuickQuestions(product);
  if (!questions.length) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto thin-scrollbar pb-1">
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onAsk(q)}
          className="flex-shrink-0 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-medium text-white backdrop-blur hover:bg-white/20"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
