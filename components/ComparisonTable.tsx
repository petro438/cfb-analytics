'use client'
import { StatRow } from '@/lib/statRows'
import { formatStatValue, rankColor, rankOf } from '@/lib/utils'

interface ComparisonTableProps {
  title: string
  rows: StatRow[]
  side: 'off' | 'def'
  teamA: string
  teamB: string
  statsA: Record<string, string | number> | null
  statsB: Record<string, string | number> | null
  allStats: Record<string, string | number>[]
  logoA?: string | null
  logoB?: string | null
}

interface Cell {
  value: number | null
  rank: number
  total: number
  percentile: number
}

function readCell(
  stats: Record<string, string | number> | null,
  field: string,
  allStats: Record<string, string | number>[],
  lowerIsBetter: boolean
): Cell {
  const raw = stats ? Number(stats[field]) : NaN
  if (stats == null || isNaN(raw)) return { value: null, rank: 0, total: 0, percentile: 0 }
  const { rank, total, percentile } = rankOf(raw, field, allStats, lowerIsBetter)
  return { value: raw, rank, total, percentile }
}

function RankBadge({ cell }: { cell: Cell }) {
  if (cell.value == null || cell.total === 0) {
    return <span style={{ color: 'var(--an-muted)' }}>—</span>
  }
  const { bg, text } = rankColor(cell.percentile, false)
  return (
    <span style={{
      display: 'inline-block',
      minWidth: 38,
      padding: '2px 6px',
      borderRadius: 4,
      background: bg,
      color: text,
      fontWeight: 600,
      fontSize: 12,
      textAlign: 'center',
    }}>
      {cell.rank}
    </span>
  )
}

function TeamHeader({ team, logo, align }: { team: string; logo?: string | null; align: 'left' | 'right' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      justifyContent: align === 'left' ? 'flex-start' : 'flex-end',
      flexDirection: align === 'left' ? 'row' : 'row-reverse',
    }}>
      {logo && <img src={logo} alt={team} style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0 }} />}
      <span style={{ whiteSpace: 'nowrap' }}>{team}</span>
    </div>
  )
}

export default function ComparisonTable({
  title, rows, side, teamA, teamB, statsA, statsB, allStats, logoA, logoB,
}: ComparisonTableProps) {
  const sideLabel = side === 'off' ? 'Offense' : 'Defense'

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>{title}</span>
        <span style={{ color: side === 'off' ? 'var(--an-green)' : 'var(--an-muted)' }}>{sideLabel}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: 70 }}><TeamHeader team={teamA} logo={logoA} align="left" /></th>
              <th style={{ textAlign: 'left', width: 46 }}>Rk</th>
              <th style={{ textAlign: 'center', minWidth: 110 }}>Stat</th>
              <th style={{ textAlign: 'right', width: 46 }}>Rk</th>
              <th style={{ textAlign: 'right', width: 70 }}><TeamHeader team={teamB} logo={logoB} align="right" /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const field = side === 'off' ? row.offField : row.defField
              const lowerIsBetter = Boolean(side === 'off' ? row.offLowerBetter : row.defLowerBetter)
              const a = readCell(statsA, field, allStats, lowerIsBetter)
              const b = readCell(statsB, field, allStats, lowerIsBetter)

              // Whoever ranks better gets the edge marker; ties get nothing
              const comparable = a.value != null && b.value != null && a.total > 0 && b.total > 0
              const aWins = comparable && a.rank < b.rank
              const bWins = comparable && b.rank < a.rank

              const winnerStyle = { fontWeight: 600, background: 'rgba(0,163,71,0.07)' } as const

              return (
                <tr key={row.label}>
                  <td style={{
                    textAlign: 'left',
                    color: 'var(--an-text)',
                    fontSize: 13,
                    fontVariantNumeric: 'tabular-nums',
                    ...(aWins ? winnerStyle : {}),
                  }}>
                    {a.value != null ? formatStatValue(a.value, row.pct, row.decimals) : '—'}
                  </td>
                  <td style={{ textAlign: 'left' }}><RankBadge cell={a} /></td>
                  <td style={{ textAlign: 'center', color: 'var(--an-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {row.label}
                  </td>
                  <td style={{ textAlign: 'right' }}><RankBadge cell={b} /></td>
                  <td style={{
                    textAlign: 'right',
                    color: 'var(--an-text)',
                    fontSize: 13,
                    fontVariantNumeric: 'tabular-nums',
                    ...(bWins ? winnerStyle : {}),
                  }}>
                    {b.value != null ? formatStatValue(b.value, row.pct, row.decimals) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
