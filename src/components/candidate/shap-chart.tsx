"use client";

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { FeatureContribution } from "@/lib/api/types";

interface Row {
  label: string;
  points: number;
  value: string;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{row.label}</p>
      <p className="text-muted-foreground">{row.value}</p>
      <p className={row.points >= 0 ? "text-success" : "text-destructive"}>
        {row.points >= 0 ? "+" : ""}
        {row.points.toFixed(1)} points
      </p>
    </div>
  );
}

/**
 * SHAP waterfall for one stage (blueprint Section 9): each bar is how many
 * percentage points a feature moved this stage's probability compared with a
 * typical candidate. Green pushes up, red pulls down.
 */
export function ShapChart({ contributions }: { contributions: FeatureContribution[] }) {
  const rows: Row[] = [...contributions]
    .sort((a, b) => b.points - a.points)
    .map((c) => ({ label: c.label, points: Number(c.points.toFixed(1)), value: c.value_display }));
  const extent = Math.max(5, ...rows.map((r) => Math.abs(r.points)));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
          <XAxis
            type="number"
            domain={[-extent, extent]}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}`}
            className="text-xs"
            tick={{ fill: "currentColor" }}
          />
          <YAxis type="category" dataKey="label" width={170} className="text-xs" tick={{ fill: "currentColor" }} />
          <ReferenceLine x={0} className="stroke-border" />
          <Tooltip content={<ChartTooltip />} cursor={{ className: "fill-muted" }} />
          <Bar dataKey="points" radius={3}>
            {rows.map((row) => (
              <Cell key={row.label} className={row.points >= 0 ? "fill-success" : "fill-destructive"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
