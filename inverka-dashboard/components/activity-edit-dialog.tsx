"use client";

import { useEffect, useState } from "react";
import type { ActivityDataRow, Distro } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PHYS = ["Weaning", "Yearling", "Adult male", "Adult female"] as const;
type Phys = "Weaning" | "Yearling" | "Adult male" | "Adult female";

type PercentInputMode = "fraction" | "percent";

function PercentInput({
  value,
  onChange,
  mode = "fraction",
}: {
  value: number | string;
  onChange: (n: number) => void;
  mode?: PercentInputMode;
}) {
  // mode "fraction": simpan nilai 0–1 lalu tampilkan sebagai persen
  // mode "percent": simpan nilai 0–100 apa adanya
  const [display, setDisplay] = useState<string>("");

  useEffect(() => {
    // Sinkronkan tampilan saat prop berubah dari luar
    const num =
      typeof value === "number"
        ? value
        : parseFloat(String(value).replace(",", "."));
    if (Number.isFinite(num)) {
      const numPct = mode === "fraction" ? num * 100 : num;
      setDisplay(
        numPct.toLocaleString("id-ID", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    } else {
      setDisplay("");
    }
  }, [mode, value]);

  return (
    <Input
      inputMode="decimal"
      step="0.01"
      value={display}
      onChange={(e) => {
        const raw = e.target.value;
        setDisplay(raw);
        const normalized = raw.replace(/\./g, "").replace(",", ".");
        const parsedPct = parseFloat(normalized);
        if (!Number.isNaN(parsedPct)) {
          const clampedPct = Math.max(0, Math.min(100, parsedPct));
          onChange(mode === "fraction" ? clampedPct / 100 : clampedPct);
        }
      }}
      onBlur={() => {
        const num =
          typeof value === "number"
            ? value
            : parseFloat(String(value).replace(",", "."));
        if (Number.isFinite(num)) {
          const clamped =
            mode === "fraction"
              ? Math.max(0, Math.min(1, num))
              : Math.max(0, Math.min(100, num));
          const pct = mode === "fraction" ? clamped * 100 : clamped;
          setDisplay(
            pct.toLocaleString("id-ID", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          );
        }
      }}
    />
  );
}

// Normalisasi kunci agar bisa membaca variasi seperti "adult_male", "AdultMale", "adult male"
function getDistroValueSafe(
  distro: Distro | Record<string, number>,
  key: Phys
): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const target = norm(key);

  // Try to find a normalized match among arbitrary keys
  for (const [existingKey, val] of Object.entries(
    distro as Record<string, number>
  )) {
    if (norm(existingKey) === target) {
      return Number.isFinite(val) ? (val as number) : 0;
    }
  }

  // Fallback to the strongly-typed keys on Distro
  const fallback = (distro as Partial<Record<Phys, number>>)[key];
  return typeof fallback === "number" && Number.isFinite(fallback)
    ? fallback
    : 0;
}

export default function ActivityEditDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ActivityDataRow;
  onSubmit: (row: ActivityDataRow) => void;
}) {
  const [form, setForm] = useState<ActivityDataRow>(
    () =>
      initial ?? {
        provinceCode: "",
        provinceName: "",
        mix: { ekstensif: 0, semi: 0, intensif: 0 },
        distro: {
          ekstensif: {
            Weaning: 0.25,
            Yearling: 0.25,
            "Adult male": 0.25,
            "Adult female": 0.25,
          },
          semi: {
            Weaning: 0.25,
            Yearling: 0.25,
            "Adult male": 0.25,
            "Adult female": 0.25,
          },
          intensif: {
            Weaning: 0.25,
            Yearling: 0.25,
            "Adult male": 0.25,
            "Adult female": 0.25,
          },
        },
      }
  );

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  function setDistroRow(
    key: "ekstensif" | "semi" | "intensif",
    phys: Phys,
    v: number
  ) {
    setForm((prev) => ({
      ...prev,
      distro: {
        ...prev.distro,
        [key]: { ...prev.distro[key], [phys]: Math.max(0, Math.min(1, v)) },
      },
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Provinsi" : "Tambah Provinsi"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Kode</label>
              <Input
                value={form.provinceCode}
                onChange={(e) =>
                  setForm({ ...form, provinceCode: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nama</label>
              <Input
                value={form.provinceName}
                onChange={(e) =>
                  setForm({ ...form, provinceName: e.target.value })
                }
              />
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <div className="font-medium">Komposisi Sistem (%)</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs">Ekstensif</label>
                <PercentInput
                  value={form.mix.ekstensif}
                  mode="percent"
                  onChange={(v) =>
                    setForm({ ...form, mix: { ...form.mix, ekstensif: v } })
                  }
                />
              </div>
              <div>
                <label className="text-xs">Semi-Intensif</label>
                <PercentInput
                  value={form.mix.semi}
                  mode="percent"
                  onChange={(v) =>
                    setForm({ ...form, mix: { ...form.mix, semi: v } })
                  }
                />
              </div>
              <div>
                <label className="text-xs">Intensif</label>
                <PercentInput
                  value={form.mix.intensif}
                  mode="percent"
                  onChange={(v) =>
                    setForm({ ...form, mix: { ...form.mix, intensif: v } })
                  }
                />
              </div>
            </div>
          </div>

          {(["ekstensif", "semi", "intensif"] as const).map((k) => (
            <div key={k} className="rounded-lg border p-3 space-y-2">
              <div className="font-medium capitalize">Distribusi {k} (%)</div>
              <div className="grid grid-cols-4 gap-3">
                {PHYS.map((p) => (
                  <div key={p}>
                    <label className="text-xs">{p}</label>
                    <PercentInput
                      value={getDistroValueSafe(form.distro[k] as Distro, p)}
                      onChange={(n) => setDistroRow(k, p, n)}
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Pastikan total ≈ 100% (opsional bisa ditambahkan
                auto-normalize).
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => onSubmit(form)}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
