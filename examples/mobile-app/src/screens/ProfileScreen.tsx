import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, Loading } from '../components';
import { usePerformance, useGestureTracking } from '../hooks';
import { faro } from '../services/faro';
import type { ProfileScreenNavigationProp, User } from '../types';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { startMeasurement, endMeasurement, trackMetric } = usePerformance();
  const { trackButtonClick, trackFormInteraction, trackToggle } = useGestureTracking();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
  });
  const [preferences, setPreferences] = useState({
    notifications: true,
    darkMode: false,
    analytics: true,
    marketing: false,
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    favoriteProducts: 0,
    memberSince: '',
  });

  useEffect(() => {
    // Track screen view
    faro.api.pushEvent('screen_view', {
      screen_name: 'Profile',
      timestamp: Date.now(),
    });

    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const measurementId = startMeasurement('profile_load');
    
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const mockUser: User = {
        id: 'user_123',
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '+55 11 99999-9999',
        bio: 'Desenvolvedor apaixonado por tecnologia e inovação.',
        avatar: 'https://via.placeholder.com/100',
        createdAt: '2023-01-15',
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'pt-BR',
        },
      };
      
      setUser(mockUser);
      setFormData({
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone || '',
        bio: mockUser.bio || '',
      });
      setPreferences({
        notifications: mockUser.preferences?.notifications ?? true,
        darkMode: mockUser.preferences?.darkMode ?? false,
        analytics: true,
        marketing: false,
      });
      setStats({
        totalOrders: 15,
        totalSpent: 2450.75,
        favoriteProducts: 8,
        memberSince: 'Janeiro 2023',
      });
      
      // Track successful profile load
      faro.api.pushEvent('profile_loaded', {
        user_id: mockUser.id,
        load_time: Date.now(),
      });
      
      // Set user context in Faro
      faro.api.setUser({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.name,
      });
      
    } catch (error) {
      console.error('Error loading profile:', error);
      
      // Track error
      faro.api.pushError(error as Error, {
        context: 'profile_load',
        screen: 'Profile',
      });
      
      Alert.alert('Erro', 'Falha ao carregar perfil do usuário');
    } finally {
      setIsLoading(false);
      endMeasurement(measurementId);
    }
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    trackButtonClick('edit_profile_toggle', 'Profile', { edit_mode: !editMode });
    
    faro.api.pushEvent('profile_interaction', {
      action: editMode ? 'cancel_edit' : 'start_edit',
      screen: 'Profile',
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    const measurementId = startMeasurement('profile_save');
    setIsSaving(true);
    
    try {
      // Validate form data
      if (!formData.name.trim() || !formData.email.trim()) {
        Alert.alert('Erro', 'Nome e email são obrigatórios');
        return;
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user data
      const updatedUser: User = {
        ...user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        preferences: {
          ...user.preferences,
          notifications: preferences.notifications,
          darkMode: preferences.darkMode,
        },
      };
      
      setUser(updatedUser);
      setEditMode(false);
      
      // Track successful save
      faro.api.pushEvent('profile_updated', {
        user_id: user.id,
        fields_changed: Object.keys(formData).filter(
          key => formData[key as keyof typeof formData] !== (user as any)[key]
        ),
        save_time: Date.now(),
      });
      
      trackMetric('profile_saves', 1);
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Track error
      faro.api.pushError(error as Error, {
        context: 'profile_save',
        screen: 'Profile',
      });
      
      Alert.alert('Erro', 'Falha ao salvar perfil');
    } finally {
      setIsSaving(false);
      endMeasurement(measurementId);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    trackFormInteraction('profile_form', 'Profile', { field, value_length: value.length });
  };

  const handlePreferenceToggle = (preference: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [preference]: value }));
    trackToggle(preference, value, 'Profile');
    
    faro.api.pushEvent('preference_changed', {
      preference,
      value,
      screen: 'Profile',
    });
  };

  const handleLogout = () => {
    trackButtonClick('logout', 'Profile');
    
    Alert.alert(
      'Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            faro.api.pushEvent('user_logout', {
              user_id: user?.id,
              screen: 'Profile',
              timestamp: Date.now(),
            });
            
            // Clear user context
            faro.api.setUser({
              id: '',
              email: '',
              username: '',
            });
            
            Alert.alert('Logout', 'Você foi desconectado com sucesso!');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    trackButtonClick('delete_account', 'Profile');
    
    Alert.alert(
      'Excluir Conta',
      'Esta ação não pode ser desfeita. Tem certeza que deseja excluir sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            faro.api.pushEvent('account_deletion_requested', {
              user_id: user?.id,
              screen: 'Profile',
              timestamp: Date.now(),
            });
            
            Alert.alert('Solicitação Enviada', 'Sua solicitação de exclusão foi enviada e será processada em até 48 horas.');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading text="Carregando perfil..." />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro ao carregar perfil</Text>
        <Button
          title="Tentar Novamente"
          onPress={loadUserProfile}
          variant="primary"
          size="medium"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.memberSince}>Membro desde {stats.memberSince}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Pedidos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>R$ {stats.totalSpent.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Gasto</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.favoriteProducts}</Text>
          <Text style={styles.statLabel}>Favoritos</Text>
        </View>
      </View>

      {/* Profile Form */}
      <Card
        title="Informações Pessoais"
        content=""
        onPress={() => {}}
      >
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            <Button
              title={editMode ? 'Cancelar' : 'Editar'}
              onPress={handleEditToggle}
              variant={editMode ? 'outline' : 'primary'}
              size="small"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              editable={editMode}
              placeholder="Seu nome completo"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              editable={editMode}
              placeholder="seu@email.com"
              keyboardType="email-address"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefone</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              editable={editMode}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textArea, !editMode && styles.inputDisabled]}
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              editable={editMode}
              placeholder="Conte um pouco sobre você..."
              multiline
              numberOfLines={3}
            />
          </View>
          
          {editMode && (
            <Button
              title="Salvar Alterações"
              onPress={handleSaveProfile}
              variant="primary"
              size="large"
              loading={isSaving}
            />
          )}
        </View>
      </Card>

      {/* Preferences */}
      <Card title="Preferências" content="">
        <View style={styles.preferencesContainer}>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Notificações</Text>
            <Switch
              value={preferences.notifications}
              onValueChange={(value) => handlePreferenceToggle('notifications', value)}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Modo Escuro</Text>
            <Switch
              value={preferences.darkMode}
              onValueChange={(value) => handlePreferenceToggle('darkMode', value)}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Analytics</Text>
            <Switch
              value={preferences.analytics}
              onValueChange={(value) => handlePreferenceToggle('analytics', value)}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Marketing</Text>
            <Switch
              value={preferences.marketing}
              onValueChange={(value) => handlePreferenceToggle('marketing', value)}
            />
          </View>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          size="large"
        />
        
        <Button
          title="Excluir Conta"
          onPress={handleDeleteAccount}
          variant="outline"
          size="large"
        />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#999',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    padding: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  textArea: {
    height: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  preferencesContainer: {
    padding: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
});

export default ProfileScreen;