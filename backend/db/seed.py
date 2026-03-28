import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal, Imovel, HistoricoPreco, Foto, init_db
import datetime

# Inicializa o banco (garante que as tabelas existem)
init_db()

db = SessionLocal()

# Limpar dados antigos para o seed ser limpo
db.query(Foto).delete()
db.query(HistoricoPreco).delete()
db.query(Imovel).delete()
db.commit()

# Dados fictícios com foco em Itajaí - SC e Coordenadas
imoveis_data = [
    {
        "titulo": "Apartamento Luxo no Centro",
        "link": "https://exemplo.com/imovel/1",
        "descricao": "Apartamento completo no coração de Itajaí.",
        "metragem": 78.0,
        "quartos": 2,
        "banheiros": 2,
        "vagas": 1,
        "endereco": "Rua Hercílio Luz, Centro, Itajaí - SC",
        "lat": -26.9150,
        "lng": -48.6700,
        "precos": [
            {"aluguel": 3500.0, "condominio": 600.0, "data": datetime.datetime.now() - datetime.timedelta(days=15)},
            {"aluguel": 3200.0, "condominio": 600.0, "data": datetime.datetime.now()}
        ]
    },
    {
        "titulo": "Studio Moderno na Vila Operária",
        "link": "https://exemplo.com/imovel/2",
        "descricao": "Studio compacto e funcional para quem busca praticidade.",
        "metragem": 32.0,
        "quartos": 1,
        "banheiros": 1,
        "vagas": 0,
        "endereco": "Rua Juvêncio Tavares, Vila Operária, Itajaí - SC",
        "lat": -26.9050,
        "lng": -48.6600,
        "precos": [
            {"aluguel": 2100.0, "condominio": 350.0, "data": datetime.datetime.now()}
        ]
    },
    {
        "titulo": "Casa com Garden em Fazenda",
        "link": "https://exemplo.com/imovel/3",
        "descricao": "Excelente oportunidade em bairro nobre.",
        "metragem": 120.0,
        "quartos": 3,
        "banheiros": 2,
        "vagas": 2,
        "endereco": "Rua Lauro Müller, Fazenda, Itajaí - SC",
        "lat": -26.9100,
        "lng": -48.6450,
        "precos": [
            {"aluguel": 4800.0, "condominio": 0.0, "data": datetime.datetime.now()}
        ]
    }
]

# Uma imagem base64 fake (apenas um placeholder pequeno)
fake_photo = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

for data in imoveis_data:
    # Criar Imóvel
    imovel = Imovel(
        titulo=data["titulo"],
        link=data["link"],
        descricao=data["descricao"],
        metragem=data["metragem"],
        quartos=data["quartos"],
        banheiros=data["banheiros"],
        vagas=data["vagas"],
        endereco=data["endereco"],
        latitude=data["lat"],
        longitude=data["lng"]
    )
    db.add(imovel)
    db.flush() # Para pegar o ID gerado

    # Criar Histórico de Preços
    for p in data["precos"]:
        historico = HistoricoPreco(
            imovel_id=imovel.id,
            preco_aluguel=p["aluguel"],
            preco_condominio=p["condominio"],
            data_coleta=p["data"]
        )
        db.add(historico)
    
    # Adicionar uma foto fake
    foto = Foto(imovel_id=imovel.id, foto_base64=fake_photo)
    db.add(foto)

db.commit()
print("Banco de dados populado com sucesso (Itajaí com coordenadas)!")
db.close()
