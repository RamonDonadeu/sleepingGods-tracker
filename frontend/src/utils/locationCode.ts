export function isLocationCode(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value.trim());
}

export function normalizeLocationCode(value: string): string {
  return value.trim();
}
