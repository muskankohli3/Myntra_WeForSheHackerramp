// Central fetch wrapper. Uses a relative "/api" base so Vite's dev-server
// proxy (see vite.config.js) forwards requests to the Express backend —
// this also means it works unmodified when the app is opened from another
// device on the same network (no hardcoded "localhost").

const BASE_URL = "/api";

function getToken(role) {
  return localStorage.getItem(role === "seller" ? "mge_seller_token" : "mge_customer_token");
}

/**
 * @param {string} path - e.g. "/products"
 * @param {object} options - { method, body, role: "seller"|"customer"|null, auth: boolean }
 */
async function request(path, { method = "GET", body, role = null, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken(role);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

export { getToken };
