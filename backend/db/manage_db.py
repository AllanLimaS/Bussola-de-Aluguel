import sys
import os
import datetime
import shutil
import questionary

# Forcar encoding utf-8 no stdout do windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Garante que o script consiga encontrar a pasta db/ 
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal, Imovel, HistoricoPreco, Foto, Execucao, PHOTOS_DIR, init_db

def clean_table(table_name="all"):
    """Deleta todos os registros de tabelas especificas."""
    db = SessionLocal()
    try:
        if table_name in ["Fotos", "Todas as Tabelas"]:
            total = db.query(Foto).delete()
            # Deletar arquivos de fotos do disco
            if os.path.exists(PHOTOS_DIR):
                for item in os.listdir(PHOTOS_DIR):
                    item_path = os.path.join(PHOTOS_DIR, item)
                    if os.path.isdir(item_path):
                        shutil.rmtree(item_path)
            print(f"[*] Tabela 'fotos' limpa e arquivos removidos. ({total} registros removidos)")
            
        if table_name in ["Historico de Precos", "Todas as Tabelas"]:
            total = db.query(HistoricoPreco).delete()
            print(f"[*] Tabela 'historico_precos' limpa. ({total} registros removidos)")
            
        if table_name in ["Execucoes", "Todas as Tabelas"]:
            total = db.query(Execucao).delete()
            print(f"[*] Tabela 'execucoes' limpa. ({total} registros removidos)")
            
        if table_name in ["Imoveis", "Todas as Tabelas"]:
            total = db.query(Imovel).delete()
            print(f"[*] Tabela 'imoveis' limpa. ({total} registros removidos)")
            
        db.commit()
        print("\n[OK] Operacao de limpeza concluida com sucesso!")
    except Exception as e:
        print(f"\n[ERRO] Falha ao limpar banco: {e}")
        db.rollback()
    finally:
        db.close()

def add_fake_data(quantidade=1):
    """Adiciona dados gerados dinamicamente para testes rapidos."""
    db = SessionLocal()
    try:
        # 1x1 pixel PNG minimo para testes
        fake_photo_bytes = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
            0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00,
            0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        for i in range(quantidade):
            timestamp = int(datetime.datetime.now().timestamp() * 1000)
            
            imovel = Imovel(
                titulo=f"Apartamento Fake CLI #{timestamp}",
                link=f"https://vivareal.com/teste/cli_{timestamp}",
                descricao="Gerado pelo gerenciador interativo do terminal. Perfeito para testes.",
                metragem=50.0 + i,
                quartos=2,
                banheiros=1,
                vagas=1,
                endereco="Rua Teste do Terminal, Centro, Itajai - SC",
                latitude=-26.9150 + (i * 0.001), 
                longitude=-48.6700 + (i * 0.001),
                status="ativo"
            )
            db.add(imovel)
            db.flush()

            hist = HistoricoPreco(
                imovel_id=imovel.id,
                preco_aluguel=2000.0 + (i * 100),
                preco_condominio=300.0,
                data_coleta=datetime.datetime.now()
            )
            db.add(hist)

            # Salvar foto fake em disco
            imovel_photos_dir = os.path.join(PHOTOS_DIR, str(imovel.id))
            os.makedirs(imovel_photos_dir, exist_ok=True)
            filepath = os.path.join(imovel_photos_dir, "foto_0.webp")
            with open(filepath, "wb") as f:
                f.write(fake_photo_bytes)
            
            foto = Foto(imovel_id=imovel.id, foto_path=f"{imovel.id}/foto_0.webp")
            db.add(foto)

        db.commit()
        print(f"\n[OK] Inserido {quantidade} imovel(is) fake(s) com sucesso!")
        
    except Exception as e:
        print(f"\n[ERRO] Falha ao inserir dados: {e}")
        db.rollback()
    finally:
        db.close()

def ver_execucoes():
    """Mostra as ultimas 10 execucoes do scraper."""
    db = SessionLocal()
    try:
        execucoes = db.query(Execucao).order_by(Execucao.data_inicio.desc()).limit(10).all()
        
        if not execucoes:
            print("\n[!] Nenhuma execucao registrada ainda.")
            return
        
        print(f"\n{'='*80}")
        print(f"  ULTIMAS {len(execucoes)} EXECUCOES DO SCRAPER")
        print(f"{'='*80}")
        
        for ex in execucoes:
            inicio = ex.data_inicio.strftime("%d/%m/%Y %H:%M") if ex.data_inicio else "N/A"
            duracao = f"{ex.duracao_segundos:.0f}s" if ex.duracao_segundos else "N/A"
            status_emoji = {"completo": "✅", "erro": "❌", "rodando": "🔄", "parcial": "⚠️"}.get(ex.status, "❓")
            
            print(f"\n  {status_emoji} Execucao #{ex.id} — {inicio} ({duracao})")
            print(f"     Status: {ex.status.upper()}")
            print(f"     Paginas: {ex.total_paginas_scrapadas} | Links: {ex.total_links_encontrados}")
            print(f"     Novos: {ex.total_novos} | Atualizados: {ex.total_atualizados} | Ignorados: {ex.total_ignorados} | Erros: {ex.total_erros}")
            if ex.erro_mensagem:
                print(f"     Erro: {ex.erro_mensagem[:120]}...")
        
        print(f"\n{'='*80}")
    finally:
        db.close()

def main():
    print("="*50)
    print("  Gerenciador do Banco de Dados - Bussola de Aluguel")
    print("="*50)

    init_db()

    while True:
        action = questionary.select(
            "\nO que voce deseja fazer?",
            choices=[
                "1. Adicionar Dados Falsos de Teste (Seed)",
                "2. Limpar Tabelas do Banco de Dados",
                "3. Ver Ultimas Execucoes do Scraper",
                "4. Sair"
            ]
        ).ask()

        if not action or "Sair" in action:
            print("\nSaindo...")
            break

        if "Adicionar" in action:
            qtd_str = questionary.text(
                "Quantos imoveis fakes voce deseja criar?",
                default="1",
                validate=lambda val: val.isdigit() and int(val) > 0 or "Digite um numero inteiro valido e maior que zero."
            ).ask()
            
            if qtd_str:
                print(f"\n[!] Inserindo {qtd_str} registros falsos no banco...")
                add_fake_data(int(qtd_str))
                
        elif "Limpar" in action:
            table_choice = questionary.select(
                "Quais dados voce deseja apagar DEFINITIVAMENTE?",
                choices=[
                    "Imoveis",
                    "Fotos",
                    "Historico de Precos",
                    "Execucoes",
                    "Todas as Tabelas",
                    "Cancelar"
                ]
            ).ask()

            if table_choice and table_choice != "Cancelar":
                confirm = questionary.confirm(
                    f"Tem certeza que deseja apagar {table_choice}? Essa acao nao tem volta.",
                    default=False
                ).ask()

                if confirm:
                    print(f"\n[!] Excluindo registros de {table_choice}...")
                    clean_table(table_choice)
                else:
                    print("\nOperacao cancelada.")
        
        elif "Execucoes" in action:
            ver_execucoes()

if __name__ == "__main__":
    main()
