@AGENTS.md

# CFB Analytics — Agent Guide

Internal college football analytics dashboard built for Action Network. Before making any changes, read this file fully.

---

## Stack

- **Framework**: Next.js (App Router), TypeScript, deployed on Vercel
- **Data layer**: Google Sheets (service account auth) — NOT a database
- **Sync scripts**: `tsx` scripts that pull from CFBD API and write to Sheets
- **Styling**: CSS custom properties in `app/globals.css`, light mode, DM Sans font
- **Key libs**: `googleapis`, `papaparse`, `csv-parse`

---

## Project Structure

```
app/
  page.tsx                  Main dashboard (team/year filters, all tables)
  compare/page.tsx          Two-team comparison view (offense + defense side by side)
  layout.tsx                Root layout, DM Sans font
  globals.css               CSS vars, table/card styles
  api/
    games/route.ts          Games for a team+year (reads from Sheets)
    teams/route.ts          Team list + metadata (reads from Sheets)
    advanced-stats/route.ts Season advanced stats (reads from Sheets)
    power-ratings/route.ts  Power ratings (reads from Sheets)
    players/route.ts        PFF player stats — ?type=qb|rush|rec|blocking|defense&team=X&season=Y

components/
  NavBar.tsx                Shared top nav (Team Dashboard / Compare) with active-link state
  ScheduleTable.tsx         Schedule + results, Proj vs. market spread, ATS, win prob, opponent logos
  FiveFactors.tsx           Five factors with percentile rank shading
  DownStatsTable.tsx        Reusable table for standard/passing downs, rushing/passing plays
  ComparisonTable.tsx       Team A vs. Team B for one section + one side (off/def), same rank shading
  PlayerTable.tsx           PFF player stats, sortable, grade shading only (no stat color coding)

lib/
  sheets.ts                 Google Sheets client — readSheet(tab), writeSheet(tab, headers, rows)
  cfbd.ts                   CFBD API wrapper — fetchGames, fetchTeams, fetchAdvancedStats, fetchLines
  types.ts                  CFBGame, PowerRating interfaces
  utils.ts                  rankColor(), rankOf(), projectedSpread(), formatSpread(), fmt(), formatStatValue()
  statRows.ts               StatRow config for every stat section; STAT_SECTIONS drives the compare page
  playerCols.ts             Column definitions for all five PFF player tables
  pffTeamMap.ts             PFF team name → CFBD name mapping (and reverse)
  ratingsTeamMap.ts         Power-ratings CSV team name → CFBD name mapping

scripts/
  sync-cfbd.ts              Pulls from CFBD API → writes to Google Sheets
  sync-pff.ts               Reads local PFF CSVs from public/pff/ → writes to Google Sheets

.github/workflows/
  sync.yml                  Daily cron: syncs 2025 (all tabs) + 2026 (games only) every day at 6am ET
```

---

## Google Sheets Tabs

All data lives in a single Google Sheet. Tab names are defined in `lib/sheets.ts` as `SHEET_TABS`:

| Constant | Tab name | Contents |
|---|---|---|
| `GAMES` | `games` | All FBS games, both regular + postseason, all years stacked |
| `ADVANCED_STATS` | `advanced_stats` | Season-level advanced stats per team |
| `POWER_RATINGS` | `power_ratings` | Team power ratings + per-team HFA (manual CSV upload) |
| `TEAMS` | `teams` | Team metadata: logos, colors, conference, stadium info |
| `PFF_QB` | `pff_qb` | PFF QB stats, multi-season stacked with `season` column |
| `PFF_RUSH` | `pff_rush` | PFF rushing stats |
| `PFF_REC` | `pff_rec` | PFF receiving stats |
| `PFF_BLOCKING` | `pff_block` | PFF blocking stats (note: tab is `pff_block` not `pff_blocking`) |
| `PFF_DEFENSE` | `pff_defense` | PFF defense stats |

---

## Key Conventions

### Year / Season handling
- The `games` and `advanced_stats` tabs store all seasons in one sheet. Always filter by `season`.
- **Season** picks the schedule year; **Stats** picks which season's stats feed the tables and rank
  shading. Stats defaults from `STATS_YEAR_FOR` (2026 schedule → 2025 stats) and is overridable per
  page; changing Season clears any manual Stats pick.
