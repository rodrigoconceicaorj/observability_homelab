#!/bin/bash

# Grafana Beyla - Load Generator Script
# Gera tráfego para demonstrar coleta de métricas

set -e

# Configurações
BASE_URL="http://localhost:8080"
DURATION=${1:-300}  # Duração em segundos (padrão: 5 minutos)
CONCURRENCY=${2:-5} # Número de workers paralelos
VERBOSE=${3:-false}

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
}

# Verificar se a aplicação está rodando
check_app() {
    log "Verificando se a aplicação está disponível..."
    if ! curl -s "$BASE_URL/health" > /dev/null; then
        error "Aplicação não está disponível em $BASE_URL"
        error "Execute: docker-compose up -d"
        exit 1
    fi
    log "✅ Aplicação disponível"
}

# Endpoints para testar
declare -a ENDPOINTS=(
    "/health:GET:200"                    # Health check
    "/api/users:GET:200"                 # Lista usuários
    "/api/users/1:GET:200"               # Usuário específico
    "/api/products:GET:200"              # Lista produtos
    "/api/products/1:GET:200"            # Produto específico
    "/api/login:POST:200"                # Login
    "/api/slow:GET:200"                  # Endpoint lento
    "/api/error:GET:500"                 # Erro 500
    "/nonexistent:GET:404"               # Erro 404
    "/api/large:GET:200"                 # Resposta grande
)

# Função para fazer requisição
make_request() {
    local endpoint_info="$1"
    local worker_id="$2"
    
    IFS=':' read -r path method expected_status <<< "$endpoint_info"
    local url="$BASE_URL$path"
    
    local start_time=$(date +%s.%N)
    
    if [ "$method" = "POST" ]; then
        if [ "$path" = "/api/login" ]; then
            response=$(curl -s -w "%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -d '{"username":"user'$worker_id'","password":"pass123"}' \
                "$url" 2>/dev/null || echo "000")
        else
            response=$(curl -s -w "%{http_code}" -X POST "$url" 2>/dev/null || echo "000")
        fi
    else
        response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    fi
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "0")
    
    local status_code="${response: -3}"
    
    if [ "$VERBOSE" = "true" ]; then
        if [ "$status_code" = "$expected_status" ]; then
            log "Worker $worker_id: $method $path → $status_code (${duration}s)"
        else
            warn "Worker $worker_id: $method $path → $status_code (expected $expected_status)"
        fi
    fi
    
    # Estatísticas globais
    echo "$status_code,$duration,$path" >> "/tmp/load_stats_$worker_id.csv"
}

