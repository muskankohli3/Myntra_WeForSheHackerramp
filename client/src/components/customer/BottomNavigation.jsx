import { NavLink } from "react-router-dom";
import { Home, Radio, ShoppingBag, ListOrdered, User } from "lucide-react";

const ITEMS = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/live", label: "Live", icon: Radio },
  { to: "/app/cart", label: "Cart", icon: ShoppingBag },
  { to: "/app/orders", label: "Orders", icon: ListOrdered },
  { to: "/app/profile", label: "Profile", icon: User },
];

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] font-medium ${
                isActive ? "text-brand-600" : "text-gray-400"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
