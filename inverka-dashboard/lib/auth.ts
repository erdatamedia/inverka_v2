import Cookies from "js-cookie";

export function saveToken(token: string) {
  Cookies.set("token", token, { expires: 1 });
}
export function getToken() {
  return Cookies.get("token");
}
export function clearToken() {
  Cookies.remove("token");
}

export type UserSession = {
  role: "superadmin" | "petugas" | "verifikator" | "viewer";
  email: string;
  province?: string | null;
};

export type JwtPayload = {
  sub: number;
  role: "superadmin" | "petugas" | "verifikator" | "viewer";
  email: string;
  province?: string | null;
  iat: number;
  exp: number;
};

export function getUser(): JwtPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    const base64 = token.split(".")[1];
    const json = JSON.parse(atob(base64));
    return json as JwtPayload;
  } catch {
    return null;
  }
}
