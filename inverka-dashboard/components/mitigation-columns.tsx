"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { MitigationRow, MitigationAction, MitigationFeed } from "@/lib/types";
import { Button } from "@/components/ui/button";

const FEEDS: Array<{ key: MitigationFeed; label: string }> = [
  {
    key: "Jerami padi/Rumput Lapang",
    label: "Jerami & Rumput Lapang",
  },
  {
    key: "Rumput Budidaya/Limbah Peternakan",
    label: "Rumput Budidaya",
  },
];
const ACTIONS: MitigationAction[] = ["Konsentrat", "Legumes", "Silase"];
const ACTION_LABELS: Record<MitigationAction, string> = {
  Konsentrat: "Kons.",
  Legumes: "Leg.",
  Silase: "Sil.",
};

const fmt = (v: number) => v.toFixed(3);

export function mitigationColumns(args: {
  onDetail: (row: MitigationRow) => void;
  onEdit: (row: MitigationRow) => void;
  onDelete: (row: MitigationRow) => void;
}): ColumnDef<MitigationRow>[] {
  return [
    {
      header: "Kategori",
      accessorKey: "category",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.category}</span>
      ),
    },
    ...FEEDS.map(({ key, label }) => ({
      id: key,
      header: () => (
        <div className="text-center text-sm font-semibold leading-tight">
          {label}
        </div>
      ),
      cell: ({ row }: { row: { original: MitigationRow } }) => {
        const factors = row.original.factors[key];
        return (
          <div className="min-w-[9rem] space-y-1 text-xs">
            {ACTIONS.map((act) => (
              <div
                key={act}
                className="flex items-center justify-between gap-2 rounded border border-border/40 bg-muted/30 px-2 py-1"
              >
                <span className="text-muted-foreground">{ACTION_LABELS[act]}</span>
                <span className="font-medium tabular-nums">{fmt(factors[act])}</span>
              </div>
            ))}
          </div>
        );
      },
    })
    ),
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => args.onDetail(r)}
            >
              Detail
            </Button>
            <Button size="sm" onClick={() => args.onEdit(r)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => args.onDelete(r)}
            >
              Hapus
            </Button>
          </div>
        );
      },
    },
  ];
}
