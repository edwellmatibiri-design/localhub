export type Point = {
  id: string;
  lat: number;
  lon: number;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(a: Point, b: Point): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function findNeighbors(origin: Point, points: Point[], radiusKm: number): Point[] {
  return points
    .filter((p) => p.id !== origin.id)
    .filter((p) => haversineKm(origin, p) <= radiusKm)
    .sort((a, b) => haversineKm(origin, a) - haversineKm(origin, b));
}
