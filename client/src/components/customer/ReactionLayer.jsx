const EMOJIS = ["❤️", "🔥", "😍", "👏", "👍"];

// The floating layer that animates reactions rising up the screen (see the
// `.floating-reaction` keyframes in index.css) — purely visual, ephemeral,
// driven by the `reactions` array from useLiveRoom (no persistence needed).
export function FloatingReactions({ reactions }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {reactions.map((r, i) => (
        <span
          key={r.id}
          className="floating-reaction absolute text-2xl"
          style={{ right: `${8 + ((i * 13) % 60)}%`, bottom: "5rem" }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}

// The tap targets themselves — a small horizontal strip of emoji buttons.
export function ReactionBar({ onReact, className = "" }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1.5 backdrop-blur ${className}`}>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(emoji)}
          className="text-lg leading-none transition-transform active:scale-125"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
