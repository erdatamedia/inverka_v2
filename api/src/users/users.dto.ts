import { IsEmail, IsOptional, IsString } from "class-validator";

export class UserDto {
  name!: string;
  email!: string;
  province!: string;
  provinceCode?: string;
  role!: "superadmin" | "petugas";
  active?: boolean; // default true
  password?: string; // required when creating via UI (or set temporary)
}
