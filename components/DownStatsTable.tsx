'use client'
import { formatStatValue, rankColor, rankOf } from '@/lib/utils'
import { StatRow } from '@/lib/statRows'

interface DownStatsTableProps {
  title: string
  rows: StatRow[]
  teamStats: Record<string, string | number> | null
  allStats: Record<string, string | number>[]
}

function RankedCell({
  value,
  field,
  allStats,
  lowerIsBetter = false,
  pct = false,
  decimals = 2,
}: {
  value: number | null
  field: string
  allStats: Record<string, string | number>[]
  lowerIsBetter?: boolean
  pct?: boolean
  decimals?: number
}) {
  if (value == null || isNaN(value)) {
    return (
      <>
        <td style={{ color: 'var(--an-muted)', textAlign: 'right' }}>—</td>
        <td style={{ color: 'var(--an-muted)', textAlign: 'right' }}>—</td>
      </>
    )
  }

  const { rank, total, percentile } = rankOf(value, field, allStats, lowerIsBetter)
  const { bg, text } = rankColor(percentile, false)
  const display = formatStatValue(value, pct, decimals)

  if (total === 0) {
    return (
      <>
        <td style={{ color: 'var(--an-text)', textAlign: 'right' }}>{display}</td>
        <td style={{ color: 'var(--an-muted)', textAlign: 'right' }}>—</td>
      </>
    )
  }

  return (
    <>
      <td style={{ color: 'var(--an-text)', textAlign: 'right' }}>{display}</td>
      <td style={{ textAlign: 'right' }}>
        <span
          style={{
            display: 'inline-block',
            minWidth: 38,
            padding: '2px 6px',
            borderRadius: 4,
            background: bg,
            color: text,
            fontWeight: 600,
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          {rank}
        </span>
      </td>
    </>
  )
}

export default function DownStatsTable({
  title,
  rows,
  teamStats,
  allStats,
}: DownStatsTableProps) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: 140 }}>Stat</th>
              <th>Off.</th>
              <th>Rank</th>
              <th>Def.</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const offVal = teamStats ? Number(teamStats[row.offField]) : null
              const defVal = teamStats ? Number(teamStats[row.defField]) : null
              const offIsValid = offVal != null && !isNaN(offVal)
              const defIsValid = defVal != null && !isNaN(defVal)

              return (
                <tr key={row.label}>
                  <td style={{ textAlign: 'left', color: 'var(--an-muted)', fontSize: 12 }}>
                    {row.label}
                  </td>
                  <RankedCell
                    value={offIsValid ? offVal : null}
                    field={row.offField}
                    allStats={allStats}
                    lowerIsBetter={row.offLowerBetter}
                    pct={row.pct}
                    decimals={row.decimals}
                  />
                  <RankedCell
                    value={defIsValid ? defVal : null}
                    field={row.defField}
                    allStats={allStats}
                    lowerIsBetter={row.defLowerBetter}
                    pct={row.pct}
                    decimals={row.decimals}
                  />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
