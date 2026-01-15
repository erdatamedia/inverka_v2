import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";

type SubmissionBackup = {
  version: number;
  exportedAt: string;
  year?: number;
  rows: SubmissionRecord[];
};

const ALLOWED_STATUSES: SubmissionStatus[] = [
  "menunggu_verifikasi",
  "dalam_verifikasi",
  "disetujui",
  "ditolak",
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isValidNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isValidStatus = (value: unknown): value is SubmissionStatus =>
  typeof value === "string" &&
  (ALLOWED_STATUSES as string[]).includes(value);

const isValidSummary = (value: unknown): value is SubmissionRecord["result"]["summary"] => {
  if (!isObject(value)) return false;
  return (
    isValidNumber(value.baseline_GgCO2e) &&
    isValidNumber(value.with_mitigation_GgCO2e) &&
    isValidNumber(value.reduction_GgCO2e)
  );
};

const isValidResult = (value: unknown): value is SubmissionRecord["result"] => {
  if (!isObject(value)) return false;
  return isValidSummary(value.summary);
};

const isValidDateString = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const isSubmissionRow = (row: unknown): row is SubmissionRecord => {
  if (!isObject(row)) return false;
  return (
    typeof row.id === "string" &&
    typeof row.province === "string" &&
    isValidNumber(row.year) &&
    isValidStatus(row.status) &&
    isValidDateString(row.updatedAt) &&
    isValidResult(row.result)
  );
};

export const parseSubmissionBackup = (text: string) => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("File backup bukan JSON yang valid.");
  }

  if (!isObject(data)) {
    throw new Error("Format backup tidak dikenali.");
  }

  const payload = data as Partial<SubmissionBackup>;

  if (payload.version !== 1) {
    throw new Error("Versi file backup tidak didukung.");
  }

  if (!isValidDateString(payload.exportedAt)) {
    throw new Error("Metadata backup tidak valid.");
  }

  if (!Array.isArray(payload.rows)) {
    throw new Error("Data pengajuan tidak ditemukan di file backup.");
  }

  payload.rows.forEach((row, index) => {
    if (!isSubmissionRow(row)) {
      throw new Error(`Format data pengajuan baris ${index + 1} tidak valid.`);
    }
  });

  if (payload.year !== undefined && !isValidNumber(payload.year)) {
    throw new Error("Tahun backup tidak valid.");
  }

  return {
    rows: payload.rows,
    year: payload.year,
  };
};
