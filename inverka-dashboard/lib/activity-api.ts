import { api } from "@/lib/api";
import type { ActivityData, ActivityDataRow } from "./types";

const PATH = "/config/activity-data";

/** Ambil semua activity data */
export async function getActivityData() {
  const { data } = await api.get<ActivityData>(PATH);
  return data;
}

/** Simpan full array (kita pakai model JSON PUT) */
export async function putActivityData(rows: ActivityData) {
  const { data } = await api.put<{ ok: true }>(PATH, rows);
  return data;
}

/** Utility untuk tambah/update satu provinsi lalu PUT semua */
export function upsertActivity(
  list: ActivityData,
  row: ActivityDataRow
): ActivityData {
  const idx = list.findIndex((x) => x.provinceCode === row.provinceCode);
  if (idx >= 0) {
    const clone = list.slice();
    clone[idx] = row;
    return clone;
  }
  return [...list, row];
}

/** Utility hapus */
export function removeActivity(
  list: ActivityData,
  provinceCode: string
): ActivityData {
  return list.filter((x) => x.provinceCode !== provinceCode);
}
