import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error trapped by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 my-4 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
          <h3 className="text-sm font-semibold">
            {this.props.fallbackTitle || 'A temporary visual pause occurred'}
          </h3>
          <p className="text-xs max-w-md mx-auto opacity-80 leading-relaxed">
            Your sanctuary and reflections remain completely safe. You can refresh this view or resume your reflections.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Resume Sanctuary</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
