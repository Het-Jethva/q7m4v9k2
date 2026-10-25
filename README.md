# Northline

Northline replays the national wind forecast available at a January 2026 purchase decision cutoff and measures its error against Elexon actuals. It is a React and Python full-stack pilot for a UK utility's day-ahead purchasing team.

The app includes a forecast desk, explicit hindsight comparison, a quantitative accuracy lab, provenance, and CSV exports. The source data is real and bundled. No credentials or live Elexon connection are required to run the app.

[Open the deployed app](https://q7m4v9k2.vercel.app) · [Public repository](https://github.com/Het-Jethva/q7m4v9k2) · [Demo script](docs/DEMO_SCRIPT.md)

The interface uses shadcn/ui with the Radix Vega style, Tailwind CSS v4, and shared semantic theme tokens. Charts use the shadcn Recharts integration. Variable DM Sans is self-hosted. Preset `bInDwe3` supplies the green theme, neutral charts, and Tabler icons.

## Run with Docker

Install Docker with Compose, then run:

```sh
docker compose up --build
```

Open [the local application](http://localhost:8000). The same container serves React assets and the Python API. The container runs as a non-root user and exposes a health check at /api/health.

Stop it with:

```sh
docker compose down
```

## Run for development

Use Python 3.12 and Node.js 22.12 or newer. The bundled data is ready to use.

Create and install the Python environment:

```sh
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

On macOS or Linux, activate it with:

```sh
source .venv/bin/activate
```

Start the backend:

```sh
python -m pip install -r requirements-dev.txt
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

In a second terminal, install and start React:

```sh
npm ci
npm run dev
```

Open [the development frontend](http://localhost:5173). Vite proxies /api requests to Python on port 8000. For the production layout locally, run `npm run build` and open [the Python server](http://localhost:8000).

## Explore the pilot

1. Choose a **Purchase decision** date and **Decision cutoff** in **Forecast**.
2. Read the next-day delivery date, coverage, selected source issue, and interval table.
3. Enable **Show actuals** to reveal retrospective actuals and errors.
4. Open **Accuracy** to compare a decision-date range at the same cutoff.
5. Export the selected observations as CSV or open **Methodology** to inspect assumptions and provenance.

The initial decision date is January 15 and the initial cutoff is 09:00 Europe/London. The cutoff is an application assumption, not an asserted deadline for a particular auction. January purchase dates produce delivery dates from January 2 through February 1. MW and GW display switches do not alter the source values. CSV always uses MW.

## Verify the result

With the Python environment activated, run:

```sh
python -m pytest -q
npm run build
python scripts/verify_data.py
```

With a local server running, independently verify its replays against the original source responses:

```sh
python scripts/verify_data.py --base-url http://127.0.0.1:8000
```

Add `--live` to compare two retained source responses with fresh Elexon requests. Historical revisions can make that comparison fail. The default verification is fully offline.

The API tests cover forecast selection, inclusive cutoffs, missing forecasts, complete actual pairs, revisions, January boundaries, known metric values, pooled RMSE, CSV evidence, invalid parameters, unavailable snapshots, and production routing. The independent verifier checks 124 replays and 2,976 target hours at four cutoffs using the retained raw responses. See [the verification report](docs/data-verification.json) and [the browser checklist](docs/VERIFICATION.md).

## Understand the analysis

[The methodology](docs/METHODOLOGY.md) defines the selection rules, units, equations, coverage, and limits. [The architecture](docs/ARCHITECTURE.md) explains module ownership and the storage decision. [The API contract](docs/API_CONTRACT.md) lists endpoint shapes and parameters. Interactive API documentation is available at [/docs](http://localhost:8000/docs) on the local Python server.

At 09:00, the bundled sample contains 744 matched hours. MAE is 2,038.91 MW, RMSE is 2,504.76 MW, bias is +1,747.89 MW, and WAPE is 18.07%. At midnight, eligible forecast coverage falls to 682 of 744 hours. Missing forecasts remain unavailable rather than being filled with later updates.

Elexon's WINDFOR records are hourly. FUELHH WIND actuals are half-hourly. Northline treats each forecast as representative of the hour starting at startTime and compares it with the mean of both actual half-hours. This is an explicit alignment assumption. No source guarantee that the forecast is an hourly interval mean is asserted. Actuals are hindsight evidence and can be revised. Error metrics are descriptive in-sample summaries, not calibrated prediction intervals.

The dataset covers visible, operationally metered Great Britain wind generation. It is not a full renewable-generation portfolio or all UK wind. With no demand, positions, contracts, or prices, the app cannot calculate a customer's procurement volume or cost.

## Refresh the source snapshot

The downloader uses only public Elexon dataset APIs. To reproduce the current snapshot using retained responses, run:

```sh
python scripts/fetch_data.py
```

Existing raw response files are reused when their URL and hash match the existing manifest. Their original retrieval timestamps are preserved. A cached file without matching retrieval metadata is fetched again. To retrieve a fresh set into a new directory, run:

```sh
python scripts/fetch_data.py --output data-refresh
```

Review the new manifest and source revisions before replacing the bundled files. The app reads data/manifest.json and data/snapshot.json.gz. Preserve the matching data/raw directory, rerun verification and tests, then restart or redeploy. Runtime requests do not refresh data automatically.

## Repository layout

| Path | Purpose |
| --- | --- |
| frontend/main.tsx | React workspace, forecast, accuracy, and methodology. |
| frontend/components/ui | Generated shadcn/ui components. |
| frontend/styles.css | Shared theme tokens and responsive layouts. |
| scripts/check-ui.mjs | Rejects raw controls in the application UI. |
| frontend/api.ts | Runtime response schemas and request lifecycle. |
| frontend/styles.css | Responsive design tokens, layout, chart, and table styling. |
| backend/snapshot.py | Verified source loading and indexed publication histories. |
| backend/analysis.py | Pure replay, interval matching, and pooled metrics. |
| backend/app.py | FastAPI endpoints, CSV exports, and Docker static serving. |
| api/index.py | Vercel Python entry point. |
| data/manifest.json | Source request URLs, retrieval timestamps, counts, and hashes. |
| data/snapshot.json.gz | Normalized real forecast vintages and WIND actuals. |
| data/raw/ | All 64 compressed original source responses. |
| scripts/fetch_data.py | Repeatable source acquisition and normalization. |
| scripts/verify_data.py | Independent source and API replay verification. |
| tests/ | Python behavioral and API tests. |
| docs/ | Architecture, methodology, API contract, verification, and demo script. |
| Dockerfile, compose.yaml | Container build and local runtime. |
| vercel.json | Same-origin frontend and Python production routing. |
| PRODUCT.md, DESIGN.md | Product constraints and interface design system. |

## Deploy to Vercel

The project uses a Vite frontend and one Python function. No environment variables or paid database are required. Install the Vercel CLI, authenticate, and run `vercel --prod` from the repository root. The committed configuration builds React, includes backend and data files in the Python function, and routes /api requests to FastAPI.

Check /api/health, /api/replay, /api/accuracy, and a CSV download after deployment. Open the root URL in a private browser window to verify access without a Vercel account. The production URL is linked at the top of this README.

## Demo and submission

[The demo script](docs/DEMO_SCRIPT.md) contains a nine-minute customer and technical walkthrough. It includes screen actions and the actual bundled-snapshot findings. No video was created, as requested. The assignment requires the video before submission, so record and upload it separately. No submission form is sent by this project.

## Sources and AI disclosure

Data comes from [Elexon's WINDFOR stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream) and [FUELHH stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream). [Elexon's wind-generation explanation](https://bmrs.elexon.co.uk/wind-generation) provides source context and measurement limits. Retained Elexon data remains subject to its source terms.

AI assisted product interpretation, architecture comparison, implementation, testing, documentation, and this demo script. GPT-6.1 Sol was used for all delegated design, implementation, and review work. Source data was downloaded from Elexon rather than generated by AI. Synthetic observations exist only in automated test fixtures.
