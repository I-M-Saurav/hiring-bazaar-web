/**
 * Types for the tables the frontend reads (blueprint Section 7 schema).
 * Hand-written to match the live schema; regenerate with
 * `npx supabase gen types typescript --project-id <ref>` once the Supabase
 * CLI is set up, and replace this file.
 *
 * The frontend only READS (RLS policies, read-only for signed-in users);
 * every write goes through the FastAPI service.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ApplicationStage =
  | "shortlisted"
  | "oa_sent"
  | "oa_cleared"
  | "interview_scheduled"
  | "interview_done"
  | "offer_made"
  | "accepted"
  | "rejected";

export interface Database {
  public: {
    Tables: {
      users: Table<{
        id: string;
        email: string;
        role: string;
        college_id: string | null;
        company_id: string | null;
        created_at: string;
      }>;
      colleges: Table<{ id: string; name: string; location: string | null; tier: number | null }>;
      companies: Table<{ id: string; name: string; tier: number | null }>;
      candidates: Table<{
        id: string;
        name: string | null;
        branch: string | null;
        batch_year: number | null;
        cgpa: number | null;
        cgpa_percentile_in_branch: number | null;
        cp_rating: number | null;
        cp_platform: string | null;
        backlogs: number | null;
        skills: Json | null;
        projects: Json | null;
        internships: Json | null;
        resume_url: string | null;
        parsed_profile: Json | null;
        skill_depth_score: number | null;
        resume_completeness: number | null;
        updated_at: string;
      }>;
      job_descriptions: Table<{
        id: string;
        recruiter_id: string | null;
        college_id: string | null;
        title: string;
        description: string;
        required_skills: Json | null;
        min_cgpa: number | null;
        allowed_branches: string[] | null;
        max_backlogs: number | null;
        package_lpa: number | null;
        location: string | null;
        status: "draft" | "active" | "closed";
        created_at: string;
      }>;
      readiness_scores: Table<{
        candidate_id: string;
        shortlisting_score: number | null;
        technical_score: number | null;
        offer_score: number | null;
        overall_score: number | null;
        shap_shortlisting: Json | null;
        shap_technical: Json | null;
        shap_offer: Json | null;
        top_gaps: Json | null;
        computed_at: string;
      }>;
      applications: Table<{
        id: string;
        candidate_id: string;
        jd_id: string;
        match_score: number | null;
        stage: ApplicationStage;
        shortlisted_by: string | null;
        interview_feedback: Json | null;
        offer_lpa: number | null;
        created_at: string;
        updated_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
