import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { faroLogger, faroMetrics } from '../config/faro';

const Home: React.FC = () => {
  useEffect(() => {
    // Medir tempo de carregamento da página
    const startTime = performance.now();
    
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      faroMetrics.recordPageLoad('home', loadTime);
      
      faroLogger.info('Página Home carregada', {
        loadTime: `${loadTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    };
    
    // Simular carregamento completo
    setTimeout(handleLoad, 100);
  }, []);
  
  const handleCTAClick = (ctaType: string) => {
    faroMetrics.recordClick(`home_cta_${ctaType}`);
  };
  
  return (
    <div className="main-content">
      <div className="container">
        <div style={{
          textAlign: 'center',
          padding: '4rem 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            fontWeight: 'bold'
          }}>
            🚀 POC Grafana Faro
          </h1>
          
          <p style={{
            fontSize: '1.3rem',
            marginBottom: '2rem',
            opacity: 0.9
          }}>
            Demonstração de observabilidade em aplicações web
          </p>
          
          <Link 
            to="/products" 
            className="btn btn-primary"
            style={{
              fontSize: '1.2rem',
              padding: '1rem 2rem',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '2px solid white',
              color: 'white'
            }}
            onClick={() => handleCTAClick('explore_products')}
          >
            🛍️ Explorar Produtos
          </Link>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>📊 Métricas em Tempo Real</h3>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
              Todos os cliques, navegação e interações são automaticamente capturados 
              pelo Grafana Faro e enviados para análise.
            </p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>🔍 Logs Estruturados</h3>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
              Eventos de negócio como visualizações de produtos, adições ao carrinho 
              e buscas são logados com contexto rico.
            </p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>⚡ Performance Tracking</h3>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
              Tempos de carregamento de páginas e performance de APIs são 
              monitorados automaticamente.
            </p>
          </div>
        </div>
        
        <div style={{
          background: '#ecf0f1',
          padding: '2rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>🎯 Como Funciona</h2>
          <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: '1.6' }}>
            Esta aplicação demonstra a integração do Grafana Faro para observabilidade 
            de frontend. Navegue pela loja, adicione produtos ao carrinho e veja 
            como os dados são coletados em tempo real.
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <Link 
              to="/products" 
              className="btn btn-primary"
              onClick={() => handleCTAClick('start_shopping')}
            >
              🛒 Começar a Comprar
            </Link>
            
            <button 
              className="btn btn-success"
              onClick={() => {
                handleCTAClick('view_console');
                faroLogger.info('Usuário clicou para ver console', {
                  action: 'view_console_clicked',
                  page: 'home'
                });
                alert('Abra o DevTools (F12) e veja a aba Console para ver os logs do Faro em ação!');
              }}
            >
              🔍 Ver Logs no Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;