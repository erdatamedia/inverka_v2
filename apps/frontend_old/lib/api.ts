// apps/frontend/lib/api.ts
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

export type BackendError = {
  message?: string;
  [key: string]: unknown;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const data = error.response?.data as unknown;
    console.error("API Error", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data,
    });
    return Promise.reject(error);
  }
);

// Sisipkan token ke header
api.interceptors.request.use((config) => {
  const t = Cookies.get("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Log detail error (status + payload) agar gampang dilihat di console
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError<BackendError>(error)) {
      const ax = error as AxiosError<BackendError>;
      const data = ax.response?.data;
      const backendMessage = typeof data === "string" ? data : data?.message;

      console.error("API Error", {
        url: ax.config?.url,
        method: ax.config?.method,
        status: ax.response?.status,
        statusText: ax.response?.statusText,
        data,
        message: backendMessage ?? ax.message,
        baseURL: ax.config?.baseURL,
        params: ax.config?.params,
      });

      // Surface backend message to callers when available (without using `any`)
      if (backendMessage) {
        (
          ax as AxiosError<BackendError> & { friendlyMessage?: string }
        ).friendlyMessage = backendMessage;
      }
    } else {
      // Non-Axios or network script errors
      if (error instanceof Error) {
        console.error("API Error (non-axios)", {
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("API Error (non-axios)", {
          message: String(error),
        });
      }
    }
    return Promise.reject(error);
  }
);
