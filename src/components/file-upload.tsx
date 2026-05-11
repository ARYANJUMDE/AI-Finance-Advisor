"use client";

import { useCallback, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinanceStore, analyzeTransactions, detectAnomalies, generateForecasts } from "@/lib/store";
import type { Transaction } from "@/lib/types";

export function FileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const {
    setTransactions,
    setBudgetAnalysis,
    setAnomalies,
    setForecasts,
    setLoading,
    setAnalyzing,
    setError,
    isLoading,
    isAnalyzing,
  } = useFinanceStore();

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a CSV file");
        return;
      }

      setFileName(file.name);
      setLoading(true);
      setError(null);

      try {
        // Parse CSV
        const formData = new FormData();
        formData.append("file", file);

        const parseResponse = await fetch("/api/parse-csv", {
          method: "POST",
          body: formData,
        });

        if (!parseResponse.ok) {
          const errorData = await parseResponse.json();
          throw new Error(errorData.error || "Failed to parse file");
        }

        const { transactions } = (await parseResponse.json()) as {
          transactions: Transaction[];
        };

        if (transactions.length === 0) {
          throw new Error("No valid transactions found in the file");
        }

        // Set initial transactions
        setTransactions(transactions);
        setLoading(false);
        setAnalyzing(true);

        // Analyze transactions locally first
        const analysis = analyzeTransactions(transactions);
        setBudgetAnalysis(analysis);

        const anomalies = detectAnomalies(transactions);
        setAnomalies(anomalies);

        const forecasts = generateForecasts(transactions);
        setForecasts(forecasts);

        // Try AI categorization (optional enhancement)
        try {
          const aiResponse = await fetch("/api/ai/categorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactions: transactions.slice(0, 50) }),
          });

          if (aiResponse.ok) {
            const { transactions: categorizedTransactions } = await aiResponse.json();
            
            // Merge AI categories with remaining transactions
            const mergedTransactions = transactions.map((t) => {
              const aiCategorized = categorizedTransactions.find(
                (ct: Transaction) => ct.id === t.id
              );
              return aiCategorized || t;
            });

            setTransactions(mergedTransactions);

            // Re-analyze with AI categories
            const newAnalysis = analyzeTransactions(mergedTransactions);
            setBudgetAnalysis(newAnalysis);
          }
        } catch {
          // AI categorization failed, continue with rule-based categories
          console.log("AI categorization unavailable, using rule-based categories");
        }

        setAnalyzing(false);
      } catch (error) {
        console.error("Error processing file:", error);
        setError(error instanceof Error ? error.message : "Failed to process file");
        setLoading(false);
        setAnalyzing(false);
      }
    },
    [setTransactions, setBudgetAnalysis, setAnomalies, setForecasts, setLoading, setAnalyzing, setError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  return (
    <Card
      className={`border-2 border-dashed transition-all duration-200 ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            className="size-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold">Upload Your Bank Statement</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop your CSV file here, or click to browse
          </p>
        </div>

        {fileName && !isLoading && !isAnalyzing && (
          <p className="text-sm text-primary font-medium">
            Loaded: {fileName}
          </p>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg className="size-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Parsing transactions...</span>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-primary">
            <svg className="size-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>AI is analyzing your finances...</span>
          </div>
        )}

        <div className="flex gap-4">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isLoading || isAnalyzing}
            ref={fileInputRef}
          />
          <Button 
            disabled={isLoading || isAnalyzing}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Supported format: CSV with date, amount, and description columns
        </p>
      </CardContent>
    </Card>
  );
}
