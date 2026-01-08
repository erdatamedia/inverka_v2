// lib/api.ts
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type {
  SubmissionRecord,
  SubmissionRequest,
  SubmissionResult,
  SubmissionStatus,
  SubmissionStatusNote,
} from "@/lib/types";
import Cookies from "js-cookie";

// ---- KONFIG ----
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
});

// Simpan/hapus token + set default header Authorization
export function setAuth(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    Cookies.set("token", token, { path: "/", sameSite: "lax" });
  } else {
    delete api.defaults.headers.common.Authorization;
    Cookies.remove("token", { path: "/" });
  }
}

// Saat modul di-load di browser, set header dari cookie jika ada
if (typeof window !== "undefined") {
  const t = Cookies.get("token");
  if (t) {
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
  }
}

// ---- Types untuk error backend (tanpa any)
type BackendErrorData =
  | { message?: string; error?: string; statusCode?: number }
  | string
  | null
  | undefined;

const safeStringify = (v: unknown) => {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const baseURL = (error.config as AxiosRequestConfig | undefined)?.baseURL;
    const data = error.response?.data as BackendErrorData;
    const backendMessage =
      typeof data === "string" ? data : data?.message ?? null;

    const log = {
      url: error.config?.url ?? null,
      method: error.config?.method ?? null,
      status: error.response?.status ?? null,
      statusText: error.response?.statusText ?? null,
      baseURL,
      params: error.config?.params ?? null,
      data: data ?? null,
      message: backendMessage ?? error.message ?? "Request error",
    };

    console.error("API Error -> " + safeStringify(log));

    return Promise.reject(error);
  }
);

type SubmissionApiPayload = {
  year: number;
  region_id: string;
  total_population: number;
  mitigations: { action_id: string; coverage: number }[];
};

type SubmissionApiResponseV2 = {
  id: string;
  province: string;
  year: number;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  result: SubmissionResult;
  notes?: SubmissionStatusNote[];
};

type SubmissionApiResponseLegacy = {
  result: SubmissionResult;
};

const isV2Response = (data: unknown): data is SubmissionApiResponseV2 => {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  const hasResult =
    typeof candidate.result === "object" && candidate.result !== null;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.province === "string" &&
    typeof candidate.year === "number" &&
    typeof candidate.status === "string" &&
    hasResult
  );
};

const isLegacyResponse = (
  data: unknown
): data is SubmissionApiResponseLegacy => {
  if (!data || typeof data !== "object") return false;
  return "result" in data;
};

const mapSubmissionRecord = (
  data: SubmissionApiResponseV2
): SubmissionRecord => ({
  id: data.id,
  province: data.province,
  year: data.year,
  status: data.status,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
  result: data.result,
  notes: data.notes ?? [],
});

export async function submitEmissions(
  payload: SubmissionRequest
): Promise<SubmissionRecord> {
  const apiPayload: SubmissionApiPayload = {
    year: payload.year,
    region_id: payload.province_id,
    total_population: payload.total_population,
    mitigations: payload.mitigations.map((item) => ({
      action_id: item.action_id,
      coverage: item.coverage,
    })),
  };

  const { data } = await api.post<SubmissionApiResponseV2 | SubmissionApiResponseLegacy>(
    "/submissions",
    apiPayload
  );

  if (isLegacyResponse(data)) {
    return {
      id: `LEGACY-${Date.now()}`,
      province: payload.province_id,
      year: payload.year,
      status: "menunggu_verifikasi",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: data.result,
      notes: [],
    };
  }
  if (isV2Response(data)) {
    return mapSubmissionRecord(data);
  }

  throw new Error("Format respon submissions tidak dikenali.");
}
