---
description: Verify changed files and prepare a commit to main
---

# Pre-Commit Review Workflow

This workflow reviews all changed files, validates them, and prepares a clean commit + push to `main`.

Use `/pre-commit` to invoke this workflow.

---

## 1. Check current status

// turbo

```bash
git status
```

Identify all **modified**, **added (untracked)**, and **deleted** files.

---

## 2. Review the diff of each modified file

For every modified file shown in `git status`, review the changes:

// turbo

```bash
git diff -- <file>
```

For each file, check for:
- ❌ Debug code (`console.log`, `print()`, `debugger`)
- ❌ `TODO` / `FIXME` comments that should be resolved
- ❌ Hardcoded credentials, API keys, or absolute local paths (e.g. `C:\Users\...`)
- ❌ Commented-out code that should be removed
- ❌ Unrelated changes mixed in
- ✅ All changes are intentional and relevant

---

## 3. Review untracked (new) files

For every untracked file, open and review its full content to confirm it should be committed.

Check if:
- The file belongs in the repository (not a temp file, log, or generated artifact)
- The `.gitignore` already excludes files of this type — if not, consider adding a rule

---

## 4. Check for sensitive files

// turbo

```bash
git status --porcelain | Select-String -Pattern "\.(sqlite|db|env|secret|key|pem|log)$"
```

If any matches appear, they must **NOT** be committed. Add them to `.gitignore` if missing.

---

## 5. Backend validation (if backend files changed)

If any `backend/**` files were modified:

### 5a. Check API imports are valid

```bash
cd backend/api && python -c "from main import app; print('API imports OK')"
```

### 5b. Check database models are consistent

```bash
cd backend/db && python -c "from database import engine, Base; Base.metadata.create_all(engine); print('DB models OK')"
```

---

## 6. Frontend validation (if frontend files changed)

If any `frontend/**` files were modified:

### 6a. Check build succeeds

```bash
cd frontend && npm run build
```

Build must complete with **zero errors**. Warnings should be reviewed but are acceptable.

---

## 7. Generate commit summary

After all validations pass, generate a commit summary artifact (`commit_summary.md`) containing:

- **Commit message suggestion**: A concise, descriptive message following the format:
  `<type>: <description>` where type is one of: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`
- **Changed files table**: File path, status (added/modified/deleted), and brief description of each change
- **What was done**: Bullet list of the functional changes

Present the suggested commit message to the user for approval.

---

## 8. Execute commit and push (after user approval)

Only after the user approves the commit message:

```bash
git add -A
git commit -m "<approved message>"
git push origin main
```

---

## Final checklist

Before committing, all of these must be true:

- [ ] No debug code or sensitive data in the changes
- [ ] No sensitive files (`.sqlite`, `.env`, etc.) being tracked
- [ ] Backend starts without errors (if applicable)
- [ ] Frontend builds without errors (if applicable)
- [ ] Commit message is clear and descriptive
- [ ] User approved the commit
