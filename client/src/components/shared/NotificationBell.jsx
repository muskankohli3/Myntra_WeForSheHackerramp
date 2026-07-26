import { useState, useRef, useEffect } from "react";
import { Bell, Radio, Tag, Zap, Package, ShoppingBag } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";

const ICONS = {
  stream_started: Radio,
  coupon_available: Tag,
  flash_sale: Zap,
  product_restocked: Package,
  order_update: ShoppingBag,
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell({ role, userId }) {
  const { notifications, unreadCount, markAllRead } = useNotifications(role, userId);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-y-auto thin-scrollbar rounded-2xl border border-gray-100 bg-white shadow-lg animate-fade-in">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet.</p>
          ) : (
            notifications.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <div key={n._id} className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${n.read ? "" : "bg-brand-50/40"}`}>
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug">{n.title}</p>
                    {n.body ? <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p> : null}
                    {n.createdAt ? <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p> : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
