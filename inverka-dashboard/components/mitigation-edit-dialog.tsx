"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MitigationRow, MitigationAction, MitigationFeed } from "@/lib/types";

const FEEDS: Array<{ key: MitigationFeed; label: string }> = [
  { key: "Jerami padi/Rumput Lapang", label: "Jerami & Rumput Lapang" },
  { key: "Rumput Budidaya/Limbah Peternakan", label: "Rumput Budidaya" },
];
const ACTIONS: MitigationAction[] = ["Konsentrat", "Legumes", "Silase"];
const CATEGORIES = ["Pre weaning", "Young", "Growth", "Mature"] as const;

type Category = (typeof CATEGORIES)[number];

const emptyRow: MitigationRow = {
  category: "Pre weaning",
  factors: {
    "Jerami padi/Rumput Lapang": { Konsentrat: 0, Legumes: 0, Silase: 0 },
    "Rumput Budidaya/Limbah Peternakan": {
      Konsentrat: 0,
      Legumes: 0,
      Silase: 0,
    },
  },
};

export default function MitigationEditDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: MitigationRow | undefined;
  onSubmit: (row: MitigationRow) => Promise<void> | void;
}) {
  const { open, onOpenChange, initial, onSubmit } = props;

  const [model, setModel] = useState<MitigationRow>(emptyRow);

  useEffect(() => {
    if (open) {
      setModel(initial ?? emptyRow);
    }
  }, [open, initial]);

  const header = useMemo(
    () => (initial ? "Edit Aktivitas Mitigasi" : "Tambah Aktivitas Mitigasi"),
    [initial]
  );

  function setVal(feed: MitigationFeed, act: MitigationAction, val: number) {
    setModel((m) => ({
      ...m,
      factors: {
        ...m.factors,
        [feed]: {
          ...m.factors[feed],
          [act]: val,
        },
      },
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Kategori</Label>
            <select
              className="w-full rounded-md border bg-background p-2"
              value={model.category}
              onChange={(e) =>
                setModel((m) => ({
                  ...m,
                  category: e.target.value as Category,
                }))
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {FEEDS.map(({ key, label }) => (
              <div key={key} className="border rounded p-3">
                <div className="font-medium mb-2">{label}</div>
                <div className="space-y-2">
                  {ACTIONS.map((a) => (
                    <div
                      key={a}
                      className="grid grid-cols-2 gap-2 items-center"
                    >
                      <Label className="text-sm text-muted-foreground">
                        {a}
                      </Label>
                      <Input
                        inputMode="decimal"
                        step="0.001"
                        min="0"
                        max="1"
                        value={model.factors[key][a].toFixed(3)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const parsed =
                            raw.trim() === "" ? 0 : Number(raw);
                          const val = Number.isFinite(parsed)
                            ? Number(parsed.toFixed(3))
                            : 0;
                          setVal(key, a, Number.isFinite(val) ? val : 0);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Masukkan nilai dalam bentuk proporsi (0–1). Contoh 0.571 = 57.1%.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => onSubmit(model)}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
