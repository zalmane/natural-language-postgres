import { streamText, tool, simulateReadableStream, experimental_createMCPClient, Output } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';
import { anthropic, AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { z } from 'zod';

let toolsCache: Record<string, any> | null = null;
const BP_MANAGER_URL = process.env.BP_MANAGER_URL || 'http://localhost:8000';
function wrapToolsWithProjectName(tools: any, projectName: string) {
  const wrappedTools: Record<string, any> = {};
  
  for (const [toolName, tool] of Object.entries(tools)) {
    wrappedTools[toolName] = {
      ...(tool as any),
      execute: async (params: any) => {
        // Add project_name to the parameters
        const paramsWithProject = {
          ...params,
          project_name: projectName
        };
        // Call the original execute function
        return await (tool as any).execute(paramsWithProject);
      }
    };
  }
  
  return wrappedTools;
}


async function getToolsOnce() {
  if (toolsCache) return toolsCache;

  try {
    const client = await experimental_createMCPClient({
      transport: {
        type: 'sse',
        url: `${BP_MANAGER_URL}/mcp`,
      },
    });
    const tools = await client.tools();
    toolsCache = tools;
    return tools;
  } catch (error) {
    console.error('Failed to fetch tools from MCP, proceeding without them:', error);
    return {};
  }
}

export async function POST(req: Request) {
  const isMock = process.env.MOCK_MODE === 'true';
  const { messages, projectId, projectName } = await req.json();
  const originalTools = await getToolsOnce() ?? {};
  const tools = projectName ? wrapToolsWithProjectName(originalTools, projectName) : originalTools;

  if (isMock) {
    const result = await streamText({
      toolCallStreaming: true,
      tools: {
        getWeatherInformation: {
          description: 'show the weather in a given city to the user',
          parameters: z.object({ city: z.string().optional() }),
          execute: async ({}: { city: string }) => {
            const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
            return weatherOptions[
              Math.floor(Math.random() * weatherOptions.length)
            ];
          },
        }
      },
      model: new MockLanguageModelV1({
        doStream: async () => ({
          stream: simulateReadableStream({
            initialDelayInMs: 500,
            chunkDelayInMs: 1400,
            chunks: [
                { type: 'reasoning', textDelta: 'Let me break down the logic for you...' },
                { type: 'reasoning', textDelta: 'That\'s it. I\'m done.' },
                { type: 'tool-call-delta', toolCallType: 'function', toolCallId:"call-456",toolName:"getWeatherInformation",argsTextDelta:"Hello"},
                { type: 'tool-call', toolCallType: 'function', toolCallId:"call-456",toolName:"getWeatherInformation",args:"{}"},
                { type: 'text-delta', textDelta: 'Hello \n' },
                { type: 'text-delta', textDelta: '```markdown **second** ' },
                { type: 'text-delta', textDelta: 'third `label` ```' },
                { type: 'text-delta', textDelta: '```javascript\nconsole.log("Hello, world!");\n```' },
                { type: 'text-delta', textDelta: `world!` },
                { type: 'text-delta', textDelta: '```mermaid\ngraph TD\nA --> B\n```' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    logprobs: undefined,
                    usage: { completionTokens: 10, promptTokens: 3 },
                },
            ],
          }),
          rawCall: { rawPrompt: null, rawSettings: {} },
        }),
      }),
      prompt: 'Hello, test!',
    });
    return result.toDataStreamResponse();
  }

  try {
    const maxSteps = 5;
    const result = await streamText({
      model: anthropic('claude-3-7-sonnet-20250219'),
      maxSteps: maxSteps*2,
      temperature: 0.05,
      messages,
      tools,
      system: `
        You are a helpful assistant for data warehouse exploration and data lineage tracing.
        Your goal is to help users understand data structures, trace data lineage, and explore dependencies.

        ## Context Retrieval Navigation Guidelines:
        At your disposal you have additional tools which you can find their descriptions below.
        You may have access to tools that can help answer the user's query more effectively. If tools are available, they will be listed after these instructions. Always consider using the most appropriate tool when answering user queries.

        When using a tool:
        1. Analyze which tool would be most helpful for this query
        2. Determine the correct parameters to pass
        3. Format the tool call correctly in a JSON code block
        4. Make sure you gathered sufficient context before moving to the answer generation stage

        For certain queries, you may need to use multiple tools or make multiple calls to the same tool with different parameters. Always focus on providing the most comprehensive and useful response.

        ## Answer Generation Guidelines

        ### Core Principles
        1. **Thorough Analysis**: Read and comprehend the entire context before formulating a response
        2. **Direct Response**: Lead with a clear, direct answer followed by supporting evidence from the context
        3. **Accuracy Over Speculation**: Base answers solely on available information; explicitly identify gaps rather than filling them with assumptions

        ### Response Structure
        4. **Identify Completeness**: Clearly distinguish between:
          - What the context explicitly states
          - What can be reasonably inferred
          - What information is missing or unclear

        5. **Address Complexity**:
          - Acknowledge contradictions, exceptions, and conditional logic
          - Consider edge cases and alternative scenarios
          - Note any nuances that affect the answer

        ### Transparency Requirements
        6. **Context Limitations**: When information is incomplete:
          - State what specific information is available
          - Identify what key information is missing
          - Explain how the missing information limits the response
          - Avoid speculation or assumptions to fill gaps

        ### Enhanced Analysis
        7. **Visual Representations**: When applicable, provide:
          - Data lineage diagrams
          - Structure visualizations
          - Process flows or relationships
          - If you think a diagram will help, or have information about lineage, or are asked about which sources feed a table, or the impact of a change downstream or any other information which is a graph-like structure, add a diagram using the \`\`\`mermaid\`\`\` format.
                When responding, always wrap content in format markers:
                - For regular content: \`\`\`markdown ... \`\`\`
                - For diagrams: \`\`\`mermaid ... \`\`\`  
                - For code: \`\`\`javascript ... \`\`\`
                - For data: \`\`\`json ... \`\`\`

        8. **Precision Standards**:
          - Use specific references to the context
          - Provide complete analysis within the scope of available information
          - Maintain technical accuracy

        ### Quality Checks
        9. **Self-Review**: Before finalizing the response:
          - Verify all claims against the context
          - Ensure completeness within available information
          - Confirm that limitations have been clearly stated

        10. Do not use more than ${maxSteps} tool calls. If you have used all available tool calls, clearly explain to the user that you are showing intermediate results and ask the user if they would like you to continue searching for more information.

        `,
      providerOptions: {
          anthropic: {
            thinking: { type: 'enabled', budgetTokens: 12000 },
          } satisfies AnthropicProviderOptions,
      },
    });
    return result.toDataStreamResponse({
        sendReasoning: true});
  } catch (error) {
    console.error('Error calling Anthropic:', error);
    return new Response(JSON.stringify({ error: 'Error processing your request with Anthropic.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}