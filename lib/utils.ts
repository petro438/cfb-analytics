// Returns a hex color interpolated from red → white → green based on percentile (0–1)
export function rankColor(
  percentile: number,
  lowerIsBetter = false
): { bg: string; text: string } {
  const p = lowerIsBetter ? 1 - percentile : percentile

  if (p >= 0.5) {
    // green range: white → green
    const t = (p - 0.5) * 2
    const r = Math.round(255 * (1 - t * 0.8))
    const g = Math.round(195 * t + 255 * (1 - t))
    const b = Math.round(255 * (1 - t * 0.85))
    return {
      bg: `rgb(${r},${g},${b})`,
      text: t > 0.5 ? '#064e22' : '#14532d',
    }
  } else {
    // red range: white → red
    const t = (0.5 - p) * 2
    const r = Math.round(255)
    const g = Math.round(255 * (1 - t * 0.67))
    const b = Math.round(255 * (1 - t * 0.67))
    return {
      bg: `rgb(${r},${g},${b})`,
      text: t > 0.5 ? '#7f1d1d' : '#991b1b',
    }
  }
}

// Compute rank percentiles for a field across all teams
// Returns a map of team → percentile (0–1, where 1 = best)
export function computePercentiles(
  teams: { Team: string; [key: string]: string | number }[],
  field: string
): Record<string, number> {
  const values = teams
    .map((t) => ({ team: t.Team, val: Number(t[field]) }))
    .filter((t) => !isNaN(t.val))
    .sort((a, b) => a.val - b.val)

  const result: Record<string, number> = {}
  values.forEach((item, i) => {
    result[item.team] = i / (values.length - 1)
  })
  return result
}

// Compute projected spread between two teams using power ratings
// Returns spread from home team's perspective (negative = home favored)
export function projectedSpread(
  homeRating: number,
  awayRating: number,
  neutralSite: boolean
): number {
  const hfa = neutralSite ? 0 : 2
  // spread = away - home - hfa  (negative means home favored)
  return parseFloat((awayRating - homeRating - hfa).toFixed(1))
}

export function formatSpread(spread: number): string {
  if (spread === 0) return 'PK'
  return spread > 0 ? `+${spread}` : `${spread}`
}

export function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null || isNaN(n as number)) return '—'
  return Number(n).toFixed(decimals)
}

// Rank a single value for a field across all teams.
// Returns 1-based rank, the number of teams with data, and a 0–1 percentile (1 = best).
export function rankOf(
  value: number,
  field: string,
  allStats: Record<string, string | number>[],
  lowerIsBetter = false
): { rank: number; total: number; percentile: number } {
  const values = allStats
    .map((s) => Number(s[field]))
    .filter((v) => !isNaN(v) && v !== 0)
    .sort((a, b) => (lowerIsBetter ? a - b : b - a))

  const total = values.length
  if (total === 0) return { rank: 0, total: 0, percentile: 0.5 }

  const idx = values.findIndex((v) => Math.abs(v - value) < 0.000001)
  const rank = idx === -1 ? total : idx + 1
  const percentile = total > 1 ? (total - rank) / (total - 1) : 0.5
  return { rank, total, percentile }
}

// Format a stat value as a percentage or fixed-decimal number
export function formatStatValue(n: number, pct = false, decimals = 2): string {
  if (n == null || isNaN(n)) return '—'
  return pct ? `${(n * 100).toFixed(1)}%` : fmt(n, decimals)
}
