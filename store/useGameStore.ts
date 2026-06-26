"use client";

import { create } from "zustand";
import { ITerm } from "@/models/Term";

interface GameConfig {
  includeMaxStatus: boolean;
  showTimer: boolean;
  termCount: number;
  swapSides: boolean;
}

interface GameState {
  config: GameConfig;
  terms: ITerm[];
  currentIndex: number;
  results: { termId: string; correct: boolean | null }[];
  startTime: number | null;
  setConfig: (config: Partial<GameConfig>) => void;
  setTerms: (terms: ITerm[]) => void;
  nextTerm: (correct: boolean | null) => void;
  reset: () => void;
}

const defaultConfig: GameConfig = {
  includeMaxStatus: true,
  showTimer: true,
  termCount: Infinity,
  swapSides: false,
};

export const useGameStore = create<GameState>((set) => ({
  config: defaultConfig,
  terms: [],
  currentIndex: 0,
  results: [],
  startTime: null,

  setConfig: (config) =>
    set((state) => ({ config: { ...state.config, ...config } })),

  setTerms: (terms) =>
    set({ terms, currentIndex: 0, results: [], startTime: Date.now() }),

  nextTerm: (correct) =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      results: [
        ...state.results,
        { termId: String(state.terms[state.currentIndex]?._id), correct },
      ],
    })),

  reset: () =>
    set({ terms: [], currentIndex: 0, results: [], startTime: null, config: defaultConfig }),
}));
