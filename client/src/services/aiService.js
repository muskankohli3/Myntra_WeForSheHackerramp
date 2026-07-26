import { api } from "./api";

export const aiService = {
  status: () => api.get("/ai/status"),
  prepCoach: (productIds) => api.post("/ai/prep-coach", { productIds }, { role: "seller", auth: true }),
  translateCaption: (text, targetLanguage) => api.post("/ai/translate-caption", { text, targetLanguage }),
  // Bharat idea #1 — local vs. global product naming from a photo.
  productNaming: (payload) => api.post("/ai/product-naming", payload, { role: "seller", auth: true }),
  liveAssistantTip: (stats) => api.post("/ai/live-assistant-tip", stats, { role: "seller", auth: true }),
  chatSummary: (liveSessionId) => api.post("/ai/chat-summary", { liveSessionId }, { role: "seller", auth: true }),
};
