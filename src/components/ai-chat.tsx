"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFinanceStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

const SUGGESTED_QUESTIONS = [
  "What is my highest spending?",
  "How much have I saved?",
  "Total income?",
  "Spending by category",
  "Any unusual transactions?",
  "Budget recommendations",
];

export function AIChat() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { transactions, budgetAnalysis, chatMessages, addChatMessage } = useFinanceStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    if (transactions.length === 0) {
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "Please upload your bank statement first so I can analyze your finances.",
        timestamp: new Date(),
      });
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    addChatMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          transactions,
          budgetAnalysis,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || data.response || data.error || "I apologize, but I couldn&apos;t process your request.",
        timestamp: new Date(),
      };
      addChatMessage(assistantMessage);
    } catch {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I&apos;m having trouble connecting. Please try again.",
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg
              className="size-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          Financial Advisor
        </CardTitle>
      </CardHeader>

      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="p-4 flex flex-col gap-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="font-medium mb-1">Ask me about your finances</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Ask about spending, budgets, savings, debt, predictions, health, income, or transactions
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(question)}
                    disabled={isLoading || transactions.length === 0}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 items-end",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0 flex-col">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                </div>
              )}
              
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 max-w-[70%] whitespace-pre-wrap text-sm",
                  message.role === "user"
                    ? "bg-emerald-500 text-white rounded-br-none"
                    : "bg-slate-700 text-slate-50 rounded-bl-none"
                )}
              >
                {message.content}
              </div>

              {message.role === "user" && (
                <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <svg className="size-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-end">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <svg className="size-5 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
              <div className="bg-slate-700 text-slate-50 rounded-2xl rounded-bl-none px-4 py-2.5 text-sm">
                Analyzing your data...
              </div>
            </div>
          )}
        </div>
      </div>

      <CardContent className="border-t border-border p-3">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask about spending, budgets, savings..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-24 resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="shrink-0"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
