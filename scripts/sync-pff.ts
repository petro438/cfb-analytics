/**
 * sync-pff.ts
 *
 * Reads PFF CSV exports and writes them to Google Sheets.
 * Run: npm run sync:pff
 * Or target one tab: npm run sync:pff -- --tabs=pff_qb
 *
 * Expected CSV files in public/pff/:
 *   passing.csv, rushing.csv, receiving.csv, blocking.csv, defense.csv
 *
 * Usage:
 *   npm run sync:pff -- --season=2025
 *   npm run sync:pff -- --season=2025 --tabs=pff_qb,pff_rush
 */

import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { parse as parseCsv } from 'csv-parse/sync'

dotenv.config({ path: '.env.local' })

import { writeSheet, readSheet, SHEET_TABS } from '../lib/sheets'

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v]
  })
)

const SEASON = args.season ?? '2025'
const TABS   = args.tabs
  ? args.tabs.split(',')
  : ['pff_qb', 'pff_rush', 'pff_rec', 'pff_blocking', 'pff_defense']

const PFF_DIR = path.join(process.cwd(), 'public', 'pff')

console.log(`\nPFF Sync — Season ${SEASON}`)
console.log(`Tabs: ${TABS.join(', ')}\n`)

function readCsv(filename: string): Record<string, string>[] {
  const filepath = path.join(PFF_DIR, filename)
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}\nPlace PFF CSV exports in public/pff/`)
  }
  return parseCsv(fs.readFileSync(filepath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
  })
}

// Read existing rows for other seasons, so we don't wipe them when writing this season
async function mergeAndWrite(
  tab: string,
  headers: string[],
  newRows: (string | number | null)[][]
) {
  // Read existing data
  let existingRows: (string | number | null)[][] = []
  try {
    const existing = await readSheet(tab)
    // Keep rows from other seasons
    existingRows = existing
      .filter(r => r.season !== String(SEASON))
      .map(r => headers.map(h => r[h] ?? ''))
  } catch {
    // Tab may not exist yet — fine
  }

  const combined = [...existingRows, ...newRows]
  await writeSheet(tab, headers, combined)
  console.log(`  ✓ ${tab}: wrote ${newRows.length} rows (season ${SEASON}), ${existingRows.length} rows from other seasons preserved`)
}

// ─── QB ───────────────────────────────────────────────────────────────────────
async function syncQB() {
  console.log('Reading passing.csv...')
  const rows = readCsv('passing.csv')

  const headers = [
    'season', 'player', 'player_id', 'team_name', 'games',
    'attempts', 'completions', 'completion_percent', 'yards', 'ypa',
    'touchdowns', 'interceptions', 'sacks', 'sack_percent',
    'big_time_throws', 'btt_rate', 'twp_rate',
    'avg_depth_of_target', 'avg_time_to_throw',
    'qb_rating', 'grades_pass', 'grades_offense',
  ]

  const data = rows.map(r => [
    SEASON, r.player, r.player_id, r.team_name, r.player_game_count,
    r.attempts, r.completions, r.completion_percent, r.yards, r.ypa,
    r.touchdowns, r.interceptions, r.sacks, r.sack_percent,
    r.big_time_throws, r.btt_rate, r.twp_rate,
    r.avg_depth_of_target, r.avg_time_to_throw,
    r.qb_rating, r.grades_pass, r.grades_offense,
  ])

  await mergeAndWrite(SHEET_TABS.PFF_QB, headers, data)
}

// ─── RUSH ─────────────────────────────────────────────────────────────────────
async function syncRush() {
  console.log('Reading rushing.csv...')
  const rows = readCsv('rushing.csv')

  const headers = [
    'season', 'player', 'player_id', 'position', 'team_name', 'games',
    'attempts', 'yards', 'ypa', 'touchdowns',
    'yards_after_contact', 'yco_attempt',
    'avoided_tackles', 'elusive_rating',
    'breakaway_attempts', 'breakaway_percent',
    'first_downs', 'fumbles',
    'grades_run', 'grades_offense',
  ]

  const data = rows.map(r => [
    SEASON, r.player, r.player_id, r.position, r.team_name, r.player_game_count,
    r.attempts, r.yards, r.ypa, r.touchdowns,
    r.yards_after_contact, r.yco_attempt,
    r.avoided_tackles, r.elusive_rating,
    r.breakaway_attempts, r.breakaway_percent,
    r.first_downs, r.fumbles,
    r.grades_run, r.grades_offense,
  ])

  await mergeAndWrite(SHEET_TABS.PFF_RUSH, headers, data)
}

// ─── RECEIVING ───────────────────────────────────────────────────────────────
async function syncRec() {
  console.log('Reading receiving.csv...')
  const rows = readCsv('receiving.csv')

  const headers = [
    'season', 'player', 'player_id', 'position', 'team_name', 'games',
    'targets', 'receptions', 'caught_percent', 'yards', 'yards_per_reception',
    'yprr', 'avg_depth_of_target', 'touchdowns',
    'drops', 'drop_rate',
    'yards_after_catch_per_reception',
    'contested_receptions', 'contested_targets',
    'first_downs',
    'grades_pass_route', 'grades_offense',
  ]

  const data = rows.map(r => [
    SEASON, r.player, r.player_id, r.position, r.team_name, r.player_game_count,
    r.targets, r.receptions, r.caught_percent, r.yards, r.yards_per_reception,
    r.yprr, r.avg_depth_of_target, r.touchdowns,
    r.drops, r.drop_rate,
    r.yards_after_catch_per_reception,
    r.contested_receptions, r.contested_targets,
    r.first_downs,
    r.grades_pass_route, r.grades_offense,
  ])

  await mergeAndWrite(SHEET_TABS.PFF_REC, headers, data)
}

// ─── BLOCKING ────────────────────────────────────────────────────────────────
async function syncBlocking() {
  console.log('Reading blocking.csv...')
  const rows = readCsv('blocking.csv')

  const headers = [
    'season', 'player', 'player_id', 'position', 'team_name', 'games',
    'snap_counts_offense', 'snap_counts_pass_block', 'snap_counts_run_block',
    'grades_pass_block', 'grades_run_block', 'grades_offense',
    'pass_block_percent', 'pbe',
    'pressures_allowed', 'sacks_allowed', 'hurries_allowed', 'hits_allowed',
  ]

  const data = rows.map(r => [
    SEASON, r.player, r.player_id, r.position, r.team_name, r.player_game_count,
    r.snap_counts_offense, r.snap_counts_pass_block, r.snap_counts_run_block,
    r.grades_pass_block, r.grades_run_block, r.grades_offense,
    r.pass_block_percent, r.pbe,
    r.pressures_allowed, r.sacks_allowed, r.hurries_allowed, r.hits_allowed,
  ])

  await mergeAndWrite(SHEET_TABS.PFF_BLOCKING, headers, data)
}

// ─── DEFENSE ─────────────────────────────────────────────────────────────────
async function syncDefense() {
  console.log('Reading defense.csv...')
  const rows = readCsv('defense.csv')

  const headers = [
    'season', 'player', 'player_id', 'position', 'team_name', 'games',
    'snap_counts_defense',
    'tackles', 'assists', 'missed_tackles', 'missed_tackle_rate',
    'sacks', 'hits', 'hurries', 'total_pressures',
    'interceptions', 'pass_break_ups', 'forced_fumbles',
    'stops', 'tackles_for_loss',
    'grades_defense', 'grades_pass_rush_defense',
    'grades_coverage_defense', 'grades_run_defense', 'grades_tackle',
  ]

  const data = rows.map(r => [
    SEASON, r.player, r.player_id, r.position, r.team_name, r.player_game_count,
    r.snap_counts_defense,
    r.tackles, r.assists, r.missed_tackles, r.missed_tackle_rate,
    r.sacks, r.hits, r.hurries, r.total_pressures,
    r.interceptions, r.pass_break_ups, r.forced_fumbles,
    r.stops, r.tackles_for_loss,
    r.grades_defense, r.grades_pass_rush_defense,
    r.grades_coverage_defense, r.grades_run_defense, r.grades_tackle,
  ])

  await mergeAndWrite(SHEET_TABS.PFF_DEFENSE, headers, data)
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(PFF_DIR)) {
    fs.mkdirSync(PFF_DIR, { recursive: true })
    console.error(`Created public/pff/ — place your PFF CSV exports there:`)
    console.error(`  passing.csv, rushing.csv, receiving.csv, blocking.csv, defense.csv`)
    process.exit(1)
  }

  const start = Date.now()
  const errors: string[] = []

  for (const tab of TABS) {
    try {
      if      (tab === 'pff_qb')       await syncQB()
      else if (tab === 'pff_rush')     await syncRush()
      else if (tab === 'pff_rec')      await syncRec()
      else if (tab === 'pff_blocking') await syncBlocking()
      else if (tab === 'pff_defense')  await syncDefense()
      else console.warn(`  ⚠ Unknown tab: ${tab}`)
    } catch (err: any) {
      console.error(`  ✗ ${tab}: ${err.message}`)
      errors.push(`${tab}: ${err.message}`)
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\nDone in ${elapsed}s`)
  if (errors.length) { errors.forEach(e => console.error(`  - ${e}`)); process.exit(1) }
}

main()
