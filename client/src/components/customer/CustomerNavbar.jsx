import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../shared/NotificationBell";
import SearchOverlay from "./SearchOverlay";

export default function CustomerNavbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { totalItems } = useCart();
  const { customer } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/app" className="flex-shrink-0 text-xl font-extrabold tracking-tight text-brand-500">
          Myntra<span className="text-gray-900">Live</span>
        </Link>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="relative flex-1 rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-left text-sm text-gray-400 hover:border-brand-300"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          Search for products, sellers, live streams...
        </button>

        <NotificationBell role="customer" userId={customer?._id} />

        <Link
          to="/app/profile"
          className="hidden items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600 sm:flex"
        >
          <User className="h-5 w-5" />
          {customer?.name?.split(" ")[0] || "Profile"}
        </Link>

        <Link to="/app/cart" className="relative flex items-center text-gray-700 hover:text-brand-600">
          <ShoppingBag className="h-6 w-6" />
          {totalItems > 0 ? (
            <span className="absolute -right-2 -top-2 flex h-4.5 w-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
              {totalItems}
            </span>
          ) : null}
        </Link>
      </div>

      {searchOpen ? <SearchOverlay onClose={() => setSearchOpen(false)} /> : null}
    </header>
  );
}
