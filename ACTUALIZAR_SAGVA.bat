@echo off
setlocal
cd /d "%~dp0"
title SAGVA SYSTEM - ACTUALIZADOR

echo ==========================================
echo        SAGVA SYSTEM - ACTUALIZADOR
echo ==========================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0actualizar_sagva.ps1"
set "EXITCODE=%ERRORLEVEL%"

echo.
if not "%EXITCODE%"=="0" (
    echo La actualizacion termino con errores. Revisa el mensaje anterior.
) else (
    echo Proceso finalizado.
)
echo.
pause
exit /b %EXITCODE%
