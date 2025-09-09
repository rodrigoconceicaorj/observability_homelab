# Grafana Beyla - Load Generator Script (PowerShell)
# Gera tráfego para demonstrar coleta de métricas

param(
    [int]$Duration = 300,        # Duração em segundos (padrão: 5 minutos)
    [int]$Concurrency = 5,       # Número de workers paralelos
    [switch]$Verbose,            # Mostrar requisições individuais
    [switch]$Help                # Mostrar ajuda
)

# Configurações
$BaseUrl = "http://localhost:8080"
$Global:Stats = @()
$Global:WorkerJobs = @()

# Função para log colorido
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    switch ($Level) {
        "INFO"    { Write-Host "[$timestamp] $Message" -ForegroundColor Green }
        "WARNING" { Write-Host "[$timestamp] WARNING: $Message" -ForegroundColor Yellow }
        "ERROR"   { Write-Host "[$timestamp] ERROR: $Message" -ForegroundColor Red }
        "DEBUG"   { if ($Verbose) { Write-Host "[$timestamp] DEBUG: $Message" -ForegroundColor Cyan } }
    }
}

# Função de ajuda
function Show-Help {
    Write-Host "Grafana Beyla - Gerador de Carga (PowerShell)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Uso: .\load-generator.ps1 [-Duration <segundos>] [-Concurrency <workers>] [-Verbose] [-Help]"
    Write-Host ""
    Write-Host "Parâmetros:"
    Write-Host "  -Duration      Duração do teste em segundos (padrão: 300)"
    Write-Host "  -Concurrency   Número de workers paralelos (padrão: 5)"
    Write-Host "  -Verbose       Mostrar requisições individuais"
    Write-Host "  -Help          Mostrar esta ajuda"
    Write-Host ""
    Write-Host "Exemplos:"
    Write-Host "  .\load-generator.ps1                           # Teste de 5 minutos com 5 workers"
    Write-Host "  .\load-generator.ps1 -Duration 60              # Teste de 1 minuto com 5 workers"
    Write-Host "  .\load-generator.ps1 -Duration 120 -Concurrency 10  # Teste de 2 minutos com 10 workers"
    Write-Host "  .\load-generator.ps1 -Duration 60 -Verbose     # Teste de 1 minuto (verbose)"
    Write-Host ""
    Write-Host "URLs de Monitoramento:"
    Write-Host "  • Grafana: http://localhost:3000/d/beyla-red-overview"
    Write-Host "  • Prometheus: http://localhost:9090"
    Write-Host "  • Jaeger: http://localhost:16686"
}

# Verificar se a aplicação está rodando
function Test-Application {
    Write-Log "Verificando se a aplicação está disponível..."
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ Aplicação disponível"
            return $true
        }
    }
    catch {
        Write-Log "Aplicação não está disponível em $BaseUrl" -Level "ERROR"
        Write-Log "Execute: docker-compose up -d" -Level "ERROR"
        return $false
    }
    
    return $false
}

# Endpoints para testar
$Endpoints = @(
    @{ Path = "/health"; Method = "GET"; ExpectedStatus = 200 },
    @{ Path = "/api/users"; Method = "GET"; ExpectedStatus = 200 },
    @{ Path = "/api/users/1"; Method = "GET"; ExpectedStatus = 200 },
    @{ Path = "/api/products"; Method = "GET"; ExpectedStatus = 200 },
    @{ Path = "/api/products/1"; Method = "GET"; ExpectedStatus = 200 },
    @{ Path = "/api/login"; Method = "POST"; ExpectedStatus = 200 },
    @{ Path = "/api/slow"; Method = "GET"; ExpectedStatus = 200 },
    @{ Path = "/api/error"; Method = "GET"; ExpectedStatus = 500 },
    @{ Path = "/nonexistent"; Method = "GET"; ExpectedStatus = 404 },
    @{ Path = "/api/large"; Method = "GET"; ExpectedStatus = 200 }
)

