import { api } from "./api";

export interface EmissionOverview {
  year: number;
  submissions: number;
  baseline: number;
  mitigation: number;
  reducedPct: number;
}

export interface ProvinceSummary {
  province: string;
  year: number;
  submissions: number;
  baseline: number;
  mitigation: number;
  reducedPct: number;
}

export interface TimeseriesPoint {
  province: string;
  year: number;
  baseline: number;
  mitigation: number;
  reducedPct: number;
  submissions: number;
}

export async function getEmissionOverview(
  year: number
): Promise<EmissionOverview> {
  const { data } = await api.get<EmissionOverview>("/viewer/overall", {
    params: { year },
  });
  return data;
}

export async function getProvinceSummary(
  year: number
): Promise<ProvinceSummary[]> {
  const { data } = await api.get<ProvinceSummary[]>(
    "/viewer/summary-by-province",
    {
      params: { year },
    }
  );
  return data;
}

export async function getEmissionTimeseries(
  province: string,
  from: number,
  to: number
): Promise<TimeseriesPoint[]> {
  const { data } = await api.get<TimeseriesPoint[]>("/viewer/timeseries", {
    params: { province, from, to },
  });
  return data;
}
