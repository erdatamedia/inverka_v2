"use client";

import { useMemo, useSyncExternalStore } from "react";

import { submitEmissions } from "@/lib/api";
import { getActivityData } from "@/lib/activity-api";
import { getMitigation } from "@/lib/mitigation-api";
import { listSubmissions } from "@/lib/submissions-api";
import type {
  ActivityData,
  MitigationAction,
  MitigationFeed,
  MitigationTable,
  SubmissionRecord,
  SubmissionRequest,
  SubmissionResult,
} from "@/lib/types";

export type Step = 1 | 2 | 3;

type CategoryKey = string;

type MitigationOption = {
  id: string;
  feedKey: MitigationFeed;
  feedLabel: string;
  action: MitigationAction;
  actionLabel: string;
  factors: Record<CategoryKey, number>;
};

type MitigationPopulations = Record<CategoryKey, number>;

type FormMitigation = {
  feed: MitigationFeed | "";
  action: MitigationAction | "";
  populations: MitigationPopulations;
};

type InputState = {
  province_id: string;
  total_population: number;
  mitigations: FormMitigation[];
};

type DataState = {
  step: Step;
  loading: boolean;
  error?: string;
  year: number;
  input: InputState;
  result?: SubmissionResult;
  lastSubmission?: SubmissionRecord;
  activityData: ActivityData;
  activityLoading: boolean;
  activityError?: string;
  mitigationData: MitigationTable;
  mitigationOptions: MitigationOption[];
  mitigationFeeds: MitigationFeed[];
  mitigationCategories: CategoryKey[];
  mitigationLoading: boolean;
  mitigationError?: string;
  submissions: SubmissionRecord[];
  submissionsLoading: boolean;
  submissionsError?: string;
};

type Actions = {
  setInput: (payload: Partial<InputState>) => void;
  setProvince: (provinceId: string) => void;
  setYear: (year: number) => void;
  setMitigationFeed: (index: number, feed: MitigationFeed) => void;
  setMitigationAction: (index: number, action: MitigationAction) => void;
  setMitigationPopulation: (
    index: number,
    category: CategoryKey,
    value: number
  ) => void;
  addMitigation: () => void;
  removeMitigation: (index: number) => void;
  next: () => void;
  prev: () => void;
  setStep: (step: Step) => void;
  submit: () => Promise<void>;
  resetResult: () => void;
  loadActivityData: () => Promise<void>;
  loadMitigationData: () => Promise<void>;
  loadSubmissions: (year?: number) => Promise<void>;
};

type Store = DataState & Actions;

const listeners = new Set<() => void>();

const DEFAULT_CATEGORIES: CategoryKey[] = [
  "Pre weaning",
  "Young",
  "Growth",
  "Mature",
];

