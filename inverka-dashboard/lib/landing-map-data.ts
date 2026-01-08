import { PROVINCE_COORDINATES } from "./indonesia-provinces";

export type LandingMapDatum = {
  code: string;
  name: string;
  lat: number;
  lon: number;
  emission: number;
  mitigation: number;
  reductionPct: number;
};

const deriveEmission = (lat: number, lon: number, index: number) => {
  const base = Math.abs(Math.sin((lat + index) * 1.3)) * 35;
  const modifier = Math.abs(Math.cos(lon * 0.6)) * 10;
  return Number((base + modifier + 8).toFixed(2));
};

const deriveReductionPct = (lat: number, lon: number, index: number) => {
  const pct = Math.abs(Math.cos((lat - lon) * 0.4 + index * 0.2)) * 25;
  return Number(Math.min(45, pct).toFixed(2));
};

export const LANDING_MAP_DATA: LandingMapDatum[] = PROVINCE_COORDINATES.map(
  (province, index) => {
    const emission = deriveEmission(province.lat, province.lon, index);
    const reductionPct = deriveReductionPct(province.lat, province.lon, index);
    const mitigation = Number(
      (emission * (1 - reductionPct / 100)).toFixed(2)
    );
    return {
      code: province.code,
      name: province.name,
      lat: province.lat,
      lon: province.lon,
      emission,
      mitigation,
      reductionPct,
    };
  }
);

const latitudes = LANDING_MAP_DATA.map((item) => item.lat);
const longitudes = LANDING_MAP_DATA.map((item) => item.lon);

export const LANDING_MAP_BOUNDS: [[number, number], [number, number]] = [
  [Math.min(...latitudes) - 4, Math.min(...longitudes) - 4],
  [Math.max(...latitudes) + 4, Math.max(...longitudes) + 4],
];

export const LANDING_MAP_TOTALS = LANDING_MAP_DATA.reduce(
  (acc, item) => {
    acc.baseline += item.emission;
    acc.mitigation += item.mitigation;
    acc.reduction += item.emission - item.mitigation;
    return acc;
  },
  { baseline: 0, mitigation: 0, reduction: 0 }
);
