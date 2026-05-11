import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import type { Transaction } from "@/lib/types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function parseDate(dateStr: string): string {
  // Try various date formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // MM-DD-YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // M/D/YY or M/D/YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        return dateStr; // Already YYYY-MM-DD
      } else if (format === formats[1] || format === formats[2]) {
        const [, month, day, year] = match;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      } else if (format === formats[3]) {
        const [, month, day, yearStr] = match;
        const year = yearStr.length === 2 ? `20${yearStr}` : yearStr;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
  }

  // Fallback: try Date.parse
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
}

function parseAmount(amountStr: string): number {
  if (typeof amountStr === "number") return amountStr;
  const cleaned = amountStr.replace(/[$,]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    "Food & Dining": [
      "restaurant",
      "food",
      "dining",
      "cafe",
      "coffee",
      "pizza",
      "burger",
      "mcdonald",
      "starbucks",
      "subway",
      "kfc",
      "domino",
      "chipotle",
      "wendys",
      "taco",
      "diner",
    ],
    Groceries: [
      "grocery",
      "supermarket",
      "whole foods",
      "trader joe",
      "kroger",
      "safeway",
      "costco",
      "walmart",
      "target",
      "aldi",
    ],
    Shopping: [
      "amazon",
      "ebay",
      "best buy",
      "store",
      "shop",
      "retail",
      "mall",
      "clothing",
      "shoes",
      "fashion",
    ],
    Transportation: [
      "gas",
      "fuel",
      "uber",
      "lyft",
      "taxi",
      "metro",
      "bus",
      "train",
      "airline",
      "parking",
      "toll",
      "car",
      "auto",
      "shell",
      "chevron",
      "exxon",
    ],
    "Bills & Utilities": [
      "electric",
      "water",
      "internet",
      "phone",
      "cable",
      "utility",
      "rent",
      "mortgage",
      "insurance",
      "at&t",
      "verizon",
      "comcast",
      "pg&e",
    ],
    Entertainment: [
      "movie",
      "netflix",
      "spotify",
      "youtube",
      "gaming",
      "concert",
      "theater",
      "sports",
      "hulu",
      "disney",
      "hbo",
    ],
    Healthcare: [
      "doctor",
      "hospital",
      "pharmacy",
      "medical",
      "health",
      "clinic",
      "dental",
      "cvs",
      "walgreens",
    ],
    Education: [
      "tuition",
      "school",
      "college",
      "university",
      "course",
      "book",
      "education",
      "udemy",
      "coursera",
    ],
    Travel: [
      "hotel",
      "flight",
      "airline",
      "booking",
      "expedia",
      "airbnb",
      "vacation",
      "travel",
      "trip",
      "marriott",
      "hilton",
    ],
    "Personal Care": [
      "salon",
      "spa",
      "gym",
      "fitness",
      "beauty",
      "cosmetics",
    ],
    Income: [
      "salary",
      "payroll",
      "deposit",
      "refund",
      "bonus",
      "commission",
      "direct dep",
      "ach credit",
    ],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => desc.includes(keyword))) {
      return category;
    }
  }

  return "Other";
}

function findColumn(headers: string[], keywords: string[]): string | null {
  const normalizedHeaders = headers.map((h) =>
    h.toLowerCase().replace(/[_\s]/g, "")
  );

  for (const keyword of keywords) {
    const index = normalizedHeaders.findIndex((h) =>
      h.includes(keyword.toLowerCase().replace(/[_\s]/g, ""))
    );
    if (index !== -1) {
      return headers[index];
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      console.error("CSV parsing errors:", parsed.errors);
    }

    const headers = parsed.meta.fields || [];
    const rows = parsed.data as Record<string, string>[];

    // Find relevant columns
    const dateCol = findColumn(headers, ["date", "transaction_date", "trans_date", "posted_date"]);
    const amountCol = findColumn(headers, ["amount", "transaction_amount", "debit", "credit", "value"]);
    const descCol = findColumn(headers, ["description", "desc", "memo", "details", "particulars", "transaction"]);

    if (!dateCol || !amountCol || !descCol) {
      return NextResponse.json(
        {
          error:
            "Could not identify required columns. Please ensure your CSV has date, amount, and description columns.",
        },
        { status: 400 }
      );
    }

    const transactions: Transaction[] = rows
      .filter((row) => row[dateCol] && row[amountCol])
      .map((row) => {
        const amount = parseAmount(row[amountCol]);
        const description = row[descCol] || "Unknown";
        const category = categorizeTransaction(description);

        return {
          id: generateId(),
          date: parseDate(row[dateCol]),
          description: description.trim(),
          amount: Math.abs(amount),
          type: (amount < 0 || category === "Income" ? (category === "Income" ? "credit" : "debit") : "debit") as "debit" | "credit",
          category,
        };
      })
      .filter((t) => t.amount !== 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error processing CSV:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
