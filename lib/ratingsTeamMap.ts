// Team names in the power-ratings CSV that differ from CFBD's school names.
// Normalization happens at sync time, so everything downstream of the
// power_ratings tab works in CFBD names only.
export const RATINGS_TO_CFBD: Record<string, string> = {
  'Appalachian State': 'App State',
  'Miami Ohio': 'Miami (OH)',
  'San Jose State': 'San José State',   // CFBD spells it with an accent
  'ULM': 'UL Monroe',
  'UMass': 'Massachusetts',
}

// Teams in the ratings file that are not yet FBS in CFBD. Both join the FBS
// ranks in 2026, so their ratings are kept and simply go unmatched until the
// teams tab is synced for that season. Listed so the sync can stay quiet
// about them instead of reporting them as errors.
export const NOT_YET_FBS = new Set(['North Dakota State', 'Sacramento State'])

export function ratingsToCfbd(team: string): string {
  return RATINGS_TO_CFBD[team] ?? team
}
