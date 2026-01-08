"use client";

import { useEffect, useMemo, useState } from "react";
import { getConfig, putConfig } from "@/lib/config-api";
import JsonEditTable from "@/components/json-edit-table";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner"; // <--- Menggunakan toast untuk notifikasi

type JsonScalar = string | number | boolean | null;
type Row = Record<string, JsonScalar>;

const ANIMAL_PARAM_METRICS: Array<{ key: string; label: string }> = [
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

const MANURE_MGMT_METRICS: Array<{ key: string; label: string }> = [
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

const MANURE_KEYS = MANURE_MGMT_METRICS.map((metric) => metric.key);

// [Component DataPreview tetap sama]
// ... (DataPreview component code) ...

type DataPreviewProps = {
  rows: Row[];
  variant?: "default" | "compact";
  primaryKeys?: string[];
  metrics?: Array<{ key: string; label: string }>;
  columnOrder?: string[];
  columnLabels?: Record<string, string>;
};

function formatMetricValue(value: JsonScalar) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString("id-ID")
      : value
          .toLocaleString("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
          })
          .replace(/\.?0+$/, "");
  }
  return String(value);
}

const formatCellValue = (value: JsonScalar) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return formatMetricValue(value);
  const stringValue = String(value);
  return stringValue.length ? stringValue : "—";
};

