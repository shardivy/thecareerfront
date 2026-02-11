# Simple Integration Guide for Lead

Pull frontend and backend changes into staging daily.

## Daily Steps

```bash
# Go to project
cd career-counselling-assessment-platform

# Update all branches
git fetch origin

# Go to staging
git checkout staging

# Pull frontend changes
git merge origin/frontend

# Pull backend changes  
git merge origin/backend

# Push to staging
git push origin staging
```

Done! Staging now has latest code from both teams.

---

## If Merge Conflict

If `git merge` shows conflicts:

```bash
git status
```

Shows conflicted files. Open each file and remove conflict markers:

```
<<<<<<< HEAD
[keep this version]
=======
[or this version]
>>>>>>> origin/backend
```

Then:
```bash
git add .
git commit -m "Resolve conflicts"
git push origin staging
```

---

## If Something Goes Wrong

Undo the merge:
```bash
git reset --hard origin/staging
```

Then merge again carefully.

---

## Quick Commands

```bash
git fetch origin                    # Download latest
git checkout staging                # Switch to staging
git merge origin/frontend           # Merge frontend
git merge origin/backend            # Merge backend
git push origin staging             # Push to remote
git status                          # See conflicts
git reset --hard origin/staging     # Undo if needed
```

That's all you need!
