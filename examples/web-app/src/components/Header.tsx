import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { faroMetrics } from '../config/faro';

const Header: React.FC = () => {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  
  const handleLogoClick = () => {
    faroMetrics.recordClick('logo');
  };
  
  const handleNavClick = (navItem: string) => {
    faroMetrics.recordClick(`nav_${navItem}`);
  };
  
  const handleCartClick = () => {
    faroMetrics.recordClick('cart_icon');
  };
  
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link 
            to="/" 
            className="logo"
            onClick={handleLogoClick}
          >
            🛒 E-commerce Demo
          </Link>
          
          <nav className="nav">
            <Link 
              to="/" 
              onClick={() => handleNavClick('home')}
            >
              Início
            </Link>
            <Link 
              to="/products" 
              onClick={() => handleNavClick('products')}
            >
              Produtos
            </Link>
          </nav>
          
          <Link 
            to="/cart" 
            className="cart-icon"
            onClick={handleCartClick}
          >
            🛒
            {totalItems > 0 && (
              <span className="cart-count">{totalItems}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;