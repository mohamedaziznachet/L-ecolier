import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: '#e11d48' }}>Oups ! Quelque chose s'est mal passé.</h1>
          <p style={{ color: '#4b5563', marginBottom: '24px', maxWidth: '500px' }}>
            Une erreur inattendue s'est produite lors du chargement de cette page. Veuillez rafraîchir la page ou revenir à l'accueil.
          </p>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1e293b'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0f172a'; }}
          >
            Retourner à l'accueil
          </button>
          {this.state.error && (
            <pre style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '6px', fontSize: '0.875rem', color: '#ef4444', overflowX: 'auto', maxWidth: '100%', textAlign: 'left' }}>
              <code>{this.state.error.toString()}</code>
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
