"use client";

import * as React from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getVerifikasiQueue,
  STATUS_LABEL,
} from "@/lib/verifikasi-api";
import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";
import { roundGg, ggToTon } from "@/lib/format";
import {
  getEmissionOverview,
  getEmissionTimeseries,
  type EmissionOverview,
  type TimeseriesPoint,
} from "@/lib/viewer-api";
import { SectionCards } from "@/components/section-cards";
import { EmissionTrendChart } from "@/components/superadmin/emission-trend-chart";
import { PROVINCE_COORDINATE_MAP } from "@/lib/indonesia-provinces";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_META: Record<
  SubmissionStatus,
  { label: string; badgeClass: string }
> = {
  menunggu_verifikasi: {
    label: STATUS_LABEL.menunggu_verifikasi,
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-400/20",
  },
  dalam_verifikasi: {
    label: STATUS_LABEL.dalam_verifikasi,
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-400/20",
  },
  disetujui: {
    label: STATUS_LABEL.disetujui,
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20",
  },
  ditolak: {
    label: STATUS_LABEL.ditolak,
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-400/20",
  },
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

function LatestQueue({
  items,
  loading,
  error,
  onReload,
}: {
  items: SubmissionRecord[];
  loading: boolean;
  error: string | null;
  onReload: () => void;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<SubmissionRecord | null>(
    null
  );

  const showDetail = (item: SubmissionRecord) => {
    setSelected(item);
    setDialogOpen(true);
  };

  const formatGgTon = (value: number) =>
    `${roundGg(value)} Gg / ${ggToTon(value).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} ton`;
  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Gagal memuat antrian</CardTitle>
            <CardDescription>Periksa koneksi API Anda.</CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={onReload}>
            Coba lagi
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold">
            Antrian Verifikasi Terbaru
          </CardTitle>
          <CardDescription>
            Ringkasan pengajuan petugas dan status dari tim verifikator.
          </CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-12 animate-pulse rounded-md bg-muted/60"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada pengajuan dari petugas.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 6).map((item) => {
              const meta = STATUS_META[item.status as SubmissionStatus];
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.id}</span>
                      <Badge
                        className={cn(
                          "capitalize",
                          meta?.badgeClass ?? "bg-muted text-muted-foreground"
                        )}
                        variant="secondary"
                      >
                        {meta?.label ?? item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.province} • {item.year} •{" "}
                      {new Date(item.createdAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => showDetail(item)}
                  >
                    Detail
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <p>
                  ID: <span className="font-medium text-foreground">{selected.id}</span>
                </p>
                <p>
                  Provinsi: <span className="font-medium text-foreground">{selected.province}</span>
                </p>
                <p>
                  Tahun: <span className="font-medium text-foreground">{selected.year}</span>
                </p>
                <p>
                  Status: <span className="font-medium text-foreground">{STATUS_LABEL[selected.status] ?? selected.status}</span>
                </p>
                <p>
                  Diperbarui: <span className="font-medium text-foreground">{new Date(selected.updatedAt).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}</span>
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Emisi</CardTitle>
                  <CardDescription>Hasil penghitungan dari petugas.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <DataRow
                    label="Baseline (Gg CO₂e/tahun)"
                    value={`${roundGg(selected.result.summary.baseline_GgCO2e)} Gg`}
                  />
                  <DataRow
                    label="Setelah Mitigasi"
                    value={`${roundGg(selected.result.summary.with_mitigation_GgCO2e)} Gg`}
                  />
                  <DataRow
                    label="Reduksi (Gg CO₂e/tahun)"
                    value={formatGgTon(selected.result.summary.reduction_GgCO2e)}
                  />
                  <DataRow
                    label="Reduksi (%)"
                    value={
                      <span className="flex flex-col leading-tight">
                        <span>{roundGg(selected.result.summary.reduction_percent)}%</span>
                        <span className="text-xs text-muted-foreground">
                          {ggToTon(selected.result.summary.reduction_GgCO2e).toLocaleString(
                            "id-ID",
                            { maximumFractionDigits: 2 }
                          )} ton CO₂e
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
                    value={formatGgTon(selected.result.manure_detail_GgCO2e.N2O_direct)}
                  />
                  <DataRow
                    label="N₂O Tidak Langsung"
                    value={formatGgTon(selected.result.manure_detail_GgCO2e.N2O_indirect)}
                  />
                  <DataRow
                    label="CH₄"
                    value={formatGgTon(selected.result.manure_detail_GgCO2e.CH4)}
                  />
                  <DataRow
                    label="Total"
                    value={formatGgTon(selected.result.manure_detail_GgCO2e.total)}
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
    </Card>
  );
}

export default function SuperadminPage() {
  const [queue, setQueue] = React.useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [overview, setOverview] = React.useState<EmissionOverview | null>(null);
  const [timeseries, setTimeseries] = React.useState<TimeseriesPoint[]>([]);
  const [timeseriesLoading, setTimeseriesLoading] = React.useState(false);
  const [timeseriesError, setTimeseriesError] = React.useState<string | null>(null);
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const AGGREGATE_PROVINCE = "ALL";
  const [timeseriesProvince, setTimeseriesProvince] = React.useState<string>(AGGREGATE_PROVINCE);
  const [timeseriesFromYear, setTimeseriesFromYear] = React.useState(currentYear - 5);
  const [timeseriesToYear, setTimeseriesToYear] = React.useState(currentYear);

  const yearFilterOptions = React.useMemo(() => {
    const minYear = 2015;
    const maxYear = currentYear;
    const years: number[] = [];
    for (let year = maxYear; year >= minYear; year -= 1) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  const provinceOptions = React.useMemo(() => {
    const codes = new Set<string>();
    queue.forEach((item) => {
      if (item.province) {
        codes.add(item.province);
      }
    });
    if (!codes.size) {
      Object.keys(PROVINCE_COORDINATE_MAP).forEach((code) => codes.add(code));
    }
    return Array.from(codes).sort((a, b) => a.localeCompare(b));
  }, [queue]);

  const provinceLabel =
    timeseriesProvince === AGGREGATE_PROVINCE
      ? "Seluruh provinsi (pengajuan disetujui)"
      : PROVINCE_COORDINATE_MAP[timeseriesProvince]?.name ??
        timeseriesProvince;

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queueData = await getVerifikasiQueue();
      setQueue(queueData);
      const latestYear = queueData.reduce(
        (acc, item) => Math.max(acc, item.year),
        currentYear
      );
      const targetFromYear = Math.max(2020, latestYear - 5);
      setTimeseriesFromYear(targetFromYear);
      setTimeseriesToYear(latestYear);
      setTimeseriesProvince(AGGREGATE_PROVINCE);

      const overviewData = await getEmissionOverview(latestYear).catch(
        () => null
      );
      setOverview(overviewData);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Tidak dapat mengambil data verifikasi";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [AGGREGATE_PROVINCE, currentYear]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleProvinceChange = React.useCallback((value: string) => {
    setTimeseriesProvince(value);
  }, []);

  const handleFromYearChange = React.useCallback((value: string) => {
    const next = Number(value);
    setTimeseriesFromYear(next);
    setTimeseriesToYear((prev) => (next > prev ? next : prev));
  }, []);

  const handleToYearChange = React.useCallback((value: string) => {
    const next = Number(value);
    setTimeseriesToYear(next);
    setTimeseriesFromYear((prev) => (prev > next ? next : prev));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const fetchTimeseries = async () => {
      setTimeseriesLoading(true);
      setTimeseriesError(null);
      try {
        const data = await getEmissionTimeseries(
          timeseriesProvince,
          timeseriesFromYear,
          timeseriesToYear
        );
        if (!cancelled) {
          setTimeseries(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Tidak dapat memuat tren emisi.";
          setTimeseriesError(message);
          setTimeseries([]);
        }
      } finally {
        if (!cancelled) {
          setTimeseriesLoading(false);
        }
      }
    };
    void fetchTimeseries();
    return () => {
      cancelled = true;
    };
  }, [timeseriesProvince, timeseriesFromYear, timeseriesToYear]);

  return (
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
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex items-center justify-between px-4 lg:px-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={load}
                  disabled={loading}
                >
                  {loading ? "Memuat…" : "Muat ulang data"}
                </Button>
              </div>

              <div className="px-4 lg:px-6">
                <SectionCards
                  items={queue}
                  loading={loading}
                  error={error}
                  onReload={load}
                  overview={overview}
                />
              </div>

              <div className="px-4 lg:px-6">
                <LatestQueue
                  items={queue}
                  loading={loading}
                  error={error}
                  onReload={load}
                />
              </div>

              <div className="px-4 lg:px-6 space-y-3">
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Provinsi</span>
                    <Select
                      value={timeseriesProvince}
                      onValueChange={handleProvinceChange}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Semua provinsi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AGGREGATE_PROVINCE}>
                          Semua provinsi
                        </SelectItem>
                        {provinceOptions.map((option) => {
                          const label =
                            PROVINCE_COORDINATE_MAP[option]?.name ?? option;
                          return (
                            <SelectItem key={option} value={option}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Dari tahun</span>
                    <Select
                      value={String(timeseriesFromYear)}
                      onValueChange={handleFromYearChange}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearFilterOptions.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Sampai</span>
                    <Select
                      value={String(timeseriesToYear)}
                      onValueChange={handleToYearChange}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearFilterOptions.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {timeseriesLoading ? (
                    <Skeleton className="h-5 w-24" />
                  ) : null}
                </div>
                {timeseriesError ? (
                  <p className="text-sm text-destructive">{timeseriesError}</p>
                ) : null}
                <EmissionTrendChart
                  data={timeseries}
                  loading={timeseriesLoading}
                  province={timeseriesProvince}
                  provinceLabel={provinceLabel}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
