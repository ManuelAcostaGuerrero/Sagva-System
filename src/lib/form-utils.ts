export function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function optionalStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length > 0 ? value : undefined;
}

export function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(String(formData.get(key) ?? "").replace(",", "."));
  return Number.isFinite(value) ? value : fallback;
}
