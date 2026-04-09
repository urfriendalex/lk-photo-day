import { CustomEase } from "gsap/CustomEase";
import { gsap } from "gsap";

gsap.registerPlugin(CustomEase);

/** Folio `reveal.module.scss` — `.token` transform curve */
export const EASE_TRANSFORM = CustomEase.create(
  "folioRevealTransform",
  "M0,0 C0.2,0.88 0.24,1 1,1",
);

/**
 * Gap between consecutive reveal “lines” (intra-block stagger and cross-block `revealAfterLines` steps).
 * Keep in sync with `reveal-hierarchy` / `estimateLineCount` so order stays top-to-bottom.
 */
export const LINE_STAGGER_S = 0.07;

/** Folio `.token` transform 620ms */
export const DURATION_TRANSFORM_S = 0.62;

/**
 * Topic grid — editorial weight: slightly slower than inline text so the reveal feels
 * intentional (luxury pacing), still under ~1s.
 */
export const GRID_IMAGE_REVEAL_DURATION_S = 0.88;

/** Starts a touch below; pairs with subtle scale + blur for depth (never scale(0)) */
export const GRID_IMAGE_INITIAL_Y_PERCENT = 8;

export const GRID_IMAGE_INITIAL_SCALE = 0.968;

/** Soft pre-focus; clears to sharp (kept ≤12px for perf, skill: blur bridges crossfades) */
export const GRID_IMAGE_INITIAL_BLUR_PX = 6;

export const GRID_IMAGE_INITIAL_OPACITY = 0;

/**
 * Global line-index steps after the grid’s start slot so the next TextReveal block begins
 * after the grid motion can finish.
 */
export const GRID_REVEAL_TAIL_LINE_SLOTS = Math.ceil(
  GRID_IMAGE_REVEAL_DURATION_S / LINE_STAGGER_S,
);
