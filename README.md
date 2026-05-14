# Fallout 4 Tracker

A local Fallout 4 character tracker and spoiler-free perk advisor built with Vite and React.

## Features

- Level, difficulty, unspent perk points, companion, power armor, gear notes, and loadout notes
- Base S.P.E.C.I.A.L., bobbleheads, and the "You're S.P.E.C.I.A.L." book
- Effective S.P.E.C.I.A.L. calculation from base stats, permanent bonuses, and free-text gear bonuses
- Perk rank tracking with SPECIAL and level gates
- Magazine counts by category without locations
- Local deterministic advisor with two modes:
  - `I leveled up`
  - `Free chat`
- Spoiler-locked advice: mechanics and perks only

## Commands

```bash
npm run dev
npm run lint
npm run build
```

## Saves

Data is stored in browser `localStorage` under `fo4-tracker-v2`.

That means the same browser and same URL will remember your tracker. A hosted GitHub Pages URL has a different save slot than `localhost`, so use the app's Backup panel to export from one place and import into another.

No character save data is committed to GitHub. The public repository only contains the app source, dependency lockfile, static favicon, and GitHub Pages workflow.

## GitHub Pages

This repo is ready for GitHub Pages through `.github/workflows/deploy.yml`.

1. Create a public GitHub repository.
2. Push this project to the `main` branch.
3. In the GitHub repository, open `Settings -> Pages`.
4. Set `Build and deployment -> Source` to `GitHub Actions`.
5. Push again or run the `Deploy to GitHub Pages` workflow manually.

For a normal project repository, the Vite base path is detected from `GITHUB_REPOSITORY` during the GitHub Actions build. For a `username.github.io` repository, the app builds at the site root.
