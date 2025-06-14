import React, { useEffect, useRef } from "react";
import { FishLogo } from "../FishLogo";
import mermaid from "mermaid";

// Helper to split text into normal and mermaid segments
function parseMermaidSegments(text: string) {
  const regex = /```mermaid\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  const segments: { type: "text" | "mermaid"; content: string }[] = [];

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "mermaid", content: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }
  return segments;
}

export function AssistantMessage({ text, isLoading, children }: { text: string, isLoading: boolean, children?: React.ReactNode }) {
  const mermaidRefs = useRef<(HTMLDivElement | null)[]>([]);
  const segments = parseMermaidSegments(text);

  useEffect(() => {
    segments.forEach((segment, i) => {
      if (segment.type === "mermaid" && mermaidRefs.current[i]) {
        mermaid.initialize({ startOnLoad: false });
        (async () => {
          const { svg } = await mermaid.render(`mermaid-diagram-${i}`, segment.content);
          if (mermaidRefs.current[i]) {
            mermaidRefs.current[i]!.innerHTML = svg;
          }
        })();
      }
    });
    // eslint-disable-next-line
  }, [text]);


  
  return (
    <div className="flex flex-col gap-2">
      {segments.map((segment, i) =>
        segment.type === "mermaid" ? (
          <div key={i} ref={el => { mermaidRefs.current[i] = el; }} className="my-2" />
        ) : (
          <div key={i} className="whitespace-pre-wrap flex items-top">
            {segment.content}
          </div>
        )
      )}
      {children}
 
      </div>
  );
}