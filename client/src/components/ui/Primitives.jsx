export function Card({ children, className = "" }) {
  return <div className={`rounded-2xl bg-white shadow-sm border border-gray-100 ${className}`}>{children}</div>;
}

export function Spinner({ className = "h-6 w-6" }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-brand-500 border-t-transparent ${className}`} />
  );
}

export function FullPageSpinner({ label = "Loading..." }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-gray-50">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      {Icon ? <Icon className="h-10 w-10 text-gray-300" /> : null}
      <p className="font-semibold text-gray-700">{title}</p>
      {subtitle ? <p className="max-w-sm text-sm text-gray-400">{subtitle}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Badge({ children, tone = "brand", className = "" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    gray: "bg-gray-100 text-gray-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
