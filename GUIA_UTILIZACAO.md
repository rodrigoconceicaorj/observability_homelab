# 📊 Guia de Utilização - POC Grafana Stack

## 🎯 Visão Geral

Este guia prático te ajudará a navegar e utilizar todos os componentes da POC do Grafana Stack para observabilidade completa.

## 🔍 1. Verificação de Status da POC

### ✅ Verificar se a POC está funcionando

```bash
# 1. Verificar se o exemplo web está rodando
cd examples/web-app
npm run dev
# Deve abrir em: http://localhost:3000

# 2. Verificar se o Docker está rodando (para Beyla e Alloy)
docker ps

# 3. Verificar logs dos containers
docker-compose logs -f
```

### 🌐 URLs de Acesso Rápido

| Componente | URL | Descrição |
|------------|-----|----------|
| **Web App** | http://localhost:3000 | Aplicação web com Faro |
| **Grafana** | http://localhost:3001 | Dashboard principal |
| **Prometheus** | http://localhost:9090 | Métricas |
| **Loki** | http://localhost:3100 | Logs |
| **Jaeger** | http://localhost:16686 | Traces |

---

## 🚀 2. Acesso aos Componentes

### 📱 **Grafana Faro - Web App**

#### Como Iniciar:
```bash
cd examples/web-app
npm install
npm run dev
```

#### Como Usar:
1. **Acesse**: http://localhost:3000
2. **Navegue pelas páginas**: Home → Products → About
3. **Interaja com elementos**: Clique em botões, formulários
4. **Gere eventos**: Cada ação gera métricas automáticas

#### Funcionalidades Disponíveis:
- ✅ **Real User Monitoring (RUM)**
- ✅ **Core Web Vitals** (LCP, FID, CLS)
- ✅ **Navegação entre páginas**
- ✅ **Eventos customizados**
- ✅ **Logs estruturados**
- ✅ **Error tracking**

### 📱 **Grafana Faro - Mobile App**

#### Como Iniciar:
```bash
cd examples/mobile-app
npm install

# Para iOS
npx react-native run-ios

# Para Android
npx react-native run-android
```

#### Funcionalidades Mobile:
- ✅ **Gestos e toques**
- ✅ **Navegação entre telas**
- ✅ **Performance de renderização**
- ✅ **Crashes e erros**
- ✅ **Métricas de rede**

### 🔧 **Grafana Beyla - Métricas Automáticas**

#### Como Iniciar:
```bash
cd examples/beyla-config
docker-compose up -d
```

#### Como Verificar:
1. **Status**: `docker-compose ps`
2. **Logs**: `docker-compose logs beyla`
3. **Métricas**: http://localhost:9090/targets

#### Funcionalidades:
- ✅ **Métricas RED** (Rate, Errors, Duration)
- ✅ **HTTP requests automáticos**
- ✅ **Database queries**
- ✅ **gRPC calls**
- ✅ **Zero instrumentação manual**

### 🔄 **Grafana Alloy - Hub Central**

#### Como Iniciar:
```bash
cd examples/alloy-config
docker-compose up -d
```

#### Como Verificar:
1. **UI do Alloy**: http://localhost:12345
2. **Configuração**: `cat alloy.river`
3. **Status dos targets**: Grafana → Data Sources

#### Funcionalidades:
- ✅ **Coleta centralizada**
- ✅ **Roteamento de dados**
- ✅ **Transformação de métricas**
- ✅ **Service discovery**
- ✅ **Multi-tenant**

---

## 🎛️ 3. Navegação no Grafana

### 🔐 Credenciais de Acesso
- **URL**: http://localhost:3001
- **Usuário**: `admin`
- **Senha**: `admin`

### 📊 Dashboards Principais

#### 1. **Frontend Observability**
- **Localização**: Dashboards → Frontend
- **Métricas**: Core Web Vitals, Page Views, Errors
- **Como usar**: Navegue na web app e veja métricas em tempo real

#### 2. **Backend Performance**
- **Localização**: Dashboards → Backend
- **Métricas**: RED metrics, Database performance
- **Como usar**: Execute APIs e veja latência/throughput

#### 3. **Infrastructure Overview**
- **Localização**: Dashboards → Infrastructure
- **Métricas**: CPU, Memory, Network
- **Como usar**: Monitore recursos do sistema

### 🔍 Explorando Dados

#### **Explore → Prometheus**
```promql
# Exemplos de queries úteis:

# Taxa de requests HTTP
rate(http_requests_total[5m])

# Latência P95
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Taxa de erro
rate(http_requests_total{status=~"5.."}[5m])
```

