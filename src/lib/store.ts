"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Transaction,
  BudgetAnalysis,
  Anomaly,
  Forecast,
  ChatMessage,
  CategorySummary,
} from "./types";

interface FinanceState {
  transactions: Transaction[];
  budgetAnalysis: BudgetAnalysis | null;
  anomalies: Anomaly[];
  forecasts: Forecast[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;

  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  setBudgetAnalysis: (analysis: BudgetAnalysis | null) => void;
  setAnomalies: (anomalies: Anomaly[]) => void;
  setForecasts: (forecasts: Forecast[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  setLoading: (loading: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  transactions: [],
  budgetAnalysis: null,
  anomalies: [],
  forecasts: [],
  chatMessages: [],
  isLoading: false,
  isAnalyzing: false,
  error: null,
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      ...initialState,

      setTransactions: (transactions) => set({ transactions }),
      setBudgetAnalysis: (budgetAnalysis) => set({ budgetAnalysis }),
      setAnomalies: (anomalies) => set({ anomalies }),
      setForecasts: (forecasts) => set({ forecasts }),
      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),
      clearChatMessages: () => set({ chatMessages: [] }),
      setLoading: (isLoading) => set({ isLoading }),
      setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    {
      name: "finance-store",
      partialize: (state) => ({
        transactions: state.transactions,
        budgetAnalysis: state.budgetAnalysis,
        anomalies: state.anomalies,
        forecasts: state.forecasts,
      }),
    }
  )
);

// Helper functions for analysis
export function analyzeTransactions(transactions: Transaction[]): BudgetAnalysis {
  const debits = transactions.filter((t) => t.type === "debit");
  const credits = transactions.filter((t) => t.type === "credit");

  const totalExpenses = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalIncome = credits.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Category breakdown
  const categoryMap = new Map<string, { total: number; count: number }>();
  debits.forEach((t) => {
    const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
    categoryMap.set(t.category, {
      total: existing.total + Math.abs(t.amount),
      count: existing.count + 1,
    });
  });

  const categoryBreakdown: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([category, { total, count }]) => ({
      category,
      total,
      count,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const topCategories = categoryBreakdown.slice(0, 5);

  // Calculate health score (0-100)
  let healthScore = 50;
  if (savingsRate >= 20) healthScore += 30;
  else if (savingsRate >= 10) healthScore += 20;
  else if (savingsRate >= 0) healthScore += 10;
  else healthScore -= 20;

  // Penalize if any category is over 30%
  const overBudgetCategories = categoryBreakdown.filter((c) => c.percentage > 30);
  healthScore -= overBudgetCategories.length * 5;

  // Bonus for diverse spending
  if (categoryBreakdown.length >= 4) healthScore += 10;

  healthScore = Math.max(0, Math.min(100, healthScore));

  const healthGrade =
    healthScore >= 90
      ? "A+"
      : healthScore >= 80
        ? "A"
        : healthScore >= 70
          ? "B"
          : healthScore >= 60
            ? "C"
            : healthScore >= 50
              ? "D"
              : "F";

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    categoryBreakdown,
    topCategories,
    healthScore,
    healthGrade,
  };
}

export function detectAnomalies(transactions: Transaction[]): Anomaly[] {
  const debits = transactions.filter((t) => t.type === "debit");
  if (debits.length < 5) return [];

  const amounts = debits.map((t) => Math.abs(t.amount));
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length
  );

  const anomalies: Anomaly[] = [];

  debits.forEach((t) => {
    const absAmount = Math.abs(t.amount);
    const zScore = (absAmount - mean) / stdDev;

    if (zScore > 2) {
      anomalies.push({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        reason: `Unusually large transaction (${zScore.toFixed(1)}x standard deviation)`,
        severity: zScore > 3 ? "high" : "medium",
      });
    }
  });

  return anomalies.slice(0, 10);
}

export function generateForecasts(transactions: Transaction[]): Forecast[] {
  const debits = transactions.filter((t) => t.type === "debit");
  const credits = transactions.filter((t) => t.type === "credit");

  if (debits.length < 3) return [];

  // Group by month
  const monthlyExpenses = new Map<string, number>();
  const monthlyIncome = new Map<string, number>();

  debits.forEach((t) => {
    const month = t.date.substring(0, 7);
    monthlyExpenses.set(month, (monthlyExpenses.get(month) || 0) + Math.abs(t.amount));
  });

  credits.forEach((t) => {
    const month = t.date.substring(0, 7);
    monthlyIncome.set(month, (monthlyIncome.get(month) || 0) + t.amount);
  });

  const expenseValues = Array.from(monthlyExpenses.values());
  const incomeValues = Array.from(monthlyIncome.values());

  const avgExpenses =
    expenseValues.length > 0
      ? expenseValues.reduce((a, b) => a + b, 0) / expenseValues.length
      : 0;
  const avgIncome =
    incomeValues.length > 0
      ? incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length
      : 0;

  // Generate 3-month forecast
  const forecasts: Forecast[] = [];
  const now = new Date();

  for (let i = 1; i <= 3; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const month = futureDate.toISOString().substring(0, 7);

    // Add some variance based on historical patterns
    const variance = 0.1;
    const predictedExpenses = avgExpenses * (1 + (Math.random() - 0.5) * variance);
    const predictedIncome = avgIncome * (1 + (Math.random() - 0.5) * variance * 0.5);

    forecasts.push({
      month,
      predictedExpenses: Math.round(predictedExpenses * 100) / 100,
      predictedIncome: Math.round(predictedIncome * 100) / 100,
      predictedSavings: Math.round((predictedIncome - predictedExpenses) * 100) / 100,
      confidence: Math.max(60, 90 - i * 10),
    });
  }

  return forecasts;
}
