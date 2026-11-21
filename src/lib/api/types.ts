/**
 * Response/request shapes of the FastAPI service (hiring-bazaar-api,
 * app/models/*.py). Keep in sync with the Pydantic models; all scores and
 * probabilities are on a 0-100 scale unless noted.
 */

import type { ApplicationStage } from "@/lib/supabase/database.types";

export type { ApplicationStage };

// --- Readiness (GET /api/readiness/{id}) -------------------------------------------
export interface FeatureContribution {
  feature: string;
  label: string;
  value: number;
  value_display: string;
  points: number;
}

export interface StageExplanation {
  key: "shortlisting" | "technical" | "offer";
  name: string;
  probability: number;
  reference_probability: number;
  contributions: FeatureContribution[];
}

export interface FeatureImpact {
  feature: string;
  label: string;
  value_display: string;
  overall_points: number;
  stages: string[];
}

export interface ReadinessGap extends FeatureImpact {
  actionable: boolean;
  recommendation: string;
}

export interface ReadinessResult {
  recommendation: string;
  overall_readiness: number;
  reference_overall_readiness: number;
  end_to_end_probability: number;
  stages: StageExplanation[];
  feature_impacts: FeatureImpact[];
  top_gaps: ReadinessGap[];
  strengths: FeatureImpact[];
  reference: string;
  disclaimer: string;
}

export interface ReadinessResponse {
  candidate_id: string;
  computed_at: string;
  target_roles: { source: "college_active_jds" | "all_active_jds" | "reference_roles"; count: number };
  readiness: ReadinessResult;
}

// --- Candidate profile (PUT /api/candidate/profile) -------------------------------------
export interface ProjectInput {
  title: string;
  description: string;
  year: number | null;
  tech_stack: string[];
}

export interface InternshipInput {
  company: string;
  role: string | null;
  /** companies.tier convention: 1 FAANG/top-tier, 2 product, 3 service */
  tier: 1 | 2 | 3 | null;
  year: number | null;
  duration_months: number | null;
}

export interface CandidateProfileInput {
  name: string;
  branch: string | null;
  batch_year: number | null;
  cgpa: number | null;
  backlogs: number;
  cp_rating: number | null;
  cp_platform: string | null;
  skills: string[];
  projects: ProjectInput[];
  internships: InternshipInput[];
}

export interface ProfileSaveResponse {
  candidate_id: string;
  skill_depth_score: number;
  resume_completeness: number;
  cgpa_percentile_in_branch: number | null;
  embedded: boolean;
  readiness: ReadinessResponse;
}

// --- Resume parsing (POST /api/parse-resume) ------------------------------------------
export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  cgpa: number | null;
  branch: string | null;
  graduation_year: number | null;
  skills: string[];
  skill_evidence: { skill: string; method: "pattern" | "semantic"; evidence: string; score: number | null }[];
  unrecognised_skill_phrases: string[];
  projects: {
    title: string | null;
    organization: string | null;
    description: string;
    year: number | null;
    dates: string | null;
    tech_stack: string[];
  }[];
  internships: {
    role: string | null;
    company: string | null;
    tier: number | null;
    year: number | null;
    dates: string | null;
    duration_months: number | null;
    description: string;
  }[];
  cp_handles: Record<string, string | number>;
  sections_found: string[];
  resume_completeness_score: number;
  page_count: number;
}

// --- Matching (POST /api/match, POST /api/jd) --------------------------------------
export interface MatchedCandidate {
  rank: number;
  candidate_id: string;
  name: string | null;
  branch: string | null;
  cgpa: number | null;
  match_score: number;
  cross_encoder_score: number;
  bi_encoder_similarity: number;
  skill_coverage: number;
  matched_skills: string[];
  missing_skills: string[];
}

export interface MatchResponse {
  jd_id: string;
  title: string;
  stage1_k: number;
  retrieved: number;
  eligible: number;
  constraints: { min_cgpa: number; branches: string[]; max_backlogs: number };
  candidates: MatchedCandidate[];
}

export interface MatchRequest {
  jd_id: string;
  constraints?: { min_cgpa?: number; branches?: string[]; max_backlogs?: number };
  stage1_k?: number;
}

export interface JDCreateRequest {
  title: string;
  description: string;
  required_skills: string[];
  min_cgpa?: number;
  allowed_branches?: string[];
  max_backlogs?: number;
  package_lpa?: number | null;
  location?: string | null;
  college_id?: string | null;
}

export interface JDCreateResponse {
  jd_id: string;
  preview_match_count: number;
}

// --- Candidate JD feed (GET /api/candidate/matched-jds) --------------------------------
export interface MatchedJD {
  jd_id: string;
  title: string;
  location: string | null;
  package_lpa: number | null;
  match_score: number;
  skill_coverage: number;
  matched_skills: string[];
  missing_skills: string[];
  eligible: boolean;
  ineligible_reasons: string[];
  application_stage: ApplicationStage | null;
}

export interface MatchedJDsResponse {
  candidate_id: string;
  total: number;
  jds: MatchedJD[];
}

// --- Pipeline (shortlist, stage) ------------------------------------------------------
export interface ShortlistResponse {
  jd_id: string;
  created: string[];
  already_shortlisted: string[];
}

export interface Application {
  id: string;
  candidate_id: string;
  jd_id: string;
  stage: ApplicationStage;
  match_score: number | null;
  offer_lpa: number | null;
  interview_feedback: Record<string, unknown>[];
  shortlisted_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// --- TPO (GET /api/tpo/pipeline, /api/tpo/batch-analytics) ----------------------------
export interface PipelineEntry {
  application_id: string;
  candidate_id: string;
  candidate_name: string | null;
  branch: string | null;
  jd_id: string;
  jd_title: string | null;
  company: string | null;
  stage: ApplicationStage;
  match_score: number | null;
  updated_at: string | null;
}

export interface PipelineResponse {
  college_id: string;
  by_stage: Record<ApplicationStage, number>;
  entries: PipelineEntry[];
}

export interface BatchAnalyticsResponse {
  college_id: string;
  total_candidates: number;
  readiness_distribution: { ready: number; needs_prep: number; behind: number; not_assessed: number };
  mean_overall: number | null;
  by_branch: {
    branch: string;
    candidates: number;
    assessed: number;
    mean_overall: number | null;
    mean_shortlisting: number | null;
    mean_technical: number | null;
    mean_offer: number | null;
  }[];
  pipeline: {
    total_applications: number;
    by_stage: Record<ApplicationStage, number>;
    shortlist_to_interview_rate: number | null;
    interview_to_offer_rate: number | null;
    offer_acceptance_rate: number | null;
  };
  common_gaps: { feature: string; label: string; candidates: number; share: number | null }[];
  flags: {
    candidate_id: string;
    name: string | null;
    flag: "not_assessed" | "stale_profile" | "technical_bottleneck";
    detail: string;
  }[];
}
