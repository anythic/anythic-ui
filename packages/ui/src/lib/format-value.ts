/** Shows strings as-is and everything else as indented JSON. */
export function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    // Circular structures and BigInt cannot be serialised.
    return String(value);
  }
}
