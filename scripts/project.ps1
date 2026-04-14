param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('up', 'down', 'status')]
  [string]$Action
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ROOT_DIR = Split-Path -Parent $PSScriptRoot
$STATE_DIR = Join-Path $ROOT_DIR '.project-state'
$LOG_DIR = Join-Path $ROOT_DIR 'logs/project'
$RAG_DIR = Join-Path $ROOT_DIR 'rag'
$LOGSTASH_DIR = Join-Path $ROOT_DIR 'backend/logstash'
$BACKEND_DIR = Join-Path $ROOT_DIR 'backend'
$FRONTEND_DIR = Join-Path $ROOT_DIR 'frontend'

$BACKEND_PID_FILE = Join-Path $STATE_DIR 'backend.pid'
$FRONTEND_PID_FILE = Join-Path $STATE_DIR 'frontend.pid'
$OLLAMA_PID_FILE = Join-Path $STATE_DIR 'ollama.pid'
$KIBANA_TOKEN_FILE = Join-Path $STATE_DIR 'kibana_service_token'
$KIBANA_ANONYMOUS_USERNAME = 'analyst_kibana_guest'
$KIBANA_ANONYMOUS_PASSWORD = 'analyst-copilot-guest-password'

$BACKEND_LOG = Join-Path $LOG_DIR 'backend.log'
$FRONTEND_LOG = Join-Path $LOG_DIR 'frontend.log'
$OLLAMA_LOG = Join-Path $LOG_DIR 'ollama.log'
$LOGSTASH_LOG = Join-Path $LOG_DIR 'logstash.log'
$ELASTIC_CONTAINER_NAME = 'analyst-copilot-elasticsearch'
$KIBANA_CONTAINER_NAME = 'analyst-copilot-kibana'
$ELASTIC_IMAGE = 'docker.elastic.co/elasticsearch/elasticsearch:8.17.3'

New-Item -ItemType Directory -Force -Path $STATE_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null

function Quote-PS {
  param([string]$Value)
  return "'" + $Value.Replace("'", "''") + "'"
}

function Assert-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found in PATH: $Name"
  }
}

function Invoke-Native {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$Arguments = @(),
    [switch]$IgnoreExitCode
  )

  $output = & $FilePath @Arguments 2>&1
  if (-not $IgnoreExitCode -and $LASTEXITCODE -ne 0) {
    $message = ($output | Out-String).Trim()
    if (-not $message) {
      $message = "$FilePath exited with code $LASTEXITCODE"
    }
    throw $message
  }

  return @($output)
}

function Test-CurlSuccess {
  param([string[]]$Arguments)

  & curl.exe @Arguments *> $null
  return $LASTEXITCODE -eq 0
}

function Wait-ForHttp {
  param(
    [string]$Url,
    [string]$Name,
    [int]$Attempts = 60,
    [int]$DelaySeconds = 2
  )

  for ($i = 1; $i -le $Attempts; $i++) {
    if (Test-CurlSuccess @('-sSf', $Url)) {
      Write-Host "$Name is ready at $Url"
      return
    }
    Start-Sleep -Seconds $DelaySeconds
  }

  throw "Timed out waiting for $Name at $Url"
}

function Wait-ForElasticsearch {
  param(
    [int]$Attempts = 60,
    [int]$DelaySeconds = 2
  )

  $elasticUsername = if ($env:ELASTIC_USERNAME) { $env:ELASTIC_USERNAME } else { 'elastic' }
  $elasticPassword = if ($env:ELASTIC_PASSWORD) { $env:ELASTIC_PASSWORD } else { '' }
  $elasticUrl = if ($env:ELASTIC_URL) { $env:ELASTIC_URL } else { 'https://127.0.0.1:9200' }

  for ($i = 1; $i -le $Attempts; $i++) {
    if (Test-CurlSuccess @('-sk', '-u', "${elasticUsername}:${elasticPassword}", $elasticUrl)) {
      Write-Host 'Elasticsearch is ready'
      return
    }
    Start-Sleep -Seconds $DelaySeconds
  }

  throw 'Timed out waiting for Elasticsearch'
}

