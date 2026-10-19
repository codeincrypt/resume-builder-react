import { useCallback, useEffect, useRef, useState } from "react";
import { createNextState } from "@reduxjs/toolkit";

import { fetchResume, saveResume } from "../database/request";
import { useAppDispatch } from "../store/hooks";
import { upsertLocal } from "../store/slices/resumeSlice";
import type { ResumeDoc } from "../types/resume";

export type LoadStatus = "loading" | "ready" | "notfound" | "error";
export type SaveStatus = "saved" | "dirty" | "saving" | "error";

const AUTOSAVE_MS = 1200;

/**
 * Load one résumé and edit it in memory, saving behind the scenes.
 *
 * Edits are applied immutably (Immer) so the live preview re-renders from a
 * fresh object each time. Saves are debounced; a failed save keeps the draft
 * and retries on the next edit or via `saveNow`, so a flaky connection never
 * discards typing.
 */
export function useResumeEditor(uid: string, id: string) {
  const dispatch = useAppDispatch();
  const [doc, setDoc] = useState<ResumeDoc | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const latest = useRef<ResumeDoc | null>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchResume(uid, id)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setStatus("notfound");
          return;
        }
        latest.current = loaded;
        setDoc(loaded);
        setSavedAt(loaded.updatedAt);
        setStatus("ready");
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setLoadError(error.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [uid, id]);

  const persist = useCallback(async () => {
    // Serialise saves: a second one waits for the first rather than racing it.
    if (inFlight.current) await inFlight.current;
    const snapshot = latest.current;
    if (!snapshot || !dirty.current) return;

    dirty.current = false;
    setSaveStatus("saving");
    const run = saveResume(uid, snapshot)
      .then((saved) => {
        setSaveError(null);
        setSavedAt(saved.updatedAt);
        // Only claim "saved" if nothing changed while the write was in flight.
        setSaveStatus(dirty.current ? "dirty" : "saved");
        dispatch(upsertLocal({ ...snapshot, updatedAt: saved.updatedAt }));
      })
      .catch((error: Error) => {
        dirty.current = true;
        setSaveError(error.message);
        setSaveStatus("error");
      })
      .finally(() => {
        inFlight.current = null;
      });
    inFlight.current = run;
    await run;
  }, [uid, dispatch]);

  const schedule = useCallback(() => {
    dirty.current = true;
    setSaveStatus((s) => (s === "saving" ? s : "dirty"));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), AUTOSAVE_MS);
  }, [persist]);

  /** Apply a change to the draft. */
  const edit = useCallback(
    (recipe: (draft: ResumeDoc) => void) => {
      const current = latest.current;
      if (!current) return;
      const next = createNextState(current, recipe);
      latest.current = next;
      setDoc(next);
      schedule();
    },
    [schedule],
  );

  const saveNow = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current && saveStatus !== "error") return;
    dirty.current = true;
    await persist();
  }, [persist, saveStatus]);

  // Flush pending edits on leaving the page or closing the tab.
  useEffect(() => {
    const flush = () => {
      if (dirty.current) void persist();
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current || inFlight.current) {
        flush();
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      clearTimeout(timer.current);
      flush();
    };
  }, [persist]);

  return { doc, status, loadError, saveStatus, saveError, savedAt, edit, saveNow };
}
