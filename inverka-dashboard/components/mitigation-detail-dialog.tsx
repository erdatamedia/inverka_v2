"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MitigationRow, MitigationAction, MitigationFeed } from "@/lib/types";

const FEEDS: Array<{ key: MitigationFeed; label: string }> = [
  { key: "Jerami padi/Rumput Lapang", label: "Jerami & Rumput Lapang" },
  { key: "Rumput Budidaya/Limbah Peternakan", label: "Rumput Budidaya" },
];
const ACTIONS: MitigationAction[] = ["Konsentrat", "Legumes", "Silase"];
const fmt = (v: number) => v.toFixed(3);

export default function MitigationDetailDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: MitigationRow | null;
}) {
  const { open, onOpenChange, row } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detail — {row?.category ?? "-"}</DialogTitle>
        </DialogHeader>
        {row ? (
          <div className="space-y-3">
            {FEEDS.map(({ key, label }) => (
              <div key={key} className="rounded border p-3">
                <div className="mb-2 font-medium">{label}</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {ACTIONS.map((a) => (
                    <div key={a} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{a}</span>
                      <span>{fmt(row.factors[key][a])}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Tidak ada data.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
