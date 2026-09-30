// Preloaded before every bun test file (see bunfig.toml). Zustand's persist
// middleware assumes a browser environment (localStorage) - app-store.ts
// would throw on import in a plain Node/Bun test environment without this.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

if (typeof globalThis.localStorage === "undefined") {
  // @ts-expect-error - minimal polyfill, not a full Storage implementation
  globalThis.localStorage = new MemoryStorage();
}

// zustand's persist middleware defaults to `window.localStorage`, not the
// bare global - and there's no `window` at all in Bun's test environment.
if (typeof (globalThis as { window?: unknown }).window === "undefined") {
  // @ts-expect-error - minimal polyfill, only what persist middleware needs
  globalThis.window = { localStorage: globalThis.localStorage };
}

