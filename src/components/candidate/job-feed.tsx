"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { QueryError } from "@/components/common/query-error";
import { StageBadge } from "@/components/common/stage-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";

export function JobFeed() {
  const withApi = useApi();
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [location, setLocation] = useState("");
  const [minPackage, setMinPackage] = useState("");
  const minPackageNumber = Number(minPackage);
  const filters = {
    eligible_only: eligibleOnly || undefined,
    location: location.trim() || undefined,
    min_package_lpa: minPackage && Number.isFinite(minPackageNumber) ? minPackageNumber : undefined,
  };

  const { data, error, isPending } = useQuery({
    queryKey: ["matched-jds", filters],
    queryFn: () => withApi((api) => api.matchedJds(filters)),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="e.g. Bengaluru" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="package">Minimum package (LPA)</Label>
            <Input id="package" inputMode="decimal" className="w-32" value={minPackage} onChange={(e) => setMinPackage(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Checkbox id="eligible" checked={eligibleOnly} onCheckedChange={(v) => setEligibleOnly(v === true)} />
            <Label htmlFor="eligible">Only roles I am eligible for</Label>
          </div>
        </CardContent>
      </Card>

      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : error ? (
        <QueryError error={error} title="Could not load matching roles" />
      ) : data.jds.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active roles match these filters right now.</p>
      ) : (
        <div className="space-y-3">
          {data.jds.map((jd) => (
            <Card key={jd.jd_id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{jd.title}</CardTitle>
                  <CardDescription>
                    {[jd.location, jd.package_lpa ? `${jd.package_lpa} LPA` : null].filter(Boolean).join(" · ") || "—"}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-2xl font-semibold">{jd.match_score.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">match</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {jd.application_stage ? <StageBadge stage={jd.application_stage} /> : null}
                  {jd.eligible ? (
                    <Badge variant="outline">Eligible</Badge>
                  ) : (
                    <Badge variant="destructive">Not eligible</Badge>
                  )}
                  {jd.ineligible_reasons.map((reason) => (
                    <span key={reason} className="text-sm text-destructive">
                      {reason}
                    </span>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Required skills you have</span>
                    <span>{Math.round(jd.skill_coverage * 100)}%</span>
                  </div>
                  <Progress value={jd.skill_coverage * 100} />
                </div>
                {jd.missing_skills.length ? (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Missing: </span>
                    {jd.missing_skills.join(", ")}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
