"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFinanceStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const BUDGET_GUIDELINES: Record<string, number> = {
  "Food & Dining": 15,
  Groceries: 10,
  Shopping: 10,
  Transportation: 15,
  "Bills & Utilities": 25,
  Entertainment: 5,
  Healthcare: 10,
  Education: 5,
  Travel: 5,
  "Personal Care": 5,
  Other: 10,
};

export function BudgetInsights() {
  const { budgetAnalysis } = useFinanceStore();

  const budgetStatus = useMemo(() => {
    if (!budgetAnalysis?.categoryBreakdown) return [];

    return budgetAnalysis.categoryBreakdown
      .filter((c) => c.category !== "Income")
      .map((category) => {
        const recommendedPercent = BUDGET_GUIDELINES[category.category] || 10;
        const status =
          category.percentage > recommendedPercent * 1.5
            ? "over"
            : category.percentage > recommendedPercent
              ? "warning"
              : "good";

        return {
          ...category,
          recommendedPercent,
          status,
        };
      })
      .slice(0, 6);
  }, [budgetAnalysis]);

  const insights = useMemo(() => {
    if (!budgetAnalysis) return [];

    const tips: Array<{ type: "tip" | "warning" | "success"; title: string; description: string }> = [];

    // Savings rate insight
    if (budgetAnalysis.savingsRate < 10) {
      tips.push({
        type: "warning",
        title: "Low Savings Rate",
        description: `Your savings rate is ${budgetAnalysis.savingsRate.toFixed(1)}%. Aim for at least 20% to build a healthy financial cushion.`,
      });
    } else if (budgetAnalysis.savingsRate >= 20) {
      tips.push({
        type: "success",
        title: "Great Savings Rate",
        description: `You&apos;re saving ${budgetAnalysis.savingsRate.toFixed(1)}% of your income. Keep up the excellent work!`,
      });
    }

    // Over-budget categories
    const overBudget = budgetStatus.filter((b) => b.status === "over");
    if (overBudget.length > 0) {
      tips.push({
        type: "warning",
        title: "Categories Over Budget",
        description: `${overBudget.map((b) => b.category).join(", ")} ${overBudget.length === 1 ? "is" : "are"} significantly over recommended budget levels.`,
      });
    }

    // Top spending insight
    if (budgetAnalysis.topCategories.length > 0) {
      const topCategory = budgetAnalysis.topCategories[0];
      tips.push({
        type: "tip",
        title: "Top Spending Area",
        description: `${topCategory.category} accounts for ${topCategory.percentage.toFixed(1)}% of your spending ($${topCategory.total.toLocaleString()}).`,
      });
    }

    return tips;
  }, [budgetAnalysis, budgetStatus]);

  if (!budgetAnalysis) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Financial Health Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Financial Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div
              className={cn(
                "size-24 rounded-full flex items-center justify-center text-3xl font-bold border-4",
                budgetAnalysis.healthScore >= 80
                  ? "border-success text-success"
                  : budgetAnalysis.healthScore >= 60
                    ? "border-warning text-warning"
                    : "border-destructive text-destructive"
              )}
            >
              {budgetAnalysis.healthGrade}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="font-semibold">{budgetAnalysis.healthScore}/100</span>
              </div>
              <Progress value={budgetAnalysis.healthScore} className="h-2" />
              <p className="text-sm text-muted-foreground mt-3">
                {budgetAnalysis.healthScore >= 80
                  ? "Excellent financial management! Keep it up."
                  : budgetAnalysis.healthScore >= 60
                    ? "Good progress. A few improvements can boost your score."
                    : "There&apos;s room for improvement. Focus on reducing expenses and increasing savings."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget by Category */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Budget Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {budgetStatus.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (rec: {item.recommendedPercent}%)
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress
                    value={Math.min(item.percentage, 100)}
                    className={cn(
                      "h-2",
                      item.status === "over" && "[&>div]:bg-destructive",
                      item.status === "warning" && "[&>div]:bg-warning"
                    )}
                  />
                  {/* Recommended marker */}
                  <div
                    className="absolute top-0 w-0.5 h-2 bg-foreground/50"
                    style={{ left: `${Math.min(item.recommendedPercent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Insights</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {insights.map((insight, index) => (
              <Alert
                key={index}
                variant={insight.type === "warning" ? "destructive" : "default"}
                className={cn(
                  insight.type === "success" &&
                    "border-success/50 bg-success/10 text-success [&>svg]:text-success"
                )}
              >
                {insight.type === "tip" && (
                  <svg
                    className="size-4"
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
                )}
                {insight.type === "warning" && (
                  <svg
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
                {insight.type === "success" && (
                  <svg
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <AlertTitle>{insight.title}</AlertTitle>
                <AlertDescription>{insight.description}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