# Função para fazer requisição
function Invoke-LoadRequest {
    param(
        [hashtable]$Endpoint,
        [int]$WorkerId
    )
    
    $url = "$BaseUrl$($Endpoint.Path)"
    $startTime = Get-Date
    
    try {
        if ($Endpoint.Method -eq "POST" -and $Endpoint.Path -eq "/api/login") {
            $body = @{
                username = "user$WorkerId"
                password = "pass123"
            } | ConvertTo-Json
            
            $response = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        }
        elseif ($Endpoint.Method -eq "POST") {
            $response = Invoke-WebRequest -Uri $url -Method POST -UseBasicParsing -TimeoutSec 10
        }
        else {
            $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 10
        }
        
        $statusCode = $response.StatusCode
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        else {
            $statusCode = 0
        }
    }
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    # Log verbose
    if ($Verbose) {
        if ($statusCode -eq $Endpoint.ExpectedStatus) {
            Write-Log "Worker $WorkerId: $($Endpoint.Method) $($Endpoint.Path) → $statusCode (${duration}s)" -Level "DEBUG"
        }
        else {
            Write-Log "Worker $WorkerId: $($Endpoint.Method) $($Endpoint.Path) → $statusCode (expected $($Endpoint.ExpectedStatus))" -Level "WARNING"
        }
    }
    
    # Retornar estatísticas
    return @{
        StatusCode = $statusCode
        Duration = $duration
        Path = $Endpoint.Path
        WorkerId = $WorkerId
        Timestamp = $startTime
    }
}

# Worker function
function Start-LoadWorker {
    param(
        [int]$WorkerId,
        [int]$Duration
    )
    
    $endTime = (Get-Date).AddSeconds($Duration)
    $workerStats = @()
    
    Write-Log "Worker $WorkerId iniciado (PID: $PID)"
    
    while ((Get-Date) -lt $endTime) {
        # Selecionar endpoint aleatório
        $endpoint = $Endpoints | Get-Random
        
        # Fazer requisição
        $stat = Invoke-LoadRequest -Endpoint $endpoint -WorkerId $WorkerId
        $workerStats += $stat
        
        # Intervalo aleatório entre requisições (0.1 a 2 segundos)
        $sleepTime = (Get-Random -Minimum 100 -Maximum 2000) / 1000
        Start-Sleep -Milliseconds ($sleepTime * 1000)
    }
    
    Write-Log "Worker $WorkerId finalizado"
    return $workerStats
}

# Função para mostrar estatísticas
function Show-Statistics {
    param([array]$AllStats)
    
    if ($AllStats.Count -eq 0) {
        Write-Log "Nenhuma estatística encontrada" -Level "WARNING"
        return
    }
    
    Write-Host ""
    Write-Host "📊 ESTATÍSTICAS DO TESTE DE CARGA" -ForegroundColor Blue
    Write-Host "═══════════════════════════════════════"
    
    # Total de requisições
    $totalRequests = $AllStats.Count
    Write-Host "Total de requisições: $totalRequests"
    
    # Requisições por segundo
    $rps = [math]::Round($totalRequests / $Duration, 2)
    Write-Host "Requisições por segundo: $rps"
    
    # Status codes
    Write-Host ""
    Write-Host "Distribuição de Status Codes:"
    $statusGroups = $AllStats | Group-Object StatusCode | Sort-Object Name
    foreach ($group in $statusGroups) {
        $percentage = [math]::Round(($group.Count * 100) / $totalRequests, 1)
        Write-Host "  $($group.Name): $($group.Count) ($percentage%)"
    }
    
    # Latência
    Write-Host ""
    Write-Host "Latência (segundos):"
    $durations = $AllStats | ForEach-Object { $_.Duration } | Sort-Object
    
    if ($durations.Count -gt 0) {
        $avg = ($durations | Measure-Object -Average).Average
        $p50Index = [math]::Floor($durations.Count * 0.5)
        $p95Index = [math]::Floor($durations.Count * 0.95)
        $p99Index = [math]::Floor($durations.Count * 0.99)
        
        Write-Host "  Média: $([math]::Round($avg, 3))s"
        Write-Host "  P50: $([math]::Round($durations[$p50Index], 3))s"
        Write-Host "  P95: $([math]::Round($durations[$p95Index], 3))s"
        Write-Host "  P99: $([math]::Round($durations[$p99Index], 3))s"
    }
    
    # Top endpoints
    Write-Host ""
    Write-Host "Top 5 Endpoints:"
    $pathGroups = $AllStats | Group-Object Path | Sort-Object Count -Descending | Select-Object -First 5
    foreach ($group in $pathGroups) {
        $percentage = [math]::Round(($group.Count * 100) / $totalRequests, 1)
        Write-Host "  $($group.Name): $($group.Count) ($percentage%)"
    }
    
    Write-Host ""
    Write-Host "✅ Teste concluído! Verifique as métricas em:" -ForegroundColor Green
    Write-Host "  • Grafana: http://localhost:3000/d/beyla-red-overview"
    Write-Host "  • Prometheus: http://localhost:9090"
    Write-Host "  • Jaeger: http://localhost:16686"
}

