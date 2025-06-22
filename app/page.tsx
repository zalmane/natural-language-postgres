"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import {
  Search,
  Wrench,
  Construction,
  AlertTriangle,
  FileText,
  Database,
} from "lucide-react";
import { ChatInput } from "./components/chat-input";
import { cn } from "@/lib/utils";

type Tab = {
  id: "explore" | "resolve" | "build";
  title: string;
  description: string;
  icon: React.ReactNode;
};

const TABS: Tab[] = [
  {
    id: "explore",
    title: "Explore",
    description: "Understand your data landscape",
    icon: <Search className="w-5 h-5" />,
  },
  {
    id: "resolve",
    title: "Resolve",
    description: "Fix issues and optimize",
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    id: "build",
    title: "Build",
    description: "Create new data assets",
    icon: <Construction className="w-5 h-5" />,
  },
];

type SuggestedQuery = {
  id: string;
  text: string;
};

const suggestedQueries: SuggestedQuery[] = [
  { id: "1", text: "How do we calculate ARR?" },
  { id: "2", text: "What is the source of our customer payment information?" },
  { id: "3", text: "How many new reports are created weekly in each department?" },
  { id: "4", text: "Which tables contain PII?" },
];

type Issue = {
  id: string;
  title: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  status: "open" | "resolved";
  category: string;
  team?: string;
  date: string;
};

const issues: Issue[] = [
  {
    id: "#BBK-013",
    title: "Hardcoded transaction code filter in payment_processing_pipeline DAG",
    description:
      "DAG explicitly excludes transaction type from downstream processing. When new transaction codes are introduced or existing codes are redefined, DAG logic becomes incorrect without manual updates. Risk of missing critical transaction types in fraud detection and...",
    severity: "High",
    status: "open",
    category: "Data Quality",
    team: "Data Engineering Team",
    date: "over 1 year ago",
  },
  {
    id: "#BBK012-1",
    title: "Hardcoded Transaction Code Filter in Payment Processing Pipeline",
    description:
      "Code Quality Agent detected hardcoded transaction code filter ('4000') in payment_processing_pipeline ETL. Pipeline explicitly excludes transaction type 4000 (likely reversals or corrections) from downstream processing. When new transaction codes are introduced or...",
    severity: "High",
    status: "open",
    category: "Ambiguity Risk",
    date: "19 days ago",
  },
  {
    id: "#BBK012-2",
    title: "Undocumented API Response Format Changes",
    description:
      "API Monitoring Agent detected breaking changes in account_balance_api response structure. Changed from flat JSON to nested object without versioning strategy. Mobile banking app experiencing intermittent balance display failures.",
    severity: "High",
    status: "resolved",
    category: "Schema Evolution Risk",
    team: "API Platform Team",
    date: "26 days ago",
  },
  {
    id: "#BBK011",
    title: "Redundant data processing step in user_activity_etl",
    description:
      "The ETL process for user activity data contains a redundant step that sorts data twice. This adds unnecessary processing time and cost. Removing the redundant sort will improve efficiency.",
    severity: "Medium",
    status: "open",
    category: "Performance",
    team: "Data Engineering Team",
    date: "2 months ago",
  },
];

type BuildAsset = {
  id: string;
  text: string;
};

const buildAssets: BuildAsset[] = [
  { id: "1", text: "Create a new dbt model for customer segmentation" },
  { id: "2", text: "Build a pipeline to ingest Salesforce lead data" },
  { id: "3", text: 'Define the metric "Product Adoption Rate"' },
  { id: "4", text: "Create a new Tableau dashboard for marketing KPIs" },
];

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"explore" | "resolve" | "build">(
    "explore"
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = (text: string, file?: File) => {
    if (!text.trim() && !file) return;
    
    // Generate a unique chat ID using nanoid
    const chatId = nanoid();
    
    // Store the initial message
    localStorage.setItem("initial_message", text);
    
    // Navigate to the dynamic chat route
    router.push(`/chat/${chatId}`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Generate a unique chat ID using nanoid
    const chatId = nanoid();
    
    // Navigate to the dynamic chat route
    router.push(`/chat/${chatId}?q=${encodeURIComponent(suggestion)}`);
  };

  const handleClear = () => {
    //Dummy function for ChatInput
  };

  return (
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 mt-16">
              Reason With Your Data
            </h1>
            <p className="text-xl text-gray-600">
              Welcome back, Sarah! What puzzle can we solve today?
            </p>
          </header>

          <div className="bg-gray-100 p-1.5 rounded-xl flex items-center justify-between space-x-2 mb-8 max-w-2xl mx-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center justify-center px-4 py-3 rounded-lg text-base font-medium transition-colors focus:outline-none",
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "bg-transparent text-gray-600 hover:bg-gray-200"
                )}
              >
                <span className="mr-2">{tab.icon}</span>
                <span>{tab.title}</span>
              </button>
            ))}
          </div>

          <div>
            {activeTab === "explore" && (
              <div>
                <ChatInput
                  onSubmit={handleSubmit}
                  onClear={handleClear}
                  isLoading={loading}
                />
                <div className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestedQueries.map((query) => (
                      <button
                        key={query.id}
                        onClick={() => handleSuggestionClick(query.text)}
                        className="text-left p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-gray-100 transition-all duration-200"
                      >
                        <p className="text-gray-700">{query.text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "resolve" && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Resolve Data Issues
                  </h2>
                  <p className="text-gray-600">
                    Select an issue from the list below to begin diagnosis and
                    resolution.
                  </p>
                </div>
                <div className="border rounded-lg">
                  <div className="p-4 bg-gray-50 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-gray-500 mr-3" />
                      <h3 className="text-lg font-medium text-gray-900">
                        All Issues
                      </h3>
                    </div>
                    <span className="text-gray-600">14 issues found</span>
                  </div>
                  <div className="divide-y">
                    {issues.map((issue) => (
                      <div key={issue.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="font-mono text-sm text-gray-500">
                            {issue.id}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded-full",
                              issue.severity === "High"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            )}
                          >
                            {issue.severity}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded-full",
                              issue.status === "open"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            )}
                          >
                            {issue.status}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {issue.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {issue.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Category: {issue.category}</span>
                          {issue.team && <span>Owner: {issue.team}</span>}
                          <span>{issue.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "build" && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Build New Data Assets
                  </h2>
                  <p className="text-gray-600">
                    Define, model, and deploy new data assets, pipelines, and
                    insights with confidence.
                  </p>
                </div>
                <ChatInput
                  onSubmit={handleSubmit}
                  onClear={handleClear}
                  isLoading={loading}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {buildAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleSuggestionClick(asset.text)}
                      className="text-left p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-gray-100 transition-all duration-200"
                    >
                      <p className="text-gray-700">{asset.text}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-8 border rounded-lg">
                  <div className="p-4 bg-gray-50 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Database className="w-5 h-5 text-gray-500 mr-3" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Data Blueprint
                      </h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600">
                      6 connected platforms, 42 models, 530+ tables
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
  );
}
