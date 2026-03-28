import sys
import os
import datetime
import questionary

# Forcar encoding utf-8 no stdout do windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Garante que o script consiga encontrar a pasta db/ 
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal, Imovel, HistoricoPreco, Foto, init_db

def clean_table(table_name="all"):
    """Deleta todos os registros de tabelas especificas."""
    db = SessionLocal()
    try:
        if table_name in ["Fotos", "Todas as Tabelas"]:
            total = db.query(Foto).delete()
            print(f"[*] Tabela 'fotos' limpa. ({total} registros removidos)")
            
        if table_name in ["Historico de Precos", "Todas as Tabelas"]:
            total = db.query(HistoricoPreco).delete()
            print(f"[*] Tabela 'historico_precos' limpa. ({total} registros removidos)")
            
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
        fake_photo = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        
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
                longitude=-48.6700 + (i * 0.001)
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

            foto = Foto(imovel_id=imovel.id, foto_base64=fake_photo)
            db.add(foto)

        db.commit()
        print(f"\n[OK] Inserido {quantidade} imovel(is) fake(s) com sucesso!")
        
    except Exception as e:
        print(f"\n[ERRO] Falha ao inserir dados: {e}")
        db.rollback()
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
                "3. Sair"
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

if __name__ == "__main__":
    main()
