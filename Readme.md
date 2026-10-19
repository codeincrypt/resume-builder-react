# CapitalCV

A resume builder. Sign in with Google or email. Upload an existing resume, or start
from scratch. Review what was extracted, pick one of 25 capital-city templates,
customise it with a live multi-page preview, and download a PDF.

Upload parsing is **rule-based and runs in the browser**. It uses PDF/DOCX/TXT text
extraction, OCR for scanned PDFs, and pattern matching. No AI or LLM is involved.

## Features

- **Accounts.** Google sign-in, plus email/password with email verification and password reset. Users can change their password, export their data and delete their account.
- **Dashboard.** Recent and all resumes, with search, sort and filter. Rename, duplicate and delete (with confirmation), continue editing or download a PDF. Includes the template gallery and empty states for new users.
- **Upload and prefill.** PDF, DOCX and TXT up to 10 MB, with progress and retry.
  - Scanned PDFs are read with OCR.
  - A review screen highlights missing or uncertain fields and shows the raw extracted text.
  - The user can optionally keep the original file.
- **25 templates.** Each is named for a capital and built from its own combination of layout, header, heading, entry and skill styles, typography and palette. Filters: Professional, Modern, Minimal, Creative, Executive, Academic and ATS-Friendly.
- **Editor.** Edit every section: personal info, summary, experience, education, skills, projects, certifications, languages, awards, volunteer work and custom sections.
  - Add, delete and reorder entries and bullet points. Reorder or hide sections, and force page breaks.
  - Design controls: font, font size, accent colour, spacing, margins, A4 or US Letter, and ATS mode.
  - Autosave.
- **Live preview.** Zoom, page boundaries, page count, full-screen mode and instant template switching. On mobile, the editor switches between Edit and Preview.
- **PDF export.** Pixel-matched to the preview, multi-page with no clipped blocks, with selectable and searchable text. There is also a print option that produces vector output.

## Tech stack

| Concern        | Choice                                                         |
| -------------- | -------------------------------------------------------------- |
| Build          | Vite 8 + TypeScript 5.9 (strict)                               |
| UI             | React 19, Ant Design 6                                         |
| State          | Redux Toolkit (+ redux-persist for UI preferences only)        |
| Routing        | React Router 7                                                 |
| Auth           | Firebase Authentication (Google + email/password)             |
| Data / files   | Cloud Firestore, Cloud Storage (optional)                      |
| Parsing        | pdf.js, mammoth (DOCX), tesseract.js (OCR) — all lazy-loaded   |
| PDF export     | html2canvas-pro + jsPDF (lazy-loaded)                          |
| Fonts          | Fontsource (self-hosted variable fonts)                        |

## Getting started

Requires Node 20.19+ or 22.12+.

```bash
npm install
cp .env.example .env   # fill in your Firebase web config (below)
npm run dev            # http://localhost:3000
```

Other scripts:

```bash
npm run build      # typecheck + production build -> build/
npm run preview    # serve the production build
npm run lint
npm run typecheck
npm test           # resume-parser tests (node:test)
npm run emulators  # local Auth/Firestore/Storage emulators (needs firebase-tools)
```

### Run locally with no cloud project

Use the Firebase Emulator Suite. Install `firebase-tools` globally
(`npm i -g firebase-tools`). Recent versions need Java 21+; on Java 17 use
`npm i -g firebase-tools@13`. Then:

```bash
npm run emulators
# in another terminal:
VITE_USE_FIREBASE_EMULATORS=true VITE_FIREBASE_API_KEY=demo \
VITE_FIREBASE_PROJECT_ID=demo-capitalcv VITE_FIREBASE_AUTH_DOMAIN=localhost \
VITE_FIREBASE_STORAGE_BUCKET=demo-capitalcv.appspot.com npm run dev
```

The emulators enforce the same rules as production. They don't send email: the
verification and password-reset links are printed in the emulator log. You can
also list them at
`http://127.0.0.1:9099/emulator/v1/projects/demo-capitalcv/oobCodes`.

## Firebase setup

1. **Create a project** at <https://console.firebase.google.com>. Add a *Web app*
   and copy its config into `.env`. These `VITE_FIREBASE_*` values are public by
   design. Never put server secrets in a `VITE_` variable: they ship to the browser.
2. **Authentication → Sign-in method.** Enable:
   - **Email/Password.**
   - **Google.** Choose a support email. Firebase creates the Google OAuth client
     for you, so no separate client ID is needed.
3. **Authentication → Settings → Authorized domains.** Add every domain you serve
   from, e.g. `your-site.netlify.app`. `localhost` is there by default.
4. **(Recommended) Authentication → Templates.** Customise the verification and
   reset emails. Set the action URL domain to your site.
5. **Firestore Database.** Create it in production mode.
6. **Storage (optional).** Needed only for "Keep a copy of my original file".
   New buckets require the Blaze plan. Without `VITE_FIREBASE_STORAGE_BUCKET` the
   option is hidden and everything else works.
