import type { AustralianStateCode } from "../types/holiday";

interface GeoResult {
  state: AustralianStateCode;
  name: string;
}

// Rough bounding boxes for Australian states/territories
// Used as fallback when reverse geocoding isn't available
const STATE_BOUNDS: {
  code: AustralianStateCode;
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}[] = [
  { code: "WA", name: "Western Australia", minLat: -35.2, maxLat: -13.7, minLng: 112.9, maxLng: 129.0 },
  { code: "NT", name: "Northern Territory", minLat: -26.0, maxLat: -10.9, minLng: 129.0, maxLng: 138.0 },
  { code: "SA", name: "South Australia", minLat: -38.1, maxLat: -26.0, minLng: 129.0, maxLng: 141.0 },
  { code: "QLD", name: "Queensland", minLat: -29.2, maxLat: -10.7, minLng: 138.0, maxLng: 153.6 },
  { code: "NSW", name: "New South Wales", minLat: -37.5, maxLat: -28.2, minLng: 141.0, maxLng: 153.7 },
  { code: "VIC", name: "Victoria", minLat: -39.2, maxLat: -33.9, minLng: 140.9, maxLng: 150.0 },
  { code: "TAS", name: "Tasmania", minLat: -43.7, maxLat: -39.5, minLng: 143.8, maxLng: 148.5 },
  { code: "ACT", name: "Australian Capital Territory", minLat: -35.9, maxLat: -35.1, minLng: 148.7, maxLng: 149.4 },
];

function stateFromCoords(lat: number, lng: number): GeoResult | null {
  // Check ACT first (smallest, inside NSW)
  const act = STATE_BOUNDS.find((s) => s.code === "ACT")!;
  if (lat >= act.minLat && lat <= act.maxLat && lng >= act.minLng && lng <= act.maxLng) {
    return { state: "ACT", name: act.name };
  }

  for (const s of STATE_BOUNDS) {
    if (s.code === "ACT") continue;
    if (lat >= s.minLat && lat <= s.maxLat && lng >= s.minLng && lng <= s.maxLng) {
      return { state: s.code, name: s.name };
    }
  }
  return null;
}

export function detectState(): Promise<GeoResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve(stateFromCoords(latitude, longitude));
      },
      () => {
        // User denied or error — that's fine
        resolve(null);
      },
      { timeout: 5000, maximumAge: 600000 }
    );
  });
}
