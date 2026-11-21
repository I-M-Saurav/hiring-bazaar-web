"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { QueryError } from "@/components/common/query-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import type { MatchResponse } from "@/lib/api/types";

/**
 * Ranked shortlist for one JD (blueprint Sections 3.2/3.3): bi-encoder
 * retrieval -> cross-encoder rerank -> hard constraints, then send the
 * selected candidates into the JD's pipeline.
 */
export function MatchPanel({ jdId }: { jdId: string }) {
  const withApi = useApi();
  const queryClient = useQueryClient();
  const [k, setK] = useState("25");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const match = useMutation({
    mutationFn: () => {
      const stage1 = Math.min(100, Math.max(1, Number(k) || 25));
      return withApi((api) => api.match({ jd_id: jdId, stage1_k: stage1 }));
    },
    onSuccess: (data: MatchResponse) => setSelected(new Set(data.candidates.slice(0, 5).map((c) => c.candidate_id))),
  });

  const shortlist = useMutation({
    mutationFn: () => {
      const rows = (match.data?.candidates ?? []).filter((c) => selected.has(c.candidate_id));
      return withApi((api) =>
        api.shortlist(jdId, rows.map((c) => ({ candidate_id: c.candidate_id, match_score: c.match_score }))),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      void queryClient.invalidateQueries({ queryKey: ["jd-applications", jdId] });
    },
  });

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ranked candidates</CardTitle>
        <CardDescription>
          Semantic retrieval over all profiles, reranked by a cross-encoder, then filtered by the JD&apos;s CGPA, branch
          and backlog rules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="k">Candidates to rerank</Label>
            <Input id="k" inputMode="numeric" className="w-28" value={k} onChange={(e) => setK(e.target.value)} />
          </div>
          <Button onClick={() => match.mutate()} disabled={match.isPending}>
            {match.isPending ? "Ranking…" : match.data ? "Re-run matching" : "Run matching"}
          </Button>
        </div>

        {match.error ? <QueryError error={match.error} title="Matching failed" /> : null}

        {match.data ? (
          <>
            <p className="text-sm text-muted-foreground">
              {match.data.retrieved} retrieved, {match.data.eligible} meet the rules (min CGPA{" "}
              {match.data.constraints.min_cgpa}
              {match.data.constraints.branches.length ? `, ${match.data.constraints.branches.join("/")}` : ""}, up to{" "}
              {match.data.constraints.max_backlogs} backlogs).
            </p>
            {match.data.candidates.length === 0 ? (
              <p className="text-sm">No eligible candidates yet for this role.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>#</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">CGPA</TableHead>
                    <TableHead className="text-right">Match</TableHead>
                    <TableHead className="text-right">Skills covered</TableHead>
                    <TableHead>Missing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {match.data.candidates.map((c) => (
                    <TableRow key={c.candidate_id}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${c.name ?? "candidate"}`}
                          checked={selected.has(c.candidate_id)}
                          onCheckedChange={(v) => toggle(c.candidate_id, v === true)}
                        />
                      </TableCell>
                      <TableCell>{c.rank}</TableCell>
                      <TableCell className="font-medium">{c.name ?? "—"}</TableCell>
                      <TableCell>{c.branch ?? "—"}</TableCell>
                      <TableCell className="text-right">{c.cgpa ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{c.match_score.toFixed(0)}</TableCell>
                      <TableCell className="text-right">{Math.round(c.skill_coverage * 100)}%</TableCell>
                      <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                        {c.missing_skills.join(", ") || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex flex-wrap items-center justify-end gap-3">
              {shortlist.error ? <QueryError error={shortlist.error} title="Could not send the shortlist" /> : null}
              {shortlist.data ? (
                <Alert className="max-w-md">
                  <AlertDescription>
                    Shortlisted {shortlist.data.created.length}
                    {shortlist.data.already_shortlisted.length
                      ? `; ${shortlist.data.already_shortlisted.length} were already in the pipeline`
                      : ""}
                    .
                  </AlertDescription>
                </Alert>
              ) : null}
              <Button onClick={() => shortlist.mutate()} disabled={selected.size === 0 || shortlist.isPending}>
                {shortlist.isPending ? "Sending…" : `Shortlist ${selected.size} selected`}
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
