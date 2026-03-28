---
name: scraper-dev
description: Guide for developing web scrapers. ALWAYS uses playwright-cli for browser automation. MANDATORY: before any task, read the skill in .agents/skills/playwright-cli/SKILL.md. Use this skill when the user needs to extract data from sites, automate information collection, or build scraping pipelines for the Bússola de Aluguel project.
allowed-tools: Bash(playwright-cli:*)
---

> **Project context:** read `.agents/AGENTS.md` before starting any task to understand the overall architecture, conventions, and restrictions of the Bússola de Aluguel project.

# Web Scraper Development with playwright-cli

## Fundamental Rule

> **ALWAYS use `playwright-cli` for any browser interaction during scraping.**
> Before starting any scraping task, you must read the playwright-cli skill at:
> `.agents/skills/playwright-cli/SKILL.md`

This skill depends directly on the `playwright-cli` skill. All browser commands listed here follow the syntax documented there.

---

## Standard Scraper Flow

### 1. Initial Page Exploration

Always start by exploring the page structure before extracting data.

```bash
# Open the browser and navigate to the target
playwright-cli open https://site-alvo.com

# Take snapshot to understand the DOM structure
playwright-cli snapshot

# If there is pagination or dynamic loading, wait
playwright-cli eval "document.readyState"
```

### 2. Identifying Elements

Use the snapshot to identify the refs (`e1`, `e2`, ...) of the elements of interest before interacting.

```bash
# Evaluate CSS selectors directly
playwright-cli eval "document.querySelectorAll('.card-produto').length"

# Extract text from an element identified in the snapshot
playwright-cli eval "el => el.textContent" e5

# Extract attribute (e.g., href of links)
playwright-cli eval "el => el.getAttribute('href')" e7
```

### 3. Mass Data Extraction

Use `eval` with JavaScript to extract lists of data all at once:

```bash
# Extract list of titles
playwright-cli eval "Array.from(document.querySelectorAll('h2.titulo')).map(el => el.textContent.trim())"

# Extract structured objects from product cards
playwright-cli eval "Array.from(document.querySelectorAll('.card')).map(card => ({ titulo: card.querySelector('h2')?.textContent?.trim(), preco: card.querySelector('.preco')?.textContent?.trim(), link: card.querySelector('a')?.href }))"

# Extract table as an array of arrays
playwright-cli eval "Array.from(document.querySelectorAll('table tr')).map(row => Array.from(row.querySelectorAll('td,th')).map(cell => cell.textContent.trim()))"
```

### 4. Pagination and Infinite Scroll

```bash
# Click the next page button identified in the snapshot
playwright-cli click e12

# Scroll to load more items (infinite scroll)
playwright-cli eval "window.scrollTo(0, document.body.scrollHeight)"

# Wait for load after scroll
playwright-cli eval "new Promise(r => setTimeout(r, 2000))"

# Check if "next" button still exists
playwright-cli eval "!!document.querySelector('.btn-proxima')"
```

### 5. Handling Login/Authentication

```bash
# Login and save state for reuse
playwright-cli open https://site.com/login
playwright-cli fill e1 "usuario@email.com"
playwright-cli fill e2 "senha123"
playwright-cli click e3
playwright-cli state-save auth.json

# In future sessions, load the saved state
playwright-cli open https://site.com
playwright-cli state-load auth.json
```

### 6. Sites with Dynamic JavaScript (SPA/React/Vue)

```bash
# Wait for specific element to appear in the DOM
playwright-cli eval "new Promise(resolve => { const obs = new MutationObserver(() => { if (document.querySelector('.dados-carregados')) { obs.disconnect(); resolve(true); } }); obs.observe(document.body, { childList: true, subtree: true }); })"

# Check if the data has already been loaded
playwright-cli eval "document.querySelectorAll('.item').length > 0"

# Take new snapshot after dynamic loading
playwright-cli snapshot
```

---

## Anti-Blocking Strategies

### Simulate Human Behavior

```bash
# Move mouse before clicking
playwright-cli mousemove 200 300
playwright-cli click e5

# Use hover before clicking on menus
playwright-cli hover e4
playwright-cli snapshot
playwright-cli click e8

# Gradual scroll to seem human
playwright-cli mousewheel 0 300
playwright-cli mousewheel 0 300
playwright-cli mousewheel 0 300
```

### Manage Cookies and Headers

