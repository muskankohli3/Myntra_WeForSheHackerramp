import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

// Sellers and customers are two independent identities, so both can be
// "logged in" at the same time in the same browser (useful for demoing —
// open the seller dashboard in one tab, the customer app in another).
export function AuthProvider({ children }) {
  const [seller, setSeller] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const sellerToken = localStorage.getItem("mge_seller_token");
      const customerToken = localStorage.getItem("mge_customer_token");

      if (sellerToken) {
        try {
          const { seller } = await authService.sellerMe();
          setSeller(seller);
        } catch {
          localStorage.removeItem("mge_seller_token");
        }
      }

      if (customerToken) {
        try {
          const { customer } = await authService.customerMe();
          setCustomer(customer);
        } catch {
          localStorage.removeItem("mge_customer_token");
        }
      }

      setLoading(false);
    }
    bootstrap();
  }, []);

  const sellerLogin = useCallback(async (email, password) => {
    const { token, seller } = await authService.sellerLogin({ email, password });
    localStorage.setItem("mge_seller_token", token);
    setSeller(seller);
    return seller;
  }, []);

  const sellerSignup = useCallback(async (payload) => {
    const { token, seller } = await authService.sellerSignup(payload);
    localStorage.setItem("mge_seller_token", token);
    setSeller(seller);
    return seller;
  }, []);

  const sellerLogout = useCallback(() => {
    localStorage.removeItem("mge_seller_token");
    setSeller(null);
  }, []);

  const customerLogin = useCallback(async (email, password) => {
    const { token, customer } = await authService.customerLogin({ email, password });
    localStorage.setItem("mge_customer_token", token);
    setCustomer(customer);
    return customer;
  }, []);

  const customerSignup = useCallback(async (payload) => {
    const { token, customer } = await authService.customerSignup(payload);
    localStorage.setItem("mge_customer_token", token);
    setCustomer(customer);
    return customer;
  }, []);

  const customerLogout = useCallback(() => {
    localStorage.removeItem("mge_customer_token");
    setCustomer(null);
  }, []);

  // Lets components (FollowButton, etc.) patch the in-memory customer object
  // after a server call succeeds, without a full re-fetch of /me.
  const updateCustomer = useCallback((patch) => {
    setCustomer((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        seller,
        customer,
        loading,
        sellerLogin,
        sellerSignup,
        sellerLogout,
        customerLogin,
        customerSignup,
        customerLogout,
        updateCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
