import {
  BACKGROUND_STYLES,
  DEFAULT_BACKGROUND_STYLE,
  DEFAULT_FILL_COLOR,
  DEFAULT_RENDER_STYLE,
  DEFAULT_TONE,
  paletteFor,
  RENDER_STYLES,
  snapToValidSegments,
  TONES,
  VALID_BACKGROUND_STYLES,
  VALID_RENDER_STYLES,
  VALID_TONES,
} from "./clocks.js";

export const SYSTEM_ID = "scum-and-villainy";

export const SETTING_RENDER_STYLE = "clockRenderStyle";
export const SETTING_BACKGROUND_STYLE = "clockBackgroundStyle";
export const SETTING_TONE = "clockTone";

export const THEME_COLORS = Object.freeze({
  blue: "#2f6fb8",
  red: "#b9342c",
  yellow: "#d6a64a",
  green: "#4a8a3e",
});

export function themeToFillColor(theme) {
  return THEME_COLORS[theme] ?? DEFAULT_FILL_COLOR;
}

function safeGetSetting(key, fallback) {
  try {
    const value = game?.settings?.get(SYSTEM_ID, key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function currentRenderStyle() {
  const value = safeGetSetting(SETTING_RENDER_STYLE, DEFAULT_RENDER_STYLE);
  return VALID_RENDER_STYLES.includes(value) ? value : DEFAULT_RENDER_STYLE;
}

export function currentBackgroundStyle() {
  const value = safeGetSetting(
    SETTING_BACKGROUND_STYLE,
    DEFAULT_BACKGROUND_STYLE,
  );
  return VALID_BACKGROUND_STYLES.includes(value)
    ? value
    : DEFAULT_BACKGROUND_STYLE;
}

export function currentTone() {
  const value = safeGetSetting(SETTING_TONE, DEFAULT_TONE);
  return VALID_TONES.includes(value) ? value : DEFAULT_TONE;
}

export function currentStyleContext() {
  return {
    renderStyle: currentRenderStyle(),
    backgroundStyle: currentBackgroundStyle(),
    tone: currentTone(),
  };
}

export function buildPalette(theme) {
  const { tone, backgroundStyle } = currentStyleContext();
  return paletteFor({
    tone,
    backgroundStyle,
    fillColor: themeToFillColor(theme),
  });
}

export function toCoreClock({ theme, size, progress }) {
  const segments = snapToValidSegments(size);
  const filled = Math.max(
    0,
    Math.min(segments, Math.floor(Number(progress) || 0)),
  );
  return {
    segments,
    filled,
    fillColor: themeToFillColor(theme),
  };
}

export {
  BACKGROUND_STYLES,
  DEFAULT_BACKGROUND_STYLE,
  DEFAULT_RENDER_STYLE,
  DEFAULT_TONE,
  RENDER_STYLES,
  TONES,
  VALID_BACKGROUND_STYLES,
  VALID_RENDER_STYLES,
  VALID_TONES,
};
