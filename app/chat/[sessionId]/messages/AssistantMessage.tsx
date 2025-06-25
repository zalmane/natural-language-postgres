import React, { useEffect, useRef, useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import mermaid from "mermaid";

// Helper to split text into segments based on fenced code blocks, supporting nested mermaid in markdown
export function parseSegments(text: string) {
  const segments: { type: string; content: string; isComplete?: boolean; }[] = []
  if (!text.trim()) return segments

  const lines = text.split(/\r?\n/)
  const stack: { type: string; buffer: string[] }[] = []
  let currentBuffer: string[] = []
  let currentType: string = 'markdown'

  function flushBuffer(type: string, isComplete = true) {
    if (currentBuffer.length) {
      segments.push({ type, content: currentBuffer.join('\n'), isComplete })
      currentBuffer = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const codeBlockMatch = line.match(/^```(\w+)?\s*$/)
    
    if (codeBlockMatch) {
      // Starting a new code block
      const blockType = codeBlockMatch[1] || 'markdown'
      
      // Flush current buffer
      flushBuffer(currentType)
      
      // Push current context to stack
      stack.push({ type: currentType, buffer: currentBuffer })
      
      // Start new block
      currentType = blockType
      currentBuffer = []
      continue
    }
    
    if (line.trim() === '```') {
      // Ending a code block
      flushBuffer(currentType)
      
      // Pop from stack and restore previous context
      if (stack.length > 0) {
        const prev = stack.pop()!
        currentType = prev.type
        currentBuffer = prev.buffer
      } else {
        currentType = 'markdown'
        currentBuffer = []
      }
      continue
    }
    
    currentBuffer.push(line)
  }
  
  // Flush any remaining content
  flushBuffer(currentType, false)

  return segments
}

// Helper to parse nested content (like mermaid inside markdown)
function parseNestedContent(content: string, parentType: string) {
  const segments: { type: string; content: string; isComplete?: boolean; }[] = [];
  
  if (parentType === 'markdown') {
    // For markdown content, we need to look for mermaid blocks
    // Use a more specific regex that matches the full mermaid block
    const mermaidRegex = /```mermaid\s*([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = mermaidRegex.exec(content)) !== null) {
      const precedingText = content.slice(lastIndex, match.index);
      if (precedingText.trim()) {
        segments.push({ type: 'markdown', content: precedingText, isComplete: true });
      }
      segments.push({ type: 'mermaid', content: match[1].trim(), isComplete: true });
      lastIndex = mermaidRegex.lastIndex;
    }

    const remainder = content.slice(lastIndex);
    if (remainder.trim()) {
      segments.push({ type: 'markdown', content: remainder, isComplete: true });
    }
  } else {
    // For regular text, look for all code blocks
    const codeBlockRegex = /```(mermaid|javascript|json|sql)\s*([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const precedingText = content.slice(lastIndex, match.index);
      if (precedingText.trim()) {
        segments.push({ type: 'markdown', content: precedingText, isComplete: true });
      }
      segments.push({ type: match[1], content: match[2].trim(), isComplete: true });
      lastIndex = codeBlockRegex.lastIndex;
    }

    const remainder = content.slice(lastIndex);
    const openBlockRegex = /```(mermaid|javascript|json|sql)\s*([\s\S]*)/;
    const openMatch = remainder.match(openBlockRegex);

    if (openMatch && openMatch.index !== undefined) {
      const precedingText = remainder.slice(0, openMatch.index);
      if (precedingText.trim()) {
        segments.push({ type: 'markdown', content: precedingText, isComplete: true });
      }
      segments.push({ type: openMatch[1], content: openMatch[2], isComplete: false });
    } else if (remainder.trim()) {
      segments.push({ type: 'markdown', content: remainder, isComplete: true });
    }
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
            // Validate the diagram before rendering
            try {
              mermaid.parse(segment.content);
            } catch (parseErr) {
              mermaidRefs.current[i]!.innerHTML = "<p class='text-red-500'>Invalid diagram syntax.</p>";
              return;
            }
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
                if (segment.isComplete === false) {
                    return (
                        <div key={i} className="my-2 p-4 bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="animate-spin">...</span>
                            <span>Generating diagram...</span>
                        </div>
                    );
                }
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
                    <div key={i} className="prose prose-sm max-w-none relative">
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