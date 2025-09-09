import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import { faroLogger } from './config/faro';

// Componente de erro boundary para capturar erros
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log do erro no Grafana Faro
    faroLogger.error('Erro capturado pelo Error Boundary', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          background: '#e74c3c',
          color: 'white',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1>😵 Oops! Algo deu errado</h1>
          <p style={{ marginBottom: '2rem' }}>
            Um erro inesperado ocorreu. O erro foi registrado para análise.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.href = '/';
            }}
            style={{
              backgroundColor: 'white',
              color: '#e74c3c',
              border: 'none'
            }}
          >
            🏠 Voltar ao Início
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Componente para página não encontrada
const NotFound: React.FC = () => {
  React.useEffect(() => {
    faroLogger.warn('Página não encontrada acessada', {
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, []);
  
  return (
    <div className="main-content">
      <div className="container">
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ color: '#e74c3c', marginBottom: '1rem', fontSize: '3rem' }}>
            404
          </h1>
          <h2 style={{ color: '#7f8c8d', marginBottom: '1rem' }}>
            😕 Página não encontrada
          </h2>
          <p style={{ color: '#95a5a6', marginBottom: '2rem' }}>
            A página que você está procurando não existe.
          </p>
          <a href="/" className="btn btn-primary">
            🏠 Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
};

function App() {
  React.useEffect(() => {
    // Log de inicialização da aplicação
    faroLogger.info('Aplicação React inicializada', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    
    // Listener para mudanças de rota
    const handleRouteChange = () => {
      faroLogger.info('Navegação detectada', {
        newPath: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    };
    
    // Escutar mudanças no histórico
    window.addEventListener('popstate', handleRouteChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <CartProvider>
        <div className="App">
          <Header />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Footer */}
          <footer style={{
            background: '#2c3e50',
            color: 'white',
            textAlign: 'center',
            padding: '2rem 0',
            marginTop: '4rem'
          }}>
            <div className="container">
              <p style={{ marginBottom: '0.5rem' }}>
                🚀 POC Grafana Faro - Demonstração de Observabilidade Web
              </p>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Todos os eventos, métricas e logs são capturados automaticamente
              </p>
            </div>
          </footer>
        </div>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;