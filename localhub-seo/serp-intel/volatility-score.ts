export function calculateVolatilityScore(positionDeltas: number[]): number {
  if (positionDeltas.length === 0) {
    return 0;
  }

  const absolute = positionDeltas.map((value) => Math.abs(value));
  const mean = absolute.reduce((sum, value) => sum + value, 0) / absolute.length;
  return Math.min(100, Math.round(mean * 10));
}
