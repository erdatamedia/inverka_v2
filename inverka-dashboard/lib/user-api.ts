import { api } from "./api";
import { DEMO_USERS } from "./demo-users";

export interface User {
  id: number;
  name: string;
  email: string;
  province: string;
  provinceCode: string | null;
  role: "petugas" | "superadmin" | "verifikator" | "viewer";
  password?: string;
  active: boolean;
  loginUrl?: string;
}

const PATH = "/users";

export async function getUsers() {
  try {
    const { data } = await api.get<User[]>(PATH);
    if (Array.isArray(data) && data.length) {
      return data;
    }
  } catch (error) {
    console.warn("Gagal memuat users dari API, gunakan data demo.", error);
  }
  return DEMO_USERS;
}

export async function createUser(user: Omit<User, "id">) {
  const { data } = await api.post<User>(PATH, user);
  return data;
}

export async function updateUser(id: number, user: Partial<User>) {
  const { data } = await api.put<User>(`${PATH}/${id}`, user);
  return data;
}

export async function deleteUser(id: number) {
  const { data } = await api.delete<{ ok: boolean }>(`${PATH}/${id}`);
  return data;
}
