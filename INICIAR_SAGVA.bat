@echo off
setlocal
cd /d "%~dp0"
title SAGVA SYSTEM

echo ==========================================
echo             SAGVA SYSTEM
echo ==========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm no esta instalado o no esta disponible en PATH.
    echo Instala Node.js y vuelve a intentarlo.
    echo.
    pause
    exit /b 1
)

if not exist ".env" (
    echo ERROR: No existe el archivo .env.
    echo Crea .env usando .env.example como base.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo No se encontraron dependencias instaladas.
    echo Ejecuta primero ACTUALIZAR_SAGVA.bat o npm install.
    echo.
    pause
    exit /b 1
)

echo Iniciando Sagva System...
echo URL local: http://localhost:3000
echo.
npm run dev

echo.
echo Sagva System se ha detenido.
pause
