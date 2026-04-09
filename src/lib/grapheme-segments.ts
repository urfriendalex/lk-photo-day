/**
 * Grapheme clusters for animation / one span per visible unit.
 * @chenglou/pretext uses the same primitive internally (Intl.Segmenter, grapheme)
 * when splitting CJK and breakable runs — we reuse that approach here because
 * prepareWithSegments() stores Latin words as single measured segments, not per
 * grapheme, so it is not suitable for character-stagger on headlines.
 */
const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/** Fallback when Intl.Segmenter is unavailable (very old runtimes). */
export function splitGraphemeClusters(text: string): string[] {
  if (!segmenter) {
    return Array.from(text);
  }
  return [...segmenter.segment(text)].map((s) => s.segment);
}
