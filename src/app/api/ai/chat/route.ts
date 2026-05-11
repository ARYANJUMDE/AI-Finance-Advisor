import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import type { Transaction, BudgetAnalysis } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { message, transactions, budgetAnalysis } = (await request.json()) as {
      message: string;
      transactions: Transaction[];
      budgetAnalysis: BudgetAnalysis | null;
    };

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Build context about user's finances
    const totalExpenses = transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalIncome = transactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = transactions
      .filter((t) => t.type === "debit")
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
          return acc;
        },
        {} as Record<string, number>
      );

    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`);

    const recentTransactions = transactions.slice(0, 10);

    const context = `
## User's Financial Summary
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Savings: $${(totalIncome - totalExpenses).toFixed(2)}
- Savings Rate: ${totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%
- Financial Health Score: ${budgetAnalysis?.healthScore || "N/A"}/100 (Grade: ${budgetAnalysis?.healthGrade || "N/A"})

## Top Spending Categories
${topCategories.join("\n")}

## Recent Transactions
${recentTransactions.map((t) => `- ${t.date}: ${t.description} - $${Math.abs(t.amount).toFixed(2)} (${t.category})`).join("\n")}

## Total Transactions Analyzed: ${transactions.length}
`;

    const systemPrompt = `You are an expert AI Personal Finance Advisor. You help users understand their spending patterns, provide budget suggestions, savings recommendations, and answer questions about their finances.

Be conversational, helpful, and specific. Reference actual numbers from their data when relevant. Provide actionable advice.

If asked about why they spent so much, analyze their spending patterns and identify the main contributors.
If asked about savings, calculate and suggest specific savings goals.
If asked about budgets, provide specific budget recommendations based on their spending.
If asked general questions, provide helpful financial education.

Always be encouraging and supportive while being honest about areas for improvement.

${context}`;

    const { text } = await generateText({
      model: "groq/llama-3.3-70b-versatile",
      system: systemPrompt,
      prompt: message,
      temperature: 0.7,
      maxOutputTokens: 1024,
    });

    const response = text || "I apologize, but I couldn't generate a response. Please try again.";

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process your question. Please try again." },
      { status: 500 }
    );
  }
}
