"use client";

import { useState } from "react";

import { MatchPanel } from "@/components/matching/match-panel";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface JdOption {
  id: string;
  title: string;
  location: string | null;
}

export function JdMatchPicker({ jds }: { jds: JdOption[] }) {
  const [jdId, setJdId] = useState<string>(jds[0]?.id ?? "");
  if (jds.length === 0) {
    return <p className="text-sm text-muted-foreground">No active job descriptions are posted to your college yet.</p>;
  }
  return (
    <div className="space-y-4">
      <div className="max-w-md space-y-1.5">
        <Label htmlFor="jd">Job description</Label>
        <Select value={jdId} onValueChange={setJdId}>
          <SelectTrigger id="jd">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {jds.map((jd) => (
              <SelectItem key={jd.id} value={jd.id}>
                {jd.title}
                {jd.location ? ` · ${jd.location}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* key resets the panel's results when another JD is picked */}
      <MatchPanel key={jdId} jdId={jdId} />
    </div>
  );
}
