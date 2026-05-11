"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFinanceStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AnomalyList() {
  const { anomalies } = useFinanceStore();

  if (anomalies.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Unusual Transactions</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {anomalies.length} detected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={cn(
                "p-3 rounded-lg border",
                anomaly.severity === "high"
                  ? "border-destructive/50 bg-destructive/10"
                  : anomaly.severity === "medium"
                    ? "border-warning/50 bg-warning/10"
                    : "border-border bg-secondary/50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "size-8 rounded-full flex items-center justify-center shrink-0",
                      anomaly.severity === "high"
                        ? "bg-destructive/20 text-destructive"
                        : anomaly.severity === "medium"
                          ? "bg-warning/20 text-warning"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
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
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {anomaly.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {anomaly.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(anomaly.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-destructive">
                    -${Math.abs(anomaly.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs mt-1",
                      anomaly.severity === "high"
                        ? "bg-destructive/20 text-destructive"
                        : anomaly.severity === "medium"
                          ? "bg-warning/20 text-warning"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {anomaly.severity}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {anomalies.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Review these transactions to ensure they are legitimate
          </p>
        )}
      </CardContent>
    </Card>
  );
}