function DataPreview({
  rows,
  variant = "default",
  primaryKeys = [],
  metrics = [],
  columnOrder,
  columnLabels,
}: DataPreviewProps) {
  const columns = useMemo(() => {
    if (!rows || rows.length === 0 || variant === "compact") return [] as string[];
    const baseKeys = Object.keys(rows[0] ?? {});
    if (columnOrder?.length) {
      const seen = new Set<string>();
      const preferred = columnOrder.filter((key) => {
        if (!baseKeys.includes(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const remaining = baseKeys
        .filter((key) => !seen.has(key))
        .sort((a, b) => a.localeCompare(b));
      return [...preferred, ...remaining];
    }
    return baseKeys.sort((a, b) => a.localeCompare(b));
  }, [rows, variant, columnOrder]);

  if (!rows || rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground border rounded-md p-4">
        Tidak ada data untuk ditampilkan.
      </div>
    );
  }

  if (variant === "compact" && primaryKeys.length && metrics.length) {
    return (
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              {primaryKeys.map((key) => (
                <TableHead key={key} className="w-[140px] whitespace-nowrap">
                  {key}
                </TableHead>
              ))}
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={idx} className="align-top">
                {primaryKeys.map((key) => (
                  <TableCell key={key} className="text-sm font-medium">
                    {formatCellValue(r[key] ?? null)}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="grid gap-1.5 text-xs sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {metrics.map(({ key, label }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-2 rounded border border-border/40 bg-muted/20 px-2 py-1.5"
                      >
                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </span>
                        <span className="text-xs font-semibold tabular-nums">
                          {formatMetricValue(r[key] ?? null)}
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
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="whitespace-nowrap">
                {columnLabels?.[col] ?? col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={col}>
                  {formatCellValue(r[col] ?? null)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
// [End Component DataPreview]

export default function Page() {
  const [loading, setLoading] = useState(false);

  const [population, setPopulation] = useState<Row[]>([]);
  const [animalParams, setAnimalParams] = useState<Row[]>([]);
  const [manureMgmt, setManureMgmt] = useState<Row[]>([]);
  const [manureNex, setManureNex] = useState<Row[]>([]);

  async function loadAll() {
    setLoading(true);
    try {
      const [p, a, m, n] = await Promise.all([
        getConfig("population"),
        getConfig("animal-params"),
        getConfig("manure-mgmt"),
        getConfig("manure-nex"),
      ]);
      setPopulation((p as unknown as Row[]) ?? []);
      setAnimalParams((a as unknown as Row[]) ?? []);
      setManureMgmt((m as unknown as Row[]) ?? []);
      setManureNex((n as unknown as Row[]) ?? []);
      toast.success("Semua data master berhasil dimuat ulang."); // <--- Notifikasi sukses
    } catch (error) {
      console.error("Gagal memuat semua data:", error);
      toast.error("Gagal memuat data.", {
        description: "Terjadi kesalahan saat mengambil data dari server.",
      }); // <--- Notifikasi error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function save(
    name: "population" | "animal-params" | "manure-mgmt" | "manure-nex"
  ) {
    const map: Record<string, Row[]> = {
      population: population,
      "animal-params": animalParams,
      "manure-mgmt": manureMgmt,
      "manure-nex": manureNex,
    };

    if (name === "manure-mgmt") {
      const isValid = validateManureMgmt(manureMgmt);
      if (!isValid) return;
    }

    setLoading(true);
    try {
      await putConfig(name, map[name]);
      toast.success(`Berhasil menyimpan ${name}!`); // <--- DIGANTI DARI alert()
    } catch (error) {
      console.error(`Gagal menyimpan ${name}:`, error);
      toast.error(`Gagal menyimpan ${name}.`, {
        description: "Periksa koneksi Anda atau detail data.",
      }); // <--- Penanganan error
    } finally {
      setLoading(false);
    }
  }

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
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Data Master (JSON Mode)</h1>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => loadAll()}
                disabled={loading}
              >
                Reload Semua
              </Button>
            </div>
          </div>

          {/* Tabs wrapper */}
          <Tabs defaultValue="population" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="population">Population</TabsTrigger>
              <TabsTrigger value="animal-params">Animal Params</TabsTrigger>
              <TabsTrigger value="manure-mgmt">Manure Mgmt</TabsTrigger>
              <TabsTrigger value="manure-nex">Manure N excretion</TabsTrigger>
            </TabsList>

            {/* Population */}
            <TabsContent value="population" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Population</h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => loadAll()}
                    disabled={loading}
                  >
                    Reload
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => save("population")}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Editor */}
              <JsonEditTable rows={population} setRows={setPopulation} />

              {/* Preview datatable (shadcn Table) */}
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Preview tabel (read-only)
                </p>
                <DataPreview
                  rows={population}
                  columnOrder={[
                    "Production_System",
                    "Animal_Category",
                    "Population_Head",
                  ]}
                  columnLabels={{ Population_Head: "Population (Head)" }}
                />
              </div>
            </TabsContent>

            {/* Animal Params */}
            <TabsContent value="animal-params" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Animal Params</h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => loadAll()}
                    disabled={loading}
                  >
                    Reload
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => save("animal-params")}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </div>
              </div>

              <JsonEditTable rows={animalParams} setRows={setAnimalParams} />

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Preview tabel (read-only)
                </p>
                <DataPreview
                  rows={animalParams}
                  variant="compact"
                  primaryKeys={["Production_System", "Animal_Category"]}
                  metrics={ANIMAL_PARAM_METRICS}
                />
              </div>
            </TabsContent>

            {/* Manure Mgmt */}
            <TabsContent value="manure-mgmt" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Manure Management</h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => loadAll()}
                    disabled={loading}
                  >
                    Reload
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => save("manure-mgmt")}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </div>
              </div>

              <JsonEditTable rows={manureMgmt} setRows={setManureMgmt} />

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Preview tabel (read-only)
                </p>
                <DataPreview
                  rows={manureMgmt}
                  variant="compact"
                  primaryKeys={["Production_System", "Animal_Category"]}
                  metrics={MANURE_MGMT_METRICS}
                />
              </div>
            </TabsContent>

            {/* Manure N excretion */}
            <TabsContent value="manure-nex" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Manure N excretion</h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => loadAll()}
                    disabled={loading}
                  >
                    Reload
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => save("manure-nex")}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </div>
              </div>

              <JsonEditTable rows={manureNex} setRows={setManureNex} />

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Preview tabel (read-only)
                </p>
                <DataPreview rows={manureNex} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
  const validateManureMgmt = (rows: Row[]) => {
    const badRows: string[] = [];
    for (const row of rows) {
      const total = MANURE_KEYS.reduce((acc, key) => {
        const value = typeof row[key] === "number" ? (row[key] as number) : Number(row[key] ?? 0);
        return acc + (Number.isFinite(value) ? value : 0);
      }, 0);

      if (Math.abs(total - 100) > 0.5) {
        const ps = String(row.Production_System ?? "?");
        const cat = String(row.Animal_Category ?? "?");
        badRows.push(`${ps} | ${cat} = ${total.toFixed(2)}`);
      }
    }

    if (badRows.length) {
      toast.error("Gagal menyimpan manure management.", {
        description: `Total persentase harus 100%. Periksa baris: ${badRows.join(", ")}`,
      });
      return false;
    }
    return true;
  };
