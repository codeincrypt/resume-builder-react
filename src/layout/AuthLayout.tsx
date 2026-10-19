import type { ReactNode } from "react";

import Footer from "../components/Footer";
import Header from "../components/Header";

/** Chrome for public pages: header, full-bleed content, footer. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
