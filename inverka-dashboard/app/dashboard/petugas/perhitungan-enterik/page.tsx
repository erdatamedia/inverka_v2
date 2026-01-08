"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { roundGg } from "@/lib/format";
import { usePetugas } from "@/store/usePetugas";

export default function PerhitunganEnterikPage() {
  const { result, loading } = usePetugas((state) => ({
    result: state.result,
    loading: state.loading,
  }));

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Perhitungan GRK Enterik
        </p>
        <h1 className="text-2xl font-semibold leading-tight">
          Ringkasan Emisi Enterik
        </h1>
        <p className="text-sm text-muted-foreground">
          Hasil emisi enterik dihitung dari data populasi dan mitigasi yang sama
          dengan perhitungan manure. Perbarui data di halaman manure untuk
          mendapatkan estimasi terkini.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/petugas/perhitungan-manure">
              Perbarui data manure
            </Link>
          </Button>
          <Button asChild size="sm" variant="link" className="-ml-2 px-2">
            <Link href="/dashboard/petugas">Kembali ke ringkasan</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Status Perhitungan</CardTitle>
          <CardDescription>
            {loading
              ? "Sedang menghitung emisi enterik…"
              : result
              ? "Berikut detail emisi enterik dari perhitungan terakhir."
              : "Belum ada hasil. Hitung manure terlebih dahulu untuk melihat estimasi enterik."}
          </CardDescription>
        </CardHeader>
        {result ? (
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">CH₄ (ton/tahun)</span>
                <span className="font-medium">
                  {result.enteric_detail.CH4_ton.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  CH₄ (ton CO₂e/tahun)
                </span>
                <span className="font-medium">
                  {result.enteric_detail.CH4_CO2e_ton.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  CH₄ (Gg CO₂e/tahun)
                </span>
                <span className="font-medium">
                  {roundGg(result.enteric_detail.CH4_GgCO2e)}
                </span>
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Lakukan perhitungan di modul manure untuk menghasilkan estimasi
              emisi enterik.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
