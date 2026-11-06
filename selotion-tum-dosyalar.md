
## package.json

````json
{
  "name": "selotion-cookie-consent",
  "version": "1.0.0",
  "description": "Açık kaynaklı, ücretsiz, hafif ve altyapıdan bağımsız çerez izin yönetim kütüphanesi.",
  "license": "MIT",
  "author": "Selotion",
  "type": "module",
  "main": "dist/cookie-consent.min.js",
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "node build.mjs",
    "test": "node build.mjs && node --test tests/*.test.mjs"
  },
  "devDependencies": {
    "esbuild": "^0.25.0",
    "jsdom": "^26.0.0"
  }
}

````

## build.mjs

````mjs
import { build, transform } from "esbuild";
import { readFile, stat } from "node:fs/promises";

// CSS ve HTML şablonu metin olarak pakete gömülür; CSS ayrıca küçültülür.
const embedPlugin = {
  name: "embed-text",
  setup(b) {
    b.onLoad({ filter: /\.css$/ }, async (args) => {
      const src = await readFile(args.path, "utf8");
      const out = await transform(src, { loader: "css", minify: true });
      return { contents: out.code.trim(), loader: "text" };
    });
    b.onLoad({ filter: /\.html$/ }, async (args) => {
      const src = await readFile(args.path, "utf8");
      const min = src.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").trim();
      return { contents: min, loader: "text" };
    });
  },
};

await build({
  entryPoints: ["src/cookie-consent.js"],
  outfile: "dist/cookie-consent.min.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2019", "chrome80", "firefox78", "safari13"],
  legalComments: "none",
  banner: { js: "/*! Selotion Cookie Consent v1.0.0 | MIT | https://github.com/selotion/cookie-consent */" },
  plugins: [embedPlugin],
});

const { size } = await stat("dist/cookie-consent.min.js");
console.log(`dist/cookie-consent.min.js  ${(size / 1024).toFixed(1)} KB`);

````

## LICENSE

````LICENSE
MIT License

Copyright (c) 2026 Selotion

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

````

## .gitignore

````gitignore
node_modules/
*.log
.DS_Store

````

## README.md

````md
# Selotion Cookie Consent

**Simple. Lightweight. Open Source.**

Açık kaynaklı, ücretsiz, hafif ve altyapıdan bağımsız çerez izin yönetim kütüphanesi.
Vanilla JavaScript, harici bağımlılık yok, tek script etiketiyle kurulum, MIT lisansı.

> **Önemli:** Bu kütüphane tek başına KVKK veya GDPR uyumluluğunu garanti etmez ve hukuki danışmanlık sunmaz.
> Çerezlerinizi doğru kategorilere ayırmak, politikalarınızı hazırlamak ve yasal yükümlülüklerinizi yerine getirmek site sahibinin sorumluluğundadır.

## Kurulum

Sitenize yalnızca şu etiketi ekleyin:

```html
<script
  src="https://cdn.selotion.com/cookie-consent/v1/cookie-consent.min.js"
  data-language="tr"
  data-theme="light"
  data-position="bottom"
  defer>
</script>
```

Ayrıca HTML veya CSS yazmanız gerekmez. Üretim sitelerinde sabit sürüm yolunu (`/v1/`) kullanın; `/latest/` yalnızca denemeler içindir.

## Script engelleme

Yalnızca banner göstermek yeterli değildir. İzin gerektiren scriptleri **pasif** tanımlayın:

```html
<!-- Harici script -->
<script type="text/plain"
        data-cookie-category="analytics"
        data-cookie-src="https://example.com/analytics.js"></script>

<!-- Inline script -->
<script type="text/plain" data-cookie-category="marketing">
  console.log("Marketing script activated");
</script>
```

Kategoriler: `analytics`, `marketing`, `preferences`.

Kütüphane:

- Scripti yalnızca ilgili kategoriye izin verildiğinde etkinleştirir.
- Aynı harici scripti birden fazla kez yüklemez.
- Sayfa yenilendiğinde kayıtlı tercihi uygular.
- Sonradan DOM'a eklenen pasif scriptleri de yakalar.
- Yükleme hatasında `cookieconsent:scripterror` olayı yayar; sonraki uygulamada yeniden dener.
- İzin geri çekildiğinde yeni script yüklemelerini durdurur.

### Bilinen sınırlamalar

- **Geri alma yoktur.** Çalışmış bir JavaScript kodunun etkileri veya oluşturduğu çerezler sonradan otomatik silinemez. Bu yüzden izin gerektiren scriptler başlangıçtan itibaren `type="text/plain"` ile pasif tanımlanmalıdır.
- **Kütüphane yalnızca kendi etiketlerinizi yönetir.** Normal `<script>` etiketiyle eklenen, Google Tag Manager veya bir eklenti tarafından enjekte edilen scriptler engellenmez. Bunları da pasif formata taşıyın.
- **Inline stil:** Arayüz stili Shadow DOM içine `<style>` olarak gömülür. Katı bir `style-src` CSP kullanıyorsanız `'unsafe-inline'` veya nonce gerekebilir.

## Yapılandırma

Tüm ayarlar opsiyoneldir.

| Özellik | Değerler | Varsayılan |
|---|---|---|
| `data-language` | `tr`, `en` | `<html lang>` desteklenirse o, yoksa `en` |
| `data-theme` | `light`, `dark`, `auto` | `light` |
| `data-position` | `bottom`, `top` | `bottom` |
| `data-align` | `left`, `center`, `right` | `center` |
| `data-primary-color` | Hex renk (`#FFBC1A`) | `#FFBC1A` |
| `data-brand` | Marka adı | yok |
| `data-logo` | Logo URL | yok |
| `data-privacy-url` | Gizlilik politikası URL | bağlantı gizli |
| `data-cookie-url` | Çerez politikası URL | bağlantı gizli |
| `data-reopen-button` | `true`, `false` | `true` |
| `data-consent-version` | Pozitif tam sayı | `1` |

