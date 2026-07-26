import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Radio, BarChart3, LogOut, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../shared/NotificationBell";

const ITEMS = [
  { to: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/seller/products", label: "My Products", icon: Package },
  { to: "/seller/live", label: "Live Studio", icon: Radio },
  { to: "/seller/insights", label: "Regional Insights", icon: MapPin },
  { to: "/seller/analytics", label: "Analytics", icon: BarChart3 },
];

export default function SellerSidebar() {
  const { seller, sellerLogout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    sellerLogout();
    navigate("/seller/login");
  }

  return (
    <aside className="sticky top-0 flex h-screen w-56 flex-shrink-0 flex-col border-r border-gray-100 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-extrabold text-white">
          M
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">{seller?.brandName || "Seller Hub"}</p>
          <p className="truncate text-xs text-gray-400">{seller?.tier || "Growth Engine"}</p>
        </div>
        <NotificationBell role="seller" userId={seller?._id} />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="mx-3 mb-5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-4.5 w-4.5" />
        Log out
      </button>
    </aside>
  );
}
