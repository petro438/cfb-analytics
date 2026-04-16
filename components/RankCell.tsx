'use client'
import { rankColor } from '@/lib/utils'

interface RankCellProps {
  rank: number
  total: number
  lowerIsBetter?: boolean
  className?: string
}

export default function RankCell({ rank, total, lowerIsBetter = false, className }: RankCellProps) {
  const percentile = 1 - (rank - 1) / (total - 1) // rank 1 = 100th percentile
  const { bg, text } = rankColor(percentile, lowerIsBetter)

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        minWidth: 38,
        padding: '2px 6px',
        borderRadius: 4,
        fontWeight: 600,
        fontSize: 13,
        textAlign: 'center',
        background: bg,
        color: text,
      }}
    >
      {rank}
    </span>
  )
}
