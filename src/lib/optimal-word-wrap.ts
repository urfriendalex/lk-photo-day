/**
 * Paragraph line breaking with TeX-style demerits for interior lines (slack³),
 * so we avoid greedy “orphan” lines with one short word and lots of empty space.
 * Uses the same canvas measureText as @chenglou/pretext for word widths.
 */

const EPS = 1;

let measureCanvas: HTMLCanvasElement | null = null;

export function measureTextWidth(text: string, font: string): number {
  if (typeof document === "undefined") {
    return 0;
  }
  if (!measureCanvas) {
    measureCanvas = document.createElement("canvas");
  }
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) {
    return 0;
  }
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * Returns `null` if any single word is wider than `maxWidth` (caller should fall back to grapheme wrapping).
 */
export function optimalWordLines(
  words: string[],
  maxWidth: number,
  measure: (s: string) => number,
  spaceWidth: number,
): string[] | null {
  const n = words.length;
  if (n === 0) {
    return [];
  }

  const w = words.map((word) => measure(word));
  for (let i = 0; i < n; i++) {
    if (w[i]! > maxWidth + EPS) {
      return null;
    }
  }

  if (n === 1) {
    return [words[0]!];
  }

  function lineWidth(i: number, j: number): number {
    let sum = 0;
    for (let k = i; k <= j; k++) {
      sum += w[k]!;
    }
    if (j > i) {
      sum += (j - i) * spaceWidth;
    }
    return sum;
  }

  const INF = Number.POSITIVE_INFINITY;
  const dp: number[] = new Array(n);
  const backStart: number[] = new Array(n);

  for (let j = 0; j < n; j++) {
    dp[j] = INF;
    for (let i = 0; i <= j; i++) {
      const lw = lineWidth(i, j);
      if (lw > maxWidth + EPS) {
        continue;
      }
      const slack = maxWidth - lw;
      const isLastLine = j === n - 1;
      const prev = i > 0 ? dp[i - 1]! : 0;
      const demerit = isLastLine ? 0 : slack * slack * slack;
      const cost = prev + demerit;
      if (cost < dp[j]!) {
        dp[j] = cost;
        backStart[j] = i;
      }
    }
  }

  if (dp[n - 1] === INF) {
    return null;
  }

  const lines: string[] = [];
  let j = n - 1;
  while (j >= 0) {
    const i = backStart[j]!;
    lines.push(words.slice(i, j + 1).join(" "));
    j = i - 1;
  }
  lines.reverse();
  return lines;
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
