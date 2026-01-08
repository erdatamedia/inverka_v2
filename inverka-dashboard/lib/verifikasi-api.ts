import { isAxiosError } from "axios";
import { api } from "./api";
import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";

export type QueueStatus = SubmissionStatus;

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  menunggu_verifikasi: "Menunggu Verifikasi",
  dalam_verifikasi: "Sedang Diverifikasi",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

export async function getVerifikasiQueue(status?: QueueStatus) {
  const { data } = await api.get<SubmissionRecord[]>("/verifikasi/queue", {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function updateVerifikasiStatus(
  id: string,
  payload: { province: string; year: number; status: QueueStatus; note?: string }
) {
  const { data } = await api.patch<SubmissionRecord>(
    `/verifikasi/status/${id}`,
    payload
  );
  return data;
}

export async function deleteSubmissionRequest(
  id: string,
  payload: { province: string; year: number }
) {
  try {
    const { data } = await api.post<SubmissionRecord>(`/verifikasi/delete`, {
      id,
      ...payload,
    });
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      try {
        const { data } = await api.delete<SubmissionRecord>(
          `/verifikasi/${id}`,
          { data: payload }
        );
        return data;
      } catch {
        const { data } = await api.delete<SubmissionRecord>(
          `/submissions/${id}`,
          {
            data: payload,
          }
        );
        return data;
      }
    }
    throw error;
  }
}

export async function getVerifikasiDetail(
  province: string,
  year: number,
  id: string
) {
  const { data } = await api.get<SubmissionRecord>(
    `/verifikasi/detail/${province}/${year}/${id}`
  );
  return data;
}
