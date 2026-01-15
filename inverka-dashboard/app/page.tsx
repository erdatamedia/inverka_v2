"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Globe2,
  Leaf,
  Layers,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import type { Layer, Path, PathOptions } from "leaflet";

import { LeafletMap } from "@/components/leaflet-map";
import { GeoJSONLayer } from "@/components/geojson-layer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LANDING_MAP_BOUNDS,
  LANDING_MAP_DATA,
  LANDING_MAP_TOTALS,
} from "@/lib/landing-map-data";
import { getEmissionColor } from "@/lib/emission-gradient";
import { PROVINCE_BOUNDARIES } from "@/lib/province-geojson";
import type { ProvinceGeoFeature } from "@/lib/province-geojson";

const emissionHighlights = [
  {
    label: "Emisi Baseline Nasional",
    value: "312,4",
    unit: "juta ton CO₂e",
    caption: "Inventori terakhir (2023) seluruh provinsi",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: "Reduksi Tahun Berjalan",
    value: "8,9",
    unit: "juta ton CO₂e",
    caption: "Akumulasi aksi mitigasi terverifikasi",
    icon: <Leaf className="h-5 w-5" />,
  },
  {
    label: "Partisipasi Provinsi",
    value: "38",
    unit: "provinsi",
    caption: "Menginput baseline & data mitigasi",
    icon: <Globe2 className="h-5 w-5" />,
  },
];

const landingNavLinks = [
  { href: "#fitur", label: "Fitur" },
  { href: "#data", label: "Data" },
  { href: "#peta", label: "Peta & Insight" },
];

type FeatureMenuItem = {
  id: string;
  label: string;
  summary: string;
  description: string;
  audience: string;
  icon: LucideIcon;
};

const featureMenuItems: FeatureMenuItem[] = [
  {
    id: "feature-baseline",
    label: "Inventori Baseline",
    summary: "Populasi ternak, faktor emisi, dan QA/QC terintegrasi.",
    description:
      "Petugas provinsi mengisi aktivitas ternak dan faktor emisi referensi sehingga baseline mengikuti metodologi IPCC 2006/2019.",
    audience: "Petugas provinsi",
    icon: Layers,
  },
  {
    id: "feature-mitigasi",
    label: "Aksi Mitigasi Enterik",
    summary: "Simulasikan formula pakan dan aksi reduksi.",
    description:
      "Kalkulator enterik membantu menghitung dampak substitusi pakan, feed additive, dan perbaikan manajemen terhadap intensitas emisi.",
    audience: "Tim mitigasi",
    icon: Leaf,
  },
  {
    id: "feature-verifikasi",
    label: "Verifikasi Nasional",
    summary: "Log audit, catatan review, dan status penerimaan.",
    description:
      "Verifikator nasional memeriksa bukti lapangan, memberikan catatan koreksi, dan mengesahkan laporan sebelum agregasi nasional.",
    audience: "Verifikator",
    icon: ShieldCheck,
  },
  {
    id: "feature-analitik",
    label: "Analitik & Insight",
    summary: "Dashboard spasial, API publik, dan ekspor laporan.",
    description:
      "Panel analitik menampilkan tren reduksi per-provinsi, membantu menetapkan prioritas intervensi dan sinkronisasi dengan target NDC.",
    audience: "Analis & pengambil kebijakan",
    icon: Activity,
  },
];

type LandingProvinceMetric = {
  name: string;
  emission: number;
  mitigation: number;
  reductionPct: number;
};

const formatLandingNumber = (value: number, fractionDigits = 1) =>
  value.toLocaleString("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const LANDING_MAX_EMISSION = Math.max(
  1,
  ...LANDING_MAP_DATA.map((item) => item.emission)
);

