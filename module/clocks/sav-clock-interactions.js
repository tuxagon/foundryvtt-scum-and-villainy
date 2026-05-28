import { toggleSegment } from "./clocks.js";

let installed = false;

function findSegment(target) {
  if (!(target instanceof Element)) return null;
  return target.closest("[data-segment-index]");
}

function findHostDocument(wrap) {
  const appEl = wrap.closest(".window-app[data-appid]");
  if (!appEl) return null;
  const app = ui.windows?.[appEl.dataset.appid];
  if (!app) return null;
  return app.actor ?? app.item ?? app.object ?? null;
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

  console.log(
    "SaV clock click | segment",
    seg.dataset.segmentIndex,
    "wrap",
    wrap.dataset,
  );

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
  console.log("SaV clock interactions installed");
}
