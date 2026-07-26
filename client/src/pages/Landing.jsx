import { Link } from "react-router-dom";
import { ShoppingBag, Store, Radio, TrendingUp, MessageCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-extrabold tracking-tight text-brand-500">
          Myntra<span className="text-gray-900">Live</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm">
          <Radio className="h-3.5 w-3.5 text-brand-500" />
          Live Commerce Growth Engine
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">
          Where sellers go live, and shoppers buy in real time.
        </h1>
        <p className="mt-4 max-w-xl text-base text-gray-500">
          One platform, two experiences — shop live streams as a customer, or grow your store with
          AI-powered opportunities as a seller.
        </p>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
          <Link
            to="/customer/login"
            className="group flex flex-col items-center gap-3 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-colors">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <p className="text-lg font-bold text-gray-900">I'm a Customer</p>
            <p className="text-sm text-gray-400">Browse live shopping sessions, chat, and check out in real time.</p>
          </Link>

          <Link
            to="/seller/login"
            className="group flex flex-col items-center gap-3 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900/5 text-gray-900 group-hover:bg-gray-900 group-hover:text-white transition-colors">
              <Store className="h-7 w-7" />
            </div>
            <p className="text-lg font-bold text-gray-900">I'm a Seller</p>
            <p className="text-sm text-gray-400">Go live, get AI-powered growth opportunities, and track performance.</p>
          </Link>
        </div>

        <div className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-6 text-left sm:grid-cols-3">
          <Feature icon={Radio} title="Real live streaming" text="Real camera + mic broadcasts over WebRTC — not a mock player." />
          <Feature icon={MessageCircle} title="Live chat, synced" text="Comments, pinned products and viewer counts update instantly for everyone." />
          <Feature icon={TrendingUp} title="AI growth engine" text="Gemini-powered opportunity feed, prep coaching and post-live insights." />
        </div>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl bg-white/60 p-4">
      <Icon className="h-5 w-5 text-brand-500" />
      <p className="text-sm font-bold text-gray-800">{title}</p>
      <p className="text-xs text-gray-400">{text}</p>
    </div>
  );
}
