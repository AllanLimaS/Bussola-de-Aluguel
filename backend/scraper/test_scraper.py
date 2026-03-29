import asyncio
import os
import sys
import time
from playwright.async_api import async_playwright

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scraper import get_property_details

async def test_urls():
    url_dia = "https://www.vivareal.com.br/imovel/apartamento-2-quartos-praia-brava-de-itajai-bairros-itajai-com-garagem-65m2-aluguel-RS550-id-2543214695/"
    url_misto = "https://www.vivareal.com.br/imovel/apartamento-1-quartos-carvalho-bairros-itajai-com-garagem-40m2-venda-RS318000-id-2877212393/"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        print("\n--- Testando URL com aluguel por dia ---")
        res_dia = await get_property_details(browser, url_dia, 1, 2)
        if res_dia is None:
            print("SUCESSO: O imóvel por dia foi rejeitado e retornou None.")
        else:
            print(f"FALHA: O imóvel não foi rejeitado. Aluguel detectado: {res_dia.get('aluguel')}")

        print("\n--- Testando URL mista (Venda e Aluguel) ---")
        res_misto = await get_property_details(browser, url_misto, 2, 2)
        if res_misto is not None:
            aluguel = res_misto.get('aluguel')
            print(f"Aluguel extraído: {aluguel}")
            if "318000" in aluguel.replace(".", ""):
                print("FALHA: Pegou valor de venda!")
            else:
                print("SUCESSO: Conseguiu isolar o preço de aluguel correto!")
        else:
            print("FALHA: A função retornou None para o imóvel misto válido.")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_urls())
