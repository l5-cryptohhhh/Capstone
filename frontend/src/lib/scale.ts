/** Posizione orizzontale (in % della scala) di un percentile, limitata a 0-100. */
export function scalePosition(percentile: number): number {
  return Math.min(100, Math.max(0, percentile))
}
