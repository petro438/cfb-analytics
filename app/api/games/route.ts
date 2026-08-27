import { NextRequest, NextResponse } from 'next/server'
import { readSheet, SHEET_TABS } from '@/lib/sheets'

// Sheet cells are always strings. Blank, missing, and non-numeric all mean "no value".
function num(v: string | undefined): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const team = searchParams.get('team')
  const year = searchParams.get('year') || '2025'

  if (!team) {
    return NextResponse.json({ error: 'team is required' }, { status: 400 })
  }

  try {
    const rows = await readSheet(SHEET_TABS.GAMES)

    const teamGames = rows
      .filter(
        (r) =>
          String(r.season) === year &&
          (r.home_team === team || r.away_team === team)
      )
      .map((r) => ({
        id: Number(r.game_id),
        season: Number(r.season),
        week: Number(r.week),
        season_type: r.season_type,
        start_date: r.start_date,
        neutral_site: r.neutral_site === '1',
        conference_game: r.conference_game === '1',
        home_team: r.home_team,
        home_conference: r.home_conference,
        home_points: num(r.home_points),
        home_postgame_win_prob: num(r.home_postgame_win_prob),
        away_team: r.away_team,
        away_conference: r.away_conference,
        away_points: num(r.away_points),
        away_postgame_win_prob: num(r.away_postgame_win_prob),
        completed: r.completed === '1',
        spread: num(r.spread),
      }))
      .sort((a, b) => a.week - b.week)

    return NextResponse.json(teamGames, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
