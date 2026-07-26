import { api } from "./api";

export const orderService = {
  create: (payload) => api.post("/orders", payload, { role: "customer", auth: true }),
  getMine: () => api.get("/orders/mine", { role: "customer", auth: true }),
  getById: (id) => api.get(`/orders/${id}`),
  getSellerOrders: () => api.get("/orders/seller/mine", { role: "seller", auth: true }),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }, { role: "seller", auth: true }),
};
