"use client";

import React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateChartConfig,
  generateQuery,
  runGenerateSQLQuery,
} from "./actions";
import { Config, Result } from "@/lib/types";
import { Loader2, Search, Wrench, Construction } from "lucide-react";
import { toast } from "sonner";
import { ProjectInfo } from "@/components/project-info";
import { Results } from "@/components/results";
import { SuggestedQueries } from "@/components/suggested-queries";
import { QueryViewer } from "@/components/query-viewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { ChatInput } from "./components/chat-input";
import { useRouter } from "next/navigation";

interface QueryResult {
  [key: string]: any;
}

type QuickAction = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

type SuggestedQuery = {
  id: string;
  text: string;
}

const quickActions: QuickAction[] = [
  {
    id: "explore",
    title: "Explore",
    description: "Understand your data landscape",
    icon: <Search className="h-5 w-5" />,
    link: "/explore",
  },
  {
    id: "resolve",
    title: "Resolve",
    description: "Fix issues and optimize",
    icon: <Wrench className="h-5 w-5" />,
    link: "/resolve",
  },
  {
    id: "build",
    title: "Build",
    description: "Create new solutions",
    icon: <Construction className="h-5 w-5" />,
    link: "/build",
  },
];

const suggestedQueries: SuggestedQuery[] = [
  { id: "1", text: "How do we calculate ARR?" },
  { id: "2", text: "What is the source of our customer payment information?" },
  { id: "3", text: "How many new reports are created weekly in each department?" },
  { id: "4", text: "Which tables contain PII?" },
];

export default function Home() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [chartConfig, setChartConfig] = useState<Config | null>(null);
  const [reasoning, setReasoning] = useState<string[]>([]);

  const handleSubmit = async (text: string, file?: File) => {
    if (!text.trim() && !file) return;
    localStorage.setItem('initial_message', text);
    router.push('/chat');
  };

  const handleSuggestionClick = (suggestion: string) => {
    localStorage.setItem('initial_message', suggestion);
    router.push('/chat');
  };

  const clearExistingData = () => {
    setActiveQuery("");
    setResults([]);
    setColumns([]);
    setChartConfig(null);
  };

  const handleClear = () => {
    setSubmitted(false);
    clearExistingData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center p-2">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 rounded-lg transform rotate-45"></div>
                    <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Reason With Your Data
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Welcome back, Sarah! What puzzle can we solve today?
            </p>

            {/* Chat Input */}
            <ChatInput
              onSubmit={handleSubmit}
              onClear={handleClear}
              isLoading={loading}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                localStorage.setItem('initial_message', action.description);
                router.push('/chat');
              }}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {action.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Suggested Queries */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedQueries.map((query) => (
              <button
                key={query.id}
                onClick={() => handleSuggestionClick(query.text)}
                className="text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-sm transition-all duration-200"
              >
                <p className="text-gray-700">{query.text}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
