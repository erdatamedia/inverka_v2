import { Injectable } from "@nestjs/common";
import { seedPetugasUsers, SeedUser } from "../auth/users.seed";

export interface UserEntity {
  id: number;
  name: string;
  email: string;
  province: string;
  provinceCode: string | null;
  role: "petugas" | "superadmin";
  password?: string;
  active: boolean;
  loginUrl?: string;
}

function mapSeedToEntity(u: SeedUser): UserEntity {
  const provinceCode = u.province ?? null;
  const provinceName = u.provinceName ?? provinceCode ?? "-";
  return {
    id: u.id,
    name: u.name ?? `Petugas ${provinceName}`,
    email: u.email,
    province: provinceName,
    provinceCode,
    role: "petugas",
    password: u.password,
    active: u.active ?? true,
    loginUrl: provinceCode
      ? `/dashboard/petugas?province=${provinceCode}`
      : "/dashboard/petugas",
  };
}

@Injectable()
export class UsersService {
  private users: UserEntity[] = seedPetugasUsers.map(mapSeedToEntity);

  findAll() {
    return this.users.slice().sort((a, b) => a.province.localeCompare(b.province));
  }

  create(user: Omit<UserEntity, "id">) {
    const provinceCode = user.provinceCode;
    const newUser = {
      id: Date.now(),
      ...user,
      loginUrl: provinceCode
        ? `/dashboard/petugas?province=${provinceCode}`
        : "/dashboard/petugas",
    };
    this.users.push(newUser);
    return newUser;
  }

  update(id: number, dto: Partial<UserEntity>) {
    const i = this.users.findIndex((u) => u.id === id);
    if (i === -1) return null;
    const merged = { ...this.users[i], ...dto };
    merged.loginUrl = merged.provinceCode
      ? `/dashboard/petugas?province=${merged.provinceCode}`
      : "/dashboard/petugas";
    this.users[i] = merged;
    return this.users[i];
  }

  remove(id: number) {
    this.users = this.users.filter((u) => u.id !== id);
    return { ok: true };
  }
}
