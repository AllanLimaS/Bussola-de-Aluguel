---
name: frontend-dev
description: Guide for developing the Bússola de Aluguel frontend. Use this skill when creating, modifying, or debugging React components in the frontend. Includes stack, structure, code patterns, and mandatory validation of changes.
---

> **Project context:** read `.agents/AGENTS.md` before starting any task to understand the overall architecture, conventions, and restrictions of the Bússola de Aluguel project.

# Frontend Development — Bússola de Aluguel

## Stack & Structure

| Technology | Version | Usage |
|---|---|---|
| React | 19 | UI (SPA, no routing) |
| Vite | 8.0.1 | Build & Dev Server |
| Tailwind CSS | 4 | Styling (via `@import "tailwindcss"` in `index.css`) |
| Leaflet + react-leaflet | 1.9 / 5.0 | Interactive map |
| Recharts | 3.x | Price history charts |
| Axios | 1.x | HTTP calls to the API |
| Lucide React | 1.6.0 | Icons |

```
frontend/
├── index.html          # Entry point HTML
├── vite.config.js      # Vite config (React plugin)
├── tailwind.config.js  # Tailwind config
├── postcss.config.js   # PostCSS (Tailwind)
├── src/
│   ├── main.jsx        # Mounts <App /> to #root
│   ├── index.css       # Tailwind + Leaflet CSS + global overrides
│   ├── App.jsx         # Componente principal (Orquestração e Estado)
│   └── components/
│       ├── Sidebar/    # Sidebar, FilterPanel, PropertyCard, MatchInfoModal, NovidadesPanel
│       ├── Map/        # MainMap, CustomMarkers
│       ├── Modal/      # PropertyDetailModal, AttributeGrid
│       └── UI/         # LoadingOverlay, Badges
└── public/             # Static files (favicon, etc.)
```

> Editable files by the agent: only those inside `frontend/src/`.
> Never edit `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, or `index.html` without explicit instruction.

---

- **AI-First Matching:** A aplicação prioriza o score de afinidade (%) em toda a interface. 
    - **Match Tab:** Abas laterais nos cards e modais mostram a nota de match de forma persistente.
    - **Match Info:** Modal de tela cheia que explica os pesos do algoritmo e o perfil do usuário.
- **Interactions:** cada imóvel pode ser marcado como `like`, `dislike` ou `neutral`. 

## What does NOT exist in this project

- **No routing:** there is no React Router or any routing system. It is a single-page SPA.
- **No global state management:** there is no Context API, Redux, Zustand, or similar. All state lives in `App.jsx`.
- **No tests:** there is no Jest, Vitest, or any test framework configured.
- **No TypeScript:** the project uses pure JavaScript (`.jsx`).
- **No separate components:** all logic is in `App.jsx`. Create new component files only if complexity clearly justifies it.

---

## Code Patterns

### Styling
- **Use Tailwind CSS v4 exclusively** for styling via utility classes.
- The theme uses a **dark (slate-900/950)** palette with **indigo** accents.
- Do not create custom CSS unless it is for external lib overrides (e.g., Leaflet popups in `index.css`).

### State & Data
- State managed with `useState` / `useMemo` in `App.jsx`.
- Data comes from the FastAPI API at `http://localhost:8000`.
- **Endpoints used:**
  - `GET /imoveis` → property list (default `status=ativo`). Includes `foto_principal` as URL and `interacao` field.
  - `GET /imoveis/{id}` → full details (fotos[] as URLs, historico_precos[], interacao).
  - `POST /imoveis/{id}/interacao` → set like/dislike/neutral: `{"tipo": "like"}`.
  - `GET /novidades` → busca a lista de novidades não lidas (novos imóveis e reduções de preço).
  - `POST /novidades/{id}/visto` → marca uma novidade como lida.
  - `POST /novidades/limpar` → marca todas as novidades pendentes como lidas.
- Photos are served as **static files** from the API at `/fotos/{id}/foto_N.webp`. Frontend uses `http://localhost:8000` + the path.

### Map ↔ Sidebar Interactivity
- Hover em um card destaca o marcador no mapa (e vice-versa) via `hoveredImovelId`.
- Clique em um marcador faz scroll para o card correspondente via `scrollToCard` + `cardsRef`.
- **Botões de Interação:** No modal de detalhes, use apenas ícones (Heart, Trash, etc) para manter o visual limpo e premium.

---

## Mandatory Validation of Changes

> **RULE: every change in the frontend MUST be visually validated in the browser before being considered complete.**

### Validation Checklist

After any change in `frontend/src/` files:

1. **Ensure the dev server is running** (`npm run dev`). If not, start it.
2. **Open the frontend in the browser** (`http://localhost:5173`) and verify:
   - [ ] The page loads with no errors in the console.
   - [ ] The change made appears correctly.
   - [ ] The **sidebar** renders the cards normally.
   - [ ] The **map** renders with positioned markers.
   - [ ] The **hover** interaction between sidebar ↔ map works.
   - [ ] The **details modal** opens when clicking a card, showing photos, data, and chart.
   - [ ] The **filters** collapse/expand and filter correctly.
3. **If the change involves CSS/layout**, check that nothing around it became misaligned or broken.
4. **If the change involves API calls**, check the browser's Network tab to ensure requests are correct.

### How to Validate Visually

To validate changes in the browser, consult the `playwright-cli` skill available in `.agents/skills/playwright-cli/SKILL.md`. Use the screenshot and snapshot commands documented there to check the visual state of the application at `http://localhost:5173`.

---

## Quick Checklist for New Features

- [ ] Implemented the feature in `App.jsx` (or new component if justifiable)
- [ ] Used Tailwind with the existing palette (slate + indigo)
- [ ] Tested with real data from the API
- [ ] Visually validated in the browser (checklist above)
- [ ] Did not break existing sidebar, map, modal, or filters
