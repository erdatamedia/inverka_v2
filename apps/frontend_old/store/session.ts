"use client";
import { create } from "zustand";
import { UserSession } from "@/lib/auth";

type S = {
  token?: string;
  user?: UserSession;
  set(s: Partial<S>): void;
  clear(): void;
};
export const useSession = create<S>((set) => ({
  token: undefined,
  user: undefined,
  set: (s) => set(s),
  clear: () => set({ token: undefined, user: undefined }),
}));
