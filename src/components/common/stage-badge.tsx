import { Badge } from "@/components/ui/badge";
import type { ApplicationStage } from "@/lib/api/types";
import { STAGE_LABEL, stageVariant } from "@/lib/pipeline";

export function StageBadge({ stage }: { stage: ApplicationStage }) {
  return <Badge variant={stageVariant(stage)}>{STAGE_LABEL[stage]}</Badge>;
}
