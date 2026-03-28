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
│   ├── api.py                            ← FastAPI routes
│   ├── database.py                       ← SQLAlchemy models + SQLite session
│   ├── scraper.py                        ← data collection via Playwright
│   ├── seed.py                           ← initial data load script
│   └── update_coords.py                  ← address geocoding (GeoPy)
└── frontend/
    ├── src/
    │   ├── App.jsx                       ← single component, the entire application
    │   ├── main.jsx                      ← mounts <App /> to #root
    │   └── index.css                     ← Tailwind + external lib overrides
    └── package.json                      ← dependencies and project real versions
```

---

## Which skill to use for each task

| Task type | Skill to consult |
|---|---|
| Change UI, components, styles, filters, map, charts | `.agents/skills/frontend-dev/SKILL.md` |
| Scraping, data collection, browser automation | `.agents/skills/scraper-dev/SKILL.md` |
| Any browser command (open, click, snapshot, eval) | `.agents/skills/playwright-cli/SKILL.md` |
| API routes, database models, utility scripts | Read `backend/api.py` and `backend/database.py` directly |

> **Rule:** read the corresponding skill **before** writing any code. Skills contain
> patterns, restrictions, and known pitfalls that avoid rework.

---

## Architecture and Data Flow

```
VivaReal (web)
     │
     ▼ playwright (scraper.py)
     │
     ▼ SQLite via SQLAlchemy (database.py)
     │
     ▼ FastAPI (api.py) → http://localhost:8000
     │
     ▼ Axios (frontend)
     │
     ▼ React + Leaflet + Recharts → http://localhost:5173
```

---

## Global Project Conventions

### Backend
- ORM: **SQLAlchemy**. Never write raw SQL — use the models and session from `database.py`.
- Database: local **SQLite** (`.sqlite` file ignored in Git). Do not use another database without explicit instruction.
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
| `GET` | `/imoveis` | Summarized property list (includes `foto_principal` in base64) |
| `GET` | `/imoveis/{id}` | Complete details: `fotos[]`, `historico_precos[]` |

> The API runs at `http://localhost:8000`. The frontend consumes it via Axios.

---

## How photos work

Photos arrive from the API as **base64 strings**. Before mounting the `src` attribute, the frontend checks
if the string already has the `data:image` prefix. If it does not, it adds it. Keep this pattern in
any change that involves images.

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
