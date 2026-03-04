# Lance le backend Spring Boot en chargeant les variables du .env racine
# Usage : depuis le dossier backend/ : .\run-dev.ps1

$envFile = Join-Path $PSScriptRoot "..\\.env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)\s*$') {
            $name  = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "Variables .env chargees" -ForegroundColor Green
} else {
    Write-Host ".env introuvable, utilisation des valeurs par defaut" -ForegroundColor Yellow
}

# URL avec le bon port (5433 sur le host car 5432 est pris par Postgres local)
$env:SPRING_DATASOURCE_URL      = "jdbc:postgresql://localhost:5433/$($env:POSTGRES_DB)"
$env:SPRING_DATASOURCE_USERNAME = $env:POSTGRES_USER
$env:SPRING_DATASOURCE_PASSWORD = $env:POSTGRES_PASSWORD
$env:SPRING_DATA_REDIS_HOST     = "localhost"
$env:SPRING_DATA_REDIS_PORT     = "6380"
$env:SPRING_DATA_REDIS_PASSWORD = $env:REDIS_PASSWORD

Write-Host "Demarrage Spring Boot..." -ForegroundColor Cyan
mvn spring-boot:run "-Dmaven.test.skip=true"
