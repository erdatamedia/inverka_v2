const COLOR_GRADIENT = [
  "#fefaf2",
  "#f8e9cf",
  "#f1cfa2",
  "#e6a36c",
  "#d06a44",
  "#b52f2a",
  "#7a141c",
];

export function getEmissionColor(intensity: number) {
  if (!Number.isFinite(intensity)) return COLOR_GRADIENT[0];
  const clamped = Math.max(0, Math.min(1, intensity));
  const scaled = clamped * (COLOR_GRADIENT.length - 1);
  const lowerIndex = Math.floor(scaled);
  const upperIndex = Math.min(COLOR_GRADIENT.length - 1, lowerIndex + 1);
  const t = scaled - lowerIndex;
  if (t === 0) return COLOR_GRADIENT[lowerIndex];

  const lower = COLOR_GRADIENT[lowerIndex];
  const upper = COLOR_GRADIENT[upperIndex];
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  const hexToRgb = (hex: string) => {
    const value = hex.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return { r, g, b };
  };
  const lowerRgb = hexToRgb(lower);
  const upperRgb = hexToRgb(upper);
  const r = lerp(lowerRgb.r, upperRgb.r);
  const g = lerp(lowerRgb.g, upperRgb.g);
  const b = lerp(lowerRgb.b, upperRgb.b);
  return `rgb(${r}, ${g}, ${b})`;
}

