// src/types/config-rows.ts
// Shared type definitions for configuration data tables used in INVERKA API

export type ProductionSystem =
  | "Ekstensif"
  | "Semi-Intensif"
  | "Intensif"
  | "Extensive"
  | "Semi-Intensive"
  | "Intensive";

export type Physiological =
  | "Weaning"
  | "Yearling"
  | "Adult male"
  | "Adult female";

export interface PopulationRow {
  Production_System: ProductionSystem;
  Animal_Category: string;
  Population: number;
}

export interface AnimalParamsRow {
  Production_System: ProductionSystem;
  Animal_Category: string;
  LW: number; // Live Weight (kg)
  ADG: number; // Average Daily Gain (kg/day)
  Milk_kg_day: number;
  DMD_percent: number; // Dry Matter Digestibility (%)
  DE_Calculated_percent: number; // Digestible Energy (%)
  CP_percent_diet: number; // Crude Protein (%)
  Ash_percent_diet: number; // Ash content (%)
  Mature_Weight_kg: number;
  Fat_Content_Milk_percent: number;
  Work_Hours_day: number;
  Prop_Cows_Pregnant_percent: number;
}

export interface ManureMgmtRow {
  Production_System: ProductionSystem;
  Animal_Category: string;
  Lagoon: number;
  "Liquid/Slurry": number;
  Solid_Storage: number;
  Dry_Lot: number;
  "Pasture/Range/Paddock": number;
  Daily_Spread: number;
  Composting: number;
  Burned_for_fuel: number;
  Biogas: number;
}

export interface ActivityDataRow {
  provinceCode: string;
  provinceName: string;
  mix: {
    ekstensif: number;
    semi: number;
    intensif: number;
  };
  distro: {
    ekstensif: Record<Physiological, number>;
    semi: Record<Physiological, number>;
    intensif: Record<Physiological, number>;
  };
}

export type ActivityData = ActivityDataRow[];

export type MitigationCategory = "Pre weaning" | "Young" | "Growth" | "Mature";
export type MitigationFeed =
  | "Jerami padi/Rumput Lapang"
  | "Rumput Budidaya/Limbah Peternakan";
export type MitigationAction = "Konsentrat" | "Legumes" | "Silase";

export type MitigationFactors = Record<
  MitigationFeed,
  Record<MitigationAction, number>
>;

export interface MitigationRow {
  category: MitigationCategory;
  factors: MitigationFactors; // faktor koreksi per feed & action
  fe?: number | null; // opsional: faktor emisi agregat jika diperlukan
}

export type MitigationTable = MitigationRow[];
