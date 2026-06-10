import rough from "../vendor/rough.esm.js";
import {
  BACKGROUND_STYLES,
  DEFAULT_GEOMETRY,
  RENDER_STYLES,
  segmentPaths,
} from "./clocks.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEWBOX_SIZE = 100;
// 2px padding on each side so segment strokes aren't clipped at viewBox edges.
const VIEWBOX_PADDING = 2;

const ROUGH_BASE_OPTIONS = Object.freeze({
  roughness: 1.4,
  bowing: 1.2,
  fillStyle: "solid",
  strokeWidth: 1.25,
  preserveVertices: true,
});

function isTransparentPaint(color) {
  return color === "transparent" || color === BACKGROUND_STYLES.transparent;
}

function roughOptionsFor({ palette, index, filled }) {
  const isTransparentEmpty = isTransparentPaint(palette.empty);
  const shouldFill = filled || !isTransparentEmpty;
  return {
    ...ROUGH_BASE_OPTIONS,
    stroke: palette.stroke,
    strokeWidth: palette.strokeWidth ?? ROUGH_BASE_OPTIONS.strokeWidth,
    fill: shouldFill ? (filled ? palette.filled : palette.empty) : undefined,
    fillStyle: "solid",
    seed: index + 1,
  };
}

function ensureSvgRoot(doc) {
  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  const p = VIEWBOX_PADDING;
  svg.setAttribute(
    "viewBox",
    `${-p} ${-p} ${VIEWBOX_SIZE + p * 2} ${VIEWBOX_SIZE + p * 2}`,
  );
  return svg;
}

function buildSegmentGroup({
  d,
  index,
  filled,
  palette,
  renderStyle,
  svgRoot,
}) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("data-segment-index", String(index));
  group.classList.add("sav-clock-segment");
  if (filled) group.classList.add("filled");

  if (renderStyle === RENDER_STYLES.rough) {
    const hit = document.createElementNS(SVG_NS, "path");
    hit.setAttribute("d", d);
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("stroke", "none");
    hit.classList.add("sav-clock-segment-hit");
    group.appendChild(hit);

    const rc = rough.svg(svgRoot);
    const node = rc.path(d, roughOptionsFor({ palette, index, filled }));
    group.appendChild(node);
  } else {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", filled ? palette.filled : palette.empty);
    path.setAttribute("stroke", palette.stroke);
    path.setAttribute("stroke-width", String(palette.strokeWidth));
    group.appendChild(path);
  }

  return group;
}

export function buildClockSvgElement(
  clock,
  { palette, renderStyle, tone, backgroundStyle },
  geometry = DEFAULT_GEOMETRY,
) {
  const svg = ensureSvgRoot(document);
  svg.dataset.style = renderStyle;
  if (tone) svg.dataset.tone = tone;
  if (backgroundStyle) svg.dataset.background = backgroundStyle;
  const segments = segmentPaths(clock, geometry);
  for (const { d, index, filled } of segments) {
    svg.appendChild(
      buildSegmentGroup({
        d,
        index,
        filled,
        palette,
        renderStyle,
        svgRoot: svg,
      }),
    );
  }
  return svg;
}

export function renderClockSvgString(
  clock,
  options,
  geometry = DEFAULT_GEOMETRY,
) {
  if (typeof document === "undefined") {
    throw new Error("renderClockSvgString requires a DOM environment");
  }
  const svg = buildClockSvgElement(clock, options, geometry);
  return new XMLSerializer().serializeToString(svg);
}
