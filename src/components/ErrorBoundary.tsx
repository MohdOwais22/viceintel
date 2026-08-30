import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught client exception:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gtavi_app_session_state');
        sessionStorage.clear();
      }
    } catch (e) {
      console.warn('Unable to clear local storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-2xl">
            <div className="inline-flex p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
              <AlertTriangle className="w-10 h-10 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                Application Recovered from Unexpected Error
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                An unexpected error occurred while rendering the page component. Click below to reload cleanly.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-left overflow-x-auto max-h-32 text-[11px] font-mono text-red-300/80">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
