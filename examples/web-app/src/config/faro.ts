import { getWebInstrumentations, initializeFaro, LogLevel } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

// Configuração do Grafana Faro
const faroConfig = {
  url: 'http://localhost:12347/collect', // URL do Grafana Alloy
  app: {
    name: 'poc-ecommerce-web',
    version: '1.0.0',
    environment: 'development'
  },
  instrumentations: [
    // Instrumentações automáticas para web
    ...getWebInstrumentations(),
    // Instrumentação de tracing
    new TracingInstrumentation()
  ],
  // Configurações de sessão
  sessionTracking: {
    enabled: true,
    persistent: true
  },
  // Configurações de captura de erros
  beforeSend: (event: any) => {
    // Filtrar dados sensíveis se necessário
    console.log('Enviando evento Faro:', event.type);
    return event;
  }
};

// Inicializar Faro
export const faro = initializeFaro(faroConfig);

// Funções utilitárias para logging customizado
export const faroLogger = {
  info: (message: string, context?: Record<string, any>) => {
    faro.api.pushLog([message], {
      level: LogLevel.INFO,
      context
    });
  },
  
  warn: (message: string, context?: Record<string, any>) => {
    faro.api.pushLog([message], {
      level: LogLevel.WARN,
      context
    });
  },
  
  error: (message: string, error?: Error, context?: Record<string, any>) => {
    faro.api.pushLog([message], {
      level: LogLevel.ERROR,
      context: {
        ...context,
        error: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace'
      }
    });
  }
};

// Funções utilitárias para eventos customizados
export const faroEvents = {
  // Evento de visualização de produto
  productView: (productId: string, productName: string, category: string) => {
    faro?.api.pushEvent('product_view', {
      productId,
      productName,
      category,
      timestamp: new Date().toISOString()
    });
  },
  
  // Evento de adição ao carrinho
  addToCart: (productId: string, productName: string, price: number, quantity: number) => {
    faro?.api.pushEvent('add_to_cart', {
      productId,
      productName,
      price: price.toString(),
      quantity: quantity.toString(),
      timestamp: new Date().toISOString()
    });
  },
  
  // Evento de remoção do carrinho
  removeFromCart: (productId: string, productName: string, quantity: number) => {
    faro?.api.pushEvent('remove_from_cart', {
      productId,
      productName,
      quantity: quantity.toString(),
      timestamp: new Date().toISOString()
    });
  },
  
  // Evento de checkout
  checkout: (items: any[], totalValue: number) => {
    faro?.api.pushEvent('checkout_start', {
      itemCount: items.length.toString(),
      totalValue: totalValue.toString(),
      timestamp: new Date().toISOString()
    });
  },
  
  // Evento de busca
  search: (query: string, resultsCount: number) => {
    faro?.api.pushEvent('search_performed', {
      query,
      resultsCount: resultsCount.toString(),
      timestamp: new Date().toISOString()
    });
  }
};

// Funções utilitárias para métricas customizadas (usando logs estruturados)
export const faroMetrics = {
  // Registrar clique em elemento
  recordClick: (element: string, metadata?: Record<string, any>) => {
    faroLogger.info('UI Click Metric', {
      metric_type: 'click',
      element,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },
  
  // Registrar tempo de carregamento de página
  recordPageLoad: (page: string, duration: number) => {
    faroLogger.info('Page Load Metric', {
      metric_type: 'page_load',
      page,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    });
  },
  
  // Registrar tempo de resposta de API
  recordApiResponse: (endpoint: string, duration: number, status: number) => {
    faroLogger.info('API Response Metric', {
      metric_type: 'api_response',
      endpoint,
      duration_ms: duration,
      status_code: status,
      timestamp: new Date().toISOString()
    });
  }
};