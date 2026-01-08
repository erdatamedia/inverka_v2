"use client";

import type { CSSProperties, ReactNode } from "react";
import type {
  LatLngBoundsExpression,
  LatLngExpression,
} from "leaflet";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

import { cn } from "@/lib/utils";

export type LeafletMarker = {
  id: string;
  position: LatLngExpression;
  radius?: number;
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  tooltip?: ReactNode;
  value?: number;
};

export interface LeafletMapProps {
  center?: LatLngExpression;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  bounds?: LatLngBoundsExpression;
  className?: string;
  style?: CSSProperties;
  markers?: LeafletMarker[];
  children?: ReactNode;
  scrollWheelZoom?: boolean;
  attributionControl?: boolean;
}

const DEFAULT_CENTER: LatLngExpression = [-2.5, 118];
const DEFAULT_ZOOM = 4;

export default function LeafletMapClient({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  minZoom = 3,
  maxZoom = 12,
  bounds,
  className,
  style,
  markers = [],
  children,
  scrollWheelZoom = true,
  attributionControl = true,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={minZoom}
      maxZoom={maxZoom}
      bounds={bounds}
      scrollWheelZoom={scrollWheelZoom}
      attributionControl={attributionControl}
      className={cn(
        "relative h-[360px] w-full overflow-hidden rounded-xl border",
        className
      )}
      style={style}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={marker.position}
          radius={marker.radius ?? 8}
          pathOptions={{
            color: marker.color ?? "hsl(var(--primary))",
            weight: 1.2,
            fillColor: marker.fillColor ?? marker.color ?? "hsl(var(--primary))",
            fillOpacity: marker.fillOpacity ?? 0.35,
          }}
        >
          {marker.tooltip ? <Tooltip>{marker.tooltip}</Tooltip> : null}
        </CircleMarker>
      ))}
      {children}
    </MapContainer>
  );
}
