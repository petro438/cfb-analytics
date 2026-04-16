import { NextRequest, NextResponse } from 'next/server'
import { readSheet, SHEET_TABS } from '@/lib/sheets'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || '2025'

  try {
    const rows = await readSheet(SHEET_TABS.ADVANCED_STATS)
    const yearRows = rows.filter((r) => String(r.season) === year)

    // Parse numeric fields
    const parsed = yearRows.map((r) => {
      const out: Record<string, string | number> = { team: r.team, season: r.season, conference: r.conference }
      Object.entries(r).forEach(([k, v]) => {
        if (k !== 'team' && k !== 'season' && k !== 'conference') {
          out[k] = v !== '' ? Number(v) : 0
        }
      })
      return out
    })

    return NextResponse.json(parsed, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
