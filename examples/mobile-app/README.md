# POC Grafana Faro - Mobile App (React Native)

Este é um exemplo de aplicação React Native integrada com **Grafana Faro** para demonstrar as capacidades de observabilidade em aplicações mobile.

## 📱 Sobre a Aplicação

A aplicação demonstra:
- **Tracking de eventos customizados** (navegação, interações, ações do usuário)
- **Métricas de performance** (tempo de carregamento, renderização)
- **Monitoramento de erros** e exceções
- **Rastreamento de gestos** e interações mobile específicas
- **Correlação de dados** entre frontend e backend
- **Contexto de usuário** e sessão

## 🏗️ Arquitetura

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Button.tsx      # Botão com tracking integrado
│   ├── Card.tsx        # Card com eventos de interação
│   └── Loading.tsx     # Componente de carregamento
├── hooks/              # Hooks customizados
│   ├── usePerformance.ts    # Métricas de performance
│   └── useGestureTracking.ts # Tracking de gestos
├── navigation/         # Configuração de navegação
│   └── AppNavigator.tsx # Navegação com tracking
├── screens/            # Telas da aplicação
│   ├── HomeScreen.tsx  # Tela inicial
│   ├── ProductsScreen.tsx # Lista de produtos
│   └── ProfileScreen.tsx  # Perfil do usuário
├── services/           # Serviços
│   └── faro.ts        # Configuração do Grafana Faro
└── types/             # Definições de tipos TypeScript
    └── index.ts       # Tipos da aplicação
```

## 🚀 Pré-requisitos

### Ambiente de Desenvolvimento
- **Node.js** 18+ 
- **npm** ou **yarn**
- **React Native CLI** ou **Expo CLI**
- **Android Studio** (para Android)
- **Xcode** (para iOS - apenas macOS)

### Configuração do Ambiente React Native

Siga o guia oficial: [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)

#### Android
1. Instale o Android Studio
2. Configure as variáveis de ambiente:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

#### iOS (macOS apenas)
1. Instale o Xcode via App Store
2. Instale as ferramentas de linha de comando:
   ```bash
   xcode-select --install
   ```
3. Instale CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```

## 📦 Instalação

1. **Clone o repositório** (se ainda não fez):
   ```bash
   git clone <repository-url>
   cd poc-porto/examples/mobile-app
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure o iOS** (apenas macOS):
   ```bash
   cd ios && pod install && cd ..
   ```

## ⚙️ Configuração

### 1. Configuração do Grafana Alloy

Antes de executar a aplicação, certifique-se de que o **Grafana Alloy** está rodando e configurado para receber dados do Faro.

Verifique o arquivo `src/services/faro.ts` e ajuste a URL do Alloy:

```typescript
const faroConfig = {
  url: 'http://localhost:12345/collect', // Ajuste para sua URL do Alloy
  app: {
    name: 'poc-mobile-app',
    version: '1.0.0',
  },
};
```

### 2. Configuração de Rede

#### Android
Para acessar o Alloy rodando no host local, use:
- **Emulador Android**: `http://10.0.2.2:12345/collect`
- **Dispositivo físico**: `http://<IP_DO_SEU_COMPUTADOR>:12345/collect`

#### iOS
Para acessar o Alloy rodando no host local:
- **Simulador iOS**: `http://localhost:12345/collect`
- **Dispositivo físico**: `http://<IP_DO_SEU_COMPUTADOR>:12345/collect`

### 3. Permissões de Rede (Android)

O arquivo `android/app/src/main/AndroidManifest.xml` já inclui as permissões necessárias:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 🏃‍♂️ Execução

### Desenvolvimento

1. **Inicie o Metro bundler**:
   ```bash
   npm start
   # ou
   yarn start
   ```

2. **Execute no Android**:
   ```bash
   # Em outro terminal
   npm run android
   # ou
   yarn android
   ```

3. **Execute no iOS** (macOS apenas):
   ```bash
   # Em outro terminal
   npm run ios
   # ou
   yarn ios
   ```

### Comandos Disponíveis