function Load-Env {
  $envPath = Join-Path $ROOT_DIR '.env'
  if (-not (Test-Path -LiteralPath $envPath)) {
    return
  }

  foreach ($line in Get-Content -LiteralPath $envPath) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) {
      continue
    }

    $parts = $trimmed -split '=', 2
    if ($parts.Count -ne 2) {
      continue
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim()
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }
}

function Docker-Ready {
  Assert-Command 'docker'
  & docker ps *> $null
  return $LASTEXITCODE -eq 0
}

function Ensure-Docker {
  if (Docker-Ready) {
    return
  }

  Write-Host 'Starting Docker Desktop...'
  $dockerDesktopPaths = @(
    (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
    (Join-Path $env:LocalAppData 'Programs\Docker\Docker\Docker Desktop.exe')
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

  if ($dockerDesktopPaths.Count -gt 0) {
    Start-Process -FilePath $dockerDesktopPaths[0] | Out-Null
  }

  for ($i = 1; $i -le 90; $i++) {
    if (Docker-Ready) {
      Write-Host 'Docker Desktop is ready'
      return
    }
    Start-Sleep -Seconds 2
  }

  throw 'Docker Desktop did not become ready in time'
}

function Get-DockerContainerNames {
  param([switch]$All)

  $arguments = if ($All) {
    @('ps', '-a', '--format', '{{.Names}}')
  } else {
    @('ps', '--format', '{{.Names}}')
  }

  $names = Invoke-Native -FilePath 'docker' -Arguments $arguments -IgnoreExitCode
  return @($names | ForEach-Object { $_.ToString().Trim() } | Where-Object { $_ })
}

function Start-ContainerIfNeeded {
  param([string]$Name)

  if ((Get-DockerContainerNames) -contains $Name) {
    Write-Host "$Name is already running"
    return
  }

  if ((Get-DockerContainerNames -All) -contains $Name) {
    Write-Host "Starting existing container $Name"
    Invoke-Native -FilePath 'docker' -Arguments @('start', $Name) | Out-Null
    return
  }

  throw "Container $Name does not exist"
}

function Ensure-ElasticsearchContainer {
  if ((Get-DockerContainerNames -All) -contains $ELASTIC_CONTAINER_NAME) {
    Start-ContainerIfNeeded -Name $ELASTIC_CONTAINER_NAME
    return
  }

  Write-Host 'Creating Elasticsearch container...'
  $elasticPassword = if ($env:ELASTIC_PASSWORD) { $env:ELASTIC_PASSWORD } else { '' }
  Invoke-Native -FilePath 'docker' -Arguments @(
    'run',
    '-d',
    '--name', $ELASTIC_CONTAINER_NAME,
    '-p', '9200:9200',
    '-p', '9300:9300',
    '-e', 'discovery.type=single-node',
    '-e', 'ES_JAVA_OPTS=-Xms1g -Xmx1g',
    '-e', "ELASTIC_PASSWORD=$elasticPassword",
    $ELASTIC_IMAGE
  ) | Out-Null
}

function Ensure-Neo4j {
  $runningNames = Get-DockerContainerNames
  if ($runningNames -contains 'rag-neo4j-1' -or $runningNames -contains 'usa16-neo4j') {
    Write-Host 'Neo4j is already running'
    return
  }

  $allNames = Get-DockerContainerNames -All
  if ($allNames -contains 'rag-neo4j-1') {
    Write-Host 'Starting existing Neo4j container rag-neo4j-1'
    Invoke-Native -FilePath 'docker' -Arguments @('start', 'rag-neo4j-1') | Out-Null
    return
  }

  if ($allNames -contains 'usa16-neo4j') {
    Write-Host 'Starting existing Neo4j container usa16-neo4j'
    Invoke-Native -FilePath 'docker' -Arguments @('start', 'usa16-neo4j') | Out-Null
    return
  }

  Write-Host 'Creating Neo4j container from rag/docker-compose.yml...'
  Push-Location $RAG_DIR
  try {
    Invoke-Native -FilePath 'docker' -Arguments @('compose', 'up', '-d') | Out-Null
  } finally {
    Pop-Location
  }
}

function Refresh-KibanaServiceToken {
  Write-Host 'Refreshing Kibana service token...'

  Invoke-Native -FilePath 'docker' -Arguments @(
    'exec',
    $ELASTIC_CONTAINER_NAME,
    '/usr/share/elasticsearch/bin/elasticsearch-service-tokens',
    'delete',
    'elastic/kibana',
    'analyst-copilot'
  ) -IgnoreExitCode | Out-Null

  $tokenOutput = Invoke-Native -FilePath 'docker' -Arguments @(
    'exec',
    $ELASTIC_CONTAINER_NAME,
    '/usr/share/elasticsearch/bin/elasticsearch-service-tokens',
    'create',
    'elastic/kibana',
    'analyst-copilot'
  )

  $tokenLine = $tokenOutput | Where-Object { $_ -match '^SERVICE_TOKEN ' } | Select-Object -First 1
  if (-not $tokenLine) {
    throw 'Failed to generate Kibana service token'
  }

  $token = ($tokenLine -split ' = ', 2)[1].Trim()
  Set-Content -LiteralPath $KIBANA_TOKEN_FILE -Value $token
  $env:KIBANA_ELASTICSEARCH_SERVICE_TOKEN = $token
}

function Ensure-KibanaAnonymousUser {
  Write-Host 'Ensuring Kibana anonymous user...'

  $elasticUsername = if ($env:ELASTIC_USERNAME) { $env:ELASTIC_USERNAME } else { 'elastic' }
  $elasticPassword = if ($env:ELASTIC_PASSWORD) { $env:ELASTIC_PASSWORD } else { '' }
  $elasticUrl = if ($env:ELASTIC_URL) { $env:ELASTIC_URL } else { 'https://127.0.0.1:9200' }
  $payloadPath = Join-Path $STATE_DIR 'kibana_anonymous_user.json'
  $payload = @"
{
  "password": "$KIBANA_ANONYMOUS_PASSWORD",
  "roles": ["superuser"],
  "full_name": "Analyst Copilot Kibana Guest"
}
"@

  Set-Content -LiteralPath $payloadPath -Value $payload
  try {
    Invoke-Native -FilePath 'curl.exe' -Arguments @(
      '-sk',
      '-u', "${elasticUsername}:${elasticPassword}",
      '-H', 'Content-Type: application/json',
      '-X', 'PUT',
      "$elasticUrl/_security/user/$KIBANA_ANONYMOUS_USERNAME",
      '--data-binary', "@$payloadPath"
    ) | Out-Null
  } finally {
    Remove-Item -LiteralPath $payloadPath -Force -ErrorAction SilentlyContinue
  }

  $env:KIBANA_ANONYMOUS_USERNAME = $KIBANA_ANONYMOUS_USERNAME
  $env:KIBANA_ANONYMOUS_PASSWORD = $KIBANA_ANONYMOUS_PASSWORD
}

function Test-PortListening {
  param([int]$Port)

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return $null -ne $connections
}

function Start-BackgroundPowerShell {
  param([string]$Command, [string]$PidFilePath)

  $process = Start-Process -FilePath 'powershell.exe' -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command', $Command
  ) -WindowStyle Hidden -PassThru

  Set-Content -LiteralPath $PidFilePath -Value $process.Id
  return $process
}

function Start-OllamaIfNeeded {
  Assert-Command 'ollama'

  if (Test-CurlSuccess @('-s', 'http://127.0.0.1:11434/api/tags')) {
    Write-Host 'Ollama is already running'
    return
  }

  Write-Host 'Starting Ollama...'
  $ollamaCommand = "& { & ollama serve *> $(Quote-PS $OLLAMA_LOG) }"
  Start-BackgroundPowerShell -Command $ollamaCommand -PidFilePath $OLLAMA_PID_FILE | Out-Null
  Wait-ForHttp -Url 'http://127.0.0.1:11434/api/tags' -Name 'Ollama' -Attempts 45 -DelaySeconds 2
}

function Start-BackendIfNeeded {
  if (Test-PortListening -Port 3001) {
    Write-Host 'Backend is already running on port 3001'
    return
  }

  Write-Host 'Starting backend...'
  $pythonPath = if ($env:PYTHON_PATH) { $env:PYTHON_PATH } else { 'rag\venv\Scripts\python.exe' }
  $resolvedPythonPath = if ([System.IO.Path]::IsPathRooted($pythonPath)) {
    $pythonPath
  } else {
    Join-Path $ROOT_DIR $pythonPath
  }

  $backendCommand = "& { Set-Location -LiteralPath $(Quote-PS $BACKEND_DIR); `$env:PYTHON_PATH = $(Quote-PS $resolvedPythonPath); & npm.cmd run start *> $(Quote-PS $BACKEND_LOG) }"
  Start-BackgroundPowerShell -Command $backendCommand -PidFilePath $BACKEND_PID_FILE | Out-Null
  Wait-ForHttp -Url 'http://127.0.0.1:3001/' -Name 'Backend' -Attempts 45 -DelaySeconds 2
}

function Start-FrontendIfNeeded {
  if (Test-PortListening -Port 3000) {
    Write-Host 'Frontend is already running on port 3000'
    return
  }

  Write-Host 'Starting frontend...'
  $frontendCommand = "& { Set-Location -LiteralPath $(Quote-PS $FRONTEND_DIR); & npm.cmd run dev *> $(Quote-PS $FRONTEND_LOG) }"
  Start-BackgroundPowerShell -Command $frontendCommand -PidFilePath $FRONTEND_PID_FILE | Out-Null
  Wait-ForHttp -Url 'http://127.0.0.1:3000' -Name 'Frontend' -Attempts 60 -DelaySeconds 2
}

function Run-LogstashIngest {
  Write-Host 'Starting Kibana and running Logstash ingest...'
  Push-Location $LOGSTASH_DIR
  try {
    $env:KIBANA_ELASTICSEARCH_SERVICE_TOKEN = if ($env:KIBANA_ELASTICSEARCH_SERVICE_TOKEN) {
      $env:KIBANA_ELASTICSEARCH_SERVICE_TOKEN
    } elseif (Test-Path -LiteralPath $KIBANA_TOKEN_FILE) {
      (Get-Content -LiteralPath $KIBANA_TOKEN_FILE -Raw).Trim()
    } else {
      ''
    }

    & docker compose up -d --force-recreate kibana logstash *> $LOGSTASH_LOG
    if ($LASTEXITCODE -ne 0) {
      throw "docker compose up failed. Check $LOGSTASH_LOG"
    }
  } finally {
    Pop-Location
  }
}

function Open-ProjectUrls {
  Start-Process 'http://localhost:3000/upload' | Out-Null
}

function Test-PidRunning {
  param([string]$PidFilePath)

  if (-not (Test-Path -LiteralPath $PidFilePath)) {
    return $false
  }

  $pidValue = (Get-Content -LiteralPath $PidFilePath -Raw).Trim()
  if (-not $pidValue) {
    return $false
  }

  return $null -ne (Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue)
}

function Stop-PidFile {
  param(
    [string]$PidFilePath,
    [string]$Name
  )

  if (Test-PidRunning -PidFilePath $PidFilePath) {
    $pidValue = [int](Get-Content -LiteralPath $PidFilePath -Raw).Trim()
    Write-Host "Stopping $Name"
    Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
  }

  Remove-Item -LiteralPath $PidFilePath -Force -ErrorAction SilentlyContinue
}

function Stop-ProcessesMatching {
  param([string]$Pattern)

  $processes = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and $_.CommandLine -match $Pattern
  }

  foreach ($process in $processes) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Stop-Backend {
  Stop-PidFile -PidFilePath $BACKEND_PID_FILE -Name 'backend'
  Stop-ProcessesMatching -Pattern 'node(\.exe)?\s+index\.js'
}

function Stop-Frontend {
  Stop-PidFile -PidFilePath $FRONTEND_PID_FILE -Name 'frontend'
  Stop-ProcessesMatching -Pattern 'next(\.exe)?\s+dev'
}

function Stop-OllamaIfManaged {
  if (Test-PidRunning -PidFilePath $OLLAMA_PID_FILE) {
    Write-Host 'Stopping Ollama started by project launcher'
    $pidValue = [int](Get-Content -LiteralPath $OLLAMA_PID_FILE -Raw).Trim()
    Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
  }

  if (Test-CurlSuccess @('-s', 'http://127.0.0.1:11434/api/tags')) {
    Write-Host 'Stopping local Ollama server'
  }
  Stop-ProcessesMatching -Pattern 'ollama(\.exe)?\s+serve'

  Remove-Item -LiteralPath $OLLAMA_PID_FILE -Force -ErrorAction SilentlyContinue
}

function Stop-Containers {
  foreach ($container in @(
    'analyst-copilot-logstash',
    $KIBANA_CONTAINER_NAME,
    'rag-neo4j-1',
    'usa16-neo4j',
    $ELASTIC_CONTAINER_NAME
  )) {
    & docker stop $container *> $null
  }
}

function Show-Status {
  $backendStatus = if (Test-PortListening -Port 3001) { 'up' } else { 'down' }
  $frontendStatus = if (Test-PortListening -Port 3000) { 'up' } else { 'down' }
  $kibanaStatus = if (Test-PortListening -Port 5601) { 'up' } else { 'down' }
  $ollamaStatus = if (Test-CurlSuccess @('-s', 'http://127.0.0.1:11434/api/tags')) { 'up' } else { 'down' }

  Write-Host 'Project status'
  Write-Host "Backend port 3001: $backendStatus"
  Write-Host "Frontend port 3000: $frontendStatus"
  Write-Host "Kibana port 5601: $kibanaStatus"
  Write-Host "Ollama port 11434: $ollamaStatus"

  if (Docker-Ready) {
    Write-Host 'Docker containers:'
    & docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
  } else {
    Write-Host 'Docker: down'
  }
}

function Up {
  Assert-Command 'curl.exe'
  Assert-Command 'npm.cmd'
  Load-Env
  Ensure-Docker
  Ensure-ElasticsearchContainer
  Ensure-Neo4j
  Wait-ForElasticsearch -Attempts 60 -DelaySeconds 2
  Refresh-KibanaServiceToken
  Ensure-KibanaAnonymousUser
  Wait-ForHttp -Url 'http://127.0.0.1:7474' -Name 'Neo4j' -Attempts 60 -DelaySeconds 2
  Start-OllamaIfNeeded
  Run-LogstashIngest
  Wait-ForHttp -Url 'http://127.0.0.1:5601' -Name 'Kibana' -Attempts 60 -DelaySeconds 2
  Start-BackendIfNeeded
  Start-FrontendIfNeeded
  Open-ProjectUrls

  Write-Host ''
  Write-Host 'Project is running'
  Write-Host 'Frontend: http://localhost:3000/upload'
  Write-Host 'Backend:  http://localhost:3001/'
  Write-Host 'Neo4j:    http://localhost:7474'
  Write-Host 'Kibana:   http://localhost:5601'
}

function Down {
  Stop-Frontend
  Stop-Backend
  Stop-OllamaIfManaged
  Stop-Containers
  Write-Host 'Project services stopped'
}

switch ($Action) {
  'up' { Up }
  'down' { Down }
  'status' { Show-Status }
}
