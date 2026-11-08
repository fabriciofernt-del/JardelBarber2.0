import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error Boundary catch:", error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 mb-4 shadow-xl">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-wider text-white mb-2">
            Algo deu errado
          </h2>
          <p className="text-sm text-neutral-400 font-medium max-w-md mb-6 leading-relaxed">
            Ocorreu uma oscilação na exibição. Clique no botão abaixo para recarregar a página e continuar.
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider italic rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <RefreshCw size={16} /> Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
