import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type { DocumentData, Timestamp } from "firebase/firestore";

import { DEFAULT_TEMPLATE_ID, isTemplateId } from "../resume/registry";
import type {
  DesignSettings,
  OriginalFile,
  ResumeContent,
  ResumeDoc,
  ResumeSource,
  SectionConfig,
} from "../types/resume";
import {
  DEFAULT_DESIGN,
  newId,
  normalizeContent,
  normalizeDesign,
  normalizeSections,
} from "../types/resume";
import type { AuthUser } from "../types/user";
import { sanitizeDoc } from "../utils/sanitize";
import { db, isStorageConfigured } from "./firebase";
import { deleteAllUploads, deleteOriginal } from "./storage";

/**
 * Every Firestore call lives here. Documents are keyed by id:
 *
 *   users/{uid}                  profile
 *   users/{uid}/resumes/{id}     one document per resume
 *
 * Nesting resumes under the owner's uid is what makes the security rules
 * trivial and strict — `request.auth.uid == uid` — instead of relying on an
 * `ownerId` field that a query could forget to filter on.
 */

/**
 * Firestore retries an unreachable backend indefinitely, which would strand
 * the UI on a spinner forever. Cap reads so the caller can show an error.
 */
const TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out — check your connection.`)),
      TIMEOUT_MS,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const resumesPath = (uid: string) => collection(db, "users", uid, "resumes");
const resumeRef = (uid: string, id: string) => doc(db, "users", uid, "resumes", id);

function iso(value: unknown, fallback: string): string {
  const date = (value as Timestamp | null | undefined)?.toDate?.();
  return date ? date.toISOString() : fallback;
}

function fromData(id: string, data: DocumentData): ResumeDoc {
  const now = new Date().toISOString();
  const content = normalizeContent(data.content);
  const file = data.originalFile as Partial<OriginalFile> | null | undefined;

  return {
    id,
    title: typeof data.title === "string" && data.title ? data.title : "Untitled resume",
    templateId: isTemplateId(data.templateId) ? data.templateId : DEFAULT_TEMPLATE_ID,
    content,
    design: normalizeDesign(data.design),
    sections: normalizeSections(data.sections, content.custom),
    source: data.source === "upload" ? "upload" : "scratch",
    originalFile:
      file && typeof file.path === "string"
        ? {
            path: file.path,
            name: String(file.name ?? "resume"),
            size: Number(file.size ?? 0),
            type: String(file.type ?? ""),
          }
        : null,
    createdAt: iso(data.createdAt, now),
    updatedAt: iso(data.updatedAt, now),
  };
}

export async function listResumes(uid: string): Promise<ResumeDoc[]> {
  const snapshot = await withTimeout(
    getDocs(query(resumesPath(uid), orderBy("updatedAt", "desc"))),
    "Loading your resumes",
  );
  return snapshot.docs.map((d) => fromData(d.id, d.data({ serverTimestamps: "estimate" })));
}

export async function fetchResume(uid: string, id: string): Promise<ResumeDoc | null> {
  const snapshot = await withTimeout(
    getDoc(resumeRef(uid, id)),
    "Loading your resume",
  );
  return snapshot.exists()
    ? fromData(snapshot.id, snapshot.data({ serverTimestamps: "estimate" }))
    : null;
}

export interface NewResume {
  id?: string;
  title: string;
  templateId: string;
  content: ResumeContent;
  design?: DesignSettings;
  sections?: SectionConfig[];
  source?: ResumeSource;
  originalFile?: OriginalFile | null;
}

export async function createResume(uid: string, input: NewResume): Promise<ResumeDoc> {
  const now = new Date().toISOString();
  const content = normalizeContent(input.content);
  const draft: ResumeDoc = sanitizeDoc({
    id: input.id ?? newId(),
    title: input.title,
    templateId: input.templateId,
    content,
    design: input.design ?? { ...DEFAULT_DESIGN },
    sections: normalizeSections(input.sections ?? null, content.custom),
    source: input.source ?? "scratch",
    originalFile: input.originalFile ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await withTimeout(
    setDoc(resumeRef(uid, draft.id), {
      title: draft.title,
      templateId: draft.templateId,
      content: draft.content,
      design: draft.design,
      sections: draft.sections,
      source: draft.source,
      originalFile: draft.originalFile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    "Creating your resume",
  );
  return draft;
}

/** Persist edits. Returns the sanitised document that was actually written. */
export async function saveResume(uid: string, resume: ResumeDoc): Promise<ResumeDoc> {
  const clean = sanitizeDoc(resume);
  await withTimeout(
    updateDoc(resumeRef(uid, clean.id), {
      title: clean.title,
      templateId: clean.templateId,
      content: clean.content,
      design: clean.design,
      sections: clean.sections,
      originalFile: clean.originalFile,
      updatedAt: serverTimestamp(),
    }),
    "Saving your resume",
  );
  return { ...clean, updatedAt: new Date().toISOString() };
}

export async function renameResume(uid: string, id: string, title: string): Promise<string> {
  const next = title.trim().slice(0, 120) || "Untitled resume";
  await withTimeout(
    updateDoc(resumeRef(uid, id), { title: next, updatedAt: serverTimestamp() }),
    "Renaming",
  );
  return next;
}

export async function duplicateResume(uid: string, source: ResumeDoc): Promise<ResumeDoc> {
  return createResume(uid, {
    title: `Copy of ${source.title}`.slice(0, 120),
    templateId: source.templateId,
    content: source.content,
    design: source.design,
    // The original file stays with the resume it was uploaded for, so deleting
    // one resume can never remove another's source file.
    source: source.source,
    originalFile: null,
  });
}

export async function deleteResume(uid: string, resume: ResumeDoc): Promise<void> {
  if (resume.originalFile && isStorageConfigured) await deleteOriginal(resume.originalFile.path);
  await withTimeout(deleteDoc(resumeRef(uid, resume.id)), "Deleting");
}

/* ----------------------------------------------------------------- profile */

/** Record the user's profile document on sign-in (create-or-update). */
export async function upsertProfile(user: AuthUser): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const existing = await withTimeout(getDoc(ref), "Signing you in");
  await setDoc(
    ref,
    {
      displayName: user.displayName,
      email: user.email,
      provider: user.provider,
      lastLoginAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}

/**
 * Erase everything we hold for a user: resumes, uploaded files and profile.
 * The Auth account itself is removed separately (it needs a fresh sign-in).
 */
export async function deleteAllUserData(uid: string): Promise<void> {
  // Listing an empty prefix returns nothing rather than throwing, so a user
  // who never uploaded passes straight through.
  if (isStorageConfigured) await deleteAllUploads(uid);

  const snapshot = await getDocs(resumesPath(uid));
  // Batches are capped at 500 writes; chunk to stay clear of it.
  for (let i = 0; i < snapshot.docs.length; i += 400) {
    const batch = writeBatch(db);
    snapshot.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, "users", uid));
}
