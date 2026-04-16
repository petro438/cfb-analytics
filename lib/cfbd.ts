const CFBD_BASE = 'https://api.collegefootballdata.com'

function getKey() {
  const key = process.env.CFBD_API_KEY
  if (!key) throw new Error('CFBD_API_KEY is not set')
  return key
}

async function cfbdFetch<T>(path: string): Promise<T> {
  const url = `${CFBD_BASE}${path}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getKey()}` },
  })
  if (!res.ok) {
    throw new Error(`CFBD ${path} → ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// API returns camelCase
export interface CFBDGame {
  id: number
  season: number
  week: number
  seasonType: string
  startDate: string
  neutralSite: boolean
  conferenceGame: boolean
  attendance: number | null
  homeTeam: string
  homeConference: string
  homePoints: number | null
  home_post_win_prob: number | null
  awayTeam: string
  awayConference: string
  awayPoints: number | null
  away_post_win_prob: number | null
  completed: boolean
  excitementIndex: number | null
}

export interface CFBDTeam {
  id: number
  school: string
  mascot: string
  abbreviation: string
  conference: string
  color?: string
  altColor?: string
  logos?: string[]
}

export interface CFBDAdvancedStats {
  season: number
  team: string
  conference: string
  offense: {
    plays: number
    drives: number
    ppa: number
    totalPPA: number
    successRate: number
    explosiveness: number
    powerSuccess: number
    stuffRate: number
    lineYards: number
    lineYardsTotal: number
    secondLevelYards: number
    secondLevelYardsTotal: number
    openFieldYards: number
    openFieldYardsTotal: number
    totalOpportunies: number
    pointsPerOpportunity: number
    fieldPosition: { averageStart: number; averagePredictedPoints: number }
    havoc: { total: number; frontSeven: number; db: number }
    standardDowns: { rate: number; ppa: number; successRate: number; explosiveness: number }
    passingDowns: { rate: number; ppa: number; successRate: number; explosiveness: number }
    rushingPlays: { rate: number; ppa: number; totalPPA: number; successRate: number; explosiveness: number }
    passingPlays: { rate: number; ppa: number; totalPPA: number; successRate: number; explosiveness: number }
  }
  defense: {
    plays: number
    drives: number
    ppa: number
    totalPPA: number
    successRate: number
    explosiveness: number
    powerSuccess: number
    stuffRate: number
    lineYards: number
    lineYardsTotal: number
    secondLevelYards: number
    secondLevelYardsTotal: number
    openFieldYards: number
    openFieldYardsTotal: number
    totalOpportunies: number
    pointsPerOpportunity: number
    fieldPosition: { averageStart: number; averagePredictedPoints: number }
    havoc: { total: number; frontSeven: number; db: number }
    standardDowns: { rate: number; ppa: number; successRate: number; explosiveness: number }
    passingDowns: { rate: number; ppa: number; successRate: number; explosiveness: number }
    rushingPlays: { rate: number; ppa: number; totalPPA: number; successRate: number; explosiveness: number }
    passingPlays: { rate: number; ppa: number; totalPPA: number; successRate: number; explosiveness: number }
  }
}

export interface CFBDLines {
  id: number
  homeTeam: string
  awayTeam: string
  week: number
  season: number
  lines: {
    provider: string
    spread: string
    formattedSpread: string
    overUnder: string
    homeMoneyline: number
    awayMoneyline: number
  }[]
}

export async function fetchGames(year: number): Promise<CFBDGame[]> {
  const [regular, postseason] = await Promise.all([
    cfbdFetch<CFBDGame[]>(`/games?year=${year}&seasonType=regular`),
    cfbdFetch<CFBDGame[]>(`/games?year=${year}&seasonType=postseason`).catch(() => [] as CFBDGame[]),
  ])
  return [...regular, ...postseason]
}

export async function fetchTeams(year: number): Promise<CFBDTeam[]> {
  return cfbdFetch<CFBDTeam[]>(`/teams/fbs?year=${year}`)
}

export async function fetchAdvancedStats(year: number): Promise<CFBDAdvancedStats[]> {
  return cfbdFetch<CFBDAdvancedStats[]>(`/stats/season/advanced?year=${year}`)
}

export async function fetchLines(year: number): Promise<CFBDLines[]> {
  return cfbdFetch<CFBDLines[]>(`/lines?year=${year}`)
}

export interface CFBDTeamFull {
  id: number
  school: string
  mascot: string | null
  abbreviation: string | null
  altName1: string | null
  altName2: string | null
  altName3: string | null
  classification: string | null
  conference: string | null
  division: string | null
  color: string | null
  altColor: string | null
  logos: string[] | null
  twitter: string | null
  location: {
    venueId: number | null
    name: string | null
    city: string | null
    state: string | null
    zip: string | null
    countryCode: string | null
    timezone: string | null
    latitude: number | null
    longitude: number | null
    elevation: number | null
    capacity: number | null
    yearConstructed: number | null
    grass: boolean | null
    dome: boolean | null
  } | null
}

export async function fetchTeamsFull(year: number): Promise<CFBDTeamFull[]> {
  return cfbdFetch<CFBDTeamFull[]>(`/teams/fbs?year=${year}`)
}
