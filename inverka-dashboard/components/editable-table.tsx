"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EditableTableProps<T extends Record<string, unknown>> = {
  title: string;
  columns: ColumnDef<T, unknown>[];
  rows: T[];
  setRows: (rows: T[]) => void;
  onSave: (rows: T[]) => Promise<void>;
  isLoading?: boolean;
  className?: string;
};

export function EditableTable<T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  setRows,
  onSave,
  isLoading,
  className,
}: EditableTableProps<T>) {
  type Row = T & Record<string, unknown>;

  const [draft, setDraft] = React.useState<Row[]>(rows as Row[]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setDraft(rows as Row[]), [rows]);

  const table = useReactTable({
    data: draft,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleChange = (rowIdx: number, key: keyof T, value: string) => {
    setDraft((prev) => {
      const next = [...prev];
      // convert numeric strings to number where possible
      const num = Number(value);
      (next[rowIdx] as Record<string, unknown>)[key as string] =
        value === "" ? "" : isNaN(num) ? value : num;
      return next;
    });
  };

  const handleReset = () => setDraft(rows as Row[]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setRows(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={saving || isLoading}
          >
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || isLoading}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="whitespace-nowrap px-3 py-2 text-left font-medium"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className="border-t">
                {r.getVisibleCells().map((c) => {
                  const colKey = c.column.id as keyof T;
                  const record = r.original as Record<string, unknown>;
                  const cellVal = record[colKey as string];
                  const displayVal: string | number =
                    typeof cellVal === "number"
                      ? cellVal
                      : typeof cellVal === "string"
                      ? cellVal
                      : "";
                  const isNumber = typeof cellVal === "number";
                  return (
                    <td key={c.id} className="px-3 py-1.5 align-middle">
                      {/* edit cell */}
                      <Input
                        value={displayVal}
                        onChange={(e) =>
                          handleChange(r.index, colKey, e.target.value)
                        }
                        inputMode={isNumber ? "decimal" : "text"}
                        className={cn("h-8", isNumber && "text-right")}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
