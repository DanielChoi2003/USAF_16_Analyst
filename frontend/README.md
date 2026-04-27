# Analyst Copilot Frontend

The frontend is a Next.js 14 app for uploading JSON alert packages and viewing generated analyst reports.

## Current Routes

- `/`: simple home page that points users toward Upload, Results, and Kibana.
- `/upload`: main workflow. Upload a JSON file, trigger analysis, and list recent saved results.
- `/analysis/result`: report viewer. Usually opened with `?id=<result_id>`.
- `/analysis/index`: legacy analysis page retained for compatibility.

The primary user path is `/upload`.

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000/upload](http://localhost:3000/upload).

The frontend expects the backend at `http://localhost:3001`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run test
npm run coverage
```

## Structure

```text
frontend/
  src/app/
    page.tsx
    upload/page.tsx
    analysis/index/page.tsx
    analysis/result/page.tsx
  src/components/
    enrichment/
    events/
    layout/
    report/
    ui/
  src/lib/
    types.ts
    utils.ts
  src/styles/
    globals.css
```

## Current Backend Calls

`/upload` calls:

- `POST http://localhost:3001/misp-analyze`
- `POST http://localhost:3001/analyze`
- `GET http://localhost:3001/results`
- `GET http://localhost:3001/results/:id`

If MISP is unavailable, the backend should return a warning and continue to report generation.

## Notes For Next Work

- Move hard-coded backend URLs into an environment variable if the app will be deployed beyond local demo.
- Improve UI messaging so optional MISP failures read as warnings, not fatal analysis failures.
- Consider adding an Elasticsearch retrieval status panel to show whether the report used normalized events or raw upload fallback.
- Keep result parsing in `analysis/result/page.tsx` aligned with the report headings produced by `rag/fallback_report.py`.
