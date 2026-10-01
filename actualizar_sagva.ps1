$ErrorActionPreference = "Stop"

$RepoRoot = $PSScriptRoot
Set-Location $RepoRoot

function Fail([string]$Message) {
    Write-Host ""
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Check-LastExitCode([string]$Step) {
    if ($LASTEXITCODE -ne 0) {
        Fail "$Step fallo. No se realizaron pasos posteriores."
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "       SAGVA SYSTEM - ACTUALIZACION"
Write-Host "=========================================="
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Fail "Git no esta instalado o no esta disponible en PATH."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail "Node.js no esta instalado o no esta disponible en PATH."
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Fail "npm no esta instalado o no esta disponible en PATH."
}

if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
    Fail "Esta carpeta no es una copia Git de Sagva System."
}

$Branch = (git branch --show-current).Trim()
Check-LastExitCode "La deteccion de la rama"

if ($Branch -ne "main") {
    Fail "La actualizacion manual debe ejecutarse desde la rama main. Rama actual: $Branch"
}

$LocalChanges = @(git status --porcelain --untracked-files=all)
Check-LastExitCode "La revision de cambios locales"

if ($LocalChanges.Count -gt 0) {
    Write-Host ""
    Write-Host "Se detectaron cambios locales sin guardar en Git:" -ForegroundColor Yellow
    $LocalChanges | ForEach-Object { Write-Host "  $_" }
    Write-Host ""
    Fail "La actualizacion fue cancelada para evitar sobrescribir trabajo local. Guarda, confirma o elimina esos cambios antes de volver a ejecutar el actualizador."
}

$CurrentCommit = (git rev-parse --short HEAD).Trim()
Check-LastExitCode "La lectura de la version Git actual"

Write-Host "Version Git actual: $CurrentCommit"
Write-Host "Buscando cambios en GitHub..."

git fetch origin main
Check-LastExitCode "git fetch"

$RemoteCommit = (git rev-parse --short origin/main).Trim()
Check-LastExitCode "La lectura de origin/main"

if ($CurrentCommit -eq $RemoteCommit) {
    Write-Host ""
    Write-Host "Sagva System ya esta actualizado." -ForegroundColor Green
    if (Test-Path (Join-Path $RepoRoot "package.json")) {
        try {
            $Package = Get-Content (Join-Path $RepoRoot "package.json") -Raw | ConvertFrom-Json
            Write-Host "Version de la aplicacion: $($Package.version)"
        }
        catch { }
    }
    exit 0
}

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path $RepoRoot "backups"
$BackupDir = Join-Path $BackupRoot "actualizacion_$Timestamp"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

Write-Host ""
Write-Host "Creando respaldo preventivo en:"
Write-Host "  $BackupDir"

Set-Content -Path (Join-Path $BackupDir "git-commit-antes.txt") -Value $CurrentCommit -Encoding UTF8

$EnvPath = Join-Path $RepoRoot ".env"
if (Test-Path $EnvPath) {
    Copy-Item $EnvPath (Join-Path $BackupDir ".env") -Force
    Write-Host "  OK .env"
}

$PrismaDir = Join-Path $RepoRoot "prisma"
if (Test-Path $PrismaDir) {
    $DbFiles = Get-ChildItem -Path $PrismaDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -match '\.(db|sqlite|sqlite3)$' -or $_.Name -match '\.(db|sqlite|sqlite3)-(journal|wal|shm)$'
    }

    foreach ($DbFile in $DbFiles) {
        Copy-Item $DbFile.FullName (Join-Path $BackupDir $DbFile.Name) -Force
        Write-Host "  OK prisma\$($DbFile.Name)"
    }
}

Write-Host ""
Write-Host "Descargando actualizacion desde GitHub..."

git pull --ff-only origin main
Check-LastExitCode "git pull"

$NewCommit = (git rev-parse --short HEAD).Trim()
Check-LastExitCode "La lectura de la nueva version Git"

Write-Host ""
Write-Host "Actualizando dependencias de Node.js..."

if (Test-Path (Join-Path $RepoRoot "package-lock.json")) {
    npm.cmd ci
    Check-LastExitCode "npm ci"
}
else {
    npm.cmd install
    Check-LastExitCode "npm install"
}

Write-Host ""
Write-Host "Regenerando cliente Prisma..."

npm.cmd run prisma:generate
Check-LastExitCode "prisma generate"

if (-not (Test-Path $EnvPath)) {
    Fail "Falta el archivo .env. El codigo ya fue actualizado, pero no se modifico la base de datos. Crea .env desde .env.example y vuelve a ejecutar el actualizador."
}

Write-Host ""
Write-Host "Actualizando estructura de base de datos..."
Write-Host "No se permite perdida de datos automatica."

npm.cmd run db:push
Check-LastExitCode "prisma db push"

Write-Host ""
Write-Host "=========================================="
Write-Host " ACTUALIZACION COMPLETADA CORRECTAMENTE" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "Anterior: $CurrentCommit"
Write-Host "Nueva:    $NewCommit"

if (Test-Path (Join-Path $RepoRoot "package.json")) {
    try {
        $Package = Get-Content (Join-Path $RepoRoot "package.json") -Raw | ConvertFrom-Json
        Write-Host "Version:  $($Package.version)"
    }
    catch { }
}

Write-Host "Respaldo: $BackupDir"
Write-Host ""
Write-Host "El seed NO se ejecuta automaticamente para proteger los datos existentes."
Write-Host ""
exit 0
