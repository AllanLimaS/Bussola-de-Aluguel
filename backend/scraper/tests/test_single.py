import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

URL = "https://www.vivareal.com.br/imovel/apartamento-2-quartos-sao-roque-bairros-itajai-com-garagem-90m2-aluguel-RS2800-id-2877046322/?source=ranking%2Crp"

async def safe_get_text(page, selector):
    try:
        loc = page.locator(selector).first
        if await loc.count() > 0:
            return await loc.inner_text()
    except Exception as e:
        pass
    return "N/A"

async def extract():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        
        print("Navigating...")
        await page.goto(URL, wait_until="domcontentloaded", timeout=60000)
        try:
            await page.wait_for_selector('h1', timeout=15000)
        except:
            print("Timeout waiting for h1, dumping page title")
            print(await page.title())
            await browser.close()
            return

        title = await safe_get_text(page, 'h1')
        print(f"Title: {title}")
        
        addr_selectors = ['[data-testid="location-address"]', '[data-testid="address-info-value"]', '.olx-color-neutral-100', '.address-info__value']
        for sel in addr_selectors:
            val = await safe_get_text(page, sel)
            print(f"Addr sel [{sel}]: {val}")
                
        aluguel_selectors = ['.price-info__values-rental .value-item__value', '[data-testid="price-info-value"]', '.olx-text--title-small', '.price__price-info']
        for sel in aluguel_selectors:
            val = await safe_get_text(page, sel)
            print(f"Price sel [{sel}]: {val}")
                
        desc = await safe_get_text(page, '[data-testid="description-content"]')
        print(f"Desc [data-testid=\"description-content\"]: {desc[:50]}...")
        
        # Test finding amenity patterns
        all_txt = await page.locator('p, span, li, .olx-text').all_inner_texts()
        print(f"Total elements matching amenities tags: {len(all_txt)}")
        
        # Test condominio / IPTU logic
        print(f"Condo: {await safe_get_text(page, '[data-testid=\"condoFee\"]')}")
        print(f"IPTU: {await safe_get_text(page, '[data-testid=\"iptu\"]')}")

        # Photos
        photo_btn = page.locator('#modal-image-button, button:has-text("fotos"), button:has-text("Fotos")').first
        print(f"Photos button count: {await photo_btn.count()}")
        
        await browser.close()
        
asyncio.run(extract())
