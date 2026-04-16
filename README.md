**Bússola de Aluguel** é uma plataforma inteligente focada em transformar a busca por imóveis em uma experiência orientada por dados e afinidade. Utilizando um motor de recomendação proprietário (AI-First), o sistema aprende suas preferências através de interações (Likes/Dislikes) para calcular um score de **Match** preciso, considerando preço total, localização multi-zonal e características do imóvel.

---

## Tecnologias Utilizadas

### Backend (Python)
- **[FastAPI](https://fastapi.tiangolo.com/):** Fornecimento da API rápida e robusta.
- **[Playwright](https://playwright.dev/python/):** Web scraping (automação fantasma usando o módulo `playwright-stealth`) para coleta de dados de listagens de imóveis em portais de aluguel.
- **[SQLAlchemy](https://www.sqlalchemy.org/):** ORM para modelagem e comunicação com o banco de dados.
- **[SQLite](https://www.sqlite.org/):** Banco de dados relacional leve (base local).
- **[GeoPy](https://geopy.readthedocs.io/):** Conversões de endereços em coordenadas geográficas (Geocoding).

### Frontend (React & Vite)
- **[React](https://react.dev/) + [Vite](https://vitejs.dev/):** Criação da interface em SPA com compilação ultra-rápida.
- **[Tailwind CSS](https://tailwindcss.com/):** Estilização visual atrativa e moderna.
- **[React-Leaflet](https://react-leaflet.js.org/):** Visualização de imóveis em no mapa interativo.
- **[Recharts](https://recharts.org/):** Módulo para criar e desenhar gráficos sobre o mercado de aluguel.
- **[Lucide React](https://lucide.dev/):** Biblioteca de ícones elegantes.
### Inteligência e Algoritmo (Python)
- **Motor de Match:** Algoritmo ponderado que considera:
    - **Preço Total (50%):** Aluguel + Condomínio com penalidade agressiva para desvios de orçamento.
    - **Localização Multi-Zonal (15%):** Cálculo de proximidade baseado nos seus likes individuais (suporta múltiplos bairros).
    - **Garagem (20%) e Características (15%):** Afinidade por número de vagas, quartos e metragem.
- **Transparência Algorítmica:** Painel detalhado ("Como funciona o Match?") que expõe o seu perfil calculado pela IA.

---

## Como Executar o Projeto

Para rodar este projeto na sua máquina, siga os passos abaixo:

### Atalho Rápido (Windows)
Se você já configurou o ambiente conforme as orientações abaixo, use:
- Execute o arquivo **`run_project.bat`** na raiz do repositório para abrir o Backend e o Frontend simultaneamente em janelas separadas.

---

### 1. Pré-requisitos
- Ter o **Python 3.10+** instalado.
- Ter o **Node.js** (v18+) e o **npm** instalados.
- Ter configurado a versão livre da política de execução no PowerShell (`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`), caso seja usuário de Windows.

### 2. Configurando o Backend

Navegue até o diretório do backend, crie um ambiente virtual, instale as dependências e o Playwright:

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

#### 2.1. Configuração do Scraper (.env)

O sistema de coleta de dados (Scraper) é agnóstico. Para que ele funcione, você deve configurar as URLs de origem no arquivo `.env`.

1. Na pasta `backend/`, crie um arquivo chamado `.env` baseado no `.env.example`.
2. Preencha as seguintes variáveis:
   - `SOURCE_BASE_URL`: A URL base do portal de imóveis que deseja utilizar.
   - `SOURCE_SEARCH_URL`: A URL completa da busca (com filtros de cidade, preço, etc.) que o scraper deve percorrer.

> [!IMPORTANT]
> O desenvolvedor é responsável por ajustar os seletores do `scraper.py` caso decida utilizar um portal com estrutura de HTML diferente do padrão implementado.

**Para iniciar a API do Backend:**

```bash
uvicorn api.main:app --reload --host 0.0.0.0
```
A API ficará disponível em `http://localhost:8000` (e no seu IP da rede local).

*Nota: Utilize o arquivo `scraper.py` ou endpoints da API para preencher/atualizar o seu banco de dados (`.sqlite`).*

### 3. Configurando o Frontend

Abra uma nova aba/painel no seu terminal e siga para a pasta do frontend:

```bash
cd frontend
npm install
```

**Para iniciar o painel web:**

```bash
npm run dev -- --host
```
O Vite iniciará, e o app ficará visível em `http://localhost:5173` e também em um endereço `http://192.168.x.x:5173` para acesso via rede local.

> [!TIP]
> Graças ao proxy configurado no Vite, o frontend agora usa caminhos relativos (`/api`) para falar com o backend. Isso permite que qualquer dispositivo na sua rede acesse o site sem precisar configurar IPs manualmente no código.

---

## Estrutura do Projeto

O **Backend** é dividido em módulos com responsabilidades exclusivas:
* `backend/`
  * `api/`: Definição de rotas e Inicialização do FastAPI.
  * `db/`: Conexão com o banco, modelos, e scripts de manipulação de dados como o `manage_db.py`.
  * `scraper/`: Web Scraping e coleta de novos imóveis e imagens.
  * `data/`: Contém o arquivo de banco em SQLite (tabelas: `imoveis`, `historico_precos`, `fotos`, `interacoes`, `execucoes`, `novidades`).

O **Frontend** possui estrutura reativa padrão:
* `frontend/`
  * Estrutura de código modular em React + Vite.
  * Gráficos com Recharts e interações via Mapa (Leaflet).

---

## CLI de Gerenciamento do Banco (`manage_db.py`)

Para sua facilidade, existe um utilitário exclusivo no terminal (`manage_db.py`) feito para acelerar o desenvolvimento local. Ele abre um rápido **menu interativo usando as setinhas do seu teclado** que permite:
1. **Limpar Tabelas**: Apagar fotos, zerar transações ou dar um reset completo sem precisar abrir o banco manualmente.
2. **Seed (Dados Falsos)**: Inserir *n* novos imóveis aleatórios sem depender ou precisar aguardar os Web Scrapers rodarem.

**Como usar:**
Garante que está na pasta `backend/` do seu terminal e rode:
```bash
python db/manage_db.py
```
Esse utilitário usa a biblioteca `questionary` para rodar de forma perfeitamente nativa no Windows.

---

## Funcionalidades Principais

- **AI-First Search:** A listagem padrão é sempre ordenada pela sua afinidade (Match %).
- **Mapa Interativo Sincronizado:** Navegue geograficamente com feedback visual imediato na barra lateral.
- **Transparência de Perfil:** Veja exatamente quais critérios a IA está usando para te recomendar imóveis.
- **Filtros Avançados:** Oculte descartados ou veja apenas favoritos com um clique.
- **Recálculo em Tempo Real:** Botão para forçar a atualização das recomendações após novas interações.
- **Localização Multi-Zonal:** Suporte para múltiplos bairros de interesse simultâneos.
- **Feed de Novidades Inteligente:** Alertas de imóveis recém-postados e reduções de preço direto no sidebar.
