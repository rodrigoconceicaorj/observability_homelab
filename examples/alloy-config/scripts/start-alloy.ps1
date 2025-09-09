# Grafana Alloy Environment Startup Script for Windows
# This script starts the complete observability stack with Grafana Alloy

param(
    [switch]$SkipHealthChecks,
    [switch]$Verbose
)

# Configuration
$ComposeFile = "docker-compose.yml"
$ServicesOrder = @("prometheus", "loki", "jaeger", "alloy", "web-app", "node-app", "node-exporter", "cadvisor", "grafana", "load-generator")
$HealthCheckTimeout = 300
$HealthCheckInterval = 5

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
}

Write-Host "🚀 Starting Grafana Alloy Observability Stack" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if Docker is running
function Test-Docker {
    Write-Status "Checking Docker..."
    try {
        $null = docker info 2>$null
        Write-Status "Docker is running ✓"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        return $false
    }
}

# Function to check if Docker Compose is available
function Test-DockerCompose {
    Write-Status "Checking Docker Compose..."
    
    # Try docker-compose first
    try {
        $null = docker-compose version 2>$null
        $script:DockerComposeCmd = "docker-compose"
        Write-Status "Docker Compose is available ✓"
        return $true
    }
    catch {
        # Try docker compose
        try {
            $null = docker compose version 2>$null
            $script:DockerComposeCmd = "docker compose"
            Write-Status "Docker Compose is available ✓"
            return $true
        }
        catch {
            Write-Error "Docker Compose is not available. Please install Docker Compose."
            return $false
        }
    }
}

# Function to check if required files exist
function Test-RequiredFiles {
    Write-Status "Checking required files..."
    
    if (-not (Test-Path $ComposeFile)) {
        Write-Error "Docker Compose file not found: $ComposeFile"
        return $false
    }
    
    $RequiredFiles = @(
        "alloy.river",
        "prometheus.yml",
        "loki-config.yml",
        "targets/services.json"
    )
    
    foreach ($file in $RequiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Error "Required file not found: $file"
            return $false
        }
    }
    
    Write-Status "All required files found ✓"
    return $true
}

# Function to check if ports are available
function Test-Ports {
    Write-Status "Checking port availability..."
    
    $Ports = @(3000, 3001, 3100, 9090, 9091, 9093, 12345, 14268, 16686)
    
    foreach ($port in $Ports) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            Write-Warning "Port $port is already in use"
        }
    }
    
    Write-Status "Port check completed"
}

# Function to clean up existing containers
function Remove-ExistingContainers {
    Write-Status "Cleaning up existing containers..."
    
    try {
        & $DockerComposeCmd.Split() down --remove-orphans 2>$null
        
        # Remove any dangling containers from previous runs
        docker container prune -f 2>$null
        
        Write-Status "Cleanup completed ✓"
    }
    catch {
        Write-Warning "Some cleanup operations failed, but continuing..."
    }
}

# Function to start services in order
function Start-Services {
    Write-Status "Starting services in order..."
    
    foreach ($service in $ServicesOrder) {
        Write-Status "Starting $service..."
        
        try {
            & $DockerComposeCmd.Split() up -d $service
            
            # Wait a bit between services
            Start-Sleep -Seconds 2
            
            # Check if service started successfully
            $status = & $DockerComposeCmd.Split() ps $service
            if ($status -match "Up") {
                Write-Status "$service started successfully ✓"
            }
            else {
                Write-Warning "$service may not have started properly"
            }
        }
        catch {
            Write-Warning "Failed to start $service: $($_.Exception.Message)"
        }
    }
}

# Function to wait for service health
function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$HealthUrl,
        [int]$Timeout
    )
    
    Write-Status "Waiting for $ServiceName to be healthy..."
    
    $elapsed = 0
    while ($elapsed -lt $Timeout) {
        try {
            $response = Invoke-WebRequest -Uri $HealthUrl -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Status "$ServiceName is healthy ✓"
                return $true
            }
        }
        catch {
            # Service not ready yet
        }
        
        Start-Sleep -Seconds $HealthCheckInterval
        $elapsed += $HealthCheckInterval
        
        if ($elapsed % 30 -eq 0) {
            Write-Status "Still waiting for $ServiceName... ($elapsed s elapsed)"
        }
    }
    
    Write-Warning "$ServiceName health check timed out after $Timeout s"
    return $false
}

