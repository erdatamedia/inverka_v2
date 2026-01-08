import { api } from "./api";
import type { MitigationTable, MitigationRow } from "./types";

const PATH = "/config/mitigation-data"; // atau "/config/mitigation" kalau sudah ada alias backend

export async function getMitigation() {
  const { data } = await api.get<MitigationTable>(PATH);
  return data;
}

export async function putMitigation(rows: MitigationTable) {
  const { data } = await api.put<{ ok: true }>(PATH, rows);
  return data;
}

/** tambahkan atau update (berdasarkan category unik) */
export function upsertMitigation(
  all: MitigationTable,
  row: MitigationRow
): MitigationTable {
  const i = all.findIndex((r) => r.category === row.category);
  if (i === -1) return [...all, row];
  const next = all.slice();
  next[i] = row;
  return next;
}

/** hapus berdasarkan category */
export function removeMitigation(
  all: MitigationTable,
  category: MitigationRow["category"]
): MitigationTable {
  return all.filter((r) => r.category !== category);
}
