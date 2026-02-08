/**
 * Returns singular form when n === 1, otherwise plural (or custom many form).
 * e.g. plural(1, 'floor') → 'floor', plural(2, 'floor') → 'floors'
 * e.g. plural(1, 'boundary', 'boundaries') → 'boundary', plural(2, 'boundary', 'boundaries') → 'boundaries'
 */
export function plural(n: number, one: string, many: string = one + 's'): string {
  return n === 1 ? one : many;
}
