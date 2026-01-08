"use client";

import * as React from "react";

import { RoleGuard } from "@/components/role-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  getVerifikasiQueue,
  STATUS_LABEL,
} from "@/lib/verifikasi-api";
import { SectionCards } from "@/components/section-cards";
import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Cell,
} from "recharts";
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

const STATUS_BAR_COLOR: Record<SubmissionStatus, string> = {
  menunggu_verifikasi: "var(--chart-4)",
  dalam_verifikasi: "var(--chart-5)",
  disetujui: "var(--chart-1)",
  ditolak: "var(--chart-2)",
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

export default function VerifikatorPage() {
  const [queue, setQueue] = React.useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadQueue = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVerifikasiQueue();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setQueue(sorted);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal memuat antrian verifikasi.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const statusCounts = React.useMemo(() => {
    return queue.reduce<Record<SubmissionStatus, number>>(
      (acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      },
      {
        menunggu_verifikasi: 0,
        dalam_verifikasi: 0,
        disetujui: 0,
        ditolak: 0,
      }
    );
  }, [queue]);

  const chartData = React.useMemo(
    () =>
      Object.entries(statusCounts).map(([status, value]) => ({
        status,
        label: STATUS_LABEL[status as SubmissionStatus] ?? status,
        value,
      })),
    [statusCounts]
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
                  <h1 className="text-2xl font-semibold">Panel Verifikator</h1>
                  <p className="text-sm text-muted-foreground">
                    Pantau pengajuan petugas dan lakukan verifikasi atau
                    persetujuan akhir.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadQueue} disabled={loading}>
                  {loading ? "Memuat…" : "Muat ulang"}
                </Button>
              </div>

              <SectionCards
                items={queue}
                loading={loading}
                error={error}
                onReload={loadQueue}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Status Pengajuan</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: TICK_COLOR }}
                        axisLine={{ stroke: GRID_COLOR }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: TICK_COLOR }}
                        axisLine={{ stroke: GRID_COLOR }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={TOOLTIP_LABEL_STYLE}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Pengajuan"
                        radius={[6, 6, 0, 0]}
                      >
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.status}
                            fill={
                              STATUS_BAR_COLOR[entry.status as SubmissionStatus] ??
                              "var(--chart-1)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Antrian Terbaru</CardTitle>
                    <CardDescription>
                      5 pengajuan terbaru siap ditinjau. Aksi lengkap tersedia di halaman riwayat.
                    </CardDescription>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/dashboard/verifikator/riwayat">
                      Kelola di Riwayat
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {queue.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border/40 bg-muted/40 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="font-semibold text-foreground">{item.id}</p>
                          <p className="text-muted-foreground">
                            {item.province} • {item.year} •{" "}
                            {new Date(item.updatedAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            STATUS_TONE[item.status]
                          )}
                        >
                          {STATUS_LABEL[item.status] ?? item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!queue.length && !loading ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada pengajuan menunggu verifikasi.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  );
}
