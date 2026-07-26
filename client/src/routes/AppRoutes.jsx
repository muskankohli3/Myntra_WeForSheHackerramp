import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Landing from "../pages/Landing";
import NotFound from "../pages/NotFound";

import CustomerLogin from "../pages/auth/CustomerLogin";
import CustomerSignup from "../pages/auth/CustomerSignup";
import SellerLogin from "../pages/auth/SellerLogin";
import SellerSignup from "../pages/auth/SellerSignup";

import CustomerLayout from "../components/layouts/CustomerLayout";
import CustomerHome from "../pages/customer/CustomerHome";
import LiveDiscovery from "../pages/customer/LiveDiscovery";
import LiveSession from "../pages/customer/LiveSession";
import Cart from "../pages/customer/Cart";
import Checkout from "../pages/customer/Checkout";
import OrderSuccess from "../pages/customer/OrderSuccess";
import Orders from "../pages/customer/Orders";
import Replay from "../pages/customer/Replay";
import Profile from "../pages/customer/Profile";

import SellerLayout from "../components/layouts/SellerLayout";
import SellerDashboard from "../pages/seller/SellerDashboard";
import SellerProducts from "../pages/seller/SellerProducts";
import SellerLive from "../pages/seller/SellerLive";
import PrepCoach from "../pages/seller/PrepCoach";
import LiveStudio from "../pages/seller/LiveStudio";
import SellerAnalytics from "../pages/seller/SellerAnalytics";
import SellerRegionalInsights from "../pages/seller/SellerRegionalInsights";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Auth */}
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer/signup" element={<CustomerSignup />} />
      <Route path="/seller/login" element={<SellerLogin />} />
      <Route path="/seller/signup" element={<SellerSignup />} />

      {/* Customer app — browsing pages share the shell layout */}
      <Route
        path="/app"
        element={
          <ProtectedRoute role="customer">
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerHome />} />
        <Route path="live" element={<LiveDiscovery />} />
        <Route path="cart" element={<Cart />} />
        <Route path="orders" element={<Orders />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Customer immersive/full-screen pages — no shell chrome */}
      <Route
        path="/app/live/:id"
        element={
          <ProtectedRoute role="customer">
            <LiveSession />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/live/:id/replay"
        element={
          <ProtectedRoute role="customer">
            <Replay />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/checkout"
        element={
          <ProtectedRoute role="customer">
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/order-success/:orderId"
        element={
          <ProtectedRoute role="customer">
            <OrderSuccess />
          </ProtectedRoute>
        }
      />

      {/* Seller app */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute role="seller">
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="live" element={<SellerLive />} />
        <Route path="insights" element={<SellerRegionalInsights />} />
        <Route path="analytics" element={<SellerAnalytics />} />
      </Route>

      {/* Seller immersive/full-screen pages */}
      <Route
        path="/seller/live/:id/prep"
        element={
          <ProtectedRoute role="seller">
            <PrepCoach />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/live/:id/studio"
        element={
          <ProtectedRoute role="seller">
            <LiveStudio />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
