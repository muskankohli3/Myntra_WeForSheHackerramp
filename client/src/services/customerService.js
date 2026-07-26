import { api } from "./api";

export const customerService = {
  follow: (sellerId) => api.post(`/customers/follow/${sellerId}`, {}, { role: "customer", auth: true }),
  unfollow: (sellerId) => api.post(`/customers/unfollow/${sellerId}`, {}, { role: "customer", auth: true }),
  getFollowedSellers: () => api.get("/customers/followed-sellers", { role: "customer", auth: true }),
};
