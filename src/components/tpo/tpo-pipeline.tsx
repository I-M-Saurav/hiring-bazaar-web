"use client";

import { useQuery } from "@tanstack/react-query";

import { QueryError } from "@/components/common/query-error";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";

const QUERY_KEY = ["pipeline", "tpo"];

export function TpoPipeline() {
  const withApi = useApi();
  const { data, error, isPending } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => withApi((api) => api.pipeline()),
  });

  if (isPending) return <Skeleton className="h-64" />;
  if (error) return <QueryError error={error} title="Could not load the pipeline" />;

  return (
    <PipelineBoard
      invalidate={[QUERY_KEY, ["tpo", "batch-analytics"]]}
      items={data.entries.map((e) => ({
        applicationId: e.application_id,
        candidateName: e.candidate_name,
        subtitle: [e.jd_title, e.company].filter(Boolean).join(" · ") || null,
        stage: e.stage,
        matchScore: e.match_score,
      }))}
    />
  );
}
