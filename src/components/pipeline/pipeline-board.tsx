"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useState } from "react";

import { QueryError } from "@/components/common/query-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi } from "@/hooks/use-api";
import type { ApplicationStage } from "@/lib/api/types";
import { ALL_STAGES, STAGE_LABEL, nextStages } from "@/lib/pipeline";

export interface BoardItem {
  applicationId: string;
  candidateName: string | null;
  subtitle: string | null;
  stage: ApplicationStage;
  matchScore: number | null;
}

function StageMover({ item, invalidate }: { item: BoardItem; invalidate: QueryKey[] }) {
  const withApi = useApi();
  const queryClient = useQueryClient();
  const options = nextStages(item.stage);
  const [target, setTarget] = useState<ApplicationStage | "">("");
  const [note, setNote] = useState("");
  const [offer, setOffer] = useState("");
  const needsOffer = target === "offer_made";

  const move = useMutation({
    mutationFn: () => {
      const offerNumber = Number(offer);
      return withApi((api) =>
        api.updateStage(item.applicationId, target as ApplicationStage, {
          feedback: note.trim() ? { notes: note.trim() } : undefined,
          offer_lpa: needsOffer && offer && Number.isFinite(offerNumber) ? offerNumber : undefined,
        }),
      );
    },
    onSuccess: () => {
      setTarget("");
      setNote("");
      setOffer("");
      invalidate.forEach((key) => void queryClient.invalidateQueries({ queryKey: key }));
    },
  });

  if (options.length === 0) return null;
  return (
    <div className="space-y-2 border-t pt-2">
      <Select value={target || undefined} onValueChange={(v) => setTarget(v as ApplicationStage)}>
        <SelectTrigger className="h-8 text-xs" aria-label="Move to stage">
          <SelectValue placeholder="Move to…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {STAGE_LABEL[stage]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {target ? (
        <>
          {needsOffer ? (
            <Input className="h-8 text-xs" inputMode="decimal" placeholder="Package (LPA)" value={offer} onChange={(e) => setOffer(e.target.value)} />
          ) : null}
          <Input className="h-8 text-xs" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button size="sm" className="h-8 w-full" onClick={() => move.mutate()} disabled={move.isPending}>
            {move.isPending ? "Updating…" : `Move to ${STAGE_LABEL[target]}`}
          </Button>
        </>
      ) : null}
      {move.error ? <QueryError error={move.error} title="Could not update" /> : null}
    </div>
  );
}

/** Kanban of applications by stage; every card can move to a valid next stage. */
export function PipelineBoard({ items, invalidate }: { items: BoardItem[]; invalidate: QueryKey[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No applications yet. Shortlist candidates to start the pipeline.</p>;
  }
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {ALL_STAGES.map((stage) => {
        const column = items.filter((i) => i.stage === stage);
        return (
          <div key={stage} className="w-60 shrink-0 rounded-lg bg-muted/60 p-2">
            <div className="mb-2 flex items-center justify-between px-1 text-sm font-medium">
              <span>{STAGE_LABEL[stage]}</span>
              <span className="text-muted-foreground">{column.length}</span>
            </div>
            <div className="space-y-2">
              {column.map((item) => (
                <div key={item.applicationId} className="space-y-1 rounded-md border bg-background p-2 text-sm shadow-sm">
                  <p className="font-medium">{item.candidateName ?? "Candidate"}</p>
                  {item.subtitle ? <p className="text-xs text-muted-foreground">{item.subtitle}</p> : null}
                  {item.matchScore !== null ? <p className="text-xs">Match {item.matchScore.toFixed(0)}</p> : null}
                  <StageMover item={item} invalidate={invalidate} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
