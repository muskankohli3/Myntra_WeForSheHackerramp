import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Mail, Phone, MapPin, Languages, Heart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { customerService } from "../../services/customerService";
import Button from "../../components/ui/Button";
import FollowButton from "../../components/customer/FollowButton";
import { Spinner } from "../../components/ui/Primitives";

export default function Profile() {
  const { customer, customerLogout } = useAuth();
  const navigate = useNavigate();
  const [followed, setFollowed] = useState([]);
  const [loadingFollowed, setLoadingFollowed] = useState(true);

  useEffect(() => {
    customerService
      .getFollowedSellers()
      .then(({ sellers }) => setFollowed(sellers))
      .catch(() => setFollowed([]))
      .finally(() => setLoadingFollowed(false));
  }, []);

  function handleLogout() {
    customerLogout();
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-gray-100 bg-white p-6 text-center">
        <img src={customer?.avatarUrl} alt={customer?.name} className="h-20 w-20 rounded-full border-4 border-brand-50" />
        <p className="text-lg font-bold text-gray-900">{customer?.name}</p>
        <div className="w-full space-y-2 pt-2 text-left">
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" /> {customer?.email}
          </div>
          {customer?.phone ? (
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" /> {customer.phone}
            </div>
          ) : null}
          {customer?.city ? (
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" /> {customer.city}, {customer.state}
            </div>
          ) : null}
          {customer?.preferredLanguage ? (
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <Languages className="h-4 w-4 text-gray-400" /> {customer.preferredLanguage}
            </div>
          ) : null}
        </div>
        <Button variant="danger" className="mt-4 w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <Heart className="h-4 w-4 text-brand-500" /> Sellers you follow
        </p>
        {loadingFollowed ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : followed.length === 0 ? (
          <p className="text-xs text-gray-400">
            Follow sellers from their live streams to get notified when they go live, run a flash sale, or drop a
            coupon.
          </p>
        ) : (
          <div className="space-y-2">
            {followed.map((s) => (
              <div key={s._id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5">
                <img src={s.avatarUrl} alt={s.brandName} className="h-9 w-9 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{s.brandName}</p>
                  <p className="text-xs text-gray-400">{s.city}</p>
                </div>
                <FollowButton sellerId={s._id} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-center text-xs text-gray-400">
        <User className="mx-auto mb-1 h-5 w-5 text-gray-300" />
        Selling your own products? Log out and use the seller login instead.
      </div>
    </div>
  );
}
