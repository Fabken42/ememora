"use client";

import { create } from "zustand";
import type { Genre } from "@/models/StudyList.types";

type SortOrder = "newest" | "oldest";
type TermSort = "default" | "reverse" | "status_asc" | "status_desc";

interface FilterState {
  dashboardSort: SortOrder;
  dashboardGenres: Genre[];
  termSort: TermSort;
  setDashboardSort: (sort: SortOrder) => void;
  setDashboardGenres: (genres: Genre[]) => void;
  setTermSort: (sort: TermSort) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  dashboardSort: "newest",
  dashboardGenres: [],
  termSort: "default",
  setDashboardSort: (dashboardSort) => set({ dashboardSort }),
  setDashboardGenres: (dashboardGenres) => set({ dashboardGenres }),
  setTermSort: (termSort) => set({ termSort }),
}));
