'use client'
import { useState, useMemo } from 'react'
import { rankColor } from '@/lib/utils'

interface ColDef {
  key: string
  label: string
  decimals?: number
  pct?: boolean        // multiply by 100 and show %
  isGrade?: boolean    // PFF grade 0-100, shade accordingly
  lowerBetter?: boolean
  width?: number
}

interface PlayerTableProps {
  title: string
  players: Record<string, string | number>[]
  cols: ColDef[]
  snapField?: string        // field name for snap count (for minimum filter)
  snapPctThreshold?: number // default 0.25 = bottom 25% filtered out
  defaultSort?: string
  defaultSortDir?: 'asc' | 'desc'
}

// Grade shading: 0-100 → green/yellow/red like PFF
function gradeColor(val: number): { bg: string; text: string } {
  if (val >= 75) return { bg: '#c8f0d8', text: '#064e22' }
  if (val >= 65) return { bg: '#e8f5e9', text: '#1b5e20' }
  if (val >= 55) return { bg: '#fff9e6', text: '#7b5800' }
  if (val >= 45) return { bg: '#fff3e0', text: '#8b4000' }
  return { bg: '#fde8e8', text: '#7f1d1d' }
}

function formatVal(val: number | string, col: ColDef): string {
  if (val === '' || val == null) return '—'
  const n = Number(val)
  if (isNaN(n)) return String(val)
  if (col.pct) return `${n.toFixed(1)}%`
  if (col.decimals !== undefined) return n.toFixed(col.decimals)
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export default function PlayerTable({
  title,
  players,
  cols,
  snapField,
  snapPctThreshold = 0.25,
  defaultSort,
  defaultSortDir = 'desc',
}: PlayerTableProps) {
  const [sortCol, setSortCol]   = useState(defaultSort ?? cols[1]?.key ?? '')
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>(defaultSortDir)

  // Compute snap threshold
  const snapThreshold = useMemo(() => {
    if (!snapField) return 0
    const vals = players.map(p => Number(p[snapField])).filter(v => !isNaN(v) && v > 0).sort((a, b) => a - b)
    if (!vals.length) return 0
    return vals[Math.floor(vals.length * snapPctThreshold)] ?? 0
  }, [players, snapField, snapPctThreshold])

  const filtered = useMemo(() =>
    snapField ? players.filter(p => Number(p[snapField]) >= snapThreshold) : players,
    [players, snapField, snapThreshold]
  )

  const sorted = useMemo(() => {
    if (!sortCol) return filtered
    return [...filtered].sort((a, b) => {
      const av = Number(a[sortCol])
      const bv = Number(b[sortCol])
      if (isNaN(av) || isNaN(bv)) return 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [filtered, sortCol, sortDir])

  // Precompute per-column value arrays for rank shading
  const colRanks = useMemo(() => {
    const out: Record<string, number[]> = {}
    cols.forEach(col => {
      if (col.isGrade) return
      out[col.key] = sorted.map(p => Number(p[col.key])).filter(v => !isNaN(v)).sort((a, b) => a - b)
    })
    return out
  }, [sorted, cols])

  function getPercentile(val: number, key: string, lowerBetter = false): number {
    const arr = colRanks[key]
    if (!arr || arr.length < 2) return 0.5
    const idx = arr.findIndex(v => Math.abs(v - val) < 0.0001)
    const p = idx === -1 ? 0.5 : idx / (arr.length - 1)
    return lowerBetter ? 1 - p : p
  }

  function handleSort(key: string) {
    if (sortCol === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortCol(key); setSortDir('desc') }
  }

  if (!players.length) {
    return (
      <div className="card">
        <div className="card-header">{title}</div>
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--an-muted)', fontSize: 13 }}>
          No data — upload PFF CSVs to <code style={{ background: 'var(--an-surface2)', padding: '1px 5px', borderRadius: 3 }}>public/pff/</code> and run <code style={{ background: 'var(--an-surface2)', padding: '1px 5px', borderRadius: 3 }}>npm run sync:pff</code>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{title}</span>
        <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--an-muted)' }}>
          {sorted.length} players{snapField ? ` · min ${snapThreshold} snaps` : ''}
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: 140 }}>Player</th>
              {cols.map(col => (
                <th
                  key={col.key}
                  style={{ cursor: 'pointer', userSelect: 'none', minWidth: col.width ?? 60 }}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortCol === col.key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <tr key={`${player.player}-${i}`}>
                <td style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 500, color: 'var(--an-text)', fontSize: 13 }}>{String(player.player)}</div>
                  {player.position && (
                    <div style={{ fontSize: 10, color: 'var(--an-muted)', marginTop: 1 }}>{String(player.position)}</div>
                  )}
                </td>
                {cols.map(col => {
                  const raw = player[col.key]
                  const n   = Number(raw)
                  const hasVal = raw !== '' && raw != null && !isNaN(n)

                  if (!hasVal) return <td key={col.key} style={{ color: 'var(--an-muted)' }}>—</td>

                  if (col.isGrade) {
                    const { bg, text } = gradeColor(n)
                    return (
                      <td key={col.key}>
                        <span style={{ display: 'inline-block', minWidth: 40, padding: '2px 6px', borderRadius: 4, background: bg, color: text, fontWeight: 600, fontSize: 12, textAlign: 'center' }}>
                          {n.toFixed(1)}
                        </span>
                      </td>
                    )
                  }

                  const percentile = getPercentile(n, col.key, col.lowerBetter)
                  const { bg, text } = rankColor(percentile, false)

                  return (
                    <td key={col.key}>
                      <span style={{ display: 'inline-block', minWidth: 40, padding: '2px 6px', borderRadius: 4, background: bg, color: text, fontWeight: 500, fontSize: 12, textAlign: 'center' }}>
                        {formatVal(raw, col)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
