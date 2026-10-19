// Copy tesseract.js's worker and WASM core into public/ocr so OCR can run
// without fetching code from a CDN. Pair with VITE_OCR_ASSET_PATH=/ocr and
// download eng.traineddata.gz into the same folder (see README).
import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const target = join(process.cwd(), "public", "ocr");
mkdirSync(target, { recursive: true });

const workerDir = join(dirname(require.resolve("tesseract.js/package.json")), "dist");
cpSync(join(workerDir, "worker.min.js"), join(target, "worker.min.js"));

const coreDir = dirname(require.resolve("tesseract.js-core/package.json"));
for (const file of readdirSync(coreDir)) {
  if (/^tesseract-core.*\.(js|wasm)$/.test(file)) {
    cpSync(join(coreDir, file), join(target, file));
  }
}
console.log(`OCR assets copied to ${target}`);
