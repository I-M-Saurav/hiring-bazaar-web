import { ReadinessSummary } from "@/components/candidate/readiness-summary";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function CandidateDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirected
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your placement readiness</h1>
        <p className="text-muted-foreground">
          Three stages, scored separately: getting shortlisted, clearing technical rounds, and converting to an offer.
        </p>
      </div>
      <ReadinessSummary candidateId={user.id} />
    </div>
  );
}
