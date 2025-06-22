export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
  lastMessage: string;
  preview?: string;
}

const RECENT_CHATS_KEY = 'recent_chats';
const CHAT_MESSAGES_KEY = 'chat_messages_';
const MAX_RECENT_CHATS = 20;

function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('chatStorageChanged'));
  }
}

export function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getRecentChats(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(RECENT_CHATS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading recent chats:', error);
    return [];
  }
}

export function saveChatSession(session: ChatSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('Saving chat session:', session);
    const chats = getRecentChats();
    
    // Remove existing session if it exists
    const filteredChats = chats.filter(chat => chat.id !== session.id);
    
    // Add new session at the beginning
    const updatedChats = [session, ...filteredChats].slice(0, MAX_RECENT_CHATS);
    
    console.log('Updated chats list:', updatedChats);
    localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(updatedChats));
    notifyStorageChange();
  } catch (error) {
    console.error('Error saving chat session:', error);
  }
}

export function saveChatMessages(sessionId: string, messages: any[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('Saving chat messages for session:', sessionId, messages.length, 'messages');
    localStorage.setItem(`${CHAT_MESSAGES_KEY}${sessionId}`, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat messages:', error);
  }
}

export function loadChatMessages(sessionId: string): any[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(`${CHAT_MESSAGES_KEY}${sessionId}`);
    const messages = stored ? JSON.parse(stored) : [];
    console.log('Loaded chat messages for session:', sessionId, messages.length, 'messages');
    return messages;
  } catch (error) {
    console.error('Error loading chat messages:', error);
    return [];
  }
}

export function deleteChatSession(sessionId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const chats = getRecentChats();
    const updatedChats = chats.filter(chat => chat.id !== sessionId);
    localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(updatedChats));
    
    // Also delete the messages for this session
    localStorage.removeItem(`${CHAT_MESSAGES_KEY}${sessionId}`);
    
    notifyStorageChange();
  } catch (error) {
    console.error('Error deleting chat session:', error);
  }
}

export function clearAllChats(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Get all chat sessions to delete their messages
    const chats = getRecentChats();
    chats.forEach(chat => {
      localStorage.removeItem(`${CHAT_MESSAGES_KEY}${chat.id}`);
    });
    
    localStorage.removeItem(RECENT_CHATS_KEY);
    notifyStorageChange();
  } catch (error) {
    console.error('Error clearing all chats:', error);
  }
}

export function createChatSession(title: string = 'New Chat', id?: string): ChatSession {
  return {
    id: id || generateSessionId(),
    title,
    timestamp: Date.now(),
    messageCount: 0,
    lastMessage: '',
  };
}

export function updateChatSession(
  sessionId: string, 
  updates: Partial<ChatSession>
): void {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('Updating chat session:', sessionId, updates);
    const chats = getRecentChats();
    const chatIndex = chats.findIndex(chat => chat.id === sessionId);
    
    if (chatIndex !== -1) {
      chats[chatIndex] = { ...chats[chatIndex], ...updates };
      localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(chats));
      notifyStorageChange();
    }
  } catch (error) {
    console.error('Error updating chat session:', error);
  }
}

export function generateChatTitle(firstMessage: string): string {
  // Use first message as title, truncated to 50 characters
  const title = firstMessage.trim();
  if (title.length <= 50) return title;
  return title.substring(0, 47) + '...';
} 