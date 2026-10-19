import type { ReactNode } from "react";
import { Alert } from "antd";

import { isFirebaseConfigured } from "../../database/firebase";

/** Centred card shell shared by every account screen. */
export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">{title}</h1>
        {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
        {!isFirebaseConfigured && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            title="Sign-in isn't configured yet."
            description="Add your Firebase settings to .env and restart the dev server. See the README for the steps."
          />
        )}
        {children}
        {footer && <div className="auth-card__footer">{footer}</div>}
      </div>
    </div>
  );
}
