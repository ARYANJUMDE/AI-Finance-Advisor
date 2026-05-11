"use client";

import { Button } from "@/components/ui/button";
import { useFinanceStore } from "@/lib/store";

export function Header() {
  const { transactions, reset } = useFinanceStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
            <svg
              className="size-6 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              AI Finance Advisor
            </h1>
            <p className="text-xs text-muted-foreground">
              Smart money management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {transactions.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {transactions.length} transactions loaded
              </span>
              <Button variant="outline" size="sm" onClick={reset}>
                Clear Data
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
