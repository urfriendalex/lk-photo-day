/**
 * Font string + metrics for @chenglou/pretext (prepare / layoutWithLines).
 * Duplicated from browser computed styles — same as PretextParagraph.
 */
export function fontShorthandFromComputed(styles: CSSStyleDeclaration): string {
  if (styles.font.length > 0) {
    return styles.font;
  }
  return `${styles.fontStyle} ${styles.fontVariant} ${styles.fontWeight} ${styles.fontSize} / ${styles.lineHeight} ${styles.fontFamily}`;
}

export function parseLineHeightPx(styles: CSSStyleDeclaration): number {
  const raw = styles.lineHeight;
  const parsed = Number.parseFloat(raw);
  if (Number.isFinite(parsed) && raw !== "normal") {
    return parsed;
  }
  const fontSize = Number.parseFloat(styles.fontSize);
  return Number.isFinite(fontSize) ? fontSize * 1.3 : 16;
}
