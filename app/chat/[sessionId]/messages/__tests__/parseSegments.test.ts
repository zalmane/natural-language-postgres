import { parseSegments } from '../parseSegments'

// Simple test runner
function runTests() {
  let passed = 0
  let failed = 0

  function test(name: string, testFn: () => void) {
    try {
      testFn()
      console.log(`✅ ${name}`)
      passed++
    } catch (error) {
      console.log(`❌ ${name}`)
      console.log(`   Error: ${error}`)
      failed++
    }
  }

  function expect(actual: any) {
    return {
      toEqual(expected: any) {
        const actualStr = JSON.stringify(actual, null, 2)
        const expectedStr = JSON.stringify(expected, null, 2)
        if (actualStr !== expectedStr) {
          throw new Error(`Expected ${expectedStr}, but got ${actualStr}`)
        }
      }
    }
  }

  // Test cases
  test('should parse plain text as markdown', () => {
    const text = 'This is plain text content'
    const result = parseSegments(text)
    
    expect(result).toEqual([
      { type: 'markdown', content: 'This is plain text content', isComplete: true }
    ])
  })

  test('should parse standalone mermaid diagrams', () => {
    const text = `Here's a diagram:

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

And some more text.`
    
    const result = parseSegments(text)
    
    expect(result).toEqual([
      { type: 'markdown', content: "Here's a diagram:\n\n", isComplete: true },
      { type: 'mermaid', content: 'graph TD\n    A[Start] --> B[Process]\n    B --> C[End]', isComplete: true },
      { type: 'markdown', content: '\n\nAnd some more text.', isComplete: true }
    ])
  })

  test('should parse markdown blocks with nested mermaid diagrams', () => {
    const text = `Here's some content:

\`\`\`markdown
# Database Schema

This is a description of our database structure:

\`\`\`mermaid
erDiagram
    USERS {
        int id PK
        string name
        string email
    }
    POSTS {
        int id PK
        int user_id FK
        string title
        text content
    }
    USERS ||--o{ POSTS : "has many"
\`\`\`

The diagram above shows the relationship between users and posts.
\`\`\`

End of content.`
    
    const result = parseSegments(text)
    
    expect(result).toEqual([
      { type: 'markdown', content: "Here's some content:\n\n", isComplete: true },
      { type: 'markdown', content: '# Database Schema\n\nThis is a description of our database structure:\n\n', isComplete: true },
      { type: 'mermaid', content: 'erDiagram\n    USERS {\n        int id PK\n        string name\n        string email\n    }\n    POSTS {\n        int id PK\n        int user_id FK\n        string title\n        text content\n    }\n    USERS ||--o{ POSTS : "has many"', isComplete: true },
      { type: 'markdown', content: '\n\nThe diagram above shows the relationship between users and posts.', isComplete: true },
      { type: 'markdown', content: '\n\nEnd of content.', isComplete: true }
    ])
  })

  test('should parse JavaScript code blocks', () => {
    const text = `Here's some JavaScript:

\`\`\`javascript
function hello() {
    console.log('Hello, World!');
}
\`\`\``
    
    const result = parseSegments(text)
    
    expect(result).toEqual([
      { type: 'markdown', content: "Here's some JavaScript:\n\n", isComplete: true },
      { type: 'javascript', content: 'function hello() {\n    console.log(\'Hello, World!\');\n}', isComplete: true }
    ])
  })

  test('should parse JSON code blocks', () => {
    const text = `Configuration:

\`\`\`json
{
    "name": "test",
    "version": "1.0.0"
}
\`\`\``
    
    const result = parseSegments(text)
    
    expect(result).toEqual([
      { type: 'markdown', content: 'Configuration:\n\n', isComplete: true },
      { type: 'json', content: '{\n    "name": "test",\n    "version": "1.0.0"\n}', isComplete: true }
    ])
  })

  test('should handle incomplete code blocks', () => {
    const text = `Incomplete block:

\`\`\`mermaid
graph TD
    A --> B
    B --> C`
    
    const result = parseSegments(text)
    
    expect(result).toEqual([
      { type: 'markdown', content: 'Incomplete block:\n\n', isComplete: true },
      { type: 'mermaid', content: 'graph TD\n    A --> B\n    B --> C', isComplete: false }
    ])
  })

  test('should handle empty content', () => {
    const text = ''
    const result = parseSegments(text)
    
    expect(result).toEqual([])
  })

  test('should handle markdown blocks with no nested content', () => {
    const text = `Regular markdown:

\`\`\`markdown
# Title
This is just regular markdown content.
No nested code blocks here.
\`\`\``
    
    const result = parseSegments(text)
    
    expect(result).toEqual([
      { type: 'markdown', content: 'Regular markdown:\n\n', isComplete: true },
      { type: 'markdown', content: '# Title\nThis is just regular markdown content.\nNo nested code blocks here.', isComplete: true }
    ])
  })

  test('should handle mixed content types', () => {
    const text = `# Introduction

Here's a simple diagram:

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

And some code:

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

Finally, some data:

\`\`\`json
{
  "message": "Test complete"
}
\`\`\``
    
    const result = parseSegments(text)
    
    expect(result).toEqual([
      { type: 'markdown', content: '# Introduction\n\nHere\'s a simple diagram:\n\n', isComplete: true },
      { type: 'mermaid', content: 'graph LR\n    A --> B', isComplete: true },
      { type: 'markdown', content: '\n\nAnd some code:\n\n', isComplete: true },
      { type: 'javascript', content: 'const greeting = "Hello, World!";\nconsole.log(greeting);', isComplete: true },
      { type: 'markdown', content: '\n\nFinally, some data:\n\n', isComplete: true },
      { type: 'json', content: '{\n  "message": "Test complete"\n}', isComplete: true }
    ])
  })

  // Summary
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
} 