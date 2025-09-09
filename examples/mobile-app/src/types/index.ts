// Tipos para navegação
export type RootStackParamList = {
  MainTabs: undefined;
  ProductDetail: { productId: string; productName: string };
};

export type MainTabParamList = {
  Home: undefined;
  Products: undefined;
  Profile: undefined;
};

// Tipos para produtos
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  rating: number;
}

// Tipos para usuário
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications: boolean;
  darkMode: boolean;
  language: string;
}

// Tipos para métricas e eventos
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface UserEvent {
  type: string;
  data: Record<string, any>;
  timestamp: number;
  screenName?: string;
}

export interface GestureEvent {
  type: 'tap' | 'swipe' | 'pinch' | 'long_press';
  target: string;
  coordinates?: { x: number; y: number };
  duration?: number;
}

// Tipos para configuração do Faro
export interface FaroConfig {
  url: string;
  app: {
    name: string;
    version: string;
    environment: string;
  };
  sessionTracking: {
    enabled: boolean;
    persistent: boolean;
  };
}

// Tipos para componentes
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}

// Tipos para API
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Tipos para estado da aplicação
export interface AppState {
  user: User | null;
  products: Product[];
  loading: boolean;
  error: string | null;
}

// Tipos para hooks customizados
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export interface UsePerformanceResult {
  startMeasurement: (name: string) => void;
  endMeasurement: (name: string) => number;
  trackMetric: (name: string, value: number, unit?: string) => void;
}