# Worker function
worker() {
    local worker_id="$1"
    local end_time=$(($(date +%s) + DURATION))
    
    # Inicializar arquivo de estatísticas
    echo "status_code,duration,path" > "/tmp/load_stats_$worker_id.csv"
    
    log "Worker $worker_id iniciado (PID: $$)"
    
    while [ $(date +%s) -lt $end_time ]; do
        # Selecionar endpoint aleatório
        local endpoint=${ENDPOINTS[$RANDOM % ${#ENDPOINTS[@]}]}
        
        make_request "$endpoint" "$worker_id"
        
        # Intervalo aleatório entre requisições (0.1 a 2 segundos)
        local sleep_time=$(echo "scale=2; $RANDOM / 32767 * 1.9 + 0.1" | bc -l 2>/dev/null || echo "0.5")
        sleep "$sleep_time"
    done
    
    log "Worker $worker_id finalizado"
}

# Função para mostrar estatísticas
show_stats() {
    log "Coletando estatísticas..."
    
    # Combinar todos os arquivos de estatísticas
    local temp_file="/tmp/combined_stats.csv"
    echo "status_code,duration,path" > "$temp_file"
    
    for i in $(seq 1 $CONCURRENCY); do
        if [ -f "/tmp/load_stats_$i.csv" ]; then
            tail -n +2 "/tmp/load_stats_$i.csv" >> "$temp_file"
        fi
    done
    
    if [ ! -s "$temp_file" ]; then
        warn "Nenhuma estatística encontrada"
        return
    fi
    
    echo
    echo -e "${BLUE}📊 ESTATÍSTICAS DO TESTE DE CARGA${NC}"
    echo "═══════════════════════════════════════"
    
    # Total de requisições
    local total_requests=$(tail -n +2 "$temp_file" | wc -l)
    echo "Total de requisições: $total_requests"
    
    # Requisições por segundo
    local rps=$(echo "scale=2; $total_requests / $DURATION" | bc -l 2>/dev/null || echo "N/A")
    echo "Requisições por segundo: $rps"
    
    # Status codes
    echo
    echo "Distribuição de Status Codes:"
    tail -n +2 "$temp_file" | cut -d',' -f1 | sort | uniq -c | while read count code; do
        local percentage=$(echo "scale=1; $count * 100 / $total_requests" | bc -l 2>/dev/null || echo "0")
        printf "  %s: %d (%.1f%%)\n" "$code" "$count" "$percentage"
    done
    
    # Latência (se bc estiver disponível)
    if command -v bc >/dev/null 2>&1; then
        echo
        echo "Latência (segundos):"
        
        # Calcular percentis
        local durations_file="/tmp/durations.txt"
        tail -n +2 "$temp_file" | cut -d',' -f2 | grep -E '^[0-9]+(\.[0-9]+)?$' | sort -n > "$durations_file"
        
        if [ -s "$durations_file" ]; then
            local count=$(wc -l < "$durations_file")
            
            # Média
            local avg=$(awk '{sum+=$1} END {print sum/NR}' "$durations_file" 2>/dev/null || echo "0")
            printf "  Média: %.3fs\n" "$avg"
            
            # Percentis
            local p50_line=$(echo "$count * 0.5 / 1" | bc 2>/dev/null || echo "1")
            local p95_line=$(echo "$count * 0.95 / 1" | bc 2>/dev/null || echo "1")
            local p99_line=$(echo "$count * 0.99 / 1" | bc 2>/dev/null || echo "1")
            
            local p50=$(sed -n "${p50_line}p" "$durations_file" 2>/dev/null || echo "0")
            local p95=$(sed -n "${p95_line}p" "$durations_file" 2>/dev/null || echo "0")
            local p99=$(sed -n "${p99_line}p" "$durations_file" 2>/dev/null || echo "0")
            
            printf "  P50: %.3fs\n" "$p50"
            printf "  P95: %.3fs\n" "$p95"
            printf "  P99: %.3fs\n" "$p99"
        fi
        
        rm -f "$durations_file"
    fi
    
    # Top endpoints
    echo
    echo "Top 5 Endpoints:"
    tail -n +2 "$temp_file" | cut -d',' -f3 | sort | uniq -c | sort -nr | head -5 | while read count path; do
        local percentage=$(echo "scale=1; $count * 100 / $total_requests" | bc -l 2>/dev/null || echo "0")
        printf "  %s: %d (%.1f%%)\n" "$path" "$count" "$percentage"
    done
    
    echo
    echo -e "${GREEN}✅ Teste concluído! Verifique as métricas em:${NC}"
    echo "  • Grafana: http://localhost:3000/d/beyla-red-overview"
    echo "  • Prometheus: http://localhost:9090"
    echo "  • Jaeger: http://localhost:16686"
    
    # Limpeza
    rm -f "$temp_file"
    for i in $(seq 1 $CONCURRENCY); do
        rm -f "/tmp/load_stats_$i.csv"
    done
}

# Função de limpeza
cleanup() {
    log "Interrompendo teste de carga..."
    
    # Matar todos os workers
    for pid in "${worker_pids[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    wait
    show_stats
    exit 0
}

# Função de ajuda
show_help() {
    echo "Grafana Beyla - Gerador de Carga"
    echo
    echo "Uso: $0 [DURAÇÃO] [CONCORRÊNCIA] [VERBOSE]"
    echo
    echo "Parâmetros:"
    echo "  DURAÇÃO      Duração do teste em segundos (padrão: 300)"
    echo "  CONCORRÊNCIA Número de workers paralelos (padrão: 5)"
    echo "  VERBOSE      Mostrar requisições individuais (true/false, padrão: false)"
    echo
    echo "Exemplos:"
    echo "  $0                    # Teste de 5 minutos com 5 workers"
    echo "  $0 60                 # Teste de 1 minuto com 5 workers"
    echo "  $0 120 10             # Teste de 2 minutos com 10 workers"
    echo "  $0 60 3 true          # Teste de 1 minuto com 3 workers (verbose)"
    echo
    echo "URLs de Monitoramento:"
    echo "  • Grafana: http://localhost:3000/d/beyla-red-overview"
    echo "  • Prometheus: http://localhost:9090"
    echo "  • Jaeger: http://localhost:16686"
}

# Main
main() {
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    echo -e "${BLUE}🚀 GRAFANA BEYLA - GERADOR DE CARGA${NC}"
    echo "═══════════════════════════════════════════"
    echo "Duração: ${DURATION}s"
    echo "Concorrência: $CONCURRENCY workers"
    echo "Verbose: $VERBOSE"
    echo "URL Base: $BASE_URL"
    echo
    
    # Verificar dependências
    if ! command -v curl >/dev/null 2>&1; then
        error "curl não está instalado"
        exit 1
    fi
    
    check_app
    
    # Configurar trap para limpeza
    declare -a worker_pids
    trap cleanup SIGINT SIGTERM
    
    log "Iniciando $CONCURRENCY workers..."
    
    # Iniciar workers
    for i in $(seq 1 $CONCURRENCY); do
        worker "$i" &
        worker_pids+=("$!")
    done
    
    log "✅ Todos os workers iniciados"
    log "Gerando carga por ${DURATION}s... (Ctrl+C para parar)"
    
    # Aguardar conclusão
    wait
    
    show_stats
}

# Executar main se script for chamado diretamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi