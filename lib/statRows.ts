
export interface StatRow {
  label: string
  offField: string
  defField: string
  offLowerBetter?: boolean
  defLowerBetter?: boolean
  pct?: boolean
  decimals?: number
  // No better/worse direction (play-calling tendency, or a rate whose direction
  // differs by side). The matchup view claims no edge on these.
  neutral?: boolean
}

export const FIVE_FACTORS_ROWS: StatRow[] = [
  { label: 'Success Rate',  offField: 'off_success_rate',     defField: 'def_success_rate',     defLowerBetter: true, pct: true },
  { label: 'Explosiveness', offField: 'off_explosiveness',    defField: 'def_explosiveness',    defLowerBetter: true },
  { label: 'Pts Per Opp.',  offField: 'off_points_per_opp',   defField: 'def_points_per_opp',   defLowerBetter: true },
  { label: 'Havoc',         offField: 'off_havoc_total',      defField: 'def_havoc_total',      offLowerBetter: true, pct: true },
  // Both sides are higher-is-better here. For the defense that reads backwards at a
  // glance, but the value tracks where the defense forces opponents to start: the
  // top of the list is Miami / Indiana / Ohio State / Georgia, the bottom is UAB and
  // UMass, and it correlates negatively with def_ppa (-0.37), where lower ppa is the
  // better defense.
  { label: 'Avg Field Pos', offField: 'off_field_pos_avg_pp', defField: 'def_field_pos_avg_pp' },
]

export const PASSING_DOWNS_ROWS: StatRow[] = [
  {
    label: 'Rate',
    offField: 'off_pass_downs_rate',
    defField: 'def_pass_downs_rate',
    pct: true,
    neutral: true,
  },
  {
    label: 'PPA',
    offField: 'off_pass_downs_ppa',
    defField: 'def_pass_downs_ppa',
    defLowerBetter: true,
  },
  {
    label: 'Success Rate',
    offField: 'off_pass_downs_sr',
    defField: 'def_pass_downs_sr',
    defLowerBetter: true,
    pct: true,
  },
  {
    label: 'Explosiveness',
    offField: 'off_pass_downs_exp',
    defField: 'def_pass_downs_exp',
    defLowerBetter: true,
  },
]

export const RUSHING_PLAYS_ROWS: StatRow[] = [
  {
    label: 'Rate',
    offField: 'off_rush_rate',
    defField: 'def_rush_rate',
    pct: true,
    neutral: true,
  },
  {
    label: 'PPA',
    offField: 'off_rush_ppa',
    defField: 'def_rush_ppa',
    defLowerBetter: true,
  },
  {
    label: 'Success Rate',
    offField: 'off_rush_sr',
    defField: 'def_rush_sr',
    defLowerBetter: true,
    pct: true,
  },
  {
    label: 'Explosiveness',
    offField: 'off_rush_exp',
    defField: 'def_rush_exp',
    defLowerBetter: true,
  },
]

export const STANDARD_DOWNS_ROWS: StatRow[] = [
  {
    label: 'Rate',
    offField: 'off_std_downs_rate',
    defField: 'def_std_downs_rate',
    pct: true,
    neutral: true,
  },
  {
    label: 'PPA',
    offField: 'off_std_downs_ppa',
    defField: 'def_std_downs_ppa',
    defLowerBetter: true,
  },
  {
    label: 'Success Rate',
    offField: 'off_std_downs_sr',
    defField: 'def_std_downs_sr',
    defLowerBetter: true,
    pct: true,
  },
  {
    label: 'Explosiveness',
    offField: 'off_std_downs_exp',
    defField: 'def_std_downs_exp',
    defLowerBetter: true,
  },
]

export const PASSING_PLAYS_ROWS: StatRow[] = [
  {
    label: 'Rate',
    offField: 'off_pass_rate',
    defField: 'def_pass_rate',
    pct: true,
    neutral: true,
  },
  {
    label: 'PPA',
    offField: 'off_pass_ppa',
    defField: 'def_pass_ppa',
    defLowerBetter: true,
  },
  {
    label: 'Success Rate',
    offField: 'off_pass_sr',
    defField: 'def_pass_sr',
    defLowerBetter: true,
    pct: true,
  },
  {
    label: 'Explosiveness',
    offField: 'off_pass_exp',
    defField: 'def_pass_exp',
    defLowerBetter: true,
  },
]

// Every stat section, in dashboard order — used by the comparison view
export const STAT_SECTIONS: { title: string; rows: StatRow[] }[] = [
  { title: 'Five Factors',   rows: FIVE_FACTORS_ROWS },
  { title: 'Standard Downs', rows: STANDARD_DOWNS_ROWS },
  { title: 'Passing Downs',  rows: PASSING_DOWNS_ROWS },
  { title: 'Rushing Plays',  rows: RUSHING_PLAYS_ROWS },
  { title: 'Passing Plays',  rows: PASSING_PLAYS_ROWS },
]
