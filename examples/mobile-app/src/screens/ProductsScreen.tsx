import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, Loading } from '../components';
import { usePerformance, useGestureTracking } from '../hooks';
import { faro } from '../services/faro';
import type { ProductsScreenNavigationProp, Product } from '../types';

const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<ProductsScreenNavigationProp>();
  const { startMeasurement, endMeasurement, trackMetric } = usePerformance();
  const { trackButtonClick, trackFormInteraction, trackSearch } = useGestureTracking();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Track screen view
    faro.api.pushEvent('screen_view', {
      screen_name: 'Products',
      timestamp: Date.now(),
    });

    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

  const loadProducts = async () => {
    const measurementId = startMeasurement('products_load');
    
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Mock products data
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Smartphone Premium',
          price: 899.99,
          category: 'Electronics',
          description: 'Latest smartphone with advanced features and 5G connectivity',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: true,
        },
        {
          id: '2',
          name: 'Wireless Headphones',
          price: 199.99,
          category: 'Electronics',
          description: 'High-quality wireless headphones with noise cancellation',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: true,
        },
        {
          id: '3',
          name: 'Smart Watch',
          price: 299.99,
          category: 'Electronics',
          description: 'Advanced smartwatch with health tracking and GPS',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: false,
        },
        {
          id: '4',
          name: 'Running Shoes',
          price: 129.99,
          category: 'Sports',
          description: 'Comfortable running shoes for all terrains',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: true,
        },
        {
          id: '5',
          name: 'Yoga Mat',
          price: 39.99,
          category: 'Sports',
          description: 'Premium yoga mat with excellent grip and cushioning',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: true,
        },
        {
          id: '6',
          name: 'Coffee Maker',
          price: 89.99,
          category: 'Home',
          description: 'Automatic coffee maker with programmable timer',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: true,
        },
        {
          id: '7',
          name: 'Reading Lamp',
          price: 45.99,
          category: 'Home',
          description: 'Adjustable LED reading lamp with multiple brightness levels',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: false,
        },
        {
          id: '8',
          name: 'Backpack',
          price: 79.99,
          category: 'Fashion',
          description: 'Durable backpack with multiple compartments',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: true,
        },
      ];
      
      setProducts(mockProducts);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(mockProducts.map(p => p.category)));
      setCategories(['all', ...uniqueCategories]);
      
      // Track successful data load
      faro.api.pushEvent('data_load_success', {
        screen: 'Products',
        products_count: mockProducts.length,
        categories_count: uniqueCategories.length,
        load_time: Date.now(),
      });
      
      trackMetric('products_loaded', mockProducts.length);
      
    } catch (error) {
      console.error('Error loading products:', error);
      
      // Track error
      faro.api.pushError(error as Error, {
        context: 'products_load',
        screen: 'Products',
      });
      
      Alert.alert('Erro', 'Falha ao carregar produtos');
    } finally {
      setIsLoading(false);
      endMeasurement(measurementId);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
    
    // Track filter usage
    faro.api.pushEvent('filter_applied', {
      screen: 'Products',
      search_query: searchQuery,
      selected_category: selectedCategory,
      results_count: filtered.length,
      timestamp: Date.now(),
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    trackMetric('products_refresh', 1);
    
    faro.api.pushEvent('user_action', {
      action: 'refresh',
      screen: 'Products',
      timestamp: Date.now(),
    });
    
    await loadProducts();
    setIsRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    trackSearch(query, 'Products');
    trackFormInteraction('search', 'Products', { query_length: query.length });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    trackButtonClick('category_filter', 'Products', { category });
    
    faro.api.pushEvent('filter_interaction', {
      filter_type: 'category',
      filter_value: category,
      screen: 'Products',
    });
  };

  const handleProductPress = (product: Product) => {
    trackButtonClick('product_select', 'Products', { product_id: product.id });
    
    faro.api.pushEvent('product_interaction', {
      action: 'view_details',
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      product_category: product.category,
      screen: 'Products',
    });
    
    Alert.alert(
      product.name,
      `${product.description}\n\nPreço: R$ ${product.price.toFixed(2)}\nStatus: ${product.inStock ? 'Em estoque' : 'Fora de estoque'}`,
      [
        { text: 'Fechar', style: 'cancel' },
        {
          text: 'Adicionar ao Carrinho',
          onPress: () => handleAddToCart(product),
          disabled: !product.inStock,
        },
      ]
    );
  };

  const handleAddToCart = (product: Product) => {
    trackButtonClick('add_to_cart', 'Products', { product_id: product.id });
    
    faro.api.pushEvent('ecommerce_action', {
      action: 'add_to_cart',
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      screen: 'Products',
    });
    
    Alert.alert('Sucesso', `${product.name} foi adicionado ao carrinho!`);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Card
      title={item.name}
      content={`${item.description}\n\nPreço: R$ ${item.price.toFixed(2)}\nCategoria: ${item.category}\nStatus: ${item.inStock ? 'Em estoque' : 'Fora de estoque'}`}
      onPress={() => handleProductPress(item)}
    />
  );

  const renderCategoryButton = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.selectedCategoryButton,
      ]}
      onPress={() => handleCategorySelect(category)}
    >
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === category && styles.selectedCategoryButtonText,
        ]}
      >
        {category === 'all' ? 'Todos' : category}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading text="Carregando produtos..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* Category Filters */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={({ item }) => renderCategoryButton(item)}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Results Info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredProducts.length} produto(s) encontrado(s)
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
            <Button
              title="Limpar Filtros"
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              variant="outline"
              size="medium"
            />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategoryButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
  resultsInfo: {
    padding: 16,
    backgroundColor: '#fff',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  productsList: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ProductsScreen;