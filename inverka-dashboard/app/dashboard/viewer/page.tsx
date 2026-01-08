"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { LeafletMap } from "@/components/leaflet-map";
import { GeoJSONLayer } from "@/components/geojson-layer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { listSubmissions } from "@/lib/submissions-api";
import type { SubmissionRecord } from "@/lib/types";
import { PROVINCE_COORDINATE_MAP } from "@/lib/indonesia-provinces";
import { getEmissionColor } from "@/lib/emission-gradient";
import { PROVINCE_BOUNDARIES } from "@/lib/province-geojson";
import type { ProvinceGeoFeature } from "@/lib/province-geojson";
import type { Layer, Path, PathOptions } from "leaflet";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartDatum = {
  code: string;
  label: string;
  value: number;
};

type SummaryDatum = {
  code: string;
  label: string;
  baseline: number;
  mitigation: number;
};

type ProvinceMetric = {
  name: string;
  baseline: number;
  mitigation: number;
  manureTotal: number;
  reduction: number;
  reductionPct: number;
};

const YEAR_RANGE = 6;
const COLORS = {
  primary: "var(--chart-1)",
  secondary: "var(--chart-2)",
  accent: "var(--chart-3)",
  muted: "var(--chart-4)",
  highlight: "var(--chart-5)",
};
const GRID_COLOR = "var(--border)";
const TICK_COLOR = "var(--muted-foreground)";
const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  borderColor: "var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
};
const TOOLTIP_LABEL_STYLE = {
  color: "var(--muted-foreground)",
};

const DEFAULT_MAP_BOUNDS: [[number, number], [number, number]] = [
  [-11.5, 94.5],
  [6.5, 142.5],
];

