import dynamic from "next/dynamic";

import type { GeoJSONProps } from "react-leaflet";

export const GeoJSONLayer = dynamic<GeoJSONProps>(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false }
);

export type { GeoJSONProps } from "react-leaflet";
