#!/bin/bash

# Grafana Alloy Environment Startup Script
# This script starts the complete observability stack with Grafana Alloy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
SERVICES_ORDER=("prometheus" "loki" "jaeger" "alloy" "web-app" "node-app" "node-exporter" "cadvisor" "grafana" "load-generator")
HEALTH_CHECK_TIMEOUT=300
HEALTH_CHECK_INTERVAL=5

echo -e "${BLUE}🚀 Starting Grafana Alloy Observability Stack${NC}"
echo "================================================"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    print_status "Checking Docker..."
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_status "Docker is running ✓"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    if command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    print_status "Docker Compose is available ✓"
}

# Function to check if required files exist
check_files() {
    print_status "Checking required files..."
    
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        print_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    required_files=(
        "alloy.river"
        "prometheus.yml"
        "loki-config.yml"
        "targets/services.json"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            print_error "Required file not found: $file"
            exit 1
        fi
    done
    
    print_status "All required files found ✓"
}

# Function to check if ports are available
check_ports() {
    print_status "Checking port availability..."
    
    ports=(3000 3001 3100 9090 9091 9093 12345 14268 16686)
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $port is already in use"
        fi
    done
    
    print_status "Port check completed"
}

# Function to clean up existing containers
cleanup_containers() {
    print_status "Cleaning up existing containers..."
    
    $DOCKER_COMPOSE_CMD down --remove-orphans >/dev/null 2>&1 || true
    
    # Remove any dangling containers from previous runs
    docker container prune -f >/dev/null 2>&1 || true
    
    print_status "Cleanup completed ✓"
}

# Function to start services in order
start_services() {
    print_status "Starting services in order..."
    
    for service in "${SERVICES_ORDER[@]}"; do
        print_status "Starting $service..."
        $DOCKER_COMPOSE_CMD up -d $service
        
        # Wait a bit between services
        sleep 2
        
        # Check if service started successfully
        if $DOCKER_COMPOSE_CMD ps $service | grep -q "Up"; then
            print_status "$service started successfully ✓"
        else
            print_warning "$service may not have started properly"
        fi
    done
}

# Function to wait for service health
wait_for_service() {
    local service_name=$1
    local health_url=$2
    local timeout=$3
    
    print_status "Waiting for $service_name to be healthy..."
    
    local elapsed=0
    while [[ $elapsed -lt $timeout ]]; do
        if curl -s -f "$health_url" >/dev/null 2>&1; then
            print_status "$service_name is healthy ✓"
            return 0
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        
        if [[ $((elapsed % 30)) -eq 0 ]]; then
            print_status "Still waiting for $service_name... (${elapsed}s elapsed)"
        fi
    done
    
    print_warning "$service_name health check timed out after ${timeout}s"
    return 1
}

# Function to perform health checks
health_checks() {
    print_status "Performing health checks..."
    
    # Wait for core services
    wait_for_service "Prometheus" "http://localhost:9090/-/healthy" 60
    wait_for_service "Loki" "http://localhost:3100/ready" 60
    wait_for_service "Jaeger" "http://localhost:14269/" 60
    wait_for_service "Alloy" "http://localhost:12345/-/healthy" 60
    wait_for_service "Web App" "http://localhost:80/health" 60
    wait_for_service "Node App" "http://localhost:3001/health" 60
    wait_for_service "Grafana" "http://localhost:3000/api/health" 120
    
    print_status "Health checks completed"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    echo
    $DOCKER_COMPOSE_CMD ps
    echo
}

# Function to display access URLs
show_urls() {
    echo
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo "================================================"
    echo -e "${GREEN}📊 Grafana:${NC}           http://localhost:3000 (admin/admin)"
    echo -e "${GREEN}🎯 Prometheus:${NC}        http://localhost:9090"
    echo -e "${GREEN}🔄 Alloy UI:${NC}          http://localhost:12345"
    echo -e "${GREEN}🔍 Jaeger:${NC}            http://localhost:16686"
    echo -e "${GREEN}📝 Loki:${NC}              http://localhost:3100"
    echo -e "${GREEN}🌐 Web App:${NC}           http://localhost:80"
    echo -e "${GREEN}🟢 Node.js App:${NC}       http://localhost:3001"
    echo -e "${GREEN}📈 Node Exporter:${NC}     http://localhost:9100/metrics"
    echo -e "${GREEN}🐳 cAdvisor:${NC}          http://localhost:8080"
    echo
}

# Function to show useful commands
show_commands() {
    echo -e "${BLUE}🛠️  Useful Commands:${NC}"
    echo "================================================"
    echo -e "${YELLOW}View logs:${NC}            $DOCKER_COMPOSE_CMD logs -f [service]"
    echo -e "${YELLOW}Stop all:${NC}             $DOCKER_COMPOSE_CMD down"
    echo -e "${YELLOW}Restart service:${NC}      $DOCKER_COMPOSE_CMD restart [service]"
    echo -e "${YELLOW}View Alloy config:${NC}    $DOCKER_COMPOSE_CMD exec alloy cat /etc/alloy/alloy.river"
    echo -e "${YELLOW}Generate load:${NC}        ./scripts/load-generator.sh"
    echo -e "${YELLOW}Check metrics:${NC}        curl http://localhost:9090/api/v1/label/__name__/values"
    echo
}

# Function to show next steps
show_next_steps() {
    echo -e "${BLUE}🎯 Next Steps:${NC}"
    echo "================================================"
    echo "1. Open Grafana at http://localhost:3000 (admin/admin)"
    echo "2. Import dashboards from grafana/provisioning/dashboards/"
    echo "3. Visit the sample web app at http://localhost:80"
    echo "4. Generate some traffic using the web interface"
    echo "5. Observe metrics, logs, and traces in Grafana"
    echo "6. Check Alloy configuration at http://localhost:12345"
    echo
}

# Main execution
main() {
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    # Pre-flight checks
    check_docker
    check_docker_compose
    check_files
    check_ports
    
    # Start the stack
    cleanup_containers
    start_services
    
    # Wait for services to be ready
    sleep 10
    health_checks
    
    # Show status and information
    show_status
    show_urls
    show_commands
    show_next_steps
    
    print_status "Grafana Alloy stack is ready! 🎉"
}

# Handle script interruption
trap 'print_error "Script interrupted. Run \"$DOCKER_COMPOSE_CMD down\" to clean up."; exit 1' INT TERM

# Run main function
main "$@"