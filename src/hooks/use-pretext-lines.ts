"use client";

import {
  layoutWithLines,
  prepareWithSegments,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  measureTextWidth,
  normalizeWhitespace,
  optimalWordLines,
} from "@/lib/optimal-word-wrap";
import { fontShorthandFromComputed, parseLineHeightPx } from "@/lib/pretext-font";

/**
 * Line wrapping at the measured width of `ref`: optimal word-level breaks (minimize ragged
 * interior lines), with Pretext fallback for overflow / grapheme-level breaks.
 */
export function usePretextLines<T extends HTMLElement>(
  text: string,
  ref: RefObject<T | null>,
): string[] | null {
  const preparedRef = useRef<{
    key: string;
    prepared: PreparedTextWithSegments;
  } | null>(null);
  const [lines, setLines] = useState<string[] | null>(null);

  const relayout = useCallback(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const width = el.getBoundingClientRect().width;
    if (width <= 0) {
      return;
    }

    const styles = getComputedStyle(el);
    const font = fontShorthandFromComputed(styles);
    const lineHeightPx = parseLineHeightPx(styles);
    const normalized = normalizeWhitespace(text);
    const cacheKey = `${normalized}\0${font}`;

    let prepared = preparedRef.current;
    if (prepared?.key !== cacheKey) {
      prepared = {
        key: cacheKey,
        prepared: prepareWithSegments(normalized, font),
      };
      preparedRef.current = prepared;
    }

    const words = normalized.length === 0 ? [] : normalized.split(/\s+/);
    const measure = (s: string) => measureTextWidth(s, font);
    const spaceWidth = measure(" ");
    const optimal =
      words.length === 0
        ? []
        : optimalWordLines(words, width, measure, spaceWidth);

    if (optimal !== null) {
      setLines(optimal);
      return;
    }

    const { lines: layoutLines } = layoutWithLines(
      prepared.prepared,
      width,
      lineHeightPx,
    );
    setLines(layoutLines.map((line) => line.text));
  }, [text, ref]);

  const scheduleLayout = useCallback(() => {
    const tick = () => {
      const el = ref.current;
      if (!el) {
        return;
      }
      if (el.getBoundingClientRect().width <= 0) {
        requestAnimationFrame(tick);
        return;
      }
      relayout();
    };
    tick();
  }, [relayout, ref]);

  useLayoutEffect(() => {
    if (typeof document === "undefined" || !document.fonts) {
      scheduleLayout();
      return;
    }
    void document.fonts.ready.then(scheduleLayout);
  }, [scheduleLayout]);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => {
      scheduleLayout();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [scheduleLayout, ref]);

  return lines;
}
