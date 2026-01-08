"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiAdminButton } from "./api-admin-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PopulationRow = {
  Production_System: string;
  Animal_Category: string;
  Population_Head: number;
};

type AnimalParamRow = {
  Production_System: string;
  Animal_Category: string;
  LW: number;
  Mature_Weight_kg: number;
  ADG: number;
  Milk_kg_day: number;
  DMD_percent: number;
  CP_percent_diet: number;
  Ash_percent_diet: number;
  Fat_Content_Milk_percent: number;
  Work_Hours_day: number;
  Prop_Cows_Pregnant_percent: number;
  Ym_input: number;
};

type ManureMgmtRow = {
  Production_System: string;
  Animal_Category: string;
  Lagoon: number;
  "Liquid/Slurry": number;
  Solid_Storage: number;
  Dry_Lot: number;
  "Pasture/Range/Paddock": number;
  Daily_Spread: number;
  Composting: number;
  Burned_for_fuel: number;
  Biogas: number;
};

type ManureNexRow = {
  Production_System: string;
  Animal_Category: string;
  DMI_kg_day: number;
  CP_percent_diet: number;
  Nex_kgN_per_year: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

const ANIMAL_PARAM_FIELDS: Array<{
  key: keyof AnimalParamRow;
  label: string;
}> = [
  { key: "LW", label: "LW" },
  { key: "Mature_Weight_kg", label: "Mature Wt" },
  { key: "ADG", label: "ADG" },
  { key: "Milk_kg_day", label: "Milk" },
  { key: "DMD_percent", label: "DMD %" },
  { key: "CP_percent_diet", label: "CP %" },
  { key: "Ash_percent_diet", label: "Ash %" },
  { key: "Fat_Content_Milk_percent", label: "Fat %" },
  { key: "Work_Hours_day", label: "Work h/d" },
  { key: "Prop_Cows_Pregnant_percent", label: "Pregnant %" },
  { key: "Ym_input", label: "Ym" },
];

const MANURE_MGMT_FIELDS: Array<{
  key: keyof ManureMgmtRow;
  label: string;
}> = [
  { key: "Lagoon", label: "Lagoon" },
  { key: "Liquid/Slurry", label: "Liquid" },
  { key: "Solid_Storage", label: "Solid" },
  { key: "Dry_Lot", label: "Dry Lot" },
  { key: "Pasture/Range/Paddock", label: "Pasture" },
  { key: "Daily_Spread", label: "Daily" },
  { key: "Composting", label: "Compost" },
  { key: "Burned_for_fuel", label: "Burned" },
  { key: "Biogas", label: "Biogas" },
];

const formatNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return "—";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric === "number" && Number.isFinite(numeric)) {
    return Number.isInteger(numeric)
      ? numeric.toLocaleString()
      : numeric
          .toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
          })
          .replace(/\.?0+$/, "");
  }
  return String(value);
};

