import { BarChart3 } from "lucide-react";

// Customer-side poll card — shows options to tap-vote on if still active, or
// live results (bar + percentage) once they've voted or the poll closed.
// One vote per browser tab is enforced client-side in useLiveRoom (votePoll),
// mirrored server-side in socketHandler's per-socket `pollVotes` set.
export default function PollWidget({ poll, onVote, hasVoted }) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const showResults = hasVoted || poll.status === "closed";

  return (
    <div className="rounded-2xl bg-white/95 backdrop-blur p-3 shadow-lg">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-500">
        <BarChart3 className="h-3.5 w-3.5" />
        {poll.status === "closed" ? "Poll closed" : "Live poll"}
      </div>
      <p className="mb-2 text-sm font-semibold text-gray-800">{poll.question}</p>
      <div className="space-y-1.5">
        {poll.options.map((option, index) => {
          const pct = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
          if (showResults) {
            return (
              <div key={option.text} className="relative overflow-hidden rounded-lg border border-gray-100">
                <div className="absolute inset-y-0 left-0 bg-brand-100" style={{ width: `${pct}%` }} />
                <div className="relative flex items-center justify-between px-3 py-1.5 text-xs font-medium text-gray-700">
                  <span>{option.text}</span>
                  <span>{pct}%</span>
                </div>
              </div>
            );
          }
          return (
            <button
              key={option.text}
              type="button"
              onClick={() => onVote(index)}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-left text-xs font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50"
            >
              {option.text}
            </button>
          );
        })}
      </div>
      {totalVotes > 0 ? <p className="mt-1.5 text-[11px] text-gray-400">{totalVotes} vote{totalVotes === 1 ? "" : "s"}</p> : null}
    </div>
  );
}
