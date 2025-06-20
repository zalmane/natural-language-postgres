import { streamText, tool, simulateReadableStream, experimental_createMCPClient, Output } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';
import { anthropic, AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { z } from 'zod';

let toolsCache: Record<string, any> | null = null;

async function getToolsOnce() {
  if (toolsCache) return toolsCache;

  try {
    const client = await experimental_createMCPClient({
      transport: {
        type: 'sse',
        url: 'http://localhost:8000/mcp',
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
  const tools = await getToolsOnce() ?? {};

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
            chunkDelayInMs: 400,
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

  const { messages } = await req.json();

  try {
    const maxSteps = 3;
    const result = await streamText({
      model: anthropic('claude-3-7-sonnet-20250219'),
      maxSteps: maxSteps*2,
      messages,
      tools,
      system: `
        You are a helpful assistant. 
        You are given a task to help the user with their question. 
        You can use the tools provided to you to help the user. 
        Do not use more than ${maxSteps} tool calls. 
        If you have gathered all the information you need, provide a final response. 
        If you have used all available tool calls, clearly explain to the user that you are showing intermediate results and ask the user if they would like you to continue searching for more information.
        If you think a diagram will help, or have information about lineage, or are asked about which sources feed a table, or the impact of a change downstream or any other information which is a graph-like structure, add a diagram using the \`\`\`mermaid\`\`\` format.
        When responding, always wrap content in format markers:
        - For regular content: \`\`\`markdown ... \`\`\`
        - For diagrams: \`\`\`mermaid ... \`\`\`  
        - For code: \`\`\`javascript ... \`\`\`
        - For data: \`\`\`json ... \`\`\`.`,
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