export function MasterTables() {
  const [loading, setLoading] = React.useState(true);
  const [population, setPopulation] = React.useState<PopulationRow[]>([]);
  const [animalParams, setAnimalParams] = React.useState<AnimalParamRow[]>([]);
  const [manureMgmt, setManureMgmt] = React.useState<ManureMgmtRow[]>([]);
  const [manureNex, setManureNex] = React.useState<ManureNexRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [popRes, prmRes, mmRes, nexRes] = await Promise.all([
          fetch(`${API_BASE}/config/population`),
          fetch(`${API_BASE}/config/animal-params`),
          fetch(`${API_BASE}/config/manure-mgmt`),
          fetch(`${API_BASE}/config/manure-nex`),
        ]);
        if (!popRes.ok || !prmRes.ok || !mmRes.ok || !nexRes.ok) {
          throw new Error("Gagal mengambil data master");
        }
        const [pop, prm, mm, nex] = await Promise.all([
          popRes.json(),
          prmRes.json(),
          mmRes.json(),
          nexRes.json(),
        ]);
        if (!alive) return;
        setPopulation(pop);
        setAnimalParams(prm);
        setManureMgmt(mm);
        setManureNex(nex);
      } catch (e: unknown) {
        setError((e as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="px-4 lg:px-6">
      <Card data-slot="card" className="p-4 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-medium">
              Konfigurasi Master (Server)
            </h2>
            <p className="text-sm text-muted-foreground">
              Data di bawah ini diambil dari API dan ditampilkan read-only.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Buka API Admin: quick links ke endpoint terkait */}
            <ApiAdminButton />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            Error: {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 text-sm text-muted-foreground">Memuat data…</div>
        ) : (
          <Tabs defaultValue="population" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="population">Population</TabsTrigger>
              <TabsTrigger value="animal">Animal Parameters</TabsTrigger>
              <TabsTrigger value="manure">Manure Management</TabsTrigger>
              <TabsTrigger value="nex">N Excretion</TabsTrigger>
            </TabsList>

            {/* POPULATION */}
            <TabsContent value="population" className="mt-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Production System</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">
                        Population (Head)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {population.map((r, i) => (
                      <TableRow
                        key={`${r.Production_System}-${r.Animal_Category}-${i}`}
                      >
                        <TableCell>{r.Production_System}</TableCell>
                        <TableCell>{r.Animal_Category}</TableCell>
                        <TableCell className="text-right">
                          {r.Population_Head?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ANIMAL PARAMS */}
            <TabsContent value="animal" className="mt-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">System</TableHead>
                      <TableHead className="w-[160px]">Category</TableHead>
                      <TableHead>Parameters</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {animalParams.map((r, i) => (
                      <TableRow
                        key={`${r.Production_System}-${r.Animal_Category}-${i}`}
                        className="align-top"
                      >
                        <TableCell className="text-sm font-medium">
                          {r.Production_System}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.Animal_Category}
                        </TableCell>
                        <TableCell>
                          <div className="grid gap-1.5 text-xs sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {ANIMAL_PARAM_FIELDS.map(({ key, label }) => (
                              <div
                                key={key}
                                className="flex items-center justify-between gap-2 rounded border border-border/40 bg-muted/20 px-2 py-1.5"
                              >
                                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  {label}
                                </span>
                                <span className="text-xs font-semibold tabular-nums">
                                  {formatNumber(r[key])}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* MANURE MANAGEMENT */}
            <TabsContent value="manure" className="mt-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">System</TableHead>
                      <TableHead className="w-[160px]">Category</TableHead>
                      <TableHead>Distribution (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manureMgmt.map((r, i) => (
                      <TableRow
                        key={`${r.Production_System}-${r.Animal_Category}-${i}`}
                        className="align-top"
                      >
                        <TableCell className="text-sm font-medium">
                          {r.Production_System}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.Animal_Category}
                        </TableCell>
                        <TableCell>
                          <div className="grid gap-1.5 text-xs sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {MANURE_MGMT_FIELDS.map(({ key, label }) => (
                              <div
                                key={key}
                                className="flex items-center justify-between gap-2 rounded border border-border/40 bg-muted/20 px-2 py-1.5"
                              >
                                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  {label}
                                </span>
                                <span className="text-xs font-semibold tabular-nums">
                                  {formatNumber(r[key])}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* N EXCRETION */}
            <TabsContent value="nex" className="mt-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>System</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>DMI (kg/d)</TableHead>
                      <TableHead>CP %</TableHead>
                      <TableHead>Nex (kg N/yr)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manureNex.map((r, i) => (
                      <TableRow
                        key={`${r.Production_System}-${r.Animal_Category}-${i}`}
                      >
                        <TableCell>{r.Production_System}</TableCell>
                        <TableCell>{r.Animal_Category}</TableCell>
                        <TableCell>{r.DMI_kg_day}</TableCell>
                        <TableCell>{r.CP_percent_diet}</TableCell>
                        <TableCell>{r.Nex_kgN_per_year}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
}
