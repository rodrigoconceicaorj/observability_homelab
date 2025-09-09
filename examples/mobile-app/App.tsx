import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { Loading } from './src/components';
import { initializeFaro, faro } from './src/services/faro';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsInitializing(true);
      setInitError(null);

      // Initialize Grafana Faro
      await initializeFaro();

      // Track app initialization
      faro.api.pushEvent('app_initialized', {
        platform: Platform.OS,
        version: Platform.Version,
        timestamp: Date.now(),
      });

      // Set initial session attributes
      faro.api.setSession({
        app_version: '1.0.0',
        platform: Platform.OS,
        device_info: {
          os: Platform.OS,
          version: Platform.Version.toString(),
        },
      });

      console.log('✅ Grafana Faro initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Grafana Faro:', error);
      setInitError('Falha ao inicializar sistema de monitoramento');
      
      // Even if Faro fails, we should still show the app
      // but log the error for debugging
    } finally {
      // Add a small delay to show the loading screen
      setTimeout(() => {
        setIsInitializing(false);
      }, 1000);
    }
  };

  const handleRetryInitialization = () => {
    initializeApp();
  };

  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={styles.loadingContainer}>
          <Loading text="Inicializando aplicação..." />
          <Text style={styles.loadingSubtext}>
            Configurando sistema de monitoramento
          </Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container}>
        {initError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              ⚠️ Sistema de monitoramento indisponível
            </Text>
          </View>
        )}
        <AppNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
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
    padding: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#fff3cd',
    borderBottomWidth: 1,
    borderBottomColor: '#ffeaa7',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});

export default App;