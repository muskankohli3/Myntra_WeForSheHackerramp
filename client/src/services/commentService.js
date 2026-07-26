import { api } from "./api";

export const commentService = {
  getForSession: (liveSessionId) => api.get(`/comments/live-session/${liveSessionId}`),
};
