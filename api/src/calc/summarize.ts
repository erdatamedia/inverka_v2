import { BaselineEmission } from "./baseline";

export interface SummaryResult {
  summary: {
    baseline: number;
    mitigated: number;
    reduction: number;
    percent: number;
  };
  by_gas: {
    CH4: number;
    N2O: number;
    total: number;
  };
  manure: {
    CH4: number;
    N2O_dir: number;
    N2O_ind: number;
    total: number;
  };
  enteric: {
    CH4_ton: number;
    CH4_CO2e: number;
    CH4_Gg: number;
  };
}

export function buildSummary(
  baseline: BaselineEmission,
  mitigated: BaselineEmission
): SummaryResult {
  const baselineTotal =
    baseline.entericCO2eTon +
    baseline.manureCH4CO2eTon +
    baseline.manureN2ODirectCO2eTon +
    baseline.manureN2OIndirectCO2eTon;

  const mitigatedTotal =
    mitigated.entericCO2eTon +
    mitigated.manureCH4CO2eTon +
    mitigated.manureN2ODirectCO2eTon +
    mitigated.manureN2OIndirectCO2eTon;

  const reduction = baselineTotal - mitigatedTotal;
  const percent =
    baselineTotal > 0 ? (reduction / baselineTotal) * 100 : 0;

  const ch4Co2e =
    mitigated.entericCO2eTon + mitigated.manureCH4CO2eTon;
  const n2oCo2e =
    mitigated.manureN2ODirectCO2eTon +
    mitigated.manureN2OIndirectCO2eTon;
  const manureTotal =
    mitigated.manureCH4CO2eTon +
    mitigated.manureN2ODirectCO2eTon +
    mitigated.manureN2OIndirectCO2eTon;

  return {
    summary: {
      baseline: round2(baselineTotal),
      mitigated: round2(mitigatedTotal),
      reduction: round2(reduction),
      percent: round2(percent),
    },
    by_gas: {
      CH4: round3(ch4Co2e / 1000),
      N2O: round3(n2oCo2e / 1000),
      total: round3((ch4Co2e + n2oCo2e) / 1000),
    },
    manure: {
      CH4: round2(mitigated.manureCH4CO2eTon),
      N2O_dir: round2(mitigated.manureN2ODirectCO2eTon),
      N2O_ind: round2(mitigated.manureN2OIndirectCO2eTon),
      total: round2(manureTotal),
    },
    enteric: {
      CH4_ton: round2(mitigated.entericCH4Ton),
      CH4_CO2e: round2(mitigated.entericCO2eTon),
      CH4_Gg: round3(mitigated.entericCO2eTon / 1000),
    },
  };
}

const round2 = (value: number) =>
  Math.round(value * 100) / 100;

const round3 = (value: number) =>
  Math.round(value * 1000) / 1000;
