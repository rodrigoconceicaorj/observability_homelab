import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { faroEvents, faroMetrics } from '../config/faro';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  
  const handleProductView = () => {
    // Registrar visualização do produto
    faroEvents.productView(
      product.id,
      product.name,
      product.category
    );
    
    faroMetrics.recordClick('product_view_button');
  };
  
  const handleAddToCart = () => {
    if (product.inStock) {
      addItem(product);
      faroMetrics.recordClick('add_to_cart_button');
    }
  };
  
  // Registrar visualização quando o componente é montado
  React.useEffect(() => {
    handleProductView();
  }, [product.id]);
  
  const getCategoryEmoji = (category: string) => {
    switch (category.toLowerCase()) {
      case 'eletrônicos':
        return '📱';
      case 'áudio':
        return '🎧';
      case 'fotografia':
        return '📷';
      default:
        return '📦';
    }
  };
  
  return (
    <div className="product-card">
      <div className="product-image">
        {getCategoryEmoji(product.category)}
      </div>
      
      <h3 className="product-name">{product.name}</h3>
      
      <p className="product-category">{product.category}</p>
      
      <p className="product-price">
        R$ {product.price.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </p>
      
      <p style={{ 
        fontSize: '0.9rem', 
        color: '#7f8c8d', 
        marginBottom: '1rem',
        minHeight: '40px'
      }}>
        {product.description}
      </p>
      
      <button
        className={`btn ${product.inStock ? 'btn-success' : 'btn-danger'}`}
        onClick={handleAddToCart}
        disabled={!product.inStock}
        style={{
          width: '100%',
          opacity: product.inStock ? 1 : 0.6,
          cursor: product.inStock ? 'pointer' : 'not-allowed'
        }}
      >
        {product.inStock ? '🛒 Adicionar ao Carrinho' : '❌ Fora de Estoque'}
      </button>
    </div>
  );
};

export default ProductCard;