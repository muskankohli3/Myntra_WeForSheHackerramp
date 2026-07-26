// Bharat idea #1 — a product can carry both a "local" presentation (the
// seller's own regional name/terms) and a "global" one (metro/national
// fashion vocabulary), generated together by the AI naming tool (see
// SellerProductNamingTool.jsx). This resolves which one to show BY DEFAULT
// based on the shopper's own city tier — a Tier-2/3 shopper in the same
// region as the seller sees the local name first; a metro shopper sees the
// global one first — while every product card still exposes a manual toggle
// (see NameToggle.jsx) so nobody's stuck with the default.

export function hasBothNamings(product) {
  return Boolean(product?.localName && product?.globalName);
}

// "local" | "global" — which presentation to show first for this customer.
export function defaultNamingMode(product, customer) {
  if (!hasBothNamings(product)) return "primary";
  if (!customer) return "global"; // logged-out browsing defaults to the broader, more universally-understood name
  const sameZoneAsSeller = customer.zone && product.sellerId?.zone && customer.zone === product.sellerId.zone;
  const customerIsBharat = customer.cityTier === "T2" || customer.cityTier === "T3";
  return customerIsBharat || sameZoneAsSeller ? "local" : "global";
}

// Resolves the actual { name, description } to render for a given mode.
export function resolveProductNaming(product, mode) {
  if (!product) return { name: "", description: "" };
  if (mode === "local" && product.localName) {
    return { name: product.localName, description: product.localDescription || product.description };
  }
  if (mode === "global" && product.globalName) {
    return { name: product.globalName, description: product.globalDescription || product.description };
  }
  return { name: product.name, description: product.description };
}
