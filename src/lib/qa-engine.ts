import type { Transaction, BudgetAnalysis } from "@/lib/types";

export interface QAResponse {
  answer: string;
  dataSource: string;
  confidence: number;
}

export class FinancialQAEngine {
  private transactions: Transaction[];
  private budgetAnalysis: BudgetAnalysis | null;

  // Keywords for different question types
  private readonly SPENDING_KEYWORDS = ["spending", "expense", "money", "cash", "spent", "cost", "spend"];
  private readonly BUDGET_KEYWORDS = ["budget", "recommend", "category", "breakdown", "suggest"];
  private readonly SAVINGS_KEYWORDS = ["save", "saving", "invest", "saved", "savings"];
  private readonly DEBT_KEYWORDS = ["debt", "owe", "owing", "borrowed"];
  private readonly FUTURE_KEYWORDS = ["future", "predict", "forecast", "next", "estimate"];
  private readonly RECENT_KEYWORDS = ["recent", "latest", "new", "last"];
  private readonly HEALTH_KEYWORDS = ["health", "score", "grade", "doing", "status"];
  private readonly HELP_KEYWORDS = ["help", "advice", "how", "can", "what", "guide"];
  private readonly INCOME_KEYWORDS = ["income", "earn", "earning", "revenue", "salary"];

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

  private matchesKeywords(query: string, keywords: string[]): boolean {
    return keywords.some((keyword) => query.includes(keyword.toLowerCase()));
  }

  private getRecentTransactions(count: number = 5) {
    return this.transactions.slice(0, count);
  }

  private getUnusualTransactions() {
    const { totalExpenses } = this.calculateTotals();
    const avgTransaction = totalExpenses / this.transactions.length || 0;
    const threshold = avgTransaction * 2; // 2x average is unusual

    return this.transactions.filter((t) => t.type === "debit" && Math.abs(t.amount) > threshold);
  }

  private generateBudgetRecommendations() {
    const breakdown = this.getCategoryBreakdown();
    const { totalExpenses } = this.calculateTotals();

    const recommendations = Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => {
        const percentage = (amount / totalExpenses) * 100;
        const recommended = percentage > 30 ? amount * 0.9 : amount;
        return `${category}: $${recommended.toFixed(2)}`;
      })
      .slice(0, 5);

