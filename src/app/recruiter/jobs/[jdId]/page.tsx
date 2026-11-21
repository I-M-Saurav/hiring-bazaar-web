import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { MatchPanel } from "@/components/matching/match-panel";
import { JdPipeline } from "@/components/recruiter/jd-pipeline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export default async function RecruiterJobPage({ params }: { params: Promise<{ jdId: string }> }) {
  const { jdId } = await params;
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirected

  const supabase = await createClient();
  const { data: jd } = await supabase
    .from("job_descriptions")
    .select("id, title, status, location, package_lpa, min_cgpa, allowed_branches, max_backlogs, recruiter_id")
    .eq("id", jdId)
    .maybeSingle();
  if (!jd || jd.recruiter_id !== user.id) notFound();

  const rules = [
    `Min CGPA ${jd.min_cgpa ?? 0}`,
    jd.allowed_branches?.length ? `Branches: ${jd.allowed_branches.join(", ")}` : "All branches",
    `Up to ${jd.max_backlogs ?? 0} backlogs`,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={jd.title}
        description={[jd.location, jd.package_lpa ? `${jd.package_lpa} LPA` : null].filter(Boolean).join(" · ")}
        actions={<Badge variant={jd.status === "active" ? "default" : "secondary"}>{jd.status}</Badge>}
      />
      <p className="text-sm text-muted-foreground">{rules.join(" · ")}</p>
      {jd.status === "active" ? <MatchPanel jdId={jd.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interview pipeline</CardTitle>
          <CardDescription>Move candidates through your rounds and record feedback.</CardDescription>
        </CardHeader>
        <CardContent>
          <JdPipeline jdId={jd.id} />
        </CardContent>
      </Card>
    </div>
  );
}
