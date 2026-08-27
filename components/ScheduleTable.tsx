'use client'
import { Fragment } from 'react'
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
  return isHome ? game.home_postgame_win_prob : game.away_postgame_win_prob
}

const POSTSEASON_LABELS: Record<number, string> = {
  16: 'CFP QF',
  17: 'CFP SF',
  18: 'CFP Final',
}

// A projection this many points better than the market is worth flagging
const EDGE_THRESHOLD = 1

// Used when a team has a rating but no HFACW value of its own
const DEFAULT_HFA = 2.5

export default function ScheduleTable({ games, team, powerRatings, teamLogos, onTeamClick }: ScheduleTableProps) {
  const ratingsMap = Object.fromEntries(powerRatings.map((r) => [r.team, r.rating]))
  const hfaMap = Object.fromEntries(powerRatings.map((r) => [r.team, r.hfa]))

  const regularGames = games.filter(g => g.season_type === 'regular').sort((a, b) => a.week - b.week)
  const postGames    = games.filter(g => g.season_type === 'postseason').sort((a, b) => a.week - b.week)
  const allGames     = [...regularGames, ...postGames]

  // The power_ratings tab is a manual upload and often covers only part of FBS,
  // so call out how much of this schedule it can actually project.
  const teamHasRating = ratingsMap[team] != null
  const unrated = allGames.filter(g => {
    const opponent = g.home_team === team ? g.away_team : g.home_team
    return ratingsMap[opponent] == null
  }).length

  return (
    <div className="card">
      <div className="card-header">Schedule &amp; Results</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: 48 }}>Wk</th>
              <th style={{ textAlign: 'left' }}>Opponent</th>
              <th>Score</th>
              <th title="Projected spread from power ratings">Proj</th>
              <th title="Market spread">Spread</th>
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

              // Projected spread from power ratings, always from the selected team's perspective
              const teamRating = ratingsMap[team]
              const oppRating  = ratingsMap[opponent]
              // Home-field edge belongs to whoever is hosting, and is dropped entirely
              // on neutral sites.
              const hostHfa = game.neutral_site
                ? 0
                : (isHome ? hfaMap[team] : hfaMap[opponent]) ?? DEFAULT_HFA
              const projSpread = teamRating != null && oppRating != null
                ? isHome
                  ? projectedSpread(teamRating, oppRating, hostHfa)
                  : projectedSpread(oppRating, teamRating, hostHfa) * -1
                : null

              // Market spread from the sheet, also from the selected team's perspective
              const marketSpread = game.spread != null
                ? (isHome ? game.spread : -game.spread)
                : null

              // Negative edge = we project the team stronger than the market does
              const edge = projSpread != null && marketSpread != null
                ? parseFloat((projSpread - marketSpread).toFixed(1))
                : null
              const edgeColor = edge == null || Math.abs(edge) < EDGE_THRESHOLD
                ? 'var(--an-muted)'
                : edge < 0 ? 'var(--an-green)' : '#dc2626'
              const edgeTitle = edge == null
                ? undefined
                : edge === 0
                  ? 'Projection matches the market'
                  : `${Math.abs(edge).toFixed(1)} pts ${edge < 0 ? `toward ${team}` : `toward ${opponent}`} vs. market`

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
                <Fragment key={game.id}>
                  {showDivider && (
                    <tr>
                      <td colSpan={7} style={{
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
                  <tr>
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
                    <td title={edgeTitle} style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                      {projSpread != null ? (
                        <span style={{ color: edgeColor, fontWeight: edge != null && Math.abs(edge) >= EDGE_THRESHOLD ? 600 : 400 }}>
                          {formatSpread(projSpread)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--an-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--an-muted)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                      {marketSpread != null ? formatSpread(marketSpread) : '—'}
                    </td>
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
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {(!teamHasRating || unrated > 0) && allGames.length > 0 && (
        <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--an-muted)', borderTop: '1px solid var(--an-border)' }}>
          {!teamHasRating
            ? <>No power rating for {team}, so the Proj column is empty. </>
            : <>No power rating for {unrated} of {allGames.length} opponents. </>}
          Add them to <code style={{ background: 'var(--an-surface2)', padding: '1px 5px', borderRadius: 4 }}>public/power-ratings.csv</code> and run{' '}
          <code style={{ background: 'var(--an-surface2)', padding: '1px 5px', borderRadius: 4 }}>npm run sync:ratings</code>.
        </div>
      )}
    </div>
  )
}
