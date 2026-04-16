/**
 * sync-cfbd.ts
 * 
 * Pulls data from CFBD API and writes it into Google Sheets.
 * Run manually: npx tsx scripts/sync-cfbd.ts
 * Or schedule via GitHub Actions (see .github/workflows/sync.yml)
 * 
 * Sheets tabs written:
 *   games           - all FBS games for the year (with spread from lines endpoint)
 *   advanced_stats  - season-level advanced stats for all FBS teams
 *   power_ratings   - loaded from local power-ratings.csv (not from CFBD)
 * 
 * Usage:
 *   npx tsx scripts/sync-cfbd.ts            # syncs current year (2025)
 *   npx tsx scripts/sync-cfbd.ts --year=2024
 *   npx tsx scripts/sync-cfbd.ts --year=2024 --tabs=games,advanced_stats
 */

import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { parse as parseCsv } from 'csv-parse/sync'

dotenv.config({ path: '.env.local' })

import { writeSheet, SHEET_TABS } from '../lib/sheets'
import {
  fetchGames,
  fetchAdvancedStats,
  fetchLines,
  fetchTeamsFull,
  CFBDAdvancedStats,
} from '../lib/cfbd'

// --- CLI args ---
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v]
  })
)
const YEAR = parseInt(args.year ?? '2025', 10)
const TABS = args.tabs ? args.tabs.split(',') : ['teams', 'games', 'advanced_stats', 'power_ratings']

console.log(`\nCFB Analytics Sync — ${YEAR}`)
console.log(`Tabs: ${TABS.join(', ')}\n`)

// ─────────────────────────────────────────────
// GAMES
// ─────────────────────────────────────────────
async function syncGames() {
  console.log('Fetching games...')
  const [games, linesData] = await Promise.all([
    fetchGames(YEAR),
    fetchLines(YEAR).catch(() => {
      console.warn('  ⚠ Could not fetch lines (may need premium tier)')
      return []
    }),
  ])

  // Build a quick lookup: gameId → consensus spread
  const spreadByGame: Record<number, number | null> = {}
  for (const g of linesData) {
    // Prefer consensus, fall back to first available provider
    const line =
      g.lines.find((l) => l.provider.toLowerCase().includes('consensus')) ??
      g.lines[0]
    if (line?.spread) {
      spreadByGame[g.id] = parseFloat(line.spread)
    }
  }

  const headers = [
    'game_id', 'season', 'week', 'season_type', 'start_date',
    'neutral_site', 'conference_game',
    'home_team', 'home_conference', 'home_points', 'home_postgame_win_prob',
    'away_team', 'away_conference', 'away_points', 'away_postgame_win_prob',
    'completed', 'spread',
  ]

  const rows = games.map((g) => [
    g.id,
    g.season,
    g.week,
    g.seasonType,
    g.startDate,
    g.neutralSite ? '1' : '0',
    g.conferenceGame ? '1' : '0',
    g.homeTeam,
    g.homeConference,
    g.homePoints ?? '',
    g.home_post_win_prob ?? '',
    g.awayTeam,
    g.awayConference,
    g.awayPoints ?? '',
    g.away_post_win_prob ?? '',
    g.completed ? '1' : '0',
    spreadByGame[g.id] ?? '',
  ])

  await writeSheet(SHEET_TABS.GAMES, headers, rows)
  console.log(`  → ${games.length} games written`)
}

