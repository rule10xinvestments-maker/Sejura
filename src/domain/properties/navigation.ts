export function propertyScopedHref(path: string, propertyId?: string | null) {
  if (!propertyId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}propertyId=${encodeURIComponent(propertyId)}`;
}

