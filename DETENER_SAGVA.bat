@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
title SAGVA SYSTEM - DETENER
echo ==========================================
echo       DETENER SOLO SAGVA SYSTEM
echo ==========================================
echo.
set "SAGVA_STOP_SELF=%~f0"
set "SAGVA_STOP_ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$lines=[IO.File]::ReadAllLines($env:SAGVA_STOP_SELF); $index=[Array]::IndexOf($lines,'::SAGVA_STOP_POWERSHELL'); if($index -lt 0){Write-Error 'Archivo incompleto';exit 1}; $source=$lines[($index+1)..($lines.Length-1)] -join [Environment]::NewLine; & ([ScriptBlock]::Create($source))"
set "SAGVA_STOP_CODE=%ERRORLEVEL%"
echo.
if not "%SAGVA_STOP_CODE%"=="0" (
    echo ERROR: no se pudo detener SAGVA. Revisa los mensajes.
) else (
    echo Operacion de SAGVA finalizada.
)
echo.
pause
exit /b %SAGVA_STOP_CODE%
::SAGVA_STOP_POWERSHELL
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($env:SAGVA_STOP_ROOT).TrimEnd('\')
$manifestPath = Join-Path $root 'package.json'
if (!(Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw 'Coloca DETENER_SAGVA.bat dentro de la carpeta Sagva-System, al lado de package.json.'
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($manifest.name -ne 'sagva-system') {
    throw 'La carpeta no corresponde a SAGVA. Ningun proceso fue detenido.'
}
$mutex = New-Object Threading.Mutex($false, 'Local\SagvaSystemUpdate')
$acquired = $false
try {
    $acquired = $mutex.WaitOne(0)
    if (!$acquired) {
        throw 'Hay una actualizacion SAGVA en curso. No se detuvo ningun proceso.'
    }
    $ownNext = Join-Path $root 'node_modules\next\'
    function IsOwnNext([string]$command) {
        return ($command -and
            $command.IndexOf($ownNext, [StringComparison]::OrdinalIgnoreCase) -ge 0)
    }
    $list = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
        Where-Object { IsOwnNext $_.CommandLine })
    if ($list.Count -eq 0) {
        Write-Host 'No hay procesos Next.js de SAGVA activos en esta carpeta.'
        Write-Host 'No se ha tocado Propinas ni otros servicios.'
        exit 0
    }
    $stopped = 0
    foreach ($item in $list) {
        # Revalidar PID, fecha de creacion y ruta para no matar procesos ajenos/reutilizados.
        $actual = Get-CimInstance Win32_Process -Filter "ProcessId=$($item.ProcessId)"
        if (!$actual -or $actual.CreationDate -ne $item.CreationDate -or
            !(IsOwnNext $actual.CommandLine)) {
            Write-Warning "Omitido PID $($item.ProcessId): identidad no verificada."
            continue
        }
        Write-Host "Deteniendo proceso SAGVA PID $($actual.ProcessId)..."
        Stop-Process -Id $actual.ProcessId -ErrorAction Stop
        $stopped++
    }
    Write-Host "Procesos SAGVA detenidos: $stopped."
    Write-Host 'Propinas y su base de datos no se modificaron.'
}
finally {
    if ($acquired) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
