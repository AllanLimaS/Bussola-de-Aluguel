from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os

# Caminho para o banco de dados SQLite
# Criaremos uma pasta 'data' se não existir
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
PHOTOS_DIR = os.path.join(DATA_DIR, "fotos")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)
if not os.path.exists(PHOTOS_DIR):
    os.makedirs(PHOTOS_DIR)

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
    status = Column(String, default="ativo", index=True)  # "ativo" | "inativo" | "removido"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relacionamentos
    precos = relationship("HistoricoPreco", back_populates="imovel")
    fotos = relationship("Foto", back_populates="imovel")
    interacao = relationship("InteracaoImovel", back_populates="imovel", uselist=False)

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
    foto_path = Column(String)  # Caminho relativo ao PHOTOS_DIR, ex: "42/foto_0.webp"

    imovel = relationship("Imovel", back_populates="fotos")

class InteracaoImovel(Base):
    __tablename__ = "interacoes"

    id = Column(Integer, primary_key=True, index=True)
    imovel_id = Column(Integer, ForeignKey("imoveis.id"), unique=True)
    tipo = Column(String)  # "like" | "neutral" | "dislike"
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    imovel = relationship("Imovel", back_populates="interacao")

class Execucao(Base):
    __tablename__ = "execucoes"

    id = Column(Integer, primary_key=True, index=True)
    data_inicio = Column(DateTime, default=datetime.datetime.utcnow)
    data_fim = Column(DateTime, nullable=True)
    duracao_segundos = Column(Float, nullable=True)
    total_links_encontrados = Column(Integer, default=0)
    total_novos = Column(Integer, default=0)
    total_atualizados = Column(Integer, default=0)
    total_erros = Column(Integer, default=0)
    total_ignorados = Column(Integer, default=0)       # Skipped (daily rent, 502, etc.)
    total_paginas_scrapadas = Column(Integer, default=0)
    status = Column(String, default="rodando")          # "rodando" | "completo" | "parcial" | "erro"
    erro_mensagem = Column(Text, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)
    print(f"Banco de dados inicializado em: {DATABASE_URL}")

if __name__ == "__main__":
    init_db()
