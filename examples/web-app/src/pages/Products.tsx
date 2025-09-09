import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { mockProducts } from '../data/products';
import { Product } from '../types';
import { faroLogger, faroMetrics } from '../config/faro';

const Products: React.FC = () => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  useEffect(() => {
    // Medir tempo de carregamento da página
    const startTime = performance.now();
    
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      faroMetrics.recordPageLoad('products', loadTime);
      
      faroLogger.info('Página Products carregada', {
        loadTime: `${loadTime.toFixed(2)}ms`,
        totalProducts: mockProducts.length,
        timestamp: new Date().toISOString()
      });
    };
    
    setTimeout(handleLoad, 100);
  }, []);
  
  useEffect(() => {
    // Filtrar produtos baseado na busca e categoria
    let filtered = mockProducts;
    
    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Filtro por busca
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
    
    // Log da filtragem
    faroLogger.info('Produtos filtrados', {
      searchQuery,
      selectedCategory,
      totalResults: filtered.length,
      originalTotal: mockProducts.length
    });
  }, [searchQuery, selectedCategory]);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    faroMetrics.recordClick(`category_filter_${category}`);
    
    faroLogger.info('Categoria selecionada', {
      category,
      previousCategory: selectedCategory
    });
  };
  
  // Obter categorias únicas
  const categories = ['all', ...Array.from(new Set(mockProducts.map(p => p.category)))];
  
  return (
    <div className="main-content">
      <div className="container">
        <h1 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#2c3e50',
          fontSize: '2.5rem'
        }}>
          🛍️ Nossos Produtos
        </h1>
        
        {/* Barra de busca */}
        <SearchBar 
          onSearch={handleSearch}
          placeholder="Buscar produtos por nome, categoria ou descrição..."
        />
        
        {/* Filtros de categoria */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {categories.map(category => (
            <button
              key={category}
              className={`btn ${
                selectedCategory === category ? 'btn-primary' : 'btn-secondary'
              }`}
              onClick={() => handleCategoryChange(category)}
              style={{
                backgroundColor: selectedCategory === category ? '#3498db' : '#bdc3c7',
                color: selectedCategory === category ? 'white' : '#2c3e50',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem'
              }}
            >
              {category === 'all' ? '🏷️ Todas' : `📦 ${category}`}
            </button>
          ))}
        </div>
        
        {/* Informações dos resultados */}
        <div style={{
          marginBottom: '2rem',
          textAlign: 'center',
          color: '#7f8c8d'
        }}>
          {searchQuery && (
            <p>
              Resultados para: <strong>"{searchQuery}"</strong>
            </p>
          )}
          <p>
            Mostrando {filteredProducts.length} de {mockProducts.length} produtos
            {selectedCategory !== 'all' && ` na categoria "${selectedCategory}"`}
          </p>
        </div>
        
        {/* Grid de produtos */}
        {filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#7f8c8d', marginBottom: '1rem' }}>😔 Nenhum produto encontrado</h3>
            <p style={{ color: '#95a5a6' }}>
              Tente ajustar sua busca ou selecionar uma categoria diferente.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                faroMetrics.recordClick('clear_filters');
                faroLogger.info('Filtros limpos pelo usuário');
              }}
              style={{ marginTop: '1rem' }}
            >
              🔄 Limpar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;