- Desteklenmeyen dil seçilirse İngilizce kullanılır. Almanca ve Fransızca sonraki sürümlerde eklenecek.
- `data-primary-color` üzerindeki metin rengi (koyu/açık) otomatik seçilir.
- `data-reopen-button`: Karar verildikten sonra köşede görünen küçük "Çerez tercihlerini aç" düğmesi. Kendi bağlantınızı kullanacaksanız `false` yapın.
- `data-consent-version`: Çerez kapsamınız değiştiğinde değeri artırın; tüm ziyaretçilerden yeniden tercih istenir.

## JavaScript API

```js
CookieConsent.showPreferences();      // tercih panelini aç
CookieConsent.acceptAll();            // tümünü kabul et
CookieConsent.rejectAll();            // tümünü reddet
CookieConsent.getPreferences();       // mevcut tercihler (karar yoksa varsayılanlar)
CookieConsent.hasConsent("analytics");// kategori için izin var mı?
CookieConsent.hasDecision();          // ziyaretçi karar verdi mi?
CookieConsent.reset();                // kaydı sil ve banner'ı yeniden göster
```

Herhangi bir öğe `data-cookie-preferences` özelliğiyle paneli açabilir:

```html
<a href="#" data-cookie-preferences>Çerez tercihleri</a>
```

### Olaylar

```js
document.addEventListener("cookieconsent:ready", (e) => {
  // e.detail = { preferences, hasDecision }
});

document.addEventListener("cookieconsent:change", (e) => {
  // e.detail = { preferences, previous, source }
  // source: "accept-all" | "reject-all" | "custom" | "reset" | "sync"
});

document.addEventListener("cookieconsent:scripterror", (e) => {
  // e.detail = { category, src }
});
```

## Tercih verisi

Tercihler yalnızca tarayıcıda, `localStorage` içinde `selotion_cookie_consent` anahtarıyla saklanır. `localStorage` kullanılamazsa birinci taraf cookie'ye düşülür. Hiçbir veri harici sunucuya gönderilmez.

```json
{
  "version": 1,
  "necessary": true,
  "analytics": false,
  "marketing": false,
  "preferences": false,
  "updatedAt": "2026-11-06T09:00:00.000Z"
}
```

Kayıt silinmişse, bozuksa veya `version` güncel değilse ziyaretçiye banner yeniden gösterilir.

## Erişilebilirlik

Klavye navigasyonu, görünür odak halkası, `role="dialog"` ve `aria-modal`, panel açılınca odak yönetimi ve Escape ile kapatma, kapanınca önceki odağa dönüş, `prefers-reduced-motion` desteği ve yalnızca renge bağlı olmayan anahtar durumları (Açık/Kapalı metni).

Kabul ve reddet düğmeleri aynı boyut ve ağırlıktadır; reddetmek için ek adım gerekmez.

## Geliştirme

```bash
npm install
npm run build   # dist/cookie-consent.min.js üretir (CSS ve dil dosyaları pakete gömülür)
npm test        # derler ve jsdom testlerini çalıştırır
```

`examples/basic.html` dosyasını tarayıcıda açarak deneyebilirsiniz (önce `npm run build`).

```
src/
├── cookie-consent.js        giriş noktası ve genel API
├── modules/                 config, storage, preferences, script-manager, renderer, events, accessibility
├── styles/cookie-consent.css
├── templates/cookie-consent.html
└── locales/                 tr.json, en.json
```

### Yeni dil eklemek

`src/locales/` içine `xx.json` ekleyin (`en.json` ile aynı anahtarlar) ve `src/cookie-consent.js` içindeki `LOCALES` nesnesine kaydedin. Eksik anahtarlar İngilizceye düşer.

## Yayın notları

- `dist/cookie-consent.min.js` tek dosyadır; CSS içine gömülüdür, ayrı CSS dosyası gerekmez.
- CDN'e `v1/` altına yükleyin. Yayınlanmış sürüm dosyalarını sonradan değiştirmeyin; `latest/` en güncel kararlı sürümü göstersin.
- Uzun süreli cache + sürüm yolu (`immutable`) önerilir. `latest/` için kısa cache kullanın.

## Lisans

MIT © Selotion

````

## src/cookie-consent.js

````js
// Selotion Cookie Consent — giriş noktası.
// Tek script etiketiyle çalışır; harici bağımlılığı yoktur.

import { readConfig } from "./modules/config.js";
import * as storage from "./modules/storage.js";
import { CATEGORIES, defaults, isValid, build, allChoices } from "./modules/preferences.js";
import { createScriptManager } from "./modules/script-manager.js";
import { createRenderer } from "./modules/renderer.js";
import { emit } from "./modules/events.js";
import en from "./locales/en.json";
import tr from "./locales/tr.json";

