'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, Search, Wrench, Construction, ChevronRight, Plus, ChevronsUpDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { 
  getRecentChats, 
  clearAllChats, 
  type ChatSession 
} from '@/app/lib/chat-storage';

interface Project {
  id: string;
  name: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [chatHistory, setChatHistory] = React.useState<ChatSession[]>([]);

  const refreshChatHistory = React.useCallback(() => {
    const chats = getRecentChats();
    setChatHistory(chats);
  }, []);

  React.useEffect(() => {
    // Load chat history from localStorage
    refreshChatHistory();

    // Listen for storage changes (when other tabs/windows update localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'recent_chats') {
        console.log('Storage event detected, refreshing chat history');
        refreshChatHistory();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      console.log('Custom storage event detected, refreshing chat history');
      refreshChatHistory();
    };

    window.addEventListener('chatStorageChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chatStorageChanged', handleCustomStorageChange);
    };
  }, [refreshChatHistory]);

  React.useEffect(() => {
    async function fetchProjects() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        const fetchedProjects = data.projects || [];
        setProjects(fetchedProjects);
        if (fetchedProjects.length > 0) {
          setSelectedProject(fetchedProjects[0]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleClearAllChats = () => {
    if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      clearAllChats();
      setChatHistory([]);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="w-64 h-screen flex flex-col bg-white border-r">
      {/* Logo */}
      <div className="p-4 border-b">
        <Image
          src="/riverpool_logo.svg"
          alt="RiverPool"
          width={120}
          height={32}
          className="dark:invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        <Link
          href="/"
          className={cn(
            "flex items-center px-3 py-2 text-sm rounded-lg",
            pathname === "/" ? "bg-gray-100" : "hover:bg-gray-50"
          )}
        >
          <Home className="w-4 h-4 mr-3" />
          Home
        </Link>
        <Link
          href="/explore"
          className={cn(
            "flex items-center px-3 py-2 text-sm rounded-lg",
            pathname === "/explore" ? "bg-gray-100" : "hover:bg-gray-50"
          )}
        >
          <Search className="w-4 h-4 mr-3" />
          Explore
        </Link>
        <Link
          href="/resolve"
          className={cn(
            "flex items-center px-3 py-2 text-sm rounded-lg",
            pathname === "/resolve" ? "bg-gray-100" : "hover:bg-gray-50"
          )}
        >
          <Wrench className="w-4 h-4 mr-3" />
          Resolve
        </Link>
        <Link
          href="/build"
          className={cn(
            "flex items-center px-3 py-2 text-sm rounded-lg group relative",
            pathname === "/build" ? "bg-gray-100" : "hover:bg-gray-50"
          )}
        >
          <Construction className="w-4 h-4 mr-3" />
          Build
          <span className="absolute right-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
            Soon
          </span>
        </Link>
      </nav>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto border-t">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-900">Recent Chats</h2>
            <div className="flex items-center space-x-1">
              <Link
                href="/chat"
                className="p-1 hover:bg-gray-100 rounded-lg"
                title="New Chat"
                data-testid="new-chat-button"
              >
                <Plus className="w-4 h-4" />
              </Link>
              {chatHistory.length > 0 && (
                <button 
                  onClick={handleClearAllChats}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
                  title="Clear All Chats"
                  data-testid="clear-chats-button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            {chatHistory.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                No recent chats
              </p>
            ) : (
              chatHistory.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="block p-2 hover:bg-gray-50 rounded-lg"
                  data-testid="chat-item"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" data-testid="chat-title">
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {(chat.lastMessage && chat.lastMessage.trim()) || 'No messages yet'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(chat.timestamp)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className="mb-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between p-2 text-sm rounded-lg border hover:bg-gray-50" disabled={isLoading || !!error}>
                        <span>{isLoading ? "Loading..." : error ? "Error" : selectedProject?.name || "No Projects"}</span>
                        <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Select Blueprint</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {projects.map(project => (
                        <DropdownMenuItem key={project.id} onSelect={() => setSelectedProject(project)}>
                            {project.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">SC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Sarah Chen</p>
            <p className="text-xs text-gray-500 truncate">sarah.chen@bigbank.com</p>
          </div>
        </div>
        <div className="mt-2">
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300" defaultChecked />
            <span className="ml-2 text-sm text-gray-600">Demo Mode</span>
          </label>
        </div>
      </div>
    </div>
  );
} 