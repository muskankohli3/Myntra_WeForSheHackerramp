import { api } from "./api";

export const regionalDemandService = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/regional-demand${qs ? `?${qs}` : ""}`, { role: "seller", auth: true });
  },
  getMine: () => api.get("/regional-demand/mine", { role: "seller", auth: true }),
  getNarrative: (id) => api.get(`/regional-demand/${id}/narrative`, { role: "seller", auth: true }),
};
