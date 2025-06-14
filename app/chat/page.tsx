"use client";

import { useChat } from "ai/react";
import { Message } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { UserMessage, AssistantMessage, ReasoningMessage, ToolInvocationMessage } from "./messages";

function splitMessagesByUser(messages: Message[]) {
  const groups: Message[][] = [];
  let current: Message[] = [];
  messages.forEach((msg) => {
    if (msg.role === "user" && current.length > 0) {
      groups.push(current);
      current = [];
    }
    current.push(msg);
  });
  if (current.length > 0) groups.push(current);
  return groups;
}

export default function ChatPage() {
  const [expandedReasonings, setExpandedReasonings] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    onResponse: (response) => {
      console.log('Stream started');
      console.log(response);
    },
    onToolCall: ({ toolCall }) => {
      console.log('Tool call chunk:', toolCall);
    },
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const containerVhRef = useRef(null);

  const toggleReasoning = (messageId: string) => {
    setExpandedReasonings(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handleFeedback = async (messageId: string, type: 'up' | 'down') => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, type }),
      });

      if (response.ok) {
        setFeedback(prev => ({
          ...prev,
          [messageId]: prev[messageId] === type ? null : type
        }));
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  useEffect(() => {
    if (lastUserMessageRef.current) {
      lastUserMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages]);

  const messageGroups = splitMessagesByUser(messages);

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-y-auto" ref={scrollContainerRef}>
        <div className="flex flex-col flex-1 w-full max-w-[min(1200px,90vw)] mx-auto px-5 lg:max-w-[1000px] 2xl:max-w-[1200px]">
          <div className="flex flex-col flex-1 space-y-4 py-4">
            {messageGroups.map((group, groupIdx) => (
              <div className="flex w-full gap-4 flex-col"
                key={groupIdx}
                ref={
                  groupIdx === messageGroups.length - 1
                    ? lastUserMessageRef
                    : undefined
                }
                style={groupIdx === messageGroups.length - 1 ? { minHeight: scrollContainerRef.current?.clientHeight } : undefined}
                >
                {group.map((message, idx) => (
                  <div
                    key={message.id}
                    className="flex w-full gap-4"
                  >
                    <div className="flex flex-col gap-4 flex-1">
                      {message.parts?.map((part: any, index: number) => {
                        switch (part.type) {
                          case "text":
                            return message.role === "user"
                              ? <UserMessage key={index} text={part.text ?? ""} />
                              : <AssistantMessage key={index} text={part.text ?? ""} />;
                          case "reasoning": {
                            const isComplete = Boolean(message.parts && message.parts.length > index + 1);
                            const isExpanded = expandedReasonings.has(message.id);
                            // details may contain redacted, so filter for text
                            const summary = Array.isArray(part.details) && part.details.length > 0 && 'text' in part.details[0]
                              ? (part.details[0] as any).text?.split('.')[0] || 'Thinking...'
                              : 'Thinking...';
                            return (
                              <ReasoningMessage
                                key={index}
                                isComplete={isComplete}
                                isExpanded={isExpanded}
                                summary={summary}
                                details={Array.isArray(part.details) ? part.details.filter((d: any) => d.type === 'text') : []}
                                onToggle={() => toggleReasoning(message.id)}
                              />
                            );
                          }
                          case "tool-invocation":
                            return <ToolInvocationMessage key={index} toolInvocation={(part as any).toolInvocation} />;
                          default:
                            return null;
                        }
                      }) || (
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Input */}
      <div className="border-t">
        <div className="w-full max-w-[min(1200px,90vw)] mx-auto px-5 lg:max-w-[1000px] 2xl:max-w-[1200px]">
          <form onSubmit={handleSubmit} className="flex gap-2 py-4">
            <Input
              value={input}
              onChange={handleInputChange}
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
    </div>
  );
} 