- The two are deliberately not linked per-team. Ranks are computed by pooling every team in the
  selected stats year, so mixing seasons inside one pool would make every rank meaningless — a
  one-game sample has roughly ±6.4 pts of sampling error on success rate, which cannot separate a
  team from ~116 of the other 135. The whole league moves together or not at all.
- Both pages warn when the selected stats year covers fewer teams than the league, because early in
  a season ranks come out of a much smaller pool (16 teams in early September, not 136).
- `syncGames()` **and** `syncAdvancedStats()` preserve rows from other seasons: they read existing
  rows, filter out the current year, then write the combination back. `writeSheet` clears the tab
  first, so any new per-season sync must do this or it will silently wipe the other years.

### Team name matching (PFF ↔ CFBD)
- CFBD uses full proper names: `"Penn State"`, `"Ole Miss"`, `"Northwestern"`
- PFF uses uppercase abbreviations: `"PENN STATE"`, `"OLE MISS"`, `"NWESTERN"`
- `lib/pffTeamMap.ts` handles conversion both ways
- `/api/players` calls `cfbdToPff(team)` before filtering player rows
- If a team shows no player data despite having Sheet rows, check the `team_name` value in the Sheet against `pffTeamMap.ts`

### Field naming
- CFBD REST API returns **camelCase** for every field, with no exceptions: `homeTeam`, `awayTeam`,
  `startDate`, `neutralSite`, `homePostgameWinProbability`
- Win probability specifically: `homePostgameWinProbability` / `awayPostgameWinProbability` —
  camelCase, and `Postgame`, not `post`. Verified against the live API.
- One concept, three layers, three spellings — keep them straight:

  | Layer | Name |
  |---|---|
  | CFBD API response (`lib/cfbd.ts`) | `homePostgameWinProbability` |
  | `games` sheet column (`sync-cfbd.ts`) | `home_postgame_win_prob` |
  | `/api/games` JSON + `CFBGame` (`lib/types.ts`) | `home_postgame_win_prob` |

  A wrong key on the API object is just `undefined`, and `undefined ?? ''` writes an empty cell —
  so a typo here fails silently and TypeScript cannot catch it (the interface declares the typo).
  This is exactly how the win prob column sat empty for all 7,441 rows. If a column comes back
  blank everywhere, suspect a field-name mismatch before suspecting the API.
- The `games` Sheet tab stores snake_case: `home_team`, `away_team`, `start_date`, etc.
- CFBD advanced stats API returns nested objects; `sync-cfbd.ts` flattens to snake_case: `off_success_rate`, `def_havoc_total`, etc.

### Power ratings source
`public/power-ratings.csv` is the TAN ratings export. Only three of its columns are used:

| Column | Use |
|---|---|
| `Team` | team name, normalized to CFBD via `lib/ratingsTeamMap.ts` |
| `TAN 26` | the rating |
| `HFACW` | that team's home-field edge, **in points** |

`sync-cfbd.ts` writes `team`, `rating`, `hfa` to the sheet and warns about any rated team that
matches no CFBD school. Five names need mapping (`UMass`→`Massachusetts`, `ULM`→`UL Monroe`,
`Miami Ohio`→`Miami (OH)`, `Appalachian State`→`App State`, `San Jose State`→`San José State`);
add to `RATINGS_TO_CFBD` if the export adds more. North Dakota State and Sacramento State are
rated but only become FBS in 2026, so they stay unmatched until the teams tab is synced for 2026.

### Projected spread formula
```
margin = (home_rating - away_rating) * RATING_POINTS_PER_UNIT + home_HFACW
spread (from home's perspective) = -margin        # negative = home favored
```
Implemented in `lib/utils.ts` → `projectedSpread(homeRating, awayRating, homeFieldAdvantage)`.
Pass `0` for the HFA at neutral sites. Computed for **every** game, not just future ones.

**TAN ratings are a 0-100 quality scale, not points of margin** — this is the easy thing to get
wrong. `RATING_POINTS_PER_UNIT = 0.905` converts a rating gap into points, calibrated by
regressing 2025 closing lines on TAN 25 gaps over the 690 non-neutral FBS games that had a line:

