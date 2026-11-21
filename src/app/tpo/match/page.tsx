import { PageHeader } from "@/components/common/page-header";
import { JdMatchPicker } from "@/components/matching/jd-match-picker";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/** Pick one of the college's active JDs, rank candidates, and send a shortlist. */
export default async function TpoMatchPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirected

  const supabase = await createClient();
  const { data: jds } = user.collegeId
    ? await supabase
        .from("job_descriptions")
        .select("id, title, location")
        .eq("college_id", user.collegeId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generate a shortlist"
        description="Rank your students for a role, review the list, and send the shortlist to the recruiter."
      />
      {user.collegeId ? (
        <JdMatchPicker jds={jds ?? []} />
      ) : (
        <p className="text-sm text-destructive">Your account is not linked to a college. Ask the platform admin.</p>
      )}
    </div>
  );
}