# Function to perform health checks
function Test-ServiceHealth {
    if ($SkipHealthChecks) {
        Write-Status "Skipping health checks as requested"
        return
    }
    
    Write-Status "Performing health checks..."
    
    # Wait for core services
    Wait-ForService "Prometheus" "http://localhost:9090/-/healthy" 60
    Wait-ForService "Loki" "http://localhost:3100/ready" 60
    Wait-ForService "Jaeger" "http://localhost:14269/" 60
    Wait-ForService "Alloy" "http://localhost:12345/-/healthy" 60
    Wait-ForService "Web App" "http://localhost:80/health" 60
    Wait-ForService "Node App" "http://localhost:3001/health" 60
    Wait-ForService "Grafana" "http://localhost:3000/api/health" 120
    
    Write-Status "Health checks completed"
}

# Function to show service status
function Show-ServiceStatus {
    Write-Status "Service Status:"
    Write-Host ""
    & $DockerComposeCmd.Split() ps
    Write-Host ""
}

# Function to display access URLs
function Show-AccessUrls {
    Write-Host ""
    Write-Host "🌐 Access URLs:" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "📊 Grafana:           http://localhost:3000 (admin/admin)" -ForegroundColor Green
    Write-Host "🎯 Prometheus:        http://localhost:9090" -ForegroundColor Green
    Write-Host "🔄 Alloy UI:          http://localhost:12345" -ForegroundColor Green
    Write-Host "🔍 Jaeger:            http://localhost:16686" -ForegroundColor Green
    Write-Host "📝 Loki:              http://localhost:3100" -ForegroundColor Green
    Write-Host "🌐 Web App:           http://localhost:80" -ForegroundColor Green
    Write-Host "🟢 Node.js App:       http://localhost:3001" -ForegroundColor Green
    Write-Host "📈 Node Exporter:     http://localhost:9100/metrics" -ForegroundColor Green
    Write-Host "🐳 cAdvisor:          http://localhost:8080" -ForegroundColor Green
    Write-Host ""
}

# Function to show useful commands
function Show-UsefulCommands {
    Write-Host "🛠️  Useful Commands:" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "View logs:            $DockerComposeCmd logs -f [service]" -ForegroundColor Yellow
    Write-Host "Stop all:             $DockerComposeCmd down" -ForegroundColor Yellow
    Write-Host "Restart service:      $DockerComposeCmd restart [service]" -ForegroundColor Yellow
    Write-Host "View Alloy config:    $DockerComposeCmd exec alloy cat /etc/alloy/alloy.river" -ForegroundColor Yellow
    Write-Host "Generate load:        .\scripts\load-generator.ps1" -ForegroundColor Yellow
    Write-Host "Check metrics:        Invoke-WebRequest http://localhost:9090/api/v1/label/__name__/values" -ForegroundColor Yellow
    Write-Host ""
}

# Function to show next steps
function Show-NextSteps {
    Write-Host "🎯 Next Steps:" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "1. Open Grafana at http://localhost:3000 (admin/admin)"
    Write-Host "2. Import dashboards from grafana/provisioning/dashboards/"
    Write-Host "3. Visit the sample web app at http://localhost:80"
    Write-Host "4. Generate some traffic using the web interface"
    Write-Host "5. Observe metrics, logs, and traces in Grafana"
    Write-Host "6. Check Alloy configuration at http://localhost:12345"
    Write-Host ""
}

# Main execution
function Main {
    # Change to script directory
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ProjectDir = Split-Path -Parent $ScriptDir
    Set-Location $ProjectDir
    
    # Pre-flight checks
    if (-not (Test-Docker)) { exit 1 }
    if (-not (Test-DockerCompose)) { exit 1 }
    if (-not (Test-RequiredFiles)) { exit 1 }
    Test-Ports
    
    # Start the stack
    Remove-ExistingContainers
    Start-Services
    
    # Wait for services to be ready
    Start-Sleep -Seconds 10
    Test-ServiceHealth
    
    # Show status and information
    Show-ServiceStatus
    Show-AccessUrls
    Show-UsefulCommands
    Show-NextSteps
    
    Write-Status "Grafana Alloy stack is ready! 🎉"
}

# Handle script interruption
trap {
    Write-Error "Script interrupted. Run '$DockerComposeCmd down' to clean up."
    exit 1
}

# Run main function
try {
    Main
}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    Write-Host "Stack trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}