import { PageHeader } from "@/components/common/page-header";
import { PostJdForm } from "@/components/recruiter/post-jd-form";
import { createClient } from "@/lib/supabase/server";

export default async function PostJdPage() {
  const supabase = await createClient();
  const { data: colleges } = await supabase.from("colleges").select("id, name").order("name");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Post a job description"
        description="Candidates are matched to it straight away; you will see how many qualify."
      />
      <PostJdForm colleges={colleges ?? []} />
    </div>
  );
}
