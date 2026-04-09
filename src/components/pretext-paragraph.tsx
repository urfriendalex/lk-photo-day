"use client";

import { useRef } from "react";

import { usePretextLines } from "@/hooks/use-pretext-lines";

type PretextParagraphProps = {
  text: string;
};

export function PretextParagraph({ text }: PretextParagraphProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const lines = usePretextLines(text, ref);

  return (
    <p ref={ref}>
      {lines === null
        ? text
        : lines.map((line, index) => (
            <span className="pretext-flow__line" key={index}>
              {line}
            </span>
          ))}
    </p>
  );
}
