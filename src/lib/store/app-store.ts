"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DataMode = "MOCK" | "REAL";

type AppState = {
  watchlist: string[];
  selectedSymbol: string | null;
  dataMode: DataMode;
  addSymbol: (symbol: string) => boolean; // false = duplicate, guard hit
  removeSymbol: (symbol: string) => void;
  selectSymbol: (symbol: string) => void;
  setDataMode: (mode: DataMode) => void;
  resetWatchlist: () => void;
};

const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "NVDA"];

// Global state + persistence unified via Zustand's `persist` middleware —
// the watchlist array and selected ticker sync to localStorage automatically.
// One mechanism covers both "shared global state" and "survives a refresh,"
// no hand-rolled sync layer needed.
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      watchlist: DEFAULT_WATCHLIST,
      selectedSymbol: "AAPL",
      // Defaults to MOCK — real API mode is an explicit opt-in toggle so the
      // very limited real quota is never burned by accident.
      dataMode: "MOCK",

      addSymbol: (symbol: string) => {
        const clean = symbol.trim().toUpperCase();
        if (get().watchlist.includes(clean)) return false; // duplicate guard
        set((state) => ({ watchlist: [...state.watchlist, clean] }));
        return true;
      },

      removeSymbol: (symbol: string) => {
        set((state) => ({
          watchlist: state.watchlist.filter((s) => s !== symbol),
          selectedSymbol: state.selectedSymbol === symbol ? null : state.selectedSymbol,
        }));
      },

      selectSymbol: (symbol: string) => set({ selectedSymbol: symbol }),

      setDataMode: (mode: DataMode) => set({ dataMode: mode }),

      resetWatchlist: () =>
        set({ watchlist: [...DEFAULT_WATCHLIST], selectedSymbol: DEFAULT_WATCHLIST[0] }),
    }),
    { name: "tradeview-lite-store" }
  )
);
