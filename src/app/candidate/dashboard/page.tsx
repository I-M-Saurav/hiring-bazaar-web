import { ReadinessSummary } from "@/components/candidate/readiness-summary";
import { PageHeader } from "@/components/common/page-header";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export default async function CandidateDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirected

  const supabase = await createClient();
  const { data: row } = await supabase.from("candidates").select("skills").eq("id", user.id).maybeSingle();
  const hasProfile = Array.isArray(row?.skills) && row.skills.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your placement readiness"
        description="Three stages, scored separately: getting shortlisted, clearing technical rounds, and converting to an offer."
      />
      <ReadinessSummary candidateId={user.id} hasProfile={hasProfile} />
    </div>
  );
}
