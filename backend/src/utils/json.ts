export function toJsonArray(value?: string[] | null): string {
  return JSON.stringify(value ?? []);
}

export function parseJsonArray(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toJsonObject(value?: Record<string, unknown> | null): string | undefined {
  if (!value) return undefined;
  return JSON.stringify(value);
}