    return recommendations;
  }

  private getDebtAnalysis() {
    const debtTransactions = this.transactions.filter((t) =>
      t.description.toLowerCase().includes("debt") ||
      t.description.toLowerCase().includes("loan") ||
      t.category.toLowerCase().includes("debt")
    );

    if (debtTransactions.length === 0) {
      return "No debt transactions detected in your records.";
    }

    const totalDebt = debtTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return `You have ${debtTransactions.length} debt-related transactions totaling $${totalDebt.toFixed(2)}.`;
  }

  private generateForecast() {
    const { avgMonthlyExpenses, avgMonthlyIncome } = this.getMonthlyAverage();
    const nextMonthExpense = avgMonthlyExpenses;
    const nextMonthIncome = avgMonthlyIncome;
    const nextMonthSavings = nextMonthIncome - nextMonthExpense;

    return `Based on current trends, next month you can expect: Income: $${nextMonthIncome.toFixed(
      2
    )}, Expenses: $${nextMonthExpense.toFixed(2)}, Savings: $${nextMonthSavings.toFixed(2)}.`;
  }

  public answerQuestion(question: string): QAResponse {
    const query = question.toLowerCase().trim();

    // 1. SPENDING/EXPENSE QUESTIONS
    if (this.matchesKeywords(query, this.SPENDING_KEYWORDS)) {
      if (this.matchesKeywords(query, ["highest", "most", "top", "biggest", "largest"])) {
        const [category, amount] = this.getTopSpendingCategory();
        return {
          answer: `Your highest spending category is ${category} with $${amount.toFixed(
            2
          )} in total expenses.`,
          dataSource: "Spending analysis",
          confidence: 0.95,
        };
      }
      const { totalExpenses } = this.calculateTotals();
      const { avgMonthlyExpenses } = this.getMonthlyAverage();
      return {
        answer: `Your total spending is $${totalExpenses.toFixed(
          2
        )} with an average monthly spending of $${avgMonthlyExpenses.toFixed(2)}.`,
        dataSource: "Expense tracking",
        confidence: 0.98,
      };
    }

    // 2. BUDGET QUESTIONS
    if (this.matchesKeywords(query, this.BUDGET_KEYWORDS)) {
      const recommendations = this.generateBudgetRecommendations();
      return {
        answer: `Based on your spending, here are recommended monthly budgets: ${recommendations.join(
          ", "
        )}. This should help you optimize your finances.`,
        dataSource: "Budget analysis",
        confidence: 0.88,
      };
    }

    // 3. SAVINGS QUESTIONS
    if (this.matchesKeywords(query, this.SAVINGS_KEYWORDS)) {
      const { netSavings, totalIncome } = this.calculateTotals();
      const savingsRate = this.getSavingsRate();
      return {
        answer: `You have saved $${netSavings.toFixed(
          2
        )} total with a savings rate of ${savingsRate.toFixed(
          1
        )}% of your income. ${
          savingsRate < 10
            ? "Consider increasing this to at least 20% for better financial health."
            : "Great job maintaining a healthy savings rate!"
        }`,
        dataSource: "Savings analysis",
        confidence: 0.96,
      };
    }

    // 4. DEBT QUESTIONS
    if (this.matchesKeywords(query, this.DEBT_KEYWORDS)) {
      const debtInfo = this.getDebtAnalysis();
      return {
        answer: debtInfo,
        dataSource: "Debt tracking",
        confidence: 0.85,
      };
    }

    // 5. FUTURE/PREDICTION QUESTIONS
    if (this.matchesKeywords(query, this.FUTURE_KEYWORDS)) {
      const forecast = this.generateForecast();
      return {
        answer: `${forecast} Keep monitoring your spending patterns for accurate predictions.`,
        dataSource: "Trend analysis",
        confidence: 0.82,
      };
    }

    // 6. RECENT TRANSACTIONS
    if (this.matchesKeywords(query, this.RECENT_KEYWORDS)) {
      const recent = this.getRecentTransactions(5);
      const details = recent
        .map((t) => `${t.date}: ${t.description} - $${Math.abs(t.amount).toFixed(2)}`)
        .join("; ");
      return {
        answer: `Your recent transactions: ${details}`,
        dataSource: "Transaction history",
        confidence: 0.99,
      };
    }

    // 7. FINANCIAL HEALTH
    if (this.matchesKeywords(query, this.HEALTH_KEYWORDS)) {
      if (this.budgetAnalysis) {
        return {
          answer: `Your financial health score is ${this.budgetAnalysis.healthScore}/100 (Grade: ${this.budgetAnalysis.healthGrade}). You saved $${this.budgetAnalysis.netSavings.toFixed(2)} with a savings rate of ${this.budgetAnalysis.savingsRate.toFixed(1)}%.`,
          dataSource: "Health analysis",
          confidence: 0.92,
        };
      }
      const savingsRate = this.getSavingsRate();
      const status =
        savingsRate > 20
          ? "excellent - keep it up!"
          : savingsRate > 10
            ? "good - but room for improvement"
            : "needs attention - focus on reducing expenses";
      return {
        answer: `Your financial health is ${status} with a savings rate of ${savingsRate.toFixed(1)}%.`,
        dataSource: "Health assessment",
        confidence: 0.85,
      };
    }

    // 8. INCOME QUESTIONS
    if (this.matchesKeywords(query, this.INCOME_KEYWORDS)) {
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

    // 9. GENERAL HELP - Check for unusual transactions implicitly
    if (
      this.matchesKeywords(query, ["unusual", "strange", "odd"]) ||
      this.matchesKeywords(query, this.HELP_KEYWORDS)
    ) {
      const unusual = this.getUnusualTransactions();
      if (unusual.length > 0) {
        const totalUnusual = unusual.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return {
          answer: `I found ${unusual.length} unusual transactions totaling $${totalUnusual.toFixed(
            2
          )}. These might need your review. Available question types: spending, budget, savings, debt, predictions, recent transactions, health, income, and general help.`,
          dataSource: "Anomaly detection",
          confidence: 0.88,
        };
      }

      return {
        answer: `I can help you with: Spending analysis, Budget recommendations, Savings tracking, Debt management, Financial forecasts, Recent transactions, Health score, Income analysis, and Unusual transaction detection.`,
        dataSource: "Help system",
        confidence: 0.9,
      };
    }

    // Check for category-specific spending
    const categoryMatch = query.match(/(?:spending|spent) on (\w+)|(\w+) (?:spending|spent)/);
    if (categoryMatch) {
      const breakdown = this.getCategoryBreakdown();
      const category = categoryMatch[1] || categoryMatch[2];

      for (const [cat, amount] of Object.entries(breakdown)) {
        if (cat.toLowerCase().includes(category.toLowerCase())) {
          return {
            answer: `You spent $${amount.toFixed(2)} on ${cat}.`,
            dataSource: "Category analysis",
            confidence: 0.92,
          };
        }
      }
    }

    // Default response
    return {
      answer: `I can help with spending, budgets, savings, debt, predictions, recent transactions, health score, income, or unusual spending. What would you like to know?`,
      dataSource: "Help",
      confidence: 0.5,
    };
  }
}
