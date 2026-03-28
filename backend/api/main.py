from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import database as db_config

app = FastAPI(title="Bússola de Aluguel API")

# Configuração de CORS para permitir que o React acesse a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, especifique a URL do seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependência para obter a sessão do banco de dados
def get_db():
    db = db_config.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "API Bússola de Aluguel está rodando!"}

@app.get("/imoveis")
def list_imoveis(db: Session = Depends(get_db)):
    imoveis = db.query(db_config.Imovel).all()
    
    # Vamos retornar um JSON simplificado com o preço mais recente
    results = []
    for imovel in imoveis:
        # Pega o último preço registrado no histórico
        ultimo_preco = db.query(db_config.HistoricoPreco)\
            .filter(db_config.HistoricoPreco.imovel_id == imovel.id)\
            .order_by(db_config.HistoricoPreco.data_coleta.desc())\
            .first()
        
        results.append({
            "id": imovel.id,
            "titulo": imovel.titulo,
            "link": imovel.link,
            "endereco": imovel.endereco,
            "metragem": imovel.metragem,
            "quartos": imovel.quartos,
            "banheiros": imovel.banheiros,
            "vagas": imovel.vagas,
            "preco_aluguel": ultimo_preco.preco_aluguel if ultimo_preco else None,
            "preco_condominio": ultimo_preco.preco_condominio if ultimo_preco else None,
            "latitude": imovel.latitude,
            "longitude": imovel.longitude,
            "quantidade_fotos": len(imovel.fotos),
            "foto_principal": imovel.fotos[0].foto_base64 if imovel.fotos else None
        })
    return results

@app.get("/imoveis/{imovel_id}")
def get_imovel_detail(imovel_id: int, db: Session = Depends(get_db)):
    imovel = db.query(db_config.Imovel).filter(db_config.Imovel.id == imovel_id).first()
    if not imovel:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    historico = db.query(db_config.HistoricoPreco)\
        .filter(db_config.HistoricoPreco.imovel_id == imovel_id)\
        .order_by(db_config.HistoricoPreco.data_coleta.asc())\
        .all()
    
    # Retorna o imóvel com fotos e histórico completo
    return {
        "id": imovel.id,
        "titulo": imovel.titulo,
        "descricao": imovel.descricao,
        "link": imovel.link,
        "endereco": imovel.endereco,
        "metragem": imovel.metragem,
        "quartos": imovel.quartos,
        "banheiros": imovel.banheiros,
        "vagas": imovel.vagas,
        "latitude": imovel.latitude,
        "longitude": imovel.longitude,
        "historico_precos": [
            {
                "aluguel": h.preco_aluguel,
                "condominio": h.preco_condominio,
                "data": h.data_coleta
            } for h in historico
        ],
        "fotos": [f.foto_base64 for f in imovel.fotos]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
