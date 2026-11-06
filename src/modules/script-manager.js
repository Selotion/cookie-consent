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