// ─────────────────────────────────────────────
// ADVANCED STATS
// ─────────────────────────────────────────────
function flattenStats(s: CFBDAdvancedStats): (string | number | null)[] {
  const o = s.offense
  const d = s.defense
  return [
    s.season, s.team, s.conference,
    // Offense
    o.plays, o.drives, o.ppa, o.totalPPA,
    o.successRate, o.explosiveness, o.powerSuccess, o.stuffRate,
    o.lineYards, o.lineYardsTotal,
    o.secondLevelYards, o.secondLevelYardsTotal,
    o.openFieldYards, o.openFieldYardsTotal,
    o.totalOpportunies, o.pointsPerOpportunity,
    o.fieldPosition?.averageStart, o.fieldPosition?.averagePredictedPoints,
    o.havoc?.total, o.havoc?.frontSeven, o.havoc?.db,
    o.standardDowns?.rate, o.standardDowns?.ppa, o.standardDowns?.successRate, o.standardDowns?.explosiveness,
    o.passingDowns?.rate, o.passingDowns?.ppa, o.passingDowns?.successRate, o.passingDowns?.explosiveness,
    o.rushingPlays?.rate, o.rushingPlays?.ppa, o.rushingPlays?.totalPPA, o.rushingPlays?.successRate, o.rushingPlays?.explosiveness,
    o.passingPlays?.rate, o.passingPlays?.ppa, o.passingPlays?.totalPPA, o.passingPlays?.successRate, o.passingPlays?.explosiveness,
    // Defense
    d.plays, d.drives, d.ppa, d.totalPPA,
    d.successRate, d.explosiveness, d.powerSuccess, d.stuffRate,
    d.lineYards, d.lineYardsTotal,
    d.secondLevelYards, d.secondLevelYardsTotal,
    d.openFieldYards, d.openFieldYardsTotal,
    d.totalOpportunies, d.pointsPerOpportunity,
    d.fieldPosition?.averageStart, d.fieldPosition?.averagePredictedPoints,
    d.havoc?.total, d.havoc?.frontSeven, d.havoc?.db,
    d.standardDowns?.rate, d.standardDowns?.ppa, d.standardDowns?.successRate, d.standardDowns?.explosiveness,
    d.passingDowns?.rate, d.passingDowns?.ppa, d.passingDowns?.successRate, d.passingDowns?.explosiveness,
    d.rushingPlays?.rate, d.rushingPlays?.ppa, d.rushingPlays?.totalPPA, d.rushingPlays?.successRate, d.rushingPlays?.explosiveness,
    d.passingPlays?.rate, d.passingPlays?.ppa, d.passingPlays?.totalPPA, d.passingPlays?.successRate, d.passingPlays?.explosiveness,
  ]
}

const ADVANCED_STATS_HEADERS = [
  'season', 'team', 'conference',
  'off_plays', 'off_drives', 'off_ppa', 'off_total_ppa',
  'off_success_rate', 'off_explosiveness', 'off_power_success', 'off_stuff_rate',
  'off_line_yards', 'off_line_yards_total',
  'off_second_level_yards', 'off_second_level_yards_total',
  'off_open_field_yards', 'off_open_field_yards_total',
  'off_total_opportunities', 'off_points_per_opp',
  'off_field_pos_avg_start', 'off_field_pos_avg_pp',
  'off_havoc_total', 'off_havoc_front_seven', 'off_havoc_db',
  'off_std_downs_rate', 'off_std_downs_ppa', 'off_std_downs_sr', 'off_std_downs_exp',
  'off_pass_downs_rate', 'off_pass_downs_ppa', 'off_pass_downs_sr', 'off_pass_downs_exp',
  'off_rush_rate', 'off_rush_ppa', 'off_rush_total_ppa', 'off_rush_sr', 'off_rush_exp',
  'off_pass_rate', 'off_pass_ppa', 'off_pass_total_ppa', 'off_pass_sr', 'off_pass_exp',
  'def_plays', 'def_drives', 'def_ppa', 'def_total_ppa',
  'def_success_rate', 'def_explosiveness', 'def_power_success', 'def_stuff_rate',
  'def_line_yards', 'def_line_yards_total',
  'def_second_level_yards', 'def_second_level_yards_total',
  'def_open_field_yards', 'def_open_field_yards_total',
  'def_total_opportunities', 'def_points_per_opp',
  'def_field_pos_avg_start', 'def_field_pos_avg_pp',
  'def_havoc_total', 'def_havoc_front_seven', 'def_havoc_db',
  'def_std_downs_rate', 'def_std_downs_ppa', 'def_std_downs_sr', 'def_std_downs_exp',
  'def_pass_downs_rate', 'def_pass_downs_ppa', 'def_pass_downs_sr', 'def_pass_downs_exp',
  'def_rush_rate', 'def_rush_ppa', 'def_rush_total_ppa', 'def_rush_sr', 'def_rush_exp',
  'def_pass_rate', 'def_pass_ppa', 'def_pass_total_ppa', 'def_pass_sr', 'def_pass_exp',
]

