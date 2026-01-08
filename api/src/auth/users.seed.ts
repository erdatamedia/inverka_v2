import * as fs from "fs";
import * as path from "path";

export type SeedRole =
  | "superadmin"
  | "petugas"
  | "verifikator"
  | "viewer";

export interface SeedUser {
  id: number;
  email: string;
  password: string;
  role: SeedRole;
  name?: string;
  province?: string;
  provinceName?: string;
  active?: boolean;
}

type ActivityRow = {
  provinceCode: string;
  provinceName: string;
};

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const activityPaths = [
  path.join(__dirname, "../data/activity-data.json"),
  path.join(process.cwd(), "api/src/data/activity-data.json"),
];

let activityRows: ActivityRow[] = [];

for (const candidate of activityPaths) {
  try {
    const raw = fs.readFileSync(candidate, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      activityRows = parsed.filter(
        (row): row is ActivityRow =>
          typeof row?.provinceCode === "string" &&
          typeof row?.provinceName === "string"
      );
      if (activityRows.length) break;
    }
  } catch {
    // try next candidate
  }
}

const petugasAccounts: SeedUser[] = activityRows.map((row, index) => {
  const suffix = row.provinceCode.replace(/^ID-/, "");
  const slug = row.provinceCode.toLowerCase();
  return {
    id: 1000 + index,
    email: `petugas.${slug}@inverka.app`,
    password: `Petugas@${suffix}123`,
    role: "petugas",
    name: `Petugas ${titleCase(row.provinceName.replace(/_/g, " "))}`,
    province: row.provinceCode,
    provinceName: titleCase(row.provinceName.replace(/_/g, " ")),
    active: true,
  };
});

const baseAccounts: SeedUser[] = [
  {
    id: 0,
    email: "superadmin@inverka.app",
    password: "Super@123",
    role: "superadmin",
    name: "Super Admin",
    active: true,
  },
  {
    id: 1,
    email: "petugas@inverka.app",
    password: "Petugas@123",
    role: "petugas",
    name: "Petugas Demo",
    province: "ID-JT",
    provinceName: "Jawa Timur",
    active: true,
  },
  {
    id: 2,
    email: "verifikator@inverka.app",
    password: "Verifikator@123",
    role: "verifikator",
    name: "Verifikator Pusat",
    active: true,
  },
  {
    id: 3,
    email: "viewer@inverka.app",
    password: "Viewer@123",
    role: "viewer",
    name: "Viewer",
    active: true,
  },
];

export const seedUsers: SeedUser[] = [...baseAccounts, ...petugasAccounts];

export const seedPetugasUsers: SeedUser[] = [
  ...baseAccounts.filter((acc) => acc.role === "petugas"),
  ...petugasAccounts,
];
