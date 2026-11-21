"use client";

import { useQuery } from "@tanstack/react-query";

import { QueryError } from "@/components/common/query-error";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";

export function BatchOverview() {
  const withApi = useApi();
  const { data, error, isPending } = useQuery({
    queryKey: ["tpo", "batch-analytics"],
    queryFn: () => withApi((api) => api.batchAnalytics()),
  });

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }
  if (error) return <QueryError error={error} title="Could not load batch analytics" />;

  const d = data.readiness_distribution;
  const tiles = [
    { label: "Registered students", value: data.total_candidates },
    { label: "Placement-ready (> 70)", value: d.ready },
    { label: "Needs prep (40–70)", value: d.needs_prep },
    { label: "Significantly behind (< 40)", value: d.behind },
    { label: "Not assessed yet", value: d.not_assessed },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardHeader>
            <CardDescription>{tile.label}</CardDescription>
            <CardTitle className="text-3xl">{tile.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
