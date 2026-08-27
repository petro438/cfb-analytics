'use client'
import { StatRow } from '@/lib/statRows'
import { formatStatValue, rankColor, rankOf } from '@/lib/utils'

// One side of one team — the unit of comparison. Pairing an offense against a
// defense gives the matchup view; pairing like sides compares the teams directly.
export interface ColumnSpec {
  team: string
  side: 'off' | 'def'
  stats: Record<string, string | number> | null
  logo?: string | null
}

interface ComparisonTableProps {
  title: string
  rows: StatRow[]
  left: ColumnSpec
  right: ColumnSpec
  allStats: Record<string, string | number>[]
}

interface Cell {
  value: number | null
  rank: number
  total: number
  percentile: number
}

const EMPTY: Cell = { value: null, rank: 0, total: 0, percentile: 0 }

// Each side is ranked inside its own population — offenses against offenses,
// defenses against defenses — so the two ranks stay comparable across a matchup.
function readCell(col: ColumnSpec, row: StatRow, allStats: Record<string, string | number>[]): Cell {
  const field = col.side === 'off' ? row.offField : row.defField
  const lowerIsBetter = Boolean(col.side === 'off' ? row.offLowerBetter : row.defLowerBetter)
  const raw = col.stats ? Number(col.stats[field]) : NaN
  if (col.stats == null || isNaN(raw)) return EMPTY
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

function ColumnHeader({ col, align }: { col: ColumnSpec; align: 'left' | 'right' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      justifyContent: align === 'left' ? 'flex-start' : 'flex-end',
      flexDirection: align === 'left' ? 'row' : 'row-reverse',
    }}>
      {col.logo && <img src={col.logo} alt={col.team} style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0 }} />}
      <span style={{ whiteSpace: 'nowrap' }}>
        {col.team}{' '}
        <span style={{ color: col.side === 'off' ? 'var(--an-green)' : 'var(--an-muted)', fontWeight: 600 }}>
          {col.side === 'off' ? 'OFF' : 'DEF'}
        </span>
      </span>
    </div>
  )
}

export default function ComparisonTable({ title, rows, left, right, allStats }: ComparisonTableProps) {
  const matchup = left.side !== right.side
  const subtitle = matchup
    ? `${left.side === 'off' ? left.team : right.team} offense vs. ${left.side === 'off' ? right.team : left.team} defense`
    : left.side === 'off' ? 'Offense' : 'Defense'

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>{title}</span>
        <span style={{ color: 'var(--an-muted)', textTransform: 'none', letterSpacing: 0 }}>{subtitle}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: 70 }}><ColumnHeader col={left} align="left" /></th>
              <th style={{ textAlign: 'left', width: 46 }}>Rk</th>
              <th style={{ textAlign: 'center', minWidth: 110 }}>Stat</th>
              <th style={{ textAlign: 'right', width: 46 }}>Rk</th>
              <th style={{ textAlign: 'right', width: 70 }}><ColumnHeader col={right} align="right" /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const l = readCell(left, row, allStats)
              const r = readCell(right, row, allStats)

              // Whichever side ranks better within its own population has the edge.
              // Tendency stats (how often a team runs vs. passes) have no better or
              // worse direction, so no edge is claimed on those.
              const comparable = !row.neutral && l.value != null && r.value != null && l.total > 0 && r.total > 0
              const lWins = comparable && l.rank < r.rank
              const rWins = comparable && r.rank < l.rank
              const winner = { fontWeight: 600, background: 'rgba(0,163,71,0.07)' } as const

              return (
                <tr key={row.label}>
                  <td style={{
                    textAlign: 'left', color: 'var(--an-text)', fontSize: 13,
                    fontVariantNumeric: 'tabular-nums', ...(lWins ? winner : {}),
                  }}>
                    {l.value != null ? formatStatValue(l.value, row.pct, row.decimals) : '—'}
                  </td>
                  <td style={{ textAlign: 'left' }}><RankBadge cell={l} /></td>
                  <td style={{ textAlign: 'center', color: 'var(--an-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {row.label}
                  </td>
                  <td style={{ textAlign: 'right' }}><RankBadge cell={r} /></td>
                  <td style={{
                    textAlign: 'right', color: 'var(--an-text)', fontSize: 13,
                    fontVariantNumeric: 'tabular-nums', ...(rWins ? winner : {}),
                  }}>
                    {r.value != null ? formatStatValue(r.value, row.pct, row.decimals) : '—'}
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
