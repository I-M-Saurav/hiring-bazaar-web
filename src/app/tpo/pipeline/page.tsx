import { PageHeader } from "@/components/common/page-header";
import { TpoPipeline } from "@/components/tpo/tpo-pipeline";

export default function TpoPipelinePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Placement pipeline" description="Every student across every active company, by stage." />
      <TpoPipeline />
    </div>
  );
}
