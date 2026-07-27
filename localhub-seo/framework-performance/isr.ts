export type RevalidatePolicy = {
  seconds: number;
  staleWhileRevalidateSeconds: number;
};

export type LandingPath = {
  category: string;
  suburb: string;
  city: string;
  priority: number;
  lastGeneratedAt?: string;
};

export const DEFAULT_REVALIDATE_POLICY: RevalidatePolicy = {
  seconds: 60 * 60 * 24,
  staleWhileRevalidateSeconds: 60 * 60,
};

export function buildLandingPath(category: string, suburb: string): string {
  return `/${encodeURIComponent(category)}/${encodeURIComponent(suburb)}`;
}

export function shouldPreGenerate(path: LandingPath, threshold = 70): boolean {
  return path.priority >= threshold;
}

export function nextRevalidateAt(
  now: Date,
  policy: RevalidatePolicy = DEFAULT_REVALIDATE_POLICY,
): Date {
  return new Date(now.getTime() + policy.seconds * 1000);
}

export function shouldRevalidate(
  now: Date,
  lastGeneratedAtIso: string,
  policy: RevalidatePolicy = DEFAULT_REVALIDATE_POLICY,
): boolean {
  const last = new Date(lastGeneratedAtIso);
  if (Number.isNaN(last.valueOf())) {
    return true;
  }
  return now.getTime() - last.getTime() >= policy.seconds * 1000;
}

export function sortByPriority(paths: LandingPath[]): LandingPath[] {
  return [...paths].sort((a, b) => b.priority - a.priority);
}
