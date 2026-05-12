import { NextRequest, NextResponse } from "next/server";
import type { Transaction, BudgetAnalysis } from "@/lib/types";
import { FinancialQAEngine } from "@/lib/qa-engine";

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

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        response: "Please add some transactions first to analyze your finances.",
        dataSource: "Validation",
        confidence: 1.0,
      });
    }

    // Initialize the Q&A engine with actual data
    const qaEngine = new FinancialQAEngine(transactions, budgetAnalysis);
    const result = qaEngine.answerQuestion(message);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process your question. Please try again." },
      { status: 500 }
    );
  }
}
