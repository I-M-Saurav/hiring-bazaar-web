import { PageHeader } from "@/components/common/page-header";
import { StageBadge } from "@/components/common/stage-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/** The candidate's own applications (RLS: applications_read returns only theirs). */
export default async function CandidateApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirected

  const supabase = await createClient();
  const { data: applications, error } = await supabase
    .from("applications")
    .select("id, jd_id, stage, offer_lpa, updated_at")
    .eq("candidate_id", user.id)
    .order("updated_at", { ascending: false });

  const jdIds = [...new Set((applications ?? []).map((a) => a.jd_id))];
  const { data: jds } = jdIds.length
    ? await supabase.from("job_descriptions").select("id, title, location").in("id", jdIds)
    : { data: [] };
  const jdById = new Map((jds ?? []).map((jd) => [jd.id, jd]));

  return (
    <div className="space-y-6">
      <PageHeader title="Your applications" description="Where you stand with every company that shortlisted you." />
      <Card>
        <CardContent className="pt-6">
          {error ? (
            <p className="text-sm text-destructive">Could not load your applications: {error.message}</p>
          ) : !applications?.length ? (
            <p className="text-sm text-muted-foreground">
              No applications yet. When a placement officer or recruiter shortlists you for a role, it appears here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Offer (LPA)</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a) => {
                  const jd = jdById.get(a.jd_id);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{jd?.title ?? "Role no longer listed"}</TableCell>
                      <TableCell>{jd?.location ?? "—"}</TableCell>
                      <TableCell>
                        <StageBadge stage={a.stage} />
                      </TableCell>
                      <TableCell className="text-right">{a.offer_lpa ?? "—"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(a.updated_at).toLocaleDateString("en-IN")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