7. **Deploy the security rules.** This step is required: the rules are the access
   control.

   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add          # pick your project (replaces demo-capitalcv in .firebaserc)
   firebase deploy --only firestore:rules,storage
   ```

### Data model and access control

```
users/{uid}                      profile (name, email, provider, timestamps)
users/{uid}/resumes/{resumeId}   one document per resume
Storage: users/{uid}/uploads/{resumeId}/{file}   kept originals only
```

[firestore.rules](firestore.rules) only lets the signed-in owner (`request.auth.uid
== uid`) with a **verified email** read or write under their own `users/{uid}`. It
also validates the shape and size of every resume. [storage.rules](storage.rules)
does the same for files, and only accepts PDF, DOCX or TXT under 10 MB. Nothing
crosses users, so no rule allows it.

## Deployment

The app is a static SPA. Run `npm run build` and serve `build/`. Every
client-side route must fall back to `index.html`. Both hosts below are already
configured for that, for long-term caching of fingerprinted assets, and for
basic security headers (`nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`,
`Permissions-Policy`).

- **Netlify.** [netlify.toml](netlify.toml) sets the build command
  (`npm run build`), publish directory (`build`) and Node 22 — Netlify's
  default of Node 18 for older sites can't run Vite 8.
  [public/_redirects](public/_redirects) and [public/_headers](public/_headers)
  ship with the build.
- **Firebase Hosting.** The `hosting` block in [firebase.json](firebase.json)
  serves `build/`, so you only need `npm run build && firebase deploy --only hosting`.

Set the `VITE_*` variables in the host's build environment. Then add the deployed
domain to Firebase Auth → Authorized domains.

A Content-Security-Policy isn't set by default. Google sign-in, Firestore,
Storage and (unless self-hosted) the OCR CDN each need explicit allowances,
and a wrong policy silently breaks sign-in. If you add one, start from
`default-src 'self'` and allow:

- `connect-src https://*.googleapis.com https://*.firebaseio.com`
- `frame-src https://*.firebaseapp.com https://accounts.google.com`
- `script-src 'self' 'wasm-unsafe-eval' https://apis.google.com`
- `style-src 'self' 'unsafe-inline'` (Ant Design injects styles)
- `img-src 'self' data: blob: https:`
- `worker-src 'self' blob:`
- `cdn.jsdelivr.net`, if OCR assets aren't self-hosted

Test sign-in on a preview deploy before going live.

## File processing

All parsing happens in the browser ([src/parsing](src/parsing)):

| Format | Library      | Notes                                                         |
| ------ | ------------ | ------------------------------------------------------------- |
| PDF    | pdf.js       | Text layer rebuilt into lines in reading order (multi-column aware). Up to 15 pages. |
| Scan   | tesseract.js | Used automatically when a PDF has no text layer.               |
| DOCX   | mammoth      | Keeps bullets and table rows. Text boxes aren't extracted; save as PDF instead. |
| TXT    | —            | UTF-8.                                                         |

Files are validated by extension, MIME type **and** leading bytes (`%PDF`, ZIP
header, no NULs in text), and must be at most 10 MB. Legacy `.doc` files are
rejected with a hint to save as `.docx`.

The parser ([parseResume.ts](src/parsing/parseResume.ts),
[patterns.ts](src/parsing/patterns.ts)) works as follows:

- It finds section headings from a vocabulary, then contact details by pattern, then entries anchored on date ranges.
- It tells titles from companies from places using word lists.
- It keeps original wording, leaves unknown values blank, and keeps unrecognised sections as custom sections.
- It returns a list of `issues` (missing or uncertain fields) that the review screen highlights.

### OCR assets

By default tesseract.js downloads its worker, WASM core and English language data
from a public CDN on first use. The document itself never leaves the browser. To
self-host:

```bash
npm run ocr:assets       # copies worker + core into public/ocr/
curl -L -o public/ocr/eng.traineddata.gz \
  https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz
# then set VITE_OCR_ASSET_PATH=/ocr
```

## PDF export

The same `ResumeSheet` renders the preview and the PDF:

1. Fixed widths: 794px = A4, 816px = Letter at 96 dpi.
2. [paginate.ts](src/resume/paginate.ts) pushes any block that would straddle a page boundary onto the next page.
3. [pdf.ts](src/utils/pdf.ts) rasterises each page at 2–2.5× and lays an invisible text layer over it at the measured position of every word.

The result looks exactly like the preview and has selectable, searchable text.
The invisible text uses a standard PDF font, so it covers Latin scripts; other
scripts still render visually. **Print** sends the same sheet to the browser's
print dialog as vector text. No server or extra setup is needed.

## Privacy

- Uploaded resumes are parsed locally. Originals are stored only on request.
- Nothing is used for AI training.
- Deleting a resume deletes its original file. Deleting the account deletes all resumes, files and the profile.
- Fonts are self-hosted, and there are no analytics.

See the in-app Privacy Policy (`/privacy`) for the user-facing version, including
retention.
