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

export function ratingsToCfbd(team: string): string {
  return RATINGS_TO_CFBD[team] ?? team
}
