from sqlalchemy.orm import Session
from sqlalchemy import func
import math
import sys
import os
from typing import List, Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import database as db_config

def get_user_profile(db: Session):
    """
    Analisa os 'likes' do usuário para criar um perfil médio de preferência.
    Retorna um dicionário com os valores ideais.
    """
    likes = db.query(db_config.Imovel).join(db_config.InteracaoImovel).filter(
        db_config.InteracaoImovel.tipo == "like"
    ).all()

    if not likes:
        return None

    total = len(likes)
    
    # Médias dos preços totais (Aluguel + Condomínio)
    precos_totais = []
    for l in likes:
        ultimo_preco = db.query(db_config.HistoricoPreco).filter(
            db_config.HistoricoPreco.imovel_id == l.id
        ).order_by(db_config.HistoricoPreco.data_coleta.desc()).first()
        if ultimo_preco:
            precos_totais.append((ultimo_preco.preco_aluguel or 0) + (ultimo_preco.preco_condominio or 0))

    perfil = {
        "preco_medio": sum(precos_totais) / len(precos_totais) if precos_totais else 0,
        "metragem_media": sum(l.metragem for l in likes) / total,
        "quartos_medios": sum(l.quartos for l in likes) / total,
        "vagas_desejadas": math.ceil(sum(l.vagas for l in likes) / total), # Arredonda para cima 
        "liked_points": [(l.latitude, l.longitude) for l in likes] # Lista de pontos reais
    }
    
    return perfil

def calculate_score(imovel, profile, db: Session):
    """
    Calcula o score de afinidade (0.0 a 1.0) entre um imóvel e o perfil.
    """
    # Pesos refinados: Preço é o fator dominante (50%)
    PESO_PRECO = 0.50
    PESO_VAGAS = 0.20
    PESO_OUTROS = 0.15
    PESO_LOCALIZACAO = 0.15

    # 1. Preço (Diferença percentual invertida)
    ultimo_preco = db.query(db_config.HistoricoPreco).filter(
        db_config.HistoricoPreco.imovel_id == imovel.id
    ).order_by(db_config.HistoricoPreco.data_coleta.desc()).first()
    
    if not ultimo_preco or profile["preco_medio"] == 0:
        score_preco = 0.5
    else:
        preco_total_imovel = (ultimo_preco.preco_aluguel or 0) + (ultimo_preco.preco_condominio or 0)
        diff_pct = abs(preco_total_imovel - profile["preco_medio"]) / profile["preco_medio"]
        # Penalidade rigorosa: Uma diferença de 20% no preço total derruba o score em 70% (20% * 3.5)
        score_preco = max(0, 1.0 - (diff_pct * 3.5))

    # 2. Vagas (Atendimento de Requisito)
    if imovel.vagas >= profile["vagas_desejadas"]:
        score_vagas = 1.0
    else:
        # Penalização por falta de vagas
        score_vagas = (imovel.vagas / profile["vagas_desejadas"]) * 0.5 if profile["vagas_desejadas"] > 0 else 1.0

    # 3. Outros (Quartos e Metragem)
    score_quartos = 1.0 if imovel.quartos >= profile["quartos_medios"] else 0.7
    score_metragem = 1.0 if imovel.metragem >= profile["metragem_media"] else 0.8
    score_outros = (score_quartos + score_metragem) / 2

    # 4. Localização (Menor distância para qualquer um dos seus Likes)
    # Quanto menor a distância para o PONTO MAIS PRÓXIMO que você gostou, maior o score.
    # Usando 0.02 graus como "unidade de proximidade" (aprox 2km) para cada ponto. 
    # Isso permite que você tenha "clusters" de interesse em bairros diferentes.
    if not profile.get("liked_points"):
        score_localizacao = 0.5
    else:
        # Pega a menor distância entre todos os seus pontos de Like
        distancias = [
            math.sqrt((imovel.latitude - lat)**2 + (imovel.longitude - lng)**2)
            for lat, lng in profile["liked_points"]
        ]
        min_dist = min(distancias)
        score_localizacao = max(0, 1.0 - (min_dist / 0.02))

    # Score Final Ponderado
    final_score = (
        (score_preco * PESO_PRECO) +
        (score_vagas * PESO_VAGAS) +
        (score_outros * PESO_OUTROS) +
        (score_localizacao * PESO_LOCALIZACAO)
    )

    return round(final_score * 100, 1) # Retorna em escala 0-100

def get_recommended_listings(db: Session):
    """
    Retorna a lista completa de imóveis recomendados, ordenados por afinidade.
    """
    profile = get_user_profile(db)
    
    # Base: Imóveis ativos que não foram descurtidos
    query = db.query(db_config.Imovel).filter(db_config.Imovel.status == "ativo")
    
    # Exclui deslikes explicitamente
    deslikes_ids = [i.imovel_id for i in db.query(db_config.InteracaoImovel).filter(db_config.InteracaoImovel.tipo == "dislike").all()]
    query = query.filter(~db_config.Imovel.id.in_(deslikes_ids)) if deslikes_ids else query

    all_active = query.all()

    if not profile:
        # Cold Start: Retorna os mais recentes
        results = sorted(all_active, key=lambda x: x.created_at, reverse=True)
        return None, [{"imovel": im, "affinity_score": None} for im in results]

    # Calcula score para cada um
    scored_results = []
    for im in all_active:
        score = calculate_score(im, profile, db)
        scored_results.append({
            "imovel": im,
            "affinity_score": score
        })

    # Ordena pelo score
    scored_results.sort(key=lambda x: x["affinity_score"], reverse=True)
    
    return profile, scored_results
