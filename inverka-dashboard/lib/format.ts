export const roundGg = (n: number, digits = 2) =>
  Number.isFinite(n) ? Number(n.toFixed(digits)) : 0;

export const pct = (n: number, digits = 2) =>
  Number.isFinite(n) ? Number(n.toFixed(digits)) : 0;

export const ggToTon = (n: number, digits = 2) =>
  Number.isFinite(n) ? Number((n * 1000).toFixed(digits)) : 0;
