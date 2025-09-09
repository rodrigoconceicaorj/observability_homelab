import { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, CartContextType, Product } from '../types';
import { faroEvents, faroLogger } from '../config/faro';

// Ações do reducer
type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

// Estado inicial
interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: []
};

// Reducer do carrinho
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        // Se o item já existe, incrementa a quantidade
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      } else {
        // Se é um novo item, adiciona ao carrinho
        const newItem: CartItem = {
          id: action.payload.id,
          name: action.payload.name,
          price: action.payload.price,
          quantity: 1,
          category: action.payload.category
        };
        
        return {
          ...state,
          items: [...state.items, newItem]
        };
      }
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id)
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };
    
    default:
      return state;
  }
}

// Contexto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider do contexto
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  const addItem = (product: Product) => {
    try {
      dispatch({ type: 'ADD_ITEM', payload: product });
      
      // Log evento no Grafana Faro
      faroEvents.addToCart(
        product.id,
        product.name,
        product.price,
        1
      );
      
      faroLogger.info('Item adicionado ao carrinho', {
        productId: product.id,
        productName: product.name,
        price: product.price,
        category: product.category
      });
    } catch (error) {
      faroLogger.error('Erro ao adicionar item ao carrinho', error as Error, {
        productId: product.id,
        productName: product.name
      });
    }
  };
  
  const removeItem = (productId: string) => {
    try {
      const item = state.items.find(item => item.id === productId);
      
      if (item) {
        dispatch({ type: 'REMOVE_ITEM', payload: productId });
        
        // Log evento no Grafana Faro
        faroEvents.removeFromCart(item.id, item.name, item.quantity);
        
        faroLogger.info('Item removido do carrinho', {
          productId: item.id,
          productName: item.name
        });
      }
    } catch (error) {
      faroLogger.error('Erro ao remover item do carrinho', error as Error, {
        productId
      });
    }
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    try {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
      
      faroLogger.info('Quantidade atualizada no carrinho', {
        productId,
        newQuantity: quantity
      });
    } catch (error) {
      faroLogger.error('Erro ao atualizar quantidade', error as Error, {
        productId,
        quantity
      });
    }
  };
  
  const clearCart = () => {
    try {
      dispatch({ type: 'CLEAR_CART' });
      
      faroLogger.info('Carrinho limpo', {
        itemsRemoved: state.items.length
      });
    } catch (error) {
      faroLogger.error('Erro ao limpar carrinho', error as Error);
    }
  };
  
  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };
  
  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const value: CartContextType = {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook para usar o contexto
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}