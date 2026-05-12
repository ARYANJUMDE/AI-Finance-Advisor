import type { Transaction, BudgetAnalysis } from "./types";

// Neural network-inspired rule engine for financial advice
export interface FinancialPattern {
  id: string;
  confidence: number;
  recommendation: string;
  severity: "low" | "medium" | "high";
}

interface NeuralNeuron {
  weight: number;
  threshold: number;
  activate: (input: number) => number;
}

interface FinancialSignals {
  savingsRate: number;
  expenseVolatility: number;
  categoryConcentration: number;
  spendingTrend: number;
  incomeStability: number;
}

// Rule-based neural network for financial pattern recognition
export class NeuralFinancialAdvisor {
  private neurons: Map<string, NeuralNeuron> = new Map();

  constructor() {
    this.initializeNeurons();
  }

  private initializeNeurons() {
    // Initialize decision neurons with weights and thresholds
    this.neurons.set("high_savings", {
      weight: 1.5,
      threshold: 0.3,
      activate: (input) => Math.tanh(input * 1.5),
    });

    this.neurons.set("overspending", {
      weight: 0.8,
      threshold: 0.7,
      activate: (input) => 1 / (1 + Math.exp(-input)),
    });

    this.neurons.set("volatile_spending", {
      weight: 1.2,
      threshold: 0.5,
      activate: (input) => Math.sigmoid(input),
    });

    this.neurons.set("category_risk", {
      weight: 1.0,
      threshold: 0.8,
      activate: (input) => Math.pow(input, 2),
    });

    this.neurons.set("income_stability", {
      weight: 0.9,
      threshold: 0.2,
      activate: (input) => 1 - input,
    });
  }

  // Calculate financial signals from raw data
  private calculateSignals(
    transactions: Transaction[],
    budgetAnalysis: BudgetAnalysis | null
  ): FinancialSignals {
    const totalIncome =
      budgetAnalysis?.totalIncome ||
      transactions
        .filter((t) => t.type === "credit")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses =
      budgetAnalysis?.totalExpenses ||
      transactions
        .filter((t) => t.type === "debit")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const savingsRate =
      totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;

    // Calculate expense volatility using standard deviation
    const expensesByMonth = new Map<string, number>();
    transactions
      .filter((t) => t.type === "debit")
      .forEach((t) => {
        const month = t.date.substring(0, 7);
        expensesByMonth.set(month, (expensesByMonth.get(month) || 0) + Math.abs(t.amount));
      });

    const monthlyExpenses = Array.from(expensesByMonth.values());
    const avgExpense = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length;
    const variance =
      monthlyExpenses.reduce((sum, exp) => sum + Math.pow(exp - avgExpense, 2), 0) /
      monthlyExpenses.length;
    const expenseVolatility = Math.sqrt(variance) / avgExpense;

    // Calculate category concentration (Herfindahl index)
    const categoryExpenses = new Map<string, number>();
    transactions
      .filter((t) => t.type === "debit")
      .forEach((t) => {
        categoryExpenses.set(
          t.category,
          (categoryExpenses.get(t.category) || 0) + Math.abs(t.amount)
        );
      });

    const concentrations = Array.from(categoryExpenses.values()).map((exp) =>
      Math.pow(exp / totalExpenses, 2)
    );
    const categoryConcentration = concentrations.reduce((a, b) => a + b, 0);

    // Calculate spending trend
    const recentExpenses = transactions
      .filter((t) => t.type === "debit")
      .slice(0, Math.floor(transactions.length / 3))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const earlierExpenses = transactions
      .filter((t) => t.type === "debit")
      .slice(Math.floor((transactions.length * 2) / 3))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const spendingTrend = (recentExpenses - earlierExpenses) / earlierExpenses;

    // Calculate income stability
    const incomeByMonth = new Map<string, number>();
    transactions
      .filter((t) => t.type === "credit")
      .forEach((t) => {
        const month = t.date.substring(0, 7);
        incomeByMonth.set(month, (incomeByMonth.get(month) || 0) + t.amount);
      });

    const monthlyIncomes = Array.from(incomeByMonth.values());
    const avgIncome = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length;
    const incomeVariance =
      monthlyIncomes.reduce((sum, inc) => sum + Math.pow(inc - avgIncome, 2), 0) /
      monthlyIncomes.length;
    const incomeStability = 1 - Math.sqrt(incomeVariance) / avgIncome;

    return {
      savingsRate,
      expenseVolatility,
      categoryConcentration,
      spendingTrend,
      incomeStability,
    };
  }

