import type { ReactNode } from "react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import RequireAuth from "./RequireAuth";

/** Chrome for signed-in pages: header, centred content, footer. */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" className="page-body" tabIndex={-1}>
        <div className="container">{children}</div>
      </main>
      <Footer />
    </RequireAuth>
  );
}
