import { ProfileEditor } from "@/components/candidate/profile-editor";
import { PageHeader } from "@/components/common/page-header";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export default async function CandidateProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirected

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("candidates")
    .select("name, branch, batch_year, cgpa, backlogs, cp_rating, cp_platform, skills, projects, internships")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        description="This is what recruiters see and what your readiness scores are computed from."
      />
      <ProfileEditor row={row} candidateId={user.id} />
    </div>
  );
}
