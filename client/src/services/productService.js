import { api } from "./api";

export const productService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/products${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => api.get(`/products/${id}`),
  getBySeller: (sellerId) => api.get(`/products/seller/${sellerId}`),
  getMine: () => api.get("/products/mine", { role: "seller", auth: true }),
  create: (payload) => api.post("/products", payload, { role: "seller", auth: true }),
  update: (id, payload) => api.patch(`/products/${id}`, payload, { role: "seller", auth: true }),
  remove: (id) => api.delete(`/products/${id}`, { role: "seller", auth: true }),
  registerImpression: (id) => api.patch(`/products/${id}/impression`, {}, { role: "customer", auth: true }),
};
