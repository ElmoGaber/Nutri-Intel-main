import { Component, type ReactNode, type ErrorInfo } from "react";
import { translations } from "@/lib/i18n";

interface Props {
  children: ReactNode;
  language?: "en" | "ar";
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const lang = this.props.language ?? "en";
    const t = translations[lang];

    return (
      <div
        className="flex items-center justify-center min-h-[60vh] p-8"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-destructive">{t.somethingWentWrong}</h2>
          <p className="text-sm text-muted-foreground">{t.errorBoundaryDesc}</p>
          {this.state.error && (
            <details className="text-left text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <summary className="cursor-pointer font-medium mb-1">Error details</summary>
              <pre className="whitespace-pre-wrap break-all">{this.state.error.message}</pre>
            </details>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {t.tryAgain}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              {t.refreshPage}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
