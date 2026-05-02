import schedule
import time
import asyncio
import sys
import os
import datetime

# Garante que o python consiga importar os módulos do backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper import main as run_scraper

def job():
    print(f"\n[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Iniciando rotina do scraper...", flush=True)
    try:
        asyncio.run(run_scraper())
        print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Rotina concluída com sucesso.", flush=True)
    except Exception as e:
        print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Erro na execução do scraper: {e}", flush=True)

if __name__ == "__main__":
    print("Iniciando scheduler do Bússola de Aluguel...", flush=True)
    
    # 1. Start-up run: Roda imediatamente ao ligar o container
    print("Executando primeira raspagem de start-up...", flush=True)
    job()
    
    # 2. Agendamento Contínuo: Roda a cada 12 horas
    print("Agendando próximas execuções para a cada 12 horas.", flush=True)
    schedule.every(12).hours.do(job)
    
    # Loop infinito para manter o container vivo e checar a agenda
    while True:
        schedule.run_pending()
        time.sleep(60) # Checa a cada minuto