#### **Explore → Loki**
```logql
# Exemplos de queries de logs:

# Logs de erro
{level="error"}

# Logs por aplicação
{app="web-app"} |= "error"

# Logs com filtro de tempo
{service="api"} | json | status >= 400
```

#### **Explore → Jaeger**
- **Service**: Selecione o serviço
- **Operation**: Escolha a operação
- **Tags**: Filtre por tags específicas

---

## 🛠️ 4. Funcionalidades Práticas

### 📈 **Monitoramento em Tempo Real**

1. **Abra o Grafana**: http://localhost:3001
2. **Vá para Dashboard → Frontend**
3. **Em outra aba, abra**: http://localhost:3000
4. **Navegue na aplicação** e veja métricas atualizando

### 🚨 **Simulando Problemas**

#### Gerar Erros 404:
```bash
# Na web app, acesse URLs inexistentes
curl http://localhost:3000/pagina-inexistente
```

#### Gerar Latência:
```bash
# Simule requests lentos
curl "http://localhost:3000/api/slow-endpoint"
```

#### Gerar Logs de Erro:
```javascript
// No console do browser
console.error('Erro simulado para teste');
throw new Error('Erro de teste');
```

### 📊 **Criando Alertas**

1. **Grafana → Alerting → Alert Rules**
2. **New Rule**
3. **Configure condições**:
   ```promql
   # Alerta para alta taxa de erro
   rate(http_requests_total{status=~"5.."}[5m]) > 0.1
   ```
4. **Defina notificações** (Slack, email, etc.)

---

## 🔧 5. Troubleshooting

### ❌ **Problemas Comuns**

#### **Web app não carrega**
```bash
# Verificar se porta está ocupada
netstat -an | findstr :3000

# Reinstalar dependências
cd examples/web-app
rm -rf node_modules package-lock.json
npm install
```

#### **Docker containers não sobem**
```bash
# Verificar Docker
docker --version
docker-compose --version

# Limpar containers antigos
docker-compose down
docker system prune -f
docker-compose up -d
```

#### **Grafana não mostra dados**
```bash
# Verificar data sources
# Grafana → Configuration → Data Sources
# Testar conexão com Prometheus/Loki

# Verificar se Alloy está coletando
curl http://localhost:12345/metrics
```

#### **Métricas não aparecem**
```bash
# Verificar se Faro está configurado
# Browser → DevTools → Network → Procurar requests para Faro

# Verificar configuração
cat examples/web-app/.env
```

### 🔍 **Logs de Debug**

```bash
# Logs do Alloy
docker-compose logs alloy

# Logs do Beyla
docker-compose logs beyla

# Logs do Grafana
docker-compose logs grafana

# Logs da aplicação web
cd examples/web-app
npm run dev -- --verbose
```

---

## 📚 6. Exemplos Práticos de Uso

### 🎯 **Cenário 1: Monitorar Performance de Página**

1. **Abra**: http://localhost:3001 (Grafana)
2. **Dashboard**: Frontend Observability
3. **Abra**: http://localhost:3000 (Web App)
4. **Navegue** entre páginas múltiplas vezes
5. **Observe**: Core Web Vitals, Page Load Time

### 🎯 **Cenário 2: Detectar Erros de API**

1. **Simule erro**: `curl http://localhost:3000/api/error`
2. **Grafana**: Backend Performance Dashboard
3. **Observe**: Error rate aumentando
4. **Explore**: Logs no Loki para detalhes

### 🎯 **Cenário 3: Análise de Traces**

1. **Execute**: Várias operações na web app
2. **Jaeger**: http://localhost:16686
3. **Selecione**: Service "web-app"
4. **Analise**: Trace completo da requisição

### 🎯 **Cenário 4: Monitoramento Mobile**

1. **Inicie**: App mobile no simulador
2. **Navegue**: Entre telas diferentes
3. **Grafana**: Mobile Performance Dashboard
4. **Observe**: Métricas específicas mobile

---

## 🚀 7. Próximos Passos

### 📈 **Expandir Monitoramento**
- Adicionar mais aplicações
- Configurar alertas personalizados
- Integrar com sistemas externos

### 🔧 **Customizar Dashboards**
- Criar dashboards específicos
- Adicionar painéis customizados
- Configurar variáveis dinâmicas

### 🎯 **Otimizar Performance**
- Ajustar configurações de coleta
- Implementar sampling
- Configurar retenção de dados

---

## 📞 **Suporte**

Para dúvidas ou problemas:
1. Consulte os READMEs específicos em cada pasta `examples/`
2. Verifique os logs de debug
3. Consulte a documentação oficial do Grafana

**Documentação Técnica Completa**: `FINDINGS.md` e `TECH_LEAD_SUMMARY.md`

---

*✨ Agora você está pronto para explorar todo o poder da observabilidade com o Grafana Stack!*