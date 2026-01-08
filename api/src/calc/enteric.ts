import { CONST, getEntericEF, Subcat, System } from "../modules/master/activityData";

export type EntericSegment = { subcat: Subcat; system: System; pop: number };

export type EntericMitigation = {
  action_id: string;
  target: "enteric";
  reduction_type: "EF" | "emission";
  reduction_rate: number;
  coverage: number;
};

export function computeEnteric(
  segments: EntericSegment[],
  mitigations: EntericMitigation[]
) {
  const efFactor = mitigations
    .filter((m) => m.reduction_type === "EF")
    .reduce((acc, m) => acc * (1 - m.reduction_rate * (m.coverage || 0)), 1);

  let ch4Ton = 0;
  for (const seg of segments) {
    const ef = getEntericEF(seg.subcat, seg.system) * efFactor;
    ch4Ton += (seg.pop * ef) / 1000;
  }

  const emFactor = mitigations
    .filter((m) => m.reduction_type === "emission")
    .reduce((acc, m) => acc * (1 - m.reduction_rate * (m.coverage || 0)), 1);
  ch4Ton *= emFactor;

  const ch4CO2eTon = ch4Ton * CONST.GWP_CH4;
  return {
    CH4_ton: ch4Ton,
    CH4_CO2e_ton: ch4CO2eTon,
    CH4_GgCO2e: ch4CO2eTon / 1000,
  };
}
