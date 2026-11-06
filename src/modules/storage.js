// Tercih saklama: LocalStorage; kullanılamazsa birinci taraf cookie.
// Hiçbir veri harici bir sunucuya gönderilmez.

export const STORAGE_KEY = "selotion_cookie_consent";

function readCookie() {
  const m = document.cookie.match(new RegExp("(?:^|; )" + STORAGE_KEY + "=([^;]*)"));
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch (e) {
    return null;
  }
}

function writeCookie(raw) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    STORAGE_KEY + "=" + encodeURIComponent(raw) +
    "; Max-Age=31536000; Path=/; SameSite=Lax" + secure;
}

function deleteCookie() {
  document.cookie = STORAGE_KEY + "=; Max-Age=0; Path=/; SameSite=Lax";
}

export function load() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (e) { /* erişim engelli */ }
  if (raw == null) raw = readCookie();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    return null; // bozuk veri = kayıt yok
  }
}

export function save(data) {
  const raw = JSON.stringify(data);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
    deleteCookie(); // eski yedek cookie kalmasın
  } catch (e) {
    writeCookie(raw);
  }
}

export function clear() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* yoksay */ }
  deleteCookie();
}