async function syncAdvancedStats() {
  console.log('Fetching advanced stats...')
  const stats = await fetchAdvancedStats(YEAR)
  const rows = stats.map(flattenStats)
  await writeSheet(SHEET_TABS.ADVANCED_STATS, ADVANCED_STATS_HEADERS, rows)
  console.log(`  → ${stats.length} teams written`)
}

// ─────────────────────────────────────────────
// POWER RATINGS (from local CSV → Sheet)
// ─────────────────────────────────────────────
async function syncPowerRatings() {
  const csvPath = path.join(process.cwd(), 'public', 'power-ratings.csv')
  if (!fs.existsSync(csvPath)) {
    console.warn('  ⚠ public/power-ratings.csv not found, skipping')
    return
  }

  console.log('Reading power-ratings.csv...')
  const raw = fs.readFileSync(csvPath, 'utf-8')
  const records = parseCsv(raw, { columns: true, skip_empty_lines: true }) as {
    team: string
    rating: string
  }[]

  const headers = ['team', 'rating']
  const rows = records.map((r) => [r.team, r.rating])
  await writeSheet(SHEET_TABS.POWER_RATINGS, headers, rows)
  console.log(`  → ${rows.length} teams written`)
}


// ─────────────────────────────────────────────
// TEAMS
// ─────────────────────────────────────────────
async function syncTeams() {
  console.log('Fetching teams...')
  const teams = await fetchTeamsFull(YEAR)

  const headers = [
    'school', 'mascot', 'abbreviation', 'classification',
    'conference', 'division', 'color', 'alt_color',
    'logo', 'logo_dark', 'twitter',
    'city', 'state', 'capacity', 'grass', 'dome',
    'latitude', 'longitude',
  ]

  const rows = teams.map((t) => [
    t.school,
    t.mascot ?? '',
    t.abbreviation ?? '',
    t.classification ?? '',
    t.conference ?? '',
    t.division ?? '',
    t.color ?? '',
    t.altColor ?? '',
    t.logos?.[0] ?? '',
    t.logos?.[1] ?? '',
    t.twitter ?? '',
    t.location?.city ?? '',
    t.location?.state ?? '',
    t.location?.capacity ?? '',
    t.location?.grass != null ? (t.location.grass ? '1' : '0') : '',
    t.location?.dome != null ? (t.location.dome ? '1' : '0') : '',
    t.location?.latitude ?? '',
    t.location?.longitude ?? '',
  ])

  await writeSheet(SHEET_TABS.TEAMS, headers, rows)
  console.log(`  → ${teams.length} teams written`)
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  const start = Date.now()
  const errors: string[] = []

  for (const tab of TABS) {
    try {
      if (tab === 'teams') await syncTeams()
      else if (tab === 'games') await syncGames()
      else if (tab === 'advanced_stats') await syncAdvancedStats()
      else if (tab === 'power_ratings') await syncPowerRatings()
      else console.warn(`  ⚠ Unknown tab: ${tab}`)
    } catch (err: any) {
      console.error(`  ✗ ${tab}: ${err.message}`)
      errors.push(`${tab}: ${err.message}`)
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\nDone in ${elapsed}s`)

  if (errors.length > 0) {
    console.error('\nErrors:')
    errors.forEach((e) => console.error(`  - ${e}`))
    process.exit(1)
  }
}

main()
