# Bússola de Aluguel

**Bússola de Aluguel** é uma aplicação Full Stack com o objetivo de ajudar usuários a encontrarem os melhores imóveis para alugar. O sistema faz a busca, coleta (através de *web scraping*) e compilação de imóveis, criando um painel de visualização interativo com dados geográficos, filtros e até gráficos de inteligência para te ajudar na sua tomada de decisão.

---

## Tecnologias Utilizadas

### Backend (Python)
- **[FastAPI](https://fastapi.tiangolo.com/):** Fornecimento da API rápida e robusta.
- **[Playwright](https://playwright.dev/python/):** Web scraping (automação fantasma usando o módulo `playwright-stealth`) para coleta de dados de listagens de imóveis (ex: VivaReal).
- **[SQLAlchemy](https://www.sqlalchemy.org/):** ORM para modelagem e comunicação com o banco de dados.
- **[SQLite](https://www.sqlite.org/):** Banco de dados relacional leve (base local).
- **[GeoPy](https://geopy.readthedocs.io/):** Conversões de endereços em coordenadas geográficas (Geocoding).

### Frontend (React & Vite)
- **[React](https://react.dev/) + [Vite](https://vitejs.dev/):** Criação da interface em SPA com compilação ultra-rápida.
- **[Tailwind CSS](https://tailwindcss.com/):** Estilização visual atrativa e moderna.
- **[React-Leaflet](https://react-leaflet.js.org/):** Visualização de imóveis em no mapa interativo.
- **[Recharts](https://recharts.org/):** Módulo para criar e desenhar gráficos sobre o mercado de aluguel.
- **[Lucide React](https://lucide.dev/):** Biblioteca de ícones elegantes.
- **[Axios](https://axios-http.com/):** Comunicação entre Frontend e a API.

---

## Como Executar o Projeto

Para rodar este projeto na sua máquina, siga os passos abaixo:

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

**Para iniciar a API do Backend:**

```bash
uvicorn api.main:app --reload
```
A API ficará disponível em `http://localhost:8000`.

*Nota: Utilize o arquivo `scraper.py` ou endpoints da API para preencher/atualizar o seu banco de dados (`.sqlite`).*

### 3. Configurando o Frontend

Abra uma nova aba/painel no seu terminal e siga para a pasta do frontend:

```bash
cd frontend
npm install
```

**Para iniciar o painel web:**

```bash
npm run dev
```
O Vite iniciará, e o app ficará normalmente visível na interface web em `http://localhost:5173`.

---

## Estrutura do Projeto

O **Backend** é dividido em módulos com responsabilidades exclusivas:
* `backend/`
  * `api/`: Definição de rotas e Inicialização do FastAPI.
  * `db/`: Conexão com o banco, modelos, e scripts de manipulação de dados como o `manage_db.py`.
  * `scraper/`: Web Scraping e coleta de novos imóveis e imagens.
  * `data/`: Contém o arquivo de banco em SQLite.

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
