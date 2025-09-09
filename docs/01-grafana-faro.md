# 📊 Grafana Faro - Real User Monitoring (RUM)

## 🎯 Visão Geral

O **Grafana Faro** é um SDK web configurável para monitoramento de usuários reais (RUM) que coleta dados de observabilidade de aplicações frontend em tempo real.

### 🔑 Características Principais
- **Real User Monitoring (RUM)** para aplicações web e mobile
- **Coleta automática** de métricas de performance
- **Instrumentação simples** com apenas 2 linhas de código
- **Integração nativa** com stack LGTM (Loki, Grafana, Tempo, Mimir)
- **Suporte a Web Vitals** (LCP, FID, CLS)
- **Coleta de logs, exceções, eventos e traces**

## 📋 Capacidades Detalhadas

### 🌐 **Web Monitoring**

#### Métricas Automáticas
- **Core Web Vitals**:
  - Largest Contentful Paint (LCP)
  - First Input Delay (FID)
  - Cumulative Layout Shift (CLS)
- **Performance Metrics**:
  - Time to First Byte (TTFB)
  - First Contentful Paint (FCP)
  - Navigation timing
  - Resource timing

#### Logs e Eventos
- **Console logs** automáticos
- **Erros JavaScript** não tratados
- **Eventos customizados** de usuário
- **Navegação** entre páginas
- **Cliques e interações** do usuário

#### Traces Distribuídos
- **Automatic instrumentation** de fetch/XHR
- **Manual instrumentation** para operações customizadas
- **Correlation** entre frontend e backend
- **Propagação de contexto** via headers HTTP

### 📱 **Mobile Monitoring**

#### React Native Support
- **Performance monitoring** nativo
- **Crash reporting** automático
- **Network monitoring** para APIs
- **User session tracking**

#### Capacidades Mobile
- **App lifecycle events**
- **Memory usage tracking**
- **Battery impact monitoring**
- **Network connectivity status**

## ⚙️ Configuração e Implementação

### 🌐 **Setup Web (React)**

```javascript
// 1. Instalação
npm install @grafana/faro-web-sdk @grafana/faro-web-tracing

// 2. Inicialização básica
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

const faro = initializeFaro({
  url: 'http://localhost:12347/collect',
  app: {
    name: 'my-react-app',
    version: '1.0.0',
    environment: 'production'
  },
  instrumentations: [
    ...getWebInstrumentations(),
    new TracingInstrumentation()
  ]
});

// 3. Uso em componentes
import { faro } from '@grafana/faro-web-sdk';

function MyComponent() {
  const handleClick = () => {
    // Log customizado
    faro.api.pushLog(['User clicked button', { userId: '123' }]);
    
    // Evento customizado
    faro.api.pushEvent('button_click', {
      component: 'MyComponent',
      action: 'primary_action'
    });
    
    // Trace manual
    const span = faro.api.getOTEL()?.trace.getActiveSpan();
    span?.setAttributes({ 'user.action': 'button_click' });
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

### 📱 **Setup Mobile (React Native)**

```javascript
// 1. Instalação
npm install @grafana/faro-react-native

// 2. Inicialização
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-react-native';

const faro = initializeFaro({
  url: 'http://localhost:12347/collect',
  app: {
    name: 'my-mobile-app',
    version: '1.0.0',
    environment: 'production'
  },
  instrumentations: getWebInstrumentations({
    captureConsole: true,
    captureUnhandledExceptions: true
  })
});

// 3. Uso em componentes
import { faro } from '@grafana/faro-react-native';

function MobileComponent() {
  useEffect(() => {
    // Track screen view
    faro.api.pushEvent('screen_view', {
      screen_name: 'Home',
      screen_class: 'MobileComponent'
    });
  }, []);
  
  return (
    <View>
      <Text>Mobile App with Faro</Text>
    </View>
  );
}
```

## 🔧 Configurações Avançadas

### 🎛️ **Configuração Completa**

```javascript
const faro = initializeFaro({
  // Endpoint de coleta
  url: 'http://localhost:12347/collect',
  
  // Informações da aplicação
  app: {
    name: 'my-app',
    version: '1.0.0',
    environment: 'production',
    namespace: 'frontend'
  },
  
  // Configurações de usuário
  user: {
    id: 'user-123',
    email: 'user@example.com',
    attributes: {
      plan: 'premium',
      region: 'us-east-1'
    }
  },
  
  // Instrumentações
  instrumentations: [
    ...getWebInstrumentations({
      captureConsole: true,
      captureUnhandledExceptions: true,
      captureUnhandledRejections: true,
      captureWebVitals: true
    }),
    new TracingInstrumentation({
      instrumentationOptions: {
        '@opentelemetry/instrumentation-fetch': {
          propagateTraceHeaderCorsUrls: [
            /^https:\/\/api\.myapp\.com\/.*/
          ]
        }
      }
    })
  ],
  
  // Configurações de transporte
  transports: [
    new FetchTransport({
      url: 'http://localhost:12347/collect',
      requestOptions: {
        headers: {
          'Authorization': 'Bearer token'
        }
      }
    })
  ],
  
  // Configurações de sessão
  sessionTracking: {
    enabled: true,
    persistent: true
  },
  
  // Configurações de batching
  batching: {
    enabled: true,
    sendTimeout: 5000,
    itemLimit: 50
  }
});
```

### 🔍 **Instrumentação Customizada**

```javascript
// Custom instrumentation
class CustomInstrumentation {
  constructor() {
    this.name = 'custom-instrumentation';
    this.version = '1.0.0';
  }
  
  initialize(faro) {
    // Monitor route changes
    window.addEventListener('popstate', (event) => {
      faro.api.pushEvent('route_change', {
        from: event.state?.from,
        to: window.location.pathname
      });
    });
    
    // Monitor performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        faro.api.pushMeasurement({
          type: 'performance',
          name: entry.name,
          value: entry.duration,
          attributes: {
            entryType: entry.entryType
          }
        });
      });
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
  }
}

// Uso da instrumentação customizada
const faro = initializeFaro({
  // ... outras configurações
  instrumentations: [
    ...getWebInstrumentations(),
    new CustomInstrumentation()
  ]
});
```

## 📊 Dados Coletados

### 📈 **Métricas**
- **Web Vitals**: LCP, FID, CLS, TTFB, FCP
- **Performance**: Navigation timing, Resource timing
- **Custom metrics**: Métricas definidas pelo usuário
- **Business metrics**: KPIs específicos da aplicação

### 📝 **Logs**
- **Console logs**: info, warn, error, debug
- **Custom logs**: Logs estruturados com contexto
- **Error logs**: Exceções JavaScript capturadas
- **User actions**: Eventos de interação do usuário

### 🔗 **Traces**
- **HTTP requests**: Fetch/XHR automático
- **User interactions**: Cliques, navegação
- **Custom spans**: Operações específicas da aplicação
- **Distributed tracing**: Correlação frontend-backend

### 📋 **Eventos**
- **Page views**: Visualizações de página
- **User interactions**: Cliques, formulários
- **Custom events**: Eventos de negócio
- **Error events**: Exceções e erros

## 🔄 Integração com Stack LGTM

### 📊 **Grafana Dashboards**
- **RUM Overview**: Métricas gerais de performance
- **Web Vitals**: Core Web Vitals detalhados
- **Error Tracking**: Monitoramento de erros
- **User Journey**: Fluxo de navegação dos usuários

### 🔍 **Loki Logs**
- **Structured logging** com labels
- **Log correlation** com traces
- **Error aggregation** e alerting
- **Custom log queries** e dashboards

### 🕸️ **Tempo Traces**
- **Distributed tracing** end-to-end
- **Performance analysis** de requests
- **Dependency mapping** entre serviços
- **Latency analysis** detalhada

### 📈 **Mimir Metrics**
- **Time series** de métricas RUM
- **Alerting** baseado em SLIs
- **Long-term storage** de métricas
- **Custom metric queries** e análises

## 🎯 Casos de Uso

### 🏢 **Enterprise Applications**
- **Performance monitoring** de aplicações críticas
- **User experience** optimization
- **Error tracking** e debugging
- **Business intelligence** baseado em dados RUM

### 🛒 **E-commerce**
- **Conversion funnel** analysis
- **Page load performance** impact on sales
- **User behavior** tracking
- **A/B testing** measurement

### 📱 **Mobile Applications**
- **App performance** monitoring
- **Crash reporting** e analysis
- **User engagement** metrics
- **Feature adoption** tracking

## ⚡ Performance e Otimização

### 📦 **Bundle Size**
- **Core SDK**: ~15KB gzipped
- **Tracing**: +8KB gzipped
- **Tree shaking** support
- **Lazy loading** de instrumentações

### 🚀 **Runtime Performance**
- **Minimal overhead** (<1% CPU)
- **Async data collection**
- **Batching** e compression
- **Memory efficient** data structures

### 🔧 **Configuração de Performance**

```javascript
const faro = initializeFaro({
  // ... outras configurações
  
  // Otimizações de performance
  batching: {
    enabled: true,
    sendTimeout: 10000,  // Batch maior
    itemLimit: 100       // Mais itens por batch
  },
  
  // Sampling para reduzir volume
  sampling: {
    traces: 0.1,  // 10% dos traces
    logs: 0.5,    // 50% dos logs
    events: 1.0   // 100% dos eventos
  },
  
  // Filtros para reduzir ruído
  beforeSend: (event) => {
    // Filtrar eventos de desenvolvimento
    if (event.meta?.app?.environment === 'development') {
      return null;
    }
    
    // Filtrar logs de baixa prioridade
    if (event.type === 'log' && event.level === 'debug') {
      return null;
    }
    
    return event;
  }
});
```

## 🔒 Segurança e Privacidade

### 🛡️ **Data Privacy**
- **PII scrubbing** automático
- **Custom data sanitization**
- **GDPR compliance** features
- **Data retention** controls

### 🔐 **Security**
- **HTTPS transport** obrigatório
- **Authentication** via headers
- **Rate limiting** built-in
- **Data validation** e sanitization

### ⚙️ **Configuração de Privacidade**

```javascript
const faro = initializeFaro({
  // ... outras configurações
  
  // Configurações de privacidade
  privacy: {
    maskTextContent: true,
    maskUserInputs: true,
    allowedDomains: ['myapp.com'],
    blockedUrls: [/\/admin\//]
  },
  
  // Sanitização de dados
  beforeSend: (event) => {
    // Remover informações sensíveis
    if (event.payload?.url) {
      event.payload.url = event.payload.url.replace(/token=[^&]+/, 'token=***');
    }
    
    return event;
  }
});
```

## 📚 Recursos Adicionais

### 🔗 **Links Úteis**
- [Documentação Oficial](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/)
- [GitHub Repository](https://github.com/grafana/faro-web-sdk)
- [Examples](https://github.com/grafana/faro-web-sdk/tree/main/packages/web-sdk/examples)
- [Community Forum](https://community.grafana.com/)

### 🎓 **Tutoriais**
- [Getting Started Guide](https://grafana.com/tutorials/frontend-observability/)
- [React Integration](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/instrument/react/)
- [Performance Optimization](https://grafana.com/blog/2023/04/19/frontend-observability-best-practices/)

---

**Próximo:** [Grafana Beyla →](./02-grafana-beyla.md)