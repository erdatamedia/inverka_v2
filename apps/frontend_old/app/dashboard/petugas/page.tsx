"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { AxiosError } from "axios";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Local fallbacks (temporary) for missing UI/guards ---
import * as React from "react";

const RoleGuardLocal: React.FC<{
  allow: string[];
  children: React.ReactNode;
}> = ({ children }) => {
  // TODO: replace with real <RoleGuard /> once available
  return <>{children}</>;
};

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;
const Label: React.FC<LabelProps> = ({ className = "", ...props }) => (
  <label {...props} className={`text-sm font-medium ${className}`} />
);

const Alert: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }
> = ({ className = "", variant = "default", ...props }) => (
  <div
    {...props}
    className={`rounded border p-3 ${
      variant === "destructive"
        ? "border-red-500 bg-red-50 text-red-700"
        : "border-border bg-muted/30"
    } ${className}`}
  />
);

const AlertTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div {...props} className={`font-semibold ${className}`} />;

const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div {...props} className={`text-sm ${className}`} />;
// --- End local fallbacks ---

import { getUser } from "@/lib/auth";

type Distribution = {
  Weaning: number;
  Yearling: number;
  Young: number;
  Mature: number;
};
type FeedClassRow = { fc1: number; fc2: number; fc3: number; fc4: number };
type FeedClass = {
  Weaning: FeedClassRow;
  Yearling: FeedClassRow;
  Young: FeedClassRow;
  Mature: FeedClassRow;
};

type FeedDistributionRow = {
  Physiological_status: string;
  Feed_Class_1_Baseline: number;
  Feed_Class_2: number;
  Feed_Class_3: number;
  Feed_Class_4: number;
  Total: number;
};

type EmissionRow = {
  Physiological_status: string;
  Emission_kgCH4_per_head_year: string | number;
  Feed_Class_1_Baseline: number;
  Feed_Class_2_Mitigation: number;
  Feed_Class_3_Mitigation: number;
  Feed_Class_4_Mitigation: number;
};

type TotalsAgg = {
  baseline: number;
  fc2: number;
  fc3: number;
  fc4: number;
  mitigationSum: number;
  reducedPct: number;
};

type ResultsPayload = {
  feedDistribution: FeedDistributionRow[];
  emissionTable: EmissionRow[];
  totals: TotalsAgg;
};

const PROVINCES = [
  "ID-AC",
  "ID-SU",
  "ID-SB",
  "ID-RI",
  "ID-JA",
  "ID-SS",
  "ID-BE",
  "ID-LA",
  "ID-JK",
  "ID-JR",
  "ID-JT",
  "ID-YO",
  "ID-JI",
  "ID-BT",
  "ID-BA",
  "ID-NB",
  "ID-NT",
  "ID-KB",
  "ID-KT",
  "ID-KS",
  "ID-KU",
  "ID-KI",
  "ID-BB",
  "ID-KR",
  "ID-SU",
  "ID-ST",
  "ID-SN",
  "ID-SG",
  "ID-GO",
  "ID-SR",
  "ID-MA",
  "ID-MU",
  "ID-PA",
  "ID-PB", // cukup untuk UAT
];

const UNIQUE_PROVINCES = Array.from(new Set(PROVINCES));

const SAMPLE_DIST: Distribution = {
  Weaning: 210,
  Yearling: 235,
  Young: 282,
  Mature: 392,
};
const SAMPLE_FEED: FeedClass = {
  Weaning: { fc1: 4, fc2: 144, fc3: 62, fc4: 0 },
  Yearling: { fc1: 0, fc2: 106, fc3: 128, fc4: 1 },
  Young: { fc1: 13, fc2: 167, fc3: 48, fc4: 54 },
  Mature: { fc1: 5, fc2: 306, fc3: 80, fc4: 1 },
};

const user = typeof window !== "undefined" ? getUser() : null;
const isPetugas = user?.role === "petugas";
const provinceFromToken = (user?.province as string | undefined) || "";

