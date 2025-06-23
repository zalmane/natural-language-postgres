// Helper to split text into segments based on fenced code blocks, supporting nested mermaid in markdown
export function parseSegments(text: string) {
  const segments: { type: string; content: string; isComplete?: boolean; }[] = []
  if (!text.trim()) return segments

  const lines = text.split(/\r?\n/)
  const stack: { type: string; buffer: string[]; startLine: number; lastWasCodeBlock?: boolean }[] = []
  let currentBuffer: string[] = []
  let currentType: string = 'markdown'
  let lastFlushedLine = -1
  let lastWasCodeBlock = false

  function flushBuffer(type: string, isComplete = true, nextLineIdx?: number, isFinal = false, isUnclosedBlock = false) {
    if (!currentBuffer.length) return
    let content = currentBuffer.join('\n')
    // If markdown, preserve trailing newlines if next line is a code block or end of input
    if (type === 'markdown' && nextLineIdx !== undefined && !isFinal) {
      if (
        nextLineIdx >= lines.length ||
        /^```(\w+)?\s*$/.test(lines[nextLineIdx])
      ) {
        if (!content.endsWith('\n\n')) {
          if (content.endsWith('\n')) content += '\n'
          else content += '\n\n'
        }
      }
    }
    // If this markdown segment comes after a code block, ensure it starts with \n\n
    if (type === 'markdown' && lastWasCodeBlock && !content.startsWith('\n\n')) {
      if (content.startsWith('\n')) content = '\n' + content
      else content = '\n\n' + content
    }
    // Only trim trailing newlines for the very last markdown segment (at the end of the input)
    if (type === 'markdown' && isFinal && nextLineIdx === undefined) {
      content = content.replace(/\n+$/, '')
    }
    // If this is the last segment or next line is a code block or end of input, set isComplete true
    if (type === 'markdown' && (isFinal || (nextLineIdx !== undefined && (nextLineIdx >= lines.length || /^```(\w+)?\s*$/.test(lines[nextLineIdx]))))) {
      isComplete = true
    }
    // If this is an unclosed code block, set isComplete false
    if (type !== 'markdown' && isUnclosedBlock) {
      isComplete = false
    }
    segments.push({ type, content, isComplete })
    currentBuffer = []
    lastFlushedLine = nextLineIdx !== undefined ? nextLineIdx - 1 : -1
    lastWasCodeBlock = (type !== 'markdown')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const codeBlockMatch = line.match(/^```(\w+)?\s*$/)
    if (codeBlockMatch) {
      // Starting a new code block
      const blockType = codeBlockMatch[1] || 'markdown'
      flushBuffer(currentType, true, i)
      stack.push({ type: currentType, buffer: currentBuffer, startLine: i, lastWasCodeBlock })
      currentType = blockType
      currentBuffer = []
      continue
    }
    if (line.trim() === '```') {
      // Ending a code block
      flushBuffer(currentType, true, i + 1)
      if (stack.length > 0) {
        const prev = stack.pop()!
        currentType = prev.type
        currentBuffer = prev.buffer
        lastWasCodeBlock = true
      } else {
        currentType = 'markdown'
        currentBuffer = []
        lastWasCodeBlock = true
      }
      continue
    }
    currentBuffer.push(line)
  }
  // Flush any remaining content
  // If not inside a code block, set isComplete true for the last segment
  // If inside a code block, set isComplete false for the last code block
  if (currentBuffer.length) {
    if (currentType === 'markdown') {
      flushBuffer(currentType, true, undefined, true)
    } else {
      flushBuffer(currentType, false, undefined, true, true)
    }
  }
  return segments
} 