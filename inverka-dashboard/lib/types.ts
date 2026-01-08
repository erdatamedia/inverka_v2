export type MitigationCategory = "Pre weaning" | "Young" | "Growth" | "Mature";
export type MitigationFeed =
  | "Jerami padi/Rumput Lapang"
  | "Rumput Budidaya/Limbah Peternakan";
export type MitigationAction = "Konsentrat" | "Legumes" | "Silase";

export interface MitigationFactorSet {
  Konsentrat: number;
  Legumes: number;
  Silase: number;
}

export interface MitigationRow {
  category: MitigationCategory;
  factors: Record<MitigationFeed, MitigationFactorSet>;
}

export type MitigationTable = MitigationRow[];

export type Physiological =
  | "Weaning"
  | "Yearling"
  | "Adult male"
  | "Adult female";
export type Distro = Record<Physiological, number>;

export type ActivityMix = {
  ekstensif: number;
  semi: number;
  intensif: number;
};

export type ActivityDataRow = {
  provinceCode: string;
  provinceName: string;
  mix: ActivityMix;
  distro: {
    ekstensif: Distro;
    semi: Distro;
    intensif: Distro;
  };
};

export type ActivityData = ActivityDataRow[];

// --- Petugas submission types ---

export type MitigationInput = {
  action_id: string;
  coverage: number;
};

export type SubmissionRequest = {
  province_id: string;
  total_population: number;
  year: number;
  mitigations: MitigationInput[];
};

export type SubmissionResult = {
  summary: {
    baseline_GgCO2e: number;
    with_mitigation_GgCO2e: number;
    reduction_GgCO2e: number;
    reduction_percent: number;
  };
  by_gas_GgCO2e: {
    CH4: number;
    N2O: number;
    total: number;
  };
  manure_detail_GgCO2e: {
    N2O_direct: number;
    N2O_indirect: number;
    CH4: number;
    total: number;
  };
  enteric_detail: {
    CH4_ton: number;
    CH4_CO2e_ton: number;
    CH4_GgCO2e: number;
  };
};

export type SubmissionStatus =
  | "menunggu_verifikasi"
  | "dalam_verifikasi"
  | "disetujui"
  | "ditolak";

export type SubmissionStatusNote = {
  status: SubmissionStatus;
  note: string;
  updatedAt: string;
  updatedBy?: string | null;
};

export type SubmissionRecord = {
  id: string;
  province: string;
  year: number;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  result: SubmissionResult;
  notes?: SubmissionStatusNote[];
};
