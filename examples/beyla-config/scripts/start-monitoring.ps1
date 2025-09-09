# Script PowerShell para iniciar o ambiente de monitoramento Beyla
# POC Porto - Grafana Beyla Configuration

param(
    [switch]$Clean,
    [switch]$CleanVolumes,
    [switch]$Help
)

# Configurações
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Cores para output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Log { param([string]$Message) Write-ColorOutput $Message "Green" }
function Write-Warn { param([string]$Message) Write-ColorOutput "WARNING: $Message" "Yellow" }
function Write-Error { param([string]$Message) Write-ColorOutput "ERROR: $Message" "Red" }
function Write-Info { param([string]$Message) Write-ColorOutput "INFO: $Message" "Cyan" }

# Função de ajuda
function Show-Help {
    Write-Host @"
🚀 POC Grafana Beyla - Script de Inicialização

USO:
    .\start-monitoring.ps1 [opções]

OPÇÕES:
    -Clean          Limpa containers antigos antes de iniciar
    -CleanVolumes   Limpa containers e volumes antes de iniciar
    -Help           Mostra esta ajuda

EXEMPLOS:
    .\start-monitoring.ps1                 # Inicia normalmente
    .\start-monitoring.ps1 -Clean          # Limpa e inicia
    .\start-monitoring.ps1 -CleanVolumes   # Limpa tudo e inicia

"@
}

# Verificar se Docker está rodando
function Test-Docker {
    try {
        docker info | Out-Null
        Write-Log "Docker está rodando ✓"
        return $true
    }
    catch {
        Write-Error "Docker não está rodando. Por favor, inicie o Docker Desktop primeiro."
        return $false
    }
}

# Verificar Docker Compose
function Test-DockerCompose {
    try {
        # Tentar docker compose primeiro (versão mais nova)
        docker compose version | Out-Null
        $script:DockerCompose = "docker compose"
        Write-Log "Docker Compose encontrado: docker compose ✓"
        return $true
    }
    catch {
        try {
            # Fallback para docker-compose (versão antiga)
            docker-compose version | Out-Null
            $script:DockerCompose = "docker-compose"
            Write-Log "Docker Compose encontrado: docker-compose ✓"
            return $true
        }
        catch {
            Write-Error "Docker Compose não encontrado. Por favor, instale o Docker Compose."
            return $false
        }
    }
}

# Limpar containers antigos
function Clear-OldContainers {
    param([bool]$CleanVolumes = $false)
    
    Write-Info "Limpando containers antigos..."
    try {
        Invoke-Expression "$script:DockerCompose down --remove-orphans" 2>$null
    }
    catch {
        # Ignorar erros se não houver containers
    }
    
    if ($CleanVolumes) {
        Write-Warn "Removendo volumes de dados..."
        try {
            docker volume prune -f 2>$null
        }
        catch {
            Write-Warn "Não foi possível limpar volumes"
        }
    }
}

# Verificar portas disponíveis
function Test-Ports {
    $ports = @(3000, 9090, 12345, 16686, 8080, 80)
    $busyPorts = @()
    
    foreach ($port in $ports) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            $busyPorts += $port
        }
    }
    
    if ($busyPorts.Count -gt 0) {
        Write-Warn "As seguintes portas estão em uso: $($busyPorts -join ', ')"
        Write-Warn "Isso pode causar conflitos. Continuar mesmo assim? (y/N)"
        $response = Read-Host
        if ($response -notmatch '^[Yy]$') {
            Write-Error "Operação cancelada pelo usuário."
            return $false
        }
    }
    return $true
}

# Iniciar serviços
function Start-Services {
    Write-Log "Iniciando serviços de monitoramento..."
    
    try {
        # Construir imagens se necessário
        Write-Info "Construindo imagens..."
        Invoke-Expression "$script:DockerCompose build --no-cache"
        
        # Iniciar serviços em ordem
        Write-Info "Iniciando Prometheus..."
        Invoke-Expression "$script:DockerCompose up -d prometheus"
        Start-Sleep -Seconds 5
        
        Write-Info "Iniciando Jaeger..."
        Invoke-Expression "$script:DockerCompose up -d jaeger"
        Start-Sleep -Seconds 3
        
        Write-Info "Iniciando Alloy..."
        Invoke-Expression "$script:DockerCompose up -d alloy"
        Start-Sleep -Seconds 5
        
        Write-Info "Iniciando aplicação de exemplo..."
        Invoke-Expression "$script:DockerCompose up -d sample-app"
        Start-Sleep -Seconds 3
        
        Write-Info "Iniciando Beyla..."
        Invoke-Expression "$script:DockerCompose up -d beyla"
        Start-Sleep -Seconds 5
        
        Write-Info "Iniciando Grafana..."
        Invoke-Expression "$script:DockerCompose up -d grafana"
        Start-Sleep -Seconds 10
        
        Write-Info "Iniciando gerador de carga..."
        Invoke-Expression "$script:DockerCompose up -d load-generator"
        
        Write-Log "Todos os serviços foram iniciados! ✓"
        return $true
    }
    catch {
        Write-Error "Erro ao iniciar serviços: $($_.Exception.Message)"
        return $false
    }
}

