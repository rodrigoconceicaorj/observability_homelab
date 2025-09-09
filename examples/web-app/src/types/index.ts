// Tipos para produtos
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: string;
  inStock: boolean;
}

// Tipos para itens do carrinho
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

// Tipos para o contexto do carrinho
export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Tipos para eventos de busca
export interface SearchEvent {
  query: string;
  timestamp: string;
  resultsCount: number;
}

// Tipos para métricas de performance
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  attributes?: Record<string, string | number>;
}

// Tipos para logs customizados
export interface CustomLog {
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
}