import { Link } from "react-router-dom";

export default function AuthShell({ title, subtitle, children, footer, accent = "brand" }) {
  const accentClass = accent === "dark" ? "bg-gray-900" : "bg-brand-500";
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center text-xl font-extrabold tracking-tight text-brand-500">
          Myntra<span className="text-gray-900">Live</span>
        </Link>
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className={`mb-6 h-1.5 w-12 rounded-full ${accentClass}`} />
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-gray-400">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? <div className="mt-5 text-center text-sm text-gray-500">{footer}</div> : null}
      </div>
    </div>
  );
}

export function FormField({ label, ...rest }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <input
        {...rest}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
