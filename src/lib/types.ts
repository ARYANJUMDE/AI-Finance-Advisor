export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  category: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface BudgetAnalysis {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  categoryBreakdown: CategorySummary[];
  topCategories: CategorySummary[];
  healthScore: number;
  healthGrade: string;
}

export interface Anomaly {
  id: string;
  date: string;
  description: string;
  amount: number;
  reason: string;
  severity: "low" | "medium" | "high";
}

export interface Forecast {
  month: string;
  predictedExpenses: number;
  predictedIncome: number;
  predictedSavings: number;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface FinancialInsight {
  type: "tip" | "warning" | "success";
  title: string;
  description: string;
}

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Bills & Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Travel",
  "Personal Care",
  "Groceries",
  "Income",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
