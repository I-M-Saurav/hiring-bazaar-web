"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { QueryError } from "@/components/common/query-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/use-api";
import type { JDCreateRequest } from "@/lib/api/types";
import { BRANCHES } from "@/lib/branches";

const ALL_COLLEGES = "all";

export function PostJdForm({ colleges }: { colleges: { id: string; name: string }[] }) {
  const withApi = useApi();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [packageLpa, setPackageLpa] = useState("");
  const [location, setLocation] = useState("");
  const [collegeId, setCollegeId] = useState<string>(colleges[0]?.id ?? ALL_COLLEGES);
  const [branches, setBranches] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);

  const create = useMutation({
    mutationFn: (body: JDCreateRequest) => withApi((api) => api.createJd(body)),
  });

  const submit = () => {
    const problems: string[] = [];
    if (!title.trim()) problems.push("Title is required.");
    if (!description.trim()) problems.push("Description is required.");
    const cgpa = minCgpa.trim() === "" ? 0 : Number(minCgpa);
    if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) problems.push("Minimum CGPA must be between 0 and 10.");
    const backlogs = Number(maxBacklogs || 0);
    if (!Number.isInteger(backlogs) || backlogs < 0) problems.push("Max backlogs must be a whole number.");
    const pkg = packageLpa.trim() === "" ? null : Number(packageLpa);
    if (pkg !== null && (!Number.isFinite(pkg) || pkg < 0)) problems.push("Package must be a positive number.");
    setErrors(problems);
    if (problems.length) return;
    create.mutate({
      title: title.trim(),
      description: description.trim(),
      required_skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      min_cgpa: cgpa,
      allowed_branches: [...branches],
      max_backlogs: backlogs,
      package_lpa: pkg,
      location: location.trim() || null,
      college_id: collegeId === ALL_COLLEGES ? null : collegeId,
    });
  };

  if (create.data) {
    return (
      <Alert>
        <AlertTitle>Job description posted</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{create.data.preview_match_count} registered candidates meet its CGPA, branch and backlog rules.</p>
          <Button asChild size="sm">
            <Link href={`/recruiter/jobs/${create.data.jd_id}`}>See ranked candidates</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role</CardTitle>
          <CardDescription>The description and skills are what candidates are semantically matched against.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Machine Learning Engineer" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skills">Required skills (comma-separated)</Label>
            <Input id="skills" placeholder="Python, PyTorch, SQL" value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="package">Package (LPA)</Label>
              <Input id="package" inputMode="decimal" value={packageLpa} onChange={(e) => setPackageLpa(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="college">Post to college</Label>
              <Select value={collegeId} onValueChange={setCollegeId}>
                <SelectTrigger id="college">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={ALL_COLLEGES}>All colleges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eligibility rules</CardTitle>
          <CardDescription>Hard filters, applied after ranking — they never change the ML scores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cgpa">Minimum CGPA</Label>
              <Input id="cgpa" inputMode="decimal" placeholder="0" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="backlogs">Max active backlogs</Label>
              <Input id="backlogs" inputMode="numeric" value={maxBacklogs} onChange={(e) => setMaxBacklogs(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Allowed branches (none selected = all branches)</Label>
            <div className="flex flex-wrap gap-4">
              {BRANCHES.map((b) => (
                <label key={b.code} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={branches.has(b.code)}
                    onCheckedChange={(v) =>
                      setBranches((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(b.code);
                        else next.delete(b.code);
                        return next;
                      })
                    }
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {errors.length ? (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      {create.error ? <QueryError error={create.error} title="Could not post the JD" /> : null}
      <div className="flex justify-end">
        <Button size="lg" onClick={submit} disabled={create.isPending}>
          {create.isPending ? "Posting…" : "Post job description"}
        </Button>
      </div>
    </div>
  );
}
