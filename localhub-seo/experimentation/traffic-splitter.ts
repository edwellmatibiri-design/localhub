export type Allocation = "A" | "B";

export function allocateVariant(seed: string): Allocation {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 2 === 0 ? "A" : "B";
}
