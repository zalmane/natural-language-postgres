import { streamText, simulateReadableStream } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';
import { anthropic, AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { simulateStreamingMiddleware, wrapLanguageModel } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const isMock = process.env.MOCK_MODE === 'true';
  let result;
  if (isMock) {
    result = streamText({
      toolCallStreaming: true,
      tools: {
        // server-side tool with execute function:
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
            initialDelayInMs: 500, // Delay before the first chunk
            chunkDelayInMs: 400, // Delay between chunks
                chunks: [
                { type: 'reasoning', textDelta: 'Let me break down the logic for you...' },
                { type: 'reasoning', textDelta: 'That\'s it. I\'m done.' },
                { type: 'tool-call-delta',toolCallId:"call-456",toolName:"getWeatherInformation",argsTextDelta:"Hello"},
                { type: 'tool-call',toolCallId:"call-456",toolName:"getWeatherInformation",args:"{}"},
                    { type: 'text-delta', textDelta: 'Hello ' },
                    { type: 'text-delta', textDelta: 'second' },
                    { type: 'text-delta', textDelta: 'third' },
                    { type: 'text-delta', textDelta: ', ' },
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
      onStepFinish: (step) => {
        console.log('Step finished:', step);
      },
    }); 
     } else {
        const { messages } = await req.json();

        result = streamText({
          model: anthropic('claude-3-7-sonnet-20250219'),
          tools: {
            // server-side tool with execute function:
            getWeatherInformation: {
              description: 'show the weather in a given city to the user',
              parameters: z.object({ city: z.string() }),
              execute: async ({}: { city: string }) => {
                const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
                console.log('Executing tool call:');
                return weatherOptions[
                  Math.floor(Math.random() * weatherOptions.length)
                ];
              },
            }
          },
          onStepFinish: (step) => {
            console.log('Step finished:', step);
          },
              messages,
          providerOptions: {
            anthropic: {
              thinking: { type: 'enabled', budgetTokens: 12000 },
            } satisfies AnthropicProviderOptions,
          },
        });
      
    }

    // let chunks = [
    //   `0:"The user is asking"\n`,
    //   `0:" about the weather in Berlin. I can use the \""\n`,
    //   // `g:"getWeatherInformation\" function to show them the current weather in"\n`,
    //   // `g:" Berlin.\n\nLet me check the required parameters for"\n`,
    //   // `g:" this function:\n- city: This is required and should be"\n`,
    //   // `g:" set to \"Berlin\"\n\nI have all the necessary information"\n`,
    //   // `g:" to make this function call."\n`,
    //   // `j:{"signature":"ErUBCkYIBBgCIkA7seStdOsRkDHNah0m6lOTEH1PLkHtWbgEC/M/66BYQw74bmNNiSPIgo8rQMx50Zv847f/ISTHezvSoNCg97jzEgzSbn8Yi+fwnOUeDfEaDKzA8yKMxC7S8I46+iIw+oVHuhmH2tYyLhoPeVfbZiP6zle9t05NkUJQlYEWEV0dEkIim8QzzgHtmJ9NnrMGKh02SIHidtP93ccQMUcxbaaQLa2XRAz1LVD7X6vQXxgC"}\n`,
    //   `0:"I'll check the current weather in Berlin for you."\n`,
    //   `9:{"toolCallId":"toolu_01NYmuRmF9sRqhqbRVD2mkrB","toolName":"getWeatherInformation","args":{"city":"Berlin"}}\n`,
    //   `a:{"toolCallId":"toolu_01NYmuRmF9sRqhqbRVD2mkrB","result":"rainy"}\n`,
    //   `e:{"finishReason":"tool-calls","usage":{"promptTokens":490,"completionTokens":146},"isContinued":false}\n`,
    //   `d:{"finishReason":"tool-calls","usage":{"promptTokens":490,"completionTokens":146}}      \n`,
    // ]
    // return new Response(
    //   simulateReadableStream({
    //     initialDelayInMs: 1000, // Delay before the first chunk
    //     chunkDelayInMs: 300, // Delay between chunks
    //     chunks: chunks,
    //   }).pipeThrough(new TextEncoderStream()),
    //   {
    //     status: 200,
    //     headers: {
    //       'X-Vercel-AI-Data-Stream': 'v1',
    //       'Content-Type': 'text/plain; charset=utf-8',
    //     },
    //   },
    // );
  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}