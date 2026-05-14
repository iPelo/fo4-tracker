# Fallout 4 Tracker

A small Pip-Boy style tracker for Fallout 4 builds.

Use it here: [ipelo.github.io/fo4-tracker](https://ipelo.github.io/fo4-tracker/)

I made this because Fallout 4 builds get messy fast: level, S.P.E.C.I.A.L. stats, bobbleheads, saved perk points, gear bonuses, magazines, companions, and playstyle notes all affect what perks actually make sense. This app keeps that stuff in one place and gives perk advice without talking about quests, factions, locations, or story details.

## What It Tracks

- Level, difficulty, and unspent perk points
- Base S.P.E.C.I.A.L. stats
- S.P.E.C.I.A.L. bobbleheads
- The "You're S.P.E.C.I.A.L." book
- Effective S.P.E.C.I.A.L. from base stats, permanent boosts, and gear notes
- Perk ranks and level gates
- Gear bonus notes, like `armor +2 INT, hat +1 AGI`
- Playstyle/loadout notes
- Power armor use
- Companion in use
- Magazine counts by category

## Advisor

The advisor is local and mechanic-only. It has two modes:

- `I leveled up` for quick perk recommendations after a level-up
- `Free chat` for questions like "should I save this point?" or "I need better hacking"

It always includes the option to save a perk point if nothing clearly fits your current build.

## Saves And Privacy

Your tracker data is saved in your browser with `localStorage`. It is not uploaded anywhere and it is not committed to this repository.

One thing to know: `localhost` and the live GitHub Pages site are different browser save slots. If you entered data locally and want it on the live site, use the Backup panel in the app:

1. Export backup on the old URL.
2. Open the live site.
3. Paste the backup into the Backup panel.
4. Import it.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

The site is deployed to GitHub Pages with the workflow in `.github/workflows/deploy.yml`.
