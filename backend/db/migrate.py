import sqlite3
import os

# Caminho para o banco de dados
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "banco.sqlite")

def migrate():
    print(f"Iniciando migração no banco: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Adicionar colunas faltantes na tabela imoveis
    cursor.execute("PRAGMA table_info(imoveis)")
    columns = [c[1] for c in cursor.fetchall()]
    
    if "status" not in columns:
        print("Adicionando coluna 'status' em 'imoveis'...")
        cursor.execute("ALTER TABLE imoveis ADD COLUMN status TEXT DEFAULT 'ativo'")
    
    if "last_seen_at" not in columns:
        print("Adicionando coluna 'last_seen_at' em 'imoveis'...")
        cursor.execute("ALTER TABLE imoveis ADD COLUMN last_seen_at DATETIME")
    
    # Adicionar colunas faltantes na tabela fotos
    cursor.execute("PRAGMA table_info(fotos)")
    columns_fotos = [c[1] for c in cursor.fetchall()]
    if "foto_path" not in columns_fotos:
        print("Adicionando coluna 'foto_path' em 'fotos'...")
        cursor.execute("ALTER TABLE fotos ADD COLUMN foto_path TEXT")
    
    # Garantir que a tabela interacoes existe (caso database.py tenha falhado silenciosamente)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imovel_id INTEGER UNIQUE,
        tipo TEXT,
        updated_at DATETIME,
        FOREIGN KEY(imovel_id) REFERENCES imoveis(id)
    )
    """)
    print("Tabela 'interacoes' verificada/criada.")
    
    conn.commit()
    conn.close()
    print("Migração concluída com sucesso!")

if __name__ == "__main__":
    migrate()
