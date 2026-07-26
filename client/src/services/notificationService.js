import { api } from "./api";

export const notificationService = {
  getMine: (role) => api.get("/notifications", { role, auth: true }),
  markAllRead: (role) => api.patch("/notifications/read-all", {}, { role, auth: true }),
};
