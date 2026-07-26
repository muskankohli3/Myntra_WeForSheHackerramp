import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageSpinner } from "../components/ui/Primitives";

export default function ProtectedRoute({ role, children }) {
  const { seller, customer, loading } = useAuth();

  if (loading) return <FullPageSpinner label="Checking your session..." />;

  if (role === "seller" && !seller) return <Navigate to="/seller/login" replace />;
  if (role === "customer" && !customer) return <Navigate to="/customer/login" replace />;

  return children;
}
