// Shared "Bharat" geography dataset — one source of truth for every feature that
// needs to reason about where a seller/customer/demand-signal is: seller/customer
// signup (city -> zone/lat/lng lookup), the seed script (realistic spread of
// sellers & customers across T2/T3 India), nearby recommendations (distance),
// and the Regional Demand board on the seller dashboard.
//
// Coordinates are approximate city-centre values — good enough for a "which
// zone / roughly how far" prototype, not for turn-by-turn navigation.

const CITIES = [
  // ---- Metro / Tier-1 (kept intentionally few — this build is about Bharat) ----
  { city: "Delhi", state: "Delhi", zone: "North", tier: "T1", lat: 28.61, lng: 77.21 },
  { city: "Mumbai", state: "Maharashtra", zone: "West", tier: "T1", lat: 19.08, lng: 72.88 },
  { city: "Bengaluru", state: "Karnataka", zone: "South", tier: "T1", lat: 12.97, lng: 77.59 },
  { city: "Chennai", state: "Tamil Nadu", zone: "South", tier: "T1", lat: 13.08, lng: 80.27 },
  { city: "Kolkata", state: "West Bengal", zone: "East", tier: "T1", lat: 22.57, lng: 88.36 },
  { city: "Hyderabad", state: "Telangana", zone: "South", tier: "T1", lat: 17.39, lng: 78.49 },
  { city: "Pune", state: "Maharashtra", zone: "West", tier: "T1", lat: 18.52, lng: 73.86 },
  { city: "Ahmedabad", state: "Gujarat", zone: "West", tier: "T1", lat: 23.03, lng: 72.58 },

  // ---- Tier-2 / Tier-3 "Bharat" cities — where the next 100M shoppers are ----
  { city: "Patna", state: "Bihar", zone: "East", tier: "T2", lat: 25.59, lng: 85.14 },
  { city: "Gaya", state: "Bihar", zone: "East", tier: "T3", lat: 24.8, lng: 85.0 },
  { city: "Muzaffarpur", state: "Bihar", zone: "East", tier: "T3", lat: 26.12, lng: 85.39 },
  { city: "Bhagalpur", state: "Bihar", zone: "East", tier: "T3", lat: 25.24, lng: 86.98 },
  { city: "Ranchi", state: "Jharkhand", zone: "East", tier: "T2", lat: 23.34, lng: 85.31 },
  { city: "Jamshedpur", state: "Jharkhand", zone: "East", tier: "T3", lat: 22.8, lng: 86.18 },
  { city: "Bhubaneswar", state: "Odisha", zone: "East", tier: "T2", lat: 20.3, lng: 85.82 },
  { city: "Cuttack", state: "Odisha", zone: "East", tier: "T3", lat: 20.46, lng: 85.88 },
  { city: "Guwahati", state: "Assam", zone: "Northeast", tier: "T2", lat: 26.14, lng: 91.74 },
  { city: "Dibrugarh", state: "Assam", zone: "Northeast", tier: "T3", lat: 27.48, lng: 94.9 },
  { city: "Siliguri", state: "West Bengal", zone: "East", tier: "T3", lat: 26.73, lng: 88.43 },
  { city: "Jaipur", state: "Rajasthan", zone: "North", tier: "T2", lat: 26.91, lng: 75.79 },
  { city: "Jodhpur", state: "Rajasthan", zone: "North", tier: "T3", lat: 26.24, lng: 73.02 },
  { city: "Kota", state: "Rajasthan", zone: "North", tier: "T3", lat: 25.21, lng: 75.86 },
  { city: "Udaipur", state: "Rajasthan", zone: "North", tier: "T3", lat: 24.58, lng: 73.68 },
  { city: "Lucknow", state: "Uttar Pradesh", zone: "North", tier: "T2", lat: 26.85, lng: 80.95 },
  { city: "Kanpur", state: "Uttar Pradesh", zone: "North", tier: "T2", lat: 26.45, lng: 80.33 },
  { city: "Varanasi", state: "Uttar Pradesh", zone: "North", tier: "T3", lat: 25.32, lng: 82.97 },
  { city: "Agra", state: "Uttar Pradesh", zone: "North", tier: "T3", lat: 27.18, lng: 78.02 },
  { city: "Meerut", state: "Uttar Pradesh", zone: "North", tier: "T3", lat: 28.98, lng: 77.71 },
  { city: "Gorakhpur", state: "Uttar Pradesh", zone: "North", tier: "T3", lat: 26.76, lng: 83.37 },
  { city: "Prayagraj", state: "Uttar Pradesh", zone: "North", tier: "T3", lat: 25.44, lng: 81.85 },
  { city: "Noida", state: "Uttar Pradesh", zone: "North", tier: "T2", lat: 28.54, lng: 77.39 },
  { city: "Gurugram", state: "Haryana", zone: "North", tier: "T2", lat: 28.46, lng: 77.03 },
  { city: "Faridabad", state: "Haryana", zone: "North", tier: "T3", lat: 28.41, lng: 77.32 },
  { city: "Chandigarh", state: "Chandigarh", zone: "North", tier: "T2", lat: 30.73, lng: 76.78 },
  { city: "Ludhiana", state: "Punjab", zone: "North", tier: "T2", lat: 30.9, lng: 75.85 },
  { city: "Amritsar", state: "Punjab", zone: "North", tier: "T3", lat: 31.63, lng: 74.87 },
  { city: "Jammu", state: "Jammu & Kashmir", zone: "North", tier: "T3", lat: 32.73, lng: 74.87 },
  { city: "Srinagar", state: "Jammu & Kashmir", zone: "North", tier: "T3", lat: 34.08, lng: 74.79 },
  { city: "Shimla", state: "Himachal Pradesh", zone: "North", tier: "T3", lat: 31.1, lng: 77.17 },
  { city: "Dehradun", state: "Uttarakhand", zone: "North", tier: "T3", lat: 30.32, lng: 78.03 },
  { city: "Indore", state: "Madhya Pradesh", zone: "Central", tier: "T2", lat: 22.72, lng: 75.86 },
  { city: "Bhopal", state: "Madhya Pradesh", zone: "Central", tier: "T2", lat: 23.26, lng: 77.41 },
  { city: "Gwalior", state: "Madhya Pradesh", zone: "Central", tier: "T3", lat: 26.22, lng: 78.18 },
  { city: "Jabalpur", state: "Madhya Pradesh", zone: "Central", tier: "T3", lat: 23.18, lng: 79.99 },
  { city: "Raipur", state: "Chhattisgarh", zone: "Central", tier: "T2", lat: 21.25, lng: 81.63 },
  { city: "Nagpur", state: "Maharashtra", zone: "Central", tier: "T2", lat: 21.15, lng: 79.09 },
  { city: "Surat", state: "Gujarat", zone: "West", tier: "T2", lat: 21.17, lng: 72.83 },
  { city: "Vadodara", state: "Gujarat", zone: "West", tier: "T3", lat: 22.31, lng: 73.18 },
  { city: "Rajkot", state: "Gujarat", zone: "West", tier: "T3", lat: 22.3, lng: 70.8 },
  { city: "Nashik", state: "Maharashtra", zone: "West", tier: "T3", lat: 19.99, lng: 73.79 },
  { city: "Aurangabad", state: "Maharashtra", zone: "West", tier: "T3", lat: 19.88, lng: 75.34 },
  { city: "Kolhapur", state: "Maharashtra", zone: "West", tier: "T3", lat: 16.7, lng: 74.24 },
  { city: "Belagavi", state: "Karnataka", zone: "South", tier: "T3", lat: 15.85, lng: 74.5 },
  { city: "Coimbatore", state: "Tamil Nadu", zone: "South", tier: "T2", lat: 11.02, lng: 76.96 },
  { city: "Madurai", state: "Tamil Nadu", zone: "South", tier: "T3", lat: 9.93, lng: 78.12 },
  { city: "Tiruchirapalli", state: "Tamil Nadu", zone: "South", tier: "T3", lat: 10.79, lng: 78.7 },
  { city: "Salem", state: "Tamil Nadu", zone: "South", tier: "T3", lat: 11.66, lng: 78.15 },
  { city: "Vijayawada", state: "Andhra Pradesh", zone: "South", tier: "T2", lat: 16.51, lng: 80.63 },
  { city: "Guntur", state: "Andhra Pradesh", zone: "South", tier: "T3", lat: 16.3, lng: 80.44 },
  { city: "Visakhapatnam", state: "Andhra Pradesh", zone: "South", tier: "T2", lat: 17.68, lng: 83.22 },
  { city: "Nellore", state: "Andhra Pradesh", zone: "South", tier: "T3", lat: 14.44, lng: 79.99 },
  { city: "Warangal", state: "Telangana", zone: "South", tier: "T3", lat: 17.98, lng: 79.6 },
  { city: "Mysuru", state: "Karnataka", zone: "South", tier: "T3", lat: 12.3, lng: 76.65 },
  { city: "Mangaluru", state: "Karnataka", zone: "South", tier: "T3", lat: 12.87, lng: 74.88 },
  { city: "Hubballi", state: "Karnataka", zone: "South", tier: "T3", lat: 15.36, lng: 75.12 },
  { city: "Kochi", state: "Kerala", zone: "South", tier: "T2", lat: 9.93, lng: 76.27 },
  { city: "Thiruvananthapuram", state: "Kerala", zone: "South", tier: "T2", lat: 8.52, lng: 76.94 },
];

