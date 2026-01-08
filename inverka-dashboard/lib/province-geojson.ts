import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

import rawProvinceGeojson from "@/public/38 Provinsi Indonesia - Provinsi.json";

import { PROVINCE_COORDINATES } from "./indonesia-provinces";

type ProvinceGeometry = Polygon | MultiPolygon;

export type ProvinceGeoProperties = {
  KODE_PROV: string;
  PROVINSI: string;
  ISO_CODE?: string | null;
};

export type ProvinceGeoFeature = Feature<ProvinceGeometry, ProvinceGeoProperties>;

export type ProvinceGeoCollection = FeatureCollection<ProvinceGeometry, ProvinceGeoProperties>;

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/provinsi/g, "")
    .replace(/[^a-z0-9]/g, "");

const CODE_BY_NAME = PROVINCE_COORDINATES.reduce<Record<string, string>>((acc, item) => {
  acc[normalizeName(item.name)] = item.code;
  return acc;
}, {});

const NAME_ALIASES: Record<string, string> = {
  diyogyakarta: "ID-YO",
};

const withIsoCode: ProvinceGeoCollection = {
  type: "FeatureCollection",
  features: (rawProvinceGeojson as ProvinceGeoCollection).features.map((feature) => {
    const normalized = normalizeName(feature.properties.PROVINSI);
    const isoCode = CODE_BY_NAME[normalized] ?? NAME_ALIASES[normalized] ?? null;
    return {
      ...feature,
      properties: {
        ...feature.properties,
        ISO_CODE: isoCode,
      },
    };
  }),
};

export const PROVINCE_BOUNDARIES: ProvinceGeoCollection = withIsoCode;

export const PROVINCE_FEATURE_MAP = PROVINCE_BOUNDARIES.features.reduce<
  Record<string, ProvinceGeoFeature>
>((acc, feature) => {
  if (feature.properties.ISO_CODE) {
    acc[feature.properties.ISO_CODE] = feature;
  }
  return acc;
}, {});
