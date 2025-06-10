import { anthropic } from "@/lib/anthropic";

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start processing in the background
  (async () => {
    try {
      const { question } = await request.json();

      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1000,
        stream: true,
        messages: [
          {
            role: "user",
            content: `You are a helpful AI assistant. When responding to the user's question, first explain your reasoning process step by step, then provide your final answer.

Question: ${question}

Instructions:
- Start with "Let me think about this..." and explain your reasoning
- Break down your thought process into clear steps
- After explaining your reasoning, provide your final answer
- Be helpful, accurate, and concise`
          }
        ]
      });

      let currentReasoning = "";
      let isReasoning = true;

      for await (const chunk of response) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          console.log('Received chunk:', text); // Debug log
          
          // Check if we're transitioning from reasoning to answer
          if (isReasoning && (text.includes("Now, let me provide my answer") || text.includes("Here's my answer"))) {
            isReasoning = false;
            // Send the final reasoning step
            const reasoningData = `data: ${JSON.stringify({ type: "reasoning", content: currentReasoning })}\n\n`;
            console.log('Sending reasoning:', reasoningData); // Debug log
            await writer.write(encoder.encode(reasoningData));
            currentReasoning = "";
          }

          if (isReasoning) {
            currentReasoning += text;
            // Send reasoning updates
            const reasoningData = `data: ${JSON.stringify({ type: "reasoning", content: currentReasoning })}\n\n`;
            console.log('Sending reasoning:', reasoningData); // Debug log
            await writer.write(encoder.encode(reasoningData));
          } else {
            // Send content updates
            const contentData = `data: ${JSON.stringify({ type: "content", content: text })}\n\n`;
            console.log('Sending content:', contentData); // Debug log
            await writer.write(encoder.encode(contentData));
          }
        }
      }

      // Send final reasoning if there's any left
      if (currentReasoning) {
        const finalReasoningData = `data: ${JSON.stringify({ type: "reasoning", content: currentReasoning })}\n\n`;
        console.log('Sending final reasoning:', finalReasoningData); // Debug log
        await writer.write(encoder.encode(finalReasoningData));
      }

      // Send completion message
      console.log('Sending completion'); // Debug log
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (error) {
      console.error("Error in analysis:", error);
      const errorData = `data: ${JSON.stringify({ type: "error", content: "An error occurred" })}\n\n`;
      console.log('Sending error:', errorData); // Debug log
      await writer.write(encoder.encode(errorData));
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
} 