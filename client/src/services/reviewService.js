import { api } from "./api";

export const reviewService = {
  submit: (payload) => api.post("/reviews", payload, { role: "customer", auth: true }),
  getMine: () => api.get("/reviews/mine", { role: "customer", auth: true }),
  getForProduct: (productId) => api.get(`/reviews/product/${productId}`),
  getForSeller: (sellerId) => api.get(`/reviews/seller/${sellerId}`),
};
