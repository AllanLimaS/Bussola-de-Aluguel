import os
import sys
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import Imovel, DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def update_coordinates():
    session = SessionLocal()
    agente = Nominatim(user_agent="bussola_de_aluguel_geocoder")

    try:
        # Pega todos os imóveis que estão com lat/lng zerados
        imoveis = session.query(Imovel).filter(
            (Imovel.latitude == 0.0) | (Imovel.longitude == 0.0) | 
            (Imovel.latitude == None) | (Imovel.longitude == None)
        ).all()

        print(f"Encontramos {len(imoveis)} imóveis sem coordenadas.")

        for imovel in imoveis:
            if not imovel.endereco or imovel.endereco == "N/A":
                continue

            print(f"Buscando coordenadas para: {imovel.endereco}")
            
            # Limpa um pouco o endereço se tiver "SC" no final para facilitar a busca do Nominatim
            # O nominatim funciona melhor com buscas limpas.
            endereco_busca = imovel.endereco
            
            _tentativas = 3
            location = None
            while _tentativas > 0:
                try:
                    location = agente.geocode(endereco_busca, timeout=10)
                    break
                except (GeocoderTimedOut, GeocoderServiceError):
                    print("Timeout ou erro. Tentando novamente...")
                    _tentativas -= 1
                    time.sleep(2)

            if location:
                imovel.latitude = location.latitude
                imovel.longitude = location.longitude
                print(f" -> Encontrado: {location.latitude}, {location.longitude}")
            else:
                # Fallback: tentar buscar apenas a rua e a cidade
                partes = imovel.endereco.split(',')
                if len(partes) > 1:
                    fallback_busca = partes[0] + ", Itajaí, SC"
                    print(f" -> Falhou com o orginal, tentando fallback: {fallback_busca}")
                    try:
                        location = agente.geocode(fallback_busca, timeout=10)
                    except:
                        location = None
                    
                    if location:
                        imovel.latitude = location.latitude
                        imovel.longitude = location.longitude
                        print(f" -> Encontrado (fallback): {location.latitude}, {location.longitude}")
                    else:
                        print(" -> Não encontrado mesmo com fallback.")
                        # Fallback extremo só Itajaí
                        imovel.latitude = -26.9078
                        imovel.longitude = -48.6619
                else:
                    print(" -> Não encontrado.")
                    # Fallback Itajaí
                    imovel.latitude = -26.9078
                    imovel.longitude = -48.6619

            # Salva no banco as alterações de cada um
            session.commit()
            
            # Rate limiting respeitando o Nominatim (1 request por segundo é a regra oficial)
            time.sleep(1.5)

        print("\nProcesso finalizado!")

    except Exception as e:
        print(f"Erro durante atualização: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    update_coordinates()
