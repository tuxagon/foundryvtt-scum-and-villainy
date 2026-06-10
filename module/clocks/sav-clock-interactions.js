import { toggleSegment } from "./clocks.js";

let installed = false;

function findSegment(target) {
  if (!(target instanceof Element)) return null;
  return target.closest("[data-segment-index]");
}

function findHostApp(wrap) {
  // ApplicationV2 sheets: the root element's id is the application id.
  const v2El = wrap.closest(".application[id]");
  if (v2El) {
    const app = foundry.applications.instances.get(v2El.id);
    if (app) return app;
  }
  // Legacy ApplicationV1 sheets.
  const v1El = wrap.closest(".window-app[data-appid]");
  if (v1El) return ui.windows?.[v1El.dataset.appid] ?? null;
  return null;
}

function findHostDocument(wrap) {
  const app = findHostApp(wrap);
  if (!app) return null;
  const doc = app.document ?? app.actor ?? app.item ?? app.object ?? null;

  // Clocks rendered inside an embedded-item row (e.g. faction clocks on the
  // universe sheet) must persist to the embedded item, not the host actor.
  const itemEl = wrap.closest("[data-item-id]");
  if (itemEl && doc?.items) {
    const item = doc.items.get(itemEl.dataset.itemId);
    if (item) return item;
  }
  return doc;
}

function readByPath(obj, dottedPath) {
  return dottedPath
    .split(".")
    .reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

async function persistProgress(doc, parameter, next) {
  const existing = readByPath(doc, parameter);
  const value = Array.isArray(existing) ? [next] : next;
  await doc.update({ [parameter]: value });
}

async function handleClick(event) {
  const seg = findSegment(event.target);
  if (!seg) return;
  const wrap = seg.closest(".sav-clock-wrap[data-sav-clock]");
  if (!wrap) return;

  event.preventDefault();
  event.stopPropagation();

  const index = parseInt(seg.dataset.segmentIndex, 10);
  const size = parseInt(wrap.dataset.size, 10);
  const progress = parseInt(wrap.dataset.progress, 10) || 0;
  if (!Number.isFinite(index) || !Number.isFinite(size)) return;

  const next = toggleSegment(
    { segments: size, filled: progress },
    index,
  ).filled;
  if (next === progress) return;

  const parameter = wrap.dataset.parameter;
  const doc = findHostDocument(wrap);
  if (doc && parameter) {
    wrap.dataset.progress = String(next);
    try {
      await persistProgress(doc, parameter, next);
      return;
    } catch (err) {
      console.error(
        "SaV clock: direct document update failed, falling back to form submission",
        err,
      );
    }
  }

  const radio = wrap.querySelector(`input[type="radio"][value="${next}"]`);
  if (!radio) return;
  wrap.dataset.progress = String(next);
  radio.checked = true;
  radio.dispatchEvent(new Event("change", { bubbles: true }));
}

export function registerClockInteractions() {
  if (installed) return;
  installed = true;
  document.body.addEventListener("click", handleClick, true);
}
