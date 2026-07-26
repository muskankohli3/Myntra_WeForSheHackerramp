import { api } from "./api";

export const opportunityService = {
  getMine: () => api.get("/opportunities/mine", { role: "seller", auth: true }),
  getById: (id) => api.get(`/opportunities/${id}`, { role: "seller", auth: true }),
  why: (id) => api.post(`/opportunities/${id}/why`, {}, { role: "seller", auth: true }),
  demandNarrative: (id) => api.post(`/opportunities/${id}/demand-narrative`, {}, { role: "seller", auth: true }),
  reviveRewrite: (id) => api.post(`/opportunities/${id}/revive-rewrite`, {}, { role: "seller", auth: true }),
  dismiss: (id) => api.patch(`/opportunities/${id}/dismiss`, {}, { role: "seller", auth: true }),
};