const FEED_LABELS: Record<MitigationFeed, string> = {
  "Jerami padi/Rumput Lapang": "Jerami padi / Rumput Lapang",
  "Rumput Budidaya/Limbah Peternakan": "Rumput Budidaya / Limbah Peternakan",
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const clampNonNegativeInt = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createPopulationMap = (categories: CategoryKey[]): MitigationPopulations =>
  categories.reduce<MitigationPopulations>((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {});

const createMitigationEntry = (
  categories: CategoryKey[],
  feed: MitigationFeed | "" = "",
  action: MitigationAction | "" = ""
): FormMitigation => ({
  feed,
  action,
  populations: createPopulationMap(categories),
});

const selectDefaultSelection = (
  options: MitigationOption[]
): { feed: MitigationFeed | ""; action: MitigationAction | "" } => {
  if (!options.length) return { feed: "", action: "" };
  const first = options[0];
  return { feed: first.feedKey, action: first.action };
};

const ensurePopulations = (
  populations: MitigationPopulations,
  categories: CategoryKey[]
): MitigationPopulations => {
  const next = createPopulationMap(categories);
  for (const category of categories) {
    const current = populations?.[category];
    next[category] = clampNonNegativeInt(
      typeof current === "number" ? current : 0
    );
  }
  return next;
};

const normalizeMitigations = (
  mitigations: FormMitigation[] | undefined,
  categories: CategoryKey[],
  options: MitigationOption[]
): FormMitigation[] => {
  const categoryList = categories.length ? categories : DEFAULT_CATEGORIES;
  const normalizedOptions = options;
  const defaults = selectDefaultSelection(normalizedOptions);

  const items =
    mitigations && mitigations.length
      ? mitigations
      : [createMitigationEntry(categoryList, defaults.feed, defaults.action)];

  return items.map((item) => {
    let feed = item.feed;
    if (
      feed &&
      !normalizedOptions.some((option) => option.feedKey === feed)
    ) {
      feed = defaults.feed;
    }

    const actionsForFeed = normalizedOptions.filter(
      (option) => option.feedKey === feed
    );
    let action = item.action;
    if (!actionsForFeed.some((option) => option.action === action)) {
      action = actionsForFeed[0]?.action ?? "";
    }

    return {
      feed,
      action,
      populations: ensurePopulations(item.populations ?? {}, categoryList),
    };
  });
};

const sumPopulations = (populations: MitigationPopulations) =>
  Object.values(populations).reduce((total, value) => total + value, 0);

const buildMitigationOptions = (rows: MitigationTable) => {
  if (!rows.length) {
    return {
      options: [] as MitigationOption[],
      feeds: [] as MitigationFeed[],
      categories: DEFAULT_CATEGORIES,
    };
  }

  const categories: CategoryKey[] = [];
  const optionMap = new Map<string, MitigationOption>();

  for (const row of rows) {
    const category = row.category;
    if (!categories.includes(category)) {
      categories.push(category);
    }

    for (const [feedKey, actions] of Object.entries(row.factors) as Array<
      [MitigationFeed, Record<MitigationAction, number>]
    >) {
      for (const [action, rawFactor] of Object.entries(actions) as Array<
        [MitigationAction, number]
      >) {
        const key = `${feedKey}__${action}`;
        if (!optionMap.has(key)) {
          optionMap.set(key, {
            id: `mitigation-${slugify(feedKey)}-${slugify(action)}`,
            feedKey,
            feedLabel: FEED_LABELS[feedKey] ?? feedKey,
            action,
            actionLabel: action,
            factors: {},
          });
        }
        optionMap.get(key)!.factors[category] = rawFactor;
      }
    }
  }

  const options = Array.from(optionMap.values()).sort((a, b) =>
    a.feedLabel === b.feedLabel
      ? a.actionLabel.localeCompare(b.actionLabel)
      : a.feedLabel.localeCompare(b.feedLabel)
  );

  const feeds = Array.from(
    new Set(options.map((option) => option.feedKey))
  ) as MitigationFeed[];

  return { options, feeds, categories };
};

const optionKey = (feed: MitigationFeed | "", action: MitigationAction | "") =>
  `${feed}__${action}`;

const buildMitigationActionId = (
  category: string,
  feed: MitigationFeed,
  action: MitigationAction
) => `mitigation-${slugify(category)}-${slugify(feed)}-${slugify(action)}`;

const findOption = (
  options: MitigationOption[],
  feed: MitigationFeed | "",
  action: MitigationAction | ""
) => options.find((option) => optionKey(option.feedKey, option.action) === optionKey(feed, action));

let dataState: DataState = {
  step: 1,
  loading: false,
  error: undefined,
  year: new Date().getFullYear(),
  input: {
    province_id: "",
    total_population: 0,
    mitigations: [createMitigationEntry(DEFAULT_CATEGORIES)],
  },
  result: undefined,
  lastSubmission: undefined,
  activityData: [],
  activityLoading: false,
  activityError: undefined,
  mitigationData: [],
  mitigationOptions: [],
  mitigationFeeds: [],
  mitigationCategories: DEFAULT_CATEGORIES,
  mitigationLoading: false,
  mitigationError: undefined,
  submissions: [],
  submissionsLoading: false,
  submissionsError: undefined,
};

const emit = () => {
  listeners.forEach((listener) => listener());
};

const setDataState = (updater: (state: DataState) => DataState) => {
  dataState = updater(dataState);
  emit();
};

const fetchSubmissions = async (year?: number) => {
  setDataState((state) => ({
    ...state,
    submissionsLoading: true,
    submissionsError: undefined,
  }));
  try {
    const data = await listSubmissions(year);
    const sorted = [...data].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const latest = sorted[0];

    setDataState((state) => ({
      ...state,
      submissions: sorted,
      submissionsLoading: false,
      submissionsError: undefined,
      lastSubmission: latest ?? state.lastSubmission,
      result: latest ? latest.result : state.result,
    }));
  } catch (error) {
    setDataState((state) => ({
      ...state,
      submissionsLoading: false,
      submissionsError:
        error instanceof Error ? error.message : "Gagal memuat pengajuan.",
    }));
  }
};

const actions: Actions = {
  setInput: (payload) => {
    setDataState((state) => {
      const mergedMitigations = normalizeMitigations(
        payload.mitigations ?? state.input.mitigations,
        state.mitigationCategories,
        state.mitigationOptions
      );
      return {
        ...state,
        input: {
          ...state.input,
          ...payload,
          mitigations: mergedMitigations,
        },
        error: undefined,
      };
    });
  },
  setProvince: (provinceId) => {
    setDataState((state) => {
      if (state.input.province_id === provinceId) {
        return state;
      }
      return {
        ...state,
        input: {
          ...state.input,
          province_id: provinceId,
        },
        step: 1,
        result: undefined,
        lastSubmission: undefined,
        error: undefined,
      };
    });
  },
  setYear: (year) => {
    setDataState((state) => ({
      ...state,
      year,
      result: undefined,
      lastSubmission: undefined,
      error: undefined,
    }));
    void fetchSubmissions(year);
  },
  setMitigationFeed: (index, feed) => {
    setDataState((state) => {
      const mitigations = [...state.input.mitigations];
      if (!mitigations[index]) return state;

      const actionsForFeed = state.mitigationOptions.filter(
        (option) => option.feedKey === feed
      );
      const nextAction =
        actionsForFeed.length > 0 ? actionsForFeed[0].action : "";

      mitigations[index] = {
        ...mitigations[index],
        feed,
        action: nextAction,
      };

      return {
        ...state,
        input: { ...state.input, mitigations },
        error: undefined,
      };
    });
  },
  setMitigationAction: (index, action) => {
    setDataState((state) => {
      const mitigations = [...state.input.mitigations];
      const current = mitigations[index];
      if (!current) return state;

      const valid = findOption(
        state.mitigationOptions,
        current.feed,
        action
      );
      if (!valid) return state;

      mitigations[index] = {
        ...current,
        action,
      };

      return {
        ...state,
        input: { ...state.input, mitigations },
        error: undefined,
      };
    });
  },
  setMitigationPopulation: (index, category, value) => {
    setDataState((state) => {
      const mitigations = [...state.input.mitigations];
      const current = mitigations[index];
      if (!current) return state;
      if (!current.populations.hasOwnProperty(category)) return state;

      mitigations[index] = {
        ...current,
        populations: {
          ...current.populations,
          [category]: clampNonNegativeInt(value),
        },
      };

      return {
        ...state,
        input: { ...state.input, mitigations },
        error: undefined,
      };
    });
  },
  addMitigation: () => {
    setDataState((state) => {
      const defaults = selectDefaultSelection(state.mitigationOptions);
      const entry = createMitigationEntry(
        state.mitigationCategories.length
          ? state.mitigationCategories
          : DEFAULT_CATEGORIES,
        defaults.feed,
        defaults.action
      );
      return {
        ...state,
        input: {
          ...state.input,
          mitigations: [...state.input.mitigations, entry],
        },
        error: undefined,
      };
    });
  },
  removeMitigation: (index) => {
    setDataState((state) => {
      const nextMitigations = state.input.mitigations.filter(
        (_, i) => i !== index
      );

      if (!nextMitigations.length) {
        const defaults = selectDefaultSelection(state.mitigationOptions);
        nextMitigations.push(
          createMitigationEntry(
            state.mitigationCategories.length
              ? state.mitigationCategories
              : DEFAULT_CATEGORIES,
            defaults.feed,
            defaults.action
          )
        );
      }

      return {
        ...state,
        input: { ...state.input, mitigations: nextMitigations },
        error: undefined,
      };
    });
  },
  next: () => {
    setDataState((state) => ({
      ...state,
      step: (state.step === 3 ? 3 : (state.step + 1)) as Step,
      error: undefined,
    }));
  },
  prev: () => {
    setDataState((state) => ({
      ...state,
      step: (state.step === 1 ? 1 : (state.step - 1)) as Step,
      error: undefined,
    }));
  },
  setStep: (step) => {
    setDataState((state) => ({ ...state, step, error: undefined }));
  },
  submit: async () => {
    const { province_id, total_population, mitigations } = dataState.input;
    const year = dataState.year;
    const options =
      dataState.mitigationOptions.length > 0
        ? dataState.mitigationOptions
        : [];

    if (!province_id) {
      setDataState((state) => ({
        ...state,
        error: "Pilih provinsi terlebih dahulu.",
      }));
      return;
    }
    if (!Number.isInteger(total_population) || total_population <= 0) {
      setDataState((state) => ({
        ...state,
        error: "Total populasi harus bilangan bulat ≥ 1.",
      }));
      return;
    }

    const optionMap = new Map(
      options.map((option) => [optionKey(option.feedKey, option.action), option])
    );

    const payloadMitigations: SubmissionRequest["mitigations"] = [];
    for (const entry of mitigations) {
      if (!entry.feed || !entry.action) {
        setDataState((state) => ({
          ...state,
          error: "Lengkapi pilihan pakan dan aksi mitigasi.",
        }));
        return;
      }
      const option = optionMap.get(optionKey(entry.feed, entry.action));
      if (!option) {
        setDataState((state) => ({
          ...state,
          error:
            "Aksi mitigasi tidak ditemukan. Periksa data master mitigasi.",
        }));
        return;
      }

      const totalMitigated = sumPopulations(entry.populations);
      if (totalMitigated <= 0) {
        setDataState((state) => ({
          ...state,
          error:
            "Masukkan populasi ternak yang menerima aksi mitigasi (minimal 1 ekor).",
        }));
        return;
      }

      for (const [category, amount] of Object.entries(
        entry.populations ?? {}
      )) {
        const numeric = typeof amount === "number" ? amount : 0;
        if (numeric <= 0) continue;
        const actionId = buildMitigationActionId(
          category,
          entry.feed,
          entry.action
        );
        payloadMitigations.push({
          action_id: actionId,
          coverage: clamp01(numeric / total_population),
        });
      }
    }

    if (!payloadMitigations.length) {
      setDataState((state) => ({
        ...state,
        error: "Tambahkan minimal satu aksi mitigasi.",
      }));
      return;
    }

    setDataState((state) => ({ ...state, loading: true, error: undefined }));
    try {
      const submission = await submitEmissions({
        province_id,
        total_population,
        year,
        mitigations: payloadMitigations,
      });
      setDataState((state) => ({
        ...state,
        result: submission.result,
        lastSubmission: submission,
        submissions: [
          submission,
          ...state.submissions.filter((item) => item.id !== submission.id),
        ],
        step: 3,
        loading: false,
      }));
      void fetchSubmissions(year);
    } catch (error) {
      setDataState((state) => ({
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal menghitung emisi. Coba lagi.",
      }));
    }
  },
  resetResult: () => {
    setDataState((state) => ({
      ...state,
      result: undefined,
      step: 1,
      error: undefined,
    }));
  },
  loadActivityData: async () => {
    if (dataState.activityLoading) return;
    setDataState((state) => ({
      ...state,
      activityLoading: true,
      activityError: undefined,
    }));
    try {
      const rows = await getActivityData();
      setDataState((state) => {
        const mitigations = normalizeMitigations(
          state.input.mitigations,
          state.mitigationCategories,
          state.mitigationOptions
        );
        return {
          ...state,
          activityData: rows,
          activityLoading: false,
          activityError: undefined,
          input: {
            ...state.input,
            mitigations,
          },
        };
      });
    } catch (error) {
      setDataState((state) => ({
        ...state,
        activityLoading: false,
        activityError:
          error instanceof Error
            ? error.message
            : "Gagal memuat activity data.",
      }));
    }
  },
  loadMitigationData: async () => {
    if (dataState.mitigationLoading) return;
    setDataState((state) => ({
      ...state,
      mitigationLoading: true,
      mitigationError: undefined,
    }));
    try {
      const rows = await getMitigation();
      setDataState((state) => {
        const { options, feeds, categories } = buildMitigationOptions(rows);
        const mitigations = normalizeMitigations(
          state.input.mitigations,
          categories,
          options
        );
        return {
          ...state,
          mitigationData: rows,
          mitigationOptions: options,
          mitigationFeeds: feeds,
          mitigationCategories: categories.length ? categories : DEFAULT_CATEGORIES,
          mitigationLoading: false,
          mitigationError: undefined,
          input: {
            ...state.input,
            mitigations,
          },
        };
      });
    } catch (error) {
      setDataState((state) => ({
        ...state,
        mitigationLoading: false,
        mitigationError:
          error instanceof Error
            ? error.message
            : "Gagal memuat data mitigasi.",
      }));
    }
  },
  loadSubmissions: async (year) => {
    const targetYear = year ?? dataState.year;
    await fetchSubmissions(targetYear);
  },
};

const getSnapshot = () => dataState;
const getServerSnapshot = () => dataState;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

function usePetugasStore(): DataState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function usePetugas<T>(selector: (store: Store) => T): T {
  const state = usePetugasStore();
  const store = useMemo(() => ({ ...state, ...actions }), [state]);
  return selector(store);
}
