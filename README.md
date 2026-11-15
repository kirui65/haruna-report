# HARUNA REPORT – setup (all free)

1. Create a free GitHub account and a new **public** repo, e.g. `haruna-report`.
2. Upload everything in this folder (keep the `.github` and `scripts` folders).
3. Repo **Settings → Pages** → Source: *Deploy from a branch* → `main` / root. Your site goes live at `https://<username>.github.io/haruna-report/`.
4. Repo **Actions** tab → *Update news* → **Run workflow** once. After that it refreshes every ~30 minutes by itself and commits `news.json`.
5. Custom domain (optional): Pages → Custom domain. A `.co.ke` costs money; the github.io address is free.

Test locally: `node scripts/fetch-news.mjs` then `python3 -m http.server` and open localhost:8000.
