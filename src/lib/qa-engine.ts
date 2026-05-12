import type { Transaction, BudgetAnalysis } from "@/lib/types";

export interface QAResponse {
  answer: string;
  dataSource: string;
  confidence: number;
}

export class FinancialQAEngine {
  private transactions: Transaction[];
  private budgetAnalysis: BudgetAnalysis | null;

  constructor(transactions: Transaction[], budgetAnalysis: BudgetAnalysis | null) {
    this.transactions = transactions;
    this.budgetAnalysis = budgetAnalysis;
  }

  private calculateTotals() {
    const totalIncome = this.transactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = this.transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netSavings = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, netSavings };
  }

  private getCategoryBreakdown() {
    return this.transactions
      .filter((t) => t.type === "debit")
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
          return acc;
        },
        {} as Record<string, number>
      );
  }

  private getTopSpendingCategory() {
    const breakdown = this.getCategoryBreakdown();
    const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    return sorted[0];
  }

  private getSavingsRate() {
    const { totalIncome, netSavings } = this.calculateTotals();
    if (totalIncome === 0) return 0;
    return (netSavings / totalIncome) * 100;
  }

  private getMonthlyAverage() {
    const dates = this.transactions.map((t) => new Date(t.date));
    const monthSet = new Set(dates.map((d) => d.toISOString().slice(0, 7)));
    const months = monthSet.size || 1;

    const { totalExpenses, totalIncome } = this.calculateTotals();
    return {
      avgMonthlyExpenses: totalExpenses / months,
      avgMonthlyIncome: totalIncome / months,
    };
  }

  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim();
  }

  private matchesKeywords(query: string, keywords: string[]): boolean {
    return keywords.some((keyword) => query.includes(keyword.toLowerCase()));
  }

  public answerQuestion(question: string): QAResponse {
    const normalizedQuery = this.normalizeQuery(question);

    // Highest spending category
    if (
      this.matchesKeywords(normalizedQuery, [
        "highest spending",
        "most spending",
        "where",
        "spent most",
        "biggest expense",
        "largest expense",
        "top spending",
      ])
    ) {
      const [category, amount] = this.getTopSpendingCategory();
      return {
        answer: `Your highest spending category is ${category} with $${amount.toFixed(2)} in total expenses.`,
        dataSource: "Transaction analysis",
        confidence: 0.95,
      };
    }

    // Total savings
    if (
      this.matchesKeywords(normalizedQuery, [
        "how much saved",
        "total savings",
        "net savings",
        "savings",
        "saved",
        "remaining",
      ])
    ) {
      const { netSavings, totalIncome, totalExpenses } = this.calculateTotals();
      const savingsRate = this.getSavingsRate();
      return {
        answer: `You have saved $${netSavings.toFixed(2)} total (Income: $${totalIncome.toFixed(
          2
        )} - Expenses: $${totalExpenses.toFixed(2)}). Your savings rate is ${savingsRate.toFixed(
          1
        )}% of your income.`,
        dataSource: "Income and expense tracking",
        confidence: 0.98,
      };
    }

    // Total earnings/income
    if (
      this.matchesKeywords(normalizedQuery, [
        "total earning",
        "total income",
        "earn",
        "income",
        "how much earn",
        "revenue",
      ])
    ) {
      const { totalIncome } = this.calculateTotals();
      const { avgMonthlyIncome } = this.getMonthlyAverage();
      return {
        answer: `Your total income is $${totalIncome.toFixed(
          2
        )} with an average monthly income of $${avgMonthlyIncome.toFixed(2)}.`,
        dataSource: "Income tracking",
        confidence: 0.98,
      };
    }

    // Total spending/expenses
    if (
      this.matchesKeywords(normalizedQuery, [
        "total spending",
        "total expense",
        "total spent",
        "spent",
        "how much spent",
        "expense",
      ])
    ) {
      const { totalExpenses } = this.calculateTotals();
      const { avgMonthlyExpenses } = this.getMonthlyAverage();
      return {
        answer: `Your total expenses are $${totalExpenses.toFixed(
          2
        )} with an average monthly spending of $${avgMonthlyExpenses.toFixed(2)}.`,
        dataSource: "Expense tracking",
        confidence: 0.98,
      };
    }

    // Spending by category
    if (
      this.matchesKeywords(normalizedQuery, [
        "spending by",
        "category",
        "breakdown",
        "split",
        "distribution",
      ])
    ) {
      const breakdown = this.getCategoryBreakdown();
      const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
      const details = sorted
        .map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`)
        .join(", ");
      return {
        answer: `Here's your spending breakdown by category: ${details}`,
        dataSource: "Transaction categorization",
        confidence: 0.95,
      };
    }

    // Financial health
    if (
      this.matchesKeywords(normalizedQuery, [
        "health",
        "financial health",
        "score",
        "grade",
        "how am i doing",
      ])
    ) {
      if (this.budgetAnalysis) {
        return {
          answer: `Your financial health score is ${this.budgetAnalysis.healthScore}/100 with a grade of ${this.budgetAnalysis.healthGrade}. ${this.budgetAnalysis.recommendation}`,
          dataSource: "Budget analysis",
          confidence: 0.9,
        };
      }
      const savingsRate = this.getSavingsRate();
      const healthStatus =
        savingsRate > 20 ? "excellent" : savingsRate > 10 ? "good" : "needs improvement";
      return {
        answer: `Based on your savings rate of ${savingsRate.toFixed(
          1
        )}%, your financial health is ${healthStatus}.`,
        dataSource: "Savings rate calculation",
        confidence: 0.85,
      };
    }

    // Specific category spending
    const categoryMatch = normalizedQuery.match(/spending on (\w+)|(\w+) spending/);
    if (categoryMatch) {
      const breakdown = this.getCategoryBreakdown();
      const category = categoryMatch[1] || categoryMatch[2];
      const categoryLower = category.toLowerCase();

      for (const [cat, amount] of Object.entries(breakdown)) {
        if (cat.toLowerCase().includes(categoryLower)) {
          return {
            answer: `You spent $${amount.toFixed(2)} on ${cat}.`,
            dataSource: "Transaction analysis",
            confidence: 0.92,
          };
        }
      }

      return {
        answer: `I don't have data for the "${category}" category in your transactions.`,
        dataSource: "Transaction search",
        confidence: 0.8,
      };
    }

    // Average monthly spending
    if (
      this.matchesKeywords(normalizedQuery, [
        "average monthly",
        "monthly average",
        "per month",
      ])
    ) {
      const { avgMonthlyExpenses, avgMonthlyIncome } = this.getMonthlyAverage();
      return {
        answer: `Your average monthly income is $${avgMonthlyIncome.toFixed(
          2
        )} and average monthly expenses are $${avgMonthlyExpenses.toFixed(2)}.`,
        dataSource: "Monthly average calculation",
        confidence: 0.95,
      };
    }

    // How many transactions
    if (
      this.matchesKeywords(normalizedQuery, [
        "how many",
        "transaction count",
        "total transaction",
      ])
    ) {
      return {
        answer: `You have ${this.transactions.length} transactions in your data.`,
        dataSource: "Transaction count",
        confidence: 0.99,
      };
    }

    // Default fallback
    return {
      answer: `I can answer questions about: total spending, total earnings, savings, highest spending category, spending by category, financial health, and monthly averages. What would you like to know?`,
      dataSource: "Help information",
      confidence: 0.5,
    };
  }
}
