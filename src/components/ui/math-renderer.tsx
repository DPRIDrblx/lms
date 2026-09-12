"use client";

import { useEffect, useRef } from "react";
// @ts-expect-error No types available
import renderMathInElement from "katex/contrib/auto-render";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  htmlContent: string;
  className?: string;
}

export function MathRenderer({ htmlContent, className = "" }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false,
        errorColor: "#cc0000",
      });
    }
  }, [htmlContent]);

  return (
    <div 
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
}
