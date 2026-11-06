// Script etiketindeki data-* özelliklerinden yapılandırmayı okur.
// Tüm ayarlar opsiyoneldir; geçersiz değerler varsayılana düşer.

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function pick(value, allowed, fallback) {
  const v = (value || "").trim().toLowerCase();
  return allowed.indexOf(v) !== -1 ? v : fallback;
}

function expandHex(hex) {
  return hex.length === 4
    ? "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    : hex;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

// Birincil renk üzerindeki metin için en okunaklı rengi seçer.
function onColor(hex) {
  const l = luminance(hex);
  const dark = luminance("#15171c");
  const contrastDark = (l + 0.05) / (dark + 0.05);
  const contrastLight = 1.05 / (l + 0.05);
  return contrastDark >= contrastLight ? "#15171c" : "#ffffff";
}

// javascript: gibi tehlikeli şemaları engeller; yalnızca http(s) ve göreli adresler geçer.
export function safeUrl(value) {
  if (!value) return "";
  try {
    const u = new URL(value, window.location.href);
    return u.protocol === "http:" || u.protocol === "https:" ? value : "";
  } catch (e) {
    return "";
  }
}

export function readConfig(script, supportedLanguages) {
  const d = (script && script.dataset) || {};

  let language;
  if (d.language) {
    language = pick(d.language, supportedLanguages, "en");
  } else {
    const htmlLang = (document.documentElement.lang || "").slice(0, 2);
    language = pick(htmlLang, supportedLanguages, "en");
  }

  const primary = HEX.test((d.primaryColor || "").trim())
    ? expandHex(d.primaryColor.trim())
    : "#ffbc1a";

  const version = parseInt(d.consentVersion, 10);

  return {
    language,
    theme: pick(d.theme, ["light", "dark", "auto"], "light"),
    position: pick(d.position, ["bottom", "top"], "bottom"),
    align: pick(d.align, ["left", "center", "right"], "center"),
    primaryColor: primary,
    onPrimary: onColor(primary),
    brand: (d.brand || "").trim(),
    logo: safeUrl(d.logo),
    privacyUrl: safeUrl(d.privacyUrl),
    cookieUrl: safeUrl(d.cookieUrl),
    // İsteğe bağlı (spec dışı): banner kapandıktan sonra görünen küçük "tercihleri aç" düğmesi.
    reopenButton: (d.reopenButton || "true").toLowerCase() !== "false",
    // İsteğe bağlı (spec dışı): artırıldığında tüm ziyaretçilerden yeniden tercih istenir.
    consentVersion: version > 0 ? version : 1,
  };
}
