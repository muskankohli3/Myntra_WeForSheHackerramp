import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 text-center">
      <p className="text-6xl font-extrabold text-brand-500">404</p>
      <p className="text-gray-500">This page doesn't exist.</p>
      <Link to="/" className="mt-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600">
        Go home
      </Link>
    </div>
  );
}
