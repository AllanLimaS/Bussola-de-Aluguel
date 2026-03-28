# -*- coding: utf-8 -*-
import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

url1 = "https://www.vivareal.com.br/aluguel/santa-catarina/itajai/apartamento_residencial/?onde=%2CSanta+Catarina%2CItaja%C3%AD%2C%2C%2C%2C%2Ccity%2CBR%3ESanta+Catarina%3ENULL%3EItajai%2C-26.908278%2C-48.677511%2C&precoMaximo=3000"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        
        all_unique = set()
        page_num = 1
        
        await page.goto(url1, wait_until="domcontentloaded")
        
        while True:
            for _ in range(5):
                await page.mouse.wheel(0, 1500)
                await asyncio.sleep(2)
                
            links = await page.locator("a[href*=\"/imovel/\"]").all()
            page_unique = set()
            for l in links:
                page_unique.add(await l.get_attribute("href"))
            all_unique.update(page_unique)
            print(f"Page {page_num}: {len(page_unique)} unique on page. Total cumulative unique: {len(all_unique)}")
            
            # Find next page
            next_page_str = f"pagina={page_num+1}"
            next_page_el = page.locator(f"a[title=\"Próxima página\"], .pagination__item a[href*=\"{next_page_str}\"], a[href*=\"{next_page_str}\"]").first
            
            if await next_page_el.count() > 0:
                print(f"Clicking to go to page {page_num+1}...")
                await next_page_el.click(force=True)
                page_num += 1
                await asyncio.sleep(4) 
                
                if page_num > 6:
                    break
            else:
                break
                
        await browser.close()

asyncio.run(main())

