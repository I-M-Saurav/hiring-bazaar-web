"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { QueryError } from "@/components/common/query-error";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";

const FLAG_LABEL = {
  technical_bottleneck: "Technical-round risk",
  stale_profile: "Profile not updated",
  not_assessed: "Not assessed",
} as const;

const pct = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);
const num = (value: number | null) => (value === null ? "—" : value.toFixed(0));

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
  const distribution = [
    { band: "Ready", count: d.ready, className: "fill-success" },
    { band: "Needs prep", count: d.needs_prep, className: "fill-chart-3" },
    { band: "Behind", count: d.behind, className: "fill-destructive" },
    { band: "Not assessed", count: d.not_assessed, className: "fill-muted-foreground" },
  ];
  const p = data.pipeline;

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Readiness distribution</CardTitle>
            <CardDescription>Mean overall score: {data.mean_overall === null ? "—" : data.mean_overall.toFixed(0)}</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <XAxis dataKey="band" className="text-xs" tick={{ fill: "currentColor" }} />
                <YAxis allowDecimals={false} className="text-xs" tick={{ fill: "currentColor" }} />
                <Tooltip cursor={{ className: "fill-muted" }} />
                <Bar dataKey="count" radius={4}>
                  {distribution.map((row) => (
                    <Cell key={row.band} className={row.className} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline</CardTitle>
            <CardDescription>{p.total_applications} applications across all companies</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold">{pct(p.shortlist_to_interview_rate)}</p>
              <p className="text-xs text-muted-foreground">Shortlist → interview</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{pct(p.interview_to_offer_rate)}</p>
              <p className="text-xs text-muted-foreground">Interview → offer</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{pct(p.offer_acceptance_rate)}</p>
              <p className="text-xs text-muted-foreground">Offers accepted</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">By branch</CardTitle>
          <CardDescription>Mean scores per stage (0–100).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Assessed</TableHead>
                <TableHead className="text-right">Overall</TableHead>
                <TableHead className="text-right">Shortlisting</TableHead>
                <TableHead className="text-right">Technical</TableHead>
                <TableHead className="text-right">Offer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.by_branch.map((b) => (
                <TableRow key={b.branch}>
                  <TableCell className="font-medium">{b.branch}</TableCell>
                  <TableCell className="text-right">{b.candidates}</TableCell>
                  <TableCell className="text-right">{b.assessed}</TableCell>
                  <TableCell className="text-right">{num(b.mean_overall)}</TableCell>
                  <TableCell className="text-right">{num(b.mean_shortlisting)}</TableCell>
                  <TableCell className="text-right">{num(b.mean_technical)}</TableCell>
                  <TableCell className="text-right">{num(b.mean_offer)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most common gaps</CardTitle>
            <CardDescription>How many assessed students have each factor among their top gaps — workshop topics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.common_gaps.length === 0 ? <p className="text-sm text-muted-foreground">No gaps recorded yet.</p> : null}
            {data.common_gaps.map((gap) => (
              <div key={gap.feature} className="flex items-center justify-between text-sm">
                <span>{gap.label}</span>
                <span className="text-muted-foreground">
                  {gap.candidates} students ({pct(gap.share)})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Needs attention</CardTitle>
            <CardDescription>Students to follow up with.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.flags.length === 0 ? <p className="text-sm text-muted-foreground">Nobody flagged.</p> : null}
            {data.flags.map((flag) => (
              <div key={`${flag.candidate_id}-${flag.flag}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{flag.name ?? "Student"}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {flag.detail}
                  <Badge variant={flag.flag === "technical_bottleneck" ? "destructive" : "secondary"}>{FLAG_LABEL[flag.flag]}</Badge>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
