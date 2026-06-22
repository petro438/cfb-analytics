import { google } from 'googleapis'

// Tab names inside your Google Sheet
export const SHEET_TABS = {
  GAMES: 'games',
  ADVANCED_STATS: 'advanced_stats',
  FUTURES: 'futures',
  POWER_RATINGS: 'power_ratings',
  TEAMS: 'teams',
  PFF_QB: 'pff_qb',
  PFF_RUSH: 'pff_rush',
  PFF_REC: 'pff_rec',
  PFF_BLOCKING: 'pff_block',
  PFF_DEFENSE: 'pff_defense',
} as const

// Build an authenticated Google Sheets client.
// Uses GOOGLE_SERVICE_ACCOUNT_JSON env var (stringified JSON of the service account key file).
export function getSheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set in .env.local')

  const credentials = JSON.parse(raw)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export function getSpreadsheetId() {
  const id = process.env.GOOGLE_SHEET_ID
  if (!id) throw new Error('GOOGLE_SHEET_ID is not set in .env.local')
  return id
}

// Read all rows from a tab. Returns array of objects keyed by header row.
export async function readSheet(tab: string): Promise<Record<string, string>[]> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: tab,
  })

  const rows = res.data.values ?? []
  if (rows.length < 2) return []

  const headers = rows[0].map(String)
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? ''
    })
    return obj
  })
}

// Write rows to a tab — clears existing data first, then writes header + rows.
export async function writeSheet(
  tab: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): Promise<void> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  // Clear existing content
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: tab,
  })

  // Write header + data rows
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [headers, ...rows],
    },
  })

  console.log(`  ✓ ${tab}: wrote ${rows.length} rows`)
}
