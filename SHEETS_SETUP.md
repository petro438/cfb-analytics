# Google Sheets Setup

One-time setup. Takes about 10 minutes.

---

## 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it something like **CFB Analytics Data**
3. Create four tabs (sheets) with exactly these names:
   - `games`
   - `advanced_stats`
   - `futures`
   - `power_ratings`
4. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_YOUR_SHEET_ID`**`/edit`

---

## 2. Create a Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one) — name it `cfb-analytics`
3. Enable the **Google Sheets API**:
   - Go to **APIs & Services → Library**
   - Search "Google Sheets API" → Enable
4. Create a Service Account:
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → Service Account**
   - Name: `cfb-analytics-sync`
   - Click through (no roles needed at project level)
5. Generate a JSON key:
   - Click on your new service account
   - Go to **Keys** tab → **Add Key → Create new key → JSON**
   - Download the JSON file — keep it safe, don't commit it

---

## 3. Share the Sheet with the Service Account

1. Open the JSON key file — find the `client_email` field (looks like `cfb-analytics-sync@your-project.iam.gserviceaccount.com`)
2. Open your Google Sheet
3. Click **Share** → paste that email → give it **Editor** access

---

## 4. Add credentials to .env.local

```bash
# .env.local

CFBD_API_KEY=your_key_from_collegefootballdata.com

GOOGLE_SHEET_ID=your_sheet_id_from_url

# Paste the entire contents of your service account JSON key file as one line:
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
```

To convert the JSON file to a single line for .env.local:
```bash
cat your-key-file.json | tr -d '\n'
```

---

## 5. Run the initial sync

```bash
# Make sure you're in the project directory with venv/node_modules set up
npx tsx scripts/sync-cfbd.ts --year=2025
```

You should see output like:
```
CFB Analytics Sync — 2025
Tabs: games, advanced_stats, power_ratings

Fetching games...
  ✓ games: wrote 847 rows
Fetching advanced stats...
  ✓ advanced_stats: wrote 134 rows
Reading power-ratings.csv...
  ✓ power_ratings: wrote 130 rows

Done in 4.2s
```

---

## 6. Add secrets to GitHub (for automated cron)

If you want daily auto-sync via GitHub Actions:

1. Go to your repo → **Settings → Secrets and variables → Actions**
2. Add three secrets:
   - `CFBD_API_KEY` — your CFBD key
   - `GOOGLE_SHEET_ID` — your sheet ID
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — the full JSON key contents

The workflow in `.github/workflows/sync.yml` will then run daily at 6am ET.
You can also trigger it manually from the **Actions** tab in GitHub.

---

## Updating power ratings

Power ratings come from `public/power-ratings.csv` — edit that file and re-run:

```bash
npx tsx scripts/sync-cfbd.ts --tabs=power_ratings
```

Only syncs that one tab, saves your other API calls.

---

## Syncing a specific tab only

```bash
npx tsx scripts/sync-cfbd.ts --tabs=games
npx tsx scripts/sync-cfbd.ts --tabs=advanced_stats
npx tsx scripts/sync-cfbd.ts --tabs=games,advanced_stats
```
