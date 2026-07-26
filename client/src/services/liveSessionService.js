import { api } from "./api";

export const liveSessionService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/live-sessions${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => api.get(`/live-sessions/${id}`),
  getMine: () => api.get("/live-sessions/mine", { role: "seller", auth: true }),
  create: (payload) => api.post("/live-sessions", payload, { role: "seller", auth: true }),
  start: (id) => api.patch(`/live-sessions/${id}/start`, {}, { role: "seller", auth: true }),
  end: (id) => api.patch(`/live-sessions/${id}/end`, {}, { role: "seller", auth: true }),
  pause: (id) => api.patch(`/live-sessions/${id}/pause`, {}, { role: "seller", auth: true }),
  resume: (id) => api.patch(`/live-sessions/${id}/resume`, {}, { role: "seller", auth: true }),
  pin: (id, productId) => api.patch(`/live-sessions/${id}/pin`, { productId }, { role: "seller", auth: true }),
  getReplay: (id) => api.get(`/live-sessions/${id}/replay`),
};
