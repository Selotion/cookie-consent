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