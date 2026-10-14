"use client";

import { useMemo, useEffect, useRef } from "react";
import katex from "katex";
import renderMathInElement from "katex/contrib/auto-render";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  htmlContent: string;
  className?: string;
  inline?: boolean;
}

export function renderMathString(text: string): string {
  if (!text) return "";

  // 1. Replace block math: $$...$$ or \[...\]
  let result = text.replace(/(\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\])/g, (match, p1, p2, p3) => {
    const math = p2 || p3;
    if (!math) return match;
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        output: "htmlAndMathml",
      });
    } catch (e) {
      return match;
    }
  });

  // 2. Replace inline math: $...$ or \(...\)
  // Be careful with single $: don't match if empty or contains double dollar
  result = result.replace(/(\$([^\$\n]+?)\$|\\\(([\s\S]*?)\\\))/g, (match, p1, p2, p3) => {
    const math = p2 || p3;
    if (!math) return match;
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        output: "htmlAndMathml",
      });
    } catch (e) {
      return match;
    }
  });

  return result;
}

export function MathRenderer({ htmlContent, className = "", inline = false }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronously compute the KaTeX HTML so React reconciles with rendered HTML,
  // preventing React re-render from wiping out KaTeX modifications on timer ticks!
  const renderedHtml = useMemo(() => {
    return renderMathString(htmlContent || "");
  }, [htmlContent]);

  // Fallback / secondary pass for any deeply nested HTML elements or edge-case delimiters
  useEffect(() => {
    if (containerRef.current) {
      try {
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
      } catch (err) {
        // Safe fallback
      }
    }
  }, [renderedHtml]);

  if (inline) {
    return (
      <span
        ref={containerRef as any}
        className={className}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <div 
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedHtml }} 
    />
  );
}
