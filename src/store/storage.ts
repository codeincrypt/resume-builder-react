import type { WebStorage } from "redux-persist/lib/types";

/**
 * localStorage adapter for redux-persist.
 *
 * `redux-persist/lib/storage` is CommonJS and its `default` export does not
 * survive Vite's ESM interop — the import yields the module namespace, so
 * `storage.getItem` is undefined and rehydration throws before the first
 * render. Implementing the (three-method) interface directly avoids the
 * interop entirely.
 *
 * Every method resolves rather than rejects: a browser with storage disabled
 * should cost the user persistence, not the whole app.
 */
const storage: WebStorage = {
  getItem(key) {
    try {
      return Promise.resolve(window.localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or storage blocked — drop the write.
    }
    return Promise.resolve();
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // As above.
    }
    return Promise.resolve();
  },
};

export default storage;
