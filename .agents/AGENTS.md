# AGENTS.md — Bússola de Aluguel

> This file is the **mandatory entry point** for any agent working on this project.
> Read this file completely before starting any task.

---

## What is this project

**Bússola de Aluguel** is a Full Stack application for searching and analyzing rental properties.
The system collects listings via web scraping (VivaReal), persists the data in SQLite, and exposes them
through a FastAPI API consumed by an interactive React dashboard with a map and charts.

---

## Repository Structure

```
Bussola-de-Aluguel/
├── .agents/
│   ├── AGENTS.md                         ← this file
│   └── skills/
│       ├── frontend-dev/SKILL.md         ← guide for frontend tasks
│       ├── scraper-dev/SKILL.md          ← guide for scraping tasks
│       └── playwright-cli/SKILL.md       ← reference for playwright-cli commands
├── backend/
│   ├── api/
│   │   └── main.py                       ← FastAPI routes (serves photos via StaticFiles)
│   ├── db/
│   │   ├── database.py                   ← SQLAlchemy models + SQLite session
│   │   ├── manage_db.py                  ← CLI to manage database (seed, cleanup, view executions)
│   │   ├── migrate.py                    ← Manual migration scripts
│   │   └── seed.py                       ← Initial data load script
│   ├── scraper/
│   │   └── scraper.py                    ← Data collection via Playwright (async)
│   ├── data/                             ← (gitignored) SQLite + photos on disk
│   │   ├── banco.sqlite
│   │   ├── fotos/{imovel_id}/foto_N.webp
│   │   └── logs/
│   └── run_scraper.bat                   ← Scheduled execution script (Windows Task Scheduler)
└── frontend/
    ├── src/
    │   ├── App.jsx                       ← Single component, the entire application
    │   ├── main.jsx                      ← Mounts <App /> to #root
    │   └── index.css                     ← Tailwind + external lib overrides
    └── package.json                      ← Dependencies and versions
```

---

## Which skill to use for each task

| Task type | Skill to consult |
|---|---|
| Change UI, components, styles, filters, map, charts | `.agents/skills/frontend-dev/SKILL.md` |
| Scraping, data collection, browser automation | `.agents/skills/scraper-dev/SKILL.md` |
| Any browser command (open, click, snapshot, eval) | `.agents/skills/playwright-cli/SKILL.md` |
| API routes, database models, utility scripts | Read `backend/api/main.py` and `backend/db/database.py` directly |

> **Rule:** read the corresponding skill **before** writing any code. Skills contain
> patterns, restrictions, and known pitfalls that avoid rework.

---

## Architecture and Data Flow

```
VivaReal (web)
     │
     ▼ Playwright (backend/scraper/scraper.py)
     │
     ▼ SQLite via SQLAlchemy (backend/db/database.py)
     │  Tables: imoveis, historico_precos, fotos, interacoes, execucoes
     │  Photos: saved as files on disk (backend/data/fotos/{id}/)
     │
     ▼ FastAPI (backend/api/main.py) → http://localhost:8000
     │  Static photo serving: /fotos/{id}/foto_N.webp
     │
     ▼ Axios (frontend)
     │
     ▼ React + Leaflet + Recharts → http://localhost:5173
```

---

## Global Project Conventions

### Backend
- ORM: **SQLAlchemy**. Never write raw SQL — use the models and session from `backend/db/database.py`.
- Database: local **SQLite** (`.sqlite` file ignored in Git). Do not use another database without explicit instruction.
- **DB tables:** `imoveis`, `historico_precos`, `fotos`, `interacoes` (like/dislike/neutral per property), `execucoes` (scraper run logs).
- Photos are stored as **files on disk** at `backend/data/fotos/{imovel_id}/`. The `fotos` table stores only the relative path.
- Scraping: **always** via `playwright-cli`. Never use `requests` + `BeautifulSoup` for dynamic sites.
- Geocoding: use **GeoPy** (already integrated in `update_coords.py`). Do not call maps APIs directly.

### Frontend
- All logic in **`App.jsx`**. Do not create new component files without clear necessity.
- Styling **exclusively with Tailwind CSS v4**. Do not create custom CSS except in `index.css` for external lib overrides (e.g., Leaflet).
- Palette: **dark** (slate-900/950) with **indigo** accents. Do not introduce new colors without instruction.
- No routing, no Context API, no TypeScript, no tests.

### General
- Do not install new dependencies without confirming with the user.
- Do not change configuration files (`vite.config.js`, `tailwind.config.js`, `postcss.config.js`) without explicit instruction.
- Do not commit the `.sqlite` file.

---

## Available API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/imoveis` | Property list (default `status=ativo`, use `?status=todos` for all) |
| `GET` | `/imoveis/{id}` | Complete details: `fotos[]` (URLs), `historico_precos[]`, `interacao` |
| `POST` | `/imoveis/{id}/interacao` | Set interaction: `{"tipo": "like"}`, `"dislike"`, or `"neutral"` |
| `GET` | `/fotos/{path}` | Static file server for property photos |

> The API runs at `http://localhost:8000`. The frontend consumes it via Axios.

---

## How photos work

Photos are stored as **files on disk** at `backend/data/fotos/{imovel_id}/foto_N.webp`.
The API serves them via FastAPI's `StaticFiles` mount at `/fotos/`. In the frontend, photo URLs
look like `http://localhost:8000/fotos/42/foto_0.webp`. The DB `fotos` table stores only the relative path.

---

## Development ports and URLs

| Service | URL |
|---|---|
| API (FastAPI) | `http://localhost:8000` |
| Frontend (Vite) | `http://localhost:5173` |
| API Docs (Swagger) | `http://localhost:8000/docs` |

---

## What NOT to do (global restrictions)

- ❌ Do not rewrite from scratch something that already works — prefer surgical edits.
- ❌ Do not create files outside the existing structure without explicit instruction.
- ❌ Do not save scraping data in JSON or CSV — always persist via `database.py`.
- ❌ Do not use `requests` + `BeautifulSoup` for scraping — the target site is dynamic (SPA).
- ❌ Do not expose credentials or absolute local paths in any repository file.
- ❌ Do not mark a task as completed without validating the result (visually in the browser for frontend; in the database for backend).
