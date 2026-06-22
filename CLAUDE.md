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
  layout.tsx                Root layout, DM Sans font
  globals.css               CSS vars, table/card styles
  api/
    games/route.ts          Games for a team+year (reads from Sheets)
    teams/route.ts          Team list + metadata (reads from Sheets)
    advanced-stats/route.ts Season advanced stats (reads from Sheets)
    power-ratings/route.ts  Power ratings (reads from Sheets)
    players/route.ts        PFF player stats — ?type=qb|rush|rec|blocking|defense&team=X&season=Y

components/
  ScheduleTable.tsx         Schedule + results, projected spreads, ATS, win prob, opponent logos
  FiveFactors.tsx           Five factors with percentile rank shading
  DownStatsTable.tsx        Reusable table for standard/passing downs, rushing/passing plays
  PlayerTable.tsx           PFF player stats, sortable, grade shading only (no stat color coding)

lib/
  sheets.ts                 Google Sheets client — readSheet(tab), writeSheet(tab, headers, rows)
  cfbd.ts                   CFBD API wrapper — fetchGames, fetchTeams, fetchAdvancedStats, fetchLines
  types.ts                  CFBGame, PowerRating interfaces
  utils.ts                  rankColor(), projectedSpread(), formatSpread(), fmt()
  statRows.ts               Column config for DownStatsTable sections
  playerCols.ts             Column definitions for all five PFF player tables
  pffTeamMap.ts             PFF team name → CFBD name mapping (and reverse)

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
| `POWER_RATINGS` | `power_ratings` | Team power ratings (manual CSV upload) |
| `TEAMS` | `teams` | Team metadata: logos, colors, conference, stadium info |
| `PFF_QB` | `pff_qb` | PFF QB stats, multi-season stacked with `season` column |
| `PFF_RUSH` | `pff_rush` | PFF rushing stats |
| `PFF_REC` | `pff_rec` | PFF receiving stats |
| `PFF_BLOCKING` | `pff_block` | PFF blocking stats (note: tab is `pff_block` not `pff_blocking`) |
| `PFF_DEFENSE` | `pff_defense` | PFF defense stats |

---

## Key Conventions

### Year / Season handling
- The `games` tab stores all seasons in one sheet. Always filter by `season` column.
- Selecting year `2026` on the frontend shows 2026 schedule but loads **2025 advanced stats** (configured in `STATS_YEAR_FOR` in `page.tsx`).
- `syncGames()` in the sync script preserves rows from other seasons — it reads existing rows, filters out the current year, then writes combined data back.

### Team name matching (PFF ↔ CFBD)
- CFBD uses full proper names: `"Penn State"`, `"Ole Miss"`, `"Northwestern"`
- PFF uses uppercase abbreviations: `"PENN STATE"`, `"OLE MISS"`, `"NWESTERN"`
- `lib/pffTeamMap.ts` handles conversion both ways
- `/api/players` calls `cfbdToPff(team)` before filtering player rows
- If a team shows no player data despite having Sheet rows, check the `team_name` value in the Sheet against `pffTeamMap.ts`

### Field naming
- CFBD REST API returns **camelCase**: `homeTeam`, `awayTeam`, `startDate`, `neutralSite`, `home_post_win_prob`
- Win probability fields specifically: `home_post_win_prob` / `away_post_win_prob` (snake_case, `post` not `postgame`)
- The `games` Sheet tab stores snake_case: `home_team`, `away_team`, `start_date`, etc.
- CFBD advanced stats API returns nested objects; `sync-cfbd.ts` flattens to snake_case: `off_success_rate`, `def_havoc_total`, etc.

### Projected spread formula
For future games without a Vegas line:
```
spread (from team's perspective) = opponent_rating - team_rating - home_field_advantage (2pts)
```
Implemented in `lib/utils.ts` → `projectedSpread()`.

### Rank/percentile shading
- `rankColor(percentile, lowerIsBetter)` in `lib/utils.ts` returns `{ bg, text }` CSS colors
- Used in `FiveFactors.tsx` and `DownStatsTable.tsx` for rank badges
- **Not used** in `PlayerTable.tsx` (stat columns are plain text; only PFF grade columns get shading)

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