export default function PetugasPage() {
  // Baseline
  const [province, setProvince] = useState<string>("ID-JT");
  const [year, setYear] = useState<number>(2025);
  const [totalPop, setTotalPop] = useState<number>(1119);
  const [dist, setDist] = useState<Distribution>({ ...SAMPLE_DIST });

  // Mitigation
  const [submissionId, setSubmissionId] = useState<string>("");
  const [activities, setActivities] = useState<string[]>([
    "Bank Pakan",
    "Biogas",
    "Pupuk Organik",
  ]);
  const [feedClass, setFeedClass] = useState<FeedClass>({ ...SAMPLE_FEED });

  // Results
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [loadingBaseline, setLoadingBaseline] = useState(false);
  const [loadingMitigation, setLoadingMitigation] = useState(false);

  // Helpers
  const sumDist = useMemo(
    () => dist.Weaning + dist.Yearling + dist.Young + dist.Mature,
    [dist]
  );
  const distMatchesTotal = sumDist === totalPop;

  const onChangeDist = (k: keyof Distribution, val: number) =>
    setDist((prev) => ({ ...prev, [k]: val }));
  const onChangeFC = (
    phys: keyof FeedClass,
    key: keyof FeedClassRow,
    val: number
  ) =>
    setFeedClass((prev) => ({
      ...prev,
      [phys]: { ...prev[phys], [key]: val },
    }));

  const useSample = () => {
    setProvince("ID-JT");
    setYear(2025);
    setDist({ ...SAMPLE_DIST });
    setTotalPop(1119);
    setFeedClass({ ...SAMPLE_FEED });
    setActivities(["Bank Pakan", "Biogas", "Pupuk Organik"]);
  };

  useEffect(() => {
    if (isPetugas && provinceFromToken && province !== provinceFromToken) {
      setProvince(provinceFromToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPetugas, provinceFromToken]);

  const postBaseline = async () => {
    if (!distMatchesTotal) return;
    setLoadingBaseline(true);
    try {
      if (isPetugas && !provinceFromToken) {
        alert("Akun Petugas tidak memiliki province di token.");
        return;
      }
      const effectiveProvince = isPetugas ? provinceFromToken : province;
      const payload = {
        year,
        province: effectiveProvince,
        total_population: totalPop,
        distribution: dist,
      };
      const { data } = await api.post("/petugas/baseline", payload);
      setSubmissionId(data.id);
      alert("Baseline tersimpan. ID: " + data.id);
    } catch (err: unknown) {
      const ax = err as AxiosError<unknown>;
      const status = ax.response?.status;
      const data = (ax.response?.data ?? {}) as Record<string, unknown>;
      const backendMsg =
        typeof data.message === "string" ? (data.message as string) : undefined;
      const msg =
        backendMsg ||
        (status === 401
          ? "Unauthorized: token hilang/kedaluwarsa."
          : status === 403
          ? "Forbidden: role salah atau province tidak sesuai."
          : "Gagal menyimpan baseline.");
      alert(`${status || ""} ${msg}`);
    } finally {
      setLoadingBaseline(false);
    }
  };

  const postMitigation = async () => {
    if (!submissionId)
      return alert("Isi submissionId dari hasil baseline lebih dulu");
    setLoadingMitigation(true);
    try {
      const effectiveProvince =
        isPetugas && provinceFromToken ? provinceFromToken : province;
      const payload = {
        province: effectiveProvince,
        year,
        submissionId,
        activities,
        feedClass,
      };
      const { data } = await api.post("/petugas/mitigation", payload);
      setResults(data.results as ResultsPayload);
      alert("Mitigation dihitung.");
    } catch (err: unknown) {
      const ax = err as AxiosError<unknown>;
      const status = ax.response?.status;
      const data = (ax.response?.data ?? {}) as Record<string, unknown>;
      const backendMsg =
        typeof data.message === "string" ? (data.message as string) : undefined;
      const msg =
        backendMsg ||
        (status === 401
          ? "Unauthorized: token hilang/kedaluwarsa."
          : status === 403
          ? "Forbidden: role salah atau province tidak sesuai."
          : "Gagal menghitung mitigation.");
      alert(`${status || ""} ${msg}`);
    } finally {
      setLoadingMitigation(false);
    }
  };

  const fetchResults = async () => {
    if (!submissionId)
      return alert("Isi submissionId dari hasil baseline lebih dulu");
    try {
      const effectiveProvince =
        isPetugas && provinceFromToken ? provinceFromToken : province;
      const { data } = await api.get(
        `/petugas/results?province=${effectiveProvince}&year=${year}&id=${submissionId}`
      );
      setResults(data as ResultsPayload);
    } catch (err: unknown) {
      const ax = err as AxiosError<unknown>;
      const status = ax.response?.status;
      const data = (ax.response?.data ?? {}) as Record<string, unknown>;
      const backendMsg =
        typeof data.message === "string" ? (data.message as string) : undefined;
      const msg =
        backendMsg ||
        (status === 401
          ? "Unauthorized: token hilang/kedaluwarsa."
          : status === 403
          ? "Forbidden: role salah atau province tidak sesuai."
          : "Gagal mengambil hasil.");
      alert(`${status || ""} ${msg}`);
    }
  };

  return (
    <RoleGuardLocal allow={["petugas", "superadmin"]}>
      <AppShell role="petugas">
        {/* BASELINE */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Baseline</CardTitle>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={useSample}>
                Gunakan contoh data
              </Button>
              <Button
                onClick={postBaseline}
                disabled={!distMatchesTotal || loadingBaseline}
              >
                {loadingBaseline ? "Menyimpan..." : "Simpan Baseline"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <Label>Province</Label>
                <Select
                  value={province}
                  onValueChange={setProvince}
                  disabled={isPetugas}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIQUE_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isPetugas && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Province dikunci dari token:{" "}
                    <b>{provinceFromToken || "-"}</b>
                  </p>
                )}
              </div>
              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Total Population</Label>
                <Input
                  type="number"
                  value={totalPop}
                  onChange={(e) => setTotalPop(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Submission ID (readonly)</Label>
                <Input value={submissionId} readOnly />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              {(["Weaning", "Yearling", "Young", "Mature"] as const).map(
                (k) => (
                  <div key={k}>
                    <Label>{k} (head)</Label>
                    <Input
                      type="number"
                      value={dist[k]}
                      onChange={(e) =>
                        onChangeDist(k, Number(e.target.value) || 0)
                      }
                    />
                  </div>
                )
              )}
            </div>

            {!distMatchesTotal && (
              <Alert variant="destructive">
                <AlertTitle>Distribusi belum sesuai</AlertTitle>
                <AlertDescription>
                  Jumlah distribusi = <b>{sumDist.toLocaleString()}</b> harus
                  sama dengan{" "}
                  <b>Total Population {totalPop.toLocaleString()}</b>. Periksa
                  angka Weaning/Yearling/Young/Mature.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* MITIGATION */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Mitigation</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={postMitigation}
                disabled={!submissionId || loadingMitigation}
              >
                {loadingMitigation ? "Menghitung..." : "Hitung Mitigation"}
              </Button>
              <Button
                variant="secondary"
                onClick={fetchResults}
                disabled={!submissionId}
              >
                Refresh Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Aktivitas</Label>
              <Input
                value={activities.join(",")}
                onChange={(e) =>
                  setActivities(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="Pisahkan dengan koma, contoh: Bank Pakan,Biogas,Pupuk Organik"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Aktif: {activities.join(" | ")}
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              {(["Weaning", "Yearling", "Young", "Mature"] as const).map(
                (phys) => (
                  <div key={phys} className="space-y-2 border rounded p-3">
                    <div className="font-medium">{phys}</div>
                    {(["fc1", "fc2", "fc3", "fc4"] as const).map((k) => (
                      <div key={k}>
                        <Label className="capitalize">{k}</Label>
                        <Input
                          type="number"
                          value={feedClass[phys][k]}
                          onChange={(e) =>
                            onChangeFC(phys, k, Number(e.target.value) || 0)
                          }
                        />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* RESULTS */}
        <Card>
          <CardHeader>
            <CardTitle>Hasil Perhitungan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!results ? (
              <div className="text-sm text-muted-foreground">
                Belum ada hasil. Simpan baseline lalu hitung mitigation.
              </div>
            ) : (
              <>
                <div>
                  <div className="font-semibold mb-2">
                    Populasi berdasarkan Kelas Pakan
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 border">Physiological status</th>
                          <th className="p-2 border">
                            Feed Class 1 (Baseline)
                          </th>
                          <th className="p-2 border">Feed Class 2</th>
                          <th className="p-2 border">Feed Class 3</th>
                          <th className="p-2 border">Feed Class 4</th>
                          <th className="p-2 border">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.feedDistribution?.map(
                          (r: FeedDistributionRow, i: number) => (
                            <tr key={i}>
                              <td className="border p-2">
                                {r.Physiological_status}
                              </td>
                              <td className="border p-2 text-right">
                                {r.Feed_Class_1_Baseline}
                              </td>
                              <td className="border p-2 text-right">
                                {r.Feed_Class_2}
                              </td>
                              <td className="border p-2 text-right">
                                {r.Feed_Class_3}
                              </td>
                              <td className="border p-2 text-right">
                                {r.Feed_Class_4}
                              </td>
                              <td className="border p-2 text-right">
                                {r.Total}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="font-semibold mb-2">
                    Perhitungan Pengurangan Emisi
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 border">Physiological status</th>
                          <th className="p-2 border">
                            Emission (kg CH4/head/year)
                          </th>
                          <th className="p-2 border">FC1 (Baseline)</th>
                          <th className="p-2 border">FC2 (Mitigation)</th>
                          <th className="p-2 border">FC3 (Mitigation)</th>
                          <th className="p-2 border">FC4 (Mitigation)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.emissionTable?.map(
                          (r: EmissionRow, i: number) => (
                            <tr key={i}>
                              <td className="border p-2">
                                {r.Physiological_status}
                              </td>
                              <td className="border p-2 text-right">
                                {r.Emission_kgCH4_per_head_year}
                              </td>
                              <td className="border p-2 text-right">
                                {r.Feed_Class_1_Baseline}
                              </td>
                              <td className="border p-2 text-right">
                                {r.Feed_Class_2_Mitigation}
                              </td>
                              <td className="border p-2 text-right">
                                {r.Feed_Class_3_Mitigation}
                              </td>
                              <td className="border p-2 text-right">
                                {r.Feed_Class_4_Mitigation}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 border rounded">
                    Total Baseline:{" "}
                    <b>{results.totals?.baseline?.toLocaleString?.()}</b>
                  </div>
                  <div className="p-3 border rounded">
                    Total FC2: <b>{results.totals?.fc2?.toLocaleString?.()}</b>
                  </div>
                  <div className="p-3 border rounded">
                    Total FC3: <b>{results.totals?.fc3?.toLocaleString?.()}</b>
                  </div>
                  <div className="p-3 border rounded">
                    Total FC4: <b>{results.totals?.fc4?.toLocaleString?.()}</b>
                  </div>
                  <div className="p-3 border rounded md:col-span-4">
                    Mitigation Sum:{" "}
                    <b>{results.totals?.mitigationSum?.toLocaleString?.()}</b> —
                    Reduced: <b>{results.totals?.reducedPct}%</b>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </AppShell>
    </RoleGuardLocal>
  );
}
