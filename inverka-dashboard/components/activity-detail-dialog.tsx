"use client";

import { useMemo } from "react";
import type { ActivityDataRow, Physiological } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function dominantKey(mix: ActivityDataRow["mix"]) {
  const entries: Array<["ekstensif" | "semi" | "intensif", number]> = [
    ["ekstensif", mix.ekstensif],
    ["semi", mix.semi],
    ["intensif", mix.intensif],
  ];
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

const ORDER: Physiological[] = [
  "Weaning",
  "Yearling",
  "Adult male",
  "Adult female",
];

// Tipe bantu untuk kunci di objek distribusi (Weaning, Yearling, Adult male, Adult female)
// Perluas tipe dengan kemungkinan label "Adult male" dan "Adult female" yang ada di sumber Excel.
type DistroObj = NonNullable<
  ActivityDataRow["distro"][keyof ActivityDataRow["distro"]]
> &
  Partial<Record<"Adult male" | "Adult female", unknown>>;

type DistroKey = keyof DistroObj;

// Pemetaan label UI -> kunci sebenarnya di data Excel
const LABEL_MAP: Record<(typeof ORDER)[number], DistroKey> = {
  Weaning: "Weaning",
  Yearling: "Yearling",
  "Adult male": "Adult male",
  "Adult female": "Adult female",
} as const;

// Fungsi untuk menormalkan kunci agar variasi nama kunci bisa ditangani
function norm(key: string): string {
  return key.toLowerCase().replace(/[\s_-]+/g, "");
}

// Fungsi untuk membaca nilai distro dengan menangani variasi nama kunci
function readDistroValue(distro: DistroObj, key: DistroKey) {
  // Akses langsung
  if (key in distro) return distro[key];

  const variants = [
    key,
    norm(key),
    key.replace(/\s+/g, ""), // hilangkan spasi
    key.replace(/\s+/g, "_"), // ubah ke underscore
    key.replace(/\s+/g, "-"), // ubah ke dash
  ].map((k) => k.toLowerCase());

  for (const k in distro) {
    const normalized = norm(k);
    if (variants.includes(normalized)) {
      return distro[k as DistroKey];
    }
  }
  return undefined;
}

// Parser angka yang aman untuk format koma (e.g. "17,49") maupun number
function parsePercent(input: unknown): number {
  if (input == null) return NaN;
  const str = String(input).trim().replace(",", ".");
  const n = Number(str);
  if (!Number.isFinite(n)) return NaN;
  // Jika nilainya < 1 tapi bukan 0, asumsikan itu sebenarnya persen (0.17 → 17%)
  return n < 1 && n > 0 ? n * 100 : n;
}

export default function ActivityDetailDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: ActivityDataRow | null;
}) {
  const chosen = useMemo(() => (row ? dominantKey(row.mix) : null), [row]);

  const distro = useMemo<DistroObj | null>(() => {
    if (!row || !chosen) return null;
    return row.distro[chosen] ?? null;
  }, [row, chosen]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail — {row?.provinceName}</DialogTitle>
        </DialogHeader>
        {!row ? null : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Sub-kategori dominan:{" "}
              <span className="font-medium capitalize">
                {chosen?.replace("-", " ")}
              </span>
            </div>
            {distro && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ORDER.map((k) => {
                  const key: DistroKey = LABEL_MAP[k];
                  const raw = readDistroValue(distro, key);
                  const val = parsePercent(raw);
                  return (
                    <div key={k} className="rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-xs text-muted-foreground">{k}</div>
                      <div className="text-lg font-semibold">
                        {Number.isFinite(val) ? `${val.toFixed(2)}%` : "0.00%"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
