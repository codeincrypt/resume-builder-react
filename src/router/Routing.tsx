import { Suspense, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Spin } from "antd";
import { Route, Routes, useLocation } from "react-router-dom";

import ErrorBoundary from "../components/ErrorBoundary";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import AuthLayout from "../layout/AuthLayout";
import EditorLayout from "../layout/EditorLayout";
import MainLayout from "../layout/MainLayout";
import NotFound from "../pages/NotFound";

import type { AppRoute } from "./routes";
import { editorRoutes, protectedRoutes, publicRoutes } from "./routes";

/**
 * On navigation: land at the top (or the `#anchor`), and move keyboard /
 * screen-reader focus to the new page's main region rather than leaving it on
 * the link that was activated.
 */
function NavigationManager() {
  const { pathname, hash } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (hash) {
      // Wait a frame so the target has mounted after a route change.
      requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }),
      );
      return;
    }
    window.scrollTo(0, 0);
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname, hash]);

  return null;
}

function PageLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <Spin size="large" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function Page({ route }: { route: AppRoute }) {
  const Component = route.component;
  return <Component />;
}

/**
 * Title, error boundary and lazy-chunk fallback, inside the layout so the
 * header stays. The title is set here, outside Suspense, so it changes the
 * moment the route does — not after the page's chunk has downloaded.
 */
function Boundary({ title, children }: { title?: string; children: ReactNode }) {
  const { pathname } = useLocation();
  useDocumentTitle(title);
  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export default function Routing() {
  return (
    <>
      <NavigationManager />
      <Routes>
        {publicRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <AuthLayout>
                <Boundary title={route.title}>
                  <Page route={route} />
                </Boundary>
              </AuthLayout>
            }
          />
        ))}

        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <MainLayout>
                <Boundary title={route.title}>
                  <Page route={route} />
                </Boundary>
              </MainLayout>
            }
          />
        ))}

        {editorRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <EditorLayout>
                <Boundary title={route.title}>
                  <Page route={route} />
                </Boundary>
              </EditorLayout>
            }
          />
        ))}

        <Route
          path="*"
          element={
            <AuthLayout>
              <Boundary title="Page not found">
                <NotFound />
              </Boundary>
            </AuthLayout>
          }
        />
      </Routes>
    </>
  );
}
