// Static data for the Skyline Airways demo. No backend — everything the
// "booking" experience needs is computed client-side from these tables.

export const AIRPORTS = [
  { code: "TEB", city: "New York",     country: "United States", lat: 40.85, lng: -74.06 },
  { code: "LAX", city: "Los Angeles",  country: "United States", lat: 33.94, lng: -118.41 },
  { code: "MIA", city: "Miami",        country: "United States", lat: 25.79, lng: -80.29 },
  { code: "LFPB",city: "Paris",        country: "France",        lat: 48.97, lng: 2.44 },
  { code: "LCY", city: "London",       country: "United Kingdom",lat: 51.50, lng: 0.05 },
  { code: "LIML",city: "Milan",        country: "Italy",         lat: 45.45, lng: 9.28 },
  { code: "LSGG",city: "Geneva",       country: "Switzerland",   lat: 46.24, lng: 6.11 },
  { code: "OMDB",city: "Dubai",        country: "U.A.E.",        lat: 25.25, lng: 55.36 },
  { code: "RJTT",city: "Tokyo",        country: "Japan",         lat: 35.55, lng: 139.78 },
  { code: "YSSY",city: "Sydney",       country: "Australia",     lat: -33.95,lng: 151.18 },
];

// Curated set of marquee destinations for the grid.
export const DESTINATIONS = [
  { code: "LCY", city: "London",   country: "United Kingdom", from: "New York", hours: 6.8 },
  { code: "LFPB",city: "Paris",    country: "France",         from: "New York", hours: 7.1 },
  { code: "LSGG",city: "Geneva",   country: "Switzerland",    from: "London",   hours: 1.4 },
  { code: "OMDB",city: "Dubai",    country: "U.A.E.",         from: "Paris",    hours: 6.5 },
  { code: "LAX", city: "Los Angeles", country: "United States", from: "New York", hours: 5.4 },
  { code: "MIA", city: "Miami",    country: "United States",  from: "New York", hours: 2.9 },
  { code: "LIML",city: "Milan",    country: "Italy",          from: "London",   hours: 1.8 },
  { code: "RJTT",city: "Tokyo",    country: "Japan",          from: "Los Angeles", hours: 11.2 },
  { code: "YSSY",city: "Sydney",   country: "Australia",      from: "Tokyo",        hours: 9.5 },
];

export const FLEET = [
  {
    id: "light",
    name: "The Meridian",
    klass: "Light Jet",
    glyph: "✦",
    blurb:
      "Nimble and intimate. Built for the spontaneous weekend and the short hop most airlines make a chore. Step on minutes before wheels-up.",
    rate: 4200, // USD per flight hour, used by the quote engine
    specs: [
      ["Passengers", "6"],
      ["Range", "1,800 nm"],
      ["Cruise", "470 kts"],
      ["Cabin height", "4.9 ft"],
    ],
  },
  {
    id: "mid",
    name: "The Continental",
    klass: "Midsize Jet",
    glyph: "✧",
    blurb:
      "Our signature. Stand-up cabin, transcontinental legs, and a galley that turns altitude into a dinner reservation. The everyday extraordinary.",
    rate: 6800,
    specs: [
      ["Passengers", "9"],
      ["Range", "3,400 nm"],
      ["Cruise", "505 kts"],
      ["Cabin height", "5.8 ft"],
    ],
  },
  {
    id: "heavy",
    name: "The Sovereign",
    klass: "Ultra-Long-Range",
    glyph: "❖",
    blurb:
      "Continents are a formality. A private suite, a full bed, and the range to cross any ocean nonstop while you sleep through the timezone.",
    rate: 11500,
    specs: [
      ["Passengers", "14"],
      ["Range", "7,500 nm"],
      ["Cruise", "560 kts"],
      ["Cabin height", "6.2 ft"],
    ],
  },
];

// --- Quote engine -------------------------------------------------------
const R = 6371; // km
const toRad = (d) => (d * Math.PI) / 180;

export function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Returns null when origin/destination are missing or identical.
export function quote(fromCode, toCode, passengers, jet) {
  const a = AIRPORTS.find((x) => x.code === fromCode);
  const b = AIRPORTS.find((x) => x.code === toCode);
  if (!a || !b || a.code === b.code) return null;

  const km = distanceKm(a, b);
  const cruiseKmh = 880;
  const hours = km / cruiseKmh + 0.55; // taxi, climb, descent overhead
  const price = Math.round((hours * jet.rate) / 500) * 500;
  const co2 = Math.round(km * 0.55 * Math.max(1, passengers / 4)); // kg, illustrative

  return {
    from: a,
    to: b,
    km: Math.round(km),
    hours,
    durationLabel: `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`,
    price,
    co2,
    jet,
  };
}
