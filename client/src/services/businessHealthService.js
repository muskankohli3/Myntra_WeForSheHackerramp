import { api } from "./api";

export const businessHealthService = {
  getMine: () => api.get("/business-health/mine", { role: "seller", auth: true }),
};