const LANDING_REDUCTION_PCT = LANDING_MAP_TOTALS.baseline
  ? Number(
      (
        (LANDING_MAP_TOTALS.reduction / LANDING_MAP_TOTALS.baseline) *
        100
      ).toFixed(1)
    )
  : 0;

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const landingProvinceMetrics = useMemo(() => {
    const metrics = new Map<string, LandingProvinceMetric>();
    for (const item of LANDING_MAP_DATA) {
      metrics.set(item.code, {
        name: item.name,
        emission: item.emission,
        mitigation: item.mitigation,
        reductionPct: item.reductionPct,
      });
    }
    return metrics;
  }, []);

  const getLandingProvinceStyle = useCallback(
    (feature?: ProvinceGeoFeature): PathOptions => {
      const code = feature?.properties?.ISO_CODE ?? "";
      const metric = code ? landingProvinceMetrics.get(code) : undefined;
      const ratio =
        metric && LANDING_MAX_EMISSION > 0
          ? Math.min(1, metric.emission / LANDING_MAX_EMISSION)
          : 0;
      return {
        color: "rgba(15, 23, 42, 0.3)",
        weight: 1,
        fillColor: getEmissionColor(ratio),
        fillOpacity: metric ? 0.35 + ratio * 0.4 : 0.08,
      };
    },
    [landingProvinceMetrics]
  );

  const buildLandingTooltip = useCallback(
    (metric?: LandingProvinceMetric, fallbackName?: string) => {
      if (!metric) {
        const name = fallbackName ?? "Provinsi";
        return `<div><strong>${name}</strong><br/><span style="font-size:11px;">Belum ada data estimasi</span></div>`;
      }
      return `<div style="line-height:1.4;">
        <strong>${metric.name}</strong><br/>
        <span style="font-size:11px;">Baseline: ${formatLandingNumber(metric.emission, 2)} Gg CO₂e</span><br/>
        <span style="font-size:11px;">Mitigasi: ${formatLandingNumber(metric.mitigation, 2)} Gg CO₂e</span><br/>
        <span style="font-size:11px;">Reduksi: ${formatLandingNumber(metric.reductionPct, 1)}%</span>
      </div>`;
    },
    []
  );

  const handleLandingProvince = useCallback(
    (feature: ProvinceGeoFeature, layer: Layer) => {
      const code = feature?.properties?.ISO_CODE ?? "";
      const metric = code ? landingProvinceMetrics.get(code) : undefined;
      layer.bindTooltip(
        buildLandingTooltip(metric, feature?.properties?.PROVINSI),
        {
          direction: "auto",
          sticky: true,
          opacity: 0.95,
          className: "province-tooltip",
        }
      );

      layer.on({
        mouseover: () => {
          const pathLayer = layer as Path;
          if (typeof pathLayer.setStyle === "function") {
            const baseStyle = getLandingProvinceStyle(feature);
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
            pathLayer.setStyle(getLandingProvinceStyle(feature));
          }
        },
      });
    },
    [buildLandingTooltip, getLandingProvinceStyle, landingProvinceMetrics]
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          isScrolled
            ? "bg-white/40 backdrop-blur-lg shadow-lg dark:bg-slate-950/50"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-inverka.png"
              alt="Logo Inverka"
              width={42}
              height={42}
              className="rounded-lg border border-primary/20 bg-white p-1 shadow-sm"
              priority
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.5em] text-primary">
                Inverka
              </span>
              <span className="text-sm text-muted-foreground">
                Inventory &amp; Emission Dashboard
              </span>
            </div>
          </div>
          <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            {landingNavLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-primary focus-visible:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex w-full justify-end gap-3 sm:w-auto">
            <Button asChild size="sm" variant="outline">
              <Link href="#fitur" className="inline-flex items-center gap-1">
                Fitur
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login" className="inline-flex items-center gap-1">
                Masuk
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section
          id="hero"
          className="relative isolate overflow-hidden px-4 py-12 sm:py-16"
        >
          <div className="absolute inset-0 -z-20">
            <video
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              aria-hidden
            >
              <source
                src="https://storage.googleapis.com/coverr-main/mp4/Mare.mp4"
                type="video/mp4"
              />
            </video>
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-900/80 via-emerald-800/70 to-slate-950/80" />
          <div className="container mx-auto grid gap-12 rounded-[32px] border border-white/15 bg-white/80 px-6 py-10 shadow-2xl backdrop-blur hero-emerald lg:grid-cols-[3fr_2fr] lg:items-center dark:bg-slate-900/70">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-primary">
                <PlayCircle className="h-4 w-4" />
                Video Latar Lapangan
              </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Platform nasional untuk inventori dan mitigasi emisi peternakan
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                INVERKA membantu pemerintah daerah dan tim nasional menghitung emisi baseline,
                mendokumentasikan aksi mitigasi, dan memantau reduksi gas rumah kaca sektor peternakan.
                Data yang tersusun rapi memudahkan evaluasi target NDC dan perencanaan kebijakan.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-sm font-semibold">
                    Workflow terstandar IPCC
                  </CardTitle>
                  <CardDescription>
                    Input baseline ternak, aksi mitigasi, hingga verifikasi nasional mengikuti
                    pedoman IPCC 2006/2019.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-sm font-semibold">
                    Kolaborasi lintas peran
                  </CardTitle>
                  <CardDescription>
                    Petugas provinsi, verifikator nasional, dan analis dapat bekerja pada satu sumber data yang sama.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded border px-3 py-1">
                <span className="size-2 rounded-full bg-primary"></span>
                Terintegrasi dengan API nasional
              </span>
              <span className="inline-flex items-center gap-2 rounded border px-3 py-1">
                <span className="size-2 rounded-full bg-emerald-500"></span>
                Dukungan peta & analisis spasial
              </span>
            </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                  Menu Fitur
                </p>
                <div className="flex flex-wrap gap-2">
                  {featureMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={`#${item.id}`}
                        className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:bg-slate-900/70 dark:text-slate-200"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                        <ArrowRight className="h-3 w-3 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </Link>
                    );
                  })}
                </div>
              </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-emerald-100/80 via-white to-emerald-50 p-8 shadow-xl dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
            <div className="absolute inset-y-0 right-0 w-1/2 opacity-50 blur-3xl">
              <div className="h-full w-full bg-gradient-to-br from-primary/40 via-primary/10 to-transparent"></div>
            </div>
            <div className="relative space-y-6 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-primary">Hero Banner</p>
                <h2 className="text-2xl font-semibold text-foreground">
                  Visualisasi spasial &amp; analitik emisi dalam satu platform
                </h2>
                <p>
                  Inverka menyajikan ekosistem lengkap mulai dari input data hingga pemantauan reduksi.
                  Banner hero ini menggambarkan bahwa peta interaktif dan analitik sudah siap ketika Anda masuk.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                    Pusat data
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    38 Provinsi
                  </p>
                  <p className="text-xs">
                    Seluruh provinsi sudah terhubung dengan pipeline data nasional.
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                    Siklus lengkap
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    Input → Mitigasi → Verifikasi
                  </p>
                  <p className="text-xs">
                    Workflow terintegrasi memastikan tidak ada data yang tercecer.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section
          id="fitur"
          className="relative isolate overflow-hidden border-y border-white/10 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 py-16 text-emerald-50 dark:border-slate-800"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-[url('/landing-grid.svg')] bg-fixed bg-[length:520px_520px] opacity-30"
          />
          <div className="absolute inset-x-0 top-[-20%] -z-10 h-[60%] bg-gradient-to-b from-primary/30 via-transparent to-transparent blur-3xl" />
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">
                Menu fitur lintas peran
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">
                Workflow yang terhubung dari lapangan sampai verifikasi nasional
              </h2>
              <p className="mt-3 text-sm text-emerald-100">
                Parallax background yang bergerak pelan membantu menonjolkan setiap fitur ketika Anda
                menggulirkan halaman. Pilih salah satu menu untuk langsung melompat ke detailnya.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {featureMenuItems.map((item, index) => {
                const Icon = item.icon;
                const parallaxOffset = index % 2 === 0 ? "lg:-translate-y-2" : "lg:translate-y-2";
                return (
                  <article
                    key={item.id}
                    id={item.id}
                    className={`scroll-mt-28 rounded-3xl border border-white/20 bg-white/90 p-6 text-slate-900 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-primary/50 dark:bg-slate-950/80 dark:text-slate-50 ${parallaxOffset}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-2xl bg-primary/15 p-3 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {item.summary}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-200">
                      {item.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1">
                        {item.audience}
                      </span>
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-1 font-semibold text-primary transition hover:gap-1.5"
                      >
                        Coba sekarang
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="data"
          className="bg-gradient-to-br from-emerald-50/40 via-background to-emerald-100/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
        >
          <div className="container mx-auto grid gap-4 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
            {emissionHighlights.map((item) => (
              <Card
                key={item.label}
                className="border border-primary/10 bg-white/80 shadow-lg transition hover:border-primary/30 dark:bg-slate-900/70"
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    {item.label}
                  </CardTitle>
                  <span className="rounded-full bg-primary/10 p-2 text-primary">
                    {item.icon}
                  </span>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-semibold text-foreground">
                    {item.value}
                    <span className="ml-1 text-base font-normal text-muted-foreground">
                      {item.unit}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.caption}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto grid gap-6 px-6 py-16 md:grid-cols-2">
          <Card className="border border-primary/10 bg-white/90 shadow-lg dark:bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-lg">Apa itu INVERKA?</CardTitle>
              <CardDescription>
                Sistem terpadu perhitungan emisi sektor peternakan Indonesia.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Aplikasi ini memusatkan data aktivitas ternak, parameter, faktor emisi, aksi mitigasi,
                hingga proses verifikasi. Hasilnya, Indonesia memiliki satu sumber kebenaran untuk laporan
                gas rumah kaca sektor peternakan.
              </p>
              <ul className="grid gap-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-primary"></span>
                  Workflow lengkap: petugas → verifikator → ringkasan nasional.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-primary"></span>
                  Analitik dan grafik otomatis untuk kebutuhan laporan NDC.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-primary"></span>
                  Dukungan GIS untuk melihat hotspot emisi dan potensi mitigasi.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-primary/10 bg-white/90 shadow-lg dark:bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-lg">Siapa yang menggunakan?</CardTitle>
              <CardDescription>
                Playground UAT untuk stakeholder utama.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <div>
                <h3 className="font-medium text-foreground">Petugas Provinsi</h3>
                <p>
                  Menginput baseline ternak, aksi mitigasi, dan memantau dampak emisi secara real time.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Verifikator Nasional</h3>
                <p>
                  Memeriksa kelengkapan dan validitas pengajuan sebelum disahkan dalam ringkasan nasional.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Tim Analisis &amp; Viewer</h3>
                <p>
                  Melihat grafik, peta, dan tren reduksi untuk laporan internal maupun internasional.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section
          id="peta"
          className="border-t border-primary/10 bg-gradient-to-b from-background to-emerald-50/60 dark:from-slate-900 dark:to-slate-950"
        >
          <div className="container mx-auto flex flex-col gap-8 px-6 py-16">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-primary">
                  Peta GIS Emisi
                </p>
                <h3 className="text-2xl font-semibold text-foreground">
                  Distribusi emisi ternak nasional
                </h3>
                <p className="text-sm text-muted-foreground">
                  Lihat konsentrasi emisi baseline, capaian mitigasi, dan fokus reduksi
                  untuk tiap provinsi. Peta ini menampilkan agregat nasional dan
                  diperbarui secara otomatis dari input petugas.
                </p>
              </div>
              <div className="grid gap-3 text-right text-xs text-muted-foreground sm:grid-cols-2 sm:text-left">
                <div>
                  <p className="uppercase tracking-wide text-[11px] text-muted-foreground/80">
                    Baseline estimasi
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatLandingNumber(LANDING_MAP_TOTALS.baseline)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      Gg CO₂e
                    </span>
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-[11px] text-muted-foreground/80">
                    Setelah mitigasi
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatLandingNumber(LANDING_MAP_TOTALS.mitigation)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      Gg CO₂e
                    </span>
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-[11px] text-muted-foreground/80">
                    Reduksi estimasi
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatLandingNumber(LANDING_MAP_TOTALS.reduction)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      Gg CO₂e
                    </span>
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-[11px] text-muted-foreground/80">
                    Persentase reduksi
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {LANDING_REDUCTION_PCT}%{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      (tanpa filter)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <LeafletMap
              className="h-[520px] rounded-3xl border border-primary/15 shadow-2xl"
              bounds={LANDING_MAP_BOUNDS}
              scrollWheelZoom={false}
            >
              <GeoJSONLayer
                key={`landing-choropleth-bottom-${LANDING_MAP_DATA.length}`}
                data={PROVINCE_BOUNDARIES}
                style={getLandingProvinceStyle}
                onEachFeature={handleLandingProvince}
              />
            </LeafletMap>

            <p className="text-xs text-muted-foreground">
              Tampilan ini bersifat read-only dan memperlihatkan estimasi nasional.
              Masuk sebagai Viewer untuk mengubah skenario tahun, mengeksplorasi data
              detail, serta mengunduh ringkasan per-provinsi.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-primary/10 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 py-6 text-xs text-emerald-50">
        <div className="container mx-auto flex flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Inverka v2 — BRIN</span>
        </div>
      </footer>
    </div>
  );
}
