"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { useFinanceStore } from "@/lib/store";

export function TrendChart() {
  const { transactions } = useFinanceStore();

  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    // Group transactions by month
    const monthlyData = new Map<string, { income: number; expenses: number }>();

    transactions.forEach((t) => {
      const month = t.date.substring(0, 7);
      const existing = monthlyData.get(month) || { income: 0, expenses: 0 };

      if (t.type === "credit") {
        existing.income += t.amount;
      } else {
        existing.expenses += Math.abs(t.amount);
      }

      monthlyData.set(month, existing);
    });

    // Sort by date and format
    return Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
      }));
  }, [transactions]);

  const chartConfig = {
    income: {
      label: "Income",
      color: "#10B981",
    },
    expenses: {
      label: "Expenses",
      color: "#EF4444",
    },
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Monthly Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#10B981"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#10B981"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#EF4444"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#EF4444"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `$${Number(value).toLocaleString()}`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#fillIncome)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                fillOpacity={1}
                fill="url(#fillExpenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full" style={{ backgroundColor: "#10B981" }} />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full" style={{ backgroundColor: "#EF4444" }} />
            <span className="text-xs text-muted-foreground">Expenses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
