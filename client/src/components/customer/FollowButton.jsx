import { useState } from "react";
import { Heart, HeartOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { customerService } from "../../services/customerService";

// Following a seller is what makes the Notifications feature (stream
// started, flash sale, coupon available) mean anything — see
// useNotifications.js + socketHandler's notifyFollowers().
export default function FollowButton({ sellerId, className = "" }) {
  const { customer, updateCustomer } = useAuth();
  const [loading, setLoading] = useState(false);
  if (!customer) return null;

  const isFollowing = (customer.followedSellers || []).some((id) => String(id) === String(sellerId));

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { followedSellers } = isFollowing
        ? await customerService.unfollow(sellerId)
        : await customerService.follow(sellerId);
      updateCustomer({ followedSellers });
    } catch {
      // no-op — button state simply won't flip if the call failed
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        isFollowing ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-brand-500 text-white hover:bg-brand-600"
      } ${className}`}
    >
      {isFollowing ? <HeartOff className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
