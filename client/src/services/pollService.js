import { api } from "./api";

export const pollService = {
  getForSession: (liveSessionId) => api.get(`/polls/live-session/${liveSessionId}`),
};
