# 🚀 POC Grafana Faro - Aplicação Web de Demonstração

Esta é uma aplicação React de demonstração que mostra como integrar o **Grafana Faro** para observabilidade completa de aplicações web frontend.

## 📋 Funcionalidades Demonstradas

### 🔍 Observabilidade com Grafana Faro
- **Logs Automáticos**: Captura automática de logs de console, erros e eventos customizados
- **Métricas Web Vitals**: Coleta automática de Core Web Vitals (LCP, FID, CLS)
- **Tracing Distribuído**: Rastreamento automático de requisições HTTP e navegação
- **Eventos Customizados**: Eventos de negócio como visualização de produtos, carrinho, checkout
- **Métricas Customizadas**: Tempo de carregamento, cliques, performance de API
- **Error Boundary**: Captura e logging de erros React não tratados

### 🛒 Aplicação de E-commerce
- Página inicial com informações da POC
- Catálogo de produtos com busca e filtros
- Carrinho de compras funcional
- Navegação entre páginas
- Componentes reutilizáveis

## 🛠️ Tecnologias Utilizadas

- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **React Router** para navegação
- **Grafana Faro Web SDK** para observabilidade
- **CSS3** para estilização

## 📦 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Grafana Alloy configurado e rodando (veja [guia de configuração](../../docs/06-guia-configuracao.md))

## 🚀 Setup Rápido

### 1. Instalar Dependências

```bash
cd examples/web-app
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações se necessário
# O arquivo .env já vem com configurações padrão funcionais
```

### 3. Iniciar Aplicação

```bash
npm run dev
```

A aplicação estará disponível em: http://localhost:3000

## ⚙️ Configuração do Grafana Faro

### Variáveis de Ambiente Principais

```env
# URL do Grafana Alloy (obrigatório)
VITE_FARO_URL=http://localhost:12345/collect

# Informações da aplicação
VITE_APP_NAME=POC Grafana Faro Web
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
```

### Configurações Avançadas

```env
# Taxa de amostragem (0.0 a 1.0)
VITE_FARO_TRACE_SAMPLE_RATE=1.0
VITE_FARO_SESSION_SAMPLE_RATE=1.0

# Instrumentações específicas
VITE_FARO_ENABLE_CONSOLE=true
VITE_FARO_ENABLE_ERRORS=true
VITE_FARO_ENABLE_WEBVITALS=true
VITE_FARO_ENABLE_TRACING=true

# Debug mode
VITE_FARO_DEBUG=true
```

## 📊 Dados Coletados

### 🔍 Logs Automáticos
- Inicialização da aplicação
- Navegação entre páginas
- Operações do carrinho
- Buscas e filtros
- Erros e warnings

### 📈 Métricas Coletadas
- **Performance**: Tempo de carregamento de páginas
- **Interação**: Cliques em botões e links
- **API**: Tempo de resposta (simulado)
- **Web Vitals**: LCP, FID, CLS, TTFB

### 🎯 Eventos de Negócio
- `product_view`: Visualização de produto
- `add_to_cart`: Adição ao carrinho
- `remove_from_cart`: Remoção do carrinho
- `checkout_start`: Início do checkout
- `search_performed`: Busca realizada
- `category_selected`: Categoria selecionada

### 🔗 Traces Distribuídos
- Navegação entre páginas
- Requisições HTTP (simuladas)
- Operações assíncronas
- Interações do usuário

## 🧪 Testando a Integração

### 1. Verificar Logs no Console
Abra o DevTools e veja os logs do Faro sendo enviados:

```javascript
// Logs aparecem como:
[Faro] Sending log: {...}
[Faro] Sending event: {...}
[Faro] Sending metric: {...}
```

### 2. Testar Funcionalidades

1. **Navegação**: Navegue entre páginas (Home → Products → Cart)
2. **Busca**: Use a barra de busca na página de produtos
3. **Carrinho**: Adicione/remova produtos do carrinho
4. **Filtros**: Filtre produtos por categoria
5. **Erros**: Force um erro para testar o Error Boundary

### 3. Verificar Dados no Grafana

Se o Grafana Alloy estiver configurado corretamente, os dados aparecerão em:
- **Logs**: Explore → Logs
- **Traces**: Explore → Traces
- **Métricas**: Explore → Metrics

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Header.tsx       # Cabeçalho com navegação
│   ├── ProductCard.tsx  # Card de produto
│   └── SearchBar.tsx    # Barra de busca
├── pages/              # Páginas da aplicação
│   ├── Home.tsx        # Página inicial
│   ├── Products.tsx    # Catálogo de produtos
│   └── Cart.tsx        # Carrinho de compras
├── context/            # Contextos React
│   └── CartContext.tsx # Contexto do carrinho
├── config/             # Configurações
│   └── faro.ts         # Configuração do Grafana Faro
├── data/               # Dados mockados
│   └── products.ts     # Produtos de exemplo
├── types/              # Tipos TypeScript
│   └── index.ts        # Definições de tipos
├── App.tsx             # Componente principal
├── main.tsx            # Ponto de entrada
└── index.css           # Estilos globais
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

## 🐛 Troubleshooting

### Problema: Dados não aparecem no Grafana

1. **Verificar URL do Alloy**:
   ```bash
   curl http://localhost:12345/collect
   ```

2. **Verificar logs no console**:
   - Abra DevTools → Console
   - Procure por logs do Faro
   - Verifique erros de rede

3. **Verificar configuração**:
   - Confirme que `VITE_FARO_URL` está correto
   - Verifique se Alloy está rodando

### Problema: Aplicação não inicia

1. **Limpar cache**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Verificar versão do Node**:
   ```bash
   node --version  # Deve ser 18+
   ```

### Problema: Tipos TypeScript

1. **Reinstalar tipos**:
   ```bash
   npm install --save-dev @types/react @types/react-dom
   ```

## 📚 Próximos Passos

1. **Configurar Grafana Alloy** (veja [guia](../../docs/06-guia-configuracao.md))
2. **Implementar exemplo mobile** com React Native
3. **Configurar Grafana Beyla** para observabilidade backend
4. **Criar dashboards** personalizados no Grafana
5. **Configurar alertas** baseados nas métricas coletadas

## 📖 Documentação Adicional

- [Grafana Faro](../../docs/01-grafana-faro.md)
- [Guia de Configuração](../../docs/06-guia-configuracao.md)
- [Arquitetura da Solução](../../docs/05-arquitetura-solucao.md)

## 🤝 Contribuindo

Esta é uma POC para demonstração. Para melhorias:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

---

**🎯 Objetivo**: Demonstrar as capacidades do Grafana Faro para observabilidade frontend completa, incluindo logs, métricas, traces e eventos customizados em uma aplicação React real.