const ZONES = ["North", "South", "East", "West", "Central", "Northeast"];

// Rough "what's coming up" festival calendar used to flavour the Regional
// Demand board with a reason, not just a number. Not meant to be exact dates —
// this is a growth-signal demo, so each entry is tagged to the zones where it
// drives the biggest seasonal spike.
const FESTIVALS = [
  { name: "Diwali", zones: ["North", "West", "Central"], categories: ["Kurtas", "Dresses", "Jackets"] },
  { name: "Durga Puja", zones: ["East"], categories: ["Kurtas", "Dresses", "Shirts"] },
  { name: "Onam", zones: ["South"], categories: ["Kurtas", "Shirts"] },
  { name: "Pongal", zones: ["South"], categories: ["Kurtas", "T-Shirts"] },
  { name: "Bihu", zones: ["Northeast"], categories: ["Kurtas", "T-Shirts"] },
  { name: "Baisakhi", zones: ["North"], categories: ["Kurtas", "Shirts"] },
  { name: "Ganesh Chaturthi", zones: ["West", "South"], categories: ["Shirts", "T-Shirts"] },
  { name: "Navratri", zones: ["West", "North"], categories: ["Dresses", "Kurtas"] },
  { name: "Eid", zones: ["North", "East", "South"], categories: ["Kurtas", "Shirts"] },
  { name: "Holi", zones: ["North", "Central"], categories: ["T-Shirts", "Hoodies"] },
];

function haversineKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v === undefined || v === null)) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Case-insensitive, punctuation-tolerant city lookup — used at signup so a
// seller/customer just picks or types a city name and we resolve zone/lat/lng
// automatically instead of asking them for coordinates.
function findCity(name) {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  return (
    CITIES.find((c) => c.city.toLowerCase() === clean) ||
    CITIES.find((c) => c.city.toLowerCase().includes(clean) || clean.includes(c.city.toLowerCase())) ||
    null
  );
}

function randomCity(filter) {
  const pool = filter ? CITIES.filter(filter) : CITIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { CITIES, ZONES, FESTIVALS, haversineKm, findCity, randomCity };
