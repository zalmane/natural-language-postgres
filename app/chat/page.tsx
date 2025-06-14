"use client";

import { useChat } from "ai/react";
import { Message } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { UserMessage, AssistantMessage, ReasoningMessage, ToolInvocationMessage } from "./messages";
import { FishLogo } from "./FishLogo";

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
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [clickedButton, setClickedButton] = useState<string | null>(null);

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

  const handleCopy = (messageId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleButtonClick = (buttonId: string, callback: () => void) => {
    setClickedButton(buttonId);
    callback();
    setTimeout(() => setClickedButton(null), 200);
  };

  useEffect(() => {
    if (lastUserMessageRef.current) {
      lastUserMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages]);

  const messageGroups = splitMessagesByUser(messages);
  const fishLogo = useMemo(() => <FishLogo animated={isLoading} />, [isLoading]);

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-y-auto" ref={scrollContainerRef}>
        <div className="flex flex-col flex-1 w-full max-w-[min(1200px,90vw)] mx-auto px-5 lg:max-w-[1000px] 2xl:max-w-[1200px]">
          <div className="flex flex-col flex-1 space-y-4 py-4">
            {messageGroups.map((group, groupIdx) => (
              <div className="flex w-full pt-3 gap-4 flex-col"
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
                              : <AssistantMessage key={index} text={part.text ?? ""} isLoading={isLoading} />;
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
                {groupIdx === messageGroups.length - 1 ? (
                  <div className="flex items-center justify-between gap-2">
                    {fishLogo}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 transition-colors ${copiedMessageId === group[0].id ? 'text-blue-500' : ''}`}
                        onClick={() => {
                          const lastMessage = group[0];
                          const textPart = lastMessage.parts?.find((p: any) => p.type === 'text');
                          const text = textPart ? (textPart as any).text : lastMessage.content;
                          handleButtonClick('copy', () => handleCopy(lastMessage.id, text));
                        }}
                      >
                        <Copy className={`h-4 w-4 transition-transform ${clickedButton === 'copy' ? 'scale-110' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 transition-colors ${feedback[group[0].id] === 'up' ? 'text-green-500' : ''}`}
                        onClick={() => handleButtonClick('up', () => handleFeedback(group[0].id, 'up'))}
                      >
                        <ThumbsUp className={`h-4 w-4 transition-transform ${clickedButton === 'up' ? 'scale-110' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 transition-colors ${feedback[group[0].id] === 'down' ? 'text-red-500' : ''}`}
                        onClick={() => handleButtonClick('down', () => handleFeedback(group[0].id, 'down'))}
                      >
                        <ThumbsDown className={`h-4 w-4 transition-transform ${clickedButton === 'down' ? 'scale-110' : ''}`} />
                      </Button>
                    </div>
                  </div>
                ) : null}
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