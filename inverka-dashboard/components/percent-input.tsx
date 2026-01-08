"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export function PercentInput({
  value,
  onChange,
  min = 0,
  max = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay(
      Number(value).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })
    );
  }, [value]);

  return (
    <Input
      inputMode="decimal"
      step="0.0001"
      value={display}
      onChange={(e) => {
        const raw = e.target.value;
        setDisplay(raw);
        const normalized = raw.replace(/\./g, "").replace(",", ".");
        const parsed = parseFloat(normalized);
        if (!Number.isNaN(parsed))
          onChange(Math.max(min, Math.min(max, parsed)));
      }}
      onBlur={() => {
        onChange(
          Math.max(
            min,
            Math.min(max, Number(display.replace(/\./g, "").replace(",", ".")))
          )
        );
      }}
    />
  );
}
