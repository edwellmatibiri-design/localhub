import { suburbs } from "@/lib/mockData";

const FALLBACK_COORDINATES: Record<string, { lat: number; lng: number }> = {
  sandton: { lat: -26.1076, lng: 28.0567 },
  "sea-point": { lat: -33.9156, lng: 18.3813 },
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const earthRadius = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const root =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  const arc = 2 * Math.atan2(Math.sqrt(root), Math.sqrt(1 - root));
  return earthRadius * arc;
}

function coordinatesForSuburb(slug: string) {
  return FALLBACK_COORDINATES[slug] ?? null;
}

export type NearbySuburb = {
  name: string;
  slug: string;
  city: string;
  distanceKm: number;
};

export function getNearbySuburbs(
  suburbSlug: string,
  limit = 6,
): NearbySuburb[] {
  const source = coordinatesForSuburb(suburbSlug);
  if (!source) {
    return suburbs
      .filter((suburb) => suburb.slug !== suburbSlug)
      .slice(0, limit)
      .map((suburb, index) => ({
        name: suburb.name,
        slug: suburb.slug,
        city: suburb.city,
        distanceKm: index + 1,
      }));
  }

  return suburbs
    .filter((suburb) => suburb.slug !== suburbSlug)
    .map((suburb) => {
      const target = coordinatesForSuburb(suburb.slug) ?? source;
      return {
        name: suburb.name,
        slug: suburb.slug,
        city: suburb.city,
        distanceKm: Number(haversineKm(source, target).toFixed(1)),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function getRelatedServices(categorySlug: string, limit = 5): string[] {
  const suggestions: Record<string, string[]> = {
    plumbing: [
      "drain-cleaning",
      "geyser-repair",
      "leak-detection",
      "bathroom-renovation",
      "pipe-installation",
    ],
    electrical: [
      "generator-installation",
      "db-board-upgrades",
      "solar-inverter-service",
      "fault-finding",
      "lighting-upgrades",
    ],
    cleaning: [
      "move-out-cleaning",
      "office-cleaning",
      "carpet-cleaning",
      "window-cleaning",
      "deep-cleaning",
    ],
  };

  const defaults = [
    "emergency-service",
    "same-day-quotes",
    "trusted-local-pros",
    "licensed-contractors",
    "insured-services",
  ];
  return (suggestions[categorySlug] ?? defaults).slice(0, limit);
}
