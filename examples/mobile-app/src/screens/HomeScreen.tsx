import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, Loading } from '../components';
import { usePerformance, useGestureTracking } from '../hooks';
import { faro } from '../services/faro';
import type { HomeScreenNavigationProp, Product } from '../types';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { startMeasurement, endMeasurement, trackMetric } = usePerformance();
  const { trackButtonClick, trackScroll } = useGestureTracking();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    // Track screen view
    faro.api.pushEvent('screen_view', {
      screen_name: 'Home',
      timestamp: Date.now(),
    });

    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    const measurementId = startMeasurement('home_data_load');
    
    try {
      setIsLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Smartphone Premium',
          price: 899.99,
          category: 'Electronics',
          description: 'Latest smartphone with advanced features',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: true,
        },
        {
          id: '2',
          name: 'Wireless Headphones',
          price: 199.99,
          category: 'Electronics',
          description: 'High-quality wireless headphones',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: true,
        },
        {
          id: '3',
          name: 'Smart Watch',
          price: 299.99,
          category: 'Electronics',
          description: 'Advanced smartwatch with health tracking',
          imageUrl: 'https://via.placeholder.com/150',
          inStock: false,
        },
      ];
      
      setFeaturedProducts(mockProducts);
      setStats({
        totalUsers: 1250,
        totalProducts: 45,
        totalOrders: 320,
      });
      
      // Track successful data load
      faro.api.pushEvent('data_load_success', {
        screen: 'Home',
        products_count: mockProducts.length,
        load_time: Date.now(),
      });
      
    } catch (error) {
      console.error('Error loading home data:', error);
      
      // Track error
      faro.api.pushError(error as Error, {
        context: 'home_data_load',
        screen: 'Home',
      });
      
      Alert.alert('Erro', 'Falha ao carregar dados da tela inicial');
    } finally {
      setIsLoading(false);
      endMeasurement(measurementId);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    trackMetric('home_refresh', 1);
    
    faro.api.pushEvent('user_action', {
      action: 'refresh',
      screen: 'Home',
      timestamp: Date.now(),
    });
    
    await loadHomeData();
    setIsRefreshing(false);
  };

  const handleNavigateToProducts = () => {
    trackButtonClick('navigate_to_products', 'Home');
    
    faro.api.pushEvent('navigation', {
      from: 'Home',
      to: 'Products',
      trigger: 'button_click',
    });
    
    navigation.navigate('Products');
  };

  const handleNavigateToProfile = () => {
    trackButtonClick('navigate_to_profile', 'Home');
    
    faro.api.pushEvent('navigation', {
      from: 'Home',
      to: 'Profile',
      trigger: 'button_click',
    });
    
    navigation.navigate('Profile');
  };

  const handleProductPress = (product: Product) => {
    trackButtonClick('product_card_press', 'Home', { product_id: product.id });
    
    faro.api.pushEvent('product_interaction', {
      action: 'view_details',
      product_id: product.id,
      product_name: product.name,
      screen: 'Home',
    });
    
    Alert.alert('Produto', `Você clicou em: ${product.name}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading text="Carregando dados..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
      onScroll={() => trackScroll('Home')}
      scrollEventThrottle={400}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.subtitle}>Explore nossos produtos em destaque</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Usuários</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Produtos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Pedidos</Text>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <Button
          title="Ver Produtos"
          onPress={handleNavigateToProducts}
          variant="primary"
          size="large"
        />
        <Button
          title="Meu Perfil"
          onPress={handleNavigateToProfile}
          variant="outline"
          size="large"
        />
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Produtos em Destaque</Text>
        {featuredProducts.map((product) => (
          <Card
            key={product.id}
            title={product.name}
            content={`${product.description}\n\nPreço: R$ ${product.price.toFixed(2)}\nStatus: ${product.inStock ? 'Em estoque' : 'Fora de estoque'}`}
            onPress={() => handleProductPress(product)}
          />
        ))}
      </View>
    </ScrollView>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  navigationContainer: {
    padding: 20,
    gap: 12,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
});

export default HomeScreen;