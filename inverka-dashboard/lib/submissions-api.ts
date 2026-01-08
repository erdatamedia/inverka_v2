import { api } from "./api";
import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";

export async function listSubmissions(year?: number) {
  const params = year ? { year } : undefined;
  const { data } = await api.get<SubmissionRecord[]>("/submissions", {
    params,
  });
  return data;
}

export async function updateSubmissionStatus(
  id: string,
  payload: {
    province: string;
    year: number;
    status: SubmissionStatus;
    note?: string;
  }
) {
  const { data } = await api.patch<SubmissionRecord>(
    `/submissions/${id}/status`,
    payload
  );
  return data;
}
