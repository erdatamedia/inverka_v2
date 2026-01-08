// inverka-dashboard/lib/admin-api.ts
import { api } from "./api";

type AnyRow = Record<string, unknown>;

export type PopulationRow = AnyRow;
export type AnimalParamRow = AnyRow;
export type ManureNexRow = AnyRow;
export type ManureMgmtRow = AnyRow;

// Susun daftar prefix yang mungkin:
// - Utamakan NEXT_PUBLIC_ADMIN_PREFIX kalau ada.
// - Lalu fallback ke pola umum yang sering muncul di log kamu.
const ADMIN_PREFIX_ENV = (process.env.NEXT_PUBLIC_ADMIN_PREFIX ?? "").trim();
const CANDIDATE_PREFIXES = [
  ADMIN_PREFIX_ENV, // hormati env dulu
  "api",
  "master",
  "superadmin/master",
  "superadmin",
  "", // tanpa prefix
].filter(
  (s, i, arr) => s !== undefined && s !== null && arr.indexOf(s) === i
) as string[];

function joinPath(...parts: string[]) {
  return (
    "/" +
    parts
      .filter(Boolean)
      .map((p) => p.replace(/^\/+|\/+$/g, ""))
      .join("/")
  );
}

// Coba beberapa path sampai dapat yang OK (status 2xx)
async function getFirstOk<T = unknown>(paths: string[]): Promise<T> {
  let lastErr: unknown;
  for (const p of paths) {
    try {
      const { data } = await api.get<T>(p);
      return data;
    } catch (err) {
      lastErr = err;
      // lanjut coba kandidat berikutnya
    }
  }
  // Kalau semua gagal, lempar error terakhir agar interceptor-mu tetap log jelas
  throw lastErr;
}

// ====== PUBLIC API ======

// GET master/population
export async function getPopulation(): Promise<PopulationRow[]> {
  const candidates = CANDIDATE_PREFIXES.map((pref) =>
    joinPath(pref, "master", "population")
  );
  return getFirstOk<PopulationRow[]>(candidates);
}

// GET master/animal-params
export async function getAnimalParams(): Promise<AnimalParamRow[]> {
  const candidates = CANDIDATE_PREFIXES.map((pref) =>
    joinPath(pref, "master", "animal-params")
  );
  return getFirstOk<AnimalParamRow[]>(candidates);
}

// GET master/manure-nex
export async function getManureNex(): Promise<ManureNexRow[]> {
  const candidates = CANDIDATE_PREFIXES.map((pref) =>
    joinPath(pref, "master", "manure-nex")
  );
  return getFirstOk<ManureNexRow[]>(candidates);
}

// GET master/manure-mgmt
export async function getManureMgmt(): Promise<ManureMgmtRow[]> {
  const candidates = CANDIDATE_PREFIXES.map((pref) =>
    joinPath(pref, "master", "manure-mgmt")
  );
  return getFirstOk<ManureMgmtRow[]>(candidates);
}

// (Opsional) PUT versi robust – gunakan prefix pertama yang sukses GET
// Kalau butuh PUT, biasanya kamu sudah tahu endpoint GET mana yang berhasil.
// Simpel-nya: panggil put ke path yang sama yang kamu render di UI, atau
// simpan “path yang berhasil” di state ketika getFirstOk berhasil.
