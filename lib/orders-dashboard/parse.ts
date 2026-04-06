/** API returns monetary values as decimal strings */
export function parseDecimalString(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