```
market_margin = 0.905 * rating_gap + 2.78      r = 0.912
```

Using the gap unconverted overstates every spread by ~10%. On 808 games with a closing line the
converted model beats the raw one on mean absolute error (4.25 vs 4.46 pts). The 2.78 intercept is
the market's average home edge, close to the mean HFACW of 2.49 — so HFACW is already in points
and is added *after* the conversion, never scaled by it. Teams with a rating but no HFACW fall
back to 2.5.

`ScheduleTable` shows this as its own **Proj** column alongside the market **Spread** column. When
both exist, `edge = proj - market`: negative means the model likes the selected team more than the
market does (green), positive means it likes the opponent (red). Edges under 1 pt stay muted.
The compare page shows the same projection for any two teams with a home/neutral site selector.

### Rank/percentile shading
- `rankOf(value, field, allStats, lowerIsBetter)` in `lib/utils.ts` returns `{ rank, total, percentile }`,
  ignoring teams whose value is missing or `0`
- `rankColor(percentile, lowerIsBetter)` in `lib/utils.ts` returns `{ bg, text }` CSS colors
- Used in `FiveFactors.tsx`, `DownStatsTable.tsx`, and `ComparisonTable.tsx` for rank badges
- **Not used** in `PlayerTable.tsx` (stat columns are plain text; only PFF grade columns get shading)

---

## Comparison View (`/compare`)

- Picks two teams + a season, and renders every `STAT_SECTIONS` entry twice — offense on the left,
  defense on the right — as `A value | A rank | Stat | B rank | B value`.
- Ranks are league-wide (all FBS teams), so the shading matches the single-team dashboard exactly.
  The better team's value cell gets a faint green tint.
- The header shows both power ratings and the projected spread, with a Site selector (A home /
  neutral / B home). Spread is always from Team A's perspective.
- Deep-linkable via `/compare?a=Penn+State&b=Ohio+State&year=2025`. The dashboard's
  "Compare →" button links here with the current team prefilled. Params are read from
  `window.location.search` on mount rather than `useSearchParams`, which keeps the route
  statically prerenderable with no `Suspense` boundary.
- Follows the same `STATS_YEAR_FOR` rule as the dashboard: 2026 shows 2025 stats.

---

## Environment Variables

Required in `.env.local` (and Vercel + GitHub Secrets):

```
CFBD_API_KEY=                    # from collegefootballdata.com
GOOGLE_SHEET_ID=                 # from the Sheet URL
GOOGLE_SERVICE_ACCOUNT_JSON=     # minified single-line JSON (no spaces/newlines)
```

`GOOGLE_SERVICE_ACCOUNT_JSON` must be compact JSON — run:
```bash
python3 -c "import json; print(json.dumps(json.load(open('your-key.json'))))"
```

---

## Running Sync Scripts

```bash
npm run sync                    # sync all tabs for 2025
npm run sync:games              # games only, 2025
npm run sync:stats              # advanced stats only
npm run sync:ratings            # power ratings only
npm run sync:teams              # team metadata only
npm run sync:pff                # all PFF tabs from public/pff/ CSVs
npm run sync:pff -- --season=2026  # PFF data for a specific season

# Specific year:
npx tsx scripts/sync-cfbd.ts --year=2026 --tabs=games
```

PFF CSVs go in `public/pff/` with these exact filenames:
```
passing.csv, rushing.csv, receiving.csv, blocking.csv, defense.csv
```

Alternatively, import CSVs directly into the Google Sheet tabs and add a `season` column manually.

---

## Deployment

- **Vercel** auto-deploys on push to `main`
- **GitHub Actions** (`sync.yml`) runs daily at 6am ET — syncs 2025 all tabs + 2026 games
- Manual trigger available in Actions tab with optional `year` and `tabs` inputs
- Sync script requires VPN access only for AN CORE API (futures odds — not yet implemented)
- CFBD API has a 1,000 call/month free limit — the Sheets caching layer means users never hit CFBD directly

---

## Not Yet Built

- Futures odds board (requires AN CORE internal API, needs VPN)
- Player stats for 2026 season (PFF exports not available until season starts)
