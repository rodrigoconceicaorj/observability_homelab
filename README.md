# POC Grafana Observability Stack

## 🎯 Objetivo
Prova de Conceito (POC) para implementação e análise do stack de observabilidade Grafana, incluindo:
- **Grafana Faro** (instrumentação web e mobile)
- **Grafana Beyla** (métricas RED automáticas via eBPF)
- **Grafana Alloy** (coletor de dados de observabilidade)

## 📋 Escopo da POC

### ✅ O que está incluído:
1. **📚 Documentação Técnica Detalhada** de cada ferramenta
2. **💻 Exemplos Práticos** de implementação
3. **⚙️ Guias de Configuração** step-by-step
4. **📊 Comparativo de Capacidades** e casos de uso
5. **🏗️ Arquitetura da Solução** integrada

### 🔍 Ferramentas Analisadas:

| Ferramenta | Propósito | Status |
|------------|-----------|--------|
| **Grafana Faro** | RUM (Real User Monitoring) para web/mobile | ✅ Documentado |
| **Grafana Beyla** | Auto-instrumentação eBPF para métricas RED | ✅ Documentado |
| **Grafana Alloy** | Coletor OpenTelemetry + Prometheus | ✅ Documentado |

## 📁 Estrutura do Projeto

```
poc-porto/
├── README.md                 # Este arquivo
├── FINDINGS.md              # 📊 Relatório final da POC
├── docs/                     # Documentação detalhada
│   ├── faro-research.md     # Pesquisa sobre Grafana Faro
│   ├── beyla-research.md    # Pesquisa sobre Grafana Beyla
│   └── alloy-research.md    # Pesquisa sobre Grafana Alloy
├── examples/                 # Exemplos práticos
│   ├── web-app/             # ✅ Exemplo com Grafana Faro (Web)
│   ├── mobile-app/          # ✅ Exemplo com Grafana Faro (Mobile)
│   ├── beyla-config/        # ✅ Exemplo com Grafana Beyla
│   └── alloy-config/        # ✅ Exemplo com Grafana Alloy
└── scripts/                  # Scripts utilitários
```

## 🚀 Como Usar Esta POC

### 1. 📊 Ler o Relatório Final
**COMECE AQUI**: Leia o [**FINDINGS.md**](./FINDINGS.md) para ver todas as conclusões, análises e recomendações da POC.

### 2. 📚 Explorar a Documentação
Leia os arquivos de pesquisa em `/docs/` para entender as capacidades de cada ferramenta:
- [Grafana Faro Research](./docs/faro-research.md)
- [Grafana Beyla Research](./docs/beyla-research.md) 
- [Grafana Alloy Research](./docs/alloy-research.md)

### 3. 🧪 Executar os Exemplos
Cada pasta em `/examples/` contém um exemplo funcional com instruções detalhadas:

| Exemplo | Descrição | Status |
|---------|-----------|--------|
| [**Web App**](./examples/web-app/) | Grafana Faro em aplicação React | ✅ Completo |
| [**Mobile App**](./examples/mobile-app/) | Grafana Faro em React Native | ✅ Completo |
| [**Beyla Config**](./examples/beyla-config/) | Coleta automática de métricas | ✅ Completo |
| [**Alloy Config**](./examples/alloy-config/) | Coleta centralizada de dados | ✅ Completo |

### 4. 🔧 Adaptar para Seu Contexto
Use os exemplos como base para implementar observabilidade em suas próprias aplicações.

```