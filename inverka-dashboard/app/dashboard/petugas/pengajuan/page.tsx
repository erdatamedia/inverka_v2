"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STATUS_LABEL } from "@/lib/verifikasi-api";
import type { SubmissionStatus } from "@/lib/types";
import { usePetugas } from "@/store/usePetugas";
import { cn } from "@/lib/utils";

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

export default function PetugasSubmissionsPage() {
  const {
    year,
    setYear,
    submissions,
    submissionsLoading,
    submissionsError,
    loadSubmissions,
  } = usePetugas((state) => ({
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

  const statusTotals = React.useMemo(() => {
    return submissions.reduce<Record<SubmissionStatus, number>>(
      (acc, submission) => {
        acc[submission.status] = (acc[submission.status] ?? 0) + 1;
        return acc;
      },
      {
        menunggu_verifikasi: 0,
        dalam_verifikasi: 0,
        disetujui: 0,
        ditolak: 0,
      }
    );
  }, [submissions]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Daftar Pengajuan</h1>
          <p className="text-sm text-muted-foreground">
            Riwayat pengajuan perhitungan emisi beserta status verifikasinya.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <label htmlFor="year-filter" className="font-medium">
            Tahun
          </label>
          <select
            id="year-filter"
            className="rounded border border-border/60 bg-background px-2 py-1 text-sm shadow-sm"
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadSubmissions(year)}
            disabled={submissionsLoading}
          >
            {submissionsLoading ? "Memuat…" : "Muat ulang"}
          </Button>
        </div>
      </div>

      {submissionsError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base">Gagal memuat pengajuan</CardTitle>
            <CardDescription>{submissionsError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Status Pengajuan</CardTitle>
          <CardDescription>
            Total pengajuan berdasarkan status terbaru.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              "menunggu_verifikasi",
              "dalam_verifikasi",
              "disetujui",
              "ditolak",
            ] as SubmissionStatus[]
          ).map((status) => (
            <div
              key={status}
              className="rounded border border-border/40 bg-muted/40 p-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {STATUS_LABEL[status] ?? status}
                </span>
                <span className="font-semibold text-foreground">
                  {statusTotals[status] ?? 0}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengajuan Tahun {year}</CardTitle>
          <CardDescription>
            Pengajuan terbaru berada di bagian atas daftar.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Diperbarui</th>
                <th className="px-3 py-2 text-left font-medium">Baseline</th>
                <th className="px-3 py-2 text-left font-medium">Setelah Mitigasi</th>
                <th className="px-3 py-2 text-left font-medium">Reduksi</th>
                <th className="px-3 py-2 text-left font-medium">
                  Catatan Verifikator
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => {
                const latestNote =
                  submission.notes && submission.notes.length
                    ? submission.notes[submission.notes.length - 1]
                    : null;
                return (
                  <tr key={submission.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium text-foreground">
                      {submission.id}
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
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!submissions.length && !submissionsLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Belum ada pengajuan untuk tahun ini.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
