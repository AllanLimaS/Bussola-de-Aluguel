@echo off
setlocal
title Bússola de Aluguel - Gerenciador de Execução

echo ========================================================
echo        BÚSSOLA DE ALUGUEL - INICIALIZADOR
echo ========================================================
echo.

:: 1. Iniciar API Backend
echo [*] Iniciando API Backend em uma nova janela...
cd backend
start cmd /k "title API Backend && if exist venv\Scripts\activate ( echo Ativando venv... && call .\venv\Scripts\activate ) else ( echo [!] Ambiente virtual nao encontrado, usando python global... ) && echo Iniciando Uvicorn... && uvicorn api.main:app --reload"
cd ..

echo.
timeout /t 2 >nul

:: 2. Iniciar Painel Frontend
echo [*] Iniciando Painel Frontend em uma nova janela...
cd frontend
start cmd /k "title Painel Frontend && echo Iniciando Vite... && npm run dev"
cd ..

echo.
echo ========================================================
echo [OK] Ambos os servicos estao carregando!
echo.
echo Backend API : http://localhost:8000
echo Frontend Web: http://localhost:5173
echo.
echo Mantenha as janelas abertas enquanto estiver usando.
echo ========================================================
echo.
pause