```bash
# Desenvolvimento
npm start          # Inicia o Metro bundler
npm run android    # Executa no Android
npm run ios        # Executa no iOS

# Build
npm run build:android  # Build para Android
npm run build:ios      # Build para iOS

# Linting e Type Checking
npm run lint       # ESLint
npm run type-check # TypeScript check

# Testes
npm test           # Executa testes
npm run test:watch # Testes em modo watch
```

## 📊 Funcionalidades de Observabilidade

### 1. Eventos Customizados

A aplicação rastreia diversos eventos:

```typescript
// Visualização de tela
faro.api.pushEvent('screen_view', {
  screen_name: 'Home',
  timestamp: Date.now(),
});

// Interações do usuário
faro.api.pushEvent('user_action', {
  action: 'button_click',
  element: 'navigate_to_products',
  screen: 'Home',
});

// Eventos de e-commerce
faro.api.pushEvent('ecommerce_action', {
  action: 'add_to_cart',
  product_id: '123',
  product_name: 'Smartphone',
  product_price: 899.99,
});
```

### 2. Métricas de Performance

```typescript
// Tempo de carregamento
const measurementId = startMeasurement('data_load');
// ... operação assíncrona
endMeasurement(measurementId);

// Métricas customizadas
trackMetric('products_loaded', 10);
trackMetric('user_engagement', 1);
```

### 3. Tracking de Gestos

```typescript
// Gestos mobile específicos
trackTouch('product_card', { x: 100, y: 200 });
trackSwipe('left', 'ProductsList');
trackLongPress('menu_button');
trackPinch('zoom_in', 1.5);
```

### 4. Contexto de Usuário

```typescript
// Definir contexto do usuário
faro.api.setUser({
  id: 'user_123',
  email: 'user@example.com',
  username: 'João Silva',
});

// Atributos de sessão
faro.api.setSession({
  app_version: '1.0.0',
  platform: 'android',
  device_info: { ... },
});
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Alloy
```
Network request failed: Unable to connect to Alloy
```

**Soluções:**
- Verifique se o Alloy está rodando
- Confirme a URL no arquivo `faro.ts`
- Para Android, use `10.0.2.2` em vez de `localhost`
- Verifique as permissões de rede

#### 2. Metro bundler não inicia
```
Error: ENOSPC: System limit for number of file watchers reached
```

**Solução (Linux):**
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### 3. Erro de Build Android
```
Execution failed for task ':app:installDebug'
```

**Soluções:**
- Limpe o projeto: `cd android && ./gradlew clean && cd ..`
- Reinicie o ADB: `adb kill-server && adb start-server`
- Verifique se o emulador/dispositivo está conectado: `adb devices`

#### 4. Erro de Build iOS
```
CocoaPods could not find compatible versions for pod
```

**Soluções:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Logs e Debug

#### Visualizar logs do dispositivo:

**Android:**
```bash
adb logcat | grep -i "ReactNativeJS\|Faro"
```

**iOS:**
```bash
# Use o Xcode ou
npx react-native log-ios
```

#### Debug do Faro:

Adicione logs no arquivo `faro.ts`:

```typescript
const faro = initializeFaro({
  // ... configuração
  beforeSend: (event) => {
    console.log('📊 Faro Event:', event);
    return event;
  },
});
```

## 📈 Monitoramento

### Dashboards Recomendados

1. **Mobile App Overview**
   - Sessões ativas
   - Telas mais visitadas
   - Tempo médio por sessão
   - Taxa de erro

2. **Performance Metrics**
   - Tempo de carregamento por tela
   - Métricas de renderização
   - Uso de memória
   - Crashes e erros

3. **User Behavior**
   - Fluxo de navegação
   - Interações mais comuns
   - Conversão de e-commerce
   - Abandono de carrinho

### Alertas Sugeridos

- Taxa de erro > 5%
- Tempo de carregamento > 3s
- Crash rate > 1%
- Queda significativa em sessões

## 🤝 Contribuição

Para contribuir com este exemplo:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Implemente suas mudanças
4. Adicione testes se necessário
5. Envie um pull request

## 📚 Recursos Adicionais

- [Documentação do Grafana Faro](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Grafana Alloy Documentation](https://grafana.com/docs/alloy/)

## 📄 Licença

Este projeto é parte de uma POC (Proof of Concept) e é fornecido como exemplo educacional.