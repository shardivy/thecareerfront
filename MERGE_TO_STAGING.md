# Simple Integration Guide for Lead

Work on `staging` for testing, then push to `main` for production.

## Merge to Staging Daily

```bash
cd career-counselling-assessment-platform
git fetch origin
git checkout staging
git merge origin/frontend
git merge origin/backend
git push origin staging
```

Test the code on staging. When it's working, push to main.

---

## Push to Main (Production)

When staging is tested and working:

```bash
git checkout main
git merge staging
git push origin main
```

Done! Code is live.

---

## If Merge Conflict

Open the conflicted file and remove markers:

```
[choose this]
[or this]
```

Then:
```bash
git add .
git commit -m "Resolve conflicts"
git push origin staging  # or main
```

---

## If Something Goes Wrong

Undo merge:
```bash
git reset --hard origin/staging  # or origin/main
```

---

## Workflow Summary

1. **Developers push** → to `frontend` or `backend` branch
2. **You merge daily** → `git merge origin/frontend` + `git merge origin/backend` into `staging`
3. **Test on staging** → Check if everything works
4. **Push to main** → `git merge staging` then `git push origin main` when ready
5. **Repeat daily**

Simple workflow!

---

## Commands Quick Reference

```bash
git fetch origin                # Get latest updates
git checkout staging            # Work on staging
git merge origin/frontend       # Merge frontend
git merge origin/backend        # Merge backend
git push origin staging         # Push staging
git checkout main               # Work on main
git merge staging               # Merge staging to main
git push origin main            # Push main (PRODUCTION!)
git status                      # See conflicts/changes
git reset --hard origin/staging # Undo if needed
```
