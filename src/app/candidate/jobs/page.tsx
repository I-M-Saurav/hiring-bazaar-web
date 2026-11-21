import { JobFeed } from "@/components/candidate/job-feed";
import { PageHeader } from "@/components/common/page-header";

export default function CandidateJobsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles for you"
        description="Active roles ranked by how well your profile matches, with the rules you would need to meet."
      />
      <JobFeed />
    </div>
  );
}
