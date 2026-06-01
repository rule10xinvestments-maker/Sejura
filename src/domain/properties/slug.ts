const romanianCharacterMap: Record<string, string> = {
  "\u0103": "a",
  "\u00e2": "a",
  "\u00ee": "i",
  "\u0219": "s",
  "\u015f": "s",
  "\u021b": "t",
  "\u0163": "t"
};

export function generatePropertySlug(name: string | null | undefined) {
  const normalized = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\u0103\u00e2\u00ee\u0219\u015f\u021b\u0163]/g, (character) => {
      return romanianCharacterMap[character] ?? character;
    })
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || "proprietate";
}
