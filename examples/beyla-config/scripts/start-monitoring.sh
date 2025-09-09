#!/bin/bash

# Script para iniciar o ambiente de monitoramento Beyla
# POC Porto - Grafana Beyla Configuration

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker não está rodando. Por favor, inicie o Docker primeiro."
        exit 1
    fi
    log "Docker está rodando ✓"
}

# Verificar se Docker Compose está disponível
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        if ! docker compose version > /dev/null 2>&1; then
            error "Docker Compose não encontrado. Por favor, instale o Docker Compose."
            exit 1
        else
            DOCKER_COMPOSE="docker compose"
        fi
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    log "Docker Compose encontrado: $DOCKER_COMPOSE ✓"
}

# Limpar containers antigos
cleanup() {
    info "Limpando containers antigos..."
    $DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true
    
    # Remover volumes órfãos se solicitado
    if [[ "$1" == "--clean-volumes" ]]; then
        warn "Removendo volumes de dados..."
        docker volume prune -f 2>/dev/null || true
    fi
}

# Verificar portas disponíveis
check_ports() {
    local ports=("3000" "9090" "12345" "16686" "8080" "80")
    local busy_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
            busy_ports+=("$port")
        fi
    done
    
    if [[ ${#busy_ports[@]} -gt 0 ]]; then
        warn "As seguintes portas estão em uso: ${busy_ports[*]}"
        warn "Isso pode causar conflitos. Continue mesmo assim? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            error "Operação cancelada pelo usuário."
            exit 1
        fi
    fi
}

# Iniciar serviços
start_services() {
    log "Iniciando serviços de monitoramento..."
    
    # Construir imagens se necessário
    info "Construindo imagens..."
    $DOCKER_COMPOSE build --no-cache
    
    # Iniciar serviços em ordem
    info "Iniciando Prometheus..."
    $DOCKER_COMPOSE up -d prometheus
    sleep 5
    
    info "Iniciando Jaeger..."
    $DOCKER_COMPOSE up -d jaeger
    sleep 3
    
    info "Iniciando Alloy..."
    $DOCKER_COMPOSE up -d alloy
    sleep 5
    
    info "Iniciando aplicação de exemplo..."
    $DOCKER_COMPOSE up -d sample-app
    sleep 3
    
    info "Iniciando Beyla..."
    $DOCKER_COMPOSE up -d beyla
    sleep 5
    
    info "Iniciando Grafana..."
    $DOCKER_COMPOSE up -d grafana
    sleep 10
    
    info "Iniciando gerador de carga..."
    $DOCKER_COMPOSE up -d load-generator
    
    log "Todos os serviços foram iniciados! ✓"
}

# Verificar saúde dos serviços
check_health() {
    log "Verificando saúde dos serviços..."
    
    local services=("sample-app:80" "prometheus:9090" "grafana:3000" "alloy:12345" "jaeger:16686")
    local failed_services=()
    
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        info "Verificando $name..."
        if timeout 30 bash -c "until curl -sf http://localhost:$port/health 2>/dev/null || curl -sf http://localhost:$port/ 2>/dev/null || curl -sf http://localhost:$port 2>/dev/null; do sleep 1; done"; then
            log "$name está saudável ✓"
        else
            warn "$name não está respondendo"
            failed_services+=("$name")
        fi
    done
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        warn "Serviços com problemas: ${failed_services[*]}"
        warn "Verifique os logs com: $DOCKER_COMPOSE logs <service_name>"
    fi
}

# Mostrar URLs de acesso
show_urls() {
    echo ""
    log "🎉 Ambiente Beyla está rodando!"
    echo ""
    echo "📊 URLs de Acesso:"
    echo "   • Aplicação de Exemplo:  http://localhost:8080"
    echo "   • Grafana Dashboard:     http://localhost:3000 (admin/admin)"
    echo "   • Prometheus:            http://localhost:9090"
    echo "   • Alloy UI:              http://localhost:12345"
    echo "   • Jaeger UI:             http://localhost:16686"
    echo ""
    echo "📈 Dashboards Principais:"
    echo "   • Beyla RED Metrics:     http://localhost:3000/d/beyla-red-overview"
    echo "   • Infrastructure:        http://localhost:3000/dashboards"
    echo ""
    echo "🔧 Comandos Úteis:"
    echo "   • Ver logs:              $DOCKER_COMPOSE logs -f <service>"
    echo "   • Parar tudo:            $DOCKER_COMPOSE down"
    echo "   • Reiniciar serviço:     $DOCKER_COMPOSE restart <service>"
    echo "   • Status dos serviços:   $DOCKER_COMPOSE ps"
    echo ""
}

# Função principal
main() {
    echo "🚀 Iniciando POC Grafana Beyla"
    echo "================================"
    
    # Verificações iniciais
    check_docker
    check_docker_compose
    check_ports
    
    # Limpeza se solicitada
    if [[ "$1" == "--clean" ]] || [[ "$1" == "--clean-volumes" ]]; then
        cleanup "$1"
    fi
    
    # Iniciar serviços
    start_services
    
    # Verificar saúde
    check_health
    
    # Mostrar informações
    show_urls
    
    # Aguardar entrada do usuário para finalizar
    echo ""
    info "Pressione Ctrl+C para parar todos os serviços ou Enter para continuar em background..."
    read -r
    
    log "Serviços continuarão rodando em background."
    log "Use '$DOCKER_COMPOSE down' para parar todos os serviços."
}

# Tratamento de sinais
trap 'echo ""; warn "Interrompido pelo usuário. Parando serviços..."; $DOCKER_COMPOSE down; exit 0' INT TERM

# Executar função principal
main "$@"