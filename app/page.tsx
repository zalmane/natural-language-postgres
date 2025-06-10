"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateChartConfig,
  generateQuery,
  runGenerateSQLQuery,
} from "./actions";
import { Config, Result } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProjectInfo } from "@/components/project-info";
import { Results } from "@/components/results";
import { SuggestedQueries } from "@/components/suggested-queries";
import { QueryViewer } from "@/components/query-viewer";
import { Search } from "@/components/search";
import { Header } from "@/components/header";

interface QueryResult {
  [key: string]: any;
}

export default function Page() {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [chartConfig, setChartConfig] = useState<Config | null>(null);
  const [reasoning, setReasoning] = useState<string[]>([]);

  const handleSubmit = async (suggestion?: string) => {
    const question = suggestion ?? inputValue;
    if (inputValue.length === 0 && !suggestion) return;
    clearExistingData();
    if (question.trim()) {
      setSubmitted(true);
    }
    setLoading(true);
    setLoadingStep(1);
    setActiveQuery("");
    setReasoning([]);
    try {
      const { query, reasoning: newReasoning } = await generateQuery(question);
      setReasoning(newReasoning);
      if (query === undefined) {
        toast.error("An error occurred. Please try again.");
        setLoading(false);
        return;
      }
      setActiveQuery(query);
      setLoadingStep(2);
      const companies = await runGenerateSQLQuery(query);
      const columns = companies.rows.length > 0 ? Object.keys(companies.rows[0]) : [];
      setResults(companies.rows);
      setColumns(columns);
      setLoading(false);
      const generation = await generateChartConfig(companies.rows, question);
      setChartConfig(generation.config);
    } catch (e) {
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    try {
      await handleSubmit(suggestion);
    } catch (e) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const clearExistingData = () => {
    setActiveQuery("");
    setResults([]);
    setColumns([]);
    setChartConfig(null);
  };

  const handleClear = () => {
    setSubmitted(false);
    setInputValue("");
    clearExistingData();
  };

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 flex items-start justify-center p-0 sm:p-8">
      <div className="w-full max-w-4xl min-h-dvh sm:min-h-0 flex flex-col ">
        <motion.div
          className="bg-card rounded-xl sm:border sm:border-border flex-grow flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="p-6 sm:p-8 flex flex-col flex-grow">
            <Header handleClear={handleClear} />
            <Search
              handleClear={handleClear}
              handleSubmit={handleSubmit}
              inputValue={inputValue}
              setInputValue={setInputValue}
              submitted={submitted}
            />
            <div
              id="main-container"
              className="flex-grow flex flex-col sm:min-h-[420px]"
            >
              <div className="flex-grow h-full">
                <AnimatePresence mode="wait">
                  {!submitted ? (
                    <SuggestedQueries
                      handleSuggestionClick={handleSuggestionClick}
                    />
                  ) : (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                      className="sm:h-full min-h-[400px] flex flex-col relative"
                    >
                      {loading ? (
                        <div className="h-full absolute inset-0 bg-background/50 w-full flex flex-col items-center justify-center space-y-4">
                          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                          <p className="text-foreground">
                            {loadingStep === 1
                              ? "Generating SQL query..."
                              : "Running SQL query..."}
                          </p>
                          {reasoning.length > 0 && (
                            <div className="mt-4 max-w-2xl w-full">
                              <div className="bg-muted rounded-lg p-4 space-y-2">
                                {reasoning.map((step, index) => (
                                  <p key={index} className="text-sm text-muted-foreground">
                                    {step}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {reasoning.length > 0 && (
                            <div className="mb-4">
                              <div className="bg-muted rounded-lg p-4 space-y-2">
                                <h3 className="text-sm font-medium text-foreground mb-2">Reasoning Process:</h3>
                                {reasoning.map((step, index) => (
                                  <p key={index} className="text-sm text-muted-foreground">
                                    {step}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {activeQuery.length > 0 && (
                            <QueryViewer
                              activeQuery={activeQuery}
                              inputValue={inputValue}
                            />
                          )}
                          {results.length === 0 ? (
                            <div className="flex-grow flex items-center justify-center">
                              <p className="text-center text-muted-foreground">
                                No results found.
                              </p>
                            </div>
                          ) : (
                            <Results
                              results={results}
                              chartConfig={chartConfig}
                              columns={columns}
                            />
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <ProjectInfo />
        </motion.div>
      </div>
    </div>
  );
}
