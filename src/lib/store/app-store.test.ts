import { beforeEach, describe, expect, test } from "bun:test";
import { useAppStore } from "./app-store";

const DEFAULT_STATE = {
  watchlist: ["AAPL", "MSFT", "NVDA"],
  selectedSymbol: "AAPL",
  dataMode: "MOCK" as const,
};

beforeEach(() => {
  // No `replace: true` - that replaces the *entire* state object,
  // including the action functions (addSymbol, removeSymbol, ...), since
  // they live on the same Zustand state object as the data fields. A
  // shallow merge resets just the data, keeping the actions intact.
  useAppStore.setState(DEFAULT_STATE);
});

describe("useAppStore", () => {
  test("addSymbol uppercases, trims, and appends", () => {
    const added = useAppStore.getState().addSymbol(" googl ");
    expect(added).toBe(true);
    expect(useAppStore.getState().watchlist).toEqual(["AAPL", "MSFT", "NVDA", "GOOGL"]);
  });

  test("addSymbol rejects a duplicate and returns false without mutating the list", () => {
    const added = useAppStore.getState().addSymbol("AAPL");
    expect(added).toBe(false);
    expect(useAppStore.getState().watchlist).toEqual(DEFAULT_STATE.watchlist);
  });

  test("addSymbol treats a different-case duplicate as the same symbol", () => {
    const added = useAppStore.getState().addSymbol("aapl");
    expect(added).toBe(false);
  });

  test("removeSymbol removes the symbol and clears selection if it was selected", () => {
    useAppStore.getState().removeSymbol("AAPL");
    const state = useAppStore.getState();
    expect(state.watchlist).toEqual(["MSFT", "NVDA"]);
    expect(state.selectedSymbol).toBeNull();
  });

  test("removeSymbol leaves selection alone if a different symbol was removed", () => {
    useAppStore.getState().removeSymbol("MSFT");
    const state = useAppStore.getState();
    expect(state.watchlist).toEqual(["AAPL", "NVDA"]);
    expect(state.selectedSymbol).toBe("AAPL");
  });

  test("selectSymbol updates the selected symbol", () => {
    useAppStore.getState().selectSymbol("NVDA");
    expect(useAppStore.getState().selectedSymbol).toBe("NVDA");
  });

  test("setDataMode toggles between MOCK and REAL", () => {
    useAppStore.getState().setDataMode("REAL");
    expect(useAppStore.getState().dataMode).toBe("REAL");
  });

  test("resetWatchlist restores the default watchlist and selection", () => {
    useAppStore.getState().addSymbol("TSLA");
    useAppStore.getState().removeSymbol("AAPL");
    useAppStore.getState().resetWatchlist();

    const state = useAppStore.getState();
    expect(state.watchlist).toEqual(["AAPL", "MSFT", "NVDA"]);
    expect(state.selectedSymbol).toBe("AAPL");
  });
});
