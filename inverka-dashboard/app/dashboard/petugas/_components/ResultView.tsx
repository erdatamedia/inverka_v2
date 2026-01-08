"use client";

import type { ReactNode } from "react";
import { roundGg, ggToTon } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { usePetugas } from "@/store/usePetugas";

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded border p-3">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-medium text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Table({ rows }: { rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 pl-3 pr-6 text-muted-foreground">{row[0]}</td>
              <td className="py-2 pr-3 font-medium text-foreground">{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  menunggu_verifikasi: "Menunggu verifikasi",
  dalam_verifikasi: "Sedang diverifikasi",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

export function ResultView() {
  const { result, loading, error, prev, resetResult, lastSubmission } = usePetugas((state) => ({
    result: state.result,
    loading: state.loading,
    error: state.error,
    prev: state.prev,
    resetResult: state.resetResult,
    lastSubmission: state.lastSubmission,
  }));

  if (loading) {
    return (
      <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
        Menghitung emisi…
      </div>
    );
  }

  const formatGgTon = (value: number) =>
    `${roundGg(value)} Gg / ${ggToTon(value).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} ton`;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {lastSubmission ? (
        <div className="rounded border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
          Status pengajuan: {STATUS_LABEL[lastSubmission.status] ?? lastSubmission.status}
        </div>
      ) : null}

      {!result ? (
        <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
          Belum ada hasil. Lengkapi input lalu tekan “Hitung Emisi”.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Baseline (Gg CO₂e/tahun)"
              value={`${roundGg(result.summary.baseline_GgCO2e)} Gg`}
            />
            <SummaryCard
              label="Setelah Mitigasi (Gg CO₂e/tahun)"
              value={`${roundGg(result.summary.with_mitigation_GgCO2e)} Gg`}
            />
            <SummaryCard
              label="Reduksi (Gg CO₂e/tahun)"
              value={`${roundGg(result.summary.reduction_GgCO2e)} Gg / ${ggToTon(
                result.summary.reduction_GgCO2e
              ).toLocaleString("id-ID", { maximumFractionDigits: 2 })} ton`}
            />
            <SummaryCard
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
          </div>

          <Section title="By Gas (Gg CO₂e/tahun)">
            <Table
              rows={[
                ["CH₄", formatGgTon(result.by_gas_GgCO2e.CH4)],
                ["N₂O", formatGgTon(result.by_gas_GgCO2e.N2O)],
                ["Total", formatGgTon(result.by_gas_GgCO2e.total)],
              ]}
            />
          </Section>

          <Section title="Detail Manure (Gg CO₂e/tahun)">
            <Table
              rows={[
                [
                  "N₂O Langsung",
                  formatGgTon(result.manure_detail_GgCO2e.N2O_direct),
                ],
                [
                  "N₂O Tidak Langsung",
                  formatGgTon(result.manure_detail_GgCO2e.N2O_indirect),
                ],
                ["CH₄", formatGgTon(result.manure_detail_GgCO2e.CH4)],
                ["Total", formatGgTon(result.manure_detail_GgCO2e.total)],
              ]}
            />
          </Section>

          <Section title="Detail Enterik">
            <Table
              rows={[
                ["CH₄ (ton/tahun)", result.enteric_detail.CH4_ton.toFixed(2)],
                ["CH₄ (ton CO₂e/tahun)", result.enteric_detail.CH4_CO2e_ton.toFixed(2)],
                ["CH₄ (Gg CO₂e/tahun)", roundGg(result.enteric_detail.CH4_GgCO2e)],
              ]}
            />
          </Section>
        </>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={prev}>
          Kembali
        </Button>
        <Button variant="ghost" onClick={resetResult}>
          Hitung Ulang
        </Button>
      </div>
    </div>
  );
}