const formatNumber = (value: number, fractionDigits = 2) =>
  value.toLocaleString("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-white/80 p-4 text-sm shadow-sm dark:bg-slate-900/70">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      {caption ? (
        <p className="text-xs text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  unit,
  data,
  barColor = COLORS.primary,
}: {
  title: string;
  unit: string;
  data: ChartDatum[];
  barColor?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: TICK_COLOR }}
                interval={data.length > 8 ? 1 : 0}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={false}
              />
              <YAxis
                width={80}
                tick={{ fontSize: 11, fill: TICK_COLOR }}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
                }
              />
              <Tooltip
                formatter={(value: number) =>
                  `${formatNumber(value)} ${unit}`
                }
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                fill={barColor}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Tidak ada pengajuan disetujui pada tahun ini.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryChart({ data }: { data: SummaryDatum[] }) {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Tidak ada pengajuan disetujui pada tahun ini.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: TICK_COLOR }}
          interval={data.length > 12 ? 1 : 0}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          width={80}
          tick={{ fontSize: 11, fill: TICK_COLOR }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
          }
        />
        <Tooltip
          formatter={(value: number, name: string) =>
            `${formatNumber(value)} Gg CO₂e (${name === "baseline" ? "Baseline" : "Mitigasi"})`
          }
          labelFormatter={(label) => `Provinsi: ${label}`}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
        />
        <Legend />
        <Bar
          dataKey="baseline"
          name="Baseline"
          fill={COLORS.secondary}
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="mitigation"
          name="Setelah Mitigasi"
          fill={COLORS.primary}
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function GasPieChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const hasValue = data.some((item) => item.value > 0);
  if (!hasValue) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Tidak ada data gas untuk tahun ini.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          formatter={(value: number, name: string) =>
            `${name}: ${formatNumber(value)} Gg CO₂e`
          }
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
        />
        <Legend />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius="75%"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(1)}%`
          }
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function ViewerDashboardPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<SubmissionRecord[]>([]);
  const [provinceFilter, setProvinceFilter] = useState<string>("ALL");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    listSubmissions(year)
      .then((data) => {
        if (!mounted) return;
        setRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Gagal memuat data");
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [year]);

  const approved = useMemo(
    () =>
      records.filter((record) => record.status === "disetujui" && record.result),
    [records]
  );

  const filteredApproved = useMemo(
    () =>
      provinceFilter === "ALL"
        ? approved
        : approved.filter((record) => record.province === provinceFilter),
    [approved, provinceFilter]
  );

  const provinceAggs = useMemo(() => {
    const map = new Map<
      string,
      {
        province: string;
        submissions: number;
        baseline: number;
        mitigation: number;
        reduction: number;
        manure: {
          N2O_direct: number;
          N2O_indirect: number;
          CH4: number;
          total: number;
        };
        enteric: {
          CH4_ton: number;
          CH4_CO2e_ton: number;
          CH4_GgCO2e: number;
        };
        gas: {
          CH4: number;
          N2O: number;
          total: number;
        };
      }
    >();

    for (const record of filteredApproved) {
      const key = record.province;
      if (!map.has(key)) {
        map.set(key, {
          province: key,
          submissions: 0,
          baseline: 0,
          mitigation: 0,
          reduction: 0,
          manure: {
            N2O_direct: 0,
            N2O_indirect: 0,
            CH4: 0,
            total: 0,
          },
          enteric: {
            CH4_ton: 0,
            CH4_CO2e_ton: 0,
            CH4_GgCO2e: 0,
          },
          gas: {
            CH4: 0,
            N2O: 0,
            total: 0,
          },
        });
      }
      const entry = map.get(key)!;
      entry.submissions += 1;
      entry.baseline += record.result.summary.baseline_GgCO2e;
      entry.mitigation += record.result.summary.with_mitigation_GgCO2e;
      entry.reduction += record.result.summary.reduction_GgCO2e;
      entry.manure.N2O_direct += record.result.manure_detail_GgCO2e.N2O_direct;
      entry.manure.N2O_indirect +=
        record.result.manure_detail_GgCO2e.N2O_indirect;
      entry.manure.CH4 += record.result.manure_detail_GgCO2e.CH4;
      entry.manure.total += record.result.manure_detail_GgCO2e.total;
      entry.enteric.CH4_ton += record.result.enteric_detail.CH4_ton;
      entry.enteric.CH4_CO2e_ton += record.result.enteric_detail.CH4_CO2e_ton;
      entry.enteric.CH4_GgCO2e += record.result.enteric_detail.CH4_GgCO2e;
      entry.gas.CH4 += record.result.by_gas_GgCO2e.CH4;
      entry.gas.N2O += record.result.by_gas_GgCO2e.N2O;
      entry.gas.total += record.result.by_gas_GgCO2e.total;
    }

    return Array.from(map.values()).sort((a, b) =>
      a.province.localeCompare(b.province)
    );
  }, [filteredApproved]);

  const totals = useMemo(() => {
    return provinceAggs.reduce(
      (acc, item) => {
        acc.baseline += item.baseline;
        acc.mitigation += item.mitigation;
        acc.reduction += item.reduction;
        acc.manure.N2O_direct += item.manure.N2O_direct;
        acc.manure.N2O_indirect += item.manure.N2O_indirect;
        acc.manure.CH4 += item.manure.CH4;
        acc.manure.total += item.manure.total;
        acc.enteric.CH4_ton += item.enteric.CH4_ton;
        acc.enteric.CH4_CO2e_ton += item.enteric.CH4_CO2e_ton;
        acc.enteric.CH4_GgCO2e += item.enteric.CH4_GgCO2e;
        acc.gas.CH4 += item.gas.CH4;
        acc.gas.N2O += item.gas.N2O;
        acc.gas.total += item.gas.total;
        return acc;
      },
      {
        baseline: 0,
        mitigation: 0,
        reduction: 0,
        manure: {
          N2O_direct: 0,
          N2O_indirect: 0,
          CH4: 0,
          total: 0,
        },
        enteric: {
          CH4_ton: 0,
          CH4_CO2e_ton: 0,
          CH4_GgCO2e: 0,
        },
        gas: {
          CH4: 0,
          N2O: 0,
          total: 0,
        },
      }
    );
  }, [provinceAggs]);

  const totalSubmissions = records.length;
  const filteredSubmissionCount = filteredApproved.length;
  const heroStats = useMemo(
    () => [
      {
        label: "Baseline total",
        value: `${formatNumber(totals.baseline)} Gg CO₂e`,
        caption: "Sebelum mitigasi",
      },
      {
        label: "Setelah mitigasi",
        value: `${formatNumber(totals.mitigation)} Gg CO₂e`,
        caption: "Pengurangan akumulatif",
      },
      {
        label: "Reduksi",
        value: `${formatNumber(totals.reduction)} Gg CO₂e`,
        caption: "Baseline - mitigasi",
      },
      {
        label: "Pengajuan disetujui",
        value: `${filteredSubmissionCount}`,
        caption: `${totalSubmissions} total pengajuan`,
      },
    ],
    [
      filteredSubmissionCount,
      totalSubmissions,
      totals.baseline,
      totals.mitigation,
      totals.reduction,
    ]
  );

  const summaryChartData: SummaryDatum[] = useMemo(
    () =>
      provinceAggs.map((item) => {
        const provinceMeta = PROVINCE_COORDINATE_MAP[item.province];
        const label = provinceMeta?.name ?? item.province;
        return {
          code: item.province,
          label,
          baseline: Number(item.baseline.toFixed(2)),
          mitigation: Number(item.mitigation.toFixed(2)),
        };
      }),
    [provinceAggs]
  );

  const makeChartData = useCallback(
    (selector: (item: (typeof provinceAggs)[number]) => number): ChartDatum[] =>
      provinceAggs.map((item) => {
        const provinceMeta = PROVINCE_COORDINATE_MAP[item.province];
        const label = provinceMeta?.name ?? item.province;
        return {
          code: item.province,
          label,
          value: Number(selector(item).toFixed(2)),
        };
      }),
    [provinceAggs]
  );

  const n2oIndirectData = useMemo(
    () =>
      makeChartData((item) => item.manure.N2O_indirect).sort(
        (a, b) => b.value - a.value
      ),
    [makeChartData]
  );
  const ch4ManureData = useMemo(
    () =>
      makeChartData((item) => item.manure.CH4).sort((a, b) => b.value - a.value),
    [makeChartData]
  );
  const manureTotalData = useMemo(
    () =>
      makeChartData((item) => item.manure.total).sort(
        (a, b) => b.value - a.value
      ),
    [makeChartData]
  );
  const entericCH4TonData = useMemo(
    () =>
      makeChartData((item) => item.enteric.CH4_ton).sort(
        (a, b) => b.value - a.value
      ),
    [makeChartData]
  );
  const entericCH4CO2Data = useMemo(
    () =>
      makeChartData((item) => item.enteric.CH4_CO2e_ton).sort(
        (a, b) => b.value - a.value
      ),
    [makeChartData]
  );
  const entericCH4GgData = useMemo(
    () =>
      makeChartData((item) => item.enteric.CH4_GgCO2e).sort(
        (a, b) => b.value - a.value
      ),
    [makeChartData]
  );
  const n2oDirectData = useMemo(
    () =>
      makeChartData((item) => item.manure.N2O_direct).sort(
        (a, b) => b.value - a.value
      ),
    [makeChartData]
  );

  const pieData = useMemo(
    () => [
      {
        name: "CH₄",
        value: Number(totals.gas.CH4.toFixed(2)),
        color: COLORS.primary,
      },
      {
        name: "N₂O",
        value: Number(totals.gas.N2O.toFixed(2)),
        color: COLORS.secondary,
      },
    ],
    [totals.gas.CH4, totals.gas.N2O]
  );

  const provinceChoropleth = useMemo(() => {
    const metrics = new Map<string, ProvinceMetric>();
    let maxValue = 0;

    for (const item of provinceAggs) {
      const provinceMeta = PROVINCE_COORDINATE_MAP[item.province];
      const name = provinceMeta?.name ?? item.province;
      const baseline = Number(item.baseline.toFixed(2));
      const mitigation = Number(item.mitigation.toFixed(2));
      const manureTotal = Number(item.manure.total.toFixed(2));
      const reduction = Number(item.reduction.toFixed(2));
      const reductionPct =
        item.baseline > 0
          ? Number((((item.baseline - item.mitigation) / item.baseline) * 100).toFixed(2))
          : 0;

      metrics.set(item.province, {
        name,
        baseline,
        mitigation,
        manureTotal,
        reduction,
        reductionPct,
      });

      if (manureTotal > maxValue) {
        maxValue = manureTotal;
      }
    }

    return {
      metrics,
      maxValue: maxValue > 0 ? maxValue : 1,
    };
  }, [provinceAggs]);

  const getProvinceStyle = useCallback(
    (feature?: ProvinceGeoFeature): PathOptions => {
      const code = feature?.properties?.ISO_CODE ?? "";
      const metric = code ? provinceChoropleth.metrics.get(code) : undefined;
      const ratio =
        metric && provinceChoropleth.maxValue > 0
          ? Math.min(1, metric.manureTotal / provinceChoropleth.maxValue)
          : 0;
      return {
        color: "rgba(15, 23, 42, 0.35)",
        weight: 1,
        fillColor: getEmissionColor(ratio),
        fillOpacity: metric ? 0.35 + ratio * 0.4 : 0.08,
      };
    },
    [provinceChoropleth]
  );

  const buildTooltipHtml = useCallback(
    (metric?: ProvinceMetric, fallbackName?: string) => {
      if (!metric) {
        const name = fallbackName ?? "Tidak ada data";
        return `<div><strong>${name}</strong><br/><span style="font-size:11px;">Belum ada data emisi</span></div>`;
      }
      return `<div style="line-height:1.4;">
        <strong>${metric.name}</strong><br/>
        <span style="font-size:11px;">Baseline: ${formatNumber(metric.baseline)} Gg CO₂e</span><br/>
        <span style="font-size:11px;">Mitigasi: ${formatNumber(metric.mitigation)} Gg CO₂e</span><br/>
        <span style="font-size:11px;">Manure: ${formatNumber(metric.manureTotal)} Gg CO₂e</span><br/>
        <span style="font-size:11px;">Reduksi: ${formatNumber(metric.reduction)} Gg CO₂e (${formatNumber(metric.reductionPct, 1)}%)</span>
      </div>`;
    },
    []
  );

  const handleEachProvince = useCallback(
    (feature: ProvinceGeoFeature, layer: Layer) => {
      const code = feature?.properties?.ISO_CODE ?? "";
      const metric = code ? provinceChoropleth.metrics.get(code) : undefined;
      layer.bindTooltip(buildTooltipHtml(metric, feature?.properties?.PROVINSI), {
        direction: "auto",
        sticky: true,
        opacity: 0.95,
        className: "province-tooltip",
      });

      layer.on({
        mouseover: () => {
          const pathLayer = layer as Path;
          if (typeof pathLayer.setStyle === "function") {
            const baseStyle = getProvinceStyle(feature);
            pathLayer.setStyle({
              ...baseStyle,
              weight: 2,
              fillOpacity: Math.min(0.9, (baseStyle.fillOpacity ?? 0.35) + 0.2),
            });
          }
        },
        mouseout: () => {
          const pathLayer = layer as Path;
          if (typeof pathLayer.setStyle === "function") {
            pathLayer.setStyle(getProvinceStyle(feature));
          }
        },
      });
    },
    [buildTooltipHtml, getProvinceStyle, provinceChoropleth]
  );

  const yearOptions = useMemo(() => {
    return Array.from({ length: YEAR_RANGE }, (_, index) => currentYear - index);
  }, [currentYear]);

  const provinceOptions = useMemo(() => {
    const codes = Array.from(new Set(approved.map((item) => item.province))).sort(
      (a, b) => a.localeCompare(b)
    );
    return codes;
  }, [approved]);

  const selectedProvinceLabel =
    provinceFilter === "ALL"
      ? "Semua provinsi"
      : PROVINCE_COORDINATE_MAP[provinceFilter]?.name ?? provinceFilter;

  return (
        <div className="mx-auto w-full max-w-7xl space-y-8 px-4 pb-12 pt-4 sm:px-6 lg:px-8">
          <section className="grid gap-6 rounded-[28px] border border-primary/10 bg-white/80 p-6 shadow-lg hero-emerald lg:grid-cols-[1.3fr_1fr] dark:bg-slate-900/60">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-primary">
                  Dashboard Viewer
                </p>
                <h1 className="text-2xl font-semibold text-foreground">
                  Ringkasan Emisi Nasional
                </h1>
                <p className="text-sm text-muted-foreground">
                  Data berdasarkan pengajuan yang telah disetujui dan dihitung
                  otomatis mengikuti pedoman IPCC.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>Tahun aktif:</span>
                <Select
                  value={String(year)}
                  onValueChange={(value) => setYear(Number(value))}
                >
                  <SelectTrigger className="w-32 bg-white/80 dark:bg-slate-900/70">
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap items-center gap-2">
                  <span>Provinsi:</span>
                  <Select
                    value={provinceFilter}
                    onValueChange={(value) => setProvinceFilter(value)}
                  >
                    <SelectTrigger className="w-48 bg-white/80 dark:bg-slate-900/70">
                      <SelectValue placeholder="Semua provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua provinsi</SelectItem>
                      {provinceOptions.map((option) => {
                        const label = PROVINCE_COORDINATE_MAP[option]?.name ?? option;
                        return (
                          <SelectItem key={option} value={option}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {loading ? <Skeleton className="h-5 w-24" /> : null}
                {error ? (
                  <span className="text-destructive">
                    Gagal memuat data ({error})
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Menampilkan data untuk {selectedProvinceLabel}.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {heroStats.map((item) => (
                  <StatCard key={item.label} {...item} />
                ))}
              </div>
            </div>
            <Card className="border border-primary/15 bg-white/90 shadow-lg dark:bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Baseline vs Mitigasi per Provinsi
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <SummaryChart data={summaryChartData} />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="EMISI N₂O TIDAK LANGSUNG (Gg CO₂e/tahun) – Manure"
              unit="Gg CO₂e"
              data={n2oIndirectData}
              barColor={COLORS.muted}
            />
            <ChartCard
              title="EMISI CH₄ (Gg CO₂e/tahun) – Manure"
              unit="Gg CO₂e"
              data={ch4ManureData}
              barColor={COLORS.primary}
            />
            <ChartCard
              title="Total EMISI (Gg CO₂e/tahun) – Manure"
              unit="Gg CO₂e"
              data={manureTotalData}
              barColor={COLORS.accent}
            />
            <ChartCard
              title="EMISI CH₄ (ton/tahun) – Enterik"
              unit="ton CH₄"
              data={entericCH4TonData}
              barColor={COLORS.secondary}
            />
            <ChartCard
              title="EMISI CH₄ (ton CO₂e/tahun) – Enterik"
              unit="ton CO₂e"
              data={entericCH4CO2Data}
              barColor={COLORS.highlight}
            />
            <ChartCard
              title="CH₄ Emission (Gg CO₂e/tahun) – Enterik"
              unit="Gg CO₂e"
              data={entericCH4GgData}
              barColor={COLORS.primary}
            />
            <ChartCard
              title="EMISI N₂O LANGSUNG (Gg CO₂e/tahun) – Manure"
              unit="Gg CO₂e"
              data={n2oDirectData}
              barColor={COLORS.muted}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Emisi berdasarkan Jenis Gas
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <GasPieChart data={pieData} />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Peta Persebaran Emisi per Provinsi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {provinceAggs.length ? (
                  <LeafletMap
                    className="h-[420px]"
                    bounds={DEFAULT_MAP_BOUNDS}
                    scrollWheelZoom={false}
                  >
                    <GeoJSONLayer
                      key={`province-choropleth-${year}-${provinceAggs.length}`}
                      data={PROVINCE_BOUNDARIES}
                      style={getProvinceStyle}
                      onEachFeature={handleEachProvince}
                    />
                  </LeafletMap>
                ) : (
                  <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
                    Tidak ada pengajuan disetujui pada tahun ini.
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Intensitas warna mewakili total emisi (Gg CO₂e) dari manure.
                  Tooltip menampilkan baseline, mitigasi, dan persentase reduksi
                  per provinsi.
                </p>
              </CardContent>
            </Card>
            </section>
        </div>
  );
}
