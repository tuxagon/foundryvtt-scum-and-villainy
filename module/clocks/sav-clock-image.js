import { renderClockSvgString } from "./clocks-rough.js";
import {
  buildPalette,
  currentStyleContext,
  toCoreClock,
} from "./sav-clock-adapter.js";

export function buildClockSvgString(savClock) {
  const coreClock = toCoreClock(savClock);
  const palette = buildPalette(savClock.theme);
  const { renderStyle, tone, backgroundStyle } = currentStyleContext();
  return renderClockSvgString(coreClock, {
    palette,
    renderStyle,
    tone,
    backgroundStyle,
  });
}

export function buildClockDataUrl(savClock) {
  const svg = buildClockSvgString(savClock);
  // Trailing #.svg gives Foundry's FilePathField a recognisable extension to validate against;
  // browsers ignore URL fragments when fetching data: URLs.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}#.svg`;
}
