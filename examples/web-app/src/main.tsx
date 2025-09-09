import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Inicializar Grafana Faro antes de renderizar a aplicação
import './config/faro.ts';
import { faroLogger } from './config/faro.ts';

// Log de inicialização da aplicação
faroLogger.info('Aplicação iniciada', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);