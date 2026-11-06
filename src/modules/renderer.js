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