"use client";

import { useMemo } from "react";
import { IconRefresh } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/verifikasi-api";
import { EmissionOverview } from "@/lib/viewer-api";
import { cn } from "@/lib/utils";

type Metric = {
  key: string;
  label: string;
  value: number | string;
  caption: string;
  badge?: string;
  tone?: "default" | "warning" | "success" | "muted";
};

const TONE_CLASS: Record<NonNullable<Metric["tone"]>, string> = {
  default:
    "data-[slot=card]:bg-gradient-to-t data-[slot=card]:from-primary/5 data-[slot=card]:to-card",
  warning:
    "data-[slot=card]:bg-gradient-to-t data-[slot=card]:from-amber-100/40 data-[slot=card]:to-card",
  success:
    "data-[slot=card]:bg-gradient-to-t data-[slot=card]:from-emerald-100/40 data-[slot=card]:to-card",
  muted:
    "data-[slot=card]:bg-gradient-to-t data-[slot=card]:from-muted/50 data-[slot=card]:to-card",
};

const BADGE_CLASS: Record<
  NonNullable<Metric["tone"]>,
  string
> = {
  default: "",
  warning: "bg-amber-100 text-amber-900",
  success: "bg-emerald-100 text-emerald-900",
  muted: "bg-muted text-muted-foreground",
};

interface SectionCardsProps {
  items: SubmissionRecord[];
  loading: boolean;
  error: string | null;
  onReload?: () => void;
  overview?: EmissionOverview | null;
}

const formatEmission = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);

export function SectionCards({
  items,
  loading,
  error,
  onReload,
  overview,
}: SectionCardsProps) {
  const metrics = useMemo<Metric[]>(() => {
    const byStatus: Record<SubmissionStatus, number> = {
      menunggu_verifikasi: 0,
      dalam_verifikasi: 0,
      disetujui: 0,
      ditolak: 0,
    };
    const provinces = new Set<string>();
    let last24h = 0;
    const now = Date.now();

    for (const item of items) {
      provinces.add(item.province);
      if (byStatus[item.status as SubmissionStatus] !== undefined) {
        byStatus[item.status as SubmissionStatus] += 1;
      }
      if (now - new Date(item.createdAt).getTime() <= 24 * 60 * 60 * 1000) {
        last24h += 1;
      }
    }

    const total = items.length;

    const statusMetrics: Metric[] = [
      {
        key: "menunggu_verifikasi",
        label: STATUS_LABEL.menunggu_verifikasi,
        value: byStatus.menunggu_verifikasi,
        caption: "Menunggu dipilah verifikator",
        badge: "Prioritas utama",
        tone: "warning",
      },
      {
        key: "dalam_verifikasi",
        label: STATUS_LABEL.dalam_verifikasi,
        value: byStatus.dalam_verifikasi,
        caption: "Sedang diverifikasi tim",
        tone: "default",
      },
      {
        key: "disetujui",
        label: STATUS_LABEL.disetujui,
        value: byStatus.disetujui,
        caption:
          byStatus.disetujui > 0
            ? "Telah disetujui & siap lanjut implementasi"
            : "Belum ada pengajuan disetujui",
        badge: "Akhir proses",
        tone: byStatus.disetujui ? "success" : "muted",
      },
      {
        key: "ditolak",
        label: STATUS_LABEL.ditolak,
        value: byStatus.ditolak,
        caption: "Perlu revisi dari petugas",
        tone: "default",
      },
    ];

    const summaryMetric: Metric = {
      key: "total",
      label: "Total Pengajuan",
      value: total,
      caption:
        total === 0
          ? "Belum ada pengajuan dari petugas"
          : `${provinces.size} provinsi terlibat${
              last24h ? ` • ${last24h} baru 24 jam` : ""
            }`,
      badge: "Pengajuan Petugas",
      tone: total ? "default" : "muted",
    };

    return [summaryMetric, ...statusMetrics];
  }, [items]);

  const emissionCards: Metric[] = overview
    ? [
        {
          key: "baseline",
          label: "Total Emisi Baseline",
          value: `${formatEmission(overview.baseline)} ton CO2e`,
          caption: `${overview.submissions} pengajuan disetujui`,
          badge: `Tahun ${overview.year}`,
          tone: "muted",
        },
        {
          key: "mitigation",
          label: "Setelah Mitigasi",
          value: `${formatEmission(overview.mitigation)} ton CO2e`,
          caption: "Akumulasi seluruh provinsi",
          tone: "default",
        },
        {
          key: "reducedPct",
          label: "Penurunan Emisi",
          value: `${overview.reducedPct.toFixed(2)}% | ${formatEmission(
            overview.baseline - overview.mitigation
          )} ton CO₂e`,
          caption:
            overview.reducedPct > 0
              ? "Perbandingan terhadap baseline"
              : "Belum ada penurunan tercatat",
          tone: overview.reducedPct > 0 ? "success" : "muted",
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 @5xl/main:grid-cols-4">
      {error ? (
        <Card className="col-span-full border-destructive/40 bg-destructive/5">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Gagal memuat KPI</CardTitle>
            {onReload ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-destructive underline-offset-4 hover:underline"
                onClick={onReload}
              >
                <IconRefresh className="size-4" />
                Coba lagi
              </button>
            ) : null}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive/80">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {[...metrics, ...emissionCards].map((metric) => (
        <Card
          key={metric.key}
          data-slot="card"
          className={cn(
            "relative overflow-hidden border border-border/60 shadow-xs transition hover:shadow-sm",
            metric.tone ? TONE_CLASS[metric.tone] : TONE_CLASS.default
          )}
        >
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-medium">
                {metric.label}
              </CardTitle>
              {metric.badge ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-wide",
                    metric.tone ? BADGE_CLASS[metric.tone] : ""
                  )}
                >
                  {metric.badge}
                </Badge>
              ) : null}
            </div>
            <div className="text-3xl font-semibold tabular-nums">
              {loading ? "…" : metric.value}
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              {metric.caption}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
