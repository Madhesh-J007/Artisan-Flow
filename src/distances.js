// Approximate road distances (km) between locations used in the demo dataset.
// Not geographically precise — good enough for demo-realistic location scoring.

export const DISTANCES = {
  "Madurai|Madurai": 0,
  "Madurai|Chennai": 460,
  "Madurai|Coimbatore": 215,
  "Madurai|Thoothukudi": 145,
  "Madurai|Tirunelveli": 155,
  "Madurai|Bengaluru": 435,

  "Chennai|Chennai": 0,
  "Chennai|Coimbatore": 500,
  "Chennai|Thoothukudi": 600,
  "Chennai|Tirunelveli": 620,
  "Chennai|Bengaluru": 345,

  "Coimbatore|Coimbatore": 0,
  "Coimbatore|Thoothukudi": 350,
  "Coimbatore|Tirunelveli": 320,
  "Coimbatore|Bengaluru": 365,

  "Thoothukudi|Thoothukudi": 0,
  "Thoothukudi|Tirunelveli": 45,
  "Thoothukudi|Bengaluru": 640,

  "Tirunelveli|Tirunelveli": 0,
  "Tirunelveli|Bengaluru": 600,

  "Bengaluru|Bengaluru": 0
};

/**
 * Returns approximate distance in km between two locations.
 * Symmetric lookup — order doesn't matter.
 */
export function getDistanceKm(locationA, locationB) {
  if (!locationA || !locationB) return null;
  const key1 = `${locationA}|${locationB}`;
  const key2 = `${locationB}|${locationA}`;
  if (key1 in DISTANCES) return DISTANCES[key1];
  if (key2 in DISTANCES) return DISTANCES[key2];
  return 999; // unknown pairing — treat as far
}