# Função de limpeza
function Stop-LoadTest {
    Write-Log "Interrompendo teste de carga..."
    
    # Parar todos os jobs
    $Global:WorkerJobs | ForEach-Object {
        if ($_.State -eq "Running") {
            Stop-Job -Job $_ -PassThru | Remove-Job
        }
    }
    
    # Coletar estatísticas dos jobs concluídos
    $allStats = @()
    $Global:WorkerJobs | ForEach-Object {
        if ($_.State -eq "Completed") {
            $result = Receive-Job -Job $_
            if ($result) {
                $allStats += $result
            }
        }
        Remove-Job -Job $_ -Force
    }
    
    Show-Statistics -AllStats $allStats
}

# Função principal
function Start-LoadTest {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "🚀 GRAFANA BEYLA - GERADOR DE CARGA" -ForegroundColor Blue
    Write-Host "═══════════════════════════════════════════"
    Write-Host "Duração: ${Duration}s"
    Write-Host "Concorrência: $Concurrency workers"
    Write-Host "Verbose: $Verbose"
    Write-Host "URL Base: $BaseUrl"
    Write-Host ""
    
    # Verificar aplicação
    if (-not (Test-Application)) {
        return
    }
    
    # Configurar handler para Ctrl+C
    $null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
        Stop-LoadTest
    }
    
    try {
        Write-Log "Iniciando $Concurrency workers..."
        
        # Iniciar workers como jobs
        for ($i = 1; $i -le $Concurrency; $i++) {
            $job = Start-Job -ScriptBlock {
                param($WorkerId, $Duration, $BaseUrl, $Endpoints, $Verbose)
                
                # Redefinir funções no contexto do job
                function Invoke-LoadRequest {
                    param([hashtable]$Endpoint, [int]$WorkerId)
                    
                    $url = "$BaseUrl$($Endpoint.Path)"
                    $startTime = Get-Date
                    
                    try {
                        if ($Endpoint.Method -eq "POST" -and $Endpoint.Path -eq "/api/login") {
                            $body = @{ username = "user$WorkerId"; password = "pass123" } | ConvertTo-Json
                            $response = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
                        }
                        elseif ($Endpoint.Method -eq "POST") {
                            $response = Invoke-WebRequest -Uri $url -Method POST -UseBasicParsing -TimeoutSec 10
                        }
                        else {
                            $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 10
                        }
                        $statusCode = $response.StatusCode
                    }
                    catch {
                        if ($_.Exception.Response) {
                            $statusCode = $_.Exception.Response.StatusCode.value__
                        } else {
                            $statusCode = 0
                        }
                    }
                    
                    $endTime = Get-Date
                    $duration = ($endTime - $startTime).TotalSeconds
                    
                    return @{
                        StatusCode = $statusCode
                        Duration = $duration
                        Path = $Endpoint.Path
                        WorkerId = $WorkerId
                        Timestamp = $startTime
                    }
                }
                
                # Executar worker
                $endTime = (Get-Date).AddSeconds($Duration)
                $workerStats = @()
                
                while ((Get-Date) -lt $endTime) {
                    $endpoint = $Endpoints | Get-Random
                    $stat = Invoke-LoadRequest -Endpoint $endpoint -WorkerId $WorkerId
                    $workerStats += $stat
                    
                    $sleepTime = (Get-Random -Minimum 100 -Maximum 2000) / 1000
                    Start-Sleep -Milliseconds ($sleepTime * 1000)
                }
                
                return $workerStats
            } -ArgumentList $i, $Duration, $BaseUrl, $Endpoints, $Verbose
            
            $Global:WorkerJobs += $job
        }
        
        Write-Log "✅ Todos os workers iniciados"
        Write-Log "Gerando carga por ${Duration}s... (Ctrl+C para parar)"
        
        # Aguardar conclusão dos jobs
        $Global:WorkerJobs | Wait-Job | Out-Null
        
        # Coletar resultados
        $allStats = @()
        $Global:WorkerJobs | ForEach-Object {
            $result = Receive-Job -Job $_
            if ($result) {
                $allStats += $result
            }
            Remove-Job -Job $_ -Force
        }
        
        Show-Statistics -AllStats $allStats
    }
    catch {
        Write-Log "Erro durante execução: $($_.Exception.Message)" -Level "ERROR"
        Stop-LoadTest
    }
    finally {
        # Limpeza
        $Global:WorkerJobs | ForEach-Object {
            if ($_.State -eq "Running") {
                Stop-Job -Job $_ -PassThru | Remove-Job -Force
            }
        }
    }
}

# Executar se script for chamado diretamente
if ($MyInvocation.InvocationName -ne '.') {
    Start-LoadTest
}