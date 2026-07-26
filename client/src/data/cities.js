// Mirrors the city names in server/data/geoIndia.js — kept as plain
// "City, State" labels here since the client never needs lat/lng itself
// (the server resolves zone/coordinates at signup from the city name alone).
export const CITIES = [
  "Delhi, Delhi", "Mumbai, Maharashtra", "Bengaluru, Karnataka", "Chennai, Tamil Nadu",
  "Kolkata, West Bengal", "Hyderabad, Telangana", "Pune, Maharashtra", "Ahmedabad, Gujarat",
  "Patna, Bihar", "Gaya, Bihar", "Muzaffarpur, Bihar", "Bhagalpur, Bihar",
  "Ranchi, Jharkhand", "Jamshedpur, Jharkhand", "Bhubaneswar, Odisha", "Cuttack, Odisha",
  "Guwahati, Assam", "Dibrugarh, Assam", "Siliguri, West Bengal",
  "Jaipur, Rajasthan", "Jodhpur, Rajasthan", "Kota, Rajasthan", "Udaipur, Rajasthan",
  "Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh", "Varanasi, Uttar Pradesh", "Agra, Uttar Pradesh",
  "Meerut, Uttar Pradesh", "Gorakhpur, Uttar Pradesh", "Prayagraj, Uttar Pradesh",
  "Noida, Uttar Pradesh", "Gurugram, Haryana", "Faridabad, Haryana",
  "Chandigarh, Chandigarh", "Ludhiana, Punjab", "Amritsar, Punjab",
  "Jammu, Jammu & Kashmir", "Srinagar, Jammu & Kashmir", "Shimla, Himachal Pradesh", "Dehradun, Uttarakhand",
  "Indore, Madhya Pradesh", "Bhopal, Madhya Pradesh", "Gwalior, Madhya Pradesh", "Jabalpur, Madhya Pradesh",
  "Raipur, Chhattisgarh", "Nagpur, Maharashtra",
  "Surat, Gujarat", "Vadodara, Gujarat", "Rajkot, Gujarat", "Nashik, Maharashtra",
  "Aurangabad, Maharashtra", "Kolhapur, Maharashtra",
  "Belagavi, Karnataka", "Coimbatore, Tamil Nadu", "Madurai, Tamil Nadu", "Tiruchirapalli, Tamil Nadu",
  "Salem, Tamil Nadu", "Vijayawada, Andhra Pradesh", "Guntur, Andhra Pradesh",
  "Visakhapatnam, Andhra Pradesh", "Nellore, Andhra Pradesh", "Warangal, Telangana",
  "Mysuru, Karnataka", "Mangaluru, Karnataka", "Hubballi, Karnataka",
  "Kochi, Kerala", "Thiruvananthapuram, Kerala",
];

// City name only (what the signup form actually submits — the server looks
// this up in its own copy of the same list to resolve zone/lat/lng).
export const cityNameOnly = (label) => label.split(",")[0].trim();
