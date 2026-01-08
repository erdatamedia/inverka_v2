"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { roundGg, ggToTon } from "@/lib/format";
import { usePetugas } from "@/store/usePetugas";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import { STATUS_LABEL } from "@/lib/verifikasi-api";
import type { SubmissionStatus } from "@/lib/types";

const PETUGAS_CHART_COLORS = {
  baseline: "var(--chart-1)",
  mitigated: "var(--chart-2)",
};
const CHART_GRID_COLOR = "var(--border)";
const CHART_TICK_COLOR = "var(--muted-foreground)";
const CHART_TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  borderColor: "var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
};
const CHART_TOOLTIP_LABEL_STYLE = {
  color: "var(--muted-foreground)",
};

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

const STATUS_ORDER: SubmissionStatus[] = [
  "menunggu_verifikasi",
  "dalam_verifikasi",
  "disetujui",
  "ditolak",
];

export default function PetugasSummaryPage() {
  const {
    input,
    result,
    loading,
    year,
    setYear,
    submissions,
    submissionsLoading,
    submissionsError,
    loadSubmissions,
  } = usePetugas((state) => ({
    input: state.input,
    result: state.result,
    loading: state.loading,
    year: state.year,
    setYear: state.setYear,
    submissions: state.submissions,
    submissionsLoading: state.submissionsLoading,
    submissionsError: state.submissionsError,
    loadSubmissions: state.loadSubmissions,
  }));

  React.useEffect(() => {
    void loadSubmissions(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const statusCounts = React.useMemo(() => {
    return submissions.reduce<Record<SubmissionStatus, number>>((acc, item) => {
      const key = item.status as SubmissionStatus;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {
      menunggu_verifikasi: 0,
      dalam_verifikasi: 0,
      disetujui: 0,
      ditolak: 0,
    });
  }, [submissions]);

  const chartData = React.useMemo(
    () =>
      submissions.map((submission) => ({
        id: submission.id,
        status: submission.status,
        baseline: submission.result.summary.baseline_GgCO2e,
        mitigated: submission.result.summary.with_mitigation_GgCO2e,
        reduction: submission.result.summary.reduction_GgCO2e,
      })),
    [submissions]
  );

  const formatGgTon = (value: number) =>
    `${roundGg(value)} Gg / ${ggToTon(value).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} ton`;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Ringkasan
        </p>
        <h1 className="text-2xl font-semibold leading-tight">
          Ikhtisar Aktivitas Petugas
        </h1>
        <p className="text-sm text-muted-foreground">
          Lihat status input terbaru dan hasil perhitungan. Gunakan tombol di
          bawah untuk melanjutkan ke halaman perhitungan manure atau ringkasan
          GRK enterik.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Tahun aktif:</span>
          <select
            className="rounded border bg-background px-2 py-1 text-sm"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            disabled={submissionsLoading}
          >
            {Array.from({ length: 8 }, (_, index) => new Date().getFullYear() - index).map(
              (optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}
                </option>
              )
            )}
          </select>
          {submissionsError ? (
            <span className="text-destructive">
              Tidak dapat memuat pengajuan ({submissionsError})
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/petugas/perhitungan-manure">
              Mulai perhitungan manure
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/petugas/perhitungan-enterik">
              Lihat GRK enterik
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Input Terakhir</CardTitle>
            <CardDescription>
              Rangkuman input yang saat ini tersimpan pada perhitungan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DataRow
              label="Provinsi"
              value={input.province_id || "Belum dipilih"}
            />
            <DataRow
              label="Total Populasi"
              value={Intl.NumberFormat("id-ID").format(
                input.total_population ?? 0
              )}
            />
            <DataRow
              label="Jumlah Aksi Mitigasi"
              value={input.mitigations.length}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hasil Perhitungan</CardTitle>
            <CardDescription>
              {loading
                ? "Sedang menghitung emisi, mohon tunggu…"
                : result
                ? "Hasil terakhir dari perhitungan manure & enterik."
                : "Belum ada perhitungan. Kerjakan perhitungan manure terlebih dahulu."}
            </CardDescription>
          </CardHeader>
          {result ? (
            <CardContent className="space-y-3">
              <DataRow
                label="Baseline (Gg CO₂e/tahun)"
                value={`${roundGg(result.summary.baseline_GgCO2e)} Gg`}
              />
              <DataRow
                label="Setelah Mitigasi (Gg CO₂e/tahun)"
                value={`${roundGg(result.summary.with_mitigation_GgCO2e)} Gg`}
              />
              <DataRow
                label="Reduksi (Gg CO₂e/tahun)"
                value={formatGgTon(result.summary.reduction_GgCO2e)}
              />
              <DataRow
                label="Reduksi (%)"
                value={
                  <span className="flex flex-col leading-tight">
                    <span>{roundGg(result.summary.reduction_percent)}%</span>
                    <span className="text-xs text-muted-foreground">
                      {ggToTon(result.summary.reduction_GgCO2e).toLocaleString(
                        "id-ID",
                        { maximumFractionDigits: 2 }
                      )} ton CO₂e
                    </span>
                  </span>
                }
              />
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Mulai perhitungan untuk melihat ringkasan hasil di sini.
              </p>
            </CardContent>
          )}
        </Card>
      </section>

      {result ? (
        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Detail Manure (Gg CO₂e/tahun)</CardTitle>
              <CardDescription>
                Rincian emisi berdasarkan sumber N₂O dan CH₄ dari pengelolaan
                manure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DataRow
                label="N₂O Langsung"
                value={formatGgTon(result.manure_detail_GgCO2e.N2O_direct)}
              />
              <DataRow
                label="N₂O Tidak Langsung"
                value={formatGgTon(result.manure_detail_GgCO2e.N2O_indirect)}
              />
              <DataRow
                label="CH₄"
                value={formatGgTon(result.manure_detail_GgCO2e.CH4)}
              />
              <DataRow
                label="Total"
                value={formatGgTon(result.manure_detail_GgCO2e.total)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detail GRK Enterik</CardTitle>
              <CardDescription>
                Perkiraan emisi enterik berdasarkan hasil perhitungan terakhir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DataRow
                label="CH₄ (ton/tahun)"
                value={result.enteric_detail.CH4_ton.toFixed(2)}
              />
              <DataRow
                label="CH₄ (ton CO₂e/tahun)"
                value={result.enteric_detail.CH4_CO2e_ton.toFixed(2)}
              />
              <DataRow
                label="CH₄ (Gg CO₂e/tahun)"
                value={roundGg(result.enteric_detail.CH4_GgCO2e)}
              />
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Pengajuan</CardTitle>
            <CardDescription>
              Rekap status verifikasi untuk tahun {year}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {STATUS_ORDER.map((status) => (
              <DataRow
                key={status}
                label={STATUS_LABEL[status] ?? status}
                value={statusCounts[status] ?? 0}
              />
            ))}
            <DataRow label="Total Pengajuan" value={submissions.length} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grafik Emisi Pengajuan</CardTitle>
            <CardDescription>
              Perbandingan baseline dan setelah mitigasi untuk setiap pengajuan.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
                  <XAxis dataKey="id" hide />
                  <YAxis
                    unit=" Gg"
                    tick={{ fill: CHART_TICK_COLOR }}
                    axisLine={{ stroke: CHART_GRID_COLOR }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => `${roundGg(value)} Gg`}
                    labelFormatter={(label) => `Pengajuan ${label}`}
                    contentStyle={CHART_TOOLTIP_STYLE}
                    labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                  />
                  <Legend />
                  <Bar
                    dataKey="baseline"
                    name="Baseline"
                    fill={PETUGAS_CHART_COLORS.baseline}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="mitigated"
                    name="Setelah Mitigasi"
                    fill={PETUGAS_CHART_COLORS.mitigated}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada data pengajuan untuk ditampilkan.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
