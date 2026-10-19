import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Missing env vars make Firebase fail at call time with an opaque error, so
 * surface the real cause once at startup instead.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

/**
 * Cloud Storage is optional: it only backs "keep my original file". Without a
 * bucket the upload flow still parses and imports; it just cannot retain the
 * source file, and the option is hidden.
 */
export const isStorageConfigured = Boolean(firebaseConfig.storageBucket);

if (!isFirebaseConfigured) {
  console.warn(
    "[capitalcv] Firebase is not configured. Copy .env.example to .env and " +
      "fill in the VITE_FIREBASE_* values — sign-in and saving will fail " +
      "until you do.",
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Local cache means edits survive a reload or a dropped connection and sync
// when the network returns; multi-tab keeps two open tabs coherent.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const storage = getStorage(app);

/**
 * `VITE_USE_FIREBASE_EMULATORS=true` points every service at the local
 * Firebase Emulator Suite (see `npm run emulators`), so the whole app can be
 * exercised with no cloud project and no credentials.
 */
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  const host = "127.0.0.1";
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
}
