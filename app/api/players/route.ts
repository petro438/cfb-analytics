import { NextRequest, NextResponse } from 'next/server'
import { readSheet, SHEET_TABS } from '@/lib/sheets'
import { cfbdToPff } from '@/lib/pffTeamMap'

const TAB_MAP: Record<string, string> = {
  qb:       SHEET_TABS.PFF_QB,
  rush:     SHEET_TABS.PFF_RUSH,
  rec:      SHEET_TABS.PFF_REC,
  blocking: SHEET_TABS.PFF_BLOCKING,
  defense:  SHEET_TABS.PFF_DEFENSE,
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type   = searchParams.get('type') ?? 'qb'
  const team   = searchParams.get('team') ?? ''
  const season = searchParams.get('season') ?? '2025'

  const tab = TAB_MAP[type]
  if (!tab) return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })

  try {
    const rows = await readSheet(tab)

    // Convert CFBD team name → PFF team name for filtering
    const pffTeam = cfbdToPff(team)

    const filtered = rows
      .filter(r => {
        if (r.season && String(r.season) !== season) return false
        if (team && r.team_name !== pffTeam) return false
        return true
      })
      .map(r => {
        // Parse numeric fields
        const out: Record<string, string | number> = {}
        Object.entries(r).forEach(([k, v]) => {
          if (k === 'player' || k === 'position' || k === 'team_name') {
            out[k] = v
          } else {
            const n = Number(v)
            out[k] = v === '' || isNaN(n) ? v : n
          }
        })
        return out
      })

    return NextResponse.json(filtered, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
