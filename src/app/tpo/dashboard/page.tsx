import { BatchOverview } from "@/components/tpo/batch-overview";

export default function TpoDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Batch overview</h1>
        <p className="text-muted-foreground">Readiness across your college&apos;s registered students.</p>
      </div>
      <BatchOverview />
    </div>
  );
}
