// Maps PFF team names (ALL CAPS abbreviations) → CFBD school names
// Passthrough teams just need .toLowerCase() + title-case treatment
const PFF_TO_CFBD: Record<string, string> = {
  "APP STATE":  "Appalachian State",
  "ARIZONA ST": "Arizona State",
  "ARK STATE":  "Arkansas State",
  "BALL ST":    "Ball State",
  "BOISE ST":   "Boise State",
  "BOSTON COL": "Boston College",
  "BOWL GREEN": "Bowling Green",
  "C MICHIGAN": "Central Michigan",
  "CAL":        "California",
  "COAST CAR":  "Coastal Carolina",
  "COLO STATE": "Colorado State",
  "DOMINION":   "Old Dominion",
  "E CAROLINA": "East Carolina",
  "E MICHIGAN": "Eastern Michigan",
  "FAU":        "Florida Atlantic",
  "FLORIDA ST": "Florida State",
  "FRESNO ST":  "Fresno State",
  "GA SOUTHRN": "Georgia Southern",
  "GA STATE":   "Georgia State",
  "GA TECH":    "Georgia Tech",
  "IOWA STATE": "Iowa State",
  "JAMES MAD":  "James Madison",
  "JVILLE ST":  "Jacksonville State",
  "KANSAS ST":  "Kansas State",
  "KENNESAW":   "Kennesaw State",
  "LA LAFAYET": "Louisiana",
  "LA MONROE":  "Louisiana Monroe",
  "LA TECH":    "Louisiana Tech",
  "MIAMI FL":   "Miami",
  "MIAMI OH":   "Miami (OH)",
  "MICH STATE": "Michigan State",
  "MIDDLE TN":  "Middle Tennessee",
  "MISS STATE": "Mississippi State",
  "MO STATE":   "Missouri State",
  "N CAROLINA": "North Carolina",
  "N ILLINOIS": "Northern Illinois",
  "N TEXAS":    "North Texas",
  "NEW MEX ST": "New Mexico State",
  "NEW MEXICO": "New Mexico",
  "NWESTERN":   "Northwestern",
  "OHIO STATE": "Ohio State",
  "OKLA STATE": "Oklahoma State",
  "OLE MISS":   "Ole Miss",
  "OREGON ST":  "Oregon State",
  "S ALABAMA":  "South Alabama",
  "S CAROLINA": "South Carolina",
  "S DIEGO ST": "San Diego State",
  "S JOSE ST":  "San Jose State",
  "SM HOUSTON": "Sam Houston",
  "SO MISS":    "Southern Miss",
  "TEXAS ST":   "Texas State",
  "TEXAS TECH": "Texas Tech",
  "UCONN":      "UConn",
  "UMASS":      "Massachusetts",
  "UTAH ST":    "Utah State",
  "VA TECH":    "Virginia Tech",
  "W KENTUCKY": "Western Kentucky",
  "W MICHIGAN": "Western Michigan",
  "W VIRGINIA": "West Virginia",
  "WAKE":       "Wake Forest",
  "WASH STATE": "Washington State",
  // keep these as-is (CFBD uses same abbreviation)
  "BYU":        "BYU",
  "FIU":        "FIU",
  "LSU":        "LSU",
  "NC STATE":   "NC State",
  "SMU":        "SMU",
  "TCU":        "TCU",
  "UAB":        "UAB",
  "UCF":        "UCF",
  "UCLA":       "UCLA",
  "UNLV":       "UNLV",
  "USC":        "USC",
  "USF":        "South Florida",
  "UTEP":       "UTEP",
  "UTSA":       "UTSA",
}

// Title-case a string: "OHIO STATE" → "Ohio State"
function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export function pffToCfbd(pffName: string): string {
  if (PFF_TO_CFBD[pffName] !== undefined) return PFF_TO_CFBD[pffName]
  return toTitleCase(pffName)
}

// Reverse map: CFBD name → PFF name (for filtering by selected team)
const CFBD_TO_PFF: Record<string, string> = {}
Object.entries(PFF_TO_CFBD).forEach(([pff, cfbd]) => { CFBD_TO_PFF[cfbd] = pff })

export function cfbdToPff(cfbdName: string): string {
  if (CFBD_TO_PFF[cfbdName] !== undefined) return CFBD_TO_PFF[cfbdName]
  return cfbdName.toUpperCase()
}
