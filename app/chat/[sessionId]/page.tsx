"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getRecentChats } from '@/app/lib/chat-storage';

export default function ChatSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  useEffect(() => {
    // Check if the session exists
    const chats = getRecentChats();
    const session = chats.find(chat => chat.id === sessionId);
    
    if (session) {
      // Redirect to main chat page with session ID
      router.replace(`/chat?session=${sessionId}`);
    } else {
      // Session doesn't exist, redirect to new chat
      router.replace('/chat');
    }
  }, [sessionId, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading chat session...</p>
      </div>
    </div>
  );
} 