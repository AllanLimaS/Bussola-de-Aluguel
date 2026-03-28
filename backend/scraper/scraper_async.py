import asyncio
import json
import os
import re
import random
import sys
import shutil
import time
import base64
from urllib.parse import urljoin
from playwright.async_api import async_playwright
from playwright_stealth import Stealth
import httpx
import argparse

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal, Imovel, HistoricoPreco, Foto, init_db
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

async def get_image_base64(client, url):
    for _ in range(2):
        try:
            response = await client.get(url, timeout=30)
            if response.status_code == 200:
                encoded = base64.b64encode(response.content).decode('utf-8')
                return f"data:image/webp;base64,{encoded}"
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
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_selector('h1', timeout=30000)
        
        # Details
        title = await safe_get_text(page, 'h1')
        
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
        aluguel_selectors = ['.price-info__values-rental .value-item__value', '[data-testid="price-info-value"]', '.olx-text--title-small', '.price__price-info']
        for sel in aluguel_selectors:
            val = await safe_get_text(page, sel)
            if val != "N/A":
                aluguel = val
                break
        
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
                first_url = srcset.split(',')[0].split(' ')[0].strip()
                if "/img/vr-listing/" in first_url and first_url not in photo_urls:
                    photo_urls.append(first_url)
        
        details["fotos"] = photo_urls

        details["fotos_base64"] = []
        if photo_urls:
            async with httpx.AsyncClient(follow_redirects=True, timeout=60) as client:
                for p_url in photo_urls[:20]:
                    b64 = await get_image_base64(client, p_url)
                    if b64:
                        details["fotos_base64"].append(b64)
                
                print_progress(current_idx, total_count, f"Scaped {listing_id} ({len(details['fotos_base64'])} photos)")
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
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=USER_AGENTS[0])
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        
        unique_links_set = set()
        page_num = 1
        
        print(f"Initial load: {SEARCH_URL}")
        await page.goto(SEARCH_URL, wait_until="domcontentloaded", timeout=60000)

        while True:
            print(f"Scraping Links from Page {page_num}...")
            
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

        semaphore = asyncio.Semaphore(4) # Max concurrent browser pages
        
        async def fetch_with_sem(b, lnk, idx, tot):
            async with semaphore:
                # Jitter inicial para evitar triggers antibot disparando tudo ao mesmo milésimo
                await asyncio.sleep(random.uniform(0.5, 3.0))
                return await get_property_details(b, lnk, idx, tot)

        tasks = [fetch_with_sem(browser, link, i+1, total_to_process) for i, link in enumerate(unique_links)]
        results_array = await asyncio.gather(*tasks)
        all_results = [r for r in results_array if r]

        print_progress(total_to_process, total_to_process, "Completed Async Scrape!")
        print(f"\n\nSaving {len(all_results)} results to database...")

        session = SessionLocal()
        geolocator = Nominatim(user_agent="bussola_de_aluguel_scraper")
        
        try:
            for r in all_results:
                imovel = session.query(Imovel).filter(Imovel.link == r["url"]).first()
                if not imovel:
                    # Resolve coordenadas
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
                        longitude=lng
                    )
                    session.add(imovel)
                    session.commit()
                    session.refresh(imovel)
                    
                    for b64 in r.get("fotos_base64", []):
                        foto = Foto(imovel_id=imovel.id, foto_base64=b64)
                        session.add(foto)
                
                novo_alu = extract_numeric(r["aluguel"], is_float=True)
                novo_con = extract_numeric(r["condominio"], is_float=True)
                
                # Sempre insere o registro no historico de preco por exigencia de auditoria
                hist = HistoricoPreco(
                    imovel_id=imovel.id,
                    preco_aluguel=novo_alu,
                    preco_condominio=novo_con
                )
                session.add(hist)
            session.commit()
        finally:
            session.close()
        
        elapsed_time = time.time() - start_time
        print(f"Scrape complete. Data saved to database. Photos stored as Base64.")
        print(f"Total execution time: {elapsed_time:.2f} seconds.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
