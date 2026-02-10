import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center p-8">
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-4 text-center">
              <p className="text-sm font-medium text-destructive">Something went wrong</p>
              <p className="mt-1 text-xs text-destructive/80">Please try refreshing the page.</p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
