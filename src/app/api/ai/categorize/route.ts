import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import type { Transaction } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { transactions } = (await request.json()) as { transactions: Transaction[] };

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions provided" }, { status: 400 });
    }

    // Process in batches to avoid token limits
    const batchSize = 20;
    const categorizedTransactions: Transaction[] = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      const prompt = `You are a financial categorization AI. Categorize each transaction into exactly one of these categories:
- Food & Dining
- Groceries
- Shopping
- Transportation
- Bills & Utilities
- Entertainment
- Healthcare
- Education
- Travel
- Personal Care
- Income
- Other

Respond with a JSON array of objects with "id" and "category" fields. Only return the JSON, no other text.

Transactions to categorize:
${batch.map((t) => `ID: ${t.id}, Description: "${t.description}", Amount: $${t.amount}`).join("\n")}`;

      try {
        const { text } = await generateText({
          model: "groq/llama-3.1-8b-instant",
          system: "You are a financial transaction categorization assistant. Always respond with valid JSON only.",
          prompt,
          temperature: 0.1,
          maxOutputTokens: 1024,
        });

        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const categories = JSON.parse(jsonMatch[0]) as { id: string; category: string }[];
          
          batch.forEach((transaction) => {
            const categoryData = categories.find((c) => c.id === transaction.id);
            categorizedTransactions.push({
              ...transaction,
              category: categoryData?.category || transaction.category,
            });
          });
        } else {
          // If AI fails, keep original categories
          categorizedTransactions.push(...batch);
        }
      } catch {
        // If AI call fails for this batch, keep original categories
        categorizedTransactions.push(...batch);
      }
    }

    return NextResponse.json({ transactions: categorizedTransactions });
  } catch (error) {
    console.error("Error categorizing transactions:", error);
    return NextResponse.json(
      { error: "Failed to categorize transactions" },
      { status: 500 }
    );
  }
}
