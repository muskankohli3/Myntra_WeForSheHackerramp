import { api } from "./api";

export const recommendationService = {
  getNearby: () => api.get("/recommendations/nearby", { role: "customer", auth: true }),
};
