import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button, Result } from "antd";

interface Props {
  children: ReactNode;
  /** Changing this (e.g. the current path) clears a caught error. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/** A page chunk that no longer exists on the server: a new version was deployed. */
function isStaleChunk(error: Error): boolean {
  return /dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically/i.test(
    error.message,
  );
}

/**
 * Catches render errors so one broken page shows a way out instead of
 * blanking the whole app. Also catches the "chunk not found" error users hit
 * when a new version is deployed while their tab is open.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[capitalcv] render error", error, info.componentStack);
  }

  componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const stale = isStaleChunk(error);
    return (
      <Result
        status={stale ? "info" : "error"}
        title={stale ? "A new version of CapitalCV is available" : "Something went wrong"}
        subTitle={
          stale
            ? "Reload the page to continue. Your saved resumes are safe."
            : "This page hit an unexpected problem. Your saved resumes are safe — reload to try again."
        }
        extra={[
          <Button key="reload" type="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>,
          <Button key="home" onClick={() => window.location.assign("/")}>
            Go to the home page
          </Button>,
        ]}
      />
    );
  }
}
