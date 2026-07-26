import { api } from "./api";

export const analyticsService = {
  getMine: () => api.get("/analytics/mine", { role: "seller", auth: true }),
  getForSession: (liveSessionId) => api.get(`/analytics/session/${liveSessionId}`, { role: "seller", auth: true }),
  generateInsight: (liveSessionId) =>
    api.post(`/analytics/session/${liveSessionId}/insight`, {}, { role: "seller", auth: true }),
};
