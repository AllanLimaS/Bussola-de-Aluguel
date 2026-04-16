from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import database as db_config
from api import recommendation

app = FastAPI(title="Bússola de Aluguel API")

# Configuração de CORS para permitir acesso local e da rede local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite qualquer origem (seguro para uso local/rede doméstica)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir fotos estáticas do disco
app.mount("/fotos", StaticFiles(directory=db_config.PHOTOS_DIR), name="fotos")

# Dependência para obter a sessão do banco de dados
def get_db():
    db = db_config.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class InteracaoRequest(BaseModel):
    tipo: str  # "like", "neutral", "dislike"

@app.get("/")
def read_root():
    return {"message": "API Bússola de Aluguel está rodando!"}

@app.get("/imoveis")
def list_imoveis(
    status: Optional[str] = Query("ativo", description="Filtrar por status: ativo, inativo, removido, todos"),
    db: Session = Depends(get_db)
):
    query = db.query(db_config.Imovel)
    
    if status and status != "todos":
        query = query.filter(db_config.Imovel.status == status)
    
    imoveis = query.all()
    
    # Vamos retornar um JSON simplificado com o preço mais recente
    results = []
    for imovel in imoveis:
        # Pega o último preço registrado no histórico
        ultimo_preco = db.query(db_config.HistoricoPreco)\
            .filter(db_config.HistoricoPreco.imovel_id == imovel.id)\
            .order_by(db_config.HistoricoPreco.data_coleta.desc())\
            .first()
        
        # Primeira foto como URL
        foto_principal = None
        if imovel.fotos:
            foto_principal = f"/fotos/{imovel.fotos[0].foto_path}"
        
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
            "status": imovel.status,
            "interacao": imovel.interacao.tipo if imovel.interacao else "neutral",
            "quantidade_fotos": len(imovel.fotos),
            "foto_principal": foto_principal
        })
    return results

@app.get("/imoveis/recomendados")
def list_recomendados(
    db: Session = Depends(get_db)
):
    """
    Retorna os imóveis recomendados com base nos likes do usuário.
    """
    try:
        user_profile, recomendacoes = recommendation.get_recommended_listings(db)
        
        results = []
        for item in recomendacoes:
            imovel = item["imovel"]
            score = item["affinity_score"]
            
            ultimo_preco = db.query(db_config.HistoricoPreco)\
                .filter(db_config.HistoricoPreco.imovel_id == imovel.id)\
                .order_by(db_config.HistoricoPreco.data_coleta.desc())\
                .first()
            
            foto_principal = None
            if imovel.fotos:
                foto_principal = f"/fotos/{imovel.fotos[0].foto_path}"
            
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
                "status": imovel.status,
                "interacao": imovel.interacao.tipo if imovel.interacao else "neutral",
                "quantidade_fotos": len(imovel.fotos),
                "foto_principal": foto_principal,
                "affinity_score": score
            })
            
        return {
            "profile": user_profile,
            "results": results
        }
    except Exception as e:
        print(f"Erro ao gerar recomendacoes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/imoveis/{imovel_id}")
def get_imovel_detail(imovel_id: int, db: Session = Depends(get_db)):
    imovel = db.query(db_config.Imovel).filter(db_config.Imovel.id == imovel_id).first()
    if not imovel:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    historico = db.query(db_config.HistoricoPreco)\
        .filter(db_config.HistoricoPreco.imovel_id == imovel_id)\
        .order_by(db_config.HistoricoPreco.data_coleta.asc())\
        .all()
    
    # Retorna o imóvel com fotos como URLs e histórico completo
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
        "status": imovel.status,
        "historico_precos": [
            {
                "aluguel": h.preco_aluguel,
                "condominio": h.preco_condominio,
                "data": h.data_coleta
            } for h in historico
        ],
        "interacao": imovel.interacao.tipo if imovel.interacao else "neutral",
        "fotos": [f"/fotos/{f.foto_path}" for f in imovel.fotos]
    }

@app.post("/imoveis/{imovel_id}/interagir")
def interagir_imovel(imovel_id: int, request: InteracaoRequest, db: Session = Depends(get_db)):
    print(f"Recebendo interacao: {request.tipo} para imovel_id: {imovel_id}")
    if request.tipo not in ["like", "neutral", "dislike"]:
        raise HTTPException(status_code=400, detail="Tipo de interação inválido")
    
    # Verificar se o imovel existe
    imovel = db.query(db_config.Imovel).filter(db_config.Imovel.id == imovel_id).first()
    if not imovel:
        print(f"Erro: Imovel {imovel_id} nao encontrado para interacao")
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    interacao = db.query(db_config.InteracaoImovel).filter(db_config.InteracaoImovel.imovel_id == imovel_id).first()
    
    if interacao:
        interacao.tipo = request.tipo
    else:
        interacao = db_config.InteracaoImovel(imovel_id=imovel_id, tipo=request.tipo)
        db.add(interacao)
    
    db.commit()
    print(f"Sucesso: Interacao salva para imovel {imovel_id}")
    return {"status": "success", "tipo": request.tipo}

@app.get("/novidades")
def list_novidades(db: Session = Depends(get_db)):
    """
    Retorna as novidades não visualizadas.
    """
    novidades = db.query(db_config.Novidade)\
        .filter(db_config.Novidade.visualizado == False)\
        .order_by(db_config.Novidade.created_at.desc())\
        .all()
    
    results = []
    for n in novidades:
        imovel = n.imovel
        foto_principal = None
        if imovel.fotos:
            foto_principal = f"/fotos/{imovel.fotos[0].foto_path}"
        
        results.append({
            "id": n.id,
            "tipo": n.tipo,
            "imovel_id": n.imovel_id,
            "titulo": imovel.titulo,
            "endereco": imovel.endereco,
            "preco_antigo": n.preco_antigo.preco_aluguel if n.preco_antigo else None,
            "preco_novo": n.preco_novo.preco_aluguel,
            "foto": foto_principal,
            "created_at": n.created_at
        })
    return results

@app.post("/novidades/{novidade_id}/visto")
def marcar_novidade_visto(novidade_id: int, db: Session = Depends(get_db)):
    novidade = db.query(db_config.Novidade).filter(db_config.Novidade.id == novidade_id).first()
    if not novidade:
        raise HTTPException(status_code=404, detail="Novidade não encontrada")
    
    novidade.visualizado = True
    db.commit()
    return {"status": "success"}

@app.post("/novidades/limpar")
def limpar_novidades(db: Session = Depends(get_db)):
    db.query(db_config.Novidade).filter(db_config.Novidade.visualizado == False).update({"visualizado": True})
    db.commit()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

