'use client'

import { useState, useEffect, useMemo } from 'react'
import NavBar from '@/components/NavBar'
import ComparisonTable, { ColumnSpec } from '@/components/ComparisonTable'
import { STAT_SECTIONS } from '@/lib/statRows'
import { PowerRating } from '@/lib/types'
import { formatSpread, projectedSpread } from '@/lib/utils'

// Mirrors the dashboard: 2026 shows the 2026 schedule but 2025 stats
const YEARS = ['2026', '2025', '2024', '2023', '2022']
const STATS_YEAR_FOR: Record<string, string> = { '2026': '2025' }
const DEFAULT_A = 'Penn State'
// Used when a team has a rating but no HFACW value of its own
const DEFAULT_HFA = 2.5
const DEFAULT_B = 'Ohio State'

type Venue = 'a' | 'neutral' | 'b'
// matchup: each team's offense against the other's defense (how a game actually plays out)
// head-to-head: the same side of the ball for both teams, offense next to offense
type View = 'matchup' | 'head2head'

interface CFBTeam {
  school: string
  mascot: string | null
  conference: string | null
  color: string | null
  logo: string | null
}

function TeamPicker({ label, value, teams, disabled, onChange }: {
  label: string
  value: string
  teams: CFBTeam[]
  disabled: boolean
  onChange: (team: string) => void
}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4}}>
      <label style={{fontSize:10,color:'var(--an-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{minWidth:200}}>
        {disabled
          ? <option>Loading…</option>
          : teams.map(t => <option key={t.school} value={t.school}>{t.school}</option>)
        }
      </select>
    </div>
  )
}

