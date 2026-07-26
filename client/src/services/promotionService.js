import { api } from "./api";

export const promotionService = {
  getForSession: (liveSessionId) => api.get(`/promotions/live-session/${liveSessionId}`),
};
