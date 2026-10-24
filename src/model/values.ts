/**
 * Whether two stored values are the same value. Object keys are compared in any
 * order, because a database may hand an object back with its keys reordered
 * (Postgres `jsonb` does), and `{ min, max }` is still the range it stored.
 */
export function sameValue(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b)
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
    : item)
}
