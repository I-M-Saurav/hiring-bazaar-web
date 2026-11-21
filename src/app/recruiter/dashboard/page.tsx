import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * The recruiter's own JDs, read directly from Supabase. RLS (jds_read)
 * returns active JDs plus the recruiter's own drafts/closed ones; the
 * recruiter_id filter keeps only theirs.
 */
export default async function RecruiterDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirected

  const supabase = await createClient();
  const { data: jds, error } = await supabase
    .from("job_descriptions")
    .select("id, title, status, location, package_lpa, min_cgpa, created_at")
    .eq("recruiter_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your job descriptions</h1>
        <p className="text-muted-foreground">Post a JD to see how many registered candidates qualify and who ranks highest.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Postings</CardTitle>
          <CardDescription>{error ? `Could not load: ${error.message}` : `${jds?.length ?? 0} total`}</CardDescription>
        </CardHeader>
        <CardContent>
          {jds && jds.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Package (LPA)</TableHead>
                  <TableHead className="text-right">Min CGPA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jds.map((jd) => (
                  <TableRow key={jd.id}>
                    <TableCell className="font-medium">{jd.title}</TableCell>
                    <TableCell>
                      <Badge variant={jd.status === "active" ? "default" : "secondary"}>{jd.status}</Badge>
                    </TableCell>
                    <TableCell>{jd.location ?? "—"}</TableCell>
                    <TableCell className="text-right">{jd.package_lpa ?? "—"}</TableCell>
                    <TableCell className="text-right">{jd.min_cgpa ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No job descriptions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
