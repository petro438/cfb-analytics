'use client'
import { formatStatValue, rankColor, rankOf } from '@/lib/utils'
import { FIVE_FACTORS_ROWS } from '@/lib/statRows'

interface FiveFactorsProps {
  teamStats: Record<string, string | number> | null
  allStats: Record<string, string | number>[]
}

function RankBadge({ value, field, allStats, lowerIsBetter = false }: {
  value: number|null, field: string, allStats: Record<string,string|number>[], lowerIsBetter?: boolean
}) {
  if (value == null || isNaN(value)) return <td style={{color:'var(--an-muted)',textAlign:'right'}}>—</td>
  const { rank, total, percentile } = rankOf(value, field, allStats, lowerIsBetter)
  if (total === 0) return <td style={{color:'var(--an-muted)',textAlign:'right'}}>—</td>
  const { bg, text } = rankColor(percentile, false)
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
            {FIVE_FACTORS_ROWS.map(row => {
              const offVal = teamStats != null ? Number(teamStats[row.offField]) : null
              const defVal = teamStats != null ? Number(teamStats[row.defField]) : null
              const offOk = offVal != null && !isNaN(offVal)
              const defOk = defVal != null && !isNaN(defVal)
              return (
                <tr key={row.label}>
                  <td style={{textAlign:'left',color:'var(--an-muted)',fontSize:12}}>{row.label}</td>
                  <td style={{color:'var(--an-text)',textAlign:'right'}}>
                    {offOk ? formatStatValue(offVal!, row.pct, row.decimals) : '—'}
                  </td>
                  <RankBadge value={offOk?offVal:null} field={row.offField} allStats={allStats} lowerIsBetter={row.offLowerBetter}/>
                  <td style={{color:'var(--an-text)',textAlign:'right'}}>
                    {defOk ? formatStatValue(defVal!, row.pct, row.decimals) : '—'}
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
