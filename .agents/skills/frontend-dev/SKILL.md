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
│   ├── App.css         # Legacy CSS (does not style current App)
│   └── App.jsx         # Single component — the entire application
└── public/             # Static files (favicon, etc.)
```

> Editable files by the agent: only those inside `frontend/src/`.
> Never edit `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, or `index.html` without explicit instruction.

---

## Application Context

The application is a **rental properties dashboard** with:

- **Sidebar (1/3 of the screen):** list of property cards with thumbnail, summarized info, collapsible filters, and price sorting.
- **Map (2/3 of the screen):** Leaflet with interactive markers that sync hover/click with the sidebar.
- **Details Modal:** photo carousel, full data, mini location map, price evolution chart (Recharts).

All logic is concentrated in `App.jsx` (single component, ~550 lines).

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
  - `GET /imoveis` → summarized list (includes `foto_principal` in base64).
  - `GET /imoveis/{id}` → full details (fotos[], historico_precos[]).
- Photos arrive as **base64 strings**. The frontend checks if it already has the `data:image` prefix before mounting the `src`.

### Map ↔ Sidebar Interactivity
- Hover on a card highlights the marker on the map (and vice versa) via `hoveredImovelId`.
- Click on a marker scrolls to the corresponding card via `scrollToCard` + `cardsRef`.
- Click on a card opens the details modal via `handleOpenDetail`.

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
