/**
 * Typed client for the FastAPI service. Every request carries the signed-in
 * user's Supabase access token as a Bearer token; the API verifies it against
 * the project's public keys and applies its role rules.
 */

import { env } from "@/lib/env";
import type {
  Application,
  ApplicationStage,
  BatchAnalyticsResponse,
  JDCreateRequest,
  JDCreateResponse,
  MatchedJDsResponse,
  MatchRequest,
  MatchResponse,
  ParsedResume,
  PipelineResponse,
  ReadinessResponse,
  ShortlistResponse,
} from "@/lib/api/types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: unknown,
  ) {
    super(ApiError.describe(status, detail));
    this.name = "ApiError";
  }

  private static describe(status: number, detail: unknown): string {
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object" && "message" in detail && typeof detail.message === "string") {
      return detail.message;
    }
    if (status === 503) return "The service is temporarily unavailable. Try again shortly.";
    return `Request failed (${status}).`;
  }
}

type Method = "GET" | "POST" | "PATCH";

async function request<T>(token: string, method: Method, path: string, body?: BodyInit | object): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, { method, headers, body: payload, cache: "no-store" });
  } catch {
    throw new ApiError(0, "Cannot reach the API. Is the backend running?");
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data && typeof data === "object" && "detail" in data ? data.detail : data;
    throw new ApiError(response.status, detail);
  }
  return data as T;
}

function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : "";
}

/** Bind the client to an access token (from the Supabase session). */
export function createApiClient(token: string) {
  return {
    parseResume(file: File) {
      const form = new FormData();
      form.append("file", file);
      return request<ParsedResume>(token, "POST", "/api/parse-resume", form);
    },
    embedCandidate(candidateId: string) {
      return request<{ success: boolean; embedding_dim: number }>(token, "POST", "/api/embed-candidate", {
        candidate_id: candidateId,
      });
    },
    readiness(candidateId: string) {
      return request<ReadinessResponse>(token, "GET", `/api/readiness/${candidateId}`);
    },
    matchedJds(filters: { location?: string; min_package_lpa?: number; eligible_only?: boolean } = {}) {
      return request<MatchedJDsResponse>(token, "GET", `/api/candidate/matched-jds${query(filters)}`);
    },
    createJd(body: JDCreateRequest) {
      return request<JDCreateResponse>(token, "POST", "/api/jd", body);
    },
    match(body: MatchRequest) {
      return request<MatchResponse>(token, "POST", "/api/match", body);
    },
    shortlist(jdId: string, candidates: { candidate_id: string; match_score?: number | null }[]) {
      return request<ShortlistResponse>(token, "POST", `/api/jd/${jdId}/shortlist`, { candidates });
    },
    updateStage(applicationId: string, stage: ApplicationStage, extra: { feedback?: Record<string, unknown>; offer_lpa?: number } = {}) {
      return request<Application>(token, "PATCH", `/api/application/${applicationId}/stage`, { stage, ...extra });
    },
    batchAnalytics() {
      return request<BatchAnalyticsResponse>(token, "GET", "/api/tpo/batch-analytics");
    },
    pipeline(filters: { jd_id?: string; stage?: ApplicationStage } = {}) {
      return request<PipelineResponse>(token, "GET", `/api/tpo/pipeline${query(filters)}`);
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
