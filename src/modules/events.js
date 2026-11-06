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
