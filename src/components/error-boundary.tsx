'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info);
  }

  handleReset = () => {
    try {
      // Clear the corrupted wizard state from localStorage
      localStorage.removeItem('solar-roi-wizard');
      // Clear any other app keys just in case
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('solar-')) localStorage.removeItem(key);
      });
    } catch {
      // ignore storage errors
    }
    window.location.href = '/proposals/new';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            {/* Icon */}
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Something went wrong</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                The app encountered an unexpected error. This is usually caused by corrupted
                saved data. Clearing your local data will fix it instantly.
              </p>
            </div>

            {/* Error detail (collapsible) */}
            {this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-slate-800 rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            {/* Recovery actions */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span>🗑️</span> Clear Data &amp; Restart
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2.5 px-6 rounded-xl transition-colors duration-200 text-sm"
              >
                Just Reload Page
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Clearing data will reset the wizard to a fresh state. Your saved proposals in the
              database are not affected.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