function TeamBanner({ team, meta, rating, align }: {
  team: string
  meta: CFBTeam | undefined
  rating: number | null
  align: 'left' | 'right'
}) {
  return (
    <div style={{
      display:'flex',
      alignItems:'center',
      gap:14,
      flex:1,
      minWidth:0,
      flexDirection: align === 'left' ? 'row' : 'row-reverse',
      textAlign: align === 'left' ? 'left' : 'right',
    }}>
      {meta?.logo
        ? <img src={meta.logo} alt={team} style={{width:52,height:52,objectFit:'contain',flexShrink:0}} />
        : <div style={{width:52,height:52,borderRadius:8,background:'var(--an-surface2)',border:'1px solid var(--an-border)',flexShrink:0}}/>
      }
      <div style={{minWidth:0}}>
        <div style={{fontSize:19,fontWeight:700,color:'var(--an-text)',lineHeight:1.15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{team}</div>
        <div style={{fontSize:12,color:'var(--an-muted)',marginTop:2}}>
          {meta?.conference ?? '—'}
          {rating != null && (
            <span style={{marginLeft:8}}>
              Rating <span style={{color:'var(--an-text)',fontWeight:600}}>{rating.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ComparePage() {
  const [year, setYear]                 = useState('2026')
  const [teamA, setTeamA]               = useState(DEFAULT_A)
  const [teamB, setTeamB]               = useState(DEFAULT_B)
  const [venue, setVenue]               = useState<Venue>('neutral')
  const [view, setView]                 = useState<View>('matchup')
  const [teams, setTeams]               = useState<CFBTeam[]>([])
  const [allStats, setAllStats]         = useState<Record<string,string|number>[]>([])
  const [powerRatings, setPowerRatings] = useState<PowerRating[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError]               = useState<string|null>(null)

  const statsYear = STATS_YEAR_FOR[year] ?? year

  // Prefill from ?a=&b=&year= — read directly off the URL so the page needs no Suspense boundary
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const a = params.get('a')
    const b = params.get('b')
    const y = params.get('year')
    if (y && YEARS.includes(y)) setYear(y)
    if (a) setTeamA(a)
    if (b) setTeamB(b)
  }, [])

  // Teams for the dropdowns (schedule year)
  useEffect(() => {
    let cancelled = false
    setLoadingTeams(true)
    fetch('/api/teams?year=' + year)
      .then(r => r.json())
      .then(data => {
        if (cancelled || !Array.isArray(data)) return
        setTeams(data)
        const has = (s: string) => data.some((t: CFBTeam) => t.school === s)
        setTeamA(prev => has(prev) ? prev : (data[0]?.school ?? DEFAULT_A))
        setTeamB(prev => has(prev) ? prev : (data[1]?.school ?? DEFAULT_B))
      })
      .catch(() => { if (!cancelled) setError('Failed to load teams') })
      .finally(() => { if (!cancelled) setLoadingTeams(false) })
    return () => { cancelled = true }
  }, [year])

  // Advanced stats for every team — needed for the rank shading
  useEffect(() => {
    let cancelled = false
    setLoadingStats(true)
    setAllStats([])
    fetch('/api/advanced-stats?year=' + statsYear)
      .then(r => r.json())
      .then(data => { if (!cancelled && Array.isArray(data)) setAllStats(data) })
      .catch(() => { if (!cancelled) setError('Failed to load stats') })
      .finally(() => { if (!cancelled) setLoadingStats(false) })
    return () => { cancelled = true }
  }, [statsYear])

  useEffect(() => {
    fetch('/api/power-ratings')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPowerRatings(data) })
      .catch(() => {})
  }, [])

  const statsA = useMemo(() => allStats.find(s => s.team === teamA) ?? null, [allStats, teamA])
  const statsB = useMemo(() => allStats.find(s => s.team === teamB) ?? null, [allStats, teamB])

  const metaA = teams.find(t => t.school === teamA)
  const metaB = teams.find(t => t.school === teamB)

  // The four units in play: each team's offense and defense
  const aOff: ColumnSpec = { team: teamA, side: 'off', stats: statsA, logo: metaA?.logo }
  const aDef: ColumnSpec = { team: teamA, side: 'def', stats: statsA, logo: metaA?.logo }
  const bOff: ColumnSpec = { team: teamB, side: 'off', stats: statsB, logo: metaB?.logo }
  const bDef: ColumnSpec = { team: teamB, side: 'def', stats: statsB, logo: metaB?.logo }

  const ratingsMap = useMemo(
    () => Object.fromEntries(powerRatings.map(r => [r.team, r.rating])),
    [powerRatings]
  )
  const hfaMap = useMemo(
    () => Object.fromEntries(powerRatings.map(r => [r.team, r.hfa])),
    [powerRatings]
  )
  const ratingA = ratingsMap[teamA] ?? null
  const ratingB = ratingsMap[teamB] ?? null

  // The host's own home-field edge, or none at a neutral site
  const hostHfa = venue === 'neutral'
    ? 0
    : (venue === 'a' ? hfaMap[teamA] : hfaMap[teamB]) ?? DEFAULT_HFA

  // Projected spread from team A's perspective, given who hosts
  const spreadA = ratingA != null && ratingB != null
    ? venue === 'b'
      ? projectedSpread(ratingB, ratingA, hostHfa) * -1
      : projectedSpread(ratingA, ratingB, hostHfa)
    : null

  const favorite = spreadA == null ? null : spreadA < 0 ? teamA : spreadA > 0 ? teamB : null
  const venueLabel = venue === 'a' ? `at ${teamA}` : venue === 'b' ? `at ${teamB}` : 'neutral site'

  const noStats = !loadingStats && allStats.length === 0
  const missingA = !loadingStats && allStats.length > 0 && statsA == null
  const missingB = !loadingStats && allStats.length > 0 && statsB == null

  return (
    <div style={{minHeight:'100vh',background:'var(--an-bg)'}}>
      <NavBar error={error} />

      {/* Filter bar */}
      <div style={{borderBottom:'1px solid var(--an-border)',background:'var(--an-surface)',padding:'12px 24px',display:'flex',alignItems:'flex-end',gap:16,flexWrap:'wrap'}}>
        <TeamPicker label="Team A" value={teamA} teams={teams} disabled={loadingTeams} onChange={setTeamA} />
        <button
          onClick={() => { setTeamA(teamB); setTeamB(teamA); setVenue(v => v === 'a' ? 'b' : v === 'b' ? 'a' : v) }}
          title="Swap teams"
          style={{
            alignSelf:'flex-end',height:35,padding:'0 12px',borderRadius:6,
            border:'1px solid var(--an-border)',background:'var(--an-surface)',
            color:'var(--an-muted)',cursor:'pointer',fontFamily:'inherit',fontSize:13,
          }}
        >
          ⇄
        </button>
        <TeamPicker label="Team B" value={teamB} teams={teams} disabled={loadingTeams} onChange={setTeamB} />
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{fontSize:10,color:'var(--an-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Season</label>
          <select value={year} onChange={e => setYear(e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{fontSize:10,color:'var(--an-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Site</label>
          <select value={venue} onChange={e => setVenue(e.target.value as Venue)}>
            <option value="a">{teamA} home</option>
            <option value="neutral">Neutral</option>
            <option value="b">{teamB} home</option>
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{fontSize:10,color:'var(--an-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>View</label>
          <div style={{display:'flex',gap:4}}>
            {([['matchup','Matchup'],['head2head','Head to head']] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                title={v === 'matchup'
                  ? 'Each offense against the other team\u2019s defense'
                  : 'Both offenses side by side, then both defenses'}
                style={{
                  padding:'7px 12px',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',
                  border:'1px solid var(--an-border)',
                  background: view === v ? 'var(--an-green)' : 'var(--an-surface)',
                  color: view === v ? '#fff' : 'var(--an-text)',
                  fontWeight: view === v ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {loadingStats && (
          <span style={{fontSize:12,color:'var(--an-muted)',marginLeft:8,alignSelf:'center'}}>Loading stats…</span>
        )}
      </div>

      <div style={{padding:'24px',maxWidth:1400,margin:'0 auto'}}>

        {/* Matchup header */}
        <div className="card" style={{padding:'20px 24px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
            <TeamBanner team={teamA} meta={metaA} rating={ratingA} align="left" />

            <div style={{textAlign:'center',flexShrink:0,minWidth:170}}>
              <div style={{fontSize:10,color:'var(--an-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
                Projected Spread
              </div>
              {spreadA != null ? (
                <>
                  <div style={{fontSize:26,fontWeight:700,color:'var(--an-text)',lineHeight:1.2,fontVariantNumeric:'tabular-nums'}}>
                    {formatSpread(spreadA)}
                  </div>
                  <div style={{fontSize:11,color:'var(--an-muted)'}}>
                    {favorite ? `${favorite} favored · ` : ''}{venueLabel}
                  </div>
                </>
              ) : (
                <div style={{fontSize:12,color:'var(--an-muted)',marginTop:6}}>
                  No power rating for {[ratingA == null ? teamA : null, ratingB == null ? teamB : null].filter(Boolean).join(' or ')}
                </div>
              )}
            </div>

            <TeamBanner team={teamB} meta={metaB} rating={ratingB} align="right" />
          </div>

          <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid var(--an-border)',fontSize:11,color:'var(--an-muted)'}}>
            Spread is from {teamA}&apos;s perspective. Ranks and shading are out of all FBS teams for the {statsYear} season
            {year !== statsYear && <> (stats for {year} are not final — showing {statsYear})</>}.
          </div>
        </div>

        {noStats && (
          <div className="card" style={{padding:40,textAlign:'center',color:'var(--an-muted)',marginBottom:20}}>
            No advanced stats for {statsYear} — run{' '}
            <code style={{background:'var(--an-surface2)',padding:'1px 6px',borderRadius:4,fontSize:11,color:'var(--an-text)'}}>npm run sync:stats</code>
          </div>
        )}
        {(missingA || missingB) && (
          <div style={{padding:'10px 14px',marginBottom:20,borderRadius:8,border:'1px solid var(--an-border)',background:'var(--an-surface)',fontSize:12,color:'#dc2626'}}>
            ⚠ No {statsYear} stats found for {missingA ? teamA : ''}{missingA && missingB ? ' and ' : ''}{missingB ? teamB : ''}
          </div>
        )}

        {/* Matchup: A's offense against B's defense, then B's offense against A's defense.
            Head-to-head: the same side of the ball for both teams. */}
        {STAT_SECTIONS.map(section => {
          const [left, right] = view === 'matchup'
            ? [[aOff, bDef], [bOff, aDef]]
            : [[aOff, bOff], [aDef, bDef]]
          return (
            <div key={section.title} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
              <ComparisonTable title={section.title} rows={section.rows}
                left={left[0]} right={left[1]} allStats={allStats} />
              <ComparisonTable title={section.title} rows={section.rows}
                left={right[0]} right={right[1]} allStats={allStats} />
            </div>
          )
        })}

      </div>
    </div>
  )
}
