export type Distribution = {
  Weaning: number;
  Yearling: number;
  Young: number;
  Mature: number;
};

export type FeedClassRow = { fc1: number; fc2: number; fc3: number; fc4: number };

export type FeedClass = {
  Weaning: FeedClassRow;
  Yearling: FeedClassRow;
  Young: FeedClassRow;
  Mature: FeedClassRow;
};

export const PROVINCES = [
  "ID-AC",
  "ID-SU",
  "ID-SB",
  "ID-RI",
  "ID-JA",
  "ID-SS",
  "ID-BE",
  "ID-LA",
  "ID-JK",
  "ID-JR",
  "ID-JT",
  "ID-YO",
  "ID-JI",
  "ID-BT",
  "ID-BA",
  "ID-NB",
  "ID-NT",
  "ID-KB",
  "ID-KT",
  "ID-KS",
  "ID-KU",
  "ID-KI",
  "ID-BB",
  "ID-KR",
  "ID-ST",
  "ID-SN",
  "ID-SG",
  "ID-GO",
  "ID-SR",
  "ID-MA",
  "ID-MU",
  "ID-PA",
  "ID-PB",
] as const;

export const UNIQUE_PROVINCES = Array.from(new Set(PROVINCES));

export const SAMPLE_DIST: Distribution = {
  Weaning: 210,
  Yearling: 235,
  Young: 282,
  Mature: 392,
};

export const SAMPLE_FEED: FeedClass = {
  Weaning: { fc1: 4, fc2: 144, fc3: 62, fc4: 0 },
  Yearling: { fc1: 0, fc2: 106, fc3: 128, fc4: 1 },
  Young: { fc1: 13, fc2: 167, fc3: 48, fc4: 54 },
  Mature: { fc1: 5, fc2: 306, fc3: 80, fc4: 1 },
};
