const { haversineKm } = require("../../data/geoIndia");

// Bharat idea #2: "This seller near you is selling this" / "People near you
// are buying this" — blended with the customer's own browsing history so it
// isn't just a city filter. Deterministic scoring (no LLM needed here either)
// so it's instant and explainable — every product surfaced can say exactly
// why (see the `reason` field), which matters more for trust than a black-box
// ranking would.

function scoreProductForCustomer(product, customer, regionalDemandByCategory) {
  let score = 0;
  const reasons = [];

  const sellerZone = product.sellerId?.zone;
  const sellerCity = product.sellerId?.city;

  if (customer.city && sellerCity && customer.city === sellerCity) {
    score += 40;
    reasons.push(`Sold by a seller in ${sellerCity}, your city`);
  } else if (customer.zone && sellerZone && customer.zone === sellerZone) {
    score += 20;
    reasons.push(`Sold by a ${sellerZone} India seller near you`);
  }

  const recentCategories = new Set((customer.browsingHistory || []).map((h) => h.category));
  const wishlistCategories = new Set(customer.wishlistCategories || []);
  if (recentCategories.has(product.category)) {
    score += 25;
    reasons.push(`Because you viewed ${product.category} recently`);
  }
  if (wishlistCategories.has(product.category)) {
    score += 15;
    reasons.push(`Matches your ${product.category} interest`);
  }

  const demandScore = regionalDemandByCategory?.[product.category];
  if (typeof demandScore === "number") {
    score += Math.round(demandScore / 6); // up to ~16 points
    if (demandScore >= 70) reasons.push(`${product.category} is trending near you`);
  }

  if (product.conversions > 0 && product.impressions > 0) {
    score += Math.min(10, (product.conversions / product.impressions) * 100);
  }

  return { score, reason: reasons[0] || "Popular with shoppers like you" };
}

function nearbySellers(sellers, customer, limit = 8) {
  return sellers
    .map((seller) => {
      const distanceKm = haversineKm(customer.lat, customer.lng, seller.lat, seller.lng);
      const sameCity = customer.city && seller.city === customer.city;
      const sameZone = customer.zone && seller.zone === customer.zone;
      return { seller, distanceKm, sameCity, sameZone };
    })
    .filter((entry) => entry.sameZone || entry.distanceKm !== null)
    .sort((a, b) => {
      if (a.sameCity !== b.sameCity) return a.sameCity ? -1 : 1;
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      return (b.seller.growthScore || 0) - (a.seller.growthScore || 0);
    })
    .slice(0, limit);
}

module.exports = { scoreProductForCustomer, nearbySellers };
