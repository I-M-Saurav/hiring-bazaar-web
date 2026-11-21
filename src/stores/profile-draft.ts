"use client";

import { create } from "zustand";

import type { CandidateProfileInput, ParsedResume } from "@/lib/api/types";
import { toBranchCode } from "@/lib/branches";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Form state for the candidate profile editor. Numbers are kept as strings
 * while editing (empty = not given) and converted on save. Kept in a store so
 * a parsed-but-unsaved resume survives navigating between pages.
 */
export interface ProjectDraft {
  title: string;
  description: string;
  year: string;
  tech: string;
}

export interface InternshipDraft {
  company: string;
  role: string;
  tier: "" | "1" | "2" | "3";
  year: string;
  months: string;
}

export interface ProfileDraft {
  name: string;
  branch: string;
  batchYear: string;
  cgpa: string;
  backlogs: string;
  cpRating: string;
  cpPlatform: string;
  skills: string;
  projects: ProjectDraft[];
  internships: InternshipDraft[];
}

export interface CandidateRowForDraft {
  name: string | null;
  branch: string | null;
  batch_year: number | null;
  cgpa: number | null;
  backlogs: number | null;
  cp_rating: number | null;
  cp_platform: string | null;
  skills: Json | null;
  projects: Json | null;
  internships: Json | null;
}

const text = (v: unknown): string => (v === null || v === undefined ? "" : String(v));
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** The object entries of a JSONB array column, typed for field access. */
function objectList(value: Json | null | undefined): Record<string, unknown>[] {
  return Array.isArray(value) ? value.flatMap((item) => (isObject(item) ? [item] : [])) : [];
}

function stringList(value: Json | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return [item];
    if (isObject(item) && typeof item.name === "string") return [item.name];
    return [];
  });
}

function tierDraft(value: unknown): InternshipDraft["tier"] {
  return value === 1 || value === 2 || value === 3 ? (String(value) as InternshipDraft["tier"]) : "";
}

export function draftFromRow(row: CandidateRowForDraft | null): ProfileDraft {
  const projects = objectList(row?.projects);
  const internships = objectList(row?.internships);
  return {
    name: text(row?.name),
    branch: text(row?.branch),
    batchYear: text(row?.batch_year),
    cgpa: text(row?.cgpa),
    backlogs: text(row?.backlogs ?? 0),
    cpRating: text(row?.cp_rating),
    cpPlatform: text(row?.cp_platform),
    skills: stringList(row?.skills ?? null).join(", "),
    projects: projects.map((p) => ({
      title: text(p.title),
      description: text(p.description),
      year: text(p.year),
      tech: Array.isArray(p.tech_stack) ? p.tech_stack.filter((t): t is string => typeof t === "string").join(", ") : "",
    })),
    internships: internships.map((i) => ({
      company: text(i.company),
      role: text(i.role),
      tier: tierDraft(i.tier),
      year: text(i.year),
      months: text(i.duration_months),
    })),
  };
}

/** Fill the draft from a parsed resume. Parsed values win; fields the parser didn't find are kept. */
export function mergeParsed(draft: ProfileDraft, parsed: ParsedResume): ProfileDraft {
  const cfRating = parsed.cp_handles.codeforces_rating;
  const lcRating = parsed.cp_handles.leetcode_rating;
  const rating = typeof cfRating === "number" ? cfRating : typeof lcRating === "number" ? lcRating : null;
  return {
    ...draft,
    name: parsed.name ?? draft.name,
    branch: toBranchCode(parsed.branch) ?? draft.branch,
    batchYear: parsed.graduation_year ? String(parsed.graduation_year) : draft.batchYear,
    cgpa: parsed.cgpa !== null ? String(parsed.cgpa) : draft.cgpa,
    cpRating: rating !== null ? String(rating) : draft.cpRating,
    cpPlatform: typeof cfRating === "number" ? "codeforces" : typeof lcRating === "number" ? "leetcode" : draft.cpPlatform,
    skills: parsed.skills.length ? parsed.skills.join(", ") : draft.skills,
    projects: parsed.projects.length
      ? parsed.projects.map((p) => ({
          title: p.title ?? "",
          description: p.description,
          year: p.year ? String(p.year) : "",
          tech: p.tech_stack.join(", "),
        }))
      : draft.projects,
    internships: parsed.internships.length
      ? parsed.internships.map((i) => ({
          company: i.company ?? "",
          role: i.role ?? "",
          tier: tierDraft(i.tier),
          year: i.year ? String(i.year) : "",
          months: i.duration_months ? String(i.duration_months) : "",
        }))
      : draft.internships,
  };
}

function optionalNumber(value: string, label: string, errors: string[], { integer = false, min = 0, max = Infinity } = {}) {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || (integer && !Number.isInteger(n)) || n < min || n > max) {
    errors.push(`${label} must be ${integer ? "a whole number" : "a number"} between ${min} and ${max}.`);
    return null;
  }
  return n;
}

const splitList = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Validate and convert the draft into the API payload. */
export function draftToInput(draft: ProfileDraft): { input: CandidateProfileInput | null; errors: string[] } {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push("Name is required.");
  const cgpa = optionalNumber(draft.cgpa, "CGPA", errors, { max: 10 });
  const backlogs = optionalNumber(draft.backlogs, "Backlogs", errors, { integer: true, max: 100 }) ?? 0;
  const cpRating = optionalNumber(draft.cpRating, "CP rating", errors, { integer: true, max: 4000 });
  const batchYear = optionalNumber(draft.batchYear, "Batch year", errors, { integer: true, min: 1990, max: 2100 });

  const projects = draft.projects
    .filter((p) => p.title.trim())
    .map((p, i) => ({
      title: p.title.trim(),
      description: p.description.trim(),
      year: optionalNumber(p.year, `Project ${i + 1} year`, errors, { integer: true, min: 1990, max: 2100 }),
      tech_stack: splitList(p.tech),
    }));
  const internships = draft.internships
    .filter((i) => i.company.trim())
    .map((i, n) => ({
      company: i.company.trim(),
      role: i.role.trim() || null,
      tier: i.tier === "" ? null : (Number(i.tier) as 1 | 2 | 3),
      year: optionalNumber(i.year, `Internship ${n + 1} year`, errors, { integer: true, min: 1990, max: 2100 }),
      duration_months: optionalNumber(i.months, `Internship ${n + 1} duration`, errors, { integer: true, max: 60 }),
    }));

  if (errors.length) return { input: null, errors };
  return {
    errors,
    input: {
      name: draft.name.trim(),
      branch: draft.branch.trim() || null,
      batch_year: batchYear,
      cgpa,
      backlogs,
      cp_rating: cpRating,
      cp_platform: draft.cpPlatform.trim() || null,
      skills: splitList(draft.skills),
      projects,
      internships,
    },
  };
}

interface ProfileDraftState {
  draft: ProfileDraft | null;
  setDraft: (draft: ProfileDraft) => void;
  update: (patch: Partial<ProfileDraft>) => void;
  clear: () => void;
}

export const useProfileDraft = create<ProfileDraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  update: (patch) => set((state) => (state.draft ? { draft: { ...state.draft, ...patch } } : state)),
  clear: () => set({ draft: null }),
}));
