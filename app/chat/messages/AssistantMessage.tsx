import React, { useEffect, useRef, useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import mermaid from "mermaid";

// Helper to split text into segments based on fenced code blocks
function parseSegments(text: string) {
  const segments: { type: string; content: string }[] = [];
  const completedBlockRegex = /```(markdown|mermaid|javascript|json|sql)\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = completedBlockRegex.exec(text)) !== null) {
    const precedingText = text.slice(lastIndex, match.index);
    if (precedingText.trim()) {
      segments.push({ type: 'markdown', content: precedingText });
    }
    segments.push({ type: match[1], content: match[2].trim() });
    lastIndex = completedBlockRegex.lastIndex;
  }

  const remainder = text.slice(lastIndex);
  const openBlockRegex = /```(markdown|mermaid|javascript|json|sql)\s*([\s\S]*)/;
  const openMatch = remainder.match(openBlockRegex);

  if (openMatch && openMatch.index !== undefined) {
    const precedingText = remainder.slice(0, openMatch.index);
    if (precedingText.trim()) {
      segments.push({ type: 'markdown', content: precedingText });
    }
    segments.push({ type: openMatch[1], content: openMatch[2] });
  } else if (remainder.trim()) {
    segments.push({ type: 'markdown', content: remainder });
  }

  return segments;
}

export function AssistantMessage({ text, isLoading, children }: { text: string, isLoading: boolean, children?: React.ReactNode }) {
  const mermaidRefs = useRef<(HTMLDivElement | null)[]>([]);
  const segments = useMemo(() => parseSegments(text), [text]);

  useEffect(() => {
    mermaidRefs.current = mermaidRefs.current.slice(0, segments.length);
    segments.forEach((segment, i) => {
      if (segment.type === "mermaid" && mermaidRefs.current[i]) {
        try {
            mermaid.initialize({ startOnLoad: false });
            (async () => {
                const { svg } = await mermaid.render(`mermaid-diagram-${i}-${Date.now()}`, segment.content);
                if (mermaidRefs.current[i]) {
                    mermaidRefs.current[i]!.innerHTML = svg;
                }
            })();
        } catch (e) {
            console.error("Error rendering mermaid diagram:", e);
            if (mermaidRefs.current[i]) {
                mermaidRefs.current[i]!.innerHTML = "<p>Error rendering Mermaid diagram.</p>";
            }
        }
      }
    });
  }, [segments]);

  return (
    <div className="flex flex-col gap-2">
      {segments.map((segment, i) => {
        switch (segment.type) {
            case "mermaid":
                return <div key={i} ref={el => { mermaidRefs.current[i] = el; }} className="my-2" />;
            case "javascript":
            case "json":
            case "sql":
            case "markdown":
            default:
                const content = (segment.type === 'markdown' || segment.type === 'text')
                    ? segment.content
                    : "```" + segment.type + "\n" + segment.content + "\n```";

                return (
                    <div key={i} className="prose prose-lg max-w-none relative">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                pre: ({ children }) => <pre className="relative">{children}</pre>,
                                code: ({ node, inline, className, children, ...props }: { node?: any; inline?: boolean; className?: string; children?: React.ReactNode }) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <>
                                            <div className="absolute top-2 right-2 text-xs text-muted-foreground">{match[1]}</div>
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        </>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                );
        }
      })}
      {children}
    </div>
  );
}