import { api } from "./api";

export const sellerService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/sellers${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => api.get(`/sellers/${id}`),
};