  // Process signals through neural network
  private processNeuralLayer(signals: FinancialSignals): Record<string, number> {
    const activations: Record<string, number> = {};

    // High savings neuron
    const highSavingsNeuron = this.neurons.get("high_savings")!;
    activations.high_savings =
      signals.savingsRate > highSavingsNeuron.threshold
        ? highSavingsNeuron.activate(signals.savingsRate)
        : 0;

    // Overspending neuron
    const overspendingNeuron = this.neurons.get("overspending")!;
    activations.overspending =
      signals.savingsRate < 0
        ? overspendingNeuron.activate(Math.abs(signals.savingsRate))
        : 0;

    // Volatile spending neuron
    const volatilityNeuron = this.neurons.get("volatile_spending")!;
    activations.volatile_spending =
      signals.expenseVolatility > volatilityNeuron.threshold
        ? volatilityNeuron.activate(signals.expenseVolatility)
        : 0;

    // Category concentration neuron
    const categoryNeuron = this.neurons.get("category_risk")!;
    activations.category_risk =
      signals.categoryConcentration > categoryNeuron.threshold
        ? categoryNeuron.activate(signals.categoryConcentration)
        : 0;

    // Income stability neuron
    const incomeNeuron = this.neurons.get("income_stability")!;
    activations.income_stability =
      signals.incomeStability < incomeNeuron.threshold
        ? incomeNeuron.activate(1 - signals.incomeStability)
        : 0;

    return activations;
  }

  // Apply decision rules based on neural activations
  analyzeFinances(
    transactions: Transaction[],
    budgetAnalysis: BudgetAnalysis | null
  ): FinancialPattern[] {
    const signals = this.calculateSignals(transactions, budgetAnalysis);
    const activations = this.processNeuralLayer(signals);
    const patterns: FinancialPattern[] = [];

    // Rule 1: High savings detection
    if (activations.high_savings > 0.5) {
      patterns.push({
        id: "high_savings",
        confidence: Math.min(activations.high_savings, 1),
        recommendation:
          "Excellent savings rate! Consider investing excess cash or building an emergency fund.",
        severity: "low",
      });
    }

    // Rule 2: Overspending detection
    if (activations.overspending > 0.4) {
      patterns.push({
        id: "overspending",
        confidence: Math.min(activations.overspending, 1),
        recommendation:
          "You&apos;re spending more than you earn. Review your budget and identify discretionary spending to cut.",
        severity: "high",
      });
    }

    // Rule 3: Volatile spending detection
    if (activations.volatile_spending > 0.6) {
      patterns.push({
        id: "volatile_spending",
        confidence: Math.min(activations.volatile_spending, 1),
        recommendation:
          "Your spending varies significantly month-to-month. Create a consistent budget to stabilize finances.",
        severity: "medium",
      });
    }

    // Rule 4: Category concentration risk
    if (activations.category_risk > 0.5) {
      patterns.push({
        id: "category_concentration",
        confidence: Math.min(activations.category_risk, 1),
        recommendation:
          "Your spending is heavily concentrated in one or two categories. Diversify to reduce financial risk.",
        severity: "medium",
      });
    }

    // Rule 5: Income stability concern
    if (activations.income_stability > 0.4) {
      patterns.push({
        id: "income_instability",
        confidence: Math.min(activations.income_stability, 1),
        recommendation:
          "Your income varies significantly. Build a larger emergency fund to handle income fluctuations.",
        severity: "medium",
      });
    }

    // Rule 6: Spending trend analysis
    if (signals.spendingTrend > 0.15) {
      patterns.push({
        id: "increasing_spending",
        confidence: Math.min(Math.abs(signals.spendingTrend), 1),
        recommendation:
          "Your spending has increased recently. Take time to review recent transactions and adjust if needed.",
        severity: "medium",
      });
    } else if (signals.spendingTrend < -0.15) {
      patterns.push({
        id: "decreasing_spending",
        confidence: Math.min(Math.abs(signals.spendingTrend), 1),
        recommendation:
          "Great job! Your spending has decreased recently. Keep this momentum going.",
        severity: "low",
      });
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  // Generate enhanced contextual response using neural patterns
  generateEnhancedContext(
    transactions: Transaction[],
    budgetAnalysis: BudgetAnalysis | null,
    userQuestion: string
  ): string {
    const patterns = this.analyzeFinances(transactions, budgetAnalysis);
    const signals = this.calculateSignals(transactions, budgetAnalysis);

    const topPatterns = patterns.slice(0, 3);
    const patternContext =
      topPatterns.length > 0
        ? `\n## AI-Detected Financial Patterns\n${topPatterns
            .map((p) => `- **${p.id}** (Confidence: ${(p.confidence * 100).toFixed(0)}%): ${p.recommendation}`)
            .join("\n")}`
        : "";

    const signalMetrics = `
## Financial Health Metrics
- Savings Rate: ${(signals.savingsRate * 100).toFixed(1)}%
- Expense Volatility: ${(signals.expenseVolatility * 100).toFixed(1)}%
- Category Concentration: ${(signals.categoryConcentration * 100).toFixed(1)}%
- Spending Trend: ${signals.spendingTrend > 0 ? "↑" : "↓"} ${(signals.spendingTrend * 100).toFixed(1)}%
- Income Stability: ${(signals.incomeStability * 100).toFixed(1)}%`;

    return patternContext + "\n" + signalMetrics;
  }
}

// Helper function for sigmoid activation
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// Extend Math object with sigmoid if not present
if (!Math.sigmoid) {
  (Math as any).sigmoid = sigmoid;
}
