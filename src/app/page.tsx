"use client";

import { Header } from "@/components/header";
import { FileUpload } from "@/components/file-upload";
import { StatCard } from "@/components/stat-card";
import { SpendingChart } from "@/components/spending-chart";
import { TrendChart } from "@/components/trend-chart";
import { TransactionList } from "@/components/transaction-list";
import { AIChat } from "@/components/ai-chat";
import { BudgetInsights } from "@/components/budget-insights";
import { ForecastPanel } from "@/components/forecast-panel";
import { AnomalyList } from "@/components/anomaly-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFinanceStore } from "@/lib/store";

export default function Home() {
  const { transactions, budgetAnalysis, error } = useFinanceStore();

  const hasData = transactions.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!hasData ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-3">
                Welcome to Your AI Finance Advisor
              </h2>
              <p className="text-muted-foreground text-lg">
                Upload your bank statement to get AI-powered insights, budget recommendations, and personalized financial advice.
              </p>
            </div>

            <FileUpload />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-card border border-border">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="size-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Smart Categorization</h3>
                <p className="text-sm text-muted-foreground">
                  AI automatically categorizes your transactions for better insights
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card border border-border">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="size-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Talk to Your Expenses</h3>
                <p className="text-sm text-muted-foreground">
                  Ask questions like &quot;Why did I spend so much last month?&quot;
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card border border-border">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="size-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Expense Forecasting</h3>
                <p className="text-sm text-muted-foreground">
                  Predict future expenses and plan your budget accordingly
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Income"
                value={`$${(budgetAnalysis?.totalIncome || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={
                  <svg
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                trend="up"
                trendValue="Income"
              />
              <StatCard
                title="Total Expenses"
                value={`$${(budgetAnalysis?.totalExpenses || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={
                  <svg
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Net Savings"
                value={`$${(budgetAnalysis?.netSavings || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={
                  <svg
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
                trend={(budgetAnalysis?.netSavings || 0) >= 0 ? "up" : "down"}
                trendValue={`${(budgetAnalysis?.savingsRate || 0).toFixed(1)}% rate`}
              />
              <StatCard
                title="Health Score"
                value={budgetAnalysis?.healthGrade || "N/A"}
                subtitle={`${budgetAnalysis?.healthScore || 0}/100`}
                icon={
                  <svg
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                }
              />
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="chat">AI Chat</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SpendingChart />
                  <TrendChart />
                  <ForecastPanel />
                  <AnomalyList />
                </div>
              </TabsContent>

              <TabsContent value="analysis">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BudgetInsights />
                  <div className="flex flex-col gap-6">
                    <ForecastPanel />
                    <AnomalyList />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="chat">
                <div className="max-w-4xl mx-auto">
                  <AIChat />
                </div>
              </TabsContent>

              <TabsContent value="transactions">
                <TransactionList />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>AI Personal Finance Advisor - Your smart money management companion</p>
          <p className="mt-1">Powered by Groq AI for intelligent financial insights</p>
        </div>
      </footer>
    </div>
  );
}
