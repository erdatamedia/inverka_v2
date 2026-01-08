import {
  CONST,
  getManureEF,
  Subcat,
  System,
} from "../modules/master/activityData";

export type ManureSegment = { subcat: Subcat; system: System; pop: number };

export type ManureMitigation = {
  action_id: string;
  target: "manure";
  reduction_type: "EF" | "emission";
  reduction_rate: number;
  coverage: number;
};

export function computeManure(
  segments: ManureSegment[],
  mitigations: ManureMitigation[]
) {
  const efFactor = mitigations
    .filter((m) => m.reduction_type === "EF")
    .reduce((acc, m) => acc * (1 - m.reduction_rate * (m.coverage || 0)), 1);

  let ch4Ton = 0;
  let n2oDirCO2eTon = 0;
  let n2oIndCO2eTon = 0;

  for (const seg of segments) {
    const { ch4Kg, n2oDirKgN2ON, n2oIndKgN2ON } = getManureEF(
      seg.subcat,
      seg.system
    );
    ch4Ton += (seg.pop * ch4Kg * efFactor) / 1000;
    n2oDirCO2eTon +=
      seg.pop *
      (n2oDirKgN2ON * efFactor) *
      CONST.N2O_N_TO_N2O *
      CONST.GWP_N2O;
    n2oIndCO2eTon +=
      seg.pop *
      (n2oIndKgN2ON * efFactor) *
      CONST.N2O_N_TO_N2O *
      CONST.GWP_N2O;
  }

  const emFactor = mitigations
    .filter((m) => m.reduction_type === "emission")
    .reduce((acc, m) => acc * (1 - m.reduction_rate * (m.coverage || 0)), 1);

  ch4Ton *= emFactor;
  n2oDirCO2eTon *= emFactor;
  n2oIndCO2eTon *= emFactor;

  const totalCO2eTon =
    ch4Ton * CONST.GWP_CH4 + n2oDirCO2eTon + n2oIndCO2eTon;

  return {
    CH4_ton: ch4Ton,
    N2O_direct_CO2e_ton: n2oDirCO2eTon,
    N2O_indirect_CO2e_ton: n2oIndCO2eTon,
    total_CO2e_ton: totalCO2eTon,
    total_GgCO2e: totalCO2eTon / 1000,
  };
}
