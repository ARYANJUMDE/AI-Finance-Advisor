"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { useFinanceStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ForecastPanel() {
  const { forecasts } = useFinanceStore();

  if (forecasts.length === 0) {
    return null;
  }

  const chartData = forecasts.map((f) => ({
    month: new Date(f.month + "-01").toLocaleDateString("en-US", {
      month: "short",
    }),
    expenses: f.predictedExpenses,
    income: f.predictedIncome,
    savings: f.predictedSavings,
  }));

  const chartConfig = {
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-5))",
    },
    income: {
      label: "Income",
      color: "hsl(var(--chart-1))",
    },
  };

  const totalPredictedSavings = forecasts.reduce(
    (sum, f) => sum + f.predictedSavings,
    0
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">3-Month Forecast</CardTitle>
          <Badge variant="secondary" className="text-xs">
            AI Predicted
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
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
              <Bar
                dataKey="income"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                fill="hsl(var(--chart-5))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          {forecasts.map((forecast) => (
            <div key={forecast.month} className="text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {new Date(forecast.month + "-01").toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p
                className={cn(
                  "text-lg font-semibold",
                  forecast.predictedSavings >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {forecast.predictedSavings >= 0 ? "+" : ""}$
                {Math.abs(forecast.predictedSavings).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {forecast.confidence}% confidence
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-primary/10 text-center">
          <p className="text-sm text-muted-foreground">Projected 3-Month Savings</p>
          <p
            className={cn(
              "text-2xl font-bold",
              totalPredictedSavings >= 0 ? "text-primary" : "text-destructive"
            )}
          >
            {totalPredictedSavings >= 0 ? "+" : ""}$
            {Math.abs(totalPredictedSavings).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
