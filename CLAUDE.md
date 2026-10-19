# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CapitalCV: sign in (Google or email/password via Firebase Auth), upload an
existing resume or start blank, review the extracted fields, pick one of 25
capital-city templates, edit with a live paginated preview, download a PDF.
React SPA with no backend of its own — Firestore and Storage are called
directly from the browser, and **security rules are the access control**.
Upload parsing is rule-based and runs in the browser — no AI/LLM, by design.

## Commands

```bash
npm run dev        # Vite dev server, http://localhost:3000
npm run build      # tsc --noEmit && vite build -> build/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # resume-parser tests (node:test via tsx)
npm run emulators  # Auth/Firestore/Storage emulators (firebase-tools on PATH)
```

Verification: `npm run typecheck && npm run lint && npm test && npm run build`,
then drive the app in a browser against the emulators (see README, "Run
locally with no cloud project"). The emulators enforce the real
`firestore.rules` / `storage.rules`; verification/reset links are listed at
`http://127.0.0.1:9099/emulator/v1/projects/demo-capitalcv/oobCodes`.

## Environment

`VITE_`-prefixed only; see [.env.example](.env.example). `.env` is gitignored.
Missing Firebase values don't crash the app — sign-in is disabled with a
notice. `VITE_FIREBASE_STORAGE_BUCKET` is optional (only "keep original file"
needs it). `VITE_USE_FIREBASE_EMULATORS=true` points every service at the local
emulators. Vite also reads `VITE_*` from the process environment, so throwaway
config needs no `.env`.

## Architecture

**Content vs design.** [types/resume.ts](src/types/resume.ts) defines
`ResumeContent` (what it says), `DesignSettings` (how it looks; `null` fields
mean "template default", so switching template re-themes) and `SectionConfig[]`
(order, visibility, page breaks). `ResumeDoc` bundles them. Dates are `YYYY-MM`
or bare `YYYY` **strings** — Dayjs only at the DatePicker boundary
([utils/dates.ts](src/utils/dates.ts)). `normalizeContent/Design/Sections`
default everything on read; `sanitizeDoc` ([utils/sanitize.ts](src/utils/sanitize.ts))
bounds lengths/counts on write. User text is only ever rendered as React text,
never as HTML.

**Routing** is table-driven: [router/routes.ts](src/router/routes.ts) exports
`publicRoutes` (AuthLayout), `protectedRoutes` (MainLayout) and `editorRoutes`
(EditorLayout, full-bleed), each with a document `title`. All pages except
Home/Login/Signup are `React.lazy` chunks. [Routing.tsx](src/router/Routing.tsx)
wraps every page in its layout → title + ErrorBoundary + Suspense (so the
header stays up while a chunk loads, and a stale chunk after a deploy shows
"reload" instead of a blank screen), and moves focus to `#main` on navigation. Both gated layouts wrap
[RequireAuth](src/layout/RequireAuth.tsx), the only auth gate: wait for
Firebase to restore the session → no user → `/login` (with `from`) →
unverified email → `/verify-email`. Add routes to the arrays, not to
`Routing.tsx`.

**Auth** is Firebase Auth ([database/auth.ts](src/database/auth.ts));
[useAuthListener](src/hooks/useAuthListener.ts) mirrors it into the `auth`
slice, which is deliberately **not** persisted. `onAuthStateChanged` does not
fire when `emailVerified` flips — call `refreshUser()` and dispatch the result.

**Firestore access** is confined to [database/request.ts](src/database/request.ts):
`users/{uid}` (profile) and `users/{uid}/resumes/{id}`. Every call is wrapped in
`withTimeout` (Firestore retries an unreachable backend forever). Storage helpers
are in [database/storage.ts](src/database/storage.ts) (`users/{uid}/uploads/...`).
Deleting a resume deletes its original file; account deletion removes uploads,
resumes, profile, then the Auth user (after re-authentication).

**Templates are data, not components.** [resume/registry.ts](src/resume/registry.ts)
holds 25 `TemplateSpec`s (layout, header, heading, entry, skills and bullet
style + fonts + palette). One renderer, [ResumeSheet.tsx](src/resume/ResumeSheet.tsx),
turns a spec into modifier classes (`rt-l-*`, `rt-hd-*`, `rt-h-*`, …) and inline
CSS variables, styled by [templates.css](src/resume/templates.css). Adding a
template = one registry entry (plus optional `[data-template=…]` touches).
`.rt` is a fixed pixel width: 794px = A4, 816px = Letter at 96 dpi. Fonts are
self-hosted Fontsource variable fonts ([resume/fonts.ts](src/resume/fonts.ts)).

**Pagination** ([resume/paginate.ts](src/resume/paginate.ts)) runs after layout:
any `[data-block]` straddling a page boundary gets a `margin-top` push to the
next page (the first block of a section drags its section; long entries split
between bullets). The preview and the PDF slice the same sheet at the same page
height, so their page breaks match.

**PDF export** ([utils/pdf.ts](src/utils/pdf.ts)) mounts the sheet off-screen,
paginates, rasterises each page with `html2canvas-pro` (not `html2canvas`: the
original throws on `oklch()`/`lab()`), and overlays an invisible jsPDF text
layer at every measured word, so text is selectable and parseable. **Print**
uses the same sheet through `window.print()`. Both libraries load on demand.

**Parsing** ([src/parsing](src/parsing)): `files.ts` validates extension + MIME
+ magic bytes; `extract.ts` gets text (pdf.js; Tesseract OCR when a PDF has no
text layer; mammoth for DOCX); `parseResume.ts` + `patterns.ts` map it to
`ResumeContent` and return `issues` (missing/uncertain) that the review screen
highlights by path (`personal.email`, `experience.<id>.company`, …). Wording is
preserved; nothing is invented. Two-column PDFs/scans are re-ordered column by
column across pages (`findGutter` / `orderByColumns`). Tests:
[parse.test.ts](src/parsing/__tests__/parse.test.ts).

## Gotchas that cost time

- **Page CSS must never reach into a résumé sheet.** Thumbnails and previews
  share the DOM with the page, so a rule like `.band h2` silently restyles the
  template's `h2` section titles (headings rendered at 36px). Style page
  headings by class, never `container h2`; the global heading rule is
  `:where(h1,h2,h3):not(:where(.rt *))`. templates.css resets with zero
  specificity (`:where(.rt) :where(...)`) so template rules always win.
- **Vertical spacing in templates uses flex `gap`, never margins.** The
  paginator pushes with `margin-top`; sibling margins would collapse instead
  of adding.
- **Template CSS variables must be declared inline on `.rt`** (ResumeSheet does
  this). html2canvas-pro resolves them there; variables inherited from an
  ancestor outside the captured element render black.
- **The invisible PDF text layer is stretched with `horizontalScale`, not
  `charSpace`.** Character spacing opens gaps that extractors read as spaces
  ("W O R K"), which broke re-importing our own PDFs.
- **In `orderByColumns`, a line above its predecessor is not a paragraph
  break.** A right-aligned date is drawn after the company line but sits on
  the title's baseline; treating that upward jump as a break detached every
  job title from its dates (regression test in parse.test.ts).
- **Hidden previews can't be measured.** `paginate()` returns `null` for a
  `display:none` sheet; ResumePreview re-runs it when the stage becomes visible
  (mobile Edit/Preview tabs).
- **Labels must be wired to inputs.** `Form.Item` only links `label` to its
  control for named fields; editor `Field`s inject `id`/`htmlFor` via `useId`.
  Custom controls (`MonthField`, `TagsField`) must forward `id`.
- **redux-persist's `storage` export is unusable under Vite.**
  [store/storage.ts](src/store/storage.ts) implements the interface directly.
  Only the `template` slice (gallery filters) is persisted.
- **antd v6 renamed things.** `Alert` takes `title`, not `message`. `Menu`/
  `Dropdown` are `items`-based. `Dropdown.Button` is deprecated (use
  `Space.Compact`). `.ant-select-selector` is now `.ant-select-content`.
  Collapse `extra` buttons become part of the header's accessible name.
- **rc-select renders a hidden `role="option"` list** and virtualises long
  lists. In browser tests, type to filter and press Enter, or target
  `.ant-select-item-option`.
- **`innerText` applies CSS `text-transform`** — several templates uppercase
  names/titles, and the PDF text layer reproduces that.
- **This directory is named `resume-builder-react`**, so `id.includes("react")`
  in build config matches every path — match after `node_modules/` (see
  [vite.config.ts](vite.config.ts)).
- **Node 20 `node --test` doesn't expand globs** — `npm test` names the file.
- **The lockfile must list every platform's native binding** for rolldown and
  lightningcss (npm/cli#4828). A lockfile regenerated from an existing
  `node_modules` on macOS can keep only `*-darwin-arm64`, and Netlify (Linux)
  then fails with "Cannot find native binding". Check with
  `grep -c binding-linux-x64-gnu package-lock.json` before pushing. Don't
  follow rolldown's "delete package-lock.json" advice: npm 10.8 resolving from
  scratch crashes on the optional `canvas` peer ("reading 'edgesOut'").
- **Recent firebase-tools needs Java 21+** for the emulators; firebase-tools 13
  still runs on Java 17.

## Deliberate version pins

TypeScript is held at **5.9**, not 7.x: `typescript-eslint` peers at
`>=4.8.4 <6.1.0`. pdfjs-dist is held at **5.x** — 6.x requires Node 22.13+.
