// inverka-dashboard/lib/config-api.ts
import { api } from "./api";

export type JsonRow = Record<string, unknown>;

export async function getConfig(
  name: "population" | "animal-params" | "manure-mgmt" | "manure-nex"
) {
  const { data } = await api.get<JsonRow[]>(`/config/${name}`);
  return data;
}

export async function putConfig(
  name: "population" | "animal-params" | "manure-mgmt" | "manure-nex",
  rows: JsonRow[]
) {
  const { data } = await api.put<{ ok: true }>(`/config/${name}`, rows);
  return data;
}
