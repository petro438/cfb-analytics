'use client'
import { CFBGame, PowerRating } from '@/lib/types'
import { projectedSpread, formatSpread } from '@/lib/utils'

interface ScheduleTableProps {
  games: CFBGame[]
  team: string
  powerRatings: PowerRating[]
  teamLogos: Record<string, string>   // school → logo URL
  onTeamClick?: (team: string) => void
}

function getAtsResult(game: CFBGame, team: string): string {
  if (!game.completed || game.home_points == null || game.away_points == null) return '—'
  const isHome = game.home_team === team
  const teamScore = isHome ? game.home_points : game.away_points
  const oppScore  = isHome ? game.away_points : game.home_points
  const spread = game.spread ?? 0
  const adjustedSpread = isHome ? spread : -spread
  const margin = teamScore - oppScore
  if (margin + adjustedSpread > 0) return 'W'
  if (margin + adjustedSpread < 0) return 'L'
  return 'P'
}

function getWinProb(game: CFBGame, team: string): number | null {
  const isHome = game.home_team === team
  const raw = isHome ? game.home_post_win_prob : game.away_post_win_prob
  if (raw == null || raw === '' as any) return null
  const n = Number(raw)
  return isNaN(n) ? null : n
}

const POSTSEASON_LABELS: Record<number, string> = {
  16: 'CFP QF',
  17: 'CFP SF',
  18: 'CFP Final',
}

export default function ScheduleTable({ games, team, powerRatings, teamLogos, onTeamClick }: ScheduleTableProps) {
  const ratingsMap = Object.fromEntries(powerRatings.map((r) => [r.team, r.rating]))

  const regularGames = games.filter(g => g.season_type === 'regular').sort((a, b) => a.week - b.week)
  const postGames    = games.filter(g => g.season_type === 'postseason').sort((a, b) => a.week - b.week)
  const allGames     = [...regularGames, ...postGames]

  return (
    <div className="card">
      <div className="card-header">Schedule & Results</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: 48 }}>Wk</th>
              <th style={{ textAlign: 'left' }}>Opponent</th>
              <th>Score</th>
              <th>Spread</th>
              <th>ATS</th>
              <th>Win Prob</th>
            </tr>
          </thead>
          <tbody>
            {allGames.map((game, idx) => {
              const isHome     = game.home_team === team
              const opponent   = isHome ? game.away_team : game.home_team
              const locationLabel = game.neutral_site ? 'vs.' : isHome ? 'vs.' : '@'
              const isPostseason  = game.season_type === 'postseason'
              const weekLabel     = isPostseason ? (POSTSEASON_LABELS[game.week] ?? 'Bowl') : String(game.week)
              const oppLogo       = teamLogos[opponent] ?? null

              // Spread
              const teamRating = ratingsMap[team]
              const oppRating  = ratingsMap[opponent]
              let spreadDisplay = '—'
              if (!game.completed && teamRating != null && oppRating != null) {
                const raw = isHome
                  ? projectedSpread(teamRating, oppRating, game.neutral_site)
                  : projectedSpread(oppRating, teamRating, game.neutral_site) * -1
                spreadDisplay = `${formatSpread(raw)} (proj)`
              } else if (game.spread != null) {
                const s = isHome ? game.spread : -game.spread
                spreadDisplay = formatSpread(s)
              }

              // Score
              const scoreDisplay =
                game.completed && game.home_points != null && game.away_points != null
                  ? isHome
                    ? `${game.home_points}–${game.away_points}`
                    : `${game.away_points}–${game.home_points}`
                  : null

              const teamWon =
                game.completed && game.home_points != null && game.away_points != null
                  ? isHome ? game.home_points > game.away_points : game.away_points > game.home_points
                  : null

              const atsResult = game.completed ? getAtsResult(game, team) : '—'
              const winProb   = getWinProb(game, team)
              const showDivider = isPostseason && idx > 0 && allGames[idx - 1].season_type === 'regular'

              return (
                <>
                  {showDivider && (
                    <tr key={`divider-${game.id}`}>
                      <td colSpan={6} style={{
                        padding: '4px 12px',
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--an-green)',
                        background: 'rgba(0,163,71,0.06)',
                        borderBottom: '1px solid var(--an-border)',
                      }}>
                        Postseason
                      </td>
                    </tr>
                  )}
                  <tr key={game.id}>
                    <td style={{ textAlign: 'center', color: 'var(--an-muted)', fontSize: 11 }}>
                      {weekLabel}
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {oppLogo
                          ? <img src={oppLogo} alt={opponent} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
                          : <div style={{ width: 20, height: 20, flexShrink: 0 }} />
                        }
                        <span style={{ color: 'var(--an-muted)', fontSize: 11, flexShrink: 0 }}>{locationLabel}</span>
                        {onTeamClick ? (
                          <button
                            onClick={() => onTeamClick(opponent)}
                            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--an-text)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--an-green)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--an-text)')}
                          >
                            {opponent}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--an-text)' }}>{opponent}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {scoreDisplay != null ? (
                        <span style={{ color: teamWon ? 'var(--an-green)' : '#dc2626', fontWeight: 600 }}>
                          {teamWon ? 'W' : 'L'} {scoreDisplay}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--an-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--an-muted)', fontSize: 12 }}>{spreadDisplay}</td>
                    <td>
                      {atsResult !== '—' ? (
                        <span style={{ color: atsResult === 'W' ? 'var(--an-green)' : atsResult === 'L' ? '#dc2626' : 'var(--an-muted)', fontWeight: 600 }}>
                          {atsResult}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--an-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--an-muted)' }}>
                      {winProb != null ? `${(winProb * 100).toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
