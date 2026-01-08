import { PROVINCE_COORDINATES } from "./indonesia-provinces";
import type { User } from "./user-api";

const CORE_USERS: User[] = [
  {
    id: 1,
    name: "Superadmin Nasional",
    email: "superadmin@inverka.app",
    province: "Sekretariat Nasional",
    provinceCode: null,
    role: "superadmin",
    password: "Superadmin@123",
    active: true,
    loginUrl: "/dashboard/superadmin",
  },
  {
    id: 2,
    name: "Verifikator Nasional",
    email: "verifikator@inverka.app",
    province: "Sekretariat Nasional",
    provinceCode: null,
    role: "verifikator",
    password: "Verifikator@123",
    active: true,
    loginUrl: "/dashboard/verifikator",
  },
  {
    id: 3,
    name: "Viewer KLHK",
    email: "viewer@inverka.app",
    province: "Sekretariat Nasional",
    provinceCode: null,
    role: "viewer",
    password: "Viewer@123",
    active: true,
    loginUrl: "/dashboard/viewer",
  },
];

const PROVINCE_USERS: User[] = PROVINCE_COORDINATES.map((province, index) => {
  const suffix = province.code.replace(/^ID-/, "");
  return {
    id: 1000 + index,
    name: `Petugas ${province.name}`,
    email: `petugas.${province.code.toLowerCase()}@inverka.app`,
    province: province.name,
    provinceCode: province.code,
    role: "petugas",
    password: `Petugas@${suffix}123`,
    active: true,
    loginUrl: `/dashboard/petugas?province=${province.code}`,
  };
});

export const DEMO_USERS: User[] = [...CORE_USERS, ...PROVINCE_USERS];
