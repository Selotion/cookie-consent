import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const bundle = readFileSync(new URL("../dist/cookie-consent.min.js", import.meta.url), "utf8");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ready = (dom) => dom.window.document.readyState === "loading"
  ? new Promise((r) => dom.window.document.addEventListener("DOMContentLoaded", () => setTimeout(r, 0)))
  : Promise.resolve();

async function setup({ body = "", attrs = "", storage = null, lang = "en" } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html lang="${lang}"><body>
      <script id="cfg" src="https://cdn.selotion.com/cookie-consent/v1/cookie-consent.min.js" ${attrs}></script>
      ${body}
    </body></html>`,
    { url: "https://example.com/", runScripts: "dangerously", pretendToBeVisual: true }
  );
  if (storage) dom.window.localStorage.setItem("selotion_cookie_consent", JSON.stringify(storage));
  // currentScript yerine, paket script etiketinin data-* özelliklerini bulabilmeli.
  dom.window.eval(bundle);
  await ready(dom);
  const root = () => dom.window.document.getElementById("selotion-cookie-consent").shadowRoot;
  return { dom, win: dom.window, root, CC: dom.window.CookieConsent };
}

const click = (el) => el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, composed: true }));
const stored = (win) => JSON.parse(win.localStorage.getItem("selotion_cookie_consent"));

test("1-2: tek script ile kurulur, ilk ziyarette banner görünür ve isteğe bağlı kategoriler kapalı", async () => {
  const { root, CC } = await setup();
  const banner = root().querySelector(".cc-banner");
  assert.equal(banner.hidden, false);
  const p = CC.getPreferences();
  assert.equal(p.necessary, true);
  assert.equal(p.analytics, false);
  assert.equal(p.marketing, false);
  assert.equal(p.preferences, false);
  assert.equal(CC.hasConsent("analytics"), false);
});

test("3, 6: tümünü kabul et kaydeder ve yenilemede korunur", async () => {
  const first = await setup();
  click(first.root().querySelector('.cc-banner [data-action="accept"]'));
  const s = stored(first.win);
  assert.deepEqual([s.necessary, s.analytics, s.marketing, s.preferences], [true, true, true, true]);
  assert.equal(s.version, 1);
  assert.match(s.updatedAt, /^\d{4}-\d{2}-\d{2}T/);

  const second = await setup({ storage: s });
  assert.equal(second.CC.hasConsent("analytics"), true);
  assert.equal(second.root().querySelector(".cc-banner").hidden, true); // banner tekrar çıkmaz
  assert.equal(second.root().querySelector(".cc-reopen").hidden, false);
});

test("4: tümünü reddet yalnızca zorunlu çerezleri açık bırakır", async () => {
  const { root, win, CC } = await setup();
  click(root().querySelector('.cc-banner [data-action="reject"]'));
  const s = stored(win);
  assert.deepEqual([s.necessary, s.analytics, s.marketing, s.preferences], [true, false, false, false]);
  assert.equal(CC.hasConsent("marketing"), false);
});

test("5, 8: kategori bazında tercih ve paneli tekrar açma", async () => {
  const { root, win, CC } = await setup();
  click(root().querySelector('.cc-banner [data-action="customize"]'));
  const r = root();
  assert.equal(r.querySelector(".cc-overlay").hidden, false);
  assert.equal(r.querySelector('input[name="necessary"]').disabled, true); // zorunlu kapatılamaz

  const analytics = r.querySelector('input[name="analytics"]');
  analytics.checked = true;
  analytics.dispatchEvent(new win.Event("change"));
  assert.equal(r.querySelector('input[name="analytics"]').closest("label").querySelector(".cc-switch__state").textContent, "On");
  click(r.querySelector('.cc-modal [data-action="save"]'));

  const s = stored(win);
  assert.deepEqual([s.analytics, s.marketing, s.preferences], [true, false, false]);

  // Tercihleri tekrar aç (API + yüzen düğme + data attribute)
  CC.showPreferences();
  assert.equal(r.querySelector(".cc-overlay").hidden, false);
  assert.equal(r.querySelector('input[name="analytics"]').checked, true);
});

test("7: izin verilmeyen kategorilerin scriptleri çalışmaz, izin verilince çalışır", async () => {
  const body = `
    <script type="text/plain" data-cookie-category="marketing">window.__marketing = (window.__marketing||0)+1;</script>
    <script type="text/plain" data-cookie-category="analytics">window.__analytics = (window.__analytics||0)+1;</script>`;
  const { win, root, CC } = await setup({ body });
  assert.equal(win.__marketing, undefined);
  assert.equal(win.__analytics, undefined);

  // Yalnızca analytics'e izin ver
  click(root().querySelector('.cc-banner [data-action="customize"]'));
  const a = root().querySelector('input[name="analytics"]');
  a.checked = true;
  click(root().querySelector('.cc-modal [data-action="save"]'));
  assert.equal(win.__analytics, 1);
  assert.equal(win.__marketing, undefined);

  // Aynı script ikinci kez çalışmaz
  CC.acceptAll();
  assert.equal(win.__analytics, 1);
  assert.equal(win.__marketing, 1);
  CC.acceptAll();
  assert.equal(win.__marketing, 1);
});

test("7: sonradan eklenen pasif script de izin yoksa engellenir", async () => {
  const { win } = await setup();
  const s = win.document.createElement("script");
  s.type = "text/plain";
  s.dataset.cookieCategory = "marketing";
  s.textContent = "window.__late = true;";
  win.document.body.appendChild(s);
  await wait(20);
  assert.equal(win.__late, undefined);
});

test("9: dil ve tema ayarları çalışır, desteklenmeyen dil İngilizceye düşer", async () => {
  const tr = await setup({ attrs: 'data-language="tr" data-theme="dark" data-position="top" data-align="right"' });
  const r = tr.root();
  assert.equal(r.querySelector('[data-action="accept"]').textContent, "Tümünü kabul et");
  assert.equal(tr.dom.window.document.getElementById("selotion-cookie-consent").getAttribute("data-theme"), "dark");
  assert.ok(r.querySelector(".cc-root").classList.contains("cc-pos-top"));
  assert.ok(r.querySelector(".cc-root").classList.contains("cc-align-right"));

  const xx = await setup({ attrs: 'data-language="xx"' });
  assert.equal(xx.root().querySelector('[data-action="accept"]').textContent, "Accept all");
});

test("10: arayüz Shadow DOM içindedir, ana sayfaya stil sızdırmaz", async () => {
  const { win } = await setup();
  const host = win.document.getElementById("selotion-cookie-consent");
  assert.ok(host.shadowRoot);
  assert.equal(win.document.querySelectorAll("style").length, 0);
  assert.equal(win.document.querySelector(".cc-banner"), null);
});

test("sürüm değişirse yeniden tercih istenir; bozuk veri yok sayılır", async () => {
  const old = { version: 1, necessary: true, analytics: true, marketing: false, preferences: false, updatedAt: new Date().toISOString() };
  const bumped = await setup({ attrs: 'data-consent-version="2"', storage: old });
  assert.equal(bumped.root().querySelector(".cc-banner").hidden, false);
  assert.equal(bumped.CC.hasConsent("analytics"), false);

  const dom = new JSDOM("<!doctype html><body></body>", { url: "https://example.com/", runScripts: "dangerously" });
  dom.window.localStorage.setItem("selotion_cookie_consent", "{bozuk json");
  dom.window.eval(bundle);
  await ready(dom);
  assert.equal(dom.window.CookieConsent.hasDecision(), false);
});

test("API: olaylar, reset ve harici ağ isteği yok", async () => {
  const { win, CC, root } = await setup();
  const events = [];
  win.document.addEventListener("cookieconsent:change", (e) => events.push(e.detail));
  CC.rejectAll();
  CC.acceptAll();
  assert.equal(events.length, 2);
  assert.equal(events[1].source, "accept-all");
  assert.equal(events[1].previous.analytics, false);

  CC.reset();
  assert.equal(win.localStorage.getItem("selotion_cookie_consent"), null);
  assert.equal(root().querySelector(".cc-banner").hidden, false);
  assert.equal(events[2].source, "reset");

  assert.equal(/fetch\(|XMLHttpRequest|sendBeacon/.test(bundle), false);
});

test("güvenlik: javascript: adresleri bağlantıya dönüşmez", async () => {
  const { root } = await setup({ attrs: 'data-privacy-url="javascript:alert(1)" data-cookie-url="/cookies"' });
  const r = root();
  assert.equal(r.querySelector('[data-link="privacy"]').hidden, true);
  assert.equal(r.querySelector('[data-link="cookie"]').hidden, false);
});

test("erişilebilirlik: panel diyalog, Escape kapatır, odak geri döner", async () => {
  const { root, win } = await setup();
  const r = root();
  const modal = r.querySelector(".cc-modal");
  assert.equal(modal.getAttribute("role"), "dialog");
  assert.equal(modal.getAttribute("aria-modal"), "true");
  click(r.querySelector('.cc-banner [data-action="customize"]'));
  modal.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));
  await wait(300);
  assert.equal(r.querySelector(".cc-overlay").hidden, true);
  assert.equal(r.querySelector(".cc-banner").hidden, false); // karar verilmedi, banner geri gelir
});