import axios from 'axios';

// Configuração customizada para envio de dados de observabilidade
const faroConfig = {
  url: process.env.FARO_URL || 'http://localhost:4328/collect',
  app: {
    name: process.env.FARO_APP_NAME || 'poc-porto-mobile',
    version: process.env.FARO_APP_VERSION || '1.0.0',
    environment: process.env.FARO_ENVIRONMENT || (__DEV__ ? 'development' : 'production'),
  },
  sessionId: `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
};

// Cliente customizado para envio de dados
class CustomFaroClient {
  private config: typeof faroConfig;
  private sessionAttributes: Record<string, any> = {};
  private userAttributes: Record<string, any> = {};

  constructor(config: typeof faroConfig) {
    this.config = config;
    this.sessionAttributes = {
      platform: 'react-native',
      session_id: config.sessionId,
      app_name: config.app.name,
      app_version: config.app.version,
      environment: config.app.environment,
    };
  }

  private async sendData(type: string, data: any) {
    try {
      await axios.post(this.config.url, {
        type,
        timestamp: Date.now(),
        session: this.sessionAttributes,
        user: this.userAttributes,
        ...data,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
    } catch (error) {
      console.warn('Failed to send observability data:', error);
    }
  }

  pushEvent(name: string, attributes: Record<string, any> = {}) {
    this.sendData('event', {
      name,
      attributes: {
        ...attributes,
        platform: 'react-native',
      },
    });
  }

  pushMeasurement(measurement: { type: string; values: Record<string, number>; attributes?: Record<string, any> }) {
    this.sendData('measurement', {
      ...measurement,
      attributes: {
        ...measurement.attributes,
        platform: 'react-native',
      },
    });
  }

  pushError(error: Error, context?: Record<string, any>) {
    this.sendData('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: {
        ...context,
        platform: 'react-native',
      },
    });
  }

  setUser(user: { id: string; attributes?: Record<string, any> }) {
    this.userAttributes = {
      id: user.id,
      ...user.attributes,
    };
  }

  setSession(session: { attributes: Record<string, any> }) {
    this.sessionAttributes = {
      ...this.sessionAttributes,
      ...session.attributes,
    };
  }
}

// Inicializar cliente customizado
export const faro = {
  api: new CustomFaroClient(faroConfig),
};

// Funções utilitárias para eventos customizados
export const trackScreenView = (screenName: string, params?: Record<string, any>) => {
  faro.api.pushEvent('screen_view', {
    screen_name: screenName,
    timestamp: Date.now(),
    ...params,
  });
};

export const trackUserAction = (action: string, details?: Record<string, any>) => {
  faro.api.pushEvent('user_action', {
    action,
    timestamp: Date.now(),
    platform: 'react-native',
    ...details,
  });
};

export const trackPerformance = (metric: string, value: number, unit: string = 'ms') => {
  faro.api.pushMeasurement({
    type: 'performance',
    values: {
      [metric]: value,
    },
    attributes: {
      unit,
      platform: 'react-native',
      timestamp: Date.now(),
    },
  });
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  faro.api.pushError(error, {
    context: {
      platform: 'react-native',
      timestamp: Date.now(),
      ...context,
    },
  });
};

export const trackGesture = (gestureType: string, target: string, details?: Record<string, any>) => {
  faro.api.pushEvent('gesture', {
    gesture_type: gestureType,
    target,
    timestamp: Date.now(),
    platform: 'react-native',
    ...details,
  });
};

export const trackNetworkRequest = (url: string, method: string, status: number, duration: number) => {
  faro.api.pushEvent('network_request', {
    url,
    method,
    status,
    duration,
    timestamp: Date.now(),
    platform: 'react-native',
  });
};

export const setUserContext = (userId: string, attributes?: Record<string, any>) => {
  faro.api.setUser({
    id: userId,
    attributes: {
      platform: 'react-native',
      ...attributes,
    },
  });
};

export const addSessionAttribute = (key: string, value: any) => {
  faro.api.setSession({
    attributes: {
      [key]: value,
    },
  });
};

// Hook para rastreamento automático de navegação
export const useNavigationTracking = () => {
  const trackNavigation = (routeName: string, params?: any) => {
    trackScreenView(routeName, {
      navigation_params: params,
      navigation_timestamp: Date.now(),
    });
  };

  return { trackNavigation };
};

export default faro;