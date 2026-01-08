import dynamic from "next/dynamic";

import type { LeafletMapProps } from "./leaflet-map.client";

export const LeafletMap = dynamic<LeafletMapProps>(
  () => import("./leaflet-map.client"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] w-full items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
        Memuat peta...
      </div>
    ),
  }
);

export type { LeafletMapProps, LeafletMarker } from "./leaflet-map.client";
