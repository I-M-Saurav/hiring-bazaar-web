"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { QueryError } from "@/components/common/query-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/use-api";
import { BRANCHES } from "@/lib/branches";
import {
  draftFromRow,
  draftToInput,
  mergeParsed,
  useProfileDraft,
  type CandidateRowForDraft,
  type InternshipDraft,
  type ProfileDraft,
  type ProjectDraft,
} from "@/stores/profile-draft";

const EMPTY_PROJECT: ProjectDraft = { title: "", description: "", year: "", tech: "" };
const EMPTY_INTERNSHIP: InternshipDraft = { company: "", role: "", tier: "", year: "", months: "" };
const NO_TIER = "none";

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ProfileEditor({ row, candidateId }: { row: CandidateRowForDraft | null; candidateId: string }) {
  const withApi = useApi();
  const queryClient = useQueryClient();
  const { draft, setDraft, update } = useProfileDraft();
  const fileInput = useRef<HTMLInputElement>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parsedSummary, setParsedSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) setDraft(draftFromRow(row));
  }, [draft, row, setDraft]);

  const parse = useMutation({
    mutationFn: (file: File) => withApi((api) => api.parseResume(file)),
    onSuccess: (parsed) => {
      setDraft(mergeParsed(useProfileDraft.getState().draft ?? draftFromRow(row), parsed));
      const semantic = parsed.skill_evidence.filter((s) => s.method === "semantic").length;
      setParsedSummary(
        `Found ${parsed.skills.length} skills${semantic ? ` (${semantic} by meaning)` : ""}, ` +
          `${parsed.projects.length} projects and ${parsed.internships.length} internships. Review them below, then save.`,
      );
    },
  });

  const save = useMutation({
    mutationFn: (input: NonNullable<ReturnType<typeof draftToInput>["input"]>) => withApi((api) => api.saveProfile(input)),
    onSuccess: (result) => {
      queryClient.setQueryData(["readiness", candidateId], result.readiness);
      void queryClient.invalidateQueries({ queryKey: ["matched-jds"] });
    },
  });

  if (!draft) return null;

  const set = <K extends keyof ProfileDraft>(key: K) => (value: ProfileDraft[K]) => update({ [key]: value });
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) parse.mutate(file);
    event.target.value = "";
  };
  const onSave = () => {
    const { input, errors } = draftToInput(draft);
    setValidationErrors(errors);
    if (input) save.mutate(input);
  };
  const editProject = (i: number, patch: Partial<ProjectDraft>) =>
    update({ projects: draft.projects.map((p, n) => (n === i ? { ...p, ...patch } : p)) });
  const editInternship = (i: number, patch: Partial<InternshipDraft>) =>
    update({ internships: draft.internships.map((p, n) => (n === i ? { ...p, ...patch } : p)) });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Start from your resume</CardTitle>
          <CardDescription>
            Upload a PDF (up to 10 MB). We extract your details, skills, projects, internships and competitive
            programming rating, and you can correct anything before saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input ref={fileInput} type="file" accept="application/pdf" className="hidden" onChange={onFile} />
          <Button onClick={() => fileInput.current?.click()} disabled={parse.isPending}>
            <Upload className="h-4 w-4" />
            {parse.isPending ? "Reading your resume…" : "Upload resume PDF"}
          </Button>
          {parse.error ? <QueryError error={parse.error} title="Could not read that resume" /> : null}
          {parsedSummary ? <p className="text-sm text-muted-foreground">{parsedSummary}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="name" label="Full name">
            <Input id="name" value={draft.name} onChange={(e) => set("name")(e.target.value)} />
          </Field>
          <Field id="branch" label="Branch">
            <Select value={draft.branch || undefined} onValueChange={set("branch")}>
              <SelectTrigger id="branch">
                <SelectValue placeholder="Select your branch" />
              </SelectTrigger>
              <SelectContent>
                {BRANCHES.map((b) => (
                  <SelectItem key={b.code} value={b.code}>
                    {b.label}
                  </SelectItem>
                ))}
                {draft.branch && !BRANCHES.some((b) => b.code === draft.branch) ? (
                  <SelectItem value={draft.branch}>{draft.branch}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </Field>
          <Field id="batch" label="Graduation year">
            <Input id="batch" inputMode="numeric" value={draft.batchYear} onChange={(e) => set("batchYear")(e.target.value)} />
          </Field>
          <Field id="cgpa" label="CGPA (out of 10)">
            <Input id="cgpa" inputMode="decimal" value={draft.cgpa} onChange={(e) => set("cgpa")(e.target.value)} />
          </Field>
          <Field id="backlogs" label="Active backlogs">
            <Input id="backlogs" inputMode="numeric" value={draft.backlogs} onChange={(e) => set("backlogs")(e.target.value)} />
          </Field>
          <Field id="cp" label="Competitive programming rating" hint="Your highest Codeforces or LeetCode contest rating.">
            <Input id="cp" inputMode="numeric" value={draft.cpRating} onChange={(e) => set("cpRating")(e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skills</CardTitle>
          <CardDescription>
            Comma-separated. Depth matters more than count: basic tools like MS Office lower your skill-depth score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea rows={3} value={draft.skills} onChange={(e) => set("skills")(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">Projects</CardTitle>
            <CardDescription>Recent projects count for more than older ones.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => update({ projects: [...draft.projects, { ...EMPTY_PROJECT }] })}>
            <Plus className="h-4 w-4" /> Add project
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.projects.length === 0 ? <p className="text-sm text-muted-foreground">No projects yet.</p> : null}
          {draft.projects.map((p, i) => (
            <div key={i} className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_7rem_auto]">
              <Input aria-label="Project title" placeholder="Title" value={p.title} onChange={(e) => editProject(i, { title: e.target.value })} />
              <Input aria-label="Project year" placeholder="Year" inputMode="numeric" value={p.year} onChange={(e) => editProject(i, { year: e.target.value })} />
              <Button variant="ghost" size="icon" aria-label="Remove project" onClick={() => update({ projects: draft.projects.filter((_, n) => n !== i) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Textarea aria-label="Project description" placeholder="What you built" rows={2} className="sm:col-span-3" value={p.description} onChange={(e) => editProject(i, { description: e.target.value })} />
              <Input aria-label="Project technologies" placeholder="Technologies, comma-separated" className="sm:col-span-3" value={p.tech} onChange={(e) => editProject(i, { tech: e.target.value })} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">Internships</CardTitle>
            <CardDescription>Company tier: top-tier/FAANG, product company, or service company.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => update({ internships: [...draft.internships, { ...EMPTY_INTERNSHIP }] })}>
            <Plus className="h-4 w-4" /> Add internship
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.internships.length === 0 ? <p className="text-sm text-muted-foreground">No internships yet.</p> : null}
          {draft.internships.map((it, i) => (
            <div key={i} className="grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_11rem_6rem_6rem_auto]">
              <Input aria-label="Company" placeholder="Company" value={it.company} onChange={(e) => editInternship(i, { company: e.target.value })} />
              <Input aria-label="Role" placeholder="Role" value={it.role} onChange={(e) => editInternship(i, { role: e.target.value })} />
              <Select value={it.tier || NO_TIER} onValueChange={(v) => editInternship(i, { tier: v === NO_TIER ? "" : (v as InternshipDraft["tier"]) })}>
                <SelectTrigger aria-label="Company tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TIER}>Tier unknown</SelectItem>
                  <SelectItem value="1">Top-tier / FAANG</SelectItem>
                  <SelectItem value="2">Product company</SelectItem>
                  <SelectItem value="3">Service company</SelectItem>
                </SelectContent>
              </Select>
              <Input aria-label="Internship year" placeholder="Year" inputMode="numeric" value={it.year} onChange={(e) => editInternship(i, { year: e.target.value })} />
              <Input aria-label="Duration in months" placeholder="Months" inputMode="numeric" value={it.months} onChange={(e) => editInternship(i, { months: e.target.value })} />
              <Button variant="ghost" size="icon" aria-label="Remove internship" onClick={() => update({ internships: draft.internships.filter((_, n) => n !== i) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {validationErrors.length ? (
        <Alert variant="destructive">
          <AlertTitle>Please fix these first</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {validationErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      {save.error ? <QueryError error={save.error} title="Could not save your profile" /> : null}
      {save.data ? (
        <Alert>
          <AlertTitle>Profile saved</AlertTitle>
          <AlertDescription>
            Your overall placement score is now {save.data.readiness.readiness.overall_readiness.toFixed(0)}/100.{" "}
            <Link href="/candidate/dashboard" className="font-medium underline underline-offset-4">
              See the full breakdown
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button size="lg" onClick={onSave} disabled={save.isPending}>
          {save.isPending ? "Saving and scoring…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}
