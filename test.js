import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const { text, reasoning, reasoningDetails } = await generateText({
  model: anthropic('claude-4-opus-20250514'),
  apiKey: process.env.ANTHROPIC_API_KEY,
  prompt: 'How many people will live in the world in 2040?',
  providerOptions: {
    anthropic: {
      thinking: { type: 'enabled', budgetTokens: 12000 },
    },
  },
});

console.log("Reasoning:")
console.log(reasoning); // reasoning text
console.log("Reasoning Details:")
console.log(reasoningDetails); // reasoning details including redacted reasoning
console.log("Text:")
console.log(text); // text response