type ProvinceCoordinate = {
  code: string;
  name: string;
  lat: number;
  lon: number;
};

export const PROVINCE_COORDINATES: ProvinceCoordinate[] = [
  { code: "ID-AC", name: "Aceh", lat: 5.55, lon: 95.32 },
  { code: "ID-SU", name: "Sumatera Utara", lat: 3.59, lon: 98.67 },
  { code: "ID-SB", name: "Sumatera Barat", lat: -0.95, lon: 100.35 },
  { code: "ID-RI", name: "Riau", lat: 0.51, lon: 101.45 },
  { code: "ID-JA", name: "Jambi", lat: -1.6, lon: 103.61 },
  { code: "ID-SS", name: "Sumatera Selatan", lat: -3.32, lon: 104.2 },
  { code: "ID-BE", name: "Bengkulu", lat: -3.8, lon: 102.27 },
  { code: "ID-LA", name: "Lampung", lat: -5.43, lon: 105.26 },
  { code: "ID-BB", name: "Kepulauan Bangka Belitung", lat: -2.75, lon: 106.07 },
  { code: "ID-KR", name: "Kepulauan Riau", lat: 1.08, lon: 104.03 },
  { code: "ID-JK", name: "DKI Jakarta", lat: -6.2, lon: 106.85 },
  { code: "ID-JB", name: "Jawa Barat", lat: -6.9, lon: 107.6 },
  { code: "ID-JT", name: "Jawa Tengah", lat: -7.05, lon: 110.4 },
  { code: "ID-YO", name: "Daerah Istimewa Yogyakarta", lat: -7.8, lon: 110.36 },
  { code: "ID-JI", name: "Jawa Timur", lat: -7.79, lon: 112.62 },
  { code: "ID-BT", name: "Banten", lat: -6.12, lon: 106.15 },
  { code: "ID-BA", name: "Bali", lat: -8.34, lon: 115.09 },
  { code: "ID-NB", name: "Nusa Tenggara Barat", lat: -8.58, lon: 116.1 },
  { code: "ID-NT", name: "Nusa Tenggara Timur", lat: -8.66, lon: 121.07 },
  { code: "ID-KB", name: "Kalimantan Barat", lat: -0.03, lon: 109.34 },
  { code: "ID-KT", name: "Kalimantan Tengah", lat: -2.21, lon: 113.92 },
  { code: "ID-KS", name: "Kalimantan Selatan", lat: -3.33, lon: 114.59 },
  { code: "ID-KI", name: "Kalimantan Timur", lat: 0.14, lon: 117.15 },
  { code: "ID-KU", name: "Kalimantan Utara", lat: 3.0, lon: 117.52 },
  { code: "ID-SA", name: "Sulawesi Utara", lat: 1.5, lon: 124.85 },
  { code: "ID-ST", name: "Sulawesi Tengah", lat: -0.89, lon: 119.87 },
  { code: "ID-SN", name: "Sulawesi Selatan", lat: -5.14, lon: 119.41 },
  { code: "ID-SG", name: "Sulawesi Tenggara", lat: -4.0, lon: 122.5 },
  { code: "ID-GO", name: "Gorontalo", lat: 0.54, lon: 123.06 },
  { code: "ID-SR", name: "Sulawesi Barat", lat: -2.49, lon: 119.34 },
  { code: "ID-MA", name: "Maluku", lat: -3.7, lon: 128.17 },
  { code: "ID-MU", name: "Maluku Utara", lat: 0.78, lon: 127.38 },
  { code: "ID-PB", name: "Papua Barat", lat: -0.86, lon: 134.07 },
  { code: "ID-PY", name: "Papua Barat Daya", lat: -1.05, lon: 131.25 },
  { code: "ID-PA", name: "Papua", lat: -2.53, lon: 140.72 },
  { code: "ID-PT", name: "Papua Tengah", lat: -3.55, lon: 136.1 },
  { code: "ID-PP", name: "Papua Pegunungan", lat: -4.1, lon: 138.95 },
  { code: "ID-PS", name: "Papua Selatan", lat: -6.3, lon: 140.35 },
];

export const PROVINCE_COORDINATE_MAP = PROVINCE_COORDINATES.reduce<
  Record<string, ProvinceCoordinate>
>((acc, item) => {
  acc[item.code] = item;
  return acc;
}, {});

export type ProvinceCoordinateMap = typeof PROVINCE_COORDINATE_MAP;
