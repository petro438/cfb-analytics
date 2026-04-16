import { NextRequest, NextResponse } from 'next/server'
import { readSheet, SHEET_TABS } from '@/lib/sheets'

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
        home_points: r.home_points !== '' ? Number(r.home_points) : null,
        home_post_win_prob: r.home_post_win_prob !== '' ? Number(r.home_post_win_prob) : null,
        away_team: r.away_team,
        away_conference: r.away_conference,
        away_points: r.away_points !== '' ? Number(r.away_points) : null,
        away_post_win_prob: r.away_post_win_prob !== '' ? Number(r.away_post_win_prob) : null,
        completed: r.completed === '1',
        spread: r.spread !== '' ? Number(r.spread) : null,
      }))
      .sort((a, b) => a.week - b.week)

    return NextResponse.json(teamGames, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
