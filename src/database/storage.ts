import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import type { OriginalFile } from "../types/resume";
import { storage } from "./firebase";

/** Strip anything that could escape the object path or confuse a URL. */
function safeName(name: string): string {
  const cleaned = name
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/^\.+/, "");
  return (cleaned || "resume").slice(0, 120);
}

/** Browsers report .txt inconsistently (often ""), and the Storage rules only
 *  accept the three types we parse — so declare the type from the extension. */
function contentTypeFor(file: File): string {
  const ext = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "text/plain";
}

/**
 * Keep the user's original upload. The path embeds the uid, and the Storage
 * rules only let that uid read or write beneath it.
 */
export async function uploadOriginal(
  uid: string,
  resumeId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<OriginalFile> {
  const path = `users/${uid}/uploads/${resumeId}/${safeName(file.name)}`;
  const task = uploadBytesResumable(ref(storage, path), file, {
    contentType: contentTypeFor(file),
  });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) =>
        onProgress?.(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        ),
      reject,
      () => resolve(),
    );
  });

  return { name: file.name, size: file.size, type: contentTypeFor(file), path };
}

export function getOriginalUrl(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path));
}

export async function deleteOriginal(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    // Already gone is the outcome we wanted.
    if ((error as { code?: string }).code !== "storage/object-not-found") {
      throw error;
    }
  }
}

/** Remove every file a user has ever uploaded (account deletion). */
export async function deleteAllUploads(uid: string): Promise<void> {
  const walk = async (prefix: ReturnType<typeof ref>): Promise<void> => {
    const { items, prefixes } = await listAll(prefix);
    await Promise.all(items.map((item) => deleteObject(item)));
    await Promise.all(prefixes.map(walk));
  };
  await walk(ref(storage, `users/${uid}/uploads`));
}