```bash
# List cookies after login
playwright-cli cookie-list

# Inspect session cookies
playwright-cli cookie-get session_id

# Clear cookies if necessary for a new session
playwright-cli cookie-clear
```

### Use Named Sessions for Parallelism

```bash
# Session 1 - page 1
playwright-cli -s=sessao1 open https://site.com/pagina/1

# Session 2 - page 2 (in parallel)
playwright-cli -s=sessao2 open https://site.com/pagina/2

# Close all at the end
playwright-cli close-all
```

---

## Scraper Debugging

```bash
# View page console errors
playwright-cli console

# Monitor network requests (useful for hidden APIs)
playwright-cli network

# Start tracing for post-execution analysis
playwright-cli tracing-start
# ... scraper actions ...
playwright-cli tracing-stop

# Screenshot for visual diagnosis
playwright-cli screenshot --filename=debug-scraper.png
```

---

## Complete Flow — Real Estate Scraper Example

```bash
# 1. Open the site
playwright-cli open https://site-imoveis.com/alugueis

# 2. Explore structure
playwright-cli snapshot

# 3. Apply filters if necessary
playwright-cli select e3 "residencial"
playwright-cli fill e5 "2000"
playwright-cli click e7

# 4. Wait for results
playwright-cli snapshot

# 5. Extract data from cards
playwright-cli eval "Array.from(document.querySelectorAll('.card-imovel')).map(card => ({ titulo: card.querySelector('.titulo')?.textContent?.trim(), preco: card.querySelector('.preco')?.textContent?.trim(), endereco: card.querySelector('.endereco')?.textContent?.trim(), link: card.querySelector('a')?.href, quartos: card.querySelector('.quartos')?.textContent?.trim(), area: card.querySelector('.area')?.textContent?.trim() }))"

# 6. Page until there are no more results
playwright-cli eval "!!document.querySelector('.btn-proxima-pagina')"
playwright-cli click e20
playwright-cli snapshot
# ... repeat extraction ...

# 7. Close browser
playwright-cli close
```

---

## Saving Results

After extracting the data with `playwright-cli eval`, the results must be persisted via the `backend/database.py` project module, which manages the connection to SQLite through SQLAlchemy.

**Do not save in JSON or CSV directly.** The correct pipeline is:

1. Extract the data with `playwright-cli eval` (returns JSON string).
2. Parse it with `json.loads()`.
3. Pass the data to the insertion functions defined in `database.py`.

```python
import subprocess, json
from database import SessionLocal, Imovel  # import real project models

result = subprocess.run(
    ["playwright-cli", "eval", "<seu_eval_aqui>"],
    capture_output=True, text=True
)
dados = json.loads(result.stdout)

db = SessionLocal()
for item in dados:
    imovel = Imovel(**item)  # adjust according to the real model
    db.add(imovel)
db.commit()
db.close()
```

> Consult `backend/database.py` for available models and functions before writing the persistence code.

---

## Known Behaviors — VivaReal

Behaviors already identified when scraping VivaReal. Update this section as new patterns are discovered.

- **Dynamic loading:** the listing is an SPA. The property cards only appear after the JavaScript loads. Always use `playwright-cli snapshot` to confirm that the results are in the DOM before extracting.
- **Null fields:** the `area`, `vagas`, and `condominio` fields frequently arrive as `null` or empty string. The extraction code must handle these cases with `?.` and default values.
- **Pagination:** the next page button may not exist on the last page — always check with `eval` before trying to click.
- **Bot detection:** if the page returns a captcha or block, apply the `## Anti-Blocking Strategies` before trying again.
- **Base search URL:** *(fill with the real URL used in the project after the first successful execution).*

---

## Robust Scraper Checklist

- [ ] Read the `playwright-cli` skill to use the correct commands
- [ ] Explored the page structure with `playwright-cli snapshot`
- [ ] Checked if the site uses dynamic loading (SPA)
- [ ] Tested the extraction with `playwright-cli eval` before automating
- [ ] Implemented pagination logic if necessary
- [ ] Added error handling (element not found, timeout)
- [ ] Saved authentication state if the site requires login
- [ ] Tested with `playwright-cli console` and `playwright-cli network` for debugging
- [ ] Persisted the results via `backend/database.py` (do not save in JSON/CSV directly)
- [ ] Verified that the data appears correctly in the SQLite database after insertion