(function () {
  if (typeof window === "undefined" || window.CookieConsent) return; // çift yükleme koruması

  const LOCALES = { en: en, tr: tr };
  const VERSION = "1.0.0";

  function merge(base, extra) {
    const out = {};
    Object.keys(base).forEach((k) => {
      const b = base[k];
      const e = extra && extra[k];
      out[k] = b && typeof b === "object" ? merge(b, e) : (typeof e === "string" ? e : b);
    });
    return out;
  }

  function findScript() {
    return document.currentScript ||
      document.querySelector('script[src*="cookie-consent"][data-language], script[src*="cookie-consent.min.js"]');
  }

  const config = readConfig(findScript(), Object.keys(LOCALES));
  const strings = merge(en, LOCALES[config.language]);

  let prefs = null;      // geçerli kayıt varsa saklanan tercih
  let ui = null;
  let ready = false;
  const queue = [];

  function loadPrefs() {
    const stored = storage.load();
    return isValid(stored, config.consentVersion) ? stored : null;
  }

  function isAllowed(category) {
    const c = String(category || "").toLowerCase();
    if (c === "necessary") return true;
    return !!(prefs && CATEGORIES.indexOf(c) !== -1 && prefs[c] === true);
  }

  const scripts = createScriptManager({
    isAllowed: isAllowed,
    onError: (detail) => {
      emit("scripterror", detail);
      if (window.console) console.warn("[CookieConsent] Script yüklenemedi:", detail.src);
    },
  });
  scripts.observe();

  function whenReady(fn) {
    if (ready) fn(); else queue.push(fn);
  }

  function copy(p) {
    return p ? JSON.parse(JSON.stringify(p)) : null;
  }

  function commit(choices, source) {
    const previous = copy(prefs);
    prefs = build(choices, config.consentVersion);
    storage.save(prefs);

    ui.hideBanner();
    ui.showReopen();
    ui.closeModal();
    scripts.scan();
    ui.announce(ui.t("status.saved"));

    emit("change", { preferences: copy(prefs), previous: previous, source: source });
  }

  function closePreferences() {
    if (ui) ui.closeModal();
  }

  function init() {
    prefs = loadPrefs();

    ui = createRenderer({
      config: config,
      strings: strings,
      handlers: {
        onAcceptAll: () => commit(allChoices(true), "accept-all"),
        onRejectAll: () => commit(allChoices(false), "reject-all"),
        onSave: (choices) => commit(choices, "custom"),
        onOpen: () => ui.openModal(prefs || defaults()),
        onClose: closePreferences,
      },
    });
    ui.mount();

    if (prefs) ui.showReopen(); else ui.showBanner();
    scripts.scan();

    // Başka sekmede yapılan değişiklikleri senkronize et / silinen kaydı yakala.
    window.addEventListener("storage", (e) => {
      if (e.key !== storage.STORAGE_KEY && e.key !== null) return;
      const previous = copy(prefs);
      prefs = loadPrefs();
      if (prefs) { ui.hideBanner(); ui.showReopen(); } else { ui.showBanner(); ui.hideReopen(); }
      scripts.scan();
      emit("change", { preferences: copy(prefs || defaults()), previous: previous, source: "sync" });
    });

    // <a data-cookie-preferences> gibi herhangi bir öğe paneli açabilir.
    document.addEventListener("click", (e) => {
      const trigger = e.target && e.target.closest && e.target.closest("[data-cookie-preferences]");
      if (!trigger) return;
      e.preventDefault();
      api.showPreferences();
    });

    ready = true;
    emit("ready", { preferences: copy(prefs || defaults()), hasDecision: !!prefs });
    while (queue.length) queue.shift()();
  }

  const api = {
    version: VERSION,
    showPreferences: () => whenReady(() => ui.openModal(prefs || defaults())),
    acceptAll: () => whenReady(() => commit(allChoices(true), "accept-all")),
    rejectAll: () => whenReady(() => commit(allChoices(false), "reject-all")),
    // Karar verilmemişse varsayılanları (yalnızca zorunlu açık) döndürür.
    getPreferences: () => copy(prefs) || Object.assign(defaults(), { version: config.consentVersion, updatedAt: null }),
    hasConsent: (category) => isAllowed(category),
    hasDecision: () => !!prefs,
    // Saklanan tercihi siler ve banner'ı yeniden gösterir.
    reset: () => whenReady(() => {
      const previous = copy(prefs);
      storage.clear();
      prefs = null;
      ui.hideReopen();
      ui.closeModal();
      ui.showBanner();
      emit("change", { preferences: defaults(), previous: previous, source: "reset" });
    }),
  };

  window.CookieConsent = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

````

## src/modules/accessibility.js

````js
// Odak yönetimi, odak tuzağı ve kaydırma kilidi.

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Shadow DOM içindeki gerçek aktif elemanı bulur.
export function deepActiveElement() {
  let el = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) {
    el = el.shadowRoot.activeElement;
  }
  return el;
}

// Modal içinde Tab döngüsü kurar, Escape ile kapatır.
export function trapFocus(container, shadowRoot, onEscape) {
  function onKeydown(e) {
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      e.stopPropagation();
      onEscape();
      return;
    }
    if (e.key !== "Tab") return;

    const items = Array.prototype.filter.call(
      container.querySelectorAll(FOCUSABLE),
      (el) => !el.closest("[hidden]")
    );
    if (!items.length) {
      e.preventDefault();
      container.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = shadowRoot.activeElement;

    if (e.shiftKey && (active === first || active === container)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  container.addEventListener("keydown", onKeydown);
  return function release() {
    container.removeEventListener("keydown", onKeydown);
  };
}

export function lockScroll() {
  const html = document.documentElement;
  const previous = html.style.overflow;
  html.style.overflow = "hidden";
  return function unlock() {
    html.style.overflow = previous;
  };
}

````

## src/modules/config.js

````js
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

````

## src/modules/events.js

````js
// cookieconsent:ready ve cookieconsent:change olayları.

export function emit(name, detail) {
  let event;
  try {
    event = new CustomEvent("cookieconsent:" + name, { detail: detail });
  } catch (e) {
    event = document.createEvent("CustomEvent");
    event.initCustomEvent("cookieconsent:" + name, false, false, detail);
  }
  document.dispatchEvent(event);
}

````

## src/modules/preferences.js

````js
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

````

## src/modules/renderer.js

````js
// Arayüz: tüm DOM ve stil yönetimi tek merkezi modülde, Shadow DOM içinde.

import template from "../templates/cookie-consent.html";
import css from "../styles/cookie-consent.css";
import { CATEGORIES } from "./preferences.js";
import { deepActiveElement, trapFocus, lockScroll } from "./accessibility.js";

const HOST_ID = "selotion-cookie-consent";

function lookup(strings, path) {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), strings) || "";
}

function reducedMotion() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function reveal(el) {
  clearTimeout(el._hideTimer);
  el.hidden = false;
  void el.offsetWidth; // geçiş animasyonunun başlaması için reflow
  el.classList.add("is-visible");
}

function conceal(el) {
  clearTimeout(el._hideTimer);
  el.classList.remove("is-visible");
  if (reducedMotion()) {
    el.hidden = true;
  } else {
    el._hideTimer = setTimeout(() => { el.hidden = true; }, 260);
  }
}

export function createRenderer(opts) {
  const config = opts.config;
  const strings = opts.strings;
  const handlers = opts.handlers;
  const t = (key) => lookup(strings, key);

  // --- Host + Shadow DOM
  const host = document.createElement("div");
  host.id = HOST_ID;
  host.setAttribute("data-theme", config.theme);
  host.style.setProperty("--cc-primary", config.primaryColor);
  host.style.setProperty("--cc-on-primary", config.onPrimary);

  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = css;
  root.appendChild(style);

  const tpl = document.createElement("template");
  tpl.innerHTML = template;
  root.appendChild(tpl.content.cloneNode(true));

  const $ = (sel) => root.querySelector(sel);
  const rootEl = $(".cc-root");
  rootEl.classList.add("cc-pos-" + config.position, "cc-align-" + config.align);

  const banner = $(".cc-banner");
  const overlay = $(".cc-overlay");
  const modal = $(".cc-modal");
  const reopen = $(".cc-reopen");
  const live = $(".cc-sr");
  const list = $(".cc-cats");

  // --- Metinler
  root.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.getAttribute("data-i18n")); });
  root.querySelectorAll("[data-i18n-aria]").forEach((n) => { n.setAttribute("aria-label", t(n.getAttribute("data-i18n-aria"))); });

  const privacyLink = $('[data-link="privacy"]');
  const cookieLink = $('[data-link="cookie"]');
  if (config.privacyUrl) { privacyLink.href = config.privacyUrl; privacyLink.hidden = false; }
  if (config.cookieUrl) { cookieLink.href = config.cookieUrl; cookieLink.hidden = false; }

  root.querySelectorAll(".cc-logo").forEach((img) => {
    if (config.logo) { img.src = config.logo; img.hidden = false; }
  });
  root.querySelectorAll(".cc-brand").forEach((p) => {
    if (config.brand) { p.textContent = config.brand; p.hidden = false; }
  });

  // --- Kategori satırları
  const inputs = {};
  const stateLabels = {};

  function refreshState(cat) {
    const input = inputs[cat];
    stateLabels[cat].textContent =
      cat === "necessary" ? t("switch.always") : input.checked ? t("switch.on") : t("switch.off");
  }

  CATEGORIES.forEach((cat) => {
    const li = document.createElement("li");
    li.className = "cc-cat";

    const text = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "cc-cat__title";
    title.id = "cc-cat-" + cat;
    title.style.margin = "0";
    title.textContent = t("categories." + cat + ".title");
    const desc = document.createElement("p");
    desc.className = "cc-cat__desc";
    desc.id = "cc-cat-" + cat + "-desc";
    desc.textContent = t("categories." + cat + ".description");
    text.appendChild(title);
    text.appendChild(desc);

    const label = document.createElement("label");
    label.className = "cc-switch";
    const state = document.createElement("span");
    state.className = "cc-switch__state";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("role", "switch");
    input.setAttribute("aria-labelledby", title.id);
    input.setAttribute("aria-describedby", desc.id);
    input.name = cat;
    const track = document.createElement("span");
    track.className = "cc-switch__track";
    track.setAttribute("aria-hidden", "true");

    if (cat === "necessary") {
      input.checked = true;
      input.disabled = true;
    }
    input.addEventListener("change", () => refreshState(cat));

    label.appendChild(state);
    label.appendChild(input);
    label.appendChild(track);
    li.appendChild(text);
    li.appendChild(label);
    list.appendChild(li);

    inputs[cat] = input;
    stateLabels[cat] = state;
    refreshState(cat);
  });

  function setChoices(prefs) {
    CATEGORIES.forEach((cat) => {
      if (cat === "necessary") return;
      inputs[cat].checked = !!(prefs && prefs[cat]);
      refreshState(cat);
    });
  }

  function getChoices() {
    const out = {};
    CATEGORIES.forEach((cat) => { out[cat] = cat === "necessary" ? true : inputs[cat].checked; });
    return out;
  }

  // --- Durum
  let bannerWanted = false;
  let modalOpen = false;
  let returnFocus = null;
  let releaseTrap = null;
  let unlockScroll = null;

  function showBanner() {
    bannerWanted = true;
    if (!modalOpen) reveal(banner);
  }

  function hideBanner() {
    bannerWanted = false;
    conceal(banner);
  }

  function showReopen() {
    if (config.reopenButton) reopen.hidden = false;
  }

  function hideReopen() {
    reopen.hidden = true;
  }

  function openModal(prefs) {
    if (modalOpen) return;
    modalOpen = true;
    returnFocus = deepActiveElement();
    setChoices(prefs);

    // Panel açıkken banner gizlenir; panel kapanınca gerekiyorsa geri gelir.
    clearTimeout(banner._hideTimer);
    banner.classList.remove("is-visible");
    banner.hidden = true;

    reveal(overlay);
    unlockScroll = lockScroll();
    releaseTrap = trapFocus(overlay, root, handlers.onClose);
    modal.focus();
  }

  function closeModal() {
    if (!modalOpen) return;
    modalOpen = false;
    conceal(overlay);
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    if (unlockScroll) { unlockScroll(); unlockScroll = null; }

    if (bannerWanted) reveal(banner);

    // Odağı panel açılmadan önceki yere döndür.
    let target = returnFocus;
    const fromBanner = target && banner.contains(target);
    if (fromBanner && !bannerWanted) target = reopen.hidden ? null : reopen;
    if (!target || (target !== reopen && !target.isConnected)) target = reopen.hidden ? null : reopen;
    if (target && typeof target.focus === "function") target.focus();
    returnFocus = null;
  }

  function announce(message) {
    live.textContent = "";
    setTimeout(() => { live.textContent = message; }, 50);
  }

  // --- Olaylar
  root.addEventListener("click", (e) => {
    if (e.target === overlay) { handlers.onClose(); return; }
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    switch (btn.getAttribute("data-action")) {
      case "accept": handlers.onAcceptAll(); break;
      case "reject": handlers.onRejectAll(); break;
      case "customize":
      case "reopen": handlers.onOpen(); break;
      case "save": handlers.onSave(getChoices()); break;
      case "close": handlers.onClose(); break;
    }
  });

  // Odak panelin dışına kaçarsa geri al.
  document.addEventListener("focusin", (e) => {
    if (modalOpen && e.target !== host) modal.focus();
  });

  function mount() {
    document.body.appendChild(host);
  }

  return {
    host: host,
    root: root,
    mount: mount,
    showBanner: showBanner,
    hideBanner: hideBanner,
    showReopen: showReopen,
    hideReopen: hideReopen,
    openModal: openModal,
    closeModal: closeModal,
    isModalOpen: () => modalOpen,
    announce: announce,
    t: t,
  };
}

