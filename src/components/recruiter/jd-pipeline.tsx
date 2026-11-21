"use client";

import { useQuery } from "@tanstack/react-query";

import { QueryError } from "@/components/common/query-error";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

/**
 * Pipeline for one JD, read straight from Supabase. RLS returns the
 * applications of the recruiter's own JDs, and candidates' names only for
 * people who applied to them (is_recruiter_of).
 */
export function JdPipeline({ jdId }: { jdId: string }) {
  const queryKey = ["jd-applications", jdId];
  const { data, error, isPending } = useQuery({
    queryKey,
    queryFn: async () => {
      const supabase = createClient();
      const { data: applications, error: appError } = await supabase
        .from("applications")
        .select("id, candidate_id, stage, match_score")
        .eq("jd_id", jdId)
        .order("updated_at", { ascending: false });
      if (appError) throw new Error(appError.message);
      const ids = [...new Set(applications.map((a) => a.candidate_id))];
      const { data: candidates, error: candError } = ids.length
        ? await supabase.from("candidates").select("id, name, branch, cgpa").in("id", ids)
        : { data: [], error: null };
      if (candError) throw new Error(candError.message);
      const byId = new Map(candidates.map((c) => [c.id, c]));
      return applications.map((a) => {
        const c = byId.get(a.candidate_id);
        return {
          applicationId: a.id,
          candidateName: c?.name ?? null,
          subtitle: c ? [c.branch, c.cgpa !== null ? `CGPA ${c.cgpa}` : null].filter(Boolean).join(" · ") : null,
          stage: a.stage,
          matchScore: a.match_score,
        };
      });
    },
  });

  if (isPending) return <Skeleton className="h-64" />;
  if (error) return <QueryError error={error} title="Could not load this JD's pipeline" />;
  return <PipelineBoard items={data} invalidate={[queryKey]} />;
}
