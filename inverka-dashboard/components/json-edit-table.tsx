// inverka-dashboard/components/json-edit-table.tsx
"use client";

import { useMemo } from "react";

type JsonScalar = string | number | boolean | null;
type Row = Record<string, JsonScalar>;

type Props = {
  rows: Row[];
  setRows: (rows: Row[]) => void;
  maxHeight?: number;
};

export default function JsonEditTable({
  rows,
  setRows,
  maxHeight = 420,
}: Props) {
  const columns = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((r) => Object.keys(r ?? {}).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [rows]);

  function onCellChange(i: number, key: string, value: string) {
    const copy: Row[] = rows.map((r) => ({ ...r }));
    // coba parse number jika masuk akal
    const n = Number(value);
    copy[i][key] =
      Number.isFinite(n) && value.trim() !== ""
        ? (n as JsonScalar)
        : (value as JsonScalar);
    setRows(copy);
  }

  return (
    <div
      className="w-full overflow-auto rounded-md border"
      style={{ maxHeight }}
    >
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {columns.map((c) => (
                <td key={c} className="px-4 py-2">
                  <input
                    className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 96,
                    }}
                    value={String(r[c] ?? "")}
                    onChange={(e) => onCellChange(i, c, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                className="px-3 py-6 text-center text-muted-foreground"
                colSpan={columns.length || 1}
              >
                (kosong)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
