"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFinanceStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "bg-orange-500/20 text-orange-300",
  Groceries: "bg-green-500/20 text-green-300",
  Shopping: "bg-purple-500/20 text-purple-300",
  Transportation: "bg-blue-500/20 text-blue-300",
  "Bills & Utilities": "bg-red-500/20 text-red-300",
  Entertainment: "bg-pink-500/20 text-pink-300",
  Healthcare: "bg-cyan-500/20 text-cyan-300",
  Education: "bg-indigo-500/20 text-indigo-300",
  Travel: "bg-yellow-500/20 text-yellow-300",
  "Personal Care": "bg-rose-500/20 text-rose-300",
  Income: "bg-emerald-500/20 text-emerald-300",
  Other: "bg-gray-500/20 text-gray-300",
};

export function TransactionList() {
  const { transactions } = useFinanceStore();
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "debit" | "credit">("all");

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (filter !== "all") {
      filtered = transactions.filter((t) => t.type === filter);
    }
    return showAll ? filtered : filtered.slice(0, 10);
  }, [transactions, showAll, filter]);

  const totalFiltered = useMemo(() => {
    if (filter === "all") return transactions.length;
    return transactions.filter((t) => t.type === filter).length;
  }, [transactions, filter]);

  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
          <div className="flex gap-1">
            <Button
              variant={filter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "debit" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("debit")}
            >
              Expenses
            </Button>
            <Button
              variant={filter === "credit" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("credit")}
            >
              Income
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={showAll ? "h-96" : "h-auto"}>
          <div className="flex flex-col gap-2">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "size-10 rounded-full flex items-center justify-center text-sm font-medium",
                      transaction.type === "credit"
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive"
                    )}
                  >
                    {transaction.type === "credit" ? "+" : "-"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {transaction.description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "hidden sm:flex",
                      CATEGORY_COLORS[transaction.category] || CATEGORY_COLORS.Other
                    )}
                  >
                    {transaction.category}
                  </Badge>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      transaction.type === "credit"
                        ? "text-success"
                        : "text-foreground"
                    )}
                  >
                    {transaction.type === "credit" ? "+" : "-"}$
                    {Math.abs(transaction.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {totalFiltered > 10 && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : `Show All (${totalFiltered})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
