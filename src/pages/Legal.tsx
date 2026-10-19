import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim();

function Page({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="container legal">
      <h1>{title}</h1>
      {updated && <p className="muted">Last updated: {updated}</p>}
      {children}
    </div>
  );
}

const UPDATED = "19 October 2026";

export function Privacy() {
  return (
    <Page title="Privacy Policy" updated={UPDATED}>
      <p>
        CapitalCV builds resumes. This page explains, in plain terms, what happens to the
        information you give it.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Account details</strong> — your name, email address and (for Google sign-in)
          profile picture, held by Firebase Authentication. Passwords are never visible to us; they
          are stored by Firebase as salted hashes.
        </li>
        <li>
          <strong>Your resumes</strong> — the content you enter, your template and design choices,
          stored in Cloud Firestore under your account.
        </li>
        <li>
          <strong>Uploaded files, only if you ask us to keep them</strong> — when you upload a
          resume you can choose “Keep a copy of my original file”. If you don't tick it, the file is
          never uploaded and nothing is stored.
        </li>
      </ul>

      <h2>How uploaded resumes are processed</h2>
      <p>
        Reading an uploaded PDF, DOCX or TXT file — including OCR of scanned PDFs — happens inside
        your own browser, using conventional text extraction and pattern matching. The file's contents
        are not sent to a server for processing, and <strong>no AI or large language model is
        used</strong>. We do not use your resumes, uploaded or typed, to train any AI model.
      </p>
      <p>
        If a scanned PDF needs OCR, your browser may download the OCR engine's program and language
        files from a public CDN (unless this deployment hosts them itself). Those are static files;
        your document is not sent with the request.
      </p>

      <h2>Who can see your data</h2>
      <p>
        Only you. Database and file-storage rules restrict every resume and uploaded file to the
        account that owns it. We don't sell your information, and we don't run advertising or
        analytics trackers. Fonts are served from this site, not from a third party.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        We use browser storage to keep you signed in (set by Firebase) and to remember interface
        preferences such as the template category you were browsing. There are no advertising or
        tracking cookies.
      </p>

      <h2>Deleting your data</h2>
      <ul>
        <li>
          <strong>A resume</strong> — delete it from your dashboard; its uploaded original (if any) is
          deleted with it.
        </li>
        <li>
          <strong>Your account</strong> — in <Link to="/profile">Account &amp; privacy</Link> you can
          delete your account, which permanently deletes all of your resumes, any uploaded files and
          your profile record immediately.
        </li>
        <li>
          <strong>Retention</strong> — once deleted, data is removed from the live database and
          storage straight away. Our infrastructure provider (Google Cloud / Firebase) may keep
          backups and operational logs for a limited period under its own retention policies; we
          can't remove those earlier.
        </li>
        <li>
          <strong>A copy of your data</strong> — you can download everything we hold from{" "}
          <Link to="/profile">Account &amp; privacy</Link>.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions about privacy? See <Link to="/contact">Contact</Link>.
      </p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of Use" updated={UPDATED}>
      <p>By using CapitalCV you agree to these terms.</p>
      <h2>Your content</h2>
      <p>
        You own the resumes you create. You give us permission only to store and display them to you
        so the service can work. You're responsible for the accuracy of what you put in a resume.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Don't upload content you have no right to use, attempt to access other people's accounts or
        data, or interfere with the service's operation.
      </p>
      <h2>Your account</h2>
      <p>
        Keep your sign-in details safe. You can delete your account at any time from{" "}
        <Link to="/profile">Account &amp; privacy</Link>.
      </p>
      <h2>No warranty</h2>
      <p>
        The service is provided “as is”. We work to keep it reliable, but we can't guarantee that it
        will always be available or error-free, nor that any resume will result in an interview or job.
        Keep your own copy of important documents.
      </p>
      <h2>Changes</h2>
      <p>We may update these terms; the date above shows the latest revision.</p>
    </Page>
  );
}

export function Contact() {
  return (
    <Page title="Contact">
      {CONTACT_EMAIL ? (
        <>
          <p>Questions, feedback or privacy requests? Email us and we'll get back to you.</p>
          <p>
            <a className="legal__mail" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </>
      ) : (
        <p>
          Contact details haven't been set up for this deployment yet. (The site owner can set{" "}
          <code>VITE_CONTACT_EMAIL</code> to show an address here.)
        </p>
      )}
    </Page>
  );
}
