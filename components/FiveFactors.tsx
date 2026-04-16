'use client'
import { fmt, rankColor } from '@/lib/utils'

interface FiveFactorsProps {
  teamStats: Record<string, string | number> | null
  allStats: Record<string, string | number>[]
}

const FIVE_FACTORS = [
  { label: 'Success Rate',  offField: 'off_success_rate',    defField: 'def_success_rate',    defLowerBetter: true, pct: true },
  { label: 'Explosiveness', offField: 'off_explosiveness',   defField: 'def_explosiveness',   defLowerBetter: true },
  { label: 'Pts Per Opp.',  offField: 'off_points_per_opp',  defField: 'def_points_per_opp',  defLowerBetter: true },
  { label: 'Havoc',         offField: 'off_havoc_total',     defField: 'def_havoc_total',     offLowerBetter: true, pct: true },
  { label: 'Avg Field Pos', offField: 'off_field_pos_avg_pp',defField: 'def_field_pos_avg_pp',defLowerBetter: true },
]

function getRank(value: number, field: string, allStats: Record<string,string|number>[], lowerIsBetter: boolean) {
  const values = allStats.map(s => Number(s[field])).filter(v => !isNaN(v)).sort((a,b) => lowerIsBetter ? a-b : b-a)
  const idx = values.findIndex(v => Math.abs(v - value) < 0.000001)
  return { rank: idx === -1 ? values.length : idx + 1, total: values.length }
}

function RankBadge({ value, field, allStats, lowerIsBetter = false }: {
  value: number|null, field: string, allStats: Record<string,string|number>[], lowerIsBetter?: boolean
}) {
  if (value == null || isNaN(value)) return <td style={{color:'var(--an-muted)',textAlign:'right'}}>—</td>
  const { rank, total } = getRank(value, field, allStats, lowerIsBetter)
  const { bg, text } = rankColor((total - rank) / (total - 1), false)
  return (
    <td style={{textAlign:'right'}}>
      <span style={{display:'inline-block',minWidth:38,padding:'2px 6px',borderRadius:4,background:bg,color:text,fontWeight:600,fontSize:12,textAlign:'center'}}>
        {rank}
      </span>
    </td>
  )
}

export default function FiveFactors({ teamStats, allStats }: FiveFactorsProps) {
  return (
    <div className="card">
      <div className="card-header">Five Factors</div>
      <div style={{overflowX:'auto'}}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{textAlign:'left',minWidth:120}}>Stat</th>
              <th>Off.</th><th>Rank</th><th>Def.</th><th>Rank</th>
            </tr>
          </thead>
          <tbody>
            {FIVE_FACTORS.map(row => {
              const offVal = teamStats != null ? Number(teamStats[row.offField]) : null
              const defVal = teamStats != null ? Number(teamStats[row.defField]) : null
              const offOk = offVal != null && !isNaN(offVal)
              const defOk = defVal != null && !isNaN(defVal)
              return (
                <tr key={row.label}>
                  <td style={{textAlign:'left',color:'var(--an-muted)',fontSize:12}}>{row.label}</td>
                  <td style={{color:'var(--an-text)',textAlign:'right'}}>
                    {offOk ? (row.pct ? `${(offVal!*100).toFixed(1)}%` : fmt(offVal!)) : '—'}
                  </td>
                  <RankBadge value={offOk?offVal:null} field={row.offField} allStats={allStats} lowerIsBetter={row.offLowerBetter}/>
                  <td style={{color:'var(--an-text)',textAlign:'right'}}>
                    {defOk ? (row.pct ? `${(defVal!*100).toFixed(1)}%` : fmt(defVal!)) : '—'}
                  </td>
                  <RankBadge value={defOk?defVal:null} field={row.defField} allStats={allStats} lowerIsBetter={row.defLowerBetter}/>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
