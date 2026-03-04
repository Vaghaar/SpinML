# ─────────────────────────────────────────────────────────────────────────────
#  SpinMyLunch — Script de build & déploiement Windows
#  Usage : .\build.ps1 [-SkipBackend] [-SkipFrontend] [-Restart] [-Detach]
# ─────────────────────────────────────────────────────────────────────────────
param(
    [switch]$SkipBackend,    # Sauter le build Maven
    [switch]$SkipFrontend,   # Sauter le build Next.js
    [switch]$Restart,        # docker-compose down avant up
    [switch]$Detach          # Lancer en arrière-plan (-d)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) { Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-OK([string]$msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }

# ─── 1. Chargement du .env ───────────────────────────────────────────────────
Write-Step "Chargement du .env"
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Fail ".env introuvable. Copiez .env.example vers .env et remplissez les valeurs."
}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)\s*$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
}
Write-OK "Variables d'environnement chargées"

# ─── 2. Validation des variables obligatoires ────────────────────────────────
Write-Step "Validation de la configuration"
$required = @("JWT_SECRET","GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","POSTGRES_PASSWORD","REDIS_PASSWORD")
foreach ($var in $required) {
    if (-not [System.Environment]::GetEnvironmentVariable($var)) {
        Write-Fail "Variable manquante dans .env : $var"
    }
}
Write-OK "Configuration valide"

# ─── 3. Build backend (Maven) ────────────────────────────────────────────────
if (-not $SkipBackend) {
    Write-Step "Build backend Spring Boot (Maven)"
    Push-Location (Join-Path $PSScriptRoot "backend")
    try {
        & mvn package "-Dmaven.test.skip=true" -B -q
        if ($LASTEXITCODE -ne 0) { Write-Fail "mvn package a échoué" }
        Write-OK "JAR généré : backend/target/spinmylunch-backend-0.1.0-SNAPSHOT.jar"
    } finally { Pop-Location }
}

# ─── 4. Build frontend (Next.js) ─────────────────────────────────────────────
if (-not $SkipFrontend) {
    Write-Step "Build frontend Next.js"
    Push-Location (Join-Path $PSScriptRoot "frontend")
    try {
        $env:NEXT_TELEMETRY_DISABLED    = "1"
        # NEXT_PUBLIC_* doivent être présents au moment du build
        $env:NEXT_PUBLIC_API_URL        = if ($env:NEXT_PUBLIC_API_URL)        { $env:NEXT_PUBLIC_API_URL }        else { "http://localhost:8080" }
        $env:NEXT_PUBLIC_WS_URL         = if ($env:NEXT_PUBLIC_WS_URL)         { $env:NEXT_PUBLIC_WS_URL }         else { "ws://localhost:8080" }
        $env:NEXT_PUBLIC_GOOGLE_CLIENT_ID = $env:GOOGLE_CLIENT_ID

        & npm run build
        if ($LASTEXITCODE -ne 0) { Write-Fail "npm run build a échoué" }
        Write-OK "Standalone build généré : frontend/.next/standalone"
    } finally { Pop-Location }
}

# ─── 5. Docker Compose ───────────────────────────────────────────────────────
Write-Step "Démarrage avec Docker Compose"
Push-Location $PSScriptRoot
try {
    if ($Restart) {
        Write-Host "  Arrêt des conteneurs existants..." -ForegroundColor Yellow
        & docker-compose down
    }
    $args = @("up", "--build")
    if ($Detach) { $args += "-d" }
    & docker-compose @args
    if ($LASTEXITCODE -ne 0) { Write-Fail "docker-compose a échoué" }
} finally { Pop-Location }

# ─── 6. Résumé ───────────────────────────────────────────────────────────────
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  SpinMyLunch est opérationnel !" -ForegroundColor Green
Write-Host "  Frontend  → http://localhost:3000" -ForegroundColor White
Write-Host "  API       → http://localhost:8080/api/v1" -ForegroundColor White
Write-Host "  Health    → http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
