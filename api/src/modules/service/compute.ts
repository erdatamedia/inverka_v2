import {
  subcatShares,
  systemShares,
  provinceActions,
  Subcat,
  System,
  CONST,
  MitigationMaster,
} from "../master/activityData";
import {
  computeEnteric,
  EntericSegment,
  EntericMitigation,
} from "../../calc/enteric";
import {
  computeManure,
  ManureSegment,
  ManureMitigation,
} from "../../calc/manure";

export type SubmissionInput = {
  total_population: number;
  province_id: string;
  mitigations: { action_id: string; coverage: number }[];
};

export function buildSegments(totalPopulation: number) {
  const segments: { subcat: Subcat; system: System; pop: number }[] = [];
  (Object.keys(subcatShares) as Subcat[]).forEach((sub) => {
    const popSub = totalPopulation * subcatShares[sub];
    (Object.keys(systemShares[sub]) as System[]).forEach((system) => {
      segments.push({
        subcat: sub,
        system,
        pop: popSub * systemShares[sub][system],
      });
    });
  });
  return segments;
}

export function computeEmissions(input: SubmissionInput) {
  const allowed = provinceActions[input.province_id] ?? [];

  const mapMitigation = (
    action: { action_id: string; coverage: number },
    filters: (master: MitigationMaster) => boolean,
    target: "enteric" | "manure"
  ) => {
    const master = allowed.find((m) => m.action_id === action.action_id);
    if (!master || !filters(master)) return null;
    return {
      action_id: master.action_id,
      target,
      reduction_type: master.reduction_type,
      reduction_rate: master.reduction_rate,
      coverage: action.coverage,
    } as EntericMitigation | ManureMitigation;
  };

  const entericMitigations = input.mitigations
    .map((action) =>
      mapMitigation(
        action,
        (master) => master.target === "enteric",
        "enteric"
      )
    )
    .filter((m): m is EntericMitigation => Boolean(m));

  const manureMitigations = input.mitigations
    .map((action) =>
      mapMitigation(
        action,
        (master) => master.target === "manure" || master.target === "both",
        "manure"
      )
    )
    .filter((m): m is ManureMitigation => Boolean(m));

  const segments = buildSegments(input.total_population);

  const entericSegments = segments as EntericSegment[];
  const manureSegments = segments as ManureSegment[];

  const enteric = computeEnteric(entericSegments, entericMitigations);
  const manure = computeManure(manureSegments, manureMitigations);

  const ch4CO2eTon =
    enteric.CH4_CO2e_ton + manure.CH4_ton * CONST.GWP_CH4;
  const n2oCO2eTon =
    manure.N2O_direct_CO2e_ton + manure.N2O_indirect_CO2e_ton;

  const byGasGg = {
    CH4: ch4CO2eTon / 1000,
    N2O: n2oCO2eTon / 1000,
  };

  const totalGg = byGasGg.CH4 + byGasGg.N2O;

  return {
    summary: {
      total_GgCO2e: +totalGg.toFixed(2),
    },
    by_gas_GgCO2e: {
      CH4: +byGasGg.CH4.toFixed(2),
      N2O: +byGasGg.N2O.toFixed(2),
      total: +totalGg.toFixed(2),
    },
    manure_detail_GgCO2e: {
      N2O_direct: +(manure.N2O_direct_CO2e_ton / 1000).toFixed(2),
      N2O_indirect: +(manure.N2O_indirect_CO2e_ton / 1000).toFixed(2),
      CH4: +((manure.CH4_ton * CONST.GWP_CH4) / 1000).toFixed(2),
      total: +manure.total_GgCO2e.toFixed(2),
    },
    enteric_detail: {
      CH4_ton: +enteric.CH4_ton.toFixed(2),
      CH4_CO2e_ton: +enteric.CH4_CO2e_ton.toFixed(2),
      CH4_GgCO2e: +enteric.CH4_GgCO2e.toFixed(2),
    },
  };
}
