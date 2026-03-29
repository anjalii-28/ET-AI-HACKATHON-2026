# Call Intelligence — ET AI Hackathon 2026

A full-stack **call analytics and operations** workspace: transcribe and structure call audio with Gemini, explore metrics in a React dashboard, sync with **Twenty CRM** and **Chatwoot**, and run a **Review Intelligence** service (Google Places + AI summaries).

**Repository:** public source code, this README (setup + architecture), and a **commit history** that reflects incremental feature work (pipeline → extraction → CRM → Chatwoot → reviews → dashboard → fixes).

---

## Features

| Area | What it does |
|------|----------------|
| **Audio / AI** | Batch-process call recordings; extract entities and structured JSON via Gemini (`extract_entities.py`, `process_audio_batch.py`). |
| **Dashboard** | Vite + React UI: calls, leads, tickets, feedback; proxies API routes to local services. |
| **Twenty CRM** | Embeds / links to Twenty for leads (`/app/leads`). |
| **Chatwoot** | In-app or new-tab conversation handling; configurable inbox URLs. |
| **Review Intelligence** | NestJS service: store reviews, Gemini-powered analysis, optional Google Places or scrape mode. |

---

## Repository layout

```
├── extract_entities.py          # Per-file entity extraction from audio → JSON
├── process_audio_batch.py       # Batch processing for a folder of recordings
├── requirements.txt             # Python dependencies
├── .env                         # Root: GEMINI_API_KEY (create locally; not committed)
├── output/                      # Generated call JSON (gitignored by default in places)
├── dashboard/                   # React app (Vite), basename /app/
├── reviews-service/             # NestJS + TypeORM + Postgres, prefix /reviews
└── nginx.conf                   # Example reverse-proxy layout (optional)
```

---

## Prerequisites

- **Node.js** 18+ and npm  
- **Python** 3.10+ (for transcription / extraction scripts)  
- **PostgreSQL** 14+ (for `reviews-service`)  
- API keys as needed: **Google AI (Gemini)**, optional **Google Places**, optional **Chatwoot**

---

## 1. Clone and Python (call processing)

```bash
git clone https://github.com/anjalii28/ET-AI-HACKATHON-2026.git
cd ET-AI-HACKATHON-2026

python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a **`.env`** file in the **repository root** (same folder as `extract_entities.py`):

```env
GEMINI_API_KEY=your_gemini_api_key
```

Place audio under `audio/` (or paths your scripts expect), then run either:

```bash
python extract_entities.py          # single-file / configured flow
python process_audio_batch.py     # batch folder → output/*.json
```

JSON artifacts are written under `output/` (ensure that path exists and matches your script configuration).

---

## 2. Reviews service (Review Intelligence)

```bash
cd reviews-service
cp .env.example .env
npm install
```

Edit **`.env`**:

| Variable | Purpose |
|----------|---------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Postgres. On macOS with local Postgres, `DB_USER` is often your OS username; password may be empty. Create the database if needed: `createdb <DB_NAME>`. |
| `GEMINI_API_KEY` | Required for AI review analysis and summaries. |
| `GOOGLE_PLACES_API_KEY` | Required when `REVIEWS_MODE=api`. |
| `REVIEWS_MODE` | `api` (Places API) or `scrape` (Playwright; install browsers once with `npx playwright install`). |
| `PORT` | Default **3003**. |
| `CHATWOOT_*` | Optional: push negative-review alerts to Chatwoot. |

Start the API:

```bash
npm run start:dev
```

Service listens at `http://localhost:3003` with global prefix **`/reviews`** (e.g. `GET http://localhost:3003/reviews/list?placeId=demo_hospital`).

---

## 3. Dashboard (frontend)

```bash
cd dashboard
npm install
```

Optional: create **`dashboard/.env.local`** for embedded apps (see `src/config.ts`):

```env
VITE_CHATWOOT_URL=http://localhost:3001
VITE_CHATWOOT_OPEN_URL=http://localhost:3001/app/accounts/1/inbox/1
# Optional second inbox tab:
# VITE_CHATWOOT_OPEN_URL_2=
VITE_TWENTY_URL=http://localhost:3002
```

Dev server (loads `output/` into `public/data` for call lists):

```bash
npm run dev
```

Open **http://localhost:5173/app/** (Vite `base` is `/app/`).

The dev server **proxies** `/reviews/*` → `http://127.0.0.1:3003` so Feedback / Review Intelligence works without nginx.

Production build:

```bash
npm run build
npm run preview
```

---

## 4. Running everything locally (minimal)

1. Postgres running; `reviews-service/.env` configured; `npm run start:dev` in `reviews-service/`.  
2. Root `.env` with `GEMINI_API_KEY` if you run Python processors.  
3. `npm run dev` in `dashboard/`.  
4. Use **Feedback** in the UI with the built-in demo place id **`demo_hospital`**, or a real Google Place ID when Places + keys are configured.

---

## Development journey

- Built a **transcription / Gemini** pipeline for call audio and JSON outputs.  
- Added **structured extraction** and priority/filter tooling for call metadata.  
- Integrated **Twenty CRM** for lead-oriented workflows in the dashboard.  
- Integrated **Chatwoot** for tickets and conversation handling (iframe / deep links).  
- Implemented **review intelligence** (ingestion, sentiment-style analysis, categorization).  
- Added **ops scripts** and nginx examples for routing and multi-service dev.  
- Hardened the **dashboard** (feedback UI, proxies, edge cases) and documentation.

---

## License

Use and modify for the hackathon / your team’s policy. Add a SPDX license file if you need a standard OSS license.
