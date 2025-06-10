"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning?: string[];
}

export default function AnalysisPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentReasoning, setCurrentReasoning] = useState<string[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setCurrentReasoning([]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userMessage }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let assistantMessage = "";
      const reasoning: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        console.log('Received chunk:', chunk); // Debug log
        
        const lines = chunk.split("\n").filter(line => line.trim());
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              console.log('Parsed data:', parsed); // Debug log
              
              if (parsed.type === "reasoning") {
                reasoning.push(parsed.content);
                setCurrentReasoning(prev => [...prev, parsed.content]);
              } else if (parsed.type === "content") {
                assistantMessage += parsed.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage?.role === "assistant") {
                    lastMessage.content = assistantMessage;
                    return [...newMessages];
                  } else {
                    return [...newMessages, {
                      role: "assistant",
                      content: assistantMessage,
                      reasoning: [...reasoning]
                    }];
                  }
                });
              }
            } catch (e) {
              console.error("Error parsing chunk:", e, data);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          reasoning: currentReasoning
        }
      ]);
    } finally {
      setIsLoading(false);
      setCurrentReasoning([]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex w-full",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <Card
              className={cn(
                "max-w-[80%]",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <CardContent className="p-4">
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.reasoning && message.reasoning.length > 0 && (
                  <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                    <div className="font-semibold mb-1">Reasoning:</div>
                    {message.reasoning.map((step, i) => (
                      <div key={i} className="mb-1">• {step}</div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
                {currentReasoning.length > 0 && (
                  <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                    <div className="font-semibold mb-1">Reasoning:</div>
                    {currentReasoning.map((step, i) => (
                      <div key={i} className="mb-1">• {step}</div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 