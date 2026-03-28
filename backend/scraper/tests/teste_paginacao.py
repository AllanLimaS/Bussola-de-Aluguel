import asyncio
from urllib.parse import urljoin
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

# Configuration
BASE_URL = "https://www.vivareal.com.br"
SEARCH_URL = "https://www.vivareal.com.br/aluguel/santa-catarina/itajai/apartamento_residencial/?onde=%2CSanta+Catarina%2CItaja%C3%AD%2C%2C%2C%2C%2Ccity%2CBR%3ESanta+Catarina%3ENULL%3EItajai%2C-26.908278%2C-48.677511%2C&precoMaximo=3000"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=USER_AGENTS[0])
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        
        unique_links_set = set()
        total_repetidos = 0
        page_num = 1
        
        print("Iniciando coleta de links com paginação...")
        print(f"URL de busca: {SEARCH_URL}\n")
        await page.goto(SEARCH_URL, wait_until="domcontentloaded", timeout=60000)

        while True:
            # Scroll slowly to load lazy cards and pagination block
            for _ in range(5): 
                await page.mouse.wheel(0, 1500)
                await asyncio.sleep(2.5)

            found = await page.locator('a[href*="/imovel/"]').all()
            links_da_pagina_atual = set()
            
            for el in found:
                href = await el.get_attribute('href')
                if href:
                    links_da_pagina_atual.add(urljoin(BASE_URL, href))
            
            novos_nesta_pagina = 0
            
            for link in links_da_pagina_atual:
                if link not in unique_links_set:
                    unique_links_set.add(link)
                    novos_nesta_pagina += 1
                else:
                    total_repetidos += 1
            
            print(f"pagina {page_num}: {novos_nesta_pagina} links diferentes")
            
            # Find next page
            next_page_str = f"pagina={page_num+1}"
            next_page_el = page.locator(f'a[title="Próxima página"], .pagination__item a[href*="{next_page_str}"], a[href*="{next_page_str}"]').first
            
            if await next_page_el.count() > 0:
                await next_page_el.click(force=True)
                page_num += 1
                await asyncio.sleep(4) # Wait for React router to hydrate new cards
                try:
                    # Wait for at least one card to re-appear
                    await page.wait_for_selector('a[href*="/imovel/"]', timeout=20000) 
                except: pass
            else:
                break
                
        total_diferentes = len(unique_links_set)
        print("\n--------------------------------------------------")
        print(f"total de links diferentes coletados: {total_diferentes}")
        print(f"total de links repetidos coletados : {total_repetidos}")
        print("--------------------------------------------------")

        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
