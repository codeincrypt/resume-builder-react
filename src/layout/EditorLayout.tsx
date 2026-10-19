import type { ReactNode } from "react";

import RequireAuth from "./RequireAuth";

/** Gate only — the editor owns the whole viewport, including its toolbar. */
export default function EditorLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
