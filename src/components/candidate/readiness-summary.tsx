"use client";

import { useQuery } from "@tanstack/react-query";

import { QueryError } from "@/components/common/query-error";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";

function band(score: number): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (score > 70) return { label: "Placement-ready", variant: "default" };
  if (score >= 40) return { label: "Needs prep", variant: "secondary" };
  return { label: "Significantly behind", variant: "destructive" };
}

export function ReadinessSummary({ candidateId }: { candidateId: string }) {
  const withApi = useApi();
  const { data, error, isPending } = useQuery({
    queryKey: ["readiness", candidateId],
    queryFn: () => withApi((api) => api.readiness(candidateId)),
  });

  if (isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }
  if (error) return <QueryError error={error} title="Could not compute your readiness" />;

  const { readiness } = data;
  const overall = band(readiness.overall_readiness);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardDescription>Overall placement score</CardDescription>
            <CardTitle className="text-4xl">{readiness.overall_readiness.toFixed(0)}/100</CardTitle>
          </div>
          <Badge variant={overall.variant}>{overall.label}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{readiness.recommendation}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            A typical candidate scores {readiness.reference_overall_readiness.toFixed(0)}.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {readiness.stages.map((stage) => (
          <Card key={stage.key}>
            <CardHeader className="pb-2">
              <CardDescription>{stage.name}</CardDescription>
              <CardTitle className="text-3xl">{stage.probability.toFixed(0)}%</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={stage.probability} />
              <p className="text-xs text-muted-foreground">Typical candidate: {stage.reference_probability.toFixed(0)}%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {readiness.top_gaps.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What to work on first</CardTitle>
            <CardDescription>The factors pulling your overall score down the most, and what to do about them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {readiness.top_gaps.map((gap) => (
              <div key={gap.feature} className="space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{gap.label}</span>
                  <span className="text-sm text-destructive">{gap.overall_points.toFixed(1)} pts</span>
                </div>
                <p className="text-xs text-muted-foreground">{gap.value_display}</p>
                <p className="text-sm">{gap.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">{readiness.disclaimer}</p>
    </div>
  );
}
