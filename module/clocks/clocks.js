export const CLOCK_ACTOR_TYPE = "🕛 clock";

export const VALID_SEGMENTS = Object.freeze([4, 6, 8, 10, 12]);

export const DEFAULT_SEGMENTS = VALID_SEGMENTS[0];
export const DEFAULT_FILL_COLOR = "#b9342c";

export const TONES = Object.freeze({
  dark: "dark",
  light: "light",
});

export const RENDER_STYLES = Object.freeze({
  rough: "rough",
  clean: "clean",
});

export const BACKGROUND_STYLES = Object.freeze({
  solid: "solid",
  transparent: "transparent",
});

export const VALID_TONES = Object.freeze(Object.values(TONES));
export const VALID_RENDER_STYLES = Object.freeze(Object.values(RENDER_STYLES));
export const VALID_BACKGROUND_STYLES = Object.freeze(
  Object.values(BACKGROUND_STYLES),
);

export const DEFAULT_TONE = TONES.light;
export const DEFAULT_RENDER_STYLE = RENDER_STYLES.rough;
export const DEFAULT_BACKGROUND_STYLE = BACKGROUND_STYLES.transparent;

export const DEFAULT_GEOMETRY = Object.freeze({ radius: 50, cx: 50, cy: 50 });

const TONE_PALETTES = Object.freeze({
  dark: Object.freeze({
    solidEmpty: "#1c1c1f",
    stroke: "#ffffff",
  }),
  light: Object.freeze({
    solidEmpty: "#f5f1e8",
    stroke: "#111111",
  }),
});

const DEFAULT_STROKE_WIDTH = 1;
const TRANSPARENT = "transparent";

const PRECISION = 3;

function clamp(min, max, value) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function snapToValidSegments(value) {
  const target = Math.floor(Number(value));
  if (!Number.isFinite(target)) return DEFAULT_SEGMENTS;
  return VALID_SEGMENTS.reduce((best, candidate) => {
    const bestDelta = Math.abs(best - target);
    const candidateDelta = Math.abs(candidate - target);
    if (candidateDelta < bestDelta) return candidate;
    if (candidateDelta === bestDelta && candidate > best) return candidate;
    return best;
  });
}

export function makeClock({
  segments = DEFAULT_SEGMENTS,
  filled = 0,
  fillColor = DEFAULT_FILL_COLOR,
} = {}) {
  const validSegments = snapToValidSegments(segments);
  return {
    segments: validSegments,
    filled: clamp(0, validSegments, Math.floor(filled)),
    fillColor,
  };
}

export function advanceClock(clock, ticks) {
  return setClockFilled(clock, clock.filled + Math.floor(ticks));
}

export function setClockFilled(clock, filled) {
  return {
    ...clock,
    filled: clamp(0, clock.segments, Math.floor(filled)),
  };
}

export function toggleSegment(clock, index) {
  const target = Math.floor(index);
  if (target < 0 || target >= clock.segments) return { ...clock };
  const fillThrough = target + 1;
  const nextFilled = fillThrough === clock.filled ? target : fillThrough;
  return { ...clock, filled: nextFilled };
}

export function isComplete(clock) {
  return clock.filled >= clock.segments;
}

export function paletteFor({
  tone = DEFAULT_TONE,
  backgroundStyle = DEFAULT_BACKGROUND_STYLE,
  fillColor = DEFAULT_FILL_COLOR,
} = {}) {
  const tonePalette = TONE_PALETTES[tone] ?? TONE_PALETTES[DEFAULT_TONE];
  const empty =
    backgroundStyle === BACKGROUND_STYLES.transparent
      ? TRANSPARENT
      : tonePalette.solidEmpty;
  return {
    empty,
    filled: fillColor,
    stroke: tonePalette.stroke,
    strokeWidth: DEFAULT_STROKE_WIDTH,
  };
}

function round(value) {
  return Number(value.toFixed(PRECISION));
}

function pointOnCircle(angleRadians, radius, cx, cy) {
  return {
    x: round(cx + radius * Math.cos(angleRadians)),
    y: round(cy + radius * Math.sin(angleRadians)),
  };
}

export function segmentPath({ index, total, radius = 50, cx = 50, cy = 50 }) {
  if (!VALID_SEGMENTS.includes(total)) {
    throw new Error(
      `segmentPath: total must be one of ${VALID_SEGMENTS.join(", ")}, got ${total}`,
    );
  }
  if (index < 0 || index >= total) {
    throw new Error(
      `segmentPath: index ${index} out of range for total ${total}`,
    );
  }

  const sweep = (2 * Math.PI) / total;
  const startAngle = -Math.PI / 2 + index * sweep;
  const endAngle = startAngle + sweep;
  const start = pointOnCircle(startAngle, radius, cx, cy);
  const end = pointOnCircle(endAngle, radius, cx, cy);
  const largeArc = sweep > Math.PI ? 1 : 0;

  return [
    `M ${round(cx)} ${round(cy)}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export function segmentPaths(clock, geometry = DEFAULT_GEOMETRY) {
  const { radius, cx, cy } = { ...DEFAULT_GEOMETRY, ...geometry };
  return Array.from({ length: clock.segments }, (_, index) => ({
    index,
    filled: index < clock.filled,
    d: segmentPath({ index, total: clock.segments, radius, cx, cy }),
  }));
}
