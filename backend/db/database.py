from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os

# Caminho para o banco de dados SQLite
# Criaremos uma pasta 'data' se não existir
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

DATABASE_URL = f"sqlite:///{os.path.join(DATA_DIR, 'banco.sqlite')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Imovel(Base):
    __tablename__ = "imoveis"

    id = Column(Integer, primary_key=True, index=True)
    link = Column(String, unique=True, index=True)
    titulo = Column(String)
    descricao = Column(Text)
    metragem = Column(Float)
    quartos = Column(Integer)
    banheiros = Column(Integer)
    vagas = Column(Integer)
    endereco = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relacionamentos
    precos = relationship("HistoricoPreco", back_populates="imovel")
    fotos = relationship("Foto", back_populates="imovel")

class HistoricoPreco(Base):
    __tablename__ = "historico_precos"

    id = Column(Integer, primary_key=True, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"))
    preco_aluguel = Column(Float)
    preco_condominio = Column(Float)
    data_coleta = Column(DateTime, default=datetime.datetime.utcnow)

    imovel = relationship("Imovel", back_populates="precos")

class Foto(Base):
    __tablename__ = "fotos"

    id = Column(Integer, primary_key=True, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"))
    foto_base64 = Column(Text) # Armazenando a string base64

    imovel = relationship("Imovel", back_populates="fotos")

def init_db():
    Base.metadata.create_all(bind=engine)
    print(f"Banco de dados inicializado em: {DATABASE_URL}")

if __name__ == "__main__":
    init_db()