````

## src/modules/script-manager.js

````js
// Kategori bazlı script engelleme.
// <script type="text/plain" data-cookie-category="..."> etiketleri,
// ilgili kategoriye izin verilene kadar çalıştırılmaz.

const SELECTOR = 'script[type="text/plain"][data-cookie-category]';

export function createScriptManager(options) {
  const isAllowed = options.isAllowed;
  const onError = options.onError || function () {};
  const loadedSources = {};
  let observer = null;

  function resolve(src) {
    try {
      return new URL(src, window.location.href).href;
    } catch (e) {
      return src;
    }
  }

  function copyAttributes(from, to) {
    for (let i = 0; i < from.attributes.length; i++) {
      const a = from.attributes[i];
      const name = a.name.toLowerCase();
      if (name === "type" || name.indexOf("data-cookie") === 0) continue;
      to.setAttribute(a.name, a.value);
    }
  }

  function activate(el) {
    const state = el.getAttribute("data-cookie-state");
    if (state === "active" || state === "loading") return; // aynı script iki kez yüklenmez

    const category = (el.getAttribute("data-cookie-category") || "").toLowerCase();
    if (!isAllowed(category)) return;

    const src = el.getAttribute("data-cookie-src");
    const live = document.createElement("script");
    copyAttributes(el, live);
    live.setAttribute("data-cookie-managed", category);

    if (src) {
      const abs = resolve(src);
      if (loadedSources[abs]) {
        el.setAttribute("data-cookie-state", "active");
        return;
      }
      loadedSources[abs] = true;
      el.setAttribute("data-cookie-state", "loading");
      live.async = el.hasAttribute("async");
      live.onload = function () {
        el.setAttribute("data-cookie-state", "active");
      };
      live.onerror = function () {
        delete loadedSources[abs]; // sonraki denemede tekrar yüklenebilsin
        el.setAttribute("data-cookie-state", "error");
        if (live.parentNode) live.parentNode.removeChild(live);
        onError({ category: category, src: abs });
      };
      live.src = src;
    } else {
      live.text = el.text || el.textContent || "";
      el.setAttribute("data-cookie-state", "active");
    }

    if (el.parentNode) {
      el.parentNode.insertBefore(live, el.nextSibling);
    } else {
      document.head.appendChild(live);
    }
  }

  function scan() {
    const list = document.querySelectorAll(SELECTOR);
    for (let i = 0; i < list.length; i++) activate(list[i]);
  }

  // Sayfaya sonradan eklenen pasif scriptleri de yakalar.
  function observe() {
    if (observer || typeof MutationObserver === "undefined") return;
    observer = new MutationObserver(function (records) {
      for (let i = 0; i < records.length; i++) {
        const added = records[i].addedNodes;
        for (let j = 0; j < added.length; j++) {
          const n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.matches && n.matches(SELECTOR)) activate(n);
          else if (n.querySelectorAll) {
            const inner = n.querySelectorAll(SELECTOR);
            for (let k = 0; k < inner.length; k++) activate(inner[k]);
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  return { scan: scan, observe: observe };
}

````

## src/modules/storage.js

````js
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

````

## src/styles/cookie-consent.css

````css
:host {
  all: initial;
  display: block;
  --cc-primary: #ffbc1a;
  --cc-on-primary: #15171c;
  --cc-bg: #ffffff;
  --cc-ink: #15171c;
  --cc-muted: #4f5560;
  --cc-line: #dfe2e7;
  --cc-line-strong: #7d848f;
  --cc-surface: #f3f4f6;
  --cc-shadow: 0 12px 48px rgba(15, 18, 25, 0.2);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: var(--cc-ink);
  -webkit-text-size-adjust: 100%;
}

:host([data-theme="dark"]) {
  --cc-bg: #1c1f26;
  --cc-ink: #f1f2f4;
  --cc-muted: #aab0bc;
  --cc-line: #343945;
  --cc-line-strong: #8a919d;
  --cc-surface: #262a33;
  --cc-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
}

@media (prefers-color-scheme: dark) {
  :host([data-theme="auto"]) {
    --cc-bg: #1c1f26;
    --cc-ink: #f1f2f4;
    --cc-muted: #aab0bc;
    --cc-line: #343945;
    --cc-line-strong: #8a919d;
    --cc-surface: #262a33;
    --cc-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
  }
}

*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }
button, input { font: inherit; color: inherit; }
h2, p, ul { margin: 0; padding: 0; }
ul { list-style: none; }

:focus-visible {
  outline: 3px solid var(--cc-ink);
  outline-offset: 2px;
}

.cc-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* Ortak parçalar */
.cc-head { display: flex; align-items: center; gap: 12px; }
.cc-logo { width: 32px; height: 32px; object-fit: contain; flex: none; }
.cc-brand { font-size: 13px; color: var(--cc-muted); }
.cc-title { font-size: 18px; line-height: 1.3; font-weight: 700; letter-spacing: -0.01em; }
.cc-text { color: var(--cc-muted); }
.cc-link { color: var(--cc-ink); text-decoration: underline; text-underline-offset: 2px; margin-left: 4px; cursor: pointer; }
.cc-link:first-of-type { margin-left: 2px; }

/* Düğmeler: kabul ve reddet aynı boyut, aynı ağırlık */
.cc-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cc-btn {
  min-height: 44px;
  padding: 0 18px;
  border: 2px solid transparent;
  border-radius: 10px;
  font-weight: 650;
  line-height: 1.2;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease;
}
.cc-btn:active { transform: translateY(1px); }
.cc-btn--accept { background: var(--cc-primary); color: var(--cc-on-primary); border-color: var(--cc-primary); }
.cc-btn--reject { background: var(--cc-ink); color: var(--cc-bg); border-color: var(--cc-ink); }
.cc-btn--ghost { background: transparent; color: var(--cc-ink); border-color: var(--cc-line-strong); grid-column: 1 / -1; order: 3; }
.cc-btn:hover { filter: brightness(0.94); }
.cc-btn--ghost:hover { background: var(--cc-surface); filter: none; }

/* Banner */
.cc-banner {
  position: fixed;
  z-index: 2147483000;
  left: 0;
  right: 0;
  display: flex;
  padding: 16px;
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  pointer-events: none;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.cc-pos-bottom .cc-banner { bottom: 0; padding-bottom: max(16px, env(safe-area-inset-bottom)); }
.cc-pos-top .cc-banner { top: 0; padding-top: max(16px, env(safe-area-inset-top)); transform: translateY(-14px); }
.cc-banner.is-visible { opacity: 1; transform: none; }
.cc-align-left .cc-banner { justify-content: flex-start; }
.cc-align-center .cc-banner { justify-content: center; }
.cc-align-right .cc-banner { justify-content: flex-end; }

.cc-banner__inner {
  pointer-events: auto;
  width: 100%;
  max-width: 440px;
  display: grid;
  gap: 16px;
  padding: 20px;
  background: var(--cc-bg);
  border: 1px solid var(--cc-line);
  border-radius: 14px;
  box-shadow: var(--cc-shadow);
}
.cc-banner__body { display: grid; gap: 8px; }
.cc-align-center .cc-banner__inner { max-width: 960px; }

@media (min-width: 760px) {
  .cc-align-center .cc-banner__inner {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 28px;
  }
  .cc-align-center .cc-banner .cc-actions { display: flex; align-items: center; }
  .cc-align-center .cc-banner .cc-btn--ghost { order: 0; }
}

/* Tercih paneli */
.cc-overlay {
  position: fixed;
  z-index: 2147483001;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(10, 12, 16, 0.55);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.cc-overlay.is-visible { opacity: 1; }

.cc-modal {
  width: 100%;
  max-width: 640px;
  max-height: calc(100vh - 24px);
  max-height: calc(100dvh - 24px);
  display: flex;
  flex-direction: column;
  background: var(--cc-bg);
  border: 1px solid var(--cc-line);
  border-radius: 16px;
  box-shadow: var(--cc-shadow);
  transform: translateY(10px) scale(0.985);
  transition: transform 0.2s ease;
}
.cc-overlay.is-visible .cc-modal { transform: none; }
.cc-modal:focus { outline: none; }

.cc-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 12px;
}
.cc-close {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
}
.cc-close:hover { background: var(--cc-surface); }

.cc-modal__body { padding: 0 20px 8px; overflow-y: auto; overscroll-behavior: contain; }
.cc-modal__foot { padding: 14px 20px 20px; border-top: 1px solid var(--cc-line); }
.cc-modal__foot .cc-actions { padding: 0; }

.cc-cats { margin-top: 12px; }
.cc-cat {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid var(--cc-line);
}
.cc-cat__title { font-weight: 650; font-size: 15px; }
.cc-cat__desc { margin-top: 2px; color: var(--cc-muted); font-size: 14px; }

/* Anahtar: durum her zaman metinle de belirtilir (yalnızca renge bağlı değil) */
.cc-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex: none;
  cursor: pointer;
}
.cc-switch input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}
.cc-switch__state { font-size: 13px; font-weight: 600; color: var(--cc-muted); white-space: nowrap; }
.cc-switch__track {
  position: relative;
  width: 46px;
  height: 28px;
  flex: none;
  background: var(--cc-surface);
  border: 2px solid var(--cc-line-strong);
  border-radius: 14px;
  transition: background 0.18s ease, border-color 0.18s ease;
}
.cc-switch__track::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: var(--cc-line-strong);
  border-radius: 50%;
  transition: transform 0.18s ease, background 0.18s ease;
}
.cc-switch input:checked + .cc-switch__track { background: var(--cc-primary); border-color: var(--cc-primary); }
.cc-switch input:checked + .cc-switch__track::after { background: var(--cc-on-primary); transform: translateX(18px); }
.cc-switch input:focus-visible + .cc-switch__track { outline: 3px solid var(--cc-ink); outline-offset: 2px; }
.cc-switch input:disabled { cursor: not-allowed; }

/* Karar sonrası düğme */
.cc-reopen {
  position: fixed;
  z-index: 2147482999;
  bottom: max(16px, env(safe-area-inset-bottom));
  left: max(16px, env(safe-area-inset-left));
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background: var(--cc-bg);
  color: var(--cc-ink);
  border: 2px solid var(--cc-line-strong);
  border-radius: 50%;
  box-shadow: var(--cc-shadow);
  cursor: pointer;
}
.cc-reopen:hover { background: var(--cc-surface); }
.cc-align-right .cc-reopen { left: auto; right: max(16px, env(safe-area-inset-right)); }

/* Mobil */
@media (max-width: 600px) {
  .cc-overlay { align-items: flex-end; padding: 0; }
  .cc-modal { max-width: none; max-height: 92vh; max-height: 92dvh; border-radius: 16px 16px 0 0; border-bottom: 0; }
  .cc-modal__foot { padding-bottom: max(20px, env(safe-area-inset-bottom)); }
}
@media (max-width: 420px) {
  .cc-cat { flex-direction: column; gap: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}

````

## src/templates/cookie-consent.html

````html
<div class="cc-root">

  <!-- İlk ziyaret banner'ı -->
  <section class="cc-banner" role="dialog" aria-modal="false"
           aria-labelledby="cc-banner-title" aria-describedby="cc-banner-text" hidden>
    <div class="cc-banner__inner">
      <div class="cc-banner__body">
        <div class="cc-head">
          <img class="cc-logo" alt="" hidden>
          <div>
            <p class="cc-brand" hidden></p>
            <h2 class="cc-title" id="cc-banner-title" data-i18n="banner.title"></h2>
          </div>
        </div>
        <p class="cc-text" id="cc-banner-text">
          <span data-i18n="banner.text"></span>
          <a class="cc-link" data-link="privacy" data-i18n="banner.privacy" hidden></a>
          <a class="cc-link" data-link="cookie" data-i18n="banner.cookiePolicy" hidden></a>
        </p>
      </div>
      <div class="cc-actions">
        <button type="button" class="cc-btn cc-btn--ghost" data-action="customize" data-i18n="actions.customize"></button>
        <button type="button" class="cc-btn cc-btn--reject" data-action="reject" data-i18n="actions.rejectAll"></button>
        <button type="button" class="cc-btn cc-btn--accept" data-action="accept" data-i18n="actions.acceptAll"></button>
      </div>
    </div>
  </section>

  <!-- Tercih paneli -->
  <div class="cc-overlay" hidden>
    <div class="cc-modal" role="dialog" aria-modal="true"
         aria-labelledby="cc-modal-title" aria-describedby="cc-modal-intro" tabindex="-1">
      <header class="cc-modal__head">
        <div class="cc-head">
          <img class="cc-logo" alt="" hidden>
          <div>
            <p class="cc-brand" hidden></p>
            <h2 class="cc-title" id="cc-modal-title" data-i18n="modal.title"></h2>
          </div>
        </div>
        <button type="button" class="cc-close" data-action="close" data-i18n-aria="actions.close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </header>
      <div class="cc-modal__body">
        <p class="cc-text" id="cc-modal-intro" data-i18n="modal.intro"></p>
        <ul class="cc-cats"></ul>
      </div>
      <footer class="cc-modal__foot">
        <div class="cc-actions">
          <button type="button" class="cc-btn cc-btn--ghost" data-action="save" data-i18n="actions.save"></button>
          <button type="button" class="cc-btn cc-btn--reject" data-action="reject" data-i18n="actions.rejectAll"></button>
          <button type="button" class="cc-btn cc-btn--accept" data-action="accept" data-i18n="actions.acceptAll"></button>
        </div>
      </footer>
    </div>
  </div>

  <!-- Karar verildikten sonra tercihleri yeniden açan düğme -->
  <button type="button" class="cc-reopen" data-action="reopen" data-i18n-aria="reopen" hidden>
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 4.5 4.5 0 0 1-5-4.5A4.5 4.5 0 0 1 12 3z"/><circle cx="8.5" cy="11" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/><circle cx="15.5" cy="13" r="1" fill="currentColor"/></svg>
  </button>

  <!-- Ekran okuyucu duyuruları -->
  <div class="cc-sr" role="status" aria-live="polite"></div>
</div>

````

## src/locales/en.json

````json
{
  "banner": {
    "title": "Your cookie choices",
    "text": "We use necessary cookies to run this site. Analytics, marketing and preference cookies are only used if you allow them.",
    "privacy": "Privacy policy",
    "cookiePolicy": "Cookie policy"
  },
  "actions": {
    "acceptAll": "Accept all",
    "rejectAll": "Reject all",
    "customize": "Edit preferences",
    "save": "Save my choices",
    "close": "Close"
  },
  "modal": {
    "title": "Cookie preferences",
    "intro": "Choose which categories of cookies you allow. You can change your choice at any time."
  },
  "switch": {
    "always": "Always on",
    "on": "On",
    "off": "Off"
  },
  "reopen": "Open cookie preferences",
  "status": {
    "saved": "Your cookie preferences were saved."
  },
  "categories": {
    "necessary": {
      "title": "Necessary",
      "description": "Required for the site to work, such as security and remembering this choice. These cannot be turned off."
    },
    "analytics": {
      "title": "Analytics",
      "description": "Help us understand how the site is used so we can improve it."
    },
    "marketing": {
      "title": "Marketing",
      "description": "Used to show ads and measure how well campaigns perform."
    },
    "preferences": {
      "title": "Preferences",
      "description": "Remember your settings, such as language or region."
    }
  }
}

````

## src/locales/tr.json

````json
{
  "banner": {
    "title": "Çerez tercihleriniz",
    "text": "Siteyi çalıştırmak için zorunlu çerezler kullanırız. Analiz, pazarlama ve tercih çerezleri yalnızca sizin izninizle etkinleşir.",
    "privacy": "Gizlilik politikası",
    "cookiePolicy": "Çerez politikası"
  },
  "actions": {
    "acceptAll": "Tümünü kabul et",
    "rejectAll": "Tümünü reddet",
    "customize": "Tercihleri düzenle",
    "save": "Seçimlerimi kaydet",
    "close": "Kapat"
  },
  "modal": {
    "title": "Çerez tercihleri",
    "intro": "Hangi çerez kategorilerine izin vereceğinizi seçin. Tercihinizi istediğiniz zaman değiştirebilirsiniz."
  },
  "switch": {
    "always": "Her zaman açık",
    "on": "Açık",
    "off": "Kapalı"
  },
  "reopen": "Çerez tercihlerini aç",
  "status": {
    "saved": "Çerez tercihleriniz kaydedildi."
  },
  "categories": {
    "necessary": {
      "title": "Zorunlu",
      "description": "Güvenlik ve bu tercihin hatırlanması gibi sitenin çalışması için gerekir. Kapatılamaz."
    },
    "analytics": {
      "title": "Analiz",
      "description": "Sitenin nasıl kullanıldığını anlamamıza ve siteyi geliştirmemize yardımcı olur."
    },
    "marketing": {
      "title": "Pazarlama",
      "description": "Reklam göstermek ve kampanyaların performansını ölçmek için kullanılır."
    },
    "preferences": {
      "title": "Tercihler",
      "description": "Dil veya bölge gibi ayarlarınızı hatırlar."
    }
  }
}

````

## examples/basic.html

````html
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Selotion Cookie Consent – Temel örnek</title>
  <style>
    :root { color-scheme: light dark; }
    body { font: 16px/1.6 system-ui, sans-serif; max-width: 720px; margin: 0 auto; padding: 32px 20px 120px; }
    h1 { font-size: 28px; margin: 0 0 4px; }
    .muted { opacity: .7; }
    .row { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
    button { font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid currentColor; background: transparent; color: inherit; cursor: pointer; }
    pre { background: rgba(127,127,127,.12); padding: 14px; border-radius: 10px; overflow: auto; min-height: 120px; font-size: 13px; }
  </style>
</head>
<body>
  <h1>Temel entegrasyon</h1>
  <p class="muted">Aşağıdaki iki script pasif tanımlıdır. İzin verilmeden çalışmazlar.</p>

  <div class="row">
    <button onclick="CookieConsent.showPreferences()">Tercihleri aç</button>
    <button onclick="CookieConsent.acceptAll()">Tümünü kabul et</button>
    <button onclick="CookieConsent.rejectAll()">Tümünü reddet</button>
    <button onclick="CookieConsent.reset()">Kaydı sil (yeniden sor)</button>
  </div>

  <p><a href="#" data-cookie-preferences>Çerez tercihleri</a> (data-cookie-preferences ile de açılabilir)</p>

  <h2>Olay günlüğü</h2>
  <pre id="log"></pre>

  <!-- Analiz: izin verilince çalışır -->
  <script type="text/plain" data-cookie-category="analytics">
    log("analytics scripti çalıştı");
  </script>

  <!-- Pazarlama: izin verilince çalışır -->
  <script type="text/plain" data-cookie-category="marketing">
    log("marketing scripti çalıştı");
  </script>

  <script>
    function log(msg) {
      var el = document.getElementById("log");
      el.textContent += new Date().toLocaleTimeString() + "  " + msg + "\n";
    }
    document.addEventListener("cookieconsent:ready", function (e) {
      log("ready → karar verildi mi: " + e.detail.hasDecision);
    });
    document.addEventListener("cookieconsent:change", function (e) {
      var p = e.detail.preferences;
      log("change (" + e.detail.source + ") → analytics:" + p.analytics + " marketing:" + p.marketing + " preferences:" + p.preferences);
    });
  </script>

  <!-- CDN yerine yerel dosya. Yayında: https://cdn.selotion.com/cookie-consent/v1/cookie-consent.min.js -->
  <script
    src="../dist/cookie-consent.min.js"
    data-language="tr"
    data-theme="auto"
    data-position="bottom"
    data-align="center"
    data-brand="Örnek Site"
    data-privacy-url="/gizlilik-politikasi"
    data-cookie-url="/cerez-politikasi"
    defer>
  </script>
</body>
</html>

````

## tests/consent.test.mjs

````mjs
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

````
