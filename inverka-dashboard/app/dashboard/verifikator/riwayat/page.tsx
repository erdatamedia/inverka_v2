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
import {
  STATUS_LABEL,
  deleteSubmissionRequest,
  getVerifikasiDetail,
  updateVerifikasiStatus,
} from "@/lib/verifikasi-api";
import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const STATUS_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  menunggu_verifikasi: ["dalam_verifikasi", "disetujui", "ditolak"],
  dalam_verifikasi: ["disetujui", "ditolak"],
  disetujui: [],
  ditolak: [],
};

export default function VerifikatorRiwayatPage() {
  const [rows, setRows] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<SubmissionRecord | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">(
    "all"
  );

  const load = useCallback(async () => {
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

  useEffect(() => {
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

  const handleDelete = async (submission: SubmissionRecord) => {
    const confirmed = window.confirm(
      `Hapus pengajuan ${submission.id} dari ${submission.province}?`
    );
    if (!confirmed) {
      return;
    }
    try {
      setDeletingId(submission.id);
      await deleteSubmissionRequest(submission.id, {
        province: submission.province,
        year: submission.year,
      });
      await load();
      if (detail?.id === submission.id) {
        setDetailOpen(false);
        setDetail(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal menghapus pengajuan.";
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const requireNoteStatuses: SubmissionStatus[] = [
    "disetujui",
    "ditolak",
  ];

  const handleStatusChange = async (
    submission: SubmissionRecord,
    nextStatus: SubmissionStatus
  ) => {
    if (!STATUS_TRANSITIONS[submission.status].includes(nextStatus)) {
      alert("Perubahan status tidak valid.");
      return;
    }
    let note: string | undefined;
    if (requireNoteStatuses.includes(nextStatus)) {
      note = window.prompt(
        `Masukkan catatan untuk status "${STATUS_LABEL[nextStatus] ?? nextStatus}":`
      ) ?? "";
      if (!note.trim()) {
        alert("Catatan wajib diisi untuk status ini.");
        return;
      }
    }
    try {
      setUpdatingId(submission.id);
      await updateVerifikasiStatus(submission.id, {
        province: submission.province,
        year: submission.year,
        status: nextStatus,
        note: note?.trim(),
      });
      await load();
      if (detail?.id === submission.id) {
        const refreshed = await getVerifikasiDetail(
          submission.province,
          submission.year,
          submission.id
        );
        setDetail(refreshed);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal memperbarui status.";
      alert(message);
    } finally {
      setUpdatingId(null);
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
    <RoleGuard allow={["verifikator", "superadmin"]}>
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
                  <h1 className="text-2xl font-semibold">Riwayat Pengajuan</h1>
                  <p className="text-sm text-muted-foreground">
                    Pantau semua pengajuan beserta status mutakhirnya.
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
                    Pengajuan terbaru berada di bagian atas.
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
                        <th className="px-3 py-2 text-left font-medium">
                          Catatan Terbaru
                        </th>
                        <th className="px-3 py-2 text-left font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((submission) => {
                        const latestNote =
                          submission.notes && submission.notes.length
                            ? submission.notes[submission.notes.length - 1]
                            : null;
                        return (
                          <tr
                            key={submission.id}
                            id={`row-${submission.status}`}
                            className="border-b last:border-b-0"
                          >
                          <td className="px-3 py-2 font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="whitespace-nowrap"
                                onClick={() => openDetail(submission)}
                              >
                                Detail
                              </Button>
                              <span>{submission.id}</span>
                            </div>
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
                          <td className="px-3 py-2 text-muted-foreground align-top">
                            {latestNote ? (
                              <div className="space-y-1">
                                <p className="text-foreground">{latestNote.note}</p>
                                <p className="text-[11px] uppercase text-muted-foreground">
                                  {STATUS_LABEL[latestNote.status] ?? latestNote.status} •{" "}
                                  {new Date(latestNote.updatedAt).toLocaleString("id-ID", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </p>
                              </div>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              {STATUS_TRANSITIONS[submission.status].length ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      disabled={updatingId === submission.id}
                                    >
                                      Ubah status
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {STATUS_TRANSITIONS[submission.status].map((status) => (
                                      <DropdownMenuItem
                                        key={status}
                                        disabled={updatingId === submission.id}
                                        onClick={() => handleStatusChange(submission, status)}
                                      >
                                        {STATUS_LABEL[status] ?? status}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <span className="self-center text-xs text-muted-foreground">
                                  Final
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={deletingId === submission.id}
                                onClick={() => handleDelete(submission)}
                              >
                                {deletingId === submission.id ? "Menghapus…" : "Hapus"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
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

              {detail.notes?.length ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Catatan Status</CardTitle>
                    <CardDescription>
                      Riwayat catatan ketika status diperbarui.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detail.notes
                      .slice()
                      .reverse()
                      .map((noteEntry, index) => (
                        <div
                          key={`${noteEntry.updatedAt}-${index}`}
                          className="rounded-lg border border-border/40 bg-muted/30 p-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>
                              {STATUS_LABEL[noteEntry.status] ?? noteEntry.status}
                            </span>
                            <span>
                              {new Date(noteEntry.updatedAt).toLocaleString("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                          <p className="mt-2 text-foreground">{noteEntry.note}</p>
                          {noteEntry.updatedBy ? (
                            <p className="text-xs text-muted-foreground">
                              Oleh: {noteEntry.updatedBy}
                            </p>
                          ) : null}
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ) : null}
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
