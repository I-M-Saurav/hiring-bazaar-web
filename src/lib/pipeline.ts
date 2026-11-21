import type { ApplicationStage } from "@/lib/api/types";

/**
 * Mirrors hiring-bazaar-api app/services/pipeline.py so the UI only offers
 * moves the API accepts (the API still enforces them).
 */
export const STAGE_ORDER: ApplicationStage[] = [
  "shortlisted",
  "oa_sent",
  "oa_cleared",
  "interview_scheduled",
  "interview_done",
  "offer_made",
  "accepted",
];
export const ALL_STAGES: ApplicationStage[] = [...STAGE_ORDER, "rejected"];
export const FINAL_STAGES: ApplicationStage[] = ["accepted", "rejected"];

export const STAGE_LABEL: Record<ApplicationStage, string> = {
  shortlisted: "Shortlisted",
  oa_sent: "OA sent",
  oa_cleared: "OA cleared",
  interview_scheduled: "Interview scheduled",
  interview_done: "Interview done",
  offer_made: "Offer made",
  accepted: "Accepted",
  rejected: "Rejected",
};

/** Stages an application can move to next: any later stage (skips allowed), or rejected. */
export function nextStages(current: ApplicationStage): ApplicationStage[] {
  if (FINAL_STAGES.includes(current)) return [];
  const index = STAGE_ORDER.indexOf(current);
  const forward = STAGE_ORDER.slice(index + 1).filter((stage) => stage !== "accepted" || current === "offer_made");
  return [...forward, "rejected"];
}

export function stageVariant(stage: ApplicationStage): "default" | "secondary" | "destructive" | "outline" {
  if (stage === "rejected") return "destructive";
  if (stage === "offer_made" || stage === "accepted") return "default";
  return "secondary";
}
