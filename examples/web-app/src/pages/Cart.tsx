import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { faroLogger, faroMetrics, faroEvents } from '../config/faro';

const Cart: React.FC = () => {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    getTotalItems, 
    getTotalPrice 
  } = useCart();
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  
  useEffect(() => {
    // Medir tempo de carregamento da página
    const startTime = performance.now();
    
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      faroMetrics.recordPageLoad('cart', loadTime);
      
      faroLogger.info('Página Cart carregada', {
        loadTime: `${loadTime.toFixed(2)}ms`,
        itemsInCart: totalItems,
        cartValue: totalPrice,
        timestamp: new Date().toISOString()
      });
    };
    
    setTimeout(handleLoad, 100);
  }, [totalItems, totalPrice]);
  
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    
    updateQuantity(productId, newQuantity);
    faroMetrics.recordClick('quantity_update');
  };
  
  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    faroMetrics.recordClick('remove_item');
  };
  
  const handleClearCart = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o carrinho?')) {
      clearCart();
      faroMetrics.recordClick('clear_cart');
      faroLogger.info('Carrinho limpo pelo usuário', {
        itemsRemoved: totalItems,
        valueRemoved: totalPrice
      });
    }
  };
  
  const handleCheckout = () => {
    if (items.length === 0) return;
    
    // Registrar evento de checkout
    faroEvents.checkout(items, totalPrice);
    faroMetrics.recordClick('checkout_button');
    
    faroLogger.info('Checkout iniciado', {
      itemCount: totalItems,
      totalValue: totalPrice,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    });
    
    alert(`Checkout simulado!\n\nItens: ${totalItems}\nTotal: R$ ${totalPrice.toFixed(2)}\n\nEm uma aplicação real, você seria redirecionado para o pagamento.`);
  };
  
  if (items.length === 0) {
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
            <h1 style={{ color: '#7f8c8d', marginBottom: '1rem' }}>🛒 Seu Carrinho</h1>
            <p style={{ color: '#95a5a6', marginBottom: '2rem', fontSize: '1.2rem' }}>
              Seu carrinho está vazio
            </p>
            <Link 
              to="/products" 
              className="btn btn-primary"
              onClick={() => faroMetrics.recordClick('empty_cart_shop_now')}
            >
              🛍️ Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="main-content">
      <div className="container">
        <h1 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#2c3e50',
          fontSize: '2.5rem'
        }}>
          🛒 Seu Carrinho
        </h1>
        
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Cabeçalho do carrinho */}
          <div style={{
            background: '#ecf0f1',
            padding: '1rem',
            borderBottom: '1px solid #bdc3c7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
              {totalItems} {totalItems === 1 ? 'item' : 'itens'} no carrinho
            </span>
            <button
              className="btn btn-danger"
              onClick={handleClearCart}
              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
            >
              🗑️ Limpar Carrinho
            </button>
          </div>
          
          {/* Lista de itens */}
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
                  {item.name}
                </h3>
                <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                  {item.category}
                </p>
                <p style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  R$ {item.price.toFixed(2)} cada
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                {/* Controles de quantidade */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    style={{
                      width: '30px',
                      height: '30px',
                      padding: '0',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  
                  <span style={{
                    minWidth: '40px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}>
                    {item.quantity}
                  </span>
                  
                  <button
                    className="btn btn-primary"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    style={{
                      width: '30px',
                      height: '30px',
                      padding: '0',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
                
                {/* Subtotal */}
                <div style={{
                  minWidth: '100px',
                  textAlign: 'right'
                }}>
                  <p style={{
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    color: '#2c3e50'
                  }}>
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                
                {/* Botão remover */}
                <button
                  className="btn btn-danger"
                  onClick={() => handleRemoveItem(item.id)}
                  style={{
                    fontSize: '0.9rem',
                    padding: '0.5rem'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          
          {/* Total */}
          <div className="cart-total" style={{
            background: '#ecf0f1',
            padding: '1.5rem',
            borderTop: '2px solid #3498db'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                Total:
              </span>
              <span style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#27ae60'
              }}>
                R$ {totalPrice.toFixed(2)}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <Link 
                to="/products" 
                className="btn btn-primary"
                onClick={() => faroMetrics.recordClick('continue_shopping')}
              >
                🛍️ Continuar Comprando
              </Link>
              
              <button
                className="btn btn-success"
                onClick={handleCheckout}
                style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}
              >
                💳 Finalizar Compra
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;