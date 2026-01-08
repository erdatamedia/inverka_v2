declare module "geojson" {
  export type Position = GeoJSON.Position
  export type Geometry = GeoJSON.Geometry
  export type Polygon = GeoJSON.Polygon
  export type MultiPolygon = GeoJSON.MultiPolygon
  export type Feature<
    G extends Geometry = Geometry,
    P = GeoJSON.GeoJsonProperties,
  > = GeoJSON.Feature<G, P>
  export type FeatureCollection<
    G extends Geometry = Geometry,
    P = GeoJSON.GeoJsonProperties,
  > = GeoJSON.FeatureCollection<G, P>
}
