"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { ActivityDataRow } from "@/lib/types";
import { Button } from "@/components/ui/button";

function dominantCategory(mix: ActivityDataRow["mix"]) {
  const pairs = [
    ["Ekstensif", mix.ekstensif],
    ["Semi-Intensif", mix.semi],
    ["Intensif", mix.intensif],
  ] as const;
  return pairs.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

export type ActivityActions = {
  onDetail: (row: ActivityDataRow) => void;
  onEdit: (row: ActivityDataRow) => void;
  onDelete: (row: ActivityDataRow) => void;
};

export function activityColumns(
  actions: ActivityActions
): ColumnDef<ActivityDataRow>[] {
  return [
    { accessorKey: "provinceCode", header: "Kode" },
    { accessorKey: "provinceName", header: "Provinsi" },
    {
      header: "Ekstensif (%)",
      cell: ({ row }) => row.original.mix.ekstensif.toFixed(2),
    },
    {
      header: "Semi-Intensif (%)",
      cell: ({ row }) => row.original.mix.semi.toFixed(2),
    },
    {
      header: "Intensif (%)",
      cell: ({ row }) => row.original.mix.intensif.toFixed(2),
    },
    {
      header: "Dominan",
      cell: ({ row }) => dominantCategory(row.original.mix),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => actions.onDetail(row.original)}
          >
            Detail
          </Button>
          <Button size="sm" onClick={() => actions.onEdit(row.original)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => actions.onDelete(row.original)}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];
}
