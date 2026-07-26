import { api } from "./api";

export const authService = {
  sellerSignup: (payload) => api.post("/auth/seller/signup", payload),
  sellerLogin: (payload) => api.post("/auth/seller/login", payload),
  sellerMe: () => api.get("/auth/seller/me", { role: "seller", auth: true }),

  customerSignup: (payload) => api.post("/auth/customer/signup", payload),
  customerLogin: (payload) => api.post("/auth/customer/login", payload),
  customerMe: () => api.get("/auth/customer/me", { role: "customer", auth: true }),
};
