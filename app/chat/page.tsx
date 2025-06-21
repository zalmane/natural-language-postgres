"use client";

import { useChat } from "ai/react";
import { Message } from "ai";
import { useState, useEffect, useRef } from "react";
import { MessageGroup } from "./components/MessageGroup";
import { ChatInput } from "./components/ChatInput";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { FeedbackModal } from "./components/FeedbackModal";
import {
  createChatSession,
  saveChatSession,
  updateChatSession,
  generateChatTitle,
  saveChatMessages,
  loadChatMessages,
  getRecentChats,
  type ChatSession
} from "@/app/lib/chat-storage";

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
  const router = useRouter();
  const [expandedReasonings, setExpandedReasonings] = useState<Set<string>>(new Set());
  const [expandedToolInvocations, setExpandedToolInvocations] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessionKey, setSessionKey] = useState<string>('default');
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    messageId: string;
    type: 'up' | 'down';
  }>({
    isOpen: false,
    messageId: '',
    type: 'up'
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const initialMessageSentRef = useRef<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    api: "/api/chat",
    initialMessages: [],
    id: sessionKey
  });

  // Initialize chat session
  useEffect(() => {
    const sessionId = searchParams.get('session');
    
    if (sessionId) {
      // Load existing session
      const chats = getRecentChats();
      const existingSession = chats.find(chat => chat.id === sessionId);
      
      if (existingSession) {
        setCurrentSession(existingSession);
        setSessionKey(sessionId);
      } else {
        // Session doesn't exist, redirect to new chat
        router.replace('/chat');
        return;
      }
    } else {
      // Check for initial message from homepage
      const hasInitialMessage = localStorage.getItem('initial_message');
      
      if (hasInitialMessage) {
        // Move the message to sessionStorage before creating session and navigating
        sessionStorage.setItem('pending_initial_message', hasInitialMessage);
        localStorage.removeItem('initial_message');
        const session = createChatSession('New Chat');
        setCurrentSession(session);
        saveChatSession(session);
        setSessionKey(session.id);
        router.replace(`/chat?session=${session.id}`);
      } else {
        // No initial message, use most recent session or create new one
        const chats = getRecentChats();
        if (chats.length > 0) {
          const existingSession = chats[0];
          setCurrentSession(existingSession);
          setSessionKey(existingSession.id);
          router.replace(`/chat?session=${existingSession.id}`);
        } else {
          // Create new session
          const session = createChatSession('New Chat');
          setCurrentSession(session);
          saveChatSession(session);
          setSessionKey(session.id);
          router.replace(`/chat?session=${session.id}`);
        }
      }
    }
  }, [searchParams, router]);

  // Load messages when session key changes
  useEffect(() => {
    if (sessionKey && sessionKey !== 'default') {
      const savedMessages = loadChatMessages(sessionKey);
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        setMessages([]);
      }
    }
  }, [sessionKey, setMessages]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      // Defer saving to ensure all messages (including assistant) are present
      const timer = setTimeout(() => {
        saveChatMessages(currentSession.id, messages);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, currentSession]);

  // Update chat session metadata when messages change
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      // Prefer the latest assistant message for preview, fallback to user message
      const lastAssistantMessage = [...messages].reverse().find(msg => msg.role === 'assistant' && msg.content && msg.content.trim().length > 0);
      const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user' && msg.content && msg.content.trim().length > 0);
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      
      const updates: Partial<ChatSession> = {
        messageCount: messages.length,
        lastMessage: (lastAssistantMessage?.content || lastUserMessage?.content || '').substring(0, 100),
        timestamp: Date.now(),
      };

      // Update title from first user message if not set
      if (firstUserMessage && currentSession.title === 'New Chat') {
        updates.title = generateChatTitle(firstUserMessage.content);
      }

      updateChatSession(currentSession.id, updates);
    }
  }, [messages, currentSession?.id]);

  // Send initial message from homepage
  useEffect(() => {
    if (!sessionKey || sessionKey === 'default') return;
    if (initialMessageSentRef.current === sessionKey) return;
    
    // Check for pending initial message in sessionStorage
    const pendingMessage = sessionStorage.getItem('pending_initial_message');
    if (pendingMessage) {
      append({ role: 'user', content: pendingMessage });
      sessionStorage.removeItem('pending_initial_message');
      initialMessageSentRef.current = sessionKey;
      return;
    }
    // Fallback: check localStorage (should not be needed, but for safety)
    const message = localStorage.getItem('initial_message');
    if (message) {
      append({ role: 'user', content: message });
      localStorage.removeItem('initial_message');
      initialMessageSentRef.current = sessionKey;
    }
  }, [sessionKey, append]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 150;
      const lastMessage = messages[messages.length - 1];

      if (isScrolledToBottom || (lastMessage && lastMessage.role === 'user')) {
        if (lastUserMessageRef.current) {
          lastUserMessageRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }
    }
  }, [messages]);

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
    setFeedbackModal({
      isOpen: true,
      messageId,
      type
    });
  };

  const handleFeedbackSubmit = async (reason: string) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messageId: feedbackModal.messageId, 
          type: feedbackModal.type,
          reason 
        }),
      });

      if (response.ok) {
        setFeedback(prev => ({
          ...prev,
          [feedbackModal.messageId]: feedbackModal.type
        }));
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
    } finally {
      setFeedbackModal({ isOpen: false, messageId: '', type: 'up' });
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

  const messageGroups = splitMessagesByUser(messages);

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
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, messageId: '', type: 'up' })}
        onSubmit={handleFeedbackSubmit}
        feedbackType={feedbackModal.type}
      />
    </div>
  );
} 