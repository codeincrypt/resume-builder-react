import type { ReactNode } from "react";
import { Spin } from "antd";
import { Navigate, useLocation } from "react-router-dom";

import { isFirebaseConfigured } from "../database/firebase";
import { useAppSelector } from "../store/hooks";

/**
 * The app's only auth gate. Order matters:
 *  1. wait for Firebase to restore the session (no flash of the login page),
 *  2. no user -> /login, remembering where they were headed,
 *  3. email/password account not yet verified -> /verify-email.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, status } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isFirebaseConfigured) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (status === "initializing") {
    return (
      <div className="page-loading" role="status" aria-live="polite">
        <Spin size="large" />
        <span className="sr-only">Loading your account…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;

  return <>{children}</>;
}
