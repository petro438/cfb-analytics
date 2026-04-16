import { NextRequest, NextResponse } from 'next/server'
import { readSheet, SHEET_TABS } from '@/lib/sheets'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || '2025'

  try {
    // Try the dedicated teams tab first
    let teamsFromSheet: Record<string, string>[] = []
    try {
      teamsFromSheet = await readSheet(SHEET_TABS.TEAMS)
    } catch {
      // teams tab not yet synced — fall through to games-derived list
    }

    if (teamsFromSheet.length > 0) {
      const teams = teamsFromSheet
        .filter((r) => r.school)
        .map((r) => ({
          school: r.school,
          mascot: r.mascot || null,
          abbreviation: r.abbreviation || null,
          classification: r.classification || null,
          conference: r.conference || null,
          division: r.division || null,
          color: r.color || null,
          altColor: r.alt_color || null,
          logo: r.logo || null,
          logoDark: r.logo_dark || null,
          twitter: r.twitter || null,
          city: r.city || null,
          state: r.state || null,
          capacity: r.capacity !== '' ? Number(r.capacity) : null,
          grass: r.grass !== '' ? r.grass === '1' : null,
          dome: r.dome !== '' ? r.dome === '1' : null,
          latitude: r.latitude !== '' ? Number(r.latitude) : null,
          longitude: r.longitude !== '' ? Number(r.longitude) : null,
        }))
        .sort((a, b) => a.school.localeCompare(b.school))

      return NextResponse.json(teams, {
        headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=172800' },
      })
    }

    // Fallback: derive team list from games tab
    const gameRows = await readSheet(SHEET_TABS.GAMES)
    const yearRows = gameRows.filter((r) => String(r.season) === year)
    const teamSet = new Set<string>()
    yearRows.forEach((r) => {
      if (r.home_team) teamSet.add(r.home_team)
      if (r.away_team) teamSet.add(r.away_team)
    })

    const fallbackTeams = Array.from(teamSet)
      .sort()
      .map((school) => ({ school, mascot: null, abbreviation: null, classification: null, conference: null, division: null, color: null, altColor: null, logo: null, logoDark: null, twitter: null, city: null, state: null, capacity: null, grass: null, dome: null, latitude: null, longitude: null }))

    return NextResponse.json(fallbackTeams, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
