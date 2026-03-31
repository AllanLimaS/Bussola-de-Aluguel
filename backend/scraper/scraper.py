import asyncio
import json
import os
import re
import random
import sys
import shutil
import time
import base64
import datetime
from urllib.parse import urljoin
from playwright.async_api import async_playwright
from playwright_stealth import Stealth
import httpx
import argparse

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal, Imovel, HistoricoPreco, Foto, Execucao, PHOTOS_DIR, init_db
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

# Configuration
BASE_URL = "https://www.vivareal.com.br"
SEARCH_URL = "https://www.vivareal.com.br/aluguel/santa-catarina/itajai/apartamento_residencial/?onde=%2CSanta+Catarina%2CItaja%C3%AD%2C%2C%2C%2C%2Ccity%2CBR%3ESanta+Catarina%3ENULL%3EItajai%2C-26.908278%2C-48.677511%2C&precoMaximo=3000"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
]

def clean_text(text):
    if not text: return "N/A"
    return re.sub(r'\s+', ' ', text).strip()

def extract_numeric(text, is_float=False):
    if text in ["0", "N/A", "Não informado", None]:
        return 0.0 if is_float else 0
    match = re.search(r"[\d.,]+", str(text))
    if match:
        val_str = match.group(0).replace(".", "").replace(",", ".")
        try:
            return float(val_str) if is_float else int(float(val_str))
        except:
            pass
    return 0.0 if is_float else 0

def print_progress(current, total, msg):
    pct = (current / total) * 100 if total > 0 else 0
    sys.stdout.write(f"\r[{pct:5.1f}% ({current}/{total})] {msg}".ljust(100))
    sys.stdout.flush()

def geocode_address(address_str, geolocator):
    """Auxiliar para transformar string de endereço em lat/lng usando GeoPy Nominatim."""
    if not address_str or address_str == "N/A":
        return 0.0, 0.0
        
    try:
        location = geolocator.geocode(address_str, timeout=5)
        if location:
            return location.latitude, location.longitude
        
        partes = address_str.split(',')
        if len(partes) > 1:
            fallback = f"{partes[0]}, Itajaí, SC"
            location = geolocator.geocode(fallback, timeout=5)
            if location:
                return location.latitude, location.longitude
                
        return -26.9078, -48.6619
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"Erro de serviço ao geocodificar {address_str}: {e}")
        return -26.9078, -48.6619
    except Exception as e:
        print(f"Erro inesperado ao geocodificar {address_str}: {e}")
        return -26.9078, -48.6619

async def safe_get_text(page, selector):
    try:
        loc = page.locator(selector).first
        if await loc.count() > 0:
            return await loc.inner_text()
    except:
        pass
    return "N/A"

async def download_image(client, url):
    """Downloads image and returns raw bytes, or None on failure."""
    for _ in range(2):
        try:
            response = await client.get(url, timeout=30)
            if response.status_code == 200:
                return response.content
        except:
            await asyncio.sleep(1)
    return None

async def get_property_details(browser, url, current_idx, total_count):
    match_id = re.search(r"id-(\d+)", url)
    listing_id = match_id.group(1) if match_id else str(random.randint(1000,9999))
    
    context = await browser.new_context(user_agent=random.choice(USER_AGENTS))
    page = await context.new_page()
    await Stealth().apply_stealth_async(page)
    
    try:
        response = await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        
        # Problema #3: Server 502
        if response and response.status >= 500:
            print_progress(current_idx, total_count, f"Skipping {listing_id} (Server Error {response.status})")
            await context.close()
            return None
            
        await page.wait_for_selector('h1', timeout=30000)
        
        # Details
        title = await safe_get_text(page, 'h1')
        if "502" in title or "bad gateway" in title.lower():
            print_progress(current_idx, total_count, f"Skipping {listing_id} (502 Bad Gateway title)")
            await context.close()
            return None
        
        # Robust address extraction
        addr = "N/A"
        addr_selectors = ['[data-testid="location-address"]', '[data-testid="address-info-value"]', '.olx-color-neutral-100', '.address-info__value']
        for sel in addr_selectors:
            val = await safe_get_text(page, sel)
            if val != "N/A":
                addr = val
                if "itajai" in addr.lower() or "sc" in addr.lower(): break

        # Amenities Pattern Match
        async def find_pattern(patterns):
            try:
                all_txt = await page.locator('p, span, li, .olx-text').all_inner_texts()
                for t in all_txt:
                    for p in patterns:
                        if re.search(p, t, re.IGNORECASE): return t
            except: pass
            return "N/A"

        aluguel = "N/A"
        
        # Problema #2: Venda e Aluguel misturados
        try:
            all_text = await page.locator('body').inner_text()
            lines = [line.strip() for line in all_text.split('\n') if line.strip()]
            
            # 1. Buscar na mesma linha "aluguel" ou "mês" junto do valor
            for line in lines:
                l_lower = line.lower()
                if ("aluguel" in l_lower or "mês" in l_lower or "mes" in l_lower) and "r$" in l_lower and "venda" not in l_lower:
                    match = re.search(r"R\$\s*[\d.,]+", line, re.IGNORECASE)
                    if match:
                        num = extract_numeric(match.group(0), is_float=True)
                        if num > 0 and num < 40000:
                            aluguel = match.group(0)
                            break
            
            # 2. Buscar R$ próximo da palavra aluguel / mês
            if aluguel == "N/A":
                for i, line in enumerate(lines):
                    l_lower = line.lower()
                    if "aluguel" in l_lower or "mês" in l_lower or "mes" in l_lower:
                        start_idx = max(0, i-3)
                        end_idx = min(len(lines), i+4)
                        for j in range(start_idx, end_idx):
                            if "r$" in lines[j].lower() and "venda" not in lines[j].lower():
                                match = re.search(r"R\$\s*[\d.,]+", lines[j], re.IGNORECASE)
                                if match:
                                    num = extract_numeric(match.group(0), is_float=True)
                                    if num > 0 and num < 40000:
                                        aluguel = match.group(0)
                                        break
                        if aluguel != "N/A": break
        except: pass

        # 3. Fallbacks originais com sanidade contra preços de venda
        if aluguel == "N/A":
            aluguel_selectors = ['.price-info__values-rental .value-item__value', '[data-testid="price-info-value"]', '.olx-text--title-small', '.price__price-info']
            for sel in aluguel_selectors:
                val = await safe_get_text(page, sel)
                if val != "N/A" and "venda" not in val.lower():
                    # Evita pegar valor de Venda (acima de R$ 40 mil) por engano
                    if extract_numeric(val, is_float=True) < 40000:
                        aluguel = val
                        break

        # Problema #1: Valores de aluguel por dia
        try:
            has_daily = False
            for line in lines:
                l_lower = line.lower()
                if l_lower in ["/dia", "por dia", "diária", "/diária", "/diaria", "diária:"]:
                    has_daily = True
                    break
                if "r$" in l_lower and ("dia" in l_lower or "diária" in l_lower or "diaria" in l_lower):
                    has_daily = True
                    break
            
            if has_daily:
                print_progress(current_idx, total_count, f"Skipping {listing_id} (Daily rent detected)")
                await context.close()
                return None
        except: pass
        
        details = {
            "url": url,
            "listing_id": listing_id,
            "titulo": clean_text(title),
            "aluguel": clean_text(aluguel),
            "descricao": clean_text(await safe_get_text(page, '[data-testid="description-content"]')),
            "metragem": clean_text(await find_pattern([r"\d+\s*m²"])),
            "quartos": clean_text(await find_pattern([r"\d+\s*quarto"])),
            "banheiros": clean_text(await find_pattern([r"\d+\s*banheiro"])),
            "vagas": clean_text(await find_pattern([r"\d+\s*vaga"])),
            "localizacao": clean_text(addr)
        }

        # Condo/IPTU
        try:
            details["condominio"], details["iptu"] = "0", "0"
            condo_loc = page.locator('[data-testid="condoFee"]')
            if await condo_loc.count() > 0:
                details["condominio"] = await condo_loc.inner_text()
            
            iptu_loc = page.locator('[data-testid="iptu"]')
            if await iptu_loc.count() > 0:
                details["iptu"] = await iptu_loc.inner_text()
                
            # Fallback legacy extraction
            if details["condominio"] in ["0", "N/A", "Não informado"] and details["iptu"] in ["0", "N/A", "Não informado"]:
                li_elements = await page.locator('li').all()
                for li in li_elements:
                    t = await li.inner_text()
                    if "Condomínio" in t:
                        m = re.search(r"R\$\s*[\d.]+", t)
                        if m: details["condominio"] = m.group(0)
                    if "IPTU" in t:
                        m = re.search(r"R\$\s*[\d.]+", t)
                        if m: details["iptu"] = m.group(0)
        except: pass

        # PHOTO EXTRACTION (Definitive Headless Fix)
        print_progress(current_idx, total_count, f"Expanding photos for {listing_id}...")
        
        photo_btn = page.locator('#modal-image-button, button:has-text("fotos"), button:has-text("Fotos")').first
        if await photo_btn.count() > 0:
            await photo_btn.click(force=True)
            await asyncio.sleep(5)

        photo_elements = await page.locator('.image-container__item picture source, picture source[srcset]').all()
        photo_urls = []
        for el in photo_elements:
            srcset = await el.get_attribute('srcset')
            if srcset:
                parts = [p.strip() for p in srcset.split(',') if p.strip()]
                # Pega a penúltima qualidade para equilíbrio entre peso e resolução
                target = parts[-2] if len(parts) >= 2 else parts[0]
                photo_url = target.split(' ')[0].strip()
                
                if "/img/vr-listing/" in photo_url and photo_url not in photo_urls:
                    photo_urls.append(photo_url)
        
        details["fotos"] = photo_urls

        details["fotos_bytes"] = []
        if photo_urls:
            async with httpx.AsyncClient(follow_redirects=True, timeout=60) as client:
                for p_url in photo_urls[:20]:
                    img_bytes = await download_image(client, p_url)
                    if img_bytes:
                        details["fotos_bytes"].append(img_bytes)
                
                print_progress(current_idx, total_count, f"Scaped {listing_id} ({len(details['fotos_bytes'])} photos)")
        else:
            print_progress(current_idx, total_count, f"Scaped {listing_id} (0 photos)")

        await context.close()
        return details
    except Exception:
        await context.close()
        return None

