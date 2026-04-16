import { NextRequest, NextResponse } from 'next/server'
import { readSheet, SHEET_TABS } from '@/lib/sheets'

export async function GET(_request: NextRequest) {
  try {
    const rows = await readSheet(SHEET_TABS.POWER_RATINGS)
    const ratings = rows.map((r) => ({
      team: r.team,
      rating: Number(r.rating),
    }))
    return NextResponse.json(ratings, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
