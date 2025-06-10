"use client";

import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, Send, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { Message } from "ai";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type MessagePart = {
  type: 'text' | 'reasoning';
  text?: string;
  details?: Array<{
    type: 'text';
    text: string;
  }>;
};

interface ExtendedMessage extends Message {
  finish_reason?: string;
  parts?: MessagePart[];
  isComplete?: boolean;
}

export default function ChatPage() {
  const [expandedReasonings, setExpandedReasonings] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    onFinish: (message: ExtendedMessage) => {
      // Mark the message as complete when the stream finishes
      message.isComplete = true;
    },
  });

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

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[min(1200px,90vw)] mx-auto px-5 lg:max-w-[1000px] 2xl:max-w-[1200px]">
          <div className="space-y-4 py-4">
            {messages.map((message: ExtendedMessage) => (
              <div
                key={message.id}
                className="flex w-full gap-4"
              >
                <div className="flex flex-col gap-4 flex-1">
                  {message.parts?.map((part: MessagePart, index: number) => {
                    if (part.type === 'text') {
                      return message.role === "user" ? (
                        <Card
                          key={index}
                          className="bg-[#2563eb] border border-[#2563eb] text-white max-w-[600px]"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0 bg-muted">
                                <AvatarFallback className="text-foreground">OE</AvatarFallback>
                              </Avatar>
                              <div className="whitespace-pre-wrap">{part.text}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div key={index} className="flex flex-col gap-2">
                          <div className="whitespace-pre-wrap">{part.text}</div>
                          {message === messages[messages.length - 1] && message.role === "assistant" && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  feedback[message.id] === 'up' && "text-green-500"
                                )}
                                onClick={() => handleFeedback(message.id, 'up')}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  feedback[message.id] === 'down' && "text-red-500"
                                )}
                                onClick={() => handleFeedback(message.id, 'down')}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    }
                    if (part.type === 'reasoning') {
                      const isComplete = message.parts && message.parts.length > index + 1;
                      const isExpanded = expandedReasonings.has(message.id);
                      const summary = part.details?.[0]?.text?.split('.')[0] || 'Thinking...';

                      if (!isComplete) {
                        return (
                          <Card
                            key={index}
                            className="bg-[#f3f4f6] border border-[#d1d5db]"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <span>Thinking...</span>
                              </div>
                              <pre className="text-sm whitespace-pre-wrap">
                                {part.details?.map((detail, detailIndex) =>
                                  detail.type === 'text' ? detail.text : '<redacted>',
                                )}
                              </pre>
                            </CardContent>
                          </Card>
                        );
                      }

                      return (
                        <Card
                          key={index}
                          className="bg-[#f3f4f6] border border-[#d1d5db] cursor-pointer"
                          onClick={() => toggleReasoning(message.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Thinking: {summary}</span>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                            {isExpanded && (
                              <div className="mt-2">
                                <pre className="text-sm whitespace-pre-wrap">
                                  {part.details?.map((detail, detailIndex) =>
                                    detail.type === 'text' ? detail.text : '<redacted>',
                                  )}
                                </pre>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    }
                    return null;
                  }) || (
                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>
                  )}
                </div>
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