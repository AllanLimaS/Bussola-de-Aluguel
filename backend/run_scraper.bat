@echo off
REM ============================================================
REM  Bussola de Aluguel - Script de Execucao do Scraper
REM  Agende este .bat no Windows Task Scheduler para rodar diariamente
REM  Tambem pode ser executado manualmente pelo terminal
REM ============================================================

chcp 65001 >nul

REM Navegar para o diretorio do backend
cd /d "%~dp0"

echo ============================================================
echo   Bussola de Aluguel - Scraper
echo   Inicio: %date% %time%
echo ============================================================
echo.

REM Se usar venv, descomente a linha abaixo e ajuste o caminho:
REM call "%~dp0.venv\Scripts\activate.bat"

REM Executar o scraper com output unbuffered (-u) para prints em tempo real
python -u scraper\scraper.py

echo.
echo [FIM] Scraper finalizado em %date% %time%
