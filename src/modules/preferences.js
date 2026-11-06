// Kategori ve tercih verisi modeli.

export const CATEGORIES = ["necessary", "analytics", "marketing", "preferences"];

export function defaults() {
  return { necessary: true, analytics: false, marketing: false, preferences: false };
}

// Saklanan verinin geçerli olup olmadığını denetler.
// Sürüm uyuşmazlığı veya bozuk veri = tercih yok (yeniden sorulur).
export function isValid(stored, version) {
  return !!stored &&
    stored.version === version &&
    typeof stored.updatedAt === "string" &&
    stored.necessary === true &&
    CATEGORIES.every((c) => typeof stored[c] === "boolean");
}

export function build(choices, version) {
  const out = { version: version };
  CATEGORIES.forEach((c) => {
    out[c] = c === "necessary" ? true : choices[c] === true;
  });
  out.updatedAt = new Date().toISOString();
  return out;
}

export function allChoices(value) {
  const out = defaults();
  CATEGORIES.forEach((c) => { if (c !== "necessary") out[c] = value; });
  return out;
}
