"use client";

import * as React from "react";

import { RoleGuard } from "@/components/role-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";
import { STATUS_LABEL, getVerifikasiDetail } from "@/lib/verifikasi-api";
import { api } from "@/lib/api";
import { roundGg, ggToTon } from "@/lib/format";

const STATUS_TONE: Record<SubmissionStatus, string> = {
  menunggu_verifikasi:
    "bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200",
  dalam_verifikasi:
    "bg-blue-100 text-blue-900 dark:bg-blue-400/20 dark:text-blue-200",
  disetujui:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-200",
  ditolak:
    "bg-rose-100 text-rose-900 dark:bg-rose-400/20 dark:text-rose-200",
};

function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function SuperadminPengajuanPage() {
  const [rows, setRows] = React.useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [year, setYear] = React.useState<number>(new Date().getFullYear());
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detail, setDetail] = React.useState<SubmissionRecord | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<
    SubmissionStatus | "all"
  >("all");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<SubmissionRecord[]>("/submissions", {
        params: { year },
      });
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setRows(sorted);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal memuat daftar pengajuan.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (submission: SubmissionRecord) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const result = await getVerifikasiDetail(
        submission.province,
        submission.year,
        submission.id
      );
      setDetail(result);
    } catch (err) {
      console.error(err);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatGgTon = (value: number) =>
    `${roundGg(value)} Gg / ${ggToTon(value).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} ton`;

  const statusOptions = React.useMemo(
    () =>
      ([
        "menunggu_verifikasi",
        "dalam_verifikasi",
        "disetujui",
        "ditolak",
      ] as SubmissionStatus[]).map((status) => ({
        value: status,
        label: STATUS_LABEL[status] ?? status,
        count: rows.filter((item) => item.status === status).length,
      })),
    [rows]
  );

  const filteredRows = React.useMemo(
    () =>
      statusFilter === "all"
        ? rows
        : rows.filter((submission) => submission.status === statusFilter),
    [rows, statusFilter]
  );

  return (
    <RoleGuard allow={["superadmin"]}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold">Pengajuan Petugas</h1>
                  <p className="text-sm text-muted-foreground">
                    Ringkasan seluruh pengajuan dari petugas provinsi.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <label htmlFor="year-select">Tahun</label>
                  <select
                    id="year-select"
                    className="rounded border bg-background px-2 py-1 text-sm"
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                    disabled={loading}
                  >
                    {Array.from({ length: 8 }, (_, index) => new Date().getFullYear() - index).map(
                      (optionYear) => (
                        <option key={optionYear} value={optionYear}>
                          {optionYear}
                        </option>
                      )
                    )}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={load}
                    disabled={loading}
                  >
                    {loading ? "Memuat…" : "Muat ulang"}
                  </Button>
                </div>
              </div>

              {error ? (
                <Card className="border-destructive/40 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-base">Gagal memuat data</CardTitle>
                    <CardDescription>{error}</CardDescription>
                  </CardHeader>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Daftar Pengajuan</CardTitle>
                  <CardDescription>
                    Tampilan read-only untuk monitoring superadmin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => setStatusFilter("all")}
                    >
                      <span>Semua</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {rows.length}
                      </span>
                    </Button>
                    {statusOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={
                          statusFilter === option.value ? "default" : "outline"
                        }
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => setStatusFilter(option.value)}
                      >
                        <span>{option.label}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {option.count}
                        </span>
                      </Button>
                    ))}
                  </div>
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">ID</th>
                        <th className="px-3 py-2 text-left font-medium">Provinsi</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-left font-medium">Diperbarui</th>
                        <th className="px-3 py-2 text-left font-medium">Baseline</th>
                        <th className="px-3 py-2 text-left font-medium">Setelah Mitigasi</th>
                        <th className="px-3 py-2 text-left font-medium">Reduksi</th>
                        <th className="px-3 py-2 text-left font-medium">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((submission) => (
                        <tr key={submission.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2 font-medium text-foreground">
                            {submission.id}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {submission.province}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                STATUS_TONE[submission.status]
                              )}
                            >
                              {STATUS_LABEL[submission.status] ?? submission.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {new Date(submission.updatedAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {submission.result.summary.baseline_GgCO2e.toFixed(2)} Gg
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {submission.result.summary.with_mitigation_GgCO2e.toFixed(2)} Gg
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {submission.result.summary.reduction_GgCO2e.toFixed(2)} Gg
                          </td>
                          <td className="px-3 py-2">
                            <Button size="sm" variant="outline" onClick={() => openDetail(submission)}>
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filteredRows.length && !loading ? (
                    <p className="mt-4 text-sm text-muted-foreground">
                      {statusFilter === "all"
                        ? "Belum ada pengajuan untuk tahun ini."
                        : "Belum ada pengajuan dengan status tersebut."}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <p className="text-sm text-muted-foreground">Memuat detail…</p>
          ) : detail ? (
            <div className="space-y-4">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  ID: <span className="font-medium text-foreground">{detail.id}</span>
                </p>
                <p>
                  Provinsi:{" "}
                  <span className="font-medium text-foreground">{detail.province}</span>
                </p>
                <p>
                  Tahun: <span className="font-medium text-foreground">{detail.year}</span>
                </p>
                <p>
                  Status:{" "}
                  <span className="font-medium text-foreground">
                    {STATUS_LABEL[detail.status] ?? detail.status}
                  </span>
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Emisi</CardTitle>
                  <CardDescription>Hasil perhitungan dari petugas.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <DataRow
                    label="Baseline (Gg CO₂e/tahun)"
                    value={`${roundGg(detail.result.summary.baseline_GgCO2e)} Gg`}
                  />
                  <DataRow
                    label="Setelah Mitigasi"
                    value={`${roundGg(detail.result.summary.with_mitigation_GgCO2e)} Gg`}
                  />
                  <DataRow
                    label="Reduksi (Gg CO₂e/tahun)"
                    value={formatGgTon(detail.result.summary.reduction_GgCO2e)}
                  />
                  <DataRow
                    label="Reduksi (%)"
                    value={
                      <span className="flex flex-col leading-tight">
                        <span>{roundGg(detail.result.summary.reduction_percent)}%</span>
                        <span className="text-xs text-muted-foreground">
                          {ggToTon(detail.result.summary.reduction_GgCO2e).toLocaleString(
                            "id-ID",
                            { maximumFractionDigits: 2 }
                          )}{" "}
                          ton CO₂e
                        </span>
                      </span>
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detail Manure</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <DataRow
                    label="N₂O Langsung"
                    value={formatGgTon(detail.result.manure_detail_GgCO2e.N2O_direct)}
                  />
                  <DataRow
                    label="N₂O Tidak Langsung"
                    value={formatGgTon(detail.result.manure_detail_GgCO2e.N2O_indirect)}
                  />
                  <DataRow
                    label="CH₄"
                    value={formatGgTon(detail.result.manure_detail_GgCO2e.CH4)}
                  />
                  <DataRow
                    label="Total"
                    value={formatGgTon(detail.result.manure_detail_GgCO2e.total)}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Detail pengajuan tidak tersedia.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
