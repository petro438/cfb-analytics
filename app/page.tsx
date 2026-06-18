'use client'

import { useState, useEffect } from 'react'
import { CFBGame, PowerRating } from '@/lib/types'
import ScheduleTable from '@/components/ScheduleTable'
import FiveFactors from '@/components/FiveFactors'
import DownStatsTable from '@/components/DownStatsTable'
import {
  PASSING_DOWNS_ROWS,
  RUSHING_PLAYS_ROWS,
  STANDARD_DOWNS_ROWS,
  PASSING_PLAYS_ROWS,
} from '@/lib/statRows'

// 2026 shows schedule from 2026 but stats from 2025
const YEARS = ['2026', '2025', '2024', '2023', '2022']
const STATS_YEAR_FOR: Record<string, string> = { '2026': '2025' }
const DEFAULT_TEAM = 'Penn State'

interface CFBTeam {
  school: string
  mascot: string | null
  conference: string | null
  color: string | null
  logo: string | null
}

export default function DashboardPage() {
  const [year, setYear]                 = useState('2025')
  const [team, setTeam]                 = useState(DEFAULT_TEAM)
  const [teams, setTeams]               = useState<CFBTeam[]>([])
  const [games, setGames]               = useState<CFBGame[]>([])
  const [allStats, setAllStats]         = useState<Record<string,string|number>[]>([])
  const [powerRatings, setPowerRatings] = useState<PowerRating[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingGames, setLoadingGames] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError]               = useState<string|null>(null)

  // For 2026, stats come from 2025
  const statsYear = STATS_YEAR_FOR[year] ?? year

  const teamStats = allStats.find(s => s.team === team) ?? null
  const yearStats = allStats
  const noData    = !loadingStats && yearStats.length === 0

  // Team logos map: school → logo URL (built from teams list)
  const teamLogos: Record<string, string> = {}
  teams.forEach(t => { if (t.logo) teamLogos[t.school] = t.logo })

  // Load teams (always from the schedule year for the dropdown)
  useEffect(() => {
    setLoadingTeams(true)
    fetch('/api/teams?year=' + year)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTeams(data)
          setTeam(prev => data.find((t: CFBTeam) => t.school === prev) ? prev : (data[0]?.school ?? DEFAULT_TEAM))
        }
      })
      .catch(() => setError('Failed to load teams'))
      .finally(() => setLoadingTeams(false))
  }, [year])

  // Load games for the selected schedule year
  useEffect(() => {
    if (!team) return
    setLoadingGames(true)
    setGames([])
    fetch('/api/games?team=' + encodeURIComponent(team) + '&year=' + year)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGames(data) })
      .catch(() => setError('Failed to load games'))
      .finally(() => setLoadingGames(false))
  }, [team, year])

  // Load advanced stats — use statsYear (2025 when viewing 2026)
  useEffect(() => {
    setLoadingStats(true)
    setAllStats([])
    fetch('/api/advanced-stats?year=' + statsYear)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllStats(data) })
      .catch(() => {})
      .finally(() => setLoadingStats(false))
  }, [statsYear])

  // Load power ratings
  useEffect(() => {
    fetch('/api/power-ratings')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPowerRatings(data) })
      .catch(() => {})
  }, [])

  const td = teams.find(t => t.school === team)
  const isFutureYear = year === '2026'

  return (
    <div style={{minHeight:'100vh',background:'var(--an-bg)'}}>

      {/* Nav */}
      <div style={{borderBottom:'1px solid var(--an-border)',background:'var(--an-surface)',padding:'0 24px',display:'flex',alignItems:'center',height:52,gap:24}}>
        <span style={{color:'var(--an-green)',fontWeight:700,fontSize:15,letterSpacing:'0.02em'}}>CFB Analytics</span>
        <span style={{color:'var(--an-border)',fontSize:18}}>|</span>
        <span style={{color:'var(--an-muted)',fontSize:12}}>Action Network Internal</span>
        {error && <span style={{color:'#dc2626',fontSize:12,marginLeft:'auto'}}>⚠ {error}</span>}
      </div>

      {/* Filter bar */}
      <div style={{borderBottom:'1px solid var(--an-border)',background:'var(--an-surface)',padding:'12px 24px',display:'flex',alignItems:'flex-end',gap:16,flexWrap:'wrap'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{fontSize:10,color:'var(--an-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Team</label>
          <select value={team} onChange={e => setTeam(e.target.value)} disabled={loadingTeams} style={{minWidth:200}}>
            {loadingTeams
              ? <option>Loading…</option>
              : teams.map(t => <option key={t.school} value={t.school}>{t.school}</option>)
            }
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{fontSize:10,color:'var(--an-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Season</label>
          <select value={year} onChange={e => setYear(e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {loadingStats && (
          <span style={{fontSize:12,color:'var(--an-muted)',marginLeft:8,alignSelf:'center'}}>Loading stats…</span>
        )}
      </div>

      {/* Content */}
      <div style={{padding:'24px',maxWidth:1400,margin:'0 auto'}}>

        {/* Team header */}
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24,paddingBottom:20,borderBottom:'1px solid var(--an-border)'}}>
          {td?.logo
            ? <img src={td.logo} alt={team} style={{width:64,height:64,objectFit:'contain',flexShrink:0}} />
            : <div style={{width:64,height:64,borderRadius:8,background:'var(--an-surface2)',border:'1px solid var(--an-border)',flexShrink:0}}/>
          }
          {td?.color && (
            <div style={{width:4,height:52,borderRadius:2,background:'#'+td.color.replace('#',''),flexShrink:0}}/>
          )}
          <div>
            <h1 style={{fontSize:24,fontWeight:700,color:'var(--an-text)',lineHeight:1.1}}>{team}</h1>
            <div style={{fontSize:12,color:'var(--an-muted)',marginTop:4}}>
              {td?.conference ?? ''}{td?.conference ? ' · ' : ''}
              {isFutureYear
                ? <span>{year} Schedule · <span style={{color:'var(--an-muted)'}}>Stats from {statsYear}</span></span>
                : <span>{year} Season</span>
              }
              {teamStats
                ? <span style={{marginLeft:10,color:'var(--an-green)'}}>● Stats loaded</span>
                : noData
                  ? <span style={{marginLeft:10,color:'#dc2626'}}>● Run sync script to populate data</span>
                  : null
              }
            </div>
          </div>
          {isFutureYear && (
            <div style={{marginLeft:'auto',padding:'4px 10px',borderRadius:6,background:'rgba(0,163,71,0.1)',border:'1px solid rgba(0,163,71,0.25)',fontSize:11,color:'var(--an-green)',fontWeight:600}}>
              2026 PREVIEW
            </div>
          )}
        </div>

        {/* Row 1: Schedule + Five Factors */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          <div>
            {loadingGames ? (
              <div className="card" style={{padding:40,textAlign:'center',color:'var(--an-muted)'}}>Loading schedule…</div>
            ) : games.length > 0 ? (
              <ScheduleTable
                games={games}
                team={team}
                powerRatings={powerRatings}
                teamLogos={teamLogos}
                onTeamClick={setTeam}
              />
            ) : (
              <div className="card" style={{padding:40,textAlign:'center',color:'var(--an-muted)'}}>
                No schedule data — run <code style={{background:'var(--an-surface2)',padding:'1px 6px',borderRadius:4,fontSize:11,color:'var(--an-text)'}}>npm run sync:games</code>
              </div>
            )}
          </div>
          <div>
            <FiveFactors teamStats={teamStats} allStats={yearStats} />
            {isFutureYear && yearStats.length > 0 && (
              <div style={{marginTop:8,fontSize:11,color:'var(--an-muted)',textAlign:'right'}}>
                Stats shown are from {statsYear} season
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Standard Downs + Passing Downs */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          <DownStatsTable title="Standard Downs" rows={STANDARD_DOWNS_ROWS} teamStats={teamStats} allStats={yearStats} />
          <DownStatsTable title="Passing Downs"  rows={PASSING_DOWNS_ROWS}  teamStats={teamStats} allStats={yearStats} />
        </div>

        {/* Row 3: Rushing Plays + Passing Plays */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          <DownStatsTable title="Rushing Plays" rows={RUSHING_PLAYS_ROWS} teamStats={teamStats} allStats={yearStats} />
          <DownStatsTable title="Passing Plays" rows={PASSING_PLAYS_ROWS} teamStats={teamStats} allStats={yearStats} />
        </div>

        {/* Futures placeholder */}
        <div style={{padding:'16px 20px',border:'1px dashed var(--an-border)',borderRadius:8,color:'var(--an-muted)',fontSize:12,textAlign:'center'}}>
          Futures Odds Board — coming next (AN CORE API integration)
        </div>

      </div>
    </div>
  )
}
