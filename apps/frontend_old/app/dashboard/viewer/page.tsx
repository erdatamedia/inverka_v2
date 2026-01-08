"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { RoleGuard } from "@/components/role-guard";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Minimal, dependency-free charts (SVG) ---
function DonutChart({
  values,
  size = 160,
  thickness = 24,
  colors = ["hsl(var(--muted-foreground))", "hsl(var(--primary))"],
  labels = ["Baseline", "Mitigation"],
}: {
  values: [number, number] | number[];
  size?: number;
  thickness?: number;
  colors?: [string, string] | string[];
  labels?: [string, string] | string[];
}) {
  const total = (values[0] ?? 0) + (values[1] ?? 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const v0 = values[0] ?? 0;
  const v1 = values[1] ?? 0;
  const p0 = total > 0 ? (v0 / total) * circumference : 0;
  const p1 = total > 0 ? (v1 / total) * circumference : 0;

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Donut chart"
      >
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {/* Track */}
          <circle
            r={radius}
            fill="transparent"
            stroke="hsl(var(--muted))"
            strokeWidth={thickness}
          />
          {/* Segment 0 */}
          <circle
            r={radius}
            fill="transparent"
            stroke={colors[0]}
            strokeWidth={thickness}
            strokeDasharray={`${p0} ${circumference - p0}`}
            strokeDashoffset={circumference * -0.25}
            strokeLinecap="butt"
          />
          {/* Segment 1 */}
          <circle
            r={radius}
            fill="transparent"
            stroke={colors[1]}
            strokeWidth={thickness}
            strokeDasharray={`${p1} ${circumference - p1}`}
            strokeDashoffset={circumference * -0.25 - p0}
            strokeLinecap="butt"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontSize="14"
            className="fill-current"
          >
            {total > 0 ? Math.round((v1 / total) * 100) + "%" : "—"}
          </text>
        </g>
      </svg>
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-sm"
            style={{ background: colors[0] }}
          />
          <span>
            {labels[0]}: <b>{v0.toFixed(2)}</b>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-sm"
            style={{ background: colors[1] }}
          />
          <span>
            {labels[1]}: <b>{v1.toFixed(2)}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function BarChartAllProv({
  rows,
  width = 860,
  height = 260,
}: {
  rows: { province: string; baseline: number; mitigation: number }[];
  width?: number;
  height?: number;
}) {
  const padding = { top: 24, right: 16, bottom: 80, left: 48 };
  const W = width,
    H = height;
  const innerW = W - padding.left - padding.right;
  const innerH = H - padding.top - padding.bottom;

  if (!rows.length)
    return (
      <div className="text-muted-foreground text-sm">
        Tidak ada data provinsi.
      </div>
    );

  const xs = rows.map((r) => r.province);
  const ys = rows.flatMap((r) => [r.baseline, r.mitigation]);
  const yMax = Math.max(1, ...ys);

  const band = innerW / xs.length;
  const bar = Math.max(6, band * 0.34);

  const x = (i: number) => padding.left + i * band;
  const y = (v: number) => padding.top + innerH - (v / yMax) * innerH;

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(W, padding.left + padding.right + xs.length * band)}
        height={H}
        role="img"
        aria-label="Perbandingan Baseline vs Mitigation antar provinsi"
      >
        {/* y axis */}
        <line
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={H - padding.bottom}
          stroke="hsl(var(--border))"
        />
        {/* x axis */}
        <line
          x1={padding.left}
          x2={Math.max(W - padding.right, padding.left + xs.length * band)}
          y1={H - padding.bottom}
          y2={H - padding.bottom}
          stroke="hsl(var(--border))"
        />
        {/* bars */}
        {rows.map((r, i) => (
          <g key={r.province} transform={`translate(${x(i)},0)`}>
            {/* baseline */}
            <rect
              x={-bar - 2}
              y={y(r.baseline)}
              width={bar}
              height={Math.max(2, H - padding.bottom - y(r.baseline))}
              style={{ fill: "hsl(var(--muted-foreground))" }}
              rx={2}
            />
            {/* mitigation */}
            <rect
              x={2}
              y={y(r.mitigation)}
              width={bar}
              height={Math.max(2, H - padding.bottom - y(r.mitigation))}
              style={{ fill: "hsl(var(--primary))" }}
              rx={2}
            />
            {/* labels */}
            <text
              x={0}
              y={H - padding.bottom + 12}
              textAnchor="middle"
              fontSize="10"
              className="fill-current rotate-45 origin-top"
            >
              {r.province}
            </text>
          </g>
        ))}
        {/* legend */}
        <g
          transform={`translate(${padding.left}, ${padding.top - 10})`}
          fontSize="11"
          className="fill-current"
        >
          <rect
            x={0}
            y={-10}
            width={10}
            height={10}
            rx={2}
            style={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <text x={14} y={0}>
            Baseline
          </text>
          <rect
            x={90}
            y={-10}
            width={10}
            height={10}
            rx={2}
            style={{ fill: "hsl(var(--primary))" }}
          />
          <text x={104} y={0}>
            Mitigation
          </text>
        </g>
      </svg>
    </div>
  );
}

function ProvinceHeatGrid({
  rows,
  columns = 8,
}: {
  rows: { province: string; reducedPct: number }[];
  columns?: number;
}) {
  if (!rows.length)
    return (
      <div className="text-muted-foreground text-sm">
        Tidak ada data provinsi.
      </div>
    );

  // normalize -100..100 to 0..1
  const norm = (v: number) => {
    const clamped = Math.max(-100, Math.min(100, v));
    return (clamped + 100) / 200; // 0..1
  };

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {rows.map((r) => {
        const t = norm(r.reducedPct); // 0..1
        // interpolate lightness (higher reduction => darker primary)
        const lightness = 90 - t * 55; // 90% .. 35%
        const bg = `hsl(var(--primary) / 0.95)`;
        const overlay = `hsl(var(--primary) / ${0.15 + t * 0.35})`;
        return (
          <div
            key={r.province}
            className="rounded-md border p-2 text-xs relative"
            style={{
              background: `linear-gradient(0deg, ${overlay}, ${overlay}), hsl(var(--card))`,
            }}
          >
            <div className="font-medium">{r.province}</div>
            <div className="text-[11px] text-muted-foreground">
              Reduced {r.reducedPct}%
            </div>
            <div
              className="absolute inset-0 rounded-md pointer-events-none"
              style={{
                boxShadow: `inset 0 0 0 9999px hsl(var(--primary) / ${
                  0.08 + t * 0.22
                })`,
                opacity: 1,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function LineChart({
  rows,
  width = 520,
  height = 180,
  strokeWidth = 2,
}: {
  rows: { year: number; baseline: number; mitigation: number }[];
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  const padding = { top: 14, right: 16, bottom: 20, left: 36 };
  const W = width,
    H = height;
  const innerW = W - padding.left - padding.right;
  const innerH = H - padding.top - padding.bottom;

  const xs = rows.map((r) => r.year);
  const ys = rows.flatMap((r) => [r.baseline, r.mitigation]);
  const xMin = Math.min(...xs),
    xMax = Math.max(...xs);
  const yMin = 0;
  const yMax = Math.max(1, Math.max(...ys));

  const x = (v: number) => {
    if (xMax === xMin) return padding.left + innerW / 2;
    return padding.left + ((v - xMin) / (xMax - xMin)) * innerW;
  };
  const y = (v: number) =>
    padding.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const pathFor = (key: "baseline" | "mitigation") => {
    return rows
      .map((r, i) => `${i === 0 ? "M" : "L"} ${x(r.year)} ${y(r[key])}`)
      .join(" ");
  };

  const gridY = 4;
  const ticks = Array.from(
    { length: gridY + 1 },
    (_, i) => yMin + (i * (yMax - yMin)) / gridY
  );

  return (
    <svg width={W} height={H} role="img" aria-label="Timeseries chart">
      {/* grid */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={padding.left}
          x2={W - padding.right}
          y1={y(t)}
          y2={y(t)}
          stroke="hsl(var(--border))"
          strokeDasharray="4 4"
        />
      ))}
      {/* axes */}
      <line
        x1={padding.left}
        x2={padding.left}
        y1={padding.top}
        y2={H - padding.bottom}
        stroke="hsl(var(--border))"
      />
      <line
        x1={padding.left}
        x2={W - padding.right}
        y1={H - padding.bottom}
        y2={H - padding.bottom}
        stroke="hsl(var(--border))"
      />
      {/* series */}
      <path
        d={pathFor("baseline")}
        fill="none"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={strokeWidth}
      />
      <path
        d={pathFor("mitigation")}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
      />
      {/* legends */}
      <g
        transform={`translate(${padding.left}, ${padding.top})`}
        fontSize="11"
        className="fill-current"
      >
        <rect
          x={0}
          y={-10}
          width={10}
          height={10}
          rx={2}
          style={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <text x={14} y={0}>
          Baseline
        </text>
        <rect
          x={80}
          y={-10}
          width={10}
          height={10}
          rx={2}
          style={{ fill: "hsl(var(--primary))" }}
        />
        <text x={94} y={0}>
          Mitigation
        </text>
      </g>
      {/* year labels */}
      {rows.map((r) => (
        <text
          key={r.year}
          x={x(r.year)}
          y={H - 4}
          textAnchor="middle"
          fontSize="11"
          className="fill-current"
        >
          {r.year}
        </text>
      ))}
    </svg>
  );
}

type SumRow = {
  province: string;
  baseline: number;
  mitigation: number;
  reducedPct: number;
};

type OverallAgg = {
  baseline: number;
  mitigation: number;
  reducedPct: number;
};

type DonutAgg = {
  series: [number, number] | number[];
  reducedPct: number;
};

type TsRow = {
  year: number;
  baseline: number;
  mitigation: number;
  reducedPct: number;
};

export default function ViewerPage() {
  const [summary, setSummary] = useState<SumRow[]>([]);
  const [overall, setOverall] = useState<OverallAgg | null>(null);
  const [donut, setDonut] = useState<DonutAgg | null>(null);
  const [ts, setTs] = useState<TsRow[]>([]);
  const [province, setProvince] = useState<string>("ID-JT");
  const [year, setYear] = useState<number>(2025);

  useEffect(() => {
    Promise.all([
      api.get(`/viewer/summary-by-province?year=${year}`),
      api.get(`/viewer/overall?year=${year}`),
    ])
      .then(([s, o]) => {
        setSummary(s.data as SumRow[]);
        setOverall(o.data as OverallAgg);
      })
      .catch(() => {
        /* ignore */
      });
  }, [year]);

  useEffect(() => {
    Promise.all([
      api.get(`/viewer/chart/donut?year=${year}&province=${province}`),
      api.get(
        `/viewer/timeseries?province=${province}&from=${year - 1}&to=${year}`
      ),
    ])
      .then(([d, t]) => {
        setDonut(d.data as DonutAgg);
        setTs(t.data as TsRow[]);
      })
      .catch(() => {
        /* ignore */
      });
  }, [province, year]);

  return (
    <RoleGuard allow={["viewer", "verifikator", "superadmin", "petugas"]}>
      <AppShell role="viewer">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="text-sm">Tahun</div>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm">Provinsi</div>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Provinsi" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {summary.map((r) => (
                <SelectItem key={r.province} value={r.province}>
                  {r.province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Overall</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div>
                Baseline: <b>{overall?.baseline?.toFixed?.(2)}</b>
              </div>
              <div>
                Mitigation: <b>{overall?.mitigation?.toFixed?.(2)}</b>
              </div>
              <div>
                Reduced: <b>{overall?.reducedPct}%</b>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Donut ({province})</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {donut && Array.isArray(donut.series) ? (
                <DonutChart
                  values={[
                    Number(donut.series[0] || 0),
                    Number(donut.series[1] || 0),
                  ]}
                  labels={["Baseline", "Mitigation"]}
                />
              ) : (
                <div className="text-muted-foreground">
                  Tidak ada data donut.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan per Provinsi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 border">Provinsi</th>
                    <th className="p-2 border">Baseline</th>
                    <th className="p-2 border">Mitigation</th>
                    <th className="p-2 border">Reduced%</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((r, i) => (
                    <tr key={i}>
                      <td className="border p-2">{r.province}</td>
                      <td className="border p-2">{r.baseline.toFixed(2)}</td>
                      <td className="border p-2">{r.mitigation.toFixed(2)}</td>
                      <td className="border p-2">{r.reducedPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Perbandingan Baseline vs Mitigation (semua provinsi)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartAllProv
              rows={summary.map((s) => ({
                province: s.province,
                baseline: s.baseline,
                mitigation: s.mitigation,
              }))}
            />
            <div className="grid md:grid-cols-2 gap-2 mt-4 text-xs">
              {summary.map((s, i) => (
                <div key={i} className="flex gap-3 border rounded p-2">
                  <div className="w-24 font-medium">{s.province}</div>
                  <div>
                    Baseline: <b>{s.baseline.toFixed(2)}</b>
                  </div>
                  <div>
                    Mitigation: <b>{s.mitigation.toFixed(2)}</b>
                  </div>
                  <div>
                    Reduced: <b>{s.reducedPct}%</b>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Peta (heat-grid) pengurangan emisi per provinsi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProvinceHeatGrid
              rows={summary.map((s) => ({
                province: s.province,
                reducedPct: s.reducedPct,
              }))}
            />
            <div className="text-xs text-muted-foreground mt-2">
              *Ini grid representasi (stub GIS) untuk UAT. Integrasi peta GIS
              bisa mengganti komponen ini nantinya.
            </div>
          </CardContent>
        </Card>
      </AppShell>
    </RoleGuard>
  );
}