async def main():
    start_time = time.time()
    
    # Ensure database is initialized
    init_db()
    
    # --- Cenário 11: Verificar se já existe execução em andamento ---
    session = SessionLocal()
    execucao_pendente = session.query(Execucao).filter(Execucao.status == "rodando").first()
    if execucao_pendente:
        tempo_rodando = (datetime.datetime.utcnow() - execucao_pendente.data_inicio).total_seconds()
        if tempo_rodando > 21600:  # 6 horas = provavelmente crashou
            print(f"[RECOVERY] Execucao #{execucao_pendente.id} estava 'rodando' ha {tempo_rodando/3600:.1f}h. Marcando como erro.")
            execucao_pendente.status = "erro"
            execucao_pendente.data_fim = datetime.datetime.utcnow()
            execucao_pendente.erro_mensagem = "Marcado como erro automaticamente (timeout 6h)"
            session.commit()
        else:
            print(f"[ABORT] Ja existe execucao #{execucao_pendente.id} em andamento desde {execucao_pendente.data_inicio}. Abortando.")
            session.close()
            return
    session.close()
    
    # --- Execution tracking: create record at start ---
    session = SessionLocal()
    execucao = Execucao(
        data_inicio=datetime.datetime.utcnow(),
        status="rodando"
    )
    session.add(execucao)
    session.commit()
    session.refresh(execucao)
    execucao_id = execucao.id
    session.close()
    
    contadores = {
        "novos": 0,
        "atualizados": 0,
        "erros": 0,
        "ignorados": 0,
        "paginas": 0,
        "dados_invalidos": 0,
    }
    
    unique_links_set = set()
    final_status = "erro"  # default pessimista, sobrescrito se sucesso
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent=USER_AGENTS[0])
            page = await context.new_page()
            await Stealth().apply_stealth_async(page)
            
            page_num = 1
            
            print(f"Initial load: {SEARCH_URL}")
            await page.goto(SEARCH_URL, wait_until="domcontentloaded", timeout=60000)

            while True:
                print(f"Scraping Links from Page {page_num}...")
                contadores["paginas"] = page_num
                
                # Scroll slowly to load lazy cards and pagination block
                for _ in range(5): 
                    await page.mouse.wheel(0, 1500)
                    await asyncio.sleep(2.5)

                found = await page.locator('a[href*="/imovel/"]').all()
                for el in found:
                    href = await el.get_attribute('href')
                    if href: unique_links_set.add(urljoin(BASE_URL, href))
                    
                print(f"Found {len(unique_links_set)} total unique listings so far...")
                
                # Find next page
                next_page_str = f"pagina={page_num+1}"
                next_page_el = page.locator(f'a[title="Próxima página"], .pagination__item a[href*="{next_page_str}"], a[href*="{next_page_str}"]').first
                
                if await next_page_el.count() > 0:
                    print(f"Clicking to go to page {page_num+1}...")
                    await next_page_el.click(force=True)
                    page_num += 1
                    await asyncio.sleep(4) # Wait for React router to hydrate new cards
                    try:
                        # Wait for at least one card to re-appear
                        await page.wait_for_selector('a[href*="/imovel/"]', timeout=20000) 
                    except: pass
                else:
                    print("No further pages found.")
                    break
                    
            unique_links = list(unique_links_set)
            total_to_process = len(unique_links)
            print(f"Verified {total_to_process} listings. Starting Asynchronous PARALLEL scrape...")
            await context.close()

            semaphore = asyncio.Semaphore(2) # Max concurrent browser pages (reduzido para anti-bot)
            
            async def fetch_with_sem(b, lnk, idx, tot):
                async with semaphore:
                    # Jitter maior para evitar detecção anti-bot
                    await asyncio.sleep(random.uniform(3.0, 8.0))
                    return await get_property_details(b, lnk, idx, tot)

            tasks = [fetch_with_sem(browser, link, i+1, total_to_process) for i, link in enumerate(unique_links)]
            results_array = await asyncio.gather(*tasks)
            all_results = [r for r in results_array if r]
            contadores["ignorados"] = total_to_process - len(all_results)

            print_progress(total_to_process, total_to_process, "Completed Async Scrape!")
            print(f"\n\nSaving {len(all_results)} results to database...")

            session = SessionLocal()
            geolocator = Nominatim(user_agent="bussola_de_aluguel_scraper")
            
            # Coleta os links processados com sucesso nesta execução
            links_vistos_hoje = set()
            
            try:
                for r in all_results:
                    # --- Cenário 9: Validação de dados ---
                    novo_alu = extract_numeric(r["aluguel"], is_float=True)
                    novo_con = extract_numeric(r.get("condominio", "0"), is_float=True)
                    
                    if novo_alu == 0 and novo_con == 0:
                        contadores["dados_invalidos"] += 1
                        continue  # Pula imóvel sem preço — sem valor pro usuário
                    
                    links_vistos_hoje.add(r["url"])
                    imovel = session.query(Imovel).filter(Imovel.link == r["url"]).first()
                    
                    if not imovel:
                        # --- Novo imóvel ---
                        lat, lng = geocode_address(r["localizacao"], geolocator)
                        time.sleep(1.2) # Rate limit rule for Nominatim
                        
                        imovel = Imovel(
                            link=r["url"],
                            titulo=r["titulo"],
                            descricao=r["descricao"],
                            metragem=extract_numeric(r["metragem"], is_float=True),
                            quartos=extract_numeric(r["quartos"]),
                            banheiros=extract_numeric(r["banheiros"]),
                            vagas=extract_numeric(r["vagas"]),
                            endereco=r["localizacao"],
                            latitude=lat,
                            longitude=lng,
                            status="ativo",
                            last_seen_at=datetime.datetime.utcnow()
                        )
                        session.add(imovel)
                        session.commit()
                        session.refresh(imovel)
                        
                        # Salvar fotos em disco
                        imovel_photos_dir = os.path.join(PHOTOS_DIR, str(imovel.id))
                        os.makedirs(imovel_photos_dir, exist_ok=True)
                        
                        for idx, img_bytes in enumerate(r.get("fotos_bytes", [])):
                            filename = f"foto_{idx}.webp"
                            filepath = os.path.join(imovel_photos_dir, filename)
                            with open(filepath, "wb") as f:
                                f.write(img_bytes)
                            
                            relative_path = f"{imovel.id}/{filename}"
                            foto = Foto(imovel_id=imovel.id, foto_path=relative_path)
                            session.add(foto)
                        
                        contadores["novos"] += 1
                    else:
                        # --- Imóvel já existe: atualiza dados e marca como ativo ---
                        imovel.titulo = r["titulo"]
                        imovel.descricao = r["descricao"]
                        imovel.metragem = extract_numeric(r["metragem"], is_float=True)
                        imovel.quartos = extract_numeric(r["quartos"])
                        imovel.banheiros = extract_numeric(r["banheiros"])
                        imovel.vagas = extract_numeric(r["vagas"])
                        imovel.status = "ativo"
                        imovel.last_seen_at = datetime.datetime.utcnow()
                        
                        contadores["atualizados"] += 1
                    
                    # Sempre insere o registro no historico de preco por exigencia de auditoria
                    hist = HistoricoPreco(
                        imovel_id=imovel.id,
                        preco_aluguel=novo_alu,
                        preco_condominio=novo_con
                    )
                    session.add(hist)
                session.commit()
                
                # --- Ciclo de vida: marcar imóveis não vistos ---
                agora = datetime.datetime.utcnow()
                limite_removido = agora - datetime.timedelta(days=15)
                
                # Todos os imóveis ativos que NÃO apareceram neste scrape → inativo
                imoveis_ativos = session.query(Imovel).filter(Imovel.status == "ativo").all()
                inativos_count = 0
                for im in imoveis_ativos:
                    if im.link not in links_vistos_hoje:
                        im.status = "inativo"
                        inativos_count += 1
                
                # Imóveis inativos há mais de 15 dias → removido + limpeza de fotos (Cenário 10)
                imoveis_inativos = session.query(Imovel).filter(
                    Imovel.status == "inativo",
                    Imovel.last_seen_at < limite_removido
                ).all()
                removidos_count = len(imoveis_inativos)
                for im in imoveis_inativos:
                    im.status = "removido"
                    # Limpeza automática de fotos do disco
                    foto_dir = os.path.join(PHOTOS_DIR, str(im.id))
                    if os.path.exists(foto_dir):
                        shutil.rmtree(foto_dir)
                        print(f"  [CLEANUP] Fotos removidas: {foto_dir}")
                
                session.commit()
                
                if inativos_count > 0 or removidos_count > 0:
                    print(f"\n[LIFECYCLE] {inativos_count} imoveis marcados como INATIVO | {removidos_count} marcados como REMOVIDO")
                
                if contadores["dados_invalidos"] > 0:
                    print(f"[VALIDACAO] {contadores['dados_invalidos']} imoveis ignorados por preco R$ 0")
                
            finally:
                session.close()
            
            elapsed_time = time.time() - start_time
            print(f"Scrape complete. Data saved to database. Photos stored to disk.")
            print(f"Total execution time: {elapsed_time:.2f} seconds.")
            await browser.close()
        
        # --- Cenário 12: Alerta de sanidade pós-scrape ---
        total_processados = contadores["novos"] + contadores["atualizados"]
        if total_processados > 0 and contadores["dados_invalidos"] > 0:
            taxa_invalidos = contadores["dados_invalidos"] / (total_processados + contadores["dados_invalidos"])
            if taxa_invalidos > 0.5:
                alerta_msg = f"ALERTA: {taxa_invalidos*100:.0f}% dos imoveis com preco R$ 0. Possivel quebra de seletores CSS!"
                print(f"\n⚠️  {alerta_msg}")
                # Salvar alerta na execução
                session = SessionLocal()
                try:
                    exec_record = session.query(Execucao).get(execucao_id)
                    if exec_record:
                        exec_record.erro_mensagem = alerta_msg
                    session.commit()
                finally:
                    session.close()
        
        # --- Execution tracking: mark as complete ---
        final_status = "completo"
    
    except Exception as e:
        final_status = "erro"
        contadores["erros"] += 1
        elapsed_time = time.time() - start_time
        print(f"\n[ERRO] Scraper falhou apos {elapsed_time:.2f}s: {e}")
        
        # Save error message for debugging
        session = SessionLocal()
        try:
            exec_record = session.query(Execucao).get(execucao_id)
            if exec_record:
                exec_record.erro_mensagem = str(e)[:2000]  # Truncate to avoid huge messages
            session.commit()
        finally:
            session.close()
    
    finally:
        # --- Execution tracking: always finalize the record ---
        elapsed_time = time.time() - start_time
        session = SessionLocal()
        try:
            exec_record = session.query(Execucao).get(execucao_id)
            if exec_record:
                exec_record.data_fim = datetime.datetime.utcnow()
                exec_record.duracao_segundos = round(elapsed_time, 2)
                exec_record.total_links_encontrados = len(unique_links_set)
                exec_record.total_novos = contadores["novos"]
                exec_record.total_atualizados = contadores["atualizados"]
                exec_record.total_erros = contadores["erros"]
                exec_record.total_ignorados = contadores["ignorados"]
                exec_record.total_paginas_scrapadas = contadores["paginas"]
                exec_record.status = final_status
            session.commit()
        finally:
            session.close()
        
        print(f"\n{'='*60}")
        print(f"  RESUMO DA EXECUCAO #{execucao_id}")
        print(f"  Status: {final_status.upper()}")
        print(f"  Duracao: {elapsed_time:.2f}s")
        print(f"  Paginas scrapadas: {contadores['paginas']}")
        print(f"  Links encontrados: {len(unique_links_set)}")
        print(f"  Novos imoveis: {contadores['novos']}")
        print(f"  Atualizados: {contadores['atualizados']}")
        print(f"  Ignorados/Skipped: {contadores['ignorados']}")
        print(f"  Dados invalidos (R$ 0): {contadores['dados_invalidos']}")
        print(f"  Erros: {contadores['erros']}")
        print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(main())
