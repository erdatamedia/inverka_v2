export type Subcat =
  | "calf"
  | "yearling"
  | "adult_male"
  | "adult_female"
  | "imported";

export type System = "extensive" | "semi_intensive" | "intensive";

export const CONST = {
  GWP_CH4: 28,
  GWP_N2O: 265,
  N2O_N_TO_N2O: 44 / 28,
} as const;

export const subcatShares: Record<Subcat, number> = {
  calf: 0.21,
  yearling: 0.25,
  adult_male: 0.15,
  adult_female: 0.34,
  imported: 0.05,
};

export const systemShares: Record<Subcat, Record<System, number>> = {
  calf: { extensive: 0.7, semi_intensive: 0.2, intensive: 0.1 },
  yearling: { extensive: 0.6, semi_intensive: 0.3, intensive: 0.1 },
  adult_male: { extensive: 0.5, semi_intensive: 0.3, intensive: 0.2 },
  adult_female: {
    extensive: 0.55,
    semi_intensive: 0.3,
    intensive: 0.15,
  },
  imported: { extensive: 0.2, semi_intensive: 0.3, intensive: 0.5 },
};

const ENTERIC_EF: Record<Subcat, Record<System, number>> = {
  calf: { extensive: 22, semi_intensive: 20, intensive: 18 },
  yearling: { extensive: 35, semi_intensive: 33, intensive: 30 },
  adult_male: { extensive: 55, semi_intensive: 52, intensive: 48 },
  adult_female: { extensive: 50, semi_intensive: 47, intensive: 44 },
  imported: { extensive: 60, semi_intensive: 58, intensive: 55 },
};

export function getEntericEF(sub: Subcat, sys: System): number {
  return ENTERIC_EF[sub][sys];
}

export function getManureEF(sub: Subcat, sys: System) {
  const base = {
    calf: { ch4: 2.0, dir: 0.02, ind: 0.01 },
    yearling: { ch4: 3.2, dir: 0.03, ind: 0.015 },
    adult_male: { ch4: 4.5, dir: 0.05, ind: 0.02 },
    adult_female: { ch4: 4.0, dir: 0.045, ind: 0.02 },
    imported: { ch4: 5.0, dir: 0.06, ind: 0.025 },
  } satisfies Record<
    Subcat,
    { ch4: number; dir: number; ind: number }
  >;

  const adj = sys === "intensive" ? 1.2 : sys === "semi_intensive" ? 1.1 : 1.0;

  return {
    ch4Kg: base[sub].ch4 * adj,
    n2oDirKgN2ON: base[sub].dir * adj,
    n2oIndKgN2ON: base[sub].ind * adj,
  };
}

export type MitigationTarget = "enteric" | "manure" | "both";
export type MitigationType = "EF" | "emission";

export type MitigationMaster = {
  action_id: string;
  target: MitigationTarget;
  reduction_type: MitigationType;
  reduction_rate: number;
};

export const provinceActions: Record<string, MitigationMaster[]> = {
  "JBR-Subang": [
    {
      action_id: "diet-quality",
      target: "enteric",
      reduction_type: "EF",
      reduction_rate: 0.12,
    },
    {
      action_id: "anaerobic-digester",
      target: "manure",
      reduction_type: "emission",
      reduction_rate: 0.5,
    },
    {
      action_id: "solid-separation",
      target: "manure",
      reduction_type: "emission",
      reduction_rate: 0.2,
    },
  ],
};
