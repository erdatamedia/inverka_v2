"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActivityDataRow } from "@/lib/types";
import { usePetugas } from "@/store/usePetugas";
import Cookies from "js-cookie";

export function PopulationForm() {
  const {
    input,
    setInput,
    setProvince,
    next,
    loadActivityData,
    activityData,
    activityLoading,
    activityError,
    mitigationOptions,
    mitigationLoading,
    year,
    setYear,
  } = usePetugas((state) => ({
    input: state.input,
    setInput: state.setInput,
    setProvince: state.setProvince,
    next: state.next,
    loadActivityData: state.loadActivityData,
    activityData: state.activityData,
    activityLoading: state.activityLoading,
    activityError: state.activityError,
    mitigationOptions: state.mitigationOptions,
    mitigationLoading: state.mitigationLoading,
    year: state.year,
    setYear: state.setYear,
  }));

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [requestedActivity, setRequestedActivity] = useState(false);
  const [lockedProvince, setLockedProvince] = useState<string | null>(() => {
    const role = Cookies.get("role");
    if (role === "petugas") {
      return Cookies.get("province") ?? null;
    }
    return null;
  });
  const provinceInitialized = useRef(false);

  useEffect(() => {
    if (requestedActivity || activityLoading || activityData.length) return;
    setRequestedActivity(true);
    void loadActivityData();
  }, [requestedActivity, activityData.length, activityLoading, loadActivityData]);

  useEffect(() => {
    const role = Cookies.get("role");
    const cookieProvince =
      role === "petugas" ? Cookies.get("province") ?? null : null;

    setLockedProvince((prev) =>
      prev === cookieProvince ? prev : cookieProvince
    );
    if (cookieProvince && !provinceInitialized.current) {
      setProvince(cookieProvince);
      provinceInitialized.current = true;
    }
    if (!cookieProvince) {
      provinceInitialized.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lockedProvince) return;
    if (activityLoading) return;
    const exists = activityData.some(
      (row) => row.provinceCode === lockedProvince
    );
    if (!exists) {
      setLockedProvince(null);
      if (input.province_id === lockedProvince) {
    setProvince("");
      }
    }
  }, [
    activityData,
    activityLoading,
    input.province_id,
    lockedProvince,
    setProvince,
  ]);

  useEffect(() => {
    if (!lockedProvince) return;
    if (input.province_id === lockedProvince) return;
    setProvince(lockedProvince);
  }, [input.province_id, lockedProvince, setProvince]);

  const { provinceOptions, lockedProvinceLabel } = useMemo(() => {
    const options = activityData.map((row) => ({
      value: row.provinceCode,
      label: row.provinceName,
    }));
    if (lockedProvince) {
      const match = options.find((option) => option.value === lockedProvince);
      return {
        provinceOptions: match ? [match] : options,
        lockedProvinceLabel: match?.label ?? lockedProvince,
      };
    }
    return { provinceOptions: options, lockedProvinceLabel: null as string | null };
  }, [activityData, lockedProvince]);

  const selectedProvinceLabel = useMemo(() => {
    if (input.province_id) {
      const match = provinceOptions.find(
        (option) => option.value === input.province_id
      );
      if (match) return match.label;
    }
    return lockedProvinceLabel;
  }, [input.province_id, lockedProvinceLabel, provinceOptions]);

  const selectedActivity = useMemo<ActivityDataRow | null>(() => {
    if (!input.province_id) return null;
    return (
      activityData.find((row) => row.provinceCode === input.province_id) ?? null
    );
  }, [activityData, input.province_id]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!input.province_id) return;
    if (input.total_population <= 0) return;
    next();
  };

  const handleProvinceChange = (provinceId: string) => {
    if (lockedProvince) return;
    if (provinceId === input.province_id) return;
    setProvince(provinceId);
  };

  const populationInvalid = input.total_population <= 0;
  const showPopulationError = submitAttempted && populationInvalid;
  const showProvinceError = submitAttempted && !input.province_id;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Provinsi</Label>
          <Select
            value={input.province_id}
            onValueChange={handleProvinceChange}
            disabled={
              activityLoading ||
              provinceOptions.length === 0 ||
              !!lockedProvince
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih provinsi">
                {selectedProvinceLabel || "Pilih provinsi"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {provinceOptions.map((province) => (
                <SelectItem key={province.value} value={province.value}>
                  {province.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showProvinceError ? (
            <p className="text-sm text-destructive">Pilih provinsi terlebih dahulu.</p>
          ) : null}
          {activityError ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
              <span>{activityError}</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-destructive underline-offset-4"
                onClick={() => {
                  setRequestedActivity(true);
                  void loadActivityData();
                }}
              >
                Coba lagi
              </Button>
            </div>
          ) : null}
          {!mitigationLoading && mitigationOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Belum ada aksi mitigasi. Tambahkan data master mitigasi terlebih dahulu.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Tahun Emisi</Label>
          <Select
            value={String(year)}
            onValueChange={(value) => setYear(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih tahun" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 8 }, (_, index) => new Date().getFullYear() - index).map((optionYear) => (
                <SelectItem key={optionYear} value={String(optionYear)}>
                  {optionYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Pilih tahun perhitungan emisi untuk pengajuan ini.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Total Populasi</Label>
          <Input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={input.total_population}
            onChange={(event) =>
              setInput({
                total_population: Math.max(
                  0,
                  Number.isFinite(Number(event.target.value))
                    ? Math.round(Number(event.target.value))
                    : 0
                ),
              })
            }
            placeholder="0"
            aria-invalid={showPopulationError}
          />
          <p
            className={`text-xs ${
              showPopulationError ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {showPopulationError
              ? "Total populasi minimal 1 ekor."
              : "Masukkan total populasi sapi potong di provinsi terpilih."}
          </p>
        </div>
      </div>

      {selectedActivity ? (
        <ActivitySummary row={selectedActivity} />
      ) : (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          {activityLoading
            ? "Memuat data activity untuk provinsi…"
            : "Pilih provinsi untuk melihat ringkasan activity data."}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={activityLoading || !input.province_id || populationInvalid}
        >
          Lanjut
        </Button>
      </div>
    </form>
  );
}

const MIX_LABELS: Record<"ekstensif" | "semi" | "intensif", string> = {
  ekstensif: "Ekstensif",
  semi: "Semi-Intensif",
  intensif: "Intensif",
};

const DISTRO_MAP: Array<{ label: string; variants: string[] }> = [
  { label: "Weaning", variants: ["Weaning"] },
  { label: "Yearling", variants: ["Yearling"] },
  { label: "Adult Jantan", variants: ["AdultMale", "Adult male", "Adult_male"] },
  { label: "Adult Betina", variants: ["AdultFemale", "Adult female", "Adult_female"] },
];

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[\s_-]+/g, "");
}

function toPercent(value: unknown): number {
  if (value == null) return 0;
  const parsed = Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(parsed)) return 0;
  if (parsed > 1) return parsed;
  if (parsed < 0) return 0;
  return parsed * 100;
}

function pickPercent(
  source: Record<string, unknown> | undefined,
  variants: string[]
) {
  if (!source) return 0;
  const normalizedTargets = variants.map(normalizeKey);
  for (const key of Object.keys(source)) {
    const normalized = normalizeKey(key);
    if (normalizedTargets.includes(normalized)) {
      return toPercent(source[key]);
    }
  }
  return 0;
}

function ActivitySummary({ row }: { row: ActivityDataRow }) {
  const systems = [
    {
      key: "ekstensif" as const,
      label: MIX_LABELS.ekstensif,
      value: row.mix.ekstensif ?? 0,
    },
    {
      key: "semi" as const,
      label: MIX_LABELS.semi,
      value: row.mix.semi ?? 0,
    },
    {
      key: "intensif" as const,
      label: MIX_LABELS.intensif,
      value: row.mix.intensif ?? 0,
    },
  ];

  const dominant = systems.reduce((best, current) =>
    current.value > best.value ? current : best
  );

  const distroSource = row.distro[dominant.key] as
    | Record<string, unknown>
    | undefined;

  return (
    <section className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Activity Data</p>
          <p className="text-sm font-semibold text-foreground">
            {row.provinceName} · {row.provinceCode}
          </p>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Dominan: {dominant.label}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {systems.map((system) => (
          <div
            key={system.key}
            className="rounded-md border border-border/60 bg-background px-3 py-2"
          >
            <div className="text-xs text-muted-foreground">{system.label}</div>
            <div className="text-lg font-semibold">
              {system.value.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      {distroSource ? (
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">
            Distribusi {dominant.label}
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            {DISTRO_MAP.map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-dashed px-3 py-2"
              >
                <div className="text-xs text-muted-foreground">
                  {item.label}
                </div>
                <div className="text-base font-semibold">
                  {pickPercent(distroSource, item.variants).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
