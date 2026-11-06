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
