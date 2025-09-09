# 🚀 Início Rápido - POC Grafana Stack

## ⚡ Demonstração Imediata (Sem Docker)

### 🎯 O que você pode testar AGORA:

✅ **Aplicação Web está rodando**: http://localhost:3000  
✅ **Grafana Faro integrado** (coleta de métricas frontend)  
✅ **Navegação e interações** geram dados automaticamente  
✅ **Console do browser** mostra logs do Faro  

---

## 🔍 Como Verificar se Está Funcionando

### 1. **Aplicação Web**
- ✅ **URL**: http://localhost:3000
- ✅ **Status**: Rodando (servidor Vite ativo)
- ✅ **Faro**: Configurado e coletando dados

### 2. **Verificar Coleta de Dados**
1. **Abra**: http://localhost:3000
2. **DevTools**: F12 → Console
3. **Navegue** entre páginas
4. **Observe**: Logs do Faro no console

```javascript
// Você verá logs como:
[Faro] Session started
[Faro] Page view: /
[Faro] User interaction: click
[Faro] Core Web Vitals collected
```

---

## 🎮 Testando Funcionalidades

### 📊 **Métricas Automáticas**
- **Page Views**: Navegue entre Home → Products → About
- **Core Web Vitals**: Carregamento automático de métricas
- **User Interactions**: Cliques em botões e links
- **Performance**: Tempo de carregamento de páginas

### 🔍 **Eventos Customizados**
```javascript
// No console do browser, teste:
window.faro?.api.pushEvent('custom_event', {
  category: 'user_action',
  action: 'test_button_click',
  value: 1
});
```

### 📝 **Logs Estruturados**
```javascript
// Teste diferentes níveis de log:
console.log('Info: Teste de log normal');
console.warn('Warning: Teste de aviso');
console.error('Error: Teste de erro');
```

### 🚨 **Error Tracking**
```javascript
// Simule um erro para teste:
throw new Error('Erro de teste para demonstração');
```

---

## 📱 Exemplo Mobile (Opcional)

### Se você tem ambiente React Native:
```bash
cd examples/mobile-app
npm install

# iOS
npx react-native run-ios

# Android  
npx react-native run-android
```

---

## 🐳 Versão Completa com Docker

### Para experiência completa com Grafana, Prometheus, etc:

```bash
# 1. Instalar Docker Desktop
# 2. Iniciar serviços:
cd examples/alloy-config
docker-compose up -d

# 3. Acessar Grafana:
# http://localhost:3001 (admin/admin)
```

### URLs da Versão Completa:
| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Grafana** | http://localhost:3001 | admin/admin |
| **Prometheus** | http://localhost:9090 | - |
| **Alloy** | http://localhost:12345 | - |

---

## 🔧 Troubleshooting Rápido

### ❌ **Web app não carrega**
```bash
# Verificar se está rodando:
cd examples/web-app
npm run dev
```

### ❌ **Faro não funciona**
1. **F12 → Console** → Procurar erros
2. **Network tab** → Verificar requests
3. **Recarregar página** → Ctrl+F5

### ❌ **Docker não funciona**
- **Instalar**: Docker Desktop
- **Iniciar**: Docker Desktop app
- **Verificar**: `docker --version`

---

## 📚 Próximos Passos

1. **Explore**: Navegue pela aplicação web
2. **Monitore**: Observe logs no console
3. **Teste**: Execute os comandos JavaScript acima
4. **Docker**: Configure ambiente completo
5. **Leia**: `GUIA_UTILIZACAO.md` para detalhes

---

## 🎯 **Demonstração de 2 Minutos**

1. ✅ **Abra**: http://localhost:3000
2. ✅ **DevTools**: F12 → Console
3. ✅ **Navegue**: Clique em "Products" e "About"
4. ✅ **Observe**: Logs do Faro aparecendo
5. ✅ **Teste**: Execute `throw new Error('teste')` no console
6. ✅ **Resultado**: Erro capturado pelo Faro

**🎉 Parabéns! Sua POC está funcionando!**

---

*Para documentação completa, consulte: `GUIA_UTILIZACAO.md`*