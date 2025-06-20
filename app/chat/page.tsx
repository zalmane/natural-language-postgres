"use client";

import { useChat } from "ai/react";
import { Message } from "ai";
import { useState, useEffect, useRef, useMemo } from "react";
import { MessageGroup } from "./components/MessageGroup";
import { ChatInput } from "./components/ChatInput";
import { useSearchParams, usePathname } from "next/navigation";
import { Sidebar } from "../components/Sidebar";

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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [expandedReasonings, setExpandedReasonings] = useState<Set<string>>(new Set());
  const [expandedToolInvocations, setExpandedToolInvocations] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    api: "/api/chat",
    initialMessages: []
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

  const toggleToolInvocation = (toolCallId: string) => {
    setExpandedToolInvocations(prev => {
      const next = new Set(prev);
      if (next.has(toolCallId)) {
        next.delete(toolCallId);
      } else {
        next.add(toolCallId);
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
    const container = scrollContainerRef.current;
    if (container) {
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 150; // 150px threshold
      const lastMessage = messages[messages.length - 1];

      // Only auto-scroll if the user is near the bottom or they just sent a message.
      if (isScrolledToBottom || (lastMessage && lastMessage.role === 'user')) {
        if (lastUserMessageRef.current) {
          lastUserMessageRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }
    }
  }, [messages]);

  const messageGroups = splitMessagesByUser(messages);

  useEffect(() => {
    // Get message from localStorage
    const message = localStorage.getItem('initial_message');
    if (message) {
      append({
        role: 'user',
        content: message,
      });
      // Clear the message
      localStorage.removeItem('initial_message');
    }
  }, []); // Run once on mount

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        {/* Messages */}
        <div className="flex-1 flex flex-col overflow-y-auto" ref={scrollContainerRef}>
          <div className="flex flex-col flex-1 w-full max-w-[min(1200px,90vw)] mx-auto px-5 lg:max-w-[1000px] 2xl:max-w-[1200px]">
            <div className="flex flex-col flex-1 space-y-4 py-4">
              {messageGroups.map((group, groupIdx) => (
                <MessageGroup
                  key={groupIdx}
                  group={group}
                  groupIdx={groupIdx}
                  totalGroups={messageGroups.length}
                  isLoading={isLoading}
                  isLastGroup={groupIdx === messageGroups.length - 1}
                  feedback={feedback}
                  copiedMessageId={copiedMessageId}
                  clickedButton={clickedButton}
                  handleFeedback={handleFeedback}
                  handleCopy={handleCopy}
                  handleButtonClick={handleButtonClick}
                  toggleReasoning={toggleReasoning}
                  expandedReasonings={expandedReasonings}
                  expandedToolInvocations={expandedToolInvocations}
                  toggleToolInvocation={toggleToolInvocation}
                  lastMessageRef={lastUserMessageRef}
                  scrollContainerHeight={scrollContainerRef.current?.clientHeight}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Input */}
        <div className="border-t">
          <div className="w-full max-w-[min(1200px,90vw)] mx-auto px-5 lg:max-w-[1000px] 2xl:max-w-[1200px]">
            <ChatInput
              input={input}
              isLoading={isLoading}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 