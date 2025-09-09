import React, { useState } from 'react';
import { faroEvents, faroMetrics } from '../config/faro';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Buscar produtos..." 
}) => {
  const [query, setQuery] = useState('');
  
  const handleSearch = (searchQuery: string) => {
    // Simular contagem de resultados (em uma aplicação real, viria da API)
    const mockResultsCount = searchQuery.length > 0 ? Math.floor(Math.random() * 10) + 1 : 0;
    
    // Registrar evento de busca no Grafana Faro
    if (searchQuery.trim()) {
      faroEvents.search(searchQuery.trim(), mockResultsCount);
      faroMetrics.recordClick('search_performed');
    }
    
    onSearch(searchQuery);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Busca em tempo real (debounce seria ideal em produção)
    handleSearch(newQuery);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      faroMetrics.recordClick('search_enter_key');
      handleSearch(query);
    }
  };
  
  const handleFocus = () => {
    faroMetrics.recordClick('search_input_focus');
  };
  
  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={handleFocus}
      />
    </div>
  );
};

export default SearchBar;