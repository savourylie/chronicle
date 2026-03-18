import { interpolateZoom } from "d3";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Center + radius of a focused node in pack-layout coordinates. */
export interface ZoomView {
  x: number;
  y: number;
  r: number;
}

/** SVG `<g>` transform parameters. */
export interface ZoomTransform {
  tx: number;
  ty: number;
  k: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ZOOM_DURATION_MS = 300;

// ---------------------------------------------------------------------------
// Zoom math
// ---------------------------------------------------------------------------

/**
 * Compute the ZoomView for a given packed node.
 * For the root node the view encompasses the full viewport.
 */
export function computeZoomView(
  node: { x: number; y: number; r: number },
  width: number,
  height: number,
): ZoomView {
  // If the node covers (nearly) the full viewport, treat it as root view
  const isRoot =
    Math.abs(node.x - width / 2) < 1 &&
    Math.abs(node.y - height / 2) < 1 &&
    Math.abs(node.r - Math.min(width, height) / 2) < 1;

  if (isRoot) {
    return { x: width / 2, y: height / 2, r: Math.min(width, height) / 2 };
  }

  return { x: node.x, y: node.y, r: node.r };
}

/**
 * Create a smooth zoom interpolator (van Wijk-Nuij) between two ZoomViews.
 * Returns a function `(t: 0..1) => ZoomView`.
 */
export function createZoomTransition(
  from: ZoomView,
  to: ZoomView,
): (t: number) => ZoomView {
  // d3.interpolateZoom expects [cx, cy, width] triplets where width is the
  // viewport extent visible at that level.  We use `2 * r` as the width.
  const interp = interpolateZoom(
    [from.x, from.y, from.r * 2],
    [to.x, to.y, to.r * 2],
  );

  return (t: number): ZoomView => {
    const [ix, iy, iw] = interp(t);
    return { x: ix, y: iy, r: iw / 2 };
  };
}

/**
 * Convert a ZoomView into the `translate(tx,ty) scale(k)` transform
 * that maps the view onto the full SVG viewport.
 */
export function zoomViewToTransform(
  view: ZoomView,
  width: number,
  height: number,
): ZoomTransform {
  const diameter = view.r * 2;
  const k = Math.min(width, height) / diameter;
  const tx = width / 2 - view.x * k;
  const ty = height / 2 - view.y * k;
  return { tx, ty, k };
}

/**
 * Screen-space radius of a node given its layout radius and current zoom scale.
 */
export function getEffectiveRadius(nodeR: number, k: number): number {
  return nodeR * k;
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

/** Cubic ease-in-out — smooth without overshoot. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
