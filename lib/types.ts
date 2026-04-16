// Shape returned by /api/games (read from Google Sheets)
export interface CFBGame {
  id: number
  season: number
  week: number
  season_type: string
  start_date: string
  neutral_site: boolean
  conference_game: boolean
  home_team: string
  home_conference: string
  home_points: number | null
  home_post_win_prob: number | null
  away_team: string
  away_conference: string
  away_points: number | null
  away_post_win_prob: number | null
  completed: boolean
  spread: number | null
}

export interface PowerRating {
  team: string
  rating: number
}
