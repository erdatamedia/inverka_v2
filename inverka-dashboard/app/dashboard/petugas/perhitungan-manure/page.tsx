"use client";

import Link from "next/link";

import { Stepper } from "../_components/Stepper";
import { MitigationForm } from "../_components/MitigationForm";
import { PopulationForm } from "../_components/PopulationForm";
import { ResultView } from "../_components/ResultView";
import { Button } from "@/components/ui/button";
import { usePetugas } from "@/store/usePetugas";

export default function PerhitunganManurePage() {
  const step = usePetugas((state) => state.step);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8">
      <header className="space-y-2">
        <p className="text-xs uppercase text-muted-foreground tracking-wide">
          Perhitungan Manure
        </p>
        <h1 className="text-2xl font-semibold leading-tight">
          Hitung Emisi Manure Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Lengkapi data populasi dan pilih aksi mitigasi untuk menghitung emisi
          serta potensi reduksi dari pengelolaan manure. Hasil enterik akan
          tersedia setelah perhitungan ini selesai.
        </p>
        <div>
          <Button asChild size="sm" variant="link" className="-ml-3 px-3">
            <Link href="/dashboard/petugas/perhitungan-enterik">
              Lihat perhitungan GRK enterik
            </Link>
          </Button>
        </div>
      </header>

      <Stepper />

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-6">
        {step === 1 && <PopulationForm />}
        {step === 2 && <MitigationForm />}
        {step === 3 && <ResultView />}
      </section>
    </div>
  );
}
