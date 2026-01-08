"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { TimeseriesPoint } from "@/lib/viewer-api";

interface EmissionTrendChartProps {
  data: TimeseriesPoint[];
  loading?: boolean;
  province?: string;
  provinceLabel?: string;
}

const chartConfig = {
  baseline: {
    label: "Baseline",
    color: "hsl(var(--chart-1))",
  },
  mitigation: {
    label: "Mitigation",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function EmissionTrendChart({
  data,
  loading,
  province,
  provinceLabel,
}: EmissionTrendChartProps) {
  const content = loading ? (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="h-8 animate-pulse rounded bg-muted/40" />
      ))}
    </div>
  ) : data.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      Belum ada data tren emisi untuk provinsi ini.
    </p>
  ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Emisi per Tahun</CardTitle>
        <CardDescription>
          {province && province.toUpperCase() !== "ALL"
            ? provinceLabel ?? `Provinsi ${province}`
            : provinceLabel ?? "Seluruh provinsi (pengajuan disetujui)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content || (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillMitigation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={60} />
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--border))" }}
                content={
                  <ChartTooltipContent
                    nameKey="label"
                    labelFormatter={(value) => `Tahun ${value}`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="hsl(var(--chart-1))"
                fill="url(#fillBaseline)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="mitigation"
                stroke="hsl(var(--chart-2))"
                fill="url(#fillMitigation)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