# Verificar saúde dos serviços
function Test-ServiceHealth {
    Write-Log "Verificando saúde dos serviços..."
    
    $services = @(
        @{Name="sample-app"; Port=8080},
        @{Name="prometheus"; Port=9090},
        @{Name="grafana"; Port=3000},
        @{Name="alloy"; Port=12345},
        @{Name="jaeger"; Port=16686}
    )
    
    $failedServices = @()
    
    foreach ($service in $services) {
        Write-Info "Verificando $($service.Name)..."
        $timeout = 30
        $elapsed = 0
        $healthy = $false
        
        while ($elapsed -lt $timeout -and -not $healthy) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)" -TimeoutSec 2 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    $healthy = $true
                }
            }
            catch {
                # Tentar endpoints alternativos
                try {
                    $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
                    if ($response.StatusCode -eq 200) {
                        $healthy = $true
                    }
                }
                catch {
                    Start-Sleep -Seconds 1
                    $elapsed++
                }
            }
        }
        
        if ($healthy) {
            Write-Log "$($service.Name) está saudável ✓"
        }
        else {
            Write-Warn "$($service.Name) não está respondendo"
            $failedServices += $service.Name
        }
    }
    
    if ($failedServices.Count -gt 0) {
        Write-Warn "Serviços com problemas: $($failedServices -join ', ')"
        Write-Warn "Verifique os logs com: $script:DockerCompose logs <service_name>"
    }
}

# Mostrar URLs de acesso
function Show-AccessUrls {
    Write-Host ""
    Write-Log "🎉 Ambiente Beyla está rodando!"
    Write-Host ""
    Write-Host "📊 URLs de Acesso:" -ForegroundColor White
    Write-Host "   • Aplicação de Exemplo:  http://localhost:8080" -ForegroundColor Cyan
    Write-Host "   • Grafana Dashboard:     http://localhost:3000 (admin/admin)" -ForegroundColor Cyan
    Write-Host "   • Prometheus:            http://localhost:9090" -ForegroundColor Cyan
    Write-Host "   • Alloy UI:              http://localhost:12345" -ForegroundColor Cyan
    Write-Host "   • Jaeger UI:             http://localhost:16686" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📈 Dashboards Principais:" -ForegroundColor White
    Write-Host "   • Beyla RED Metrics:     http://localhost:3000/d/beyla-red-overview" -ForegroundColor Green
    Write-Host "   • Infrastructure:        http://localhost:3000/dashboards" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔧 Comandos Úteis:" -ForegroundColor White
    Write-Host "   • Ver logs:              $script:DockerCompose logs -f <service>" -ForegroundColor Yellow
    Write-Host "   • Parar tudo:            $script:DockerCompose down" -ForegroundColor Yellow
    Write-Host "   • Reiniciar serviço:     $script:DockerCompose restart <service>" -ForegroundColor Yellow
    Write-Host "   • Status dos serviços:   $script:DockerCompose ps" -ForegroundColor Yellow
    Write-Host ""
}

# Função principal
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "🚀 Iniciando POC Grafana Beyla" -ForegroundColor Magenta
    Write-Host "================================" -ForegroundColor Magenta
    
    # Verificações iniciais
    if (-not (Test-Docker)) { return }
    if (-not (Test-DockerCompose)) { return }
    if (-not (Test-Ports)) { return }
    
    # Limpeza se solicitada
    if ($Clean -or $CleanVolumes) {
        Clear-OldContainers -CleanVolumes:$CleanVolumes
    }
    
    # Iniciar serviços
    if (-not (Start-Services)) { return }
    
    # Verificar saúde
    Test-ServiceHealth
    
    # Mostrar informações
    Show-AccessUrls
    
    # Aguardar entrada do usuário
    Write-Host ""
    Write-Info "Pressione Ctrl+C para parar todos os serviços ou Enter para continuar em background..."
    try {
        Read-Host
        Write-Log "Serviços continuarão rodando em background."
        Write-Log "Use '$script:DockerCompose down' para parar todos os serviços."
    }
    catch {
        Write-Warn "Interrompido pelo usuário. Parando serviços..."
        Invoke-Expression "$script:DockerCompose down"
    }
}

# Tratamento de Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action {
    if ($script:DockerCompose) {
        Write-Warn "Parando serviços..."
        Invoke-Expression "$script:DockerCompose down"
    }
}

# Executar função principal
try {
    Main
}
catch {
    Write-Error "Erro inesperado: $($_.Exception.Message)"
    if ($script:DockerCompose) {
        Write-Info "Tentando parar serviços..."
        try {
            Invoke-Expression "$script:DockerCompose down"
        }
        catch {
            Write-Warn "Não foi possível parar os serviços automaticamente"
        }
    }
}