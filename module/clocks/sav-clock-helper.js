import { buildClockSvgString } from "./sav-clock-image.js";

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function defaultTheme() {
  try {
    const idx = game?.settings?.get("scum-and-villainy", "defaultClockTheme") ?? 0;
    return game?.system?.savclocks?.themes?.[idx] ?? "blue";
  } catch {
    return "blue";
  }
}

function renderClockMarkup({ parameterName, size, current, uniqId, theme }) {
  const svg = buildClockSvgString({ theme, size, progress: current });

  const radios = [];
  for (let i = 0; i <= size; i++) {
    const checked = i === current ? " checked" : "";
    radios.push(
      `<input type="radio" hidden name="${escapeAttr(parameterName)}" value="${i}" id="sav-clock-radio-${escapeAttr(uniqId)}-${i}"${checked}>`,
    );
  }

  return [
    `<div class="sav-clock-wrap" data-sav-clock="${escapeAttr(uniqId)}" data-progress="${current}" data-size="${size}" data-theme="${escapeAttr(theme)}" data-parameter="${escapeAttr(parameterName)}">`,
    svg,
    radios.join(""),
    `</div>`,
  ].join("");
}

export function registerClockHelper() {
  Handlebars.registerHelper("sav-clock", function (parameterName, type, currentValue, uniqId, theme) {
    const size = parseInt(type, 10);
    let current = parseInt(currentValue, 10);
    if (!Number.isFinite(current) || current < 0) current = 0;
    if (current > size) current = size;

    const resolvedTheme = typeof theme === "string" && theme.length ? theme : defaultTheme();

    const markup = renderClockMarkup({
      parameterName,
      size,
      current,
      uniqId,
      theme: resolvedTheme,
    });
    return new Handlebars.SafeString(markup);
  });
}
