/**
 * Upload validation. The extension, the declared MIME type and the file's
 * actual leading bytes must all agree — a `.pdf` that does not start with
 * `%PDF` is rejected, whatever the browser claims it is.
 */

export type FileKind = "pdf" | "docx" | "txt";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ACCEPT_ATTR =
  ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

const MIME: Record<FileKind, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  // Browsers report .txt inconsistently; empty is common.
  txt: ["text/plain", ""],
};

export type FileCheck =
  | { ok: true; kind: FileKind }
  | { ok: false; message: string };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

async function head(file: File, length: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, length).arrayBuffer());
}

export async function validateFile(file: File): Promise<FileCheck> {
  const ext = extensionOf(file.name);

  if (ext === "doc") {
    return {
      ok: false,
      message:
        "Old .doc files aren't supported. Open it in Word and use Save As → .docx (or PDF), then upload that.",
    };
  }
  if (ext !== "pdf" && ext !== "docx" && ext !== "txt") {
    return {
      ok: false,
      message: "That file type isn't supported. Upload a PDF, DOCX or TXT file.",
    };
  }
  if (file.size === 0) {
    return { ok: false, message: "That file is empty." };
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return {
      ok: false,
      message: `That file is ${mb} MB. The limit is ${MAX_FILE_BYTES / 1024 / 1024} MB.`,
    };
  }
  if (!MIME[ext].includes(file.type)) {
    return {
      ok: false,
      message: `This file says it is "${file.type}", which doesn't match a .${ext} file.`,
    };
  }

  const bytes = await head(file, 4096);
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...bytes.slice(from, to));

  if (ext === "pdf" && !ascii(0, 5).startsWith("%PDF")) {
    return { ok: false, message: "This doesn't look like a valid PDF file." };
  }
  if (ext === "docx" && !(bytes[0] === 0x50 && bytes[1] === 0x4b)) {
    return { ok: false, message: "This doesn't look like a valid DOCX file." };
  }
  if (ext === "txt" && bytes.includes(0)) {
    return { ok: false, message: "This doesn't look like a plain-text file." };
  }

  return { ok: true, kind: